<?php

namespace Tests\Unit\Modules\Student;

use Tests\TestCase;
use Modules\Student\Http\Controllers\StudentController;
use Modules\Student\Entities\{Student, Note, Appeal, Payment};
use Modules\Institution\Entities\{Course, Program, Promotion, Institution, AcademicYear};
use Modules\RegistrationDesk\Entities\Inscription;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

/**
 * Unit tests for StudentController
 * 
 * Tests student dashboard, course selection, results, and appeals
 * following clean code principles.
 */
class StudentControllerTest extends TestCase
{
    /**
     * Test student dashboard displays correct data
     *
     * @return void
     */
    public function test_dashboard_displays_student_information(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        $institution = Institution::factory()->create();
        $program = Program::factory()->create(['institution_id' => $institution->id]);
        $promotion = Promotion::factory()->create();
        $academicYear = AcademicYear::factory()->create();

        $inscription = Inscription::factory()->create([
            'student_id' => $student->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id
        ]);

        // Act - Using general dashboard route as student.dashboard is not defined
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('dashboard/student')
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->has('recent_notes')
                        ->etc()
                )
        );
    }

    /**
     * Test dashboard calculates statistics correctly
     *
     * @return void
     */
    public function test_dashboard_calculates_correct_statistics(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        $this->createStudentInscription($student);

        $courses = Course::factory()->count(5)->create();
        foreach ($courses as $course) {
            $student->courses()->attach($course->id);
        }

        Note::factory()->count(3)->create([
            'student_id' => $student->id,
            'cote' => 15
        ]);

        // Act - Using general dashboard route
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->has(
                    'stats',
                    fn(Assert $stats) => $stats
                        ->where('courses_count', 5)
                        ->where('average_note', fn($val) => $val == 15.0)
                        ->etc()
                )
        );
    }

    /**
     * Test course selection page displays available courses
     *
     * @return void
     */
    public function test_index_displays_available_courses(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $courses = Course::factory()->count(3)->create();

        // Act
        $response = $this->get(route('student.courses.index'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('student/courseSelection')
                ->has('courses')
                ->has('hasPendingAppeals')
        );
    }

    /**
     * Test storing course selections
     *
     * @return void
     */
    public function test_store_courses_saves_selections(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $courses = Course::factory()->count(3)->create();
        $courseIds = $courses->pluck('id')->toArray();

        // Act
        $response = $this->post(route('student.courses.store'), [
            'selectedCourseIds' => $courseIds
        ]);

        // Assert
        $response->assertRedirect(route('student.courses.index'));
        $this->assertDatabaseHas('course_student', [
            'student_id' => $student->id,
            'course_id' => $courseIds[0]
        ]);
    }

    /**
     * Test results page displays student grades
     *
     * @return void
     */
    public function test_results_displays_student_grades(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $course = Course::factory()->create();
        $examSession = \Modules\Institution\Entities\ExamSession::factory()->create(['title' => 'Normale']);
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 15,
            'exam_session_id' => $examSession->id
        ]);

        // Act
        $response = $this->get(route('student.results'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('student/results')
                ->has('notes', 1)
                ->has('student')
        );
    }

    /**
     * Test results show appeal option for failed courses
     *
     * @return void
     */
    public function test_results_show_appeal_option_for_failed_courses(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $course = Course::factory()->create();
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 8 // Failed
        ]);

        // Act
        $response = $this->get(route('student.results'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->has(
                    'notes.0',
                    fn(Assert $note) => $note
                        ->where('can_appeal', true)
                        ->where('cote', 8)
                        ->etc()
                )
        );
    }

    /**
     * Test create appeal page displays failed courses
     *
     * @return void
     */
    public function test_create_appeal_displays_failed_courses(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $course = Course::factory()->create();
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 7
        ]);

        // Act
        $response = $this->get(route('student.appeals.create'));

        // Assert
        $response->assertInertia(
            fn(Assert $page) => $page
                ->component('student/createAppeal')
                ->has('courses')
                ->has('appeal_fee')
        );
    }

    /**
     * Test storing appeal creates payment record
     *
     * @return void
     */
    public function test_store_appeal_creates_payment_record(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $course = Course::factory()->create();
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 6
        ]);

        Storage::fake('public');

        // Act
        $response = $this->postJson(route('student.appeals.store'), [
            'items' => [
                [
                    'course_id' => $course->id,
                    'object' => 'Recours note',
                    'justification' => 'Erreur de correction',
                    'documents' => []
                ]
            ],
            'phone_number' => '0812345678'
        ]);

        // Assert
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('payments', [
            'student_id' => $student->id,
            'status' => 'pending',
            'amount' => 10000
        ]);
    }

    /**
     * Test appeal with document upload
     *
     * @return void
     */
    public function test_store_appeal_with_documents(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $course = Course::factory()->create();
        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 5
        ]);

        Storage::fake('public');
        $file = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');

        // Act
        $response = $this->postJson(route('student.appeals.store'), [
            'items' => [
                [
                    'course_id' => $course->id,
                    'object' => 'Recours',
                    'justification' => 'Test',
                    'documents' => [$file]
                ]
            ]
        ]);

        // Assert
        $response->assertJson(['success' => true]);
        $this->assertTrue(Storage::disk('public')->exists('temp_documents'));
    }

    /**
     * Test payment status checking
     *
     * @return void
     */
    public function test_check_payment_status_returns_correct_status(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        $payment = Payment::factory()->create([
            'student_id' => $student->id,
            'status' => 'paid',
            'metadata' => json_encode(['reference' => 'APPEAL-123'])
        ]);

        // Act
        $response = $this->getJson(route('student.appeals.check_status', 'APPEAL-123'));

        // Assert
        $response->assertJson(['status' => 'paid']);
    }

    /**
     * Test unauthenticated user cannot access student routes
     *
     * @return void
     */
    public function test_unauthenticated_user_cannot_access_dashboard(): void
    {
        // Act
        $response = $this->get(route('dashboard'));

        // Assert
        $response->assertRedirect(route('login'));
    }

    /**
     * Helper method to create student inscription
     *
     * @param Student $student
     * @return void
     */
    private function createStudentInscription(Student $student): void
    {
        $institution = Institution::factory()->create();
        $program = Program::factory()->create(['institution_id' => $institution->id]);
        $promotion = Promotion::factory()->create();
        $academicYear = AcademicYear::factory()->create();

        Inscription::factory()->create([
            'student_id' => $student->id,
            'promotion_id' => $promotion->id,
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id
        ]);
    }
}
