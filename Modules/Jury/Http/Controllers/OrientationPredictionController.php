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
                ->with(['notes' => function ($query) use ($context) {
                    $query->where('academic_year_id', $context['academic_year_id'])
                        ->where('promotion_id', $context['promotion_id']);
                }])
                ->paginate(20);

            // Récupérer les crédits pour le calcul de la moyenne
            $coursesWithCredits = DB::table('course_program_details')
                ->where('promotion_id', $promotion->id)
                ->pluck('credits', 'course_id')
                ->toArray();

            // Calculer la moyenne pondérée pour chaque étudiant
            $students->getCollection()->transform(function ($student) use ($coursesWithCredits) {
                $student->average = $student->calculateWeightedAverage($student->notes, $coursesWithCredits);
                return $student;
            });

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
     * Entraîne le modèle XGBoost
     */
    public function trainModel(Request $request)
    {
        try {
            $result = $this->predictionService->trainModel();

            return response()->json([
                'success' => true,
                'message' => 'Modèle XGBoost entraîné avec succès',
                'data' => $result
            ]);
        } catch (Exception $e) {
            Log::error('Erreur trainModel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Prédit l'orientation pour un étudiant spécifique
     */
    public function predictOrientation($studentId)
    {
        try {
            $student = Student::findOrFail($studentId);
            $result = $this->predictionService->predictForStudent($student);

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            Log::error('Erreur predictOrientation pour étudiant ' . $studentId . ': ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
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

            // Vérifier si le modèle existe
            $modelPath = storage_path('ml/xgboost_filiere_model.pkl');
            if (!file_exists($modelPath)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Modèle non entraîné. Veuillez d\'abord entraîner le modèle.'
                ], 400);
            }

            // Récupérer tous les étudiants de la promotion
            $students = Student::whereHas('notes', function ($query) use ($context) {
                $query->where('academic_year_id', $context['academic_year_id'])
                    ->where('promotion_id', $context['promotion_id']);
            })
                ->get();

            $results = [
                'successful' => 0,
                'failed' => 0,
                'total' => count($students),
                'details' => []
            ];

            foreach ($students as $student) {
                try {
                    $prediction = $this->predictionService->predictForStudent($student);
                    $results['successful']++;
                    $results['details'][] = [
                        'student_id' => $student->id,
                        'student_name' => $student->name,
                        'success' => true,
                        'prediction' => $prediction['prediction']['predicted_master'],
                        'confidence' => $prediction['prediction']['confidence_score']
                    ];
                } catch (Exception $e) {
                    $results['failed']++;
                    $results['details'][] = [
                        'student_id' => $student->id,
                        'student_name' => $student->name,
                        'success' => false,
                        'error' => $e->getMessage()
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Prédictions en lot terminées',
                'data' => $results
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

        if ($predictions->count() === 0) {
            return [
                'total_predictions' => 0,
                'average_confidence' => 0,
                'high_confidence_count' => 0,
                'medium_confidence_count' => 0,
                'low_confidence_count' => 0,
                'programs_distribution' => []
            ];
        }

        $stats = [
            'total_predictions' => $predictions->count(),
            'average_confidence' => round($predictions->avg('confidence_score'), 1),
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

    /**
     * Récupère le statut du modèle
     */
    public function getModelStatus()
    {
        try {
            $modelPath = storage_path('ml/xgboost_filiere_model.pkl');
            $exists = file_exists($modelPath);

            $info = [];
            if ($exists) {
                try {
                    // Obtenir les informations du fichier
                    $info = [
                        'size' => filesize($modelPath),
                        'modified' => date('Y-m-d H:i:s', filemtime($modelPath)),
                        'exists' => true
                    ];
                } catch (Exception $e) {
                    $info = ['exists' => true, 'error' => $e->getMessage()];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'model_exists' => $exists,
                    'model_path' => $modelPath,
                    'model_info' => $info
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
