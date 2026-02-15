<?php

declare(strict_types=1);

namespace App\Services;

use App\Services\CinetPayService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Program;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\AppealDocument;
use Modules\Student\Entities\AppealItem;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;

class StudentService
{
    public function __construct(
        private CinetPayService $cinetPayService
    ) {}

    public function getDashboardStats(Student $student): array
    {
        $courses = $this->getFormattedCourses($student);
        $totalCredits = $courses->where('selected', true)->sum('credits');
        $averageGrade = Note::where('student_id', $student->id)->avg('cote') ?? 0;
        $progressPercentage = min(100, ($totalCredits / 30) * 100);

        return [
            'totalCourses'       => $courses->count(),
            'selectedCourses'    => $courses->where('selected', true)->count(),
            'totalCredits'       => $totalCredits,
            'averageGrade'       => round((float) $averageGrade, 2),
            'pendingAppeals'     => $student->appeals()->where('status', 'pending')->count(),
            'progressPercentage' => round($progressPercentage),
        ];
    }

    public function getFormattedCourses(Student $student)
    {
        $inscriptions = $student->inscriptions()
            ->with(['promotion', 'institution', 'academicYear'])
            ->latest()
            ->get();

        if ($inscriptions->isEmpty()) {
            return collect([]);
        }

        $allCourses = collect([]);
        $seenCourseIds = [];

        foreach ($inscriptions as $inscription) {
            $promotionId = $inscription->promotion_id;

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

            $courses = $coursesQuery->get();

            foreach ($courses as $course) {
                $uniqueKey = $course->id . '_' . $promotionId;
                if (!in_array($uniqueKey, $seenCourseIds)) {
                    $course->promotion_name = $inscription->promotion ? $inscription->promotion->title : 'N/A';
                    $course->academic_year = $inscription->academicYear ? $inscription->academicYear->title : 'Année inconnue';
                    $allCourses->push($course);
                    $seenCourseIds[] = $uniqueKey;
                }
            }
        }

        $selectedCourseIds = $student->courses()->pluck('courses.id')->toArray();
        $studentNotes = Note::where('student_id', $student->id)->get()->groupBy('course_id');

        return $allCourses->map(function ($course) use ($selectedCourseIds, $studentNotes) {
            $notes = $studentNotes[$course->id] ?? collect([]);
            $note = $notes->last();

            return [
                'id'            => $course->id,
                'title'         => $course->title,
                'credits'       => $course->credits,
                'cm'            => $course->cm,
                'td'            => $course->td,
                'tp'            => $course->tp,
                'isMandatory'   => $course->category_name === 'Obligatoire',
                'selected'      => in_array($course->id, $selectedCourseIds),
                'academic_year' => $course->academic_year,
                'promotion'     => $course->promotion_name ?? '',
                'note'          => $note ? [
                    'cote'      => $note->cote,
                    'session'   => $note->session,
                    'situation' => $note->situation
                ] : null,
                'progress'      => $this->calculateCourseProgress($course)
            ];
        });
    }

    private function calculateCourseProgress($course): int
    {
        return rand(30, 95);
    }

    public function getResults(Student $student)
    {
        return Note::with('course')
            ->where('student_id', $student->id)
            ->get()
            ->map(function ($note) use ($student) {
                $hasExistingAppeal = Appeal::where('student_id', $student->id)
                    ->where('course_id', $note->course_id)
                    ->whereIn('status', ['pending', 'accepted'])
                    ->exists();

                $canAppeal = $note->cote < 10 && !$hasExistingAppeal;

                return [
                    'course_id'   => $note->course_id,
                    'course'      => $note->course->title,
                    'cote'        => $note->cote,
                    'session'     => $note->session,
                    'observation' => $note->observation,
                    'situation'   => $note->situation,
                    'can_appeal'  => $canAppeal,
                ];
            });
    }

    public function getFailedCourses(Student $student)
    {
        return Note::with('course')
            ->where('student_id', $student->id)
            ->where('cote', '<', 10)
            ->whereDoesntHave('course.appeals', function ($query) use ($student) {
                $query->where('student_id', $student->id)
                    ->whereIn('status', ['pending', 'accepted']);
            })
            ->get()
            ->map(function ($note) {
                return [
                    'id'      => $note->course->id,
                    'title'   => $note->course->title,
                    'code'    => $note->course->code,
                    'cote'    => $note->cote,
                    'session' => $note->session,
                ];
            });
    }

    public function registerCourses(Student $student, array $courseIds): void
    {
        $student->courses()->sync($courseIds);
    }

    public function initiateAppealPayment(Student $student, array $items, string $phoneNumber = null): array
    {
        $totalAmount = 10000;
        $reference = 'APPEAL-' . Str::uuid();

        // Process items and temporary documents
        $itemsMetadata = [];
        foreach ($items as $index => $item) {
            $itemDocs = [];
            if (isset($item['documents']) && is_array($item['documents'])) {
                foreach ($item['documents'] as $file) {
                    $path = $file->storeAs(
                        'temp_documents/' . $reference . '/' . $index,
                        $file->getClientOriginalName(),
                        'public'
                    );
                    $itemDocs[] = $path;
                }
            }
            $itemsMetadata[] = [
                'course_id'     => $item['course_id'],
                'object'        => $item['object'],
                'justification' => $item['justification'],
                'documents'     => $itemDocs
            ];
        }

        Payment::create([
            'amount'     => $totalAmount,
            'student_id' => $student->id,
            'status'     => 'pending',
            'course_id'  => null,
            'metadata'   => json_encode([
                'items'     => $itemsMetadata,
                'reference' => $reference
            ]),
        ]);

        $cinetPayConfig = [
            'apikey'     => env('CINETPAY_API_KEY'),
            'site_id'    => env('CINETPAY_SITE_ID'),
            'notify_url' => route('student.appeals.notify'),
            'close_url'  => route('student.appeals.create'),
            'return_url' => route('student.appeals.create'),
        ];

        $customerInfo = $this->buildCustomerInfo($student, $phoneNumber);

        return [
            'success'         => true,
            'reference'       => $reference,
            'amount'          => $totalAmount,
            'cinetpay_config' => $cinetPayConfig,
            'customer_info'   => $customerInfo,
        ];
    }

    public function checkPaymentStatus(string $reference): string
    {
        $payment = Payment::where('metadata->reference', $reference)->first();

        if (!$payment) {
            return 'not_found';
        }

        if ($payment->status === 'paid') {
            return 'paid';
        }

        // Check remote status
        $status = $this->cinetPayService->getPaymentDetails($reference);

        if (isset($status['code']) && $status['code'] == '00') {
            $paymentStatus = $status['data']['status'] ?? '';
            if ($paymentStatus === 'ACCEPTED') {
                $this->finalizeAppeal($payment);
                return 'paid';
            }
        }

        return 'pending';
    }

    public function finalizeAppeal(Payment $payment): void
    {
        if ($payment->status === 'paid') return;

        DB::transaction(function () use ($payment) {
            $payment->update(['status' => 'paid']);
            $metadata = json_decode($payment->metadata, true);

            // Create Global Appeal
            $firstItem = $metadata['items'][0] ?? null;
            $courseId = $firstItem['course_id'] ?? null;

            $appeal = Appeal::create([
                'object'        => 'Recours Groupé (' . count($metadata['items']) . ' cours)',
                'justification' => 'Paiement unique pour plusieurs recours',
                'course_id'     => $courseId,
                'student_id'    => $payment->student_id,
                'status'        => 'pending',
                // 'payment_id'    => $payment->id, // Removed: column does not exist
            ]);

            // Create Items
            foreach ($metadata['items'] as $itemData) {
                $appealItem = AppealItem::create([
                    'appeal_id'     => $appeal->id,
                    'object'        => $itemData['object'],
                    'justification' => $itemData['justification'],
                    // 'course_id' => $itemData['course_id'], // Uncomment if AppealItem has course_id
                ]);

                // Move Documents
                if (!empty($itemData['documents'])) {
                    foreach ($itemData['documents'] as $tempPath) {
                        if (Storage::disk('public')->exists($tempPath)) {
                            $fileName = basename($tempPath);
                            $newPath = 'appeal_documents/' . $appeal->id . '/' . $appealItem->id . '/' . $fileName;
                            Storage::disk('public')->move($tempPath, $newPath);

                            AppealDocument::create([
                                'name'           => $fileName,
                                'path'           => $newPath,
                                'appeal_item_id' => $appealItem->id,
                            ]);
                        }
                    }
                }
            }

            if (isset($metadata['reference'])) {
                Storage::disk('public')->deleteDirectory('temp_documents/' . $metadata['reference']);
            }
        });
    }

    private function buildCustomerInfo(Student $student, ?string $phoneNumber): array
    {
        $customerName = !empty($student->name) ? $student->name : 'Etudiant';
        $customerSurname = !empty($student->firstname) ? $student->firstname : 'Nom';

        if (!isset($student->firstname)) {
            $parts = explode(' ', $student->name, 2);
            $customerName = $parts[0] ?? 'Etudiant';
            $customerSurname = $parts[1] ?? 'Nom';
        }

        return [
            'customer_name'         => substr($customerName, 0, 50),
            'customer_surname'      => substr($customerSurname, 0, 50),
            'customer_email'        => $student->email ?? 'student@esudelib.com',
            'customer_phone_number' => $phoneNumber ?? ($student->phone ?? '0000000000'),
            'customer_address'      => $student->address ?? 'Kinshasa',
            'customer_city'         => 'Kinshasa',
            'customer_country'      => 'CD',
            'customer_state'        => 'KN',
            'customer_zip_code'     => '00000',
        ];
    }
}
