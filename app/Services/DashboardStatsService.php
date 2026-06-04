<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Department;
use Modules\Institution\Entities\Program;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;

class DashboardStatsService
{
    public function __construct(
        private \App\Services\StudentService $studentService
    ) {}

    /**
     * Get statistics for a student dashboard.
     *
     * @param int $studentId
     * @return array{
     *     courses_count: int,
     *     average_note: float,
     *     credits_validated: int,
     *     recent_notes: array<int, array{course: string, cote: float|null, date: string}>
     * }
     */
    public function getStudentStats(int $studentId): array
    {
        $student = Student::findOrFail($studentId);

        $detailedStats = $this->studentService->getDashboardStats($student);

        $coursesCount = $detailedStats['totalCourses'] ?? $student->courses()->count();
        $averageNote = $detailedStats['averageGrade'] ?? 0;

        $recentNotes = $student->notes()
            ->with('course')
            ->latest()
            ->take(5)
            ->get()
            ->map(function ($note) {
                return [
                    'course' => $note->course->title ?? 'Cours Inconnu',
                    'cote'   => $note->cote,
                    'date'   => $note->created_at ? $note->created_at->format('d/m/Y') : '',
                ];
            })->toArray();

        return [
            'courses_count'      => $coursesCount,
            'average_note'       => $averageNote,
            'credits_validated'  => $detailedStats['validatedCredits'] ?? 0,
            'validated_courses'  => $detailedStats['validatedCourses'] ?? [],
            'non_validated_courses' => $detailedStats['nonValidatedCourses'] ?? [],
            'recent_notes'       => $recentNotes,
        ];
    }

    /**
     * Get statistics for a teacher dashboard.
     *
     * @param int $teacherId
     * @return array{
     *     courses_count: int,
     *     students_count: int,
     *     pending_grades: int
     * }
     */
    public function getTeacherStats(int $teacherId): array
    {
        $teacher = Teacher::findOrFail($teacherId);

        $coursesCount = $teacher->courses()->count();

        // Nombre d'étudiants uniques dans tous les cours
        $studentsCount = $teacher->courses()
            ->withCount('students')
            ->get()
            ->sum('students_count');

        return [
            'courses_count'   => $coursesCount,
            'students_count'  => $studentsCount,
            'pending_grades'  => 0, // à implémenter
        ];
    }

    /**
     * Get statistics for admin dashboard.
     *
     * @return array{
     *     users_count: int,
     *     institutions_count: int,
     *     departments_count: int,
     *     courses_count: int,
     *     programs_count: int,
     *     students_count: int
     * }
     */
    public function getAdminStats(): array
    {
        return [
            'users_count'        => User::count(),
            'institutions_count' => Institution::count(),
            'departments_count'  => Department::count(),
            'courses_count'      => Course::count(),
            'programs_count'     => Program::count(),
            'students_count'     => Student::count(),
        ];
    }
}
