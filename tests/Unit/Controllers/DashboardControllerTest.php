<?php

declare(strict_types=1);

namespace Tests\Unit\Controllers;

use Tests\TestCase;
use App\Services\DashboardStatsService;
use App\Models\User;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;
use Inertia\Testing\AssertableInertia as Assert;
use Mockery\MockInterface;

class DashboardControllerTest extends TestCase
{
    private DashboardStatsService|MockInterface $statsServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        // Mock du service de statistiques
        $this->statsServiceMock = $this->mock(DashboardStatsService::class);
    }

    public function test_student_dashboard_shows_correct_stats(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        // Mock du service de statistiques étudiant
        $this->statsServiceMock
            ->shouldReceive('getStudentStats')
            ->with($student->id)
            ->once()
            ->andReturn([
                'courses_count'      => 5,
                'average_note'       => 15.0,
                'credits_validated'  => 0,
                'recent_notes'       => array_fill(0, 5, [
                    'course' => 'Maths',
                    'cote'   => 15,
                    'date'   => '12/02/2026',
                ]),
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/student')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('courses_count', 5)
                        ->where('average_note', fn($val) => $val == 15.0)
                        ->has('recent_notes', 5)
                        ->etc()
                )
        );
    }

    public function test_student_dashboard_with_no_courses(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        // Mock du service pour renvoyer des stats vides
        $this->statsServiceMock
            ->shouldReceive('getStudentStats')
            ->with($student->id)
            ->once()
            ->andReturn([
                'courses_count'      => 0,
                'average_note'       => 0,
                'credits_validated'  => 0,
                'recent_notes'       => [],
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/student')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('courses_count', 0)
                        ->where('average_note', fn($val) => $val == 0)
                        ->where('credits_validated', 0)
                        ->etc()
                )
        );
    }

    public function test_teacher_dashboard_shows_correct_stats(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();

        // Mock du service de statistiques enseignant
        $this->statsServiceMock
            ->shouldReceive('getTeacherStats')
            ->with($teacher->id)
            ->once()
            ->andReturn([
                'courses_count'   => 3,
                'students_count'  => 60,
                'pending_grades'  => 0,
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/teacher')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('courses_count', 3)
                        ->where('students_count', 60)
                        ->where('pending_grades', 0)
                        ->etc()
                )
        );
    }

    public function test_admin_dashboard_shows_correct_stats(): void
    {
        // Arrange
        $user = $this->authenticateAsAdmin();

        // Mock du service admin
        $this->statsServiceMock
            ->shouldReceive('getAdminStats')
            ->once()
            ->andReturn([
                'users_count'        => 51,
                'institutions_count' => 5,
                'departments_count'  => 10,
                'courses_count'      => 25,
                'programs_count'     => 8,
                'students_count'     => 100,
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/admin')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('users_count', 51)
                        ->where('institutions_count', 5)
                        ->where('departments_count', 10)
                        ->where('courses_count', 25)
                        ->where('programs_count', 8)
                        ->where('students_count', 100)
                )
        );
    }

    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertRedirect(route('login'));
    }

    public function test_student_dashboard_calculates_average_correctly(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        // Mock du service de statistiques étudiant avec une moyenne de 15
        $this->statsServiceMock
            ->shouldReceive('getStudentStats')
            ->with($student->id)
            ->once()
            ->andReturn([
                'courses_count'      => 0,
                'average_note'       => 15.0,
                'credits_validated'  => 0,
                'recent_notes'       => [],
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats->where('average_note', fn($val) => $val == 15.0)
                        ->etc()
                )
        );
    }

    public function test_student_dashboard_shows_recent_notes_with_courses(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        // Mock du service avec une note récente
        $this->statsServiceMock
            ->shouldReceive('getStudentStats')
            ->with($student->id)
            ->once()
            ->andReturn([
                'courses_count'      => 0,
                'average_note'       => 18.0,
                'credits_validated'  => 0,
                'recent_notes'       => [
                    [
                        'course' => 'Mathematics',
                        'cote'   => 18,
                        'date'   => '12/02/2026',
                    ],
                ],
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->has('stats.recent_notes', 1)
                ->has(
                    'stats.recent_notes.0',
                    fn(Assert $note) => $note
                        ->where('course', 'Mathematics')
                        ->where('cote', 18)
                        ->has('date')
                )
        );
    }

    public function test_teacher_dashboard_with_no_courses(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();

        // Mock du service avec stats vides
        $this->statsServiceMock
            ->shouldReceive('getTeacherStats')
            ->with($teacher->id)
            ->once()
            ->andReturn([
                'courses_count'   => 0,
                'students_count'  => 0,
                'pending_grades'  => 0,
            ]);

        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/teacher')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('courses_count', 0)
                        ->where('students_count', 0)
                        ->etc()
                )
        );
    }

    public function test_dashboard_routes_based_on_user_role(): void
    {
        // Test Student
        ['user' => $studentUser, 'student' => $student] = $this->authenticateAsStudent();
        $this->statsServiceMock->shouldReceive('getStudentStats')->with($student->id)->once()->andReturn([]);

        $response = $this->get(route('dashboard'));
        $response->assertInertia(fn(Assert $page) => $page->component('dashboard/student'));

        // Test Teacher
        ['user' => $teacherUser, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $this->statsServiceMock->shouldReceive('getTeacherStats')->with($teacher->id)->once()->andReturn([]);

        $response = $this->get(route('dashboard'));
        $response->assertInertia(fn(Assert $page) => $page->component('dashboard/teacher'));

        // Test Admin
        $adminUser = $this->authenticateAsAdmin();
        $this->statsServiceMock->shouldReceive('getAdminStats')->once()->andReturn([]);

        $response = $this->get(route('dashboard'));
        $response->assertInertia(fn(Assert $page) => $page->component('dashboard/admin'));
    }
}
