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
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Semestre;

class ResultsController extends Controller
{
    public function index(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->pluck('credits', 'course_id')
            ->toArray();

        $allTeachingUnits = UnitsTeaching::where('promotion_id', $context['promotion_id'])
            ->with(['courses' => function ($query) use ($context) {
                $query->with(['notes' => function ($q) use ($context) {
                    $q->where('academic_year_id', $context['academic_year_id'])
                        ->where('promotion_id', $context['promotion_id'])
                        ->with('student');
                }]);
            }])->get();

        $allCourses = $allTeachingUnits->flatMap(function ($unit) {
            return $unit->courses->map(function ($course) use ($unit) {
                $course->unit_teaching_id = $unit->id;
                return $course;
            });
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

        $students = Student::whereHas('inscriptions', function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id']);
        })->with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])->orderBy('name')->paginate(10);

        $students->getCollection()->transform(function ($student) use ($coursesWithCredits, &$gridData) {
            // Calculs via le modèle Student
            $student->average = $student->calculateWeightedAverage($student->notes, $coursesWithCredits);
            $student->decision = $student->calculateDecision($student->notes, $coursesWithCredits, $student->average);
            $student->mention = $student->calculateMention($student->decision, $student->notes, $student->average);

            $stats = $student->calculateStats($student->notes, $coursesWithCredits);
            $student->reserve = $stats['reserve'];
            $student->need = $stats['need'];

            $gridStudent = [
                'id' => $student->id,
                'name' => $student->name,
                'matricule' => $student->matricule,
                'average' => $student->average,
                'reserve' => $student->reserve,
                'need' => $student->need,
                'decision' => $student->decision,
                'mention' => $student->mention,
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

        $teachingUnits = UnitsTeaching::where('promotion_id', $promotion->id)
            ->with(['courses' => function ($query) use ($promotion) {
                $query->whereHas('courseProgramDetails', function ($q) use ($promotion) {
                    $q->where('promotion_id', $promotion->id);
                })->with(['courseProgramDetails' => function ($q) use ($promotion) {
                    $q->where('promotion_id', $promotion->id);
                }]);
            }])
            ->get()
            ->map(function ($unit) {
                // Transformez la relation pivot en structure directe
                $unit->courses = $unit->courses->map(function ($course) use ($unit) {
                    // Try to find the pivot record from loaded relation if possible, or just use what we have
                    // Note: In `with` closure we loaded courseProgramDetails.
                    // But here we are iterating courses relation of UnitsTeaching.
                    // The pivot between UnitsTeaching and Course is UnitCourse (not CourseProgramDetail).
                    // However, we eager loaded `courseProgramDetails`.
                    $detail = $course->courseProgramDetails->first();

                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'credit' => $detail->credits ?? 0,
                        'cm' => $detail->cm ?? 0,
                        'td' => $detail->td ?? 0,
                        'tp' => $detail->tp ?? 0,
                        'program_detail_id' => $detail->id ?? null,
                        'unit_teaching_id' => $unit->id, // Add unit_teaching_id for creation context
                        'orientation' => $course->orientation
                    ];
                });

                return $unit;
            });



        return Inertia::render('jury/results', [
            'students' => $students,
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'gridData' => $gridData,
            'teachingUnits' => $teachingUnits,
            'allCourses' => $allCourses
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

                $average = $student->calculateWeightedAverage($student->notes, $coursesWithCredits);

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


    /**
     * Appliquer la pérequation des notes
     */
    public function applyEqualization(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'type' => 'required|in:global,ue,coefficient',
            'ue_id' => 'nullable|integer',
            'credit' => 'nullable|integer',
        ]);

        $context = $request->session()->get('jury_context');
        $academicYearId = $context['academic_year_id'];
        $promotionId = $context['promotion_id'];

        $student = Student::with(['notes' => function ($query) use ($academicYearId, $promotionId) {
            $query->where('academic_year_id', $academicYearId)
                ->where('promotion_id', $promotionId)
                ->with('course');
        }])->findOrFail($request->student_id);

        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotionId)
            ->pluck('credits', 'course_id')
            ->toArray();

        switch ($request->type) {
            case 'global':
                $this->applyGlobalEqualization($student, $coursesWithCredits);
                break;
            case 'ue':
                $this->applyUeEqualization($student, $request->ue_id, $coursesWithCredits);
                break;
            case 'coefficient':
                $this->applyCoefficientEqualization($student, $request->credit, $coursesWithCredits);
                break;
        }

        return response()->json([
            'success' => true,
            'message' => 'Péréquation appliquée avec succès'
        ]);
    }

    /**
     * Option 1: Pérequation globale
     */
    private function applyGlobalEqualization($student, $coursesWithCredits)
    {
        $reserve = 0;
        $needs = [];

        foreach ($student->notes as $note) {
            // $credits = $coursesWithCredits[$note->course_id] ?? 0; // Ancienne logique pondérée

            if ($note->cote > 10) {
                $reserve += ($note->cote - 10); // Somme simple
            } elseif ($note->cote < 10) {
                $needs[$note->course_id] = [
                    'credits' => 1, // Fixe à 1 pour calcul simple
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $totalNeed = array_sum(array_column($needs, 'need'));

        if ($reserve > 0 && $totalNeed > 0) {
            $ratio = min(1, $reserve / $totalNeed);

            foreach ($needs as $courseId => $data) {
                $pointsToAdd = $data['need'] * $ratio; // Simple distribution
                $note = $student->notes->firstWhere('course_id', $courseId);

                if ($note) {
                    $newNote = min(10, $note->cote + $pointsToAdd);
                    $note->cote = round($newNote, 2);
                    $note->save();
                }
            }
        }
    }

    /**
     * Option 2: Pérequation par unité d'enseignement
     */
    private function applyUeEqualization($student, $ueId, $coursesWithCredits)
    {
        $ue = UnitsTeaching::with(['courses' => function ($query) {
            $query->with('courseProgramDetails');
        }])->findOrFail($ueId);

        $ueCourseIds = $ue->courses->pluck('id')->toArray();

        $reserve = 0;
        $needs = [];

        foreach ($student->notes as $note) {
            if (!in_array($note->course_id, $ueCourseIds)) continue;

            // $credits = $coursesWithCredits[$note->course_id] ?? 0;

            if ($note->cote > 10) {
                $reserve += ($note->cote - 10);
            } elseif ($note->cote < 10) {
                $needs[$note->course_id] = [
                    'credits' => 1,
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $totalNeed = array_sum(array_column($needs, 'need'));

        if ($reserve > 0 && $totalNeed > 0) {
            $ratio = min(1, $reserve / $totalNeed);

            foreach ($needs as $courseId => $data) {
                $pointsToAdd = $data['need'] * $ratio;
                $note = $student->notes->firstWhere('course_id', $courseId);

                if ($note) {
                    $newNote = min(10, $note->cote + $pointsToAdd);
                    $note->cote = round($newNote, 2);
                    $note->save();
                }
            }
        }
    }

    /**
     * Option 3: Pérequation par coefficient
     */
    private function applyCoefficientEqualization($student, $credit, $coursesWithCredits)
    {
        $reserve = 0;
        $needs = [];

        foreach ($student->notes as $note) {
            $courseCredit = $coursesWithCredits[$note->course_id] ?? 0;
            if ($courseCredit != $credit) continue;

            if ($note->cote > 10) {
                $reserve += ($note->cote - 10);
            } elseif ($note->cote < 10) {
                $needs[$note->course_id] = [
                    'credits' => 1,
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $totalNeed = array_sum(array_column($needs, 'need'));

        if ($reserve > 0 && $totalNeed > 0) {
            $ratio = min(1, $reserve / $totalNeed);

            foreach ($needs as $courseId => $data) {
                $pointsToAdd = $data['need'] * $ratio;
                $note = $student->notes->firstWhere('course_id', $courseId);

                if ($note) {
                    $newNote = min(10, $note->cote + $pointsToAdd);
                    $note->cote = round($newNote, 2);
                    $note->save();
                }
            }
        }
    }

    /**
     * Update course program details (credits, hours)
     */
    public function updateCourseDetails(Request $request)
    {
        $request->validate([
            'course_id' => 'required_without:program_detail_id|exists:courses,id',
            'program_detail_id' => 'nullable|exists:course_program_details,id',
            'unit_teaching_id' => 'nullable|exists:units_teachings,id',
            'credits' => 'required|numeric|min:0',
            'cm' => 'required|numeric|min:0',
            'td' => 'required|numeric|min:0',
            'tp' => 'required|numeric|min:0',
        ]);

        try {
            $context = $request->session()->get('jury_context');
            if (!$context) {
                return response()->json(['message' => 'Contexte jury manquant.'], 400);
            }

            if ($request->program_detail_id) {
                DB::table('course_program_details')
                    ->where('id', $request->program_detail_id)
                    ->update([
                        'credits' => $request->credits,
                        'cm' => $request->cm,
                        'td' => $request->td,
                        'tp' => $request->tp,
                        'updated_at' => now(),
                    ]);
            } else {
                // 1. Récupérer la promotion pour déterminer le programme
                $promotionId = $context['promotion_id'];
                $promotion = Promotion::find($promotionId);
                if (!$promotion) {
                    return response()->json(['message' => 'Promotion introuvable.'], 400);
                }

                $programName = $this->determineProgramName($promotion->title);

                // Fallback si on ne trouve pas le programme via les keywords
                if (!$programName) {
                    // Utiliser un nom générique comme dans l'import
                    $programName = 'PROGRAMME ' . $promotion->title;
                }

                // Trouver ou Créer le programme
                $program = Program::firstOrCreate(
                    ['name' => $programName, 'institution_id' => $promotion->institution_id]
                );

                $programId = $program->id;

                $unitTeachingId = $request->input('unit_teaching_id');
                // Allow null unit_teaching_id as per user request (nullable in DB)
                // if (!$unitTeachingId) {
                //    return response()->json(['message' => 'Unité d\'enseignement non spécifiée.'], 400);
                // }

                // Gérer la catégorie
                $categoryId = null;
                // On va utiliser une catégorie par défaut "COURS MAGISTRAL" ou la première existante
                // Note: CourseCategory requires a slug. We generate one if creating.
                $defaultCategoryName = 'COURS MAGISTRAL';
                $defaultCategory = CourseCategory::firstOrCreate(
                    ['name' => $defaultCategoryName],
                    ['slug' => \Illuminate\Support\Str::slug($defaultCategoryName)]
                );
                $categoryId = $defaultCategory->id;

                // Gérer le semestre (Défaut Semestre 1 comme l'import)
                $defaultSemestre = Semestre::firstOrCreate(['title' => 'Semestre 1']);

                CourseProgramDetail::updateOrCreate(
                    [
                        'program_id' => $programId,
                        'course_id' => $request->course_id,
                        'promotion_id' => $promotionId,
                    ],
                    [
                        'units_teaching_id' => $unitTeachingId,
                        'course_category_id' => $categoryId,
                        'semestre_id' => $defaultSemestre->id,
                        'credits' => $request->credits,
                        'cm' => $request->cm,
                        'td' => $request->td,
                        'tp' => $request->tp,
                        'updated_at' => now(),
                    ]
                );
            }

            return response()->json(['message' => 'Détails du cours mis à jour avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()], 500);
        }
    }

    private function determineProgramName($promotionName)
    {
        $promotionName = strtoupper($promotionName);

        // 1. SCIENCES ET TECHNOLOGIE
        $sciencesTelecomKeywords = ['GENIE LOGICIEL', 'INTELLIGENCE ARTIFICIELLE', 'RESEAUX ET TELECOMMUNICATION', 'STATISTIQUE'];
        foreach ($sciencesTelecomKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'SCIENCES ET TECHNOLOGIE';
            }
        }

        // 2. GESTION COMMERCIALES ET ADMINISTRATIVE
        $gestionCommercialeKeywords = ['COMPTABILITE', 'FISCALITE ET DOUANE', 'MARKETING', 'BANQUE'];
        foreach ($gestionCommercialeKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'GESTION COMMERCIALES ET ADMINISTRATIVE';
            }
        }

        // 3. SCIENCES ECONOMIQUE ET DE GESTION
        if (str_contains($promotionName, 'INFORMATIQUE DE GESTION')) {
            return 'SCIENCES ECONOMIQUE ET DE GESTION';
        }

        // Si aucune correspondance, on retourne null
        return null;
    }
}
