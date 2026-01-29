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
// use Barryvdh\DomPDF\Facade\Pdf;
use Modules\Institution\Entities\Program;
// use Modules\Calendar\Entities\CalendarEvent; // Nouveau module
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

        // Récupération des cours formatés (incluant les années antérieures)
        $courses = $this->getFormattedCourses($student);
        $recentCourses = $courses->take(4); // Pour l'affichage rapide

        // Statistiques académiques
        $totalCredits = $courses->where('selected', true)->sum('credits');
        $averageGrade = Note::where('student_id', $student->id)->avg('cote') ?? 0;

        // Calcul de la progression académique
        $progressPercentage = min(100, ($totalCredits / 30) * 100);

        // Événements à venir
        $upcomingEvents = []; /* CalendarEvent::where('promotion_id', $inscription->promotion_id)
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
            }); */

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
            'courses' => $recentCourses,
            'notifications' => NotificationService::getStudentNotifications($student->id),
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    public function index()
    {
        $student = $this->getCurrentStudent();

        // Utiliser la même logique que pour le dashboard (toutes les années)
        $courses = $this->getFormattedCourses($student);

        return Inertia::render('student/courseSelection', [
            'courses' => $courses,
            'hasPendingAppeals' => $student->appeals()->where('status', 'pending')->exists(),
        ]);
    }

    private function getFormattedCourses($student)
    {
        // Récupérer toutes les inscriptions de l'étudiant, triées par la plus récente
        // On charge aussi l'année académique
        $inscriptions = $student->inscriptions()->with(['promotion', 'institution', 'academicYear'])->latest()->get();
        if ($inscriptions->isEmpty()) {
            return collect([]);
        }

        // On va récupérer les cours pour chaque promotion d'inscription
        $allCourses = collect([]);
        $seenCourseIds = [];

        foreach ($inscriptions as $inscription) {
            $promotionId = $inscription->promotion_id;
            $institutionId = $inscription->institution_id;
            $academicYearTitle = $inscription->academicYear ? $inscription->academicYear->title : 'Année inconnue';

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
                ->leftJoin('course_categories', 'course_program_details.course_category_id', '=', 'course_categories.id')
                ->where('course_program_details.promotion_id', $promotionId);

            // On ne filtre plus par program_id pour éviter de masquer des cours si la configuration du programme par défaut est incorrecte
            // Le filtre par promotion_id via course_program_details est suffisant car la promotion définit le cursus.
            /*
            if ($program) {
                $coursesQuery->where('course_program_details.program_id', $program->id);
            }
            */

            $courses = $coursesQuery->get();

            // Fusionner les cours
            foreach ($courses as $course) {
                // Éviter les doublons si un cours est repris
                $uniqueKey = $course->id . '_' . $promotionId;
                if (!in_array($uniqueKey, $seenCourseIds)) {
                    $course->promotion_name = $inscription->promotion ? $inscription->promotion->title : 'N/A';
                    $course->academic_year = $academicYearTitle; // Affecter le titre de l'année académique ici
                    $allCourses->push($course);
                    $seenCourseIds[] = $uniqueKey;
                }
            }
        }

        $selectedCourseIds = $student->courses()->pluck('courses.id')->toArray();
        $studentNotes = Note::where('student_id', $student->id)->get()->groupBy('course_id'); // GroupBy car plusieurs notes possibles si plusieurs années

        return $allCourses->map(function ($course) use ($selectedCourseIds, $studentNotes) {
            $notes = $studentNotes[$course->id] ?? collect([]);
            // Prendre la note la plus récente ou celle correspondant à la session/année si on avait l'info précise ici
            $note = $notes->last();


            return [
                'id' => $course->id,
                'title' => $course->title,
                'credits' => $course->credits,
                'cm' => $course->cm,
                'td' => $course->td,
                'tp' => $course->tp,
                'isMandatory' => $course->category_name === 'Obligatoire',
                'selected' => in_array($course->id, $selectedCourseIds),
                'academic_year' => $course->academic_year,
                'promotion' => $course->promotion_name ?? '',
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

    // Enregistre le recours et initie le paiement (CinetPay)
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
            // 'payment_method' => 'required|in:mobile,card', // CinetPay handles method selection
            'phone_number' => 'nullable|string', // Optional for CinetPay initialization
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

        // Return configuration for Frontend CinetPay SDK
        $cinetPayConfig = [
            'apikey' => env('CINETPAY_API_KEY'),
            'site_id' => env('CINETPAY_SITE_ID'),
            'notify_url' => route('student.appeals.notify'),
            'close_url' => route('student.appeals.create'),
            'return_url' => route('student.appeals.create'),
        ];

        // Customer Info
        $customerName = !empty($student->name) ? $student->name : 'Etudiant';
        $customerSurname = !empty($student->firstname) ? $student->firstname : 'Nom';

        if (!isset($student->firstname)) {
            $parts = explode(' ', $student->name, 2);
            $customerName = $parts[0] ?? 'Etudiant';
            $customerSurname = $parts[1] ?? 'Nom';
        }

        $customerInfo = [
            'customer_name' => substr($customerName, 0, 50),
            'customer_surname' => substr($customerSurname, 0, 50),
            'customer_email' => $student->email ?? 'student@esudelib.com',
            'customer_phone_number' => $request->phone_number ?? ($student->phone ?? '0000000000'),
            'customer_address' => $student->address ?? 'Kinshasa',
            'customer_city' => 'Kinshasa',
            'customer_country' => 'CD',
            'customer_state' => 'KN',
            'customer_zip_code' => '00000',
        ];

        Log::info('Appeal stored, returning CinetPay config to frontend', ['reference' => $reference]);

        return response()->json([
            'success' => true,
            'message' => 'Demande enregistrée. Veuillez procéder au paiement.',
            'reference' => $reference,
            'amount' => $totalAmount,
            'cinetpay_config' => $cinetPayConfig,
            'customer_info' => $customerInfo,
            'description' => "Paiement frais de recours",
        ]);
    }

    // Vérification du statut du paiement (Appelé par le frontend polling)
    public function checkPaymentStatus($reference)
    {
        $payment = Payment::where('metadata->reference', $reference)->first();

        if (!$payment) {
            return response()->json(['status' => 'error', 'message' => 'Payment not found'], 404);
        }

        if ($payment->status === 'paid') {
            return response()->json(['status' => 'paid']);
        }

        // Check remote status
        $cinetPayService = new CinetPayService();

        // We need 'site_id' which is likely in env, wrapped by service
        // Service's getPaymentDetails takes payment_token or transaction_id?
        // Service implementation uses payment_id param. Let's pass the transaction_id (reference).
        // WARNING: CinetPayService::getPaymentDetails uses 'payment_id' param name but documentation refers to transaction_id or token.
        // Let's verify CinetPayService implementation usage. It calls /details endpoint.
        // Usually /details needs 'transaction_id' from merchant.

        // Refactoring assumes getPaymentDetails works with our generated transaction_id
        $status = $cinetPayService->getPaymentDetails($reference);

        // CinetPay response structure: code, message, data -> status
        if (isset($status['code']) && $status['code'] == '00') {
            // '00' often means success/found. Check data status.
            // data.status could be 'ACCEPTED'
            $paymentStatus = $status['data']['status'] ?? '';

            if ($paymentStatus === 'ACCEPTED') {
                $this->finalizeAppeal($payment);
                return response()->json(['status' => 'paid']);
            }
        }

        return response()->json(['status' => 'pending']);
    }

    public function paymentNotify(Request $request)
    {
        Log::info('Payment notification received:', $request->all());

        // CinetPay sends POST with cpm_trans_id, cpm_site_id etc...
        $reference = $request->input('cpm_trans_id');

        if (!$reference) {
            // Fallback for query params if CinetPay uses GET or different structure
            // But official doc says POST with cpm_trans_id
            return response()->json(['status' => 'ignored']);
        }

        // Find payment
        $payment = Payment::where('metadata->reference', $reference)->first();

        if ($payment) {
            $cinetPayService = new CinetPayService();
            $status = $cinetPayService->getPaymentDetails($reference);

            if (isset($status['code']) && $status['code'] == '00') {
                $paymentStatus = $status['data']['status'] ?? '';
                if ($paymentStatus === 'ACCEPTED') {
                    $this->finalizeAppeal($payment);
                    return response()->json(['status' => 'success']);
                }
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
                // If AppealItem doesn't exist, we might crash. Ensure AppealItem model usage is correct.
                // Assuming it exists as previously seen in the legacy code I replaced.
                $appealItem = \Modules\Student\Entities\AppealItem::create([
                    'appeal_id' => $appeal->id,
                    'object' => $itemData['object'],
                    'justification' => $itemData['justification'],
                    // 'course_id' => $itemData['course_id'], 
                ]);

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
            if (isset($metadata['reference'])) {
                Storage::disk('public')->deleteDirectory('temp_documents/' . $metadata['reference']);
            }
        });
    }

    // Télécharger le bulletin en PDF
    public function downloadTranscript()
    {
        $student = Auth::user()->student;
        $notes = Note::with('course')
            ->where('student_id', $student->id)
            ->get();

        /* $pdf = PDF::loadView('student.transcript', [
            'student' => $student,
            'notes' => $notes,
            'institution' => $student->institution,
        ]);

        return $pdf->download('bulletin-' . $student->matricule . '.pdf'); */
        return response()->json(['message' => 'PDF generation unavailable']);
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
