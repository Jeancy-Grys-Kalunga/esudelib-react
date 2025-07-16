<?php

namespace Modules\Jury\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;

class JuryDashboardController extends Controller
{
    public function index(Request $request)
    {
        $context = $request->session()->get('jury_context');

        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        // Situation des dépôts de cotes
        $courses = Course::withCount([
            'notes as submitted_notes' => function ($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id'])
                    ->where('is_submitted', true);
            }
        ])
            ->addSelect([
                'total_students' => \DB::table('course_student')
                    ->selectRaw('COUNT(DISTINCT student_id)')
                    ->whereColumn('course_id', 'courses.id')
                    ->whereExists(function ($query) use ($context) {
                        $query->select(\DB::raw(1))
                            ->from('notes')
                            ->whereColumn('notes.student_id', 'course_student.student_id')
                            ->where('notes.academic_year_id', $context['academic_year_id'])
                            ->where('notes.promotion_id', $context['promotion_id']);
                    })
            ])
            ->get();

        $courses = $courses->map(function ($course) {
            $course->pending_notes = $course->total_students - $course->submitted_notes;
            return $course;
        });

        // Situation de réussite
        $successRates = Note::selectRaw('
            course_id,
            COUNT(*) as total,
            SUM(CASE WHEN cote >= 10 THEN 1 ELSE 0 END) as passed,
            SUM(CASE WHEN cote < 10 THEN 1 ELSE 0 END) as failed
        ')
            ->where('academic_year_id', $context['academic_year_id'])
            ->where('promotion_id', $context['promotion_id']) // Correction
            ->groupBy('course_id')
            ->with('course')
            ->get()
            ->map(function ($item) {
                $item->success_rate = $item->total > 0 ? round(($item->passed / $item->total) * 100, 2) : 0;
                $item->failure_rate = $item->total > 0 ? round(($item->failed / $item->total) * 100, 2) : 0;
                return $item;
            });

        return Inertia::render('jury/dashboard', [
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'courses' => $courses,
            'successRates' => $successRates
        ]);
    }
}
