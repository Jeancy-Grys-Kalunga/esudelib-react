<?php

namespace Modules\Jury\Services;

use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Entities\Semestre;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;
use Illuminate\Support\Facades\DB;
use App\Services\TwilioService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class JuryService
{
    protected $twilioService;

    public function __construct(TwilioService $twilioService)
    {
        $this->twilioService = $twilioService;
    }

    /**
     * Get dashboard courses statistics
     */
    public function getDashboardCourses(array $context)
    {
        return Course::withCount([
            'notes as submitted_notes' => function ($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id'])
                    ->where('is_submitted', true);
            }
        ])
            ->addSelect([
                'total_students' => DB::table('course_student')
                    ->selectRaw('COUNT(DISTINCT student_id)')
                    ->whereColumn('course_id', 'courses.id')
                    ->whereExists(function ($query) use ($context) {
                        $query->select(DB::raw(1))
                            ->from('notes')
                            ->whereColumn('notes.student_id', 'course_student.student_id')
                            ->where('notes.academic_year_id', $context['academic_year_id'])
                            ->where('notes.promotion_id', $context['promotion_id']);
                    })
            ])
            ->get()
            ->map(function ($course) {
                $course->pending_notes = $course->total_students - $course->submitted_notes;
                return $course;
            });
    }

    /**
     * Get dashboard success rates
     */
    public function getSuccessRates(array $context)
    {
        return Note::selectRaw('
            course_id,
            COUNT(*) as total,
            SUM(CASE WHEN cote >= 10 THEN 1 ELSE 0 END) as passed,
            SUM(CASE WHEN cote < 10 THEN 1 ELSE 0 END) as failed
        ')
            ->where('academic_year_id', $context['academic_year_id'])
            ->where('promotion_id', $context['promotion_id'])
            ->groupBy('course_id')
            ->with('course')
            ->get()
            ->map(function ($item) {
                $item->success_rate = $item->total > 0 ? round(($item->passed / $item->total) * 100, 2) : 0;
                $item->failure_rate = $item->total > 0 ? round(($item->failed / $item->total) * 100, 2) : 0;
                return $item;
            });
    }

    /**
     * Send results SMS to students
     */
    public function sendResultsBySms(array $context)
    {
        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $context['promotion_id'])
            ->pluck('credits', 'course_id')
            ->toArray();

        $students = Student::with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])
            ->whereNotNull('phone')
            ->get();

        $count = 0;
        foreach ($students as $student) {
            if ($this->processStudentSms($student, $coursesWithCredits)) {
                $count++;
            }
        }

        return $count;
    }

    private function processStudentSms($student, $coursesWithCredits)
    {
        $message = "L'étudiant(e): " . $student->name . "  Vos résultats :\n";

        foreach ($student->notes as $note) {
            $message .= "{$note->course->title}: {$note->cote}/20\n";
        }

        $average = $student->calculateWeightedAverage($student->notes, $coursesWithCredits);
        $message .= "\nMoyenne générale: {$average}/20\nMerci pour votre confiance.";

        try {
            $this->twilioService->sendTwilioSms($student->phone, $message);
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur envoi SMS à {$student->phone}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Save grades changes
     */
    public function saveGrades(array $changes, array $massChanges, array $context)
    {
        DB::beginTransaction();

        try {
            foreach ($changes as $change) {
                if ($change['isNew']) {
                    Note::create([
                        'student_id' => $change['studentId'],
                        'course_id' => $change['courseId'],
                        'cote' => $change['value'],
                        'academic_year_id' => $context['academic_year_id'],
                        'promotion_id' => $context['promotion_id'],
                        'observation' => 'Auto-généré',
                        'situation' => ($change['value'] >= 10 ? 'Pass' : 'Fail')
                    ]);
                } else {
                    $note = Note::find($change['id']);
                    if ($note) {
                        $note->update(['cote' => $change['value']]);
                    }
                }
            }

            foreach ($massChanges as $massChange) {
                Note::where('course_id', $massChange['courseId'])
                    ->whereNotNull('cote')
                    ->update([
                        'cote' => DB::raw("CASE WHEN (cote + {$massChange['points']}) > 20 THEN 20 ELSE (cote + {$massChange['points']}) END"),
                    ]);
            }

            DB::commit();
            return ['success' => true, 'message' => 'Modifications sauvegardées'];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Erreur sauvegarde notes: " . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Add points to course notes
     */
    public function addPointsToCourse(int $courseId, float $points, array $context): int
    {
        return Note::where('course_id', $courseId)
            ->where('academic_year_id', $context['academic_year_id'])
            ->where('promotion_id', $context['promotion_id'])
            ->update([
                'cote' => DB::raw("CASE WHEN (cote + {$points}) > 20 THEN 20 ELSE (cote + {$points}) END"),
                'is_submitted' => true,
                'updated_at' => now(),
            ]);
    }

    /**
     * Get detailed results data for the grid
     */
    public function getResultsData(array $context, int $perPage = 10)
    {
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

        // Pré-charger cm, td, tp depuis course_program_details pour cette promotion
        $programDetails = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->select('course_id', 'cm', 'td', 'tp', 'credits')
            ->get()
            ->keyBy('course_id');

        $allCourses = $allTeachingUnits->flatMap(function ($unit) {
            return $unit->courses->map(function ($course) use ($unit) {
                $course->unit_teaching_id = $unit->id;
                return $course;
            });
        })->unique('id') // Dédupliquer par ID de cours
            ->each(function ($course) use ($coursesWithCredits, $programDetails) {
                $course->credit = $coursesWithCredits[$course->id] ?? 0;
                $detail = $programDetails->get($course->id);
                $course->cm = $detail ? ($detail->cm ?? 0) : 0;
                $course->td = $detail ? ($detail->td ?? 0) : 0;
                $course->tp = $detail ? ($detail->tp ?? 0) : 0;
            });

        // Ajouter les cours présents dans les notes des étudiants mais absents des UEs
        $existingCourseIds = $allCourses->pluck('id')->toArray();
        $coursesFromNotes = DB::table('notes')
            ->where('academic_year_id', $context['academic_year_id'])
            ->where('promotion_id', $context['promotion_id'])
            ->whereNotIn('course_id', $existingCourseIds)
            ->join('courses', 'notes.course_id', '=', 'courses.id')
            ->select('courses.id', 'courses.title')
            ->distinct()
            ->get();

        foreach ($coursesFromNotes as $c) {
            $detail = $programDetails->get($c->id);
            $allCourses->push((object) [
                'id' => $c->id,
                'title' => $c->title,
                'unit_teaching_id' => null,
                'credit' => $coursesWithCredits[$c->id] ?? 0,
                'cm' => $detail ? ($detail->cm ?? 0) : 0,
                'td' => $detail ? ($detail->td ?? 0) : 0,
                'tp' => $detail ? ($detail->tp ?? 0) : 0,
            ]);
        }

        $gridData = [
            'courses' => $allCourses->map(fn($c) => [
                'id' => $c->id,
                'title' => $c->title,
                'credit' => $c->credit,
                'cm' => $c->cm,
                'td' => $c->td,
                'tp' => $c->tp,
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
        }])->orderBy('name')->paginate($perPage);

        $students->getCollection()->transform(function ($student) use ($coursesWithCredits, &$gridData) {
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
            ->map(function ($unit) use ($promotion) {
                $unit->courses = $unit->courses->map(function ($course) use ($unit, $promotion) {
                    $detail = $course->courseProgramDetails->where('promotion_id', $promotion->id)->first();

                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'credit' => $detail->credits ?? 0,
                        'cm' => $detail->cm ?? 0,
                        'td' => $detail->td ?? 0,
                        'tp' => $detail->tp ?? 0,
                        'program_detail_id' => $detail->id ?? null,
                        'unit_teaching_id' => $unit->id,
                        'orientation' => $course->orientation
                    ];
                });

                return $unit;
            });

        return [
            'students' => $students,
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'gridData' => $gridData,
            'teachingUnits' => $teachingUnits,
            'allCourses' => $allCourses
        ];
    }

    /**
     * Get academic history of a student
     */
    public function getStudentHistory(Student $student): array
    {
        // Récupérer toutes les inscriptions de l'étudiant, ordonnées par année
        $inscriptions = Inscription::with(['academicYear', 'promotion'])
            ->where('student_id', $student->id)
            ->orderBy('academic_year_id', 'asc')
            ->get();

        $history = [];
        $passedCourseIds = [];
        $complementaryCourses = [];

        foreach ($inscriptions as $inscription) {
            $academicYear = $inscription->academicYear;
            $promotion = $inscription->promotion;

            if (!$academicYear || !$promotion) continue;

            // Récupérer les notes de l'étudiant pour cette inscription (année + promotion)
            $notes = Note::where('student_id', $student->id)
                ->where('academic_year_id', $academicYear->id)
                ->where('promotion_id', $promotion->id)
                ->with('course')
                ->get();

            // Si pas de notes pour cette inscription, récupérer les cours via course_program_details
            if ($notes->isEmpty()) {
                $courses = DB::table('course_program_details')
                    ->where('promotion_id', $promotion->id)
                    ->join('courses', 'course_program_details.course_id', '=', 'courses.id')
                    ->select('courses.id', 'courses.title', 'course_program_details.cm', 'course_program_details.td', 'course_program_details.tp')
                    ->distinct()
                    ->get();

                $coursesWithNotes = $courses->map(function ($course) {
                    // Calcul des crédits : (CM + TD + TP) / 15
                    $credits = (($course->cm ?? 0) + ($course->td ?? 0) + ($course->tp ?? 0)) / 15;
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'credits' => round($credits, 2),
                        'note' => null,
                        'passed' => false,
                    ];
                })->toArray();
            } else {
                $coursesWithNotes = [];
                $seenCourseIds = []; // Pour éviter les doublons

                // Pré-charger les volumes horaires pour cette promotion et calculer (CM+TD+TP)/15
                $programDetails = DB::table('course_program_details')
                    ->where('promotion_id', $promotion->id)
                    ->select('course_id', 'cm', 'td', 'tp')
                    ->get()
                    ->keyBy('course_id');

                // Fallback : si aucun détail pour cette promotion, charger tous les détails
                if ($programDetails->isEmpty()) {
                    $programDetails = DB::table('course_program_details')
                        ->select('course_id', 'cm', 'td', 'tp')
                        ->get()
                        ->keyBy('course_id');
                }

                // Si un cours apparaît deux fois, garder la meilleure note (la plus haute)
                $bestNotes = [];
                foreach ($notes as $note) {
                    if (!$note->course) continue;
                    $cid = $note->course_id;
                    if (!isset($bestNotes[$cid]) || ($note->cote !== null && ($bestNotes[$cid]->cote === null || $note->cote > $bestNotes[$cid]->cote))) {
                        $bestNotes[$cid] = $note;
                    }
                }

                foreach ($bestNotes as $note) {
                    // Calcul des crédits : (CM + TD + TP) / 15
                    $detail = $programDetails->get($note->course_id);

                    if ($detail) {
                        $cm = $detail->cm ?? 0;
                        $td = $detail->td ?? 0;
                        $tp = $detail->tp ?? 0;

                        // Si pas de volumes horaires définis, utiliser les valeurs par défaut
                        if ($cm == 0 && $td == 0 && $tp == 0) {
                            $cm = 30;
                            $td = 15;
                            $tp = 15;
                            // Mettre à jour la ligne dans la base avec les valeurs par défaut
                            DB::table('course_program_details')
                                ->where('course_id', $note->course_id)
                                ->where('promotion_id', $promotion->id)
                                ->update(['cm' => $cm, 'td' => $td, 'tp' => $tp, 'credits' => round(($cm + $td + $tp) / 15, 2)]);
                        }

                        $credits = round(($cm + $td + $tp) / 15, 2);
                    } else {
                        // Pas de détail du tout : valeurs par défaut
                        $credits = round((30 + 15 + 15) / 15, 2); // = 4
                    }

                    $passed = $note->cote !== null && $note->cote >= 10;

                    $courseData = [
                        'id' => $note->course->id,
                        'title' => $note->course->title,
                        'credits' => (float) $credits,
                        'note' => $note->cote,
                        'passed' => $passed,
                    ];

                    $coursesWithNotes[] = $courseData;

                    if ($passed) {
                        $passedCourseIds[$note->course_id] = true;
                        unset($complementaryCourses[$note->course_id]);
                    } elseif (!isset($passedCourseIds[$note->course_id]) && !isset($complementaryCourses[$note->course_id])) {
                        $complementaryCourses[$note->course_id] = $courseData;
                    }
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

        return [
            'history' => $history,
            'complementary_courses' => array_values($complementaryCourses)
        ];
    }

    /**
     * Apply equalization to a student's notes
     */
    public function applyEqualization(int $studentId, string $type, ?int $ueId, ?int $credit, array $context): bool
    {
        $academicYearId = $context['academic_year_id'];
        $promotionId = $context['promotion_id'];

        $student = Student::with(['notes' => function ($query) use ($academicYearId, $promotionId) {
            $query->where('academic_year_id', $academicYearId)
                ->where('promotion_id', $promotionId)
                ->with('course');
        }])->findOrFail($studentId);

        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotionId)
            ->pluck('credits', 'course_id')
            ->toArray();

        switch ($type) {
            case 'global':
                $this->applyGlobalEqualization($student, $coursesWithCredits);
                break;
            case 'ue':
                $this->applyUeEqualization($student, $ueId, $coursesWithCredits);
                break;
            case 'coefficient':
                $this->applyCoefficientEqualization($student, $credit, $coursesWithCredits);
                break;
        }

        return true;
    }

    private function applyGlobalEqualization($student, $coursesWithCredits)
    {
        $reserve = 0;
        $needs = [];

        foreach ($student->notes as $note) {
            if ($note->cote > 10) {
                $reserve += ($note->cote - 10);
            } elseif ($note->cote < 10) {
                $needs[$note->course_id] = [
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $this->distributeReserve($student, $reserve, $needs);
    }

    private function applyUeEqualization($student, $ueId, $coursesWithCredits)
    {
        $ue = UnitsTeaching::with(['courses'])->findOrFail($ueId);
        $ueCourseIds = $ue->courses->pluck('id')->toArray();

        $reserve = 0;
        $needs = [];

        foreach ($student->notes as $note) {
            if (!in_array($note->course_id, $ueCourseIds)) continue;

            if ($note->cote > 10) {
                $reserve += ($note->cote - 10);
            } elseif ($note->cote < 10) {
                $needs[$note->course_id] = [
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $this->distributeReserve($student, $reserve, $needs);
    }

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
                    'need' => (10 - $note->cote)
                ];
            }
        }

        $this->distributeReserve($student, $reserve, $needs);
    }

    private function distributeReserve($student, $reserve, $needs)
    {
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
     * Update course details/program
     */
    public function updateCourseDetails(array $data, array $context)
    {
        if (isset($data['program_detail_id']) && $data['program_detail_id']) {
            return DB::table('course_program_details')
                ->where('id', $data['program_detail_id'])
                ->update([
                    'credits' => $data['credits'],
                    'cm' => $data['cm'],
                    'td' => $data['td'],
                    'tp' => $data['tp'],
                    'updated_at' => now(),
                ]);
        }

        $promotionId = $context['promotion_id'];
        $promotion = Promotion::find($promotionId);
        if (!$promotion) {
            throw new \Exception('Promotion introuvable.');
        }

        $programName = $this->determineProgramName($promotion->title);
        if (!$programName) {
            $programName = 'PROGRAMME ' . $promotion->title;
        }

        $program = Program::firstOrCreate(
            ['name' => $programName, 'institution_id' => $promotion->institution_id]
        );

        $defaultCategory = CourseCategory::firstOrCreate(
            ['name' => 'COURS MAGISTRAL'],
            ['slug' => Str::slug('COURS MAGISTRAL')]
        );

        return CourseProgramDetail::updateOrCreate(
            [
                'program_id' => $program->id,
                'course_id' => $data['course_id'],
                'promotion_id' => $promotionId,
            ],
            [
                'units_teaching_id' => $data['unit_teaching_id'] ?? null,
                'course_category_id' => $defaultCategory->id,
                'credits' => $data['credits'],
                'cm' => $data['cm'],
                'td' => $data['td'],
                'tp' => $data['tp'],
                'updated_at' => now(),
            ]
        );
    }

    private function determineProgramName($promotionName)
    {
        $promotionName = strtoupper($promotionName);

        $sciencesTelecomKeywords = ['GENIE LOGICIEL', 'INTELLIGENCE ARTIFICIELLE', 'RESEAUX ET TELECOMMUNICATION', 'STATISTIQUE'];
        foreach ($sciencesTelecomKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'SCIENCES ET TECHNOLOGIE';
            }
        }

        $gestionCommercialeKeywords = ['COMPTABILITE', 'FISCALITE ET DOUANE', 'MARKETING', 'BANQUE'];
        foreach ($gestionCommercialeKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'GESTION COMMERCIALES ET ADMINISTRATIVE';
            }
        }

        if (str_contains($promotionName, 'INFORMATIQUE DE GESTION')) {
            return 'SCIENCES ECONOMIQUE ET DE GESTION';
        }

        return null;
    }

    /**
     * Update a specific note
     */
    public function updateNote(int $noteId, float $cote): void
    {
        $note = Note::findOrFail($noteId);
        $note->cote = $cote;
        $note->is_submitted = true;
        $note->updated_at = now();
        $note->save();
    }
}
