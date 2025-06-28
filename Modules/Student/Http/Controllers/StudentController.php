<?php

namespace Modules\Student\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\CinetPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Institution\Entities\Course;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\AppealDocument;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;
use Barryvdh\DomPDF\Facade\Pdf;
use Modules\Institution\Entities\Program;
use Modules\Calendar\Entities\CalendarEvent; // Nouveau module
use App\Services\NotificationService;
use Modules\Teacher\Entities\Teacher;

class StudentController extends Controller
{

    public function dashboard()
    {
        $student = $this->getCurrentStudent();

        // Récupérer la dernière inscription
        $inscription = $student->inscriptions()->latest()->first();

        if (!$inscription) {
            abort(403, "Aucune inscription trouvée pour cet étudiant.");
        }

        // Récupération des cours formatés
        $courses = $this->getFormattedCourses($student)->take(4);

        // Statistiques académiques
        $totalCredits = $courses->where('selected', true)->sum('credits');
        $averageGrade = Note::where('student_id', $student->id)->avg('cote') ?? 0;

        // Calcul de la progression académique
        $progressPercentage = min(100, ($totalCredits / 30) * 100);

        // Événements à venir
        $upcomingEvents = CalendarEvent::where('promotion_id', $inscription->promotion_id)
            ->where('start_date', '>', now())
            ->orderBy('start_date')
            ->take(3)
            ->get()
            ->map(function ($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'date' => $event->start_date->format('d M H:i'),
                    'location' => $event->location,
                    'type' => $event->type,
                ];
            });

        return Inertia::render('Student/Dashboard', [
            'user' => [
                'name' => $student->name,
                'matricule' => $student->matricule,
                'program' => $inscription->program->name ?? 'N/A',
                'promotion' => $inscription->promotion->title ?? 'N/A',
            ],
            'stats' => [
                'totalCourses' => $courses->count(),
                'selectedCourses' => $courses->where('selected', true)->count(),
                'totalCredits' => $totalCredits,
                'averageGrade' => round($averageGrade, 2),
                'pendingAppeals' => $student->appeals()->where('status', 'pending')->count(),
                'progressPercentage' => round($progressPercentage),
            ],
            'courses' => $courses,
            'notifications' => NotificationService::getStudentNotifications($student->id),
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    public function index()
    {
        $student = $this->getCurrentStudent();
        $inscription = $student->inscriptions()->latest()->first();

        if (!$inscription) {
            abort(403, "Aucune inscription trouvée pour cet étudiant.");
        }

        $promotionId = $inscription->promotion_id;
        $institutionId = $inscription->institution_id;

        $program = Program::where('institution_id', $institutionId)->first();

        if (!$program) {
            abort(403, "Aucun programme trouvé pour cette institution.");
        }

        $courses = Course::select(
            'courses.id',
            'courses.title',
            'course_program_details.cm',
            'course_program_details.td',
            'course_program_details.tp',
            'course_program_details.credits',
            'course_categories.name as category_name'
        )
            ->join('course_program_details', 'courses.id', '=', 'course_program_details.course_id')
            ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
            ->where('course_program_details.program_id', $program->id)
            ->where('course_program_details.promotion_id', $promotionId)
            ->get();

        $selectedCourseIds = $student->courses()->pluck('courses.id')->toArray();
        $studentNotes = Note::where('student_id', $student->id)->get()->keyBy('course_id');

        return Inertia::render('student/courseSelection', [
            'courses' => $courses->map(function ($course) use ($selectedCourseIds, $studentNotes) {
                $note = $studentNotes[$course->id] ?? null;

                return [
                    'id' => $course->id,
                    'title' => $course->title,
                    'credits' => $course->credits,
                    'cm' => $course->cm,
                    'td' => $course->td,
                    'tp' => $course->tp,
                    'isMandatory' => $course->category_name === 'Obligatoire',
                    'selected' => in_array($course->id, $selectedCourseIds),
                    'note' => $note ? [
                        'cote' => $note->cote,
                        'session' => $note->session,
                        'situation' => $note->situation
                    ] : null
                ];
            }),
            'hasPendingAppeals' => $student->appeals()->where('status', 'pending')->exists(),
        ]);
    }

    private function getFormattedCourses($student)
    {
        $inscription = $student->inscriptions()->latest()->first();
        $promotionId = $inscription->promotion_id;
        $institutionId = $inscription->institution_id;

        $program = Program::where('institution_id', $institutionId)->first();

        if (!$program) {
            return collect();
        }

        $courses = Course::select(
            'courses.id',
            'courses.title',
            'course_program_details.credits',
            'course_categories.name as category_name'
        )
            ->join('course_program_details', 'courses.id', '=', 'course_program_details.course_id')
            ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
            ->where('course_program_details.program_id', $program->id)
            ->where('course_program_details.promotion_id', $promotionId)
            ->get();

        $selectedCourseIds = $student->courses()->pluck('courses.id')->toArray();
        $studentNotes = Note::where('student_id', $student->id)->get()->keyBy('course_id');

        return $courses->map(function ($course) use ($selectedCourseIds, $studentNotes) {
            $note = $studentNotes[$course->id] ?? null;

            return [
                'id' => $course->id,
                'title' => $course->title,
                'credits' => $course->credits,
                'isMandatory' => $course->category_name === 'Obligatoire',
                'selected' => in_array($course->id, $selectedCourseIds),
                'note' => $note ? [
                    'cote' => $note->cote,
                    'session' => $note->session,
                    'situation' => $note->situation
                ] : null,
                'progress' => $this->calculateCourseProgress($course)
            ];
        });
    }

    private function calculateCourseProgress($course)
    {
        // Logique de calcul de progression (exemple simplifié)
        // Dans une vraie application, utiliser les données de progression réelles
        return rand(30, 95);
    }

    // Enregistre les cours sélectionnés par l'étudiant
    public function storeCourses(Request $request)
    {
        $student = $this->getCurrentStudent();
        $courseIds = $request->input('selectedCourseIds', []);

        // Synchroniser les cours (supprime les anciens et ajoute les nouveaux)
        $student->courses()->sync($courseIds);

        return redirect()->route('student.courses.index')->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Vos cours ont été enregistrés avec succès !',
            ],
        ]);
    }

    // Affiche les résultats de l'étudiant (si publiés)
    public function results()
    {
        $student = $this->getCurrentStudent();
        $latestInscription = $student->inscriptions()->latest()->first();

        $notes = Note::with('course')
            ->where('student_id', $student->id)
            ->get()
            ->map(function ($note) use ($student) {
                $hasExistingAppeal = Appeal::where('student_id', $student->id)
                    ->where('course_id', $note->course_id)
                    ->whereIn('status', ['pending', 'accepted'])
                    ->exists();

                $canAppeal = $note->cote < 10 && !$hasExistingAppeal;

                return [
                    'course_id' => $note->course_id, // Nouveau champ
                    'course' => $note->course->title,
                    'cote' => $note->cote,
                    'session' => $note->session,
                    'observation' => $note->observation,
                    'situation' => $note->situation,
                    'can_appeal' => $canAppeal, // Nouveau champ
                ];
            });

        return Inertia::render('student/results', [
            'notes' => $notes,
            'student' => [ // Ajout des données étudiant
                'name' => $student->name,
                'matricule' => $student->matricule,
                'promotion' => $latestInscription->promotion->title ?? 'N/A',
            ],
        ]);
    }


    // Affiche le formulaire de recours pour un cours spécifique
    public function createAppeal(Course $course)
    {
        $student = Auth::user()->student;
        // Vérifier si l'étudiant est inscrit à ce cours et a une note
        $note = Note::where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->first();

        if (!$note) {
            abort(403, "Vous n'êtes pas inscrit à ce cours ou la note n'est pas disponible.");
        }

        return Inertia::render('student/createAppeal', [
            'course' => $course->only('id', 'title', 'code'),
            'note' => $note->only('cote', 'session', 'situation'),
            'appeal_fee' => 10000, // Frais de recours
        ]);
    }

    // Enregistre le recours et initie le paiement
    public function storeAppeal(Request $request, Course $course, CinetPayService $cinetPay)
    {
        $student = $this->getCurrentStudent();
        $note = Note::where('student_id', $student->id)
            ->where('course_id', $course->id)
            ->firstOrFail();

        // Validation
        $request->validate([
            'objects' => 'required|array|min:1',
            'objects.*' => 'string|max:255',
            'justification' => 'required|string',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,doc,docx,jpg,png|max:2048',
        ]);

        // Créer le recours
        $appeal = Appeal::create([
            'objects' => json_encode($request->objects),
            'justification' => $request->justification,
            'course_id' => $course->id,
            'student_id' => $student->id,
            'status' => 'pending',
        ]);

        // Enregistrer les documents
        if ($request->hasFile('documents')) {
            foreach ($request->file('documents') as $file) {
                $path = $file->store('appeal_documents', 'public');
                AppealDocument::create([
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'appeal_id' => $appeal->id,
                ]);
            }
        }

        // Notification à l'enseignant titulaire
        $teacher = $course->teacher; // Supposons que la relation est définie dans le modèle Course
        if ($teacher) {
            NotificationService::createTeacherNotification(
                $teacher->id,
                'Nouveau recours - ' . $course->title,
                "L'étudiant {$student->name} a déposé un recours concernant votre cours",
                route('teacher.appeals', $course)
            );
        }

        // Créer un paiement pour le recours (frais de recours)
        $payment = Payment::create([
            'amount' => 10000, // 10000 CDF par exemple
            'student_id' => $student->id,
            'status' => 'pending',
            'appeal_id' => $appeal->id,
        ]);

        // Initier le paiement avec CinetPay
        $paymentParams = [
            'transaction_id' => Str::uuid(),
            'amount' => $payment->amount,
            'currency' => 'CDF',
            'customer_surname' => $student->name,
            'customer_name' => $student->name,
            'description' => "Frais de recours pour le cours: {$course->title}",
            'customer_email' => Auth::user()->email,
            'customer_phone_number' => $student->phone,
            'customer_address' => $student->address ?? 'Non renseigné',
            'customer_city' => $student->city ?? 'Non renseigné',
            'customer_country' => 'CI',
            'customer_state' => $student->region ?? 'Non renseigné',
            'customer_zip_code' => $student->postal_code ?? '0000',
        ];

        $paymentResponse = $cinetPay->createPayment($paymentParams);

        if (!$paymentResponse || $paymentResponse['code'] !== '00') {
            Log::error('CinetPay payment error: ' . json_encode($paymentResponse));
            return redirect()->back()->with([
                'flash' => [
                    'type' => 'error',
                    'message' => 'Erreur lors de l\'initiation du paiement. Veuillez réessayer plus tard.'
                ]
            ]);
        }
        // Sauvegarder l'ID de paiement CinetPay
        $payment->update([
            'cinetpay_transaction_id' => $paymentResponse['data']['payment_token'] ?? null,
        ]);

        // Vérifier que l'URL de paiement existe avant de rediriger
        if (isset($paymentResponse['data']['payment_url'])) {
            return response()->json([
                'redirect_url' => $paymentResponse['data']['payment_url']
            ], 303);
        }

        // Si l'URL n'est pas présente, afficher une erreur
        return redirect()->back()->with([
            'flash' => [
                'type' => 'error',
                'message' => 'Impossible de récupérer l\'URL de paiement. Veuillez réessayer plus tard.'
            ]
        ]);
    }

    // Télécharger le bulletin en PDF
    public function downloadTranscript()
    {
        $student = Auth::user()->student;
        $notes = Note::with('course')
            ->where('student_id', $student->id)
            ->get();

        $pdf = PDF::loadView('student.transcript', [
            'student' => $student,
            'notes' => $notes,
            'institution' => $student->institution,
        ]);

        return $pdf->download('bulletin-' . $student->matricule . '.pdf');
    }

    protected function getCurrentStudent()
    {
        $user = Auth::user();

        // Charger explicitement les relations
        $user->load('institutions', 'student');

        if (!$user->student) {
            abort(403, "Aucun profil étudiant associé à votre compte");
        }

        return $user->student;
    }
}
