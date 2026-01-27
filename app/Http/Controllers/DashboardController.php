<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Department;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;
use App\Models\User;

class DashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('Etudiant')) {
            $student = Student::where('user_id', $user->id)->first();

            $stats = [
                'courses_count' => 0,
                'average_note' => 0,
                'credits_validated' => 0,
                'recent_notes' => []
            ];

            if ($student) {
                $stats['courses_count'] = $student->courses()->count();
                // Logic for average note: fetch notes and average 'cote'
                // This is a simplification. Real logic might need coefficient etc.
                $notes = $student->notes;
                if ($notes->count() > 0) {
                    $stats['average_note'] = round($notes->avg('cote'), 2);
                }

                // Fetch recent notes with course names
                $stats['recent_notes'] = $student->notes()
                    ->with('course')
                    ->latest()
                    ->take(5)
                    ->get()
                    ->map(function ($note) {
                        return [
                            'course' => $note->course->title ?? 'Cours Inconnu',
                            'cote' => $note->cote,
                            'date' => $note->created_at->format('d/m/Y')
                        ];
                    });
            }

            return Inertia::render('dashboard/student', [
                'stats' => $stats
            ]);
        }

        if ($user->hasRole('Enseignant')) {
            $teacher = Teacher::where('user_id', $user->id)->first();

            $stats = [
                'courses_count' => 0,
                'students_count' => 0,
                'pending_grades' => 0, // Placeholder
            ];

            if ($teacher) {
                $stats['courses_count'] = $teacher->courses()->count();
                // Count unique students across all assigned courses
                $stats['students_count'] = $teacher->courses()
                    ->withCount('students')
                    ->get()
                    ->sum('students_count');
            }

            return Inertia::render('dashboard/teacher', [
                'stats' => $stats
            ]);
        }

        if ($user->hasRole(['Super Admin', 'Admin'])) {
            $stats = [
                'users_count' => User::count(),
                'institutions_count' => Institution::count(),
                'departments_count' => Department::count(),
                'courses_count' => Course::count(),
                'programs_count' => \Modules\Institution\Entities\Program::count(),
                'students_count' => Student::count(),
            ];

            return Inertia::render('dashboard/admin', [
                'stats' => $stats
            ]);
        }

        // Default generic dashboard for other roles or fallbacks
        return Inertia::render('dashboard/index', [
            // No specific stats for now
        ]);
    }
}
