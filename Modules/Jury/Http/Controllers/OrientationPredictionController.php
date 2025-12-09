<?php

namespace Modules\Jury\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Promotion;
use Modules\Jury\Services\MasterPredictionService;
use Modules\Jury\Entities\MasterPrediction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Exception;

class OrientationPredictionController extends Controller
{
    protected $predictionService;

    public function __construct(MasterPredictionService $predictionService)
    {
        $this->predictionService = $predictionService;
    }

    /**
     * Affiche l'interface de prédiction pour le jury
     */
    public function showPredictionInterface(Request $request)
    {
        try {
            $context = $request->session()->get('jury_context');

            if (!$context) {
                return redirect()->route('jury.dashboard')
                    ->with('error', 'Contexte de jury non défini');
            }

            $academicYear = AcademicYear::find($context['academic_year_id']);
            $promotion = Promotion::find($context['promotion_id']);

            // Récupérer les étudiants avec leurs moyennes et prédictions
            $students = Student::whereHas('notes', function ($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            })
                ->with(['masterPrediction'])
                ->withAvg(['notes as average' => function ($query) use ($context) {
                    $query->where('academic_year_id', $context['academic_year_id'])
                        ->where('promotion_id', $context['promotion_id']);
                }], 'cote')
                ->paginate(20);

            // Calculer les statistiques
            $stats = $this->calculatePredictionStats($context);

            return Inertia::render('jury/orientation-prediction', [
                'academicYear' => $academicYear,
                'promotion' => $promotion,
                'students' => $students,
                'stats' => $stats,
            ]);
        } catch (Exception $e) {
            Log::error('Erreur showPredictionInterface: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Erreur lors du chargement de l\'interface');
        }
    }

    /**
     * Prédit l'orientation pour un étudiant spécifique
     */
    public function predictOrientation(Student $student)
    {
        try {
            $result = $this->predictionService->predictForStudent($student);

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            Log::error('Erreur predictOrientation: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la prédiction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prédit l'orientation pour tous les étudiants d'une promotion
     */
    public function predictBatch(Request $request)
    {
        try {
            $context = $request->session()->get('jury_context');

            if (!$context) {
                return response()->json([
                    'success' => false,
                    'error' => 'Contexte de jury non défini'
                ], 400);
            }

            // Récupérer tous les étudiants de la promotion
            $students = Student::whereHas('notes', function ($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            })
                ->get();

            $results = [];
            $errors = [];

            foreach ($students as $student) {
                try {
                    $result = $this->predictionService->predictForStudent($student);
                    $results[] = $result;
                } catch (Exception $e) {
                    $errors[] = [
                        'student_id' => $student->id,
                        'student_name' => $student->name,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'total' => count($students),
                    'successful' => count($results),
                    'failed' => count($errors),
                    'results' => $results,
                    'errors' => $errors
                ]
            ]);
        } catch (Exception $e) {
            Log::error('Erreur predictBatch: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la prédiction en lot: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Entraîne le modèle avec le dataset
     */
    public function trainModel(Request $request)
    {
        try {
            $result = $this->predictionService->trainModel();

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Modèle entraîné avec succès'
            ]);
        } catch (Exception $e) {
            Log::error('Erreur trainModel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de l\'entraînement: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère la prédiction existante pour un étudiant
     */
    public function getPrediction(Student $student)
    {
        try {
            $prediction = $this->predictionService->getPrediction($student);

            if (!$prediction) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune prédiction disponible pour cet étudiant'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $prediction
            ]);
        } catch (Exception $e) {
            Log::error('Erreur getPrediction: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => 'Erreur lors de la récupération de la prédiction: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Interface pour les étudiants
     */
    public function studentPredictionInterface(Request $request)
    {
        try {
            $user = $request->user();
            $student = Student::where('user_id', $user->id)->first();

            if (!$student) {
                return redirect()->back()->with('error', 'Profil étudiant non trouvé');
            }

            // Récupérer ou créer la prédiction
            $prediction = $this->predictionService->getPrediction($student);

            if (!$prediction) {
                // Créer une nouvelle prédiction
                $prediction = $this->predictionService->predictForStudent($student);
            }

            return Inertia::render('student/master-prediction', [
                'student' => $student,
                'prediction' => $prediction
            ]);
        } catch (Exception $e) {
            Log::error('Erreur studentPredictionInterface: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Erreur lors du chargement de la prédiction');
        }
    }

    /**
     * Calcule les statistiques de prédiction
     */
    private function calculatePredictionStats($context)
    {
        $predictions = MasterPrediction::whereHas('student.notes', function ($query) use ($context) {
            $query->where('academic_year_id', $context['academic_year_id'])
                ->where('promotion_id', $context['promotion_id']);
        })
            ->get();

        $stats = [
            'total_predictions' => $predictions->count(),
            'average_confidence' => $predictions->avg('confidence_score'),
            'programs_distribution' => [],
            'high_confidence_count' => $predictions->where('confidence_score', '>=', 75)->count(),
            'medium_confidence_count' => $predictions->whereBetween('confidence_score', [60, 74])->count(),
            'low_confidence_count' => $predictions->where('confidence_score', '<', 60)->count(),
        ];

        // Distribution par programme
        $distribution = $predictions->groupBy('predicted_master')
            ->map(function ($group) {
                return $group->count();
            })
            ->toArray();

        $stats['programs_distribution'] = $distribution;

        return $stats;
    }
}
