<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use App\Services\CinetPayService;
use App\Services\StudentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Promotion;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;
use Tests\TestCase;
use Mockery;

class StudentServiceTest extends TestCase
{
    use RefreshDatabase;

    private StudentService $studentService;
    private $cinetPayServiceMock;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cinetPayServiceMock = Mockery::mock(CinetPayService::class);
        $this->studentService = new StudentService($this->cinetPayServiceMock);
    }

    public function test_get_dashboard_stats_calculates_correctly()
    {
        $student = Student::factory()->create();
        $institution = Institution::factory()->create();
        $program = Program::factory()->create(['institution_id' => $institution->id]);
        $promotion = Promotion::factory()->create();

        $unitsTeaching = \Modules\Institution\Entities\UnitsTeaching::factory()->create(['promotion_id' => $promotion->id]);
        $courseCategory = \Modules\Institution\Entities\CourseCategory::factory()->create();

        Inscription::factory()->create([
            'student_id' => $student->id,
            'institution_id' => $institution->id,
            // 'program_id' => $program->id, // Removed as column doesn't exist
            'promotion_id' => $promotion->id,
        ]);

        $course = Course::factory()->create();
        $student->courses()->attach($course);

        // Setup course program details needed for the query in getFormattedCourses
        DB::table('course_program_details')->insert([
            'course_id' => $course->id,
            'program_id' => $program->id,
            'promotion_id' => $promotion->id,
            'units_teaching_id' => $unitsTeaching->id,
            'course_category_id' => $courseCategory->id,
            'credits' => 5,
            'cm' => 10,
            'td' => 5,
            'tp' => 0
        ]);

        Note::factory()->create([
            'student_id' => $student->id,
            'course_id' => $course->id,
            'cote' => 15
        ]);

        $stats = $this->studentService->getDashboardStats($student);

        $this->assertEquals(1, $stats['totalCourses']);
        $this->assertEquals(1, $stats['selectedCourses']);
        $this->assertEquals(5, $stats['totalCredits']);
        $this->assertEquals(15.0, $stats['averageGrade']);
    }

    public function test_initiate_appeal_payment_creates_payment_and_config()
    {
        $student = Student::factory()->create();
        $course = Course::factory()->create();

        $items = [
            [
                'course_id' => $course->id,
                'object' => 'Test Appeal',
                'justification' => 'Test Justification',
                'documents' => []
            ]
        ];

        $result = $this->studentService->initiateAppealPayment($student, $items);

        $this->assertTrue($result['success']);
        $this->assertDatabaseHas('payments', [
            'student_id' => $student->id,
            'amount' => 10000,
            'status' => 'pending'
        ]);
        $this->assertArrayHasKey('cinetpay_config', $result);
        $this->assertArrayHasKey('apikey', $result['cinetpay_config']);
    }

    public function test_check_payment_status_verifies_payment()
    {
        $reference = 'REF123';
        $student = Student::factory()->create();
        $course = Course::factory()->create();

        Payment::create([
            'student_id' => $student->id,
            'amount' => 10000,
            'status' => 'pending',
            'metadata' => json_encode([
                'reference' => $reference,
                'items' => [
                    [
                        'course_id' => $course->id,
                        'object' => 'Test Appeal',
                        'justification' => 'Test',
                        'documents' => []
                    ]
                ]
            ])
        ]);

        $this->cinetPayServiceMock->shouldReceive('getPaymentDetails')
            ->with($reference)
            ->once()
            ->andReturn([
                'code' => '00',
                'data' => ['status' => 'ACCEPTED']
            ]);

        $status = $this->studentService->checkPaymentStatus($reference);

        $this->assertEquals('paid', $status);
        $this->assertDatabaseHas('payments', [
            'metadata->reference' => $reference,
            'status' => 'paid'
        ]);
    }
}
