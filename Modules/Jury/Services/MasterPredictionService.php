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
            // Récupérer le dataset
            $dataset = MasterTrainingDataset::all()->map(function ($record) {
                return [
                    'age' => $record->age,
                    'provenance' => $record->provenance,
                    'intention_expressed' => $record->intention_expressed,
                    'optional_courses' => $record->optional_courses,
                    'internships' => $record->internships,
                    'average_grade' => $record->average_grade,
                    'grades_by_subject' => $record->grades_by_subject,
                    'actual_master' => $record->actual_master,
                ];
            })->toArray();

            if (empty($dataset)) {
                throw new Exception("Le dataset est vide. Veuillez générer le dataset d'abord.");
            }

            // Appeler le script Python pour l'entraînement
            $datasetJson = json_encode($dataset);
            $command = sprintf(
                '%s %s train %s 2>&1',
                escapeshellcmd($this->pythonPath),
                escapeshellarg($this->scriptPath),
                escapeshellarg($datasetJson)
            );

            $output = shell_exec($command);
            $result = json_decode($output, true);

            if (isset($result['error'])) {
                throw new Exception($result['error']);
            }

            return $result;
        } catch (Exception $e) {
            Log::error('Erreur lors de l\'entraînement du modèle: ' . $e->getMessage());
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
            $command = sprintf(
                '%s %s predict %s 2>&1',
                escapeshellcmd($this->pythonPath),
                escapeshellarg($this->scriptPath),
                escapeshellarg($studentDataJson)
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
        $birthDate = \Carbon\Carbon::parse($student->date_of_birth);
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
