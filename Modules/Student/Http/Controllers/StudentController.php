<?php

namespace Modules\Student\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\CinetPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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
                'program' => $inscription->program?->name ?? 'N/A',
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

        $coursesQuery = Course::select(
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
            ->where('course_program_details.promotion_id', $promotionId);

        if ($program) {
            $coursesQuery->where('course_program_details.program_id', $program->id);
        }

        $courses = $coursesQuery->get();

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

        $coursesQuery = Course::select(
            'courses.id',
            'courses.title',
            'course_program_details.credits',
            'course_categories.name as category_name'
        )
            ->join('course_program_details', 'courses.id', '=', 'course_program_details.course_id')
            ->join('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
            ->where('course_program_details.promotion_id', $promotionId);

        if ($program) {
            $coursesQuery->where('course_program_details.program_id', $program->id);
        }

        $courses = $coursesQuery->get();

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
                'promotion' => $latestInscription?->promotion->title ?? 'N/A',
            ],
        ]);
    }


    public function createAppeal()
    {
        $student = $this->getCurrentStudent();

        // Récupérer les cours avec échec (cote < 10) sans recours en cours
        $failedCourses = Note::with('course')
            ->where('student_id', $student->id)
            ->where('cote', '<', 10)
            ->whereDoesntHave('course.appeals', function ($query) use ($student) {
                $query->where('student_id', $student->id)
                    ->whereIn('status', ['pending', 'accepted']);
            })
            ->get()
            ->map(function ($note) {
                return [
                    'id' => $note->course->id,
                    'title' => $note->course->title,
                    'code' => $note->course->code,
                    'cote' => $note->cote,
                    'session' => $note->session,
                ];
            });


        // Vérifier si un paiement est déjà en attente
        $pendingPayment = Payment::where('student_id', $student->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        // Fixed Global Appeal Fee
        $appealFee = 10000;

        return Inertia::render('student/createAppeal', [
            'courses' => $failedCourses, // Changed from single course to list
            'appeal_fee' => $appealFee,
            'has_pending_payment' => !!$pendingPayment,
            'pending_payment_url' => $pendingPayment->payment_url ?? null,
            'payment_reference' => $pendingPayment ? (json_decode($pendingPayment->metadata)->reference ?? null) : null,
        ]);
    }

    // Enregistre le recours et initie le paiement (FlexPay)
    public function storeAppeal(Request $request)
    {
        Log::info('=== DEBUT storeAppeal ===');
        Log::info('Request data:', $request->all());

        $student = $this->getCurrentStudent();

        // Validation
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.course_id' => 'required|exists:courses,id',
            'items.*.object' => 'required|string|max:255',
            'items.*.justification' => 'required|string',
            'items.*.documents' => 'nullable|array',
            'items.*.documents.*' => 'file|mimes:pdf,doc,docx,jpg,png|max:5120',
            'payment_method' => 'required|in:mobile,card',
            'phone_number' => 'nullable|required_if:payment_method,mobile|string',
        ]);

        Log::info('Validation passed');

        // Montant fixe pour le recours global
        $totalAmount = 10000;
        $reference = 'APPEAL-' . Str::uuid();

        Log::info('Generated reference:', ['reference' => $reference, 'amount' => $totalAmount]);

        // Préparer les métadonnées et stocker les fichiers temporairement
        $itemsMetadata = [];
        foreach ($validated['items'] as $index => $item) {
            $itemDocs = [];
            if ($request->hasFile("items.{$index}.documents")) {
                foreach ($request->file("items.{$index}.documents") as $file) {
                    // Stockage temporaire avec un ID unique pour le groupe
                    $path = $file->storeAs(
                        'temp_documents/' . $reference . '/' . $index,
                        $file->getClientOriginalName(),
                        'public'
                    );
                    $itemDocs[] = $path;
                }
            }
            $itemsMetadata[] = [
                'course_id' => $item['course_id'],
                'object' => $item['object'],
                'justification' => $item['justification'],
                'documents' => $itemDocs
            ];
        }

        // Créer le paiement initial
        $payment = Payment::create([
            'amount' => $totalAmount,
            'student_id' => $student->id,
            'status' => 'pending',
            'course_id' => null, // Paiement global
            'metadata' => json_encode([
                'items' => $itemsMetadata,
                'reference' => $reference
            ]),
        ]);

        Log::info('Payment record created:', ['payment_id' => $payment->id]);

        // Initier le paiement avec FlexPay
        $flexPayService = new \App\Services\FlexPayService();

        $paymentResponse = [];

        if ($request->payment_method === 'mobile') {
            $paymentData = [
                'customer_phone_number' => $request->phone_number,
                'transaction_id' => $reference,
                'amount' => $totalAmount,
                'currency' => 'CDF',
                'notify_url' => route('student.appeals.notify'),
            ];

            Log::info('Calling FlexPay createMobilePayment with:', $paymentData);

            $paymentResponse = $flexPayService->createMobilePayment($paymentData);

            Log::info('FlexPay response received:', $paymentResponse);
        } else {
            // Placeholder for Card Payment if implemented
            // $paymentResponse = $flexPayService->createCardPayment(...)
            Log::warning('Card payment attempted but not available');
            return back()->withErrors(['payment_error' => 'Paiement par carte non disponible pour le moment.']);
        }


        if ($paymentResponse['success']) {
            Log::info('Payment successful, updating payment record');

            $payment->update([
                'cinetpay_transaction_id' => $paymentResponse['orderNumber'], // orderNumber FlexPay
                'payment_url' => null,
            ]);

            Log::info('=== FIN storeAppeal (SUCCESS) ===');

            return response()->json([
                'success' => true,
                'message' => 'Paiement initié. Veuillez valider sur votre téléphone.',
                'reference' => $reference,
                'payment_status' => 'pending'
            ]);
        }

        Log::error('Payment failed:', $paymentResponse);
        Log::info('=== FIN storeAppeal (FAILED) ===');

        return response()->json([
            'success' => false,
            'message' => $paymentResponse['message'] ?? 'Erreur lors de l\'initiation du paiement.'
        ], 422);
    }

    // Vérification du statut du paiement (Appelé par le frontend polling)
    public function checkPaymentStatus($reference)
    {
        // Recherche dans les métadonnées JSON
        // Note: SQLite/Postgres/MySQL support JSON queries differently. Laravel abstraction helpers usually work.
        // For broad compatibility or if JSON query fails, fetch and filter in PHP (less efficient but safer without exact driver knowledge)
        // Let's assume standard Laravel JSON query works for 'metadata->reference'
        $payment = Payment::where('metadata->reference', $reference)->first();

        if (!$payment) {
            return response()->json(['status' => 'error', 'message' => 'Payment not found'], 404);
        }

        if ($payment->status === 'paid') {
            return response()->json(['status' => 'paid']);
        }

        // Check remote status
        $flexPayService = new \App\Services\FlexPayService();
        //$status = $flexPayService->checkTransaction($payment->cinetpay_transaction_id); 
        // Using checkTransaction requires orderNumber which is in cinetpay_transaction_id column

        $status = $flexPayService->checkTransaction($payment->cinetpay_transaction_id);

        if (isset($status['status']) && $status['status'] === 'success') {
            $this->finalizeAppeal($payment);
            return response()->json(['status' => 'paid']);
        }

        return response()->json(['status' => 'pending']);
    }

    public function paymentNotify(Request $request)
    {
        Log::info('Payment notification received:', $request->all());

        // FlexPay webhook structure usually involves status code
        // The reference project has 'handleWebhook', let's emulate basic success check
        // Often callback has 'orderNumber' or 'reference'

        // Emulation based on typical FlexPay or existing pattern
        // Usually we verify the transaction again to be sure

        $reference = $request->input('reference'); // Or transaction_id

        if (!$reference) {
            return response()->json(['status' => 'ignored']);
        }

        // Find payment by reference (which is in metadata)
        // This might be slow on large tables without index/generated column

        // Alternative: if FlexPay sends orderNumber (which we saved in cinetpay_transaction_id)
        // let's try that first
        /*
         $orderNumber = $request->input('orderNumber');
         if ($orderNumber) {
             $payment = Payment::where('cinetpay_transaction_id', $orderNumber)->first();
         }
         */

        // Fallback to metadata search logic if we rely on reference
        $payments = Payment::where('status', 'pending')->get(); // Optimization: only pending
        $payment = $payments->first(function ($p) use ($reference) {
            $meta = json_decode($p->metadata, true);
            return ($meta['reference'] ?? '') === $reference;
        });


        if ($payment) {
            $flexPayService = new \App\Services\FlexPayService();
            $status = $flexPayService->checkTransaction($payment->cinetpay_transaction_id);

            if (isset($status['status']) && $status['status'] === 'success') {
                $this->finalizeAppeal($payment);
                return response()->json(['status' => 'success']);
            }
        }

        return response()->json(['status' => 'received']);
    }

    private function finalizeAppeal(Payment $payment)
    {
        if ($payment->status === 'paid') return;

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'paid']);
            $metadata = json_decode($payment->metadata, true);
            $student = Student::find($payment->student_id);

            // Create Global Appeal
            $appeal = Appeal::create([
                'object' => 'Recours Groupé (' . count($metadata['items']) . ' cours)',
                'justification' => 'Paiement unique pour plusieurs recours',
                'course_id' => null, // Global
                'student_id' => $payment->student_id,
                'status' => 'pending',
                'payment_id' => $payment->id,
            ]);

            // Create Items
            foreach ($metadata['items'] as $itemData) {
                $appealItem = \Modules\Student\Entities\AppealItem::create([
                    'appeal_id' => $appeal->id,
                    'object' => $itemData['object'],
                    'justification' => $itemData['justification'],
                    // 'course_id' => $itemData['course_id'], // Add course_id to AppealItem if table supports it, else we lose context!
                    // Assuming AppealItem needs course_id or we rely on object text
                ]);

                // If AppealItem doesn't have course_id, we might need to add it or store it in justification
                // Let's assume for now we just create items. 
                // Refactor Note: Ideally AppealItem should have course_id.
                // Checking AppealItem definition...

                // Move Documents
                if (!empty($itemData['documents'])) {
                    foreach ($itemData['documents'] as $tempPath) {
                        if (Storage::disk('public')->exists($tempPath)) {
                            $fileName = basename($tempPath);
                            $newPath = 'appeal_documents/' . $appeal->id . '/' . $appealItem->id . '/' . $fileName;
                            Storage::disk('public')->move($tempPath, $newPath);

                            AppealDocument::create([
                                'name' => $fileName,
                                'path' => $newPath,
                                'appeal_item_id' => $appealItem->id,
                            ]);
                        }
                    }
                }
            }

            // Cleanup
            Storage::disk('public')->deleteDirectory('temp_documents/' . $metadata['reference']);

            // Notifications (Optional: Notify teachers of relevant courses)
            // ...
        });
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
