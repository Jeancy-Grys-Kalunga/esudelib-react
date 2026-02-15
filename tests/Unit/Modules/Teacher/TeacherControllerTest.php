<?php

namespace Tests\Unit\Modules\Teacher;

use Tests\TestCase;
use Modules\Teacher\Entities\Teacher;
use Modules\Student\Entities\{Student, Note, Appeal};
use Modules\Institution\Entities\{Course, Assignment, AcademicYear, Promotion, Institution, ExamSession};
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

class TeacherControllerTest extends TestCase
{
    /**
     * Helper to create a course assigned to a teacher.
     */
    protected function createAssignedCourse(Teacher $teacher, $promotion = null)
    {
        $course = Course::factory()->create();
        $promotion = $promotion ?? Promotion::factory()->create();

        Assignment::factory()->create([
            'holder_id' => $teacher->id,
            'course_id' => $course->id,
            'promotion_id' => $promotion->id,
            'academic_year_id' => AcademicYear::factory()->create()->id,
            'institution_id' => $teacher->institutions()->first()->id ?? Institution::factory()->create()->id,
        ]);

        return ['course' => $course, 'promotion' => $promotion];
    }

    public function test_teacher_can_view_assigned_courses(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $institution = Institution::factory()->create();
        $teacher->institutions()->attach($institution->id);

        for ($i = 0; $i < 5; $i++) {
            $course = Course::factory()->create();
            Assignment::factory()->create([
                'holder_id' => $teacher->id,
                'course_id' => $course->id,
                'institution_id' => $institution->id,
            ]);
        }

        // Act
        $response = $this->get(route('teacher.courses'));

        // Assert
        $response->assertStatus(200);
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('teacher/courses')
                ->has('courses', 5)
        );
    }

    public function test_teacher_can_view_course_submit_form(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $institution = Institution::factory()->create();
        $teacher->institutions()->attach($institution->id);

        ['course' => $course] = $this->createAssignedCourse($teacher);
        ExamSession::factory()->create(['institution_id' => $institution->id]);

        // Act
        $response = $this->get(route('teacher.courses.submit.form', $course->id));

        // Assert
        $response->assertStatus(200);
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('teacher/submitGrades')
                ->has('course')
                ->has('academicYears')
                ->has('promotions')
                ->has('examSessions')
        );
    }

    public function test_teacher_can_view_appeals_for_course(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $institution = Institution::factory()->create();
        $teacher->institutions()->attach($institution->id);

        ['course' => $course] = $this->createAssignedCourse($teacher);
        $student = Student::factory()->create();

        Appeal::factory()->count(3)->create([
            'course_id' => $course->id,
            'student_id' => $student->id,
            'status' => 'pending'
        ]);

        // Act
        $response = $this->get(route('teacher.courses.appeals', $course->id));

        // Assert
        $response->assertStatus(200);
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('teacher/appeals')
                ->has('appeals', 3)
                ->has('course')
        );
    }

    public function test_teacher_can_access_online_editor(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $institution = Institution::factory()->create();
        $teacher->institutions()->attach($institution->id);

        ['course' => $course] = $this->createAssignedCourse($teacher);

        // Act
        $response = $this->get(route('teacher.courses.online-editor', $course->id));

        // Assert
        $response->assertStatus(200);
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('teacher/online-editor')
                ->has('course')
                ->has('academicYears')
                ->has('promotion')
                ->has('examSessions')
        );
    }

    public function test_unauthenticated_user_cannot_access_teacher_courses(): void
    {
        // Act
        $response = $this->get(route('teacher.courses'), ['Accept' => 'application/json']);

        // Assert
        // Since it passes through 'auth' middleware, it should redirect or return 401.
        // But the controller method also has a check that fails if not logged in.
        $response->assertStatus(401);
    }

    public function test_teacher_cannot_access_other_teacher_course_appeals(): void
    {
        // Arrange
        ['user' => $user, 'teacher' => $teacher] = $this->authenticateAsTeacher();
        $institution = Institution::factory()->create();
        $teacher->institutions()->attach($institution->id);

        $otherTeacher = Teacher::factory()->create();
        $otherTeacher->institutions()->attach($institution->id);
        ['course' => $otherCourse] = $this->createAssignedCourse($otherTeacher);

        // Act
        $response = $this->get(route('teacher.courses.appeals', $otherCourse->id));

        // Assert
        $response->assertStatus(403);
    }
}
