<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Services\DashboardStatsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;

class DashboardController extends Controller
{
    public function __construct(
        private DashboardStatsService $statsService
    ) {}

    public function index()
    {
        $user = Auth::user();

        if ($user->hasRole('Etudiant')) {
            $student = Student::where('user_id', $user->id)->first();
            $stats = $student
                ? $this->statsService->getStudentStats($student->id)
                : $this->emptyStudentStats();

            return Inertia::render('dashboard/student', ['stats' => $stats]);
        }

        if ($user->hasRole('Enseignant')) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            $stats = $teacher
                ? $this->statsService->getTeacherStats($teacher->id)
                : $this->emptyTeacherStats();

            return Inertia::render('dashboard/teacher', ['stats' => $stats]);
        }

        if ($user->hasRole(['Super Admin', 'Admin'])) {
            $stats = $this->statsService->getAdminStats();
            return Inertia::render('dashboard/admin', ['stats' => $stats]);
        }

        return Inertia::render('dashboard/index');
    }

    private function emptyStudentStats(): array
    {
        return [
            'courses_count'      => 0,
            'average_note'       => 0,
            'credits_validated'  => 0,
            'recent_notes'       => [],
        ];
    }

    private function emptyTeacherStats(): array
    {
        return [
            'courses_count'   => 0,
            'students_count'  => 0,
            'pending_grades'  => 0,
        ];
    }
}
