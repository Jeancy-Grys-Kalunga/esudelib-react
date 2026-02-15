<?php

declare(strict_types=1);

namespace Tests\Unit\Services;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\CreatesApplication;
use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Routing\UrlGenerator;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Payment;
use Modules\Teacher\Entities\Teacher;
use Modules\Institution\Entities\Course;
use Mockery;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;

/**
 * NotificationServiceTest
 * 
 * This test uses a pure unit testing approach by extending the base Laravel TestCase
 * WITHOUT the RefreshDatabase trait or custom database setup from Tests\TestCase.
 */
class NotificationServiceTest extends BaseTestCase
{
    use CreatesApplication;

    private NotificationService $service;

    private $guardMock;
    private $urlMock;
    private $studentModelMock;
    private $teacherModelMock;
    private $appealModelMock;
    private $noteModelMock;
    private $paymentModelMock;
    private $courseModelMock;
    private $notificationModelMock;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow('2024-01-01 12:00:00');

        $this->guardMock = Mockery::mock(Guard::class);
        $this->urlMock = Mockery::mock(UrlGenerator::class);

        $this->studentModelMock = Mockery::mock(Student::class);
        $this->teacherModelMock = Mockery::mock(Teacher::class);
        $this->appealModelMock = Mockery::mock(Appeal::class);
        $this->noteModelMock = Mockery::mock(Note::class);
        $this->paymentModelMock = Mockery::mock(Payment::class);
        $this->courseModelMock = Mockery::mock(Course::class);
        $this->notificationModelMock = Mockery::mock(Notification::class);

        $this->setupDefaultMocks();

        $this->service = new NotificationService(
            $this->guardMock,
            $this->urlMock,
            $this->studentModelMock,
            $this->teacherModelMock,
            $this->appealModelMock,
            $this->noteModelMock,
            $this->paymentModelMock,
            $this->courseModelMock,
            $this->notificationModelMock
        );
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        Mockery::close();
        parent::tearDown();
    }

    private function setupDefaultMocks(): void
    {
        $this->guardMock->shouldReceive('id')->byDefault()->andReturn(1);
        $this->urlMock->shouldReceive('route')->byDefault()->andReturn('/mock-url');

        foreach (
            [
                $this->studentModelMock,
                $this->teacherModelMock,
                $this->appealModelMock,
                $this->noteModelMock,
                $this->paymentModelMock,
                $this->courseModelMock,
                $this->notificationModelMock
            ] as $mock
        ) {
            $mock->shouldReceive('where')->withAnyArgs()->andReturnSelf()->byDefault();
            $mock->shouldReceive('whereHas')->withAnyArgs()->andReturnSelf()->byDefault();
            $mock->shouldReceive('whereDoesntHave')->withAnyArgs()->andReturnSelf()->byDefault();
            $mock->shouldReceive('whereNull')->withAnyArgs()->andReturnSelf()->byDefault();
            $mock->shouldReceive('orderBy')->withAnyArgs()->andReturnSelf()->byDefault();
            $mock->shouldReceive('count')->byDefault()->andReturn(0);
            $mock->shouldReceive('first')->byDefault()->andReturn(null);
            $mock->shouldReceive('findOrFail')->withAnyArgs()->byDefault()->andReturn(null);
            $mock->shouldReceive('create')->withAnyArgs()->byDefault()->andReturn(Mockery::mock(Notification::class));
            $mock->shouldReceive('update')->withAnyArgs()->byDefault()->andReturn(1);
        }

        // Default student/teacher for findOrFail
        $this->studentModelMock->shouldReceive('findOrFail')->andReturn($this->createStudentMock(1))->byDefault();
        $this->teacherModelMock->shouldReceive('findOrFail')->andReturn($this->createTeacherMock(1))->byDefault();
    }

    private function createStudentMock(int $id)
    {
        $mock = Mockery::mock(Student::class);
        $mock->shouldReceive('getAttribute')->with('id')->andReturn($id)->byDefault();
        $relation = Mockery::mock(BelongsToMany::class);
        $relation->shouldReceive('whereHas')->andReturnSelf()->byDefault();
        $relation->shouldReceive('count')->andReturn(0)->byDefault();
        $mock->shouldReceive('courses')->andReturn($relation)->byDefault();
        return $mock;
    }

    private function createTeacherMock(int $id)
    {
        $mock = Mockery::mock(Teacher::class);
        $mock->shouldReceive('getAttribute')->with('id')->andReturn($id)->byDefault();
        $relation = Mockery::mock(HasMany::class);
        $relation->shouldReceive('whereHas')->andReturnSelf()->byDefault();
        $relation->shouldReceive('count')->andReturn(0)->byDefault();
        $mock->shouldReceive('assignments')->andReturn($relation)->byDefault();
        return $mock;
    }

    // --------------------------------------------------------------------
    // TESTS
    // --------------------------------------------------------------------

    public function test_student_notifications_with_pending_appeals(): void
    {
        $this->appealModelMock
            ->shouldReceive('where')->with('student_id', 1)->andReturnSelf()
            ->shouldReceive('where')->with('status', 'pending')->andReturnSelf()
            ->shouldReceive('count')->once()->andReturn(3);

        $this->urlMock
            ->shouldReceive('route')
            ->with('student.appeals.index')
            ->andReturn('/student/appeals');

        $notifications = $this->service->getStudentNotifications(1);

        $this->assertCount(1, $notifications);
        $this->assertEquals('appeal-pending', $notifications[0]['id']);
        $this->assertStringContainsString('3 recours', $notifications[0]['message']);
    }

    public function test_student_notifications_with_new_notes(): void
    {
        $this->noteModelMock
            ->shouldReceive('where')->with('student_id', 1)->andReturnSelf()
            ->shouldReceive('where')->with('created_at', '>', Mockery::any())->andReturnSelf()
            ->shouldReceive('count')->once()->andReturn(5);

        $notifications = $this->service->getStudentNotifications(1);

        $newNotes = collect($notifications)->firstWhere('id', 'new-notes');
        $this->assertNotNull($newNotes);
        $this->assertStringContainsString('5 nouvelles notes', $newNotes['message']);
    }

    public function test_student_notifications_with_payment_reminder(): void
    {
        $paymentMock = Mockery::mock(Payment::class);
        $paymentMock->shouldReceive('getAttribute')->with('due_date')->andReturn(Carbon::now()->addDays(5)->toDateTimeString());

        $this->paymentModelMock
            ->shouldReceive('where')->with('student_id', 1)->andReturnSelf()
            ->shouldReceive('where')->with('status', 'pending')->andReturnSelf()
            ->shouldReceive('orderBy')->with('due_date')->andReturnSelf()
            ->shouldReceive('first')->once()->andReturn($paymentMock);

        $notifications = $this->service->getStudentNotifications(1);

        $payment = collect($notifications)->firstWhere('id', 'payment-reminder');
        $this->assertNotNull($payment);
        $this->assertStringContainsString('Paiement dû dans 5 jours', $payment['message']);
    }

    public function test_student_notifications_with_overdue_payment(): void
    {
        $paymentMock = Mockery::mock(Payment::class);
        $paymentMock->shouldReceive('getAttribute')->with('due_date')->andReturn(Carbon::now()->subDays(2)->toDateTimeString());

        $this->paymentModelMock
            ->shouldReceive('first')->andReturn($paymentMock);

        $notifications = $this->service->getStudentNotifications(1);

        $payment = collect($notifications)->firstWhere('id', 'payment-reminder');
        $this->assertNotNull($payment);
        $this->assertStringContainsString('Paiement en retard', $payment['message']);
    }

    public function test_student_with_no_notifications(): void
    {
        // Mock all counts to 0
        $this->appealModelMock->shouldReceive('count')->andReturn(0);
        $this->noteModelMock->shouldReceive('count')->andReturn(0);
        $this->paymentModelMock->shouldReceive('first')->andReturn(null);

        $notifications = $this->service->getStudentNotifications(1);
        $this->assertEmpty($notifications);
    }

    public function test_teacher_notifications_with_upcoming_classes(): void
    {
        $teacherMock = $this->createTeacherMock(1);
        $this->teacherModelMock->shouldReceive('findOrFail')->andReturn($teacherMock);

        $relation = $teacherMock->assignments();
        $relation->shouldReceive('count')->once()->andReturn(3);

        $notifications = $this->service->getTeacherNotifications(1);

        $class = collect($notifications)->firstWhere('id', 'upcoming-classes');
        $this->assertNotNull($class);
        $this->assertStringContainsString('3 cours', $class['message']);
    }

    public function test_teacher_notifications_with_pending_appeals(): void
    {
        $this->appealModelMock
            ->shouldReceive('count')->once()->andReturn(4);

        $notifications = $this->service->getTeacherNotifications(1);

        $appeal = collect($notifications)->firstWhere('id', 'appeals-to-review');
        $this->assertNotNull($appeal);
        $this->assertStringContainsString('4 recours', $appeal['message']);
    }

    public function test_teacher_with_no_notifications(): void
    {
        $teacherMock = $this->createTeacherMock(1);
        $this->teacherModelMock->shouldReceive('findOrFail')->andReturn($teacherMock);

        $teacherMock->assignments()->shouldReceive('count')->andReturn(0);
        $this->appealModelMock->shouldReceive('count')->andReturn(0);

        $notifications = $this->service->getTeacherNotifications(1);
        $this->assertEmpty($notifications);
    }

    public function test_registration_notifications_with_incomplete_registrations(): void
    {
        $this->studentModelMock
            ->shouldReceive('whereDoesntHave')->with('documents')->andReturnSelf()
            ->shouldReceive('count')->once()->andReturn(5);

        $notifications = $this->service->getRegistrationNotifications(999);

        $incomplete = collect($notifications)->firstWhere('id', 'incomplete-registrations');
        $this->assertNotNull($incomplete);
    }

    public function test_mark_course_appeals_as_read(): void
    {
        $this->guardMock->shouldReceive('id')->once()->andReturn(42);

        $this->notificationModelMock
            ->shouldReceive('update')->once()->andReturn(1);

        $this->service->markAsReadForCourseAppeals(123);
        $this->assertTrue(true);
    }

    public function test_create_teacher_notification(): void
    {
        $this->notificationModelMock
            ->shouldReceive('create')->once();

        $this->service->createTeacherNotification(5, 'Title', 'Msg', '/url');
        $this->assertTrue(true);
    }
}
