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
use Modules\RegistrationDesk\Entities\Inscription;

class ResultsController extends Controller
{
    public function index(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        // Récupération des crédits des cours depuis course_program_details
        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->pluck('credits', 'course_id')
            ->toArray();

        // Récupération de tous les cours avec leurs crédits
        $allTeachingUnits = UnitsTeaching::with(['courses' => function ($query) use ($context) {
            $query->with(['notes' => function ($q) use ($context) {
                $q->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            }]);
        }])->get();

        $allCourses = $allTeachingUnits->flatMap(function ($unit) {
            return $unit->courses;
        });

        // Ajout des crédits aux cours
        $allCourses->each(function ($course) use ($coursesWithCredits) {
            $course->credit = $coursesWithCredits[$course->id] ?? 0;
        });

        // Pagination des étudiants avec leurs notes et cours
        $students = Student::with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])->paginate(10);

        // Calcul des résultats par étudiant
        $students->getCollection()->transform(function ($student) use ($allCourses, $coursesWithCredits) {
            // Ajouter les cours manquants
            $studentCourses = $student->notes->map(fn($note) => $note->course);
            $missingCourses = $allCourses->diff($studentCourses);

            foreach ($missingCourses as $course) {
                $student->notes->push(new Note([
                    'course_id' => $course->id,
                    'cote' => null,
                    'course' => $course,
                ]));
            }

            // Calcul de la moyenne pondérée par crédits
            $sommeNotesPonderees = 0;
            $totalCredits = 0;
            $reserve = 0;
            $need = 0;

            foreach ($student->notes as $note) {
                // Récupérer les crédits du cours
                $credits = $coursesWithCredits[$note->course_id] ?? 0;

                // Ne considérer que les cours avec crédits définis et notes existantes
                if ($note->cote !== null) {
                    $sommeNotesPonderees += $note->cote * $credits;
                    $totalCredits += $credits;
                }

                // Calcul de la réserve et des besoins
                if ($note->cote > 10) {
                    $reserve += ($note->cote - 10);
                } elseif ($note->cote < 10 && $note->cote !== null) {
                    $need += (10 - $note->cote);
                }
            }

            // Calcul de la moyenne générale (somme notes pondérées / somme crédits)
            $student->average = $totalCredits > 0
                ? round($sommeNotesPonderees / $totalCredits, 2)
                : 0;

            $student->reserve = round($reserve, 2);
            $student->need = round($need, 2);

            return $student;
        });

        return Inertia::render('jury/results', [
            'students' => $students,
            'academicYear' => $academicYear,
            'promotion' => $promotion,
            'allCourses' => $allCourses,
        ]);
    }


    public function publishResults(Request $request)
    {
        $context = $request->session()->get('jury_context');
        $promotion = Promotion::find($context['promotion_id']);

        // Récupération des crédits des cours
        $coursesWithCredits = DB::table('course_program_details')
            ->where('promotion_id', $promotion->id)
            ->pluck('credits', 'course_id')
            ->toArray();

        // Récupérer tous les étudiants avec leurs résultats
        $students = Student::with(['notes' => function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id'])
                ->with('course');
        }])->get();

        foreach ($students as $student) {
            if ($student->phone) {
                $message = "L'étudiant(e): " . $student->name . "  Vos résultats :\n";

                // Calcul de la moyenne pour SMS
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

                $message .= "\nMoyenne générale: {$average}/20";
                $message .= "\nMerci pour votre confiance.";

                // Envoyer le SMS via Twilio
                $this->sendSMS($student->phone, $message);
            }
        }

        return redirect()->back()->with([
            'flash' => [
                'type' => 'success',
                'message' => 'Résultats publiés avec succès par SMS'
            ]
        ]);
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
        // Récupérer l'année académique en cours
        $currentAcademicYear = AcademicYear::latest()->first();
        $currentAcademicYearId = $currentAcademicYear ? $currentAcademicYear->id : null;

        // Récupérer toutes les inscriptions de l'étudiant
        $inscriptions = Inscription::with(['academicYear', 'promotion'])
            ->where('student_id', $student->id)
            ->orderBy('academic_year_id')
            ->get();

        $history = [];
        $passedCourses = []; // Pour stocker les cours déjà validés
        $complementaryCourses = []; // Cours complémentaires

        foreach ($inscriptions as $inscription) {
            $academicYear = $inscription->academicYear;
            $promotion = $inscription->promotion;

            // Récupérer les cours via la table pivot course_program_details
            $courses = DB::table('course_program_details')
                ->where('promotion_id', $promotion->id)
                ->join('courses', 'course_program_details.course_id', '=', 'courses.id')
                ->select('courses.id', 'courses.title')
                ->distinct()
                ->get();

            // Récupérer les notes pour ces cours
            $coursesWithNotes = [];
            foreach ($courses as $course) {
                $note = Note::where('student_id', $student->id)
                    ->where('academic_year_id', $academicYear->id)
                    ->where('course_id', $course->id)
                    ->first();

                $passed = $note && $note->cote >= 10;

                if ($passed) {
                    $passedCourses[] = $course->id;
                } else {
                    // Si le cours n'est pas validé et n'est pas dans l'année en cours
                    if ($academicYear->id !== $currentAcademicYearId) {
                        $complementaryCourses[] = [
                            'id' => $course->id,
                            'title' => $course->title,
                            'note' => $note ? $note->cote : null,
                            'passed' => false,
                        ];
                    }
                }

                $coursesWithNotes[] = [
                    'id' => $course->id,
                    'title' => $course->title,
                    'note' => $note ? $note->cote : null,
                    'passed' => $passed,
                ];
            }

           

            $history[] = [
                'academic_year_id' => $academicYear->id,
                'academic_year' => $academicYear->title,
                'promotion_id' => $promotion->id,
                'promotion' => $promotion->title,
                'courses' => $coursesWithNotes,
            ];
        }

        // Filtrer les cours complémentaires pour supprimer ceux déjà validés
        $complementaryCourses = array_filter($complementaryCourses, function($course) use ($passedCourses) {
            return !in_array($course['id'], $passedCourses);
        });

         dd($coursesWithNotes, $complementaryCourses, $history);

        return response()->json([
            'history' => $history,
            'complementary_courses' => array_values($complementaryCourses)
        ]);
    }
}
