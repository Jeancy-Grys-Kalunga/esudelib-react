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
                abort(403, 'Jury context not set.');
            }

            $academicYear = AcademicYear::findOrFail($context['academic_year_id']);
            $promotion = Promotion::findOrFail($context['promotion_id']);

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
            $stats = $this->predictionService->calculatePredictionStats($context);

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

            // Sanitize UTF-8 for response
            array_walk_recursive($result, function (&$item, $key) {
                if (is_string($item)) {
                    $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
                }
            });

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

            $results = $this->predictionService->predictBatch($context);

            // Sanitize UTF-8 for response
            array_walk_recursive($results, function (&$item, $key) {
                if (is_string($item)) {
                    $item = mb_convert_encoding($item, 'UTF-8', 'UTF-8');
                }
            });

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
     * Récupère la prédiction pour un étudiant
     */
    public function getPrediction($student_id)
    {
        try {
            $student = Student::findOrFail($student_id);
            $prediction = $this->predictionService->getPrediction($student);

            return response()->json([
                'success' => true,
                'data' => $prediction
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Génère le dataset d'entraînement
     */
    public function generateDataset()
    {
        try {
            // Logique de génération à implémenter si nécessaire
            // Pour l'instant on retourne un succès simulé
            return response()->json([
                'success' => true,
                'message' => 'Dataset généré avec succès (Simulé)'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporte le rapport de prédiction pour un étudiant
     */
    public function exportPredictionReport($student_id)
    {
        return response()->json([
            'success' => false,
            'error' => 'Fonctionnalité d\'export non implémentée'
        ], 501);
    }

    /**
     * Exporte toutes les prédictions
     */
    public function exportAllPredictions()
    {
        return response()->json([
            'success' => false,
            'error' => 'Fonctionnalité d\'export global non implémentée'
        ], 501);
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
