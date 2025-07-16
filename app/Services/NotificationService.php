<?php

namespace App\Services;

use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Modules\Student\Entities\Student;
use Modules\Teacher\Entities\Teacher;
use Modules\Student\Entities\Note;
use Modules\Course\Entities\Course;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\Payment;

class NotificationService
{
    public static function getStudentNotifications(int $studentId): array
    {
        $notifications = [];
        $student = Student::findOrFail($studentId);
        
        // 1. Recours en attente
        $pendingAppeals = Appeal::where('student_id', $studentId)
            ->where('status', 'pending')
            ->count();

        if ($pendingAppeals > 0) {
            $notifications[] = [
                'id' => 'appeal-pending',
                'title' => 'Recours en attente',
                'message' => "Vous avez $pendingAppeals recours en attente de traitement",
                'time' => now()->subHours(2)->diffForHumans(),
                'icon' => 'exclamation-circle',
                'color' => 'text-yellow-500',
                'link' => route('student.appeals.index')
            ];
        }

        // 2. Nouvelles notes publiées
        $newNotes = Note::where('student_id', $studentId)
            ->where('created_at', '>', now()->subDays(3))
            ->count();

        if ($newNotes > 0) {
            $notifications[] = [
                'id' => 'new-notes',
                'title' => 'Nouvelles notes publiées',
                'message' => "$newNotes nouvelles notes ont été publiées",
                'time' => now()->subHours(5)->diffForHumans(),
                'icon' => 'document-text',
                'color' => 'text-blue-500',
                'link' => route('student.results')
            ];
        }

        // 3. Notification de paiement
        $nextPaymentDue = $student->payments()
            ->where('status', 'pending')
            ->orderBy('due_date')
            ->first();

        if ($nextPaymentDue) {
            $dueDate = Carbon::parse($nextPaymentDue->due_date);
            $daysLeft = now()->diffInDays($dueDate, false);
            
            if ($daysLeft < 7) {
                $message = $daysLeft > 0 
                    ? "Paiement dû dans $daysLeft jours" 
                    : "Paiement en retard!";

                $notifications[] = [
                    'id' => 'payment-reminder',
                    'title' => 'Rappel de paiement',
                    'message' => $message,
                    'time' => now()->subDays(1)->diffForHumans(),
                    'icon' => 'currency-dollar',
                    'color' => $daysLeft < 0 ? 'text-red-500' : 'text-green-500',
                    'link' => route('student.payments.index')
                ];
            }
        }

        // 4. Cours à venir dans les 24h
        $upcomingCourses = $student->courses()
            ->whereHas('schedule', function ($query) {
                $query->where('start_time', '>', now())
                      ->where('start_time', '<', now()->addDay());
            })
            ->count();

        if ($upcomingCourses > 0) {
            $notifications[] = [
                'id' => 'upcoming-courses',
                'title' => 'Cours à venir',
                'message' => "Vous avez $upcomingCourses cours dans les 24h",
                'time' => now()->subHours(3)->diffForHumans(),
                'icon' => 'academic-cap',
                'color' => 'text-indigo-500',
                'link' => route('student.schedule')
            ];
        }

        return $notifications;
    }

    public static function getTeacherNotifications(int $teacherId): array
    {
        $teacher = Teacher::findOrFail($teacherId);
        $notifications = [];

        // 1. Cours à donner dans les 24h
        $upcomingClasses = $teacher->assignments()
            ->whereHas('schedule', function ($query) {
                $query->where('start_time', '>', now())
                      ->where('start_time', '<', now()->addDay());
            })
            ->count();

        if ($upcomingClasses > 0) {
            $notifications[] = [
                'id' => 'upcoming-classes',
                'title' => 'Cours à donner',
                'message' => "Vous avez $upcomingClasses cours dans les 24h",
                'time' => now()->subHours(3)->diffForHumans(),
                'icon' => 'academic-cap',
                'color' => 'text-indigo-500',
                'link' => route('teacher.schedule')
            ];
        }

        // 2. Recours à traiter
        $pendingAppeals = Appeal::whereHas('course', function ($query) use ($teacherId) {
                $query->where('teacher_id', $teacherId);
            })
            ->where('status', 'pending')
            ->count();

        if ($pendingAppeals > 0) {
            $notifications[] = [
                'id' => 'appeals-to-review',
                'title' => 'Recours à examiner',
                'message' => "$pendingAppeals recours en attente de votre examen",
                'time' => now()->subHours(4)->diffForHumans(),
                'icon' => 'exclamation-circle',
                'color' => 'text-yellow-500',
                'link' => route('teacher.appeals.index')
            ];
        }

        return $notifications;
    }

    public static function getRegistrationNotifications(int $userId): array
    {
        $notifications = [];
        
        // 1. Inscriptions incomplètes
        $incompleteRegistrations = Student::whereDoesntHave('documents')
            ->count();

        if ($incompleteRegistrations > 0) {
            $notifications[] = [
                'id' => 'incomplete-registrations',
                'title' => 'Inscriptions incomplètes',
                'message' => "$incompleteRegistrations étudiants ont des documents manquants",
                'time' => now()->subDays(1)->diffForHumans(),
                'icon' => 'folder-open',
                'color' => 'text-orange-500',
                'link' => route('registration.students.index')
            ];
        }

        // 2. Paiements en attente
        $pendingPayments = Payment::where('status', 'pending')->count();

        if ($pendingPayments > 0) {
            $notifications[] = [
                'id' => 'pending-payments',
                'title' => 'Paiements en attente',
                'message' => "$pendingPayments paiements nécessitent une validation",
                'time' => now()->subHours(6)->diffForHumans(),
                'icon' => 'currency-dollar',
                'color' => 'text-green-500',
                'link' => route('registration.payments.index')
            ];
        }

        return $notifications;
    }

    /**
     * Marque comme lues les notifications de recours pour un cours spécifique
     */
    public static function markAsReadForCourseAppeals($courseId)
    {
        $userId = Auth::id();
        Notification::where('user_id', $userId)
            ->where('url', 'like', '%appeals%') // Filtre par type "recours"
            ->where('url', 'like', "%$courseId%") // Filtre par cours spécifique
            ->whereNull('read_at') // Seulement les non lues
            ->update(['read_at' => now()]);
    }

    /**
     * Crée une notification pour l'enseignant
     */
    public static function createTeacherNotification($teacherId, $title, $message, $url)
    {
        Notification::create([
            'user_id' => $teacherId,
            'title' => $title,
            'message' => $message,
            'url' => $url,
            'read_at' => null
        ]);
    }
}