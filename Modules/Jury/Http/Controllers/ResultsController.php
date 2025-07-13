<?php

namespace Modules\Jury\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use App\Models\User;
use App\Services\TwilioService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Maatwebsite\Excel\Facades\Excel;
use Modules\Jury\Exports\ResultsExport;
use Modules\RegistrationDesk\Entities\Inscription;

class ResultsController extends Controller
{
    public function index(Request $request)
    {

    //    $student_Id = Student::where('id', 3)->first();

    //     $history = $this->getStudentAcademicHistory($student_Id);
 
    //     dd($history);

        $context = $request->session()->get('jury_context');
        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->pluck('credits', 'course_id')
            ->toArray();

        $allTeachingUnits = UnitsTeaching::with(['courses' => function ($query) use ($context) {
            $query->with(['notes' => function ($q) use ($context) {
                $q->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id'])
                    ->with('student');
            }]);
        }])->get();

        $allCourses = $allTeachingUnits->flatMap(function ($unit) {
            return $unit->courses;
        })->each(function ($course) use ($coursesWithCredits) {
            $course->credit = $coursesWithCredits[$course->id] ?? 0;
        });

        $gridData = [
            'courses' => $allCourses->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'credit' => $c->credit
            ]),
            'students' => []
        ];

        $students = Student::with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])->paginate(10);

        $students->getCollection()->transform(function ($student) use ($coursesWithCredits, &$gridData) {
            $sommeNotesPonderees = 0;
            $totalCredits = 0;
            $reserve = 0;
            $need = 0;

            foreach ($student->notes as $note) {
                $credits = $coursesWithCredits[$note->course_id] ?? 0;

                if ($note->cote !== null) {
                    $sommeNotesPonderees += $note->cote * $credits;
                    $totalCredits += $credits;
                }

                if ($note->cote > 10) {
                    $reserve += ($note->cote - 10);
                } elseif ($note->cote < 10 && $note->cote !== null) {
                    $need += (10 - $note->cote);
                }
            }

            $student->average = $totalCredits > 0
                ? round($sommeNotesPonderees / $totalCredits, 2)
                : 0;

            $student->reserve = round($reserve, 2);
            $student->need = round($need, 2);

            $gridStudent = [
                'id' => $student->id,
                'name' => $student->name,
                'matricule' => $student->matricule,
                'average' => $student->average,
                'reserve' => $student->reserve,
                'need' => $student->need,
                'notes' => []
            ];

            // Seulement les cours suivis par l'étudiant
            foreach ($student->notes as $note) {
                $gridStudent['notes'][$note->course_id] = [
                    'id' => $note->id,
                    'value' => $note->cote,
                    'is_submitted' => $note->is_submitted
                ];
            }

            $gridData['students'][] = $gridStudent;
            return $student;
        });

        return Inertia::render('jury/results', [
            'students' => $students,
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'gridData' => $gridData,
        ]);
    }

    public function saveGrades(Request $request)
    {
        $request->validate([
            'changes' => 'sometimes|array',
            'massChanges' => 'sometimes|array',
        ]);

        DB::beginTransaction();
        $context = $request->session()->get('jury_context');

        try {
            foreach ($request->changes as $change) {
                if ($change['isNew']) {
                    Note::create([
                        'student_id' => $change['studentId'],
                        'course_id' => $change['courseId'],
                        'cote' => $change['value'],
                        'academic_year_id' => $context['academic_year_id'],
                        'promotion_id' => $context['promotion_id']
                    ]);
                } else {
                    $note = Note::find($change['id']);
                    if ($note) {
                        $note->update(['cote' => $change['value']]);
                    }
                }
            }

            foreach ($request->massChanges as $massChange) {
                Note::where('course_id', $massChange['courseId'])
                    ->whereNotNull('cote')
                    ->update([
                        'cote' => DB::raw("LEAST(cote + {$massChange['points']}, 20)")
                    ]);
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Modifications sauvegardées']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur sauvegarde notes: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }


    public function publishResults(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $promotion = Promotion::find($context['promotion_id']);

        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->pluck('credits', 'course_id')
            ->toArray();

        $students = Student::with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])->get();

        foreach ($students as $student) {
            if ($student->phone) {
                $message = "L'étudiant(e): " . $student->name . "  Vos résultats :\n";

                $sommeNotesPonderees = 0;
                $totalCredits = 0;

                foreach ($student->notes as $note) {
                    $message .= "{$note->course->title}: {$note->cote}/20\n";

                    if ($note->cote !== null) {
                        $credits = $coursesWithCredits[$note->course_id] ?? 0;
                        $sommeNotesPonderees += $note->cote * $credits;
                        $totalCredits += $credits;
                    }
                }

                $average = $totalCredits > 0
                    ? round($sommeNotesPonderees / $totalCredits, 2)
                    : 0;

                $message .= "\nMoyenne générale: {$average}/20\nMerci pour votre confiance.";
                $this->sendSMS($student->phone, $message);
            }
        }

        return redirect()->back()->with([
            'flash' => ['type' => 'success', 'message' => 'Résultats publiés avec succès par SMS']
        ]);
    }

    public function exportResults(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        return Excel::download(
            new ResultsExport($academicYear->id, $promotion->id),
            "resultats-{$promotion->title}-{$academicYear->title}.xlsx"
        );
    }


    private function sendSMS($phone, $message)
    {
        $twilioService = new TwilioService();

        try {
            $twilioService->sendTwilioSms($phone, $message);
        } catch (\Exception $e) {
            Log::error("Erreur envoi SMS à {$phone}: " . $e->getMessage());
        }
    }


    public function addPoints(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'points' => 'required|numeric',
        ]);

        // Ajoute les points à toutes les notes du cours
        Note::where('course_id', $request->course_id)
            ->update([
                'cote' => DB::raw('LEAST(cote + ' . floatval($request->points) . ', 20)'),
                'is_submitted' => true,
                'updated_at' => now(),
            ]);

        return redirect()->back()->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Points ajoutés avec succès',
            ]
        ]);
    }

    public function updateNote(Request $request)
    {
        $request->validate([
            'note_id' => 'required|integer|exists:notes,id',
            'cote' => 'required|numeric|min:0|max:20',
        ]);

        $note = Note::findOrFail($request->note_id);

        $note->cote = $request->cote;
        $note->is_submitted = true;
        $note->updated_at = now();
        $note->save();

        return redirect()->back()->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Note modifiée avec succès',
            ]
        ]);
    }

    /**
     * Récupère le parcours académique d'un étudiant
     */
    public function getStudentAcademicHistory(Student $student)
    {
        // Récupérer toutes les inscriptions de l'étudiant
        $inscriptions = Inscription::with(['academicYear', 'promotion'])
            ->where('student_id', $student->id)
            ->orderBy('academic_year_id', 'asc')
            ->get();

        $history = [];
        $passedCourses = []; // Cours validés (>= 10)
        $complementaryCourses = []; // Cours à repasser
        $processedCourses = []; // Pour éviter les doublons

        foreach ($inscriptions as $inscription) {
            $academicYear = $inscription->academicYear;
            $promotion = $inscription->promotion;

            // Récupérer les cours de la promotion pour cette année académique
            $courses = DB::table('course_program_details')
                ->where('promotion_id', $promotion->id)
                ->join('courses', 'course_program_details.course_id', '=', 'courses.id')
                ->select('courses.id', 'courses.title', 'credits')
                ->distinct()
                ->get();

            $coursesWithNotes = [];
            foreach ($courses as $course) {
                // Vérifier si ce cours a déjà été traité
                $courseKey = $course->id . '-' . $academicYear->id;

                if (isset($processedCourses[$courseKey])) {
                    continue; // Passer au cours suivant si déjà traité
                }

                $processedCourses[$courseKey] = true;

                // Récupérer la note de l'étudiant pour ce cours
                $note = Note::where('student_id', $student->id)
                    ->where('academic_year_id', $academicYear->id)
                    ->where('course_id', $course->id)
                    ->first();

                $passed = $note && $note->cote >= 10;
                $courseData = [
                    'id' => $course->id,
                    'title' => $course->title,
                    'credits' => $course->credits,
                    'note' => $note ? $note->cote : null,
                    'passed' => $passed,
                ];

                $coursesWithNotes[] = $courseData;

                if ($passed) {
                    $passedCourses[$course->id] = true;
                }

                // Ajouter aux cours complémentaires si non validé
                if (!$passed && !isset($complementaryCourses[$course->id])) {
                    $complementaryCourses[$course->id] = $courseData;
                }
            }

            $history[] = [
                'academic_year_id' => $academicYear->id,
                'academic_year' => $academicYear->title,
                'promotion_id' => $promotion->id,
                'promotion' => $promotion->title,
                'courses' => $coursesWithNotes,
            ];
        }

        // Convertir en tableau indexé
        $complementaryCourses = array_values($complementaryCourses);

        return response()->json([
            'history' => $history,
            'complementary_courses' => $complementaryCourses
        ]);
    }
}
