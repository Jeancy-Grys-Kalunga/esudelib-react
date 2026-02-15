<?php

declare(strict_types=1);

namespace Modules\Student\Http\Controllers;

use App\Services\FlexPayService;
use App\Http\Controllers\Controller;
use App\Services\CinetPayService;
use App\Services\StudentService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Modules\Institution\Entities\Institution;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;

class StudentController extends Controller
{
    public function __construct(
        private StudentService $studentService,
        private NotificationService $notificationService,
        private CinetPayService $cinetPayService
    ) {}

    public function dashboard()
    {
        $student = $this->getCurrentStudent();
        $inscription = $student->inscriptions()->latest()->first();

        if (!$inscription) {
            abort(403, "Aucune inscription trouvée pour cet étudiant.");
        }

        $stats = $this->studentService->getDashboardStats($student);
        $courses = $this->studentService->getFormattedCourses($student);
        $recentCourses = $courses->take(4);

        // Notification service usage update if needed, currently static in original code but injected here
        // The original code used NotificationService::getStudentNotifications($student->id)
        // Check if NotificationService methods are static or instance. 
        // Based on previous turn (NotificationService.php), they are instance methods now.

        $notifications = $this->notificationService->getStudentNotifications($student->id);

        return Inertia::render('Student/Dashboard', [
            'user' => [
                'name'      => $student->name,
                'matricule' => $student->matricule,
                'program'   => $inscription->program?->name ?? 'N/A',
                'promotion' => $inscription->promotion->title ?? 'N/A',
            ],
            'stats'         => $stats,
            'courses'       => $recentCourses,
            'notifications' => $notifications,
            'upcomingEvents' => [], // Placeholder/To implemented
        ]);
    }

    public function index()
    {
        $student = $this->getCurrentStudent();
        $courses = $this->studentService->getFormattedCourses($student);

        return Inertia::render('student/courseSelection', [
            'courses'           => $courses,
            'hasPendingAppeals' => $student->appeals()->where('status', 'pending')->exists(),
        ]);
    }

    public function storeCourses(Request $request)
    {
        $student = $this->getCurrentStudent();
        $courseIds = $request->input('selectedCourseIds', []);

        $this->studentService->registerCourses($student, $courseIds);

        return redirect()->route('student.courses.index')->with([
            'flash' => [
                'type'    => 'success',
                'message' => 'Vos cours ont été enregistrés avec succès !',
            ],
        ]);
    }

    public function results()
    {
        $student = $this->getCurrentStudent();
        $latestInscription = $student->inscriptions()->latest()->first();

        // This method in service returns formatted data directly, wait, I copied getResults logic which returns array.
        // But original code had map(). The service logic I wrote:
        // returns collection of mapped data.

        $notes = $this->studentService->getResults($student); // Actually it was named getResults in my mental model but I implemented it?
        // Let's check service content I just wrote.
        // public function getResults(Student $student) { ... } -> mapped collection. Correct.

        return Inertia::render('student/results', [
            'notes'   => $notes,
            'student' => [
                'name'      => $student->name,
                'matricule' => $student->matricule,
                'promotion' => $latestInscription?->promotion->title ?? 'N/A',
            ],
        ]);
    }

    public function createAppeal()
    {
        $student = $this->getCurrentStudent();
        $failedCourses = $this->studentService->getFailedCourses($student);

        $pendingPayment = Payment::where('student_id', $student->id)
            ->where('status', 'pending')
            ->latest()
            ->first();

        $appealFee = 10000;

        return Inertia::render('student/createAppeal', [
            'courses'             => $failedCourses,
            'appeal_fee'          => $appealFee,
            'has_pending_payment' => !!$pendingPayment,
            'pending_payment_url' => $pendingPayment->payment_url ?? null,
            'payment_reference'   => $pendingPayment ? (json_decode($pendingPayment->metadata)->reference ?? null) : null,
        ]);
    }

    public function storeAppeal(Request $request)
    {
        Log::info('=== DEBUT storeAppeal ===');
        Log::info('Request data:', $request->all());

        $student = $this->getCurrentStudent();

        $validated = $request->validate([
            'items'                 => 'required|array|min:1',
            'items.*.course_id'     => 'required|exists:courses,id',
            'items.*.object'        => 'required|string|max:255',
            'items.*.justification' => 'required|string',
            'items.*.documents'     => 'nullable|array',
            'items.*.documents.*'   => 'file|mimes:pdf,doc,docx,jpg,png|max:5120',
            'phone_number'          => 'nullable|string',
        ]);

        $result = $this->studentService->initiateAppealPayment($student, $validated['items'], $request->phone_number);

        return response()->json([
            'success'         => true,
            'message'         => 'Demande enregistrée. Veuillez procéder au paiement.',
            'reference'       => $result['reference'],
            'amount'          => $result['amount'],
            'cinetpay_config' => $result['cinetpay_config'],
            'customer_info'   => $result['customer_info'],
            'description'     => "Paiement frais de recours",
        ]);
    }

    public function checkPaymentStatus($reference)
    {
        // Use service method which handles DB check and Remote check
        // Wait, I didn't implement checkPaymentStatus in service to return JSON response, but status string.

        $status = $this->studentService->checkPaymentStatus($reference);

        if ($status === 'not_found') {
            return response()->json(['status' => 'error', 'message' => 'Payment not found'], 404);
        }

        return response()->json(['status' => $status]);
    }

    public function paymentNotify(Request $request)
    {
        Log::info('Payment notification received:', $request->all());

        $reference = $request->input('cpm_trans_id');

        if (!$reference) {
            return response()->json(['status' => 'ignored']);
        }

        // We can reuse checkPaymentStatus logic from service, but it returns status string.
        // We just need to trigger the check/finalize.
        $status = $this->studentService->checkPaymentStatus($reference);

        return response()->json(['status' => $status === 'paid' ? 'success' : 'received']);
    }

    public function downloadTranscript()
    {
        return response()->json(['message' => 'PDF generation unavailable']);
    }

    public function createPayment(Request $request, CinetPayService $cinetPayService)
    {
        $student = $this->getCurrentStudent();

        $paymentData = [
            'transaction_id' => 'PAY-' . time() . '-' . rand(1000, 9999),
            'amount' => $request->amount,
            'currency' => $request->currency ?? 'XOF',
            'customer_name' => $student->name ?? 'Student',
            'description' => $request->description ?? 'Paiement frais',
            'notify_url' => route('payments.webhook'),
            'return_url' => url('/success'),
            'cancel_url' => url('/cancel'),
        ];

        $result = $cinetPayService->initializePayment($paymentData);

        if ($result['success']) {
            Payment::create([
                'student_id' => $student->id,
                'amount' => $request->amount,
                'status' => 'pending',
                'metadata' => json_encode(['transaction_id' => $paymentData['transaction_id']])
            ]);
        }

        return response()->json($result);
    }

    public function getPaymentStatus($id, CinetPayService $cinetPayService)
    {
        $payment = Payment::findOrFail($id);
        $metadata = json_decode($payment->metadata, true);
        $transactionId = $metadata['transaction_id'] ?? null;

        if ($transactionId) {
            $result = $cinetPayService->verifyPayment($transactionId);
            if ($result['success'] && $result['status'] === 'ACCEPTED') {
                $payment->update(['status' => 'paid']);
            }
            return response()->json($result);
        }

        return response()->json(['status' => 'error', 'message' => 'No transaction ID found'], 404);
    }

    public function paymentWebhook(Request $request, CinetPayService $cinetPayService)
    {
        $transactionId = $request->cpm_trans_id;
        $payment = Payment::where('metadata', 'LIKE', '%' . $transactionId . '%')->first();
        if ($payment) {
            $payment->update(['status' => 'paid']);
            return response()->json(['status' => 'received']);
        }
        return response()->json(['status' => 'error'], 404);
    }

    public function paymentHistory()
    {
        $student = $this->getCurrentStudent();
        $payments = $student->payments;
        return response()->json(['payments' => $payments]);
    }

    public function paymentReceipt($id)
    {
        return response('PDF Content', 200)->header('Content-Type', 'application/pdf');
    }

    public function createProfile(Request $request)
    {
        $user = Auth::user();
        Student::create([
            'user_id' => $user->id,
            'matricule' => $request->matricule,
            'phone' => $request->phone,
            'institution_id' => Institution::first()?->id ?? 1,
            'name' => $user->name,
            'email' => $user->email,
            'gendre' => 'M', // Default or from request
            'date_of_birth' => '2000-01-01', // Default or from request
            'provenance_region' => 'Kinshasa',
            'provenance_localite' => 'Kinshasa',
        ]);
        return response()->json(['success' => true]);
    }

    public function storeEnrollment(Request $request)
    {
        $student = $this->getCurrentStudent();
        $student->inscriptions()->create([
            'promotion_id' => $request->promotion_id,
            'institution_id' => $request->institution_id,
            'academic_year_id' => $request->academic_year_id,
        ]);
        return response()->json(['success' => true]);
    }

    public function registrationPayment(Request $request)
    {
        $student = $this->getCurrentStudent();
        Payment::create([
            'student_id' => $student->id,
            'amount' => $request->amount,
            'status' => 'pending',
        ]);
        return response()->json(['success' => true]);
    }

    public function uploadDocuments(Request $request)
    {
        $student = $this->getCurrentStudent();

        if ($request->hasFile('diploma')) {
            $request->file('diploma')->storeAs('student_documents/' . $student->id, 'diploma.pdf', 'public');
        }

        if ($request->hasFile('photo')) {
            $request->file('photo')->storeAs('student_documents/' . $student->id, 'photo.jpg', 'public');
        }

        return response()->json(['success' => true]);
    }

    protected function getCurrentStudent(): Student
    {
        $user = Auth::user();
        $user->load('institutions', 'student');

        if (!$user->student) {
            abort(403, "Aucun profil étudiant associé à votre compte");
        }

        return $user->student;
    }
}
