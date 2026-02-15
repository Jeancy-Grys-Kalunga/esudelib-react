<?php

namespace Tests\Feature\Student;

use Tests\TestCase;
use Modules\Student\Entities\{Student, Note, Appeal, Payment};
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Institution\Entities\{Course, Program, Promotion, Institution, AcademicYear};
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\{Storage, Http};

/**
 * Integration tests for Student Registration Workflow
 * 
 * Tests complete student registration, course selection, and enrollment
 * following clean code principles.
 */
class StudentRegistrationWorkflowTest extends TestCase
{
    /**
     * Test complete student registration workflow
     *
     * @return void
     */
    public function test_complete_student_registration_workflow(): void
    {
        // Arrange
        $institution = Institution::factory()->create();
        $program = Program::factory()->create(['institution_id' => $institution->id]);
        $promotion = Promotion::factory()->create();
        $academicYear = AcademicYear::factory()->create();

        // Act - Step 1: User registration
        $response = $this->post(route('register'), [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertNotNull($user);

        // Act - Step 2: Student profile creation
        $this->actingAs($user);
        $profileResponse = $this->postJson(route('student.profile.create'), [
            'matricule' => 'STU2024001',
            'phone' => '0812345678',
            'address' => 'Kinshasa'
        ]);

        $student = Student::where('user_id', $user->id)->first();
        $this->assertNotNull($student);

        // Act - Step 3: Program enrollment
        $enrollmentResponse = $this->postJson(route('student.enrollment.store'), [
            'promotion_id' => $promotion->id,
            'institution_id' => $institution->id,
            'academic_year_id' => $academicYear->id
        ]);

        // Assert - Enrollment created
        $this->assertDatabaseHas('inscriptions', [
            'student_id' => $student->id,
            'promotion_id' => $promotion->id
        ]);

        // Act - Step 4: Course selection
        $courses = Course::factory()->count(5)->create();
        $courseIds = $courses->pluck('id')->toArray();

        $courseResponse = $this->postJson(route('student.courses.store'), [
            'selectedCourseIds' => $courseIds
        ]);

        // Assert - Courses enrolled
        foreach ($courseIds as $courseId) {
            $this->assertDatabaseHas('course_student', [
                'student_id' => $student->id,
                'course_id' => $courseId
            ]);
        }

        // Assert - Complete workflow success
        $profileResponse->assertJson(['success' => true]);
        $enrollmentResponse->assertJson(['success' => true]);
        $courseResponse->assertRedirect();
    }

    /**
     * Test student can update course selection
     *
     * @return void
     */
    public function test_student_can_update_course_selection(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();
        $this->createStudentInscription($student);

        $initialCourses = Course::factory()->count(3)->create();
        $student->courses()->attach($initialCourses->pluck('id'));

        $newCourses = Course::factory()->count(4)->create();

        // Act
        $response = $this->postJson(route('student.courses.store'), [
            'selectedCourseIds' => $newCourses->pluck('id')->toArray()
        ]);

        // Assert
        $response->assertRedirect();
        $this->assertEquals(4, $student->courses()->count());
    }

    /**
     * Test registration with payment
     *
     * @return void
     */
    public function test_registration_with_payment_workflow(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        Http::fake([
            '*/payment' => Http::response(['code' => '0', 'orderNumber' => 'REG123'], 200)
        ]);

        // Act - Create registration payment
        $response = $this->postJson(route('student.registration.payment'), [
            'amount' => 50000,
            'payment_method' => 'mobile',
            'phone_number' => '0812345678'
        ]);

        // Assert
        $response->assertJson(['success' => true]);
        $this->assertDatabaseHas('payments', [
            'student_id' => $student->id,
            'amount' => 50000,
            'status' => 'pending'
        ]);
    }

    /**
     * Test document upload during registration
     *
     * @return void
     */
    public function test_document_upload_during_registration(): void
    {
        // Arrange
        ['user' => $user, 'student' => $student] = $this->authenticateAsStudent();

        Storage::fake('public');
        $diploma = UploadedFile::fake()->create('diploma.pdf', 500, 'application/pdf');
        $photo = UploadedFile::fake()->create('photo.jpg', 500, 'image/jpeg');

        // Act
        $response = $this->postJson(route('student.documents.upload'), [
            'diploma' => $diploma,
            'photo' => $photo
        ]);

        // Assert
        $response->assertJson(['success' => true]);
        Storage::disk('public')->assertExists('student_documents/' . $student->id . '/diploma.pdf');
        Storage::disk('public')->assertExists('student_documents/' . $student->id . '/photo.jpg');
    }

    /**
     * Helper method to create student inscription
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
