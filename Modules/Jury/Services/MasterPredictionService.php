<?php

namespace Modules\Jury\Services;

use Modules\Jury\Entities\MasterPrediction;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Note;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class MasterPredictionService
{
    private $pythonPath;
    private $scriptPath;
    private $modelPath;

    public function __construct()
    {
        $this->pythonPath = env('PYTHON_PATH', 'python');

        // Force absolute path for storage-relative paths to satisfy Windows shell
        if (str_starts_with($this->pythonPath, 'storage')) {
            $this->pythonPath = base_path($this->pythonPath);
        } elseif ($this->pythonPath !== 'python' && !file_exists($this->pythonPath) && file_exists(base_path($this->pythonPath))) {
            $this->pythonPath = base_path($this->pythonPath);
        }

        $this->scriptPath = storage_path('ml/master_prediction_xgboost.py');
        $this->modelPath = storage_path('ml/xgboost_filiere_model.pkl');
    }

    /**
     * Entraîne le modèle XGBoost
     */
    public function trainModel()
    {
        try {
            set_time_limit(600);
            ini_set('memory_limit', '1024M');

            Log::info('Début de l\'entraînement du modèle XGBoost');

            // Vérifier que le script Python existe
            if (!file_exists($this->scriptPath)) {
                throw new Exception("Script Python non trouvé: {$this->scriptPath}");
            }

            // Récupérer le dataset
            Log::info('Récupération du dataset depuis la base de données...');

            $dataset = DB::table('master_training_datasets')
                ->select([
                    'genre',
                    'intention',
                    'optional_courses',
                    'provenance_region',
                    'etablissement',
                    'age',
                    'moyenne_licence',
                    'actual_master'
                ])
                ->get()
                ->map(function ($record) {
                    return [
                        'genre' => $record->genre,
                        'intention' => $record->intention,
                        'optional_courses' => json_decode($record->optional_courses, true) ?? [],
                        'provenance_region' => $record->provenance_region,
                        'etablissement' => $record->etablissement,
                        'age' => (int) $record->age,
                        'moyenne_licence' => (float) $record->moyenne_licence,
                        'actual_master' => $record->actual_master,
                    ];
                })

                ->values() // Réindexer le tableau
                ->toArray();

            if (empty($dataset)) {
                throw new Exception("Le dataset est vide. Veuillez d'abord générer le dataset.");
            }

            Log::info("Dataset récupéré: " . count($dataset) . " enregistrements");

            // Sauvegarder le dataset dans un fichier temporaire
            $tempFile = storage_path('ml/temp_training_data.json');

            // Créer le répertoire si nécessaire
            $mlDir = dirname($tempFile);
            if (!file_exists($mlDir)) {
                mkdir($mlDir, 0755, true);
            }

            // Sauvegarder avec encodage UTF-8
            $jsonData = json_encode($dataset, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            if ($jsonData === false) {
                throw new Exception("Erreur lors de l'encodage JSON: " . json_last_error_msg());
            }

            file_put_contents($tempFile, $jsonData);

            $command = sprintf(
                '%s "%s" train "%s" "%s" 2> NUL',
                escapeshellcmd($this->pythonPath),
                escapeshellarg($this->scriptPath),
                escapeshellarg($tempFile), // Passe le chemin du fichier au lieu du JSON directement
                escapeshellarg($this->modelPath)
            );

            Log::info("Commande Python: {$command}");
            Log::info("Lancement de l'entraînement...");

            $output = shell_exec($command);

            // Supprimer le fichier temporaire
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }

            // Parser la sortie JSON
            $result = json_decode($output, true);

            if ($result === null && json_last_error() !== JSON_ERROR_NONE) {
                $error = "Erreur de parsing JSON: " . json_last_error_msg() . "\nSortie Python: " . substr($output, 0, 500);
                Log::error($error);
                throw new Exception($error);
            }

            if (isset($result['error'])) {
                Log::error("Erreur Python: " . $result['error']);
                throw new Exception($result['error']);
            }

            Log::info("Modèle XGBoost entraîné avec succès. Précision: " . ($result['accuracy'] * 100) . "%");
            Log::info("Modèle sauvegardé dans: " . $this->modelPath);

            return $result;
        } catch (Exception $e) {
            Log::error('Erreur lors de l\'entraînement du modèle: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            throw $e;
        }
    }

    /**
     * Prédit la filière de Master pour un étudiant
     */
    public function predictForStudent(Student $student)
    {
        try {
            // Préparer les données de l'étudiant
            $studentData = $this->prepareStudentData($student);

            // Vérifier si le modèle existe
            if (!file_exists($this->modelPath)) {
                throw new Exception("Modèle XGBoost non trouvé. Veuillez d'abord entraîner le modèle.");
            }

            // Appeler le script Python pour la prédiction
            // Utiliser JSON_INVALID_UTF8_IGNORE pour éviter les erreurs sur les données d'entrée
            $studentDataJson = json_encode($studentData, JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_IGNORE);

            // Sauvegarder les données dans un fichier temporaire pour éviter les problèmes de CLI
            $tempFile = storage_path('ml/temp_predict_' . uniqid() . '.json');
            file_put_contents($tempFile, $studentDataJson);

            $command = sprintf(
                '%s "%s" predict "%s" "%s" 2> NUL',
                escapeshellcmd($this->pythonPath),
                escapeshellarg($this->scriptPath),
                escapeshellarg($tempFile),
                escapeshellarg($this->modelPath)
            );

            Log::info("Commande de prédiction: " . $command);
            $output = shell_exec($command);

            // Nettoyage
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }

            Log::info("Sortie Python: " . substr($output, 0, 1000));

            // Nettoyer la sortie pour garantir l'UTF-8 avant le décodage
            $output = mb_convert_encoding($output, 'UTF-8', 'UTF-8');

            $result = json_decode($output, true);

            if ($result === null && json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception("Erreur de parsing JSON: " . json_last_error_msg() . ". Sortie: " . substr($output, 0, 500));
            }

            if (isset($result['error'])) {
                throw new Exception($result['error']);
            }

            if (!isset($result['predicted_master'])) {
                throw new Exception("Réponse invalide du script Python.");
            }

            // Sauvegarder la prédiction
            $prediction = MasterPrediction::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'predicted_master' => $result['predicted_master'],
                    'confidence_score' => $result['confidence_score'],
                    'age' => $studentData['age'] ?? null,
                    'provenance' => $studentData['provenance_region'] ?? null,
                    'intention_expressed' => $studentData['intention'] ?? null,
                    'optional_courses' => $studentData['optional_courses'] ?? [],
                    'prediction_details' => [
                        'all_probabilities' => $result['all_probabilities'],
                        'top_3_programs' => $result['top_3_programs'],
                        'explanation' => $result['explanation'],
                    ],
                    'predicted_at' => now(),
                ]
            );

            return [
                'success' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'matricule' => $student->matricule,
                ],
                'prediction' => $result,
            ];
        } catch (Exception $e) {
            Log::error('Erreur lors de la prédiction pour l\'étudiant ' . $student->id . ': ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Prépare les données d'un étudiant pour la prédiction
     */
    private function prepareStudentData(Student $student)
    {
        // Calculer l'âge
        $age = 20; // Valeur par défaut
        if (!empty($student->date_of_birth)) {
            try {
                if (is_numeric($student->date_of_birth)) {
                    // Format Excel serial date
                    $birthDate = \Carbon\Carbon::createFromTimestamp(($student->date_of_birth - 25569) * 86400);
                } else {
                    $birthDate = \Carbon\Carbon::parse($student->date_of_birth);
                }
                $age = $birthDate->age;
            } catch (\Exception $e) {
                Log::warning("Date de naissance invalide pour l'étudiant {$student->id}: {$student->date_of_birth}");
            }
        }

        // Récupérer les notes et calculer la moyenne
        $notes = Note::where('student_id', $student->id)
            ->whereNotNull('cote')
            ->get();

        $moyenne_licence = $notes->avg('cote') ?? 10.0;

        // Extraire le genre
        $genre = $this->extractGender($student);

        // Intention exprimée
        $intention = $this->extractIntention($student);

        // Cours optionnels
        $optionalCourses = $this->extractOptionalCourses($student);

        // Provenance région
        $provenance_region = $this->extractProvenanceRegion($student);

        // Établissement
        $etablissement = $this->extractEtablissement($student);

        return [
            'genre' => $genre,
            'intention' => $intention,
            'optional_courses' => $optionalCourses,
            'provenance_region' => $provenance_region,
            'etablissement' => $etablissement,
            'age' => $age,
            'moyenne_licence' => round($moyenne_licence, 2),
        ];
    }

    private function extractGender($student)
    {
        if (isset($student->gender) && !empty($student->gender)) {
            return ucfirst(strtolower($student->gender));
        }

        // Détection basée sur le prénom
        $name = strtolower($student->name);
        $femaleKeywords = ['marie', 'rose', 'anne', 'sarah', 'fatima', 'naomi', 'claire', 'sophie'];

        foreach ($femaleKeywords as $keyword) {
            if (strpos($name, $keyword) !== false) {
                return 'Féminin';
            }
        }

        return 'Masculin';
    }

    private function extractIntention($student)
    {
        if (isset($student->intention_master) && !empty($student->intention_master)) {
            return $student->intention_master;
        }

        // Déterminer à partir des meilleures notes
        $notes = Note::where('student_id', $student->id)
            ->with('course')
            ->whereNotNull('cote')
            ->get();

        $domainMapping = [
            'Informatique' => ['informatique', 'programmation', 'algorithme', 'base de données', 'réseau'],
            'Génie Civil' => ['génie civil', 'construction', 'bâtiment', 'structure'],
            'Électromécanique' => ['électromécanique', 'électricité', 'mécanique', 'automatisme'],
            'Gestion' => ['gestion', 'comptabilité', 'finance', 'marketing', 'management'],
            'Droit' => ['droit', 'juridique', 'législation'],
            'Économie' => ['économie', 'macroéconomie', 'microéconomie'],
            'Médecine' => ['médecine', 'santé', 'anatomie', 'physiologie'],
            'Sciences Politiques' => ['politique', 'sociologie', 'philosophie']
        ];

        $domainScores = array_fill_keys(array_keys($domainMapping), 0);

        foreach ($notes as $note) {
            $courseTitle = strtolower($note->course->title ?? '');
            $cote = $note->cote;

            foreach ($domainMapping as $domain => $keywords) {
                foreach ($keywords as $keyword) {
                    if (str_contains($courseTitle, $keyword)) {
                        $domainScores[$domain] += $cote;
                        break;
                    }
                }
            }
        }

        // Retourner le domaine avec le score le plus élevé
        arsort($domainScores);
        return array_key_first($domainScores) ?? 'Informatique';
    }

    private function extractOptionalCourses($student)
    {
        $optionalCourses = DB::table('course_student')
            ->join('courses', 'courses.id', '=', 'course_student.course_id')
            ->where('course_student.student_id', $student->id)
            ->where('courses.is_optional', true)
            ->pluck('courses.title')
            ->toArray();

        return $optionalCourses;
    }

    private function extractProvenanceRegion($student)
    {
        if (isset($student->region_origin) && !empty($student->region_origin)) {
            return $student->region_origin;
        }

        if (isset($student->birth_place) && !empty($student->birth_place)) {
            $place = strtolower($student->birth_place);
            $regions = [
                'kinshasa' => 'Kinshasa',
                'lubumbashi' => 'Katanga',
                'goma' => 'Nord-Kivu',
                'bukavu' => 'Sud-Kivu',
                'kisangani' => 'Tshopo',
                'mbuji-mayi' => 'Kasaï Oriental',
                'kananga' => 'Kasaï Central',
                'matadi' => 'Kongo Central'
            ];

            foreach ($regions as $keyword => $region) {
                if (str_contains($place, $keyword)) {
                    return $region;
                }
            }
        }

        return 'Kinshasa';
    }

    private function extractEtablissement($student)
    {
        if (isset($student->institution_origin) && !empty($student->institution_origin)) {
            return $student->institution_origin;
        }

        return 'ESU-DELIB';
    }

    /**
     * Récupère la prédiction existante pour un étudiant
     */
    public function getPrediction(Student $student)
    {
        $prediction = MasterPrediction::where('student_id', $student->id)->first();

        if (!$prediction) {
            return null;
        }

        return [
            'success' => true,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'matricule' => $student->matricule,
            ],
            'prediction' => [
                'predicted_master' => $prediction->predicted_master,
                'confidence_score' => $prediction->confidence_score,
                'all_probabilities' => $prediction->prediction_details['all_probabilities'] ?? [],
                'top_3_programs' => $prediction->prediction_details['top_3_programs'] ?? [],
                'explanation' => $prediction->prediction_details['explanation'] ?? [],
                'predicted_at' => $prediction->predicted_at->toISOString(),
            ],
        ];
    }
}
