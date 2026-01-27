<?php

namespace Modules\Jury\Services;

use Modules\Jury\Entities\MasterPrediction;
use Modules\Jury\Entities\MasterTrainingDataset;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Note;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class MasterPredictionService
{
    private $pythonPath;
    private $scriptPath;

    public function __construct()
    {
        $this->pythonPath = env('PYTHON_PATH', 'python');
        $this->scriptPath = storage_path('ml/master_prediction.py');
    }

    /**
     * Entraîne le modèle avec le dataset
     */
    public function trainModel()
    {
        try {
            // Augmenter le temps d'exécution maximum à 10 minutes pour l'entraînement
            set_time_limit(600);
            ini_set('memory_limit', '1024M');

            Log::info('Début de l\'entraînement du modèle ML');

            // Vérifier que le script Python existe
            if (!file_exists($this->scriptPath)) {
                throw new Exception("Script Python non trouvé: {$this->scriptPath}");
            }

            // Vérifier que Python est accessible
            $pythonVersion = shell_exec("{$this->pythonPath} --version 2>&1");
            Log::info("Version Python: {$pythonVersion}");

            // Récupérer le dataset directement depuis la base de données
            Log::info('Récupération du dataset depuis la base de données...');

            $dataset = DB::table('master_training_datasets')
                ->select([
                    'age',
                    'provenance',
                    'intention_expressed',
                    'optional_courses',
                    'internships',
                    'average_grade',
                    'grades_by_subject',
                    'actual_master'
                ])
                ->get()
                ->map(function ($record) {
                    // Décoder les champs JSON si nécessaire
                    return [
                        'age' => $record->age,
                        'provenance' => $record->provenance,
                        'intention_expressed' => $record->intention_expressed,
                        'optional_courses' => json_decode($record->optional_courses, true) ?? [],
                        'internships' => json_decode($record->internships, true) ?? [],
                        'average_grade' => (float) $record->average_grade,
                        'grades_by_subject' => json_decode($record->grades_by_subject, true) ?? [],
                        'actual_master' => $record->actual_master,
                    ];
                })->toArray();

            if (empty($dataset)) {
                throw new Exception("Le dataset est vide. Veuillez générer le dataset d'abord avec: php artisan master:generate-dataset");
            }

            Log::info("Dataset récupéré: " . count($dataset) . " enregistrements");

            // Sauvegarder le dataset dans un fichier temporaire
            $tempFile = storage_path('ml/temp_training_data.json');

            // Créer le répertoire si nécessaire
            $mlDir = dirname($tempFile);
            if (!file_exists($mlDir)) {
                mkdir($mlDir, 0755, true);
                Log::info("Répertoire ML créé: {$mlDir}");
            }

            // Vérifier les permissions d'écriture
            if (!is_writable($mlDir)) {
                throw new Exception("Le répertoire {$mlDir} n'est pas accessible en écriture. Vérifiez les permissions.");
            }

            // Sauvegarder avec encodage UTF-8
            $jsonData = json_encode($dataset, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            if ($jsonData === false) {
                throw new Exception("Erreur lors de l'encodage JSON: " . json_last_error_msg());
            }

            file_put_contents($tempFile, $jsonData);
            Log::info("Dataset sauvegardé dans: {$tempFile} (" . filesize($tempFile) . " bytes)");

            $pythonCmd = $this->pythonPath;
            // Sur Windows, si le chemin vers Python contient des espaces ou si c'est juste 'python', on doit faire attention
            // Utilisons escapeshellarg pour le script et le fichier temp, mais pour python, escapeshellcmd devrait aller si c'est juste 'python'
            // Mais si c'est un chemin absolu, il faut des guillemets.

            $command = sprintf(
                '%s "%s" "%s" 2>&1',
                $pythonCmd, // On suppose que python est dans le PATH ou correctement configuré
                $this->scriptPath,
                $tempFile
            );

            Log::info("Commande Python (RAW): " . $command);
            Log::info("Commande Python: {$command}");
            Log::info("Lancement de l'entraînement...");

            $output = shell_exec($command);

            Log::info("Sortie Python brute: " . substr($output, 0, 500));

            // Supprimer le fichier temporaire
            if (file_exists($tempFile)) {
                unlink($tempFile);
                Log::info("Fichier temporaire supprimé");
            }

            // Parser la sortie JSON
            $result = json_decode($output, true);

            if ($result === null && json_last_error() !== JSON_ERROR_NONE) {
                $error = "Erreur de parsing JSON: " . json_last_error_msg() . "\nSortie Python: " . $output;
                Log::error($error);
                throw new Exception($error);
            }

            if (isset($result['error'])) {
                Log::error("Erreur Python: " . $result['error']);
                throw new Exception($result['error']);
            }

            if (!isset($result['accuracy'])) {
                throw new Exception("Réponse invalide du script Python. Sortie: " . $output);
            }

            Log::info("Modèle entraîné avec succès. Précision: " . ($result['accuracy'] * 100) . "%");

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

            // Appeler le script Python pour la prédiction
            $studentDataJson = json_encode($studentData);

            $pythonCmd = $this->pythonPath;

            $command = sprintf(
                '%s "%s" predict %s 2>&1',
                $pythonCmd,
                $this->scriptPath,
                escapeshellarg($studentDataJson) // JSON argument needs standard escaping
            );

            $output = shell_exec($command);
            $result = json_decode($output, true);

            if (isset($result['error'])) {
                throw new Exception($result['error']);
            }

            // Sauvegarder la prédiction
            $prediction = MasterPrediction::updateOrCreate(
                ['student_id' => $student->id],
                [
                    'age' => $studentData['age'],
                    'provenance' => $studentData['provenance'],
                    'intention_expressed' => $studentData['intention_expressed'],
                    'optional_courses' => $studentData['optional_courses'],
                    'internships' => $studentData['internships'],
                    'predicted_master' => $result['predicted_master'],
                    'confidence_score' => $result['confidence_score'],
                    'prediction_details' => [
                        'all_probabilities' => $result['all_probabilities'],
                        'top_3_programs' => $result['top_3_programs'],
                        'explanation' => $result['explanation'],
                    ],
                    'predicted_at' => now(),
                ]
            );

            return [
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
        if (is_numeric($student->date_of_birth)) {
            // Supposons un format Excel serial date (jours depuis 30/12/1899)
            // 25569 est le nombre de jours entre 01/01/1970 et 30/12/1899
            $birthDate = \Carbon\Carbon::createFromTimestamp(($student->date_of_birth - 25569) * 86400);
        } else {
            try {
                $birthDate = \Carbon\Carbon::parse($student->date_of_birth);
            } catch (\Exception $e) {
                // Fallback si la date est invalide, on met une date par défaut pour éviter le crash
                Log::warning("Date de naissance invalide pour l'étudiant {$student->id}: {$student->date_of_birth}. Utilisation de la date actuelle.");
                $birthDate = now()->subYears(20); // Supposons 20 ans
            }
        }
        $age = $birthDate->age;

        // Récupérer les notes
        $notes = Note::where('student_id', $student->id)
            ->with('course')
            ->whereNotNull('cote')
            ->get();

        // Calculer la moyenne générale
        $averageGrade = $notes->avg('cote') ?? 10.0;

        // Calculer les notes par domaine
        $gradesBySubject = $this->calculateGradesBySubject($notes);

        // Extraire la provenance (à adapter selon vos données)
        $provenance = $this->extractProvenance($student);

        // Intention exprimée (à adapter selon vos données)
        $intentionExpressed = $this->extractIntention($student);

        // Cours optionnels (à adapter selon vos données)
        $optionalCourses = $this->extractOptionalCourses($student);

        // Stages (à adapter selon vos données)
        $internships = $this->extractInternships($student);

        return [
            'age' => $age,
            'provenance' => $provenance,
            'intention_expressed' => $intentionExpressed,
            'optional_courses' => $optionalCourses,
            'internships' => $internships,
            'average_grade' => round($averageGrade, 2),
            'grades_by_subject' => $gradesBySubject,
        ];
    }

    private function calculateGradesBySubject($notes)
    {
        $subjectAreas = [
            'Informatique',
            'Mathématiques',
            'Physique',
            'Chimie',
            'Sciences Humaines',
            'Langues',
            'Gestion',
            'Droit'
        ];

        $courseMapping = [
            'Informatique' => ['informatique', 'programmation', 'algorithme', 'base de données', 'réseau', 'web', 'software'],
            'Mathématiques' => ['mathématique', 'algèbre', 'analyse', 'statistique', 'probabilité'],
            'Physique' => ['physique', 'mécanique', 'électricité', 'thermodynamique'],
            'Chimie' => ['chimie', 'biochimie', 'organique'],
            'Sciences Humaines' => ['sociologie', 'psychologie', 'philosophie', 'histoire', 'anthropologie'],
            'Langues' => ['français', 'anglais', 'lingala', 'swahili', 'langue'],
            'Gestion' => ['gestion', 'comptabilité', 'finance', 'marketing', 'économie', 'management'],
            'Droit' => ['droit', 'juridique', 'législation', 'constitution'],
        ];

        $gradesBySubject = [];
        $averageGrade = $notes->avg('cote') ?? 10.0;

        foreach ($subjectAreas as $subject) {
            $keywords = $courseMapping[$subject] ?? [];
            $relevantNotes = $notes->filter(function ($note) use ($keywords) {
                $courseTitle = strtolower($note->course->title ?? '');
                foreach ($keywords as $keyword) {
                    if (str_contains($courseTitle, $keyword)) {
                        return true;
                    }
                }
                return false;
            });

            if ($relevantNotes->count() > 0) {
                $gradesBySubject[$subject] = round($relevantNotes->avg('cote'), 2);
            } else {
                $gradesBySubject[$subject] = round($averageGrade, 2);
            }
        }

        return $gradesBySubject;
    }

    private function extractProvenance($student)
    {
        // À adapter selon vos données
        // Pour l'instant, retourne une valeur par défaut
        return 'Kinshasa';
    }

    private function extractIntention($student)
    {
        // À adapter selon vos données
        // Vérifier s'il y a un champ d'intention dans votre base de données
        return null;
    }

    private function extractOptionalCourses($student)
    {
        // À adapter selon vos données
        // Récupérer les cours optionnels suivis par l'étudiant
        $optionalCourses = DB::table('course_student')
            ->join('courses', 'courses.id', '=', 'course_student.course_id')
            ->where('course_student.student_id', $student->id)
            ->where('courses.is_optional', true) // Supposant qu'il y a un champ is_optional
            ->pluck('courses.title')
            ->toArray();

        return $optionalCourses;
    }

    private function extractInternships($student)
    {
        // À adapter selon vos données
        // Pour l'instant, retourne un tableau vide
        // Vous pouvez créer une table internships si nécessaire
        return [];
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
