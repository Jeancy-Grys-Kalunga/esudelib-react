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
use Modules\Jury\Services\JuryService;

class ResultsController extends Controller
{
    private $juryService;

    public function __construct(JuryService $juryService)
    {
        $this->juryService = $juryService;
    }
    public function index(Request $request)
    {
        $context = $request->session()->get('jury_context');

        if (!$context) {
            abort(403, 'Jury context not set.');
        }

        $data = $this->juryService->getResultsData($context);

        return Inertia::render('jury/results', $data);
    }

    public function saveGrades(Request $request)
    {
        $request->validate([
            'changes' => 'sometimes|array',
            'massChanges' => 'sometimes|array',
        ]);

        $context = $request->session()->get('jury_context');
        $result = $this->juryService->saveGrades(
            $request->changes ?? [],
            $request->massChanges ?? [],
            $context
        );

        return response()->json(
            $result,
            $result['success'] ? 200 : 500
        );
    }


    public function publishResults(Request $request)
    {
        $context = $request->session()->get('jury_context');

        if (!$context) {
            abort(403, 'Jury context not set.');
        }

        $count = $this->juryService->sendResultsBySms($context);

        return redirect()->back()->with([
            'flash' => ['type' => 'success', 'message' => "Résultats envoyés à {$count} étudiants."]
        ]);
    }

    public function exportResults(Request $request)
    {
        $context = $request->session()->get('jury_context');

        if (!$context) {
            abort(403, 'Jury context not set.');
        }

        $academicYear = AcademicYear::find($context['academic_year_id']);
        $promotion = Promotion::find($context['promotion_id']);

        return Excel::download(
            new ResultsExport($academicYear->id, $promotion->id),
            "resultats_jury.xlsx"
        );
    }




    public function addPoints(Request $request)
    {
        $request->validate([
            'course_id' => 'required|integer|exists:courses,id',
            'points' => 'required|numeric',
        ]);

        $context = $request->session()->get('jury_context');
        $points = floatval($request->points);

        $this->juryService->addPointsToCourse($request->course_id, $points, $context);

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

        $this->juryService->updateNote((int)$request->note_id, (float)$request->cote);

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
        $historyData = $this->juryService->getStudentHistory($student);

        return response()->json($historyData);
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

        $this->juryService->applyEqualization(
            (int)$request->student_id,
            $request->type,
            $request->ue_id ? (int)$request->ue_id : null,
            $request->credit ? (int)$request->credit : null,
            $context
        );

        return response()->json([
            'success' => true,
            'message' => 'Péréquation appliquée avec succès'
        ]);
    }

    /**
     * Impression du procès-verbal de délibération
     */
    public function printDeliberation($promotion)
    {
        return redirect()->back()->with([
            'flash' => [
                'type' => 'warning',
                'message' => "La fonctionnalité d'impression pour la promotion {$promotion} est en cours de développement."
            ]
        ]);
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

            $this->juryService->updateCourseDetails($request->all(), $context);

            return response()->json(['message' => 'Détails du cours mis à jour avec succès.']);
        } catch (\Exception $e) {
            Log::error('Erreur updateCourseDetails: ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de la mise à jour : ' . $e->getMessage()], 500);
        }
    }
}
