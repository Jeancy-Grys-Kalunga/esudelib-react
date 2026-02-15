<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Notification;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Payment;
use Modules\Teacher\Entities\Teacher;
use Modules\Institution\Entities\Course;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Contracts\Routing\UrlGenerator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use RuntimeException;

/**
 * Notification Service
 *
 * Generates contextual notifications for students, teachers, and registration desk.
 * All dependencies are injected for maximum testability.
 *
 * @package App\Services
 */
class NotificationService
{
    /**
     * Number of days to consider "recent" for new notes.
     */
    private const RECENT_NOTES_DAYS = 3;

    /**
     * Number of days before due date to start sending payment reminders.
     */
    private const PAYMENT_REMINDER_DAYS = 7;

    /**
     * Upcoming course/class window (hours).
     */
    private const UPCOMING_HOURS = 24;

    /**
     * Authentication guard.
     *
     * @var Guard
     */
    private Guard $auth;

    /**
     * URL generator.
     *
     * @var UrlGenerator
     */
    private UrlGenerator $url;

    /**
     * Student model.
     *
     * @var Student
     */
    private Student $studentModel;

    /**
     * Teacher model.
     *
     * @var Teacher
     */
    private Teacher $teacherModel;

    /**
     * Appeal model.
     *
     * @var Appeal
     */
    private Appeal $appealModel;

    /**
     * Note model.
     *
     * @var Note
     */
    private Note $noteModel;

    /**
     * Payment model.
     *
     * @var Payment
     */
    private Payment $paymentModel;

    /**
     * Course model.
     *
     * @var Course
     */
    private Course $courseModel;

    /**
     * Notification model.
     *
     * @var Notification
     */
    private Notification $notificationModel;

    /**
     * NotificationService constructor.
     *
     * @param Guard         $auth
     * @param UrlGenerator  $url
     * @param Student       $student
     * @param Teacher       $teacher
     * @param Appeal        $appeal
     * @param Note          $note
     * @param Payment       $payment
     * @param Course        $course
     * @param Notification  $notification
     */
    public function __construct(
        Guard $auth,
        UrlGenerator $url,
        Student $student,
        Teacher $teacher,
        Appeal $appeal,
        Note $note,
        Payment $payment,
        Course $course,
        Notification $notification
    ) {
        $this->auth = $auth;
        $this->url = $url;
        $this->studentModel = $student;
        $this->teacherModel = $teacher;
        $this->appealModel = $appeal;
        $this->noteModel = $note;
        $this->paymentModel = $payment;
        $this->courseModel = $course;
        $this->notificationModel = $notification;
    }

    /**
     * --------------------------------------------------------------------
     * Public API – Notifications for students
     * --------------------------------------------------------------------
     */

    /**
     * Get all contextual notifications for a student.
     *
     * @param  int $studentId
     * @return array<int, array{
     *     id: string,
     *     title: string,
     *     message: string,
     *     time: string,
     *     icon: string,
     *     color: string,
     *     link: string
     * }>
     */
    public function getStudentNotifications(int $studentId): array
    {
        $student = $this->studentModel->findOrFail($studentId);
        $notifications = [];

        $this->addPendingAppealsNotification($student, $notifications);
        $this->addNewNotesNotification($student, $notifications);
        $this->addPaymentReminderNotification($student, $notifications);
        $this->addUpcomingCoursesNotification($student, $notifications);

        return $notifications;
    }

    /**
     * --------------------------------------------------------------------
     * Public API – Notifications for teachers
     * --------------------------------------------------------------------
     */

    /**
     * Get all contextual notifications for a teacher.
     *
     * @param  int $teacherId
     * @return array<int, array{
     *     id: string,
     *     title: string,
     *     message: string,
     *     time: string,
     *     icon: string,
     *     color: string,
     *     link: string
     * }>
     */
    public function getTeacherNotifications(int $teacherId): array
    {
        $teacher = $this->teacherModel->findOrFail($teacherId);
        $notifications = [];

        $this->addUpcomingClassesNotification($teacher, $notifications);
        $this->addPendingAppealsForTeacherNotification($teacher, $notifications);

        return $notifications;
    }

    /**
     * --------------------------------------------------------------------
     * Public API – Notifications for registration desk
     * --------------------------------------------------------------------
     */

    /**
     * Get notifications for the registration desk.
     *
     * @param  int $userId (unused, kept for backward compatibility)
     * @return array<int, array{
     *     id: string,
     *     title: string,
     *     message: string,
     *     time: string,
     *     icon: string,
     *     color: string,
     *     link: string
     * }>
     */
    public function getRegistrationNotifications(int $userId): array
    {
        $notifications = [];

        $this->addIncompleteRegistrationsNotification($notifications);
        $this->addPendingPaymentsNotification($notifications);

        return $notifications;
    }

    /**
     * --------------------------------------------------------------------
     * Public API – Notification management
     * --------------------------------------------------------------------
     */

    /**
     * Mark as read all appeal‑related notifications for a specific course.
     *
     * @param  int $courseId
     * @return void
     */
    public function markAsReadForCourseAppeals(int $courseId): void
    {
        $userId = $this->auth->id();

        if (!$userId) {
            throw new RuntimeException('No authenticated user.');
        }

        $this->notificationModel
            ->where('user_id', $userId)
            ->where('url', 'like', '%appeals%')
            ->where('url', 'like', "%$courseId%")
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
    }

    /**
     * Create a notification for a teacher.
     *
     * @param  int    $teacherId
     * @param  string $title
     * @param  string $message
     * @param  string $url
     * @return void
     */
    public function createTeacherNotification(int $teacherId, string $title, string $message, string $url): void
    {
        $this->notificationModel->create([
            'user_id' => $teacherId,
            'title'   => $title,
            'message' => $message,
            'url'     => $url,
            'read_at' => null,
        ]);
    }

    /**
     * --------------------------------------------------------------------
     * Private Builders – Student notifications
     * --------------------------------------------------------------------
     */

    /**
     * Add pending appeals notification if any.
     *
     * @param  Student $student
     * @param  array   &$notifications
     * @return void
     */
    private function addPendingAppealsNotification(Student $student, array &$notifications): void
    {
        $pendingAppeals = $this->appealModel
            ->where('student_id', $student->id)
            ->where('status', 'pending')
            ->count();

        if ($pendingAppeals > 0) {
            $notifications[] = [
                'id'      => 'appeal-pending',
                'title'   => 'Recours en attente',
                'message' => "Vous avez $pendingAppeals recours en attente de traitement",
                'time'    => now()->subHours(2)->diffForHumans(),
                'icon'    => 'exclamation-circle',
                'color'   => 'text-yellow-500',
                'link'    => $this->url->route('student.appeals.index'),
            ];
        }
    }

    /**
     * Add new published notes notification if any.
     *
     * @param  Student $student
     * @param  array   &$notifications
     * @return void
     */
    private function addNewNotesNotification(Student $student, array &$notifications): void
    {
        $newNotes = $this->noteModel
            ->where('student_id', $student->id)
            ->where('created_at', '>', now()->subDays(self::RECENT_NOTES_DAYS))
            ->count();

        if ($newNotes > 0) {
            $notifications[] = [
                'id'      => 'new-notes',
                'title'   => 'Nouvelles notes publiées',
                'message' => "$newNotes nouvelles notes ont été publiées",
                'time'    => now()->subHours(5)->diffForHumans(),
                'icon'    => 'document-text',
                'color'   => 'text-blue-500',
                'link'    => $this->url->route('student.results'),
            ];
        }
    }

    /**
     * Add payment reminder notification if a payment is due soon or overdue.
     *
     * @param  Student $student
     * @param  array   &$notifications
     * @return void
     */
    private function addPaymentReminderNotification(Student $student, array &$notifications): void
    {
        $nextPaymentDue = $this->paymentModel
            ->where('student_id', $student->id)
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->first();

        if (!$nextPaymentDue) {
            return;
        }

        $dueDate = Carbon::parse($nextPaymentDue->due_date);
        $daysLeft = (int) now()->diffInDays($dueDate, false); // negative if overdue

        if ($daysLeft < self::PAYMENT_REMINDER_DAYS) {
            $message = $daysLeft > 0
                ? "Paiement dû dans $daysLeft jours"
                : "Paiement en retard!";

            $notifications[] = [
                'id'      => 'payment-reminder',
                'title'   => 'Rappel de paiement',
                'message' => $message,
                'time'    => now()->subDays(1)->diffForHumans(),
                'icon'    => 'currency-dollar',
                'color'   => $daysLeft < 0 ? 'text-red-500' : 'text-green-500',
                'link'    => $this->url->route('student.payments.index'),
            ];
        }
    }

    /**
     * Add upcoming courses notification if any in the next 24 hours.
     *
     * @param  Student $student
     * @param  array   &$notifications
     * @return void
     */
    private function addUpcomingCoursesNotification(Student $student, array &$notifications): void
    {
        $upcomingCourses = $student->courses()
            ->whereHas('schedule', function ($query) {
                $query->where('start_time', '>', now())
                    ->where('start_time', '<', now()->addHours(self::UPCOMING_HOURS));
            })
            ->count();

        if ($upcomingCourses > 0) {
            $notifications[] = [
                'id'      => 'upcoming-courses',
                'title'   => 'Cours à venir',
                'message' => "Vous avez $upcomingCourses cours dans les 24h",
                'time'    => now()->subHours(3)->diffForHumans(),
                'icon'    => 'academic-cap',
                'color'   => 'text-indigo-500',
                'link'    => $this->url->route('student.schedule'),
            ];
        }
    }

    /**
     * --------------------------------------------------------------------
     * Private Builders – Teacher notifications
     * --------------------------------------------------------------------
     */

    /**
     * Add upcoming classes notification for a teacher.
     *
     * @param  Teacher $teacher
     * @param  array   &$notifications
     * @return void
     */
    private function addUpcomingClassesNotification(Teacher $teacher, array &$notifications): void
    {
        $upcomingClasses = $teacher->assignments()
            ->whereHas('schedule', function ($query) {
                $query->where('start_time', '>', now())
                    ->where('start_time', '<', now()->addHours(self::UPCOMING_HOURS));
            })
            ->count();

        if ($upcomingClasses > 0) {
            $notifications[] = [
                'id'      => 'upcoming-classes',
                'title'   => 'Cours à donner',
                'message' => "Vous avez $upcomingClasses cours dans les 24h",
                'time'    => now()->subHours(3)->diffForHumans(),
                'icon'    => 'academic-cap',
                'color'   => 'text-indigo-500',
                'link'    => $this->url->route('teacher.schedule'),
            ];
        }
    }

    /**
     * Add pending appeals notification for a teacher.
     *
     * @param  Teacher $teacher
     * @param  array   &$notifications
     * @return void
     */
    private function addPendingAppealsForTeacherNotification(Teacher $teacher, array &$notifications): void
    {
        $pendingAppeals = $this->appealModel
            ->whereHas('course', function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            })
            ->where('status', 'pending')
            ->count();

        if ($pendingAppeals > 0) {
            $notifications[] = [
                'id'      => 'appeals-to-review',
                'title'   => 'Recours à examiner',
                'message' => "$pendingAppeals recours en attente de votre examen",
                'time'    => now()->subHours(4)->diffForHumans(),
                'icon'    => 'exclamation-circle',
                'color'   => 'text-yellow-500',
                'link'    => $this->url->route('teacher.appeals.index'),
            ];
        }
    }

    /**
     * --------------------------------------------------------------------
     * Private Builders – Registration notifications
     * --------------------------------------------------------------------
     */

    /**
     * Add incomplete registrations notification.
     *
     * @param  array &$notifications
     * @return void
     */
    private function addIncompleteRegistrationsNotification(array &$notifications): void
    {
        $incompleteRegistrations = $this->studentModel
            ->whereDoesntHave('documents')
            ->count();

        if ($incompleteRegistrations > 0) {
            $notifications[] = [
                'id'      => 'incomplete-registrations',
                'title'   => 'Inscriptions incomplètes',
                'message' => "$incompleteRegistrations étudiants ont des documents manquants",
                'time'    => now()->subDays(1)->diffForHumans(),
                'icon'    => 'folder-open',
                'color'   => 'text-orange-500',
                'link'    => $this->url->route('registration.students.index'),
            ];
        }
    }

    /**
     * Add pending payments notification.
     *
     * @param  array &$notifications
     * @return void
     */
    private function addPendingPaymentsNotification(array &$notifications): void
    {
        $pendingPayments = $this->paymentModel
            ->where('status', 'pending')
            ->count();

        if ($pendingPayments > 0) {
            $notifications[] = [
                'id'      => 'pending-payments',
                'title'   => 'Paiements en attente',
                'message' => "$pendingPayments paiements nécessitent une validation",
                'time'    => now()->subHours(6)->diffForHumans(),
                'icon'    => 'currency-dollar',
                'color'   => 'text-green-500',
                'link'    => $this->url->route('registration.payments.index'),
            ];
        }
    }
}
