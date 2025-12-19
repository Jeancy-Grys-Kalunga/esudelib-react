<?php

namespace Modules\Jury\Console;

use Illuminate\Console\Command;
use Modules\Jury\Entities\MasterTrainingDataset;
use Modules\Student\Entities\Student;
use Modules\Student\Entities\Note;
use Modules\Institution\Entities\Course;
use Illuminate\Support\Facades\DB;

class GenerateMasterDataset extends Command
{
    protected $signature = 'master:generate-dataset {--count=20000 : Number of records to generate}';
    protected $description = 'Génère un dataset pour l\'entraînement du modèle de prédiction de Master';

    private $masterPrograms = [
        'Informatique',
        'Génie Civil',
        'Électromécanique',
        'Gestion',
        'Droit',
        'Économie',
        'Médecine',
        'Sciences Politiques'
    ];

    private $provinces = [
        'Kinshasa',
        'Lubumbashi',
        'Goma',
        'Bukavu',
        'Kisangani',
        'Kananga',
        'Mbuji-Mayi',
        'Matadi',
        'Mbandaka',
        'Autres'
    ];

    private $subjectAreas = [
        'Informatique',
        'Mathématiques',
        'Physique',
        'Chimie',
        'Sciences Humaines',
        'Langues',
        'Gestion',
        'Droit'
    ];

    public function handle()
    {
        $count = $this->option('count');
        $this->info("Génération de {$count} enregistrements pour le dataset...");

        // 1. Récupérer les données réelles des étudiants existants
        $realStudentsData = $this->extractRealStudentsData();
        $realCount = count($realStudentsData);

        $this->info("Données réelles extraites: {$realCount} étudiants");

        // 2. Sauvegarder les données réelles
        foreach ($realStudentsData as $data) {
            MasterTrainingDataset::create($data);
        }

        // 3. Générer des données synthétiques pour compléter
        $syntheticCount = max(0, $count - $realCount);

        if ($syntheticCount > 0) {
            $this->info("Génération de {$syntheticCount} enregistrements synthétiques...");

            $bar = $this->output->createProgressBar($syntheticCount);
            $bar->start();

            for ($i = 0; $i < $syntheticCount; $i++) {
                $data = $this->generateSyntheticRecord();
                MasterTrainingDataset::create($data);
                $bar->advance();
            }

            $bar->finish();
            $this->newLine();
        }

        $this->info("Dataset généré avec succès!");
        $this->info("Total: " . MasterTrainingDataset::count() . " enregistrements");
        $this->info("Réels: {$realCount}, Synthétiques: {$syntheticCount}");

        return 0;
    }

    private function extractRealStudentsData()
    {
        $students = Student::with(['notes.course', 'inscriptions'])
            ->whereHas('notes')
            ->get();

        $dataset = [];

        foreach ($students as $student) {
            try {
                // Calculer l'âge avec gestion d'erreur
                $age = 22; // Valeur par défaut

                if (!empty($student->date_of_birth)) {
                    try {
                        if (is_numeric($student->date_of_birth)) {
                            // Handle Excel serial date
                            $birthDate = \Carbon\Carbon::createFromTimestamp(($student->date_of_birth - 25569) * 86400);
                            $calculatedAge = $birthDate->age;
                        } elseif (is_string($student->date_of_birth) && strlen($student->date_of_birth) > 4) {
                            $birthDate = \Carbon\Carbon::parse($student->date_of_birth);
                            $calculatedAge = $birthDate->age;
                        } else {
                            $calculatedAge = 22;
                        }

                        // Vérifier que l'âge est réaliste (entre 18 et 50 ans)
                        if (isset($calculatedAge) && $calculatedAge >= 18 && $calculatedAge <= 50) {
                            $age = $calculatedAge;
                        }
                    } catch (\Exception $e) {
                        // En cas d'erreur, utiliser un âge aléatoire réaliste
                        $age = rand(20, 28);
                    }
                } else {
                    // En cas d'erreur, utiliser un âge aléatoire réaliste
                    $age = rand(20, 28);
                }


                // Extraire la provenance (utiliser une logique basée sur les données disponibles)
                $provenance = $this->extractProvenance($student);

                // Calculer la moyenne générale
                $averageGrade = $student->notes->avg('cote') ?? 10.0;

                // Calculer les notes par domaine
                $gradesBySubject = $this->calculateGradesBySubject($student->notes);

                // Extraire les cours optionnels (simulé pour l'instant)
                $optionalCourses = $this->extractOptionalCourses($student);

                // Extraire les stages (simulé pour l'instant)
                $internships = $this->extractInternships($student);

                // Déterminer la filière actuelle (basé sur les cours suivis)
                $actualMaster = $this->determineMasterProgram($gradesBySubject, $student);

                $dataset[] = [
                    'age' => $age,
                    'provenance' => $provenance,
                    'intention_expressed' => $actualMaster, // Simulé
                    'optional_courses' => $optionalCourses,
                    'internships' => $internships,
                    'average_grade' => round($averageGrade, 2),
                    'grades_by_subject' => $gradesBySubject,
                    'actual_master' => $actualMaster,
                    'is_synthetic' => false,
                ];
            } catch (\Exception $e) {
                // En cas d'erreur pour cet étudiant, on le saute et on continue
                $this->warn("Erreur pour l'étudiant {$student->id}: " . $e->getMessage());
                continue;
            }
        }

        return $dataset;
    }

    private function extractProvenance($student)
    {
        // Logique pour extraire la provenance
        // Pour l'instant, on utilise une distribution aléatoire
        return $this->provinces[array_rand($this->provinces)];
    }

    private function calculateGradesBySubject($notes)
    {
        $gradesBySubject = [];

        // Mapper les cours aux domaines
        $courseMapping = [
            'Informatique' => ['informatique', 'programmation', 'algorithme', 'base de données', 'réseau'],
            'Mathématiques' => ['mathématique', 'algèbre', 'analyse', 'statistique'],
            'Physique' => ['physique', 'mécanique', 'électricité'],
            'Chimie' => ['chimie', 'biochimie'],
            'Sciences Humaines' => ['sociologie', 'psychologie', 'philosophie', 'histoire'],
            'Langues' => ['français', 'anglais', 'lingala', 'swahili'],
            'Gestion' => ['gestion', 'comptabilité', 'finance', 'marketing', 'économie'],
            'Droit' => ['droit', 'juridique', 'législation'],
        ];

        foreach ($this->subjectAreas as $subject) {
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
                // Utiliser la moyenne générale si aucun cours correspondant
                $gradesBySubject[$subject] = round($notes->avg('cote') ?? 10.0, 2);
            }
        }

        return $gradesBySubject;
    }

    private function extractOptionalCourses($student)
    {
        // Pour l'instant, générer des données simulées
        $count = rand(0, 5);
        $courses = [];

        $optionalCoursesList = [
            'Intelligence Artificielle',
            'Big Data',
            'Cybersécurité',
            'Gestion de Projet',
            'Entrepreneuriat',
            'Marketing Digital',
            'Droit International',
            'Économie Numérique'
        ];

        for ($i = 0; $i < $count; $i++) {
            $courses[] = $optionalCoursesList[array_rand($optionalCoursesList)];
        }

        return array_unique($courses);
    }

    private function extractInternships($student)
    {
        // Pour l'instant, générer des données simulées
        $count = rand(0, 3);
        $internships = [];

        $companies = ['Vodacom', 'Airtel', 'Orange', 'BCDC', 'Rawbank', 'Equity Bank', 'SNEL', 'Regideso'];
        $durations = [1, 2, 3, 6];

        for ($i = 0; $i < $count; $i++) {
            $internships[] = [
                'company' => $companies[array_rand($companies)],
                'duration_months' => $durations[array_rand($durations)],
                'year' => rand(2020, 2024)
            ];
        }

        return $internships;
    }

    private function determineMasterProgram($gradesBySubject, $student)
    {
        // Déterminer la filière basée sur les meilleures notes
        arsort($gradesBySubject);
        $topSubject = array_key_first($gradesBySubject);

        // Mapper le domaine à un programme de Master
        $mapping = [
            'Informatique' => 'Informatique',
            'Mathématiques' => 'Informatique',
            'Physique' => 'Génie Civil',
            'Chimie' => 'Médecine',
            'Sciences Humaines' => 'Sciences Politiques',
            'Langues' => 'Sciences Politiques',
            'Gestion' => 'Gestion',
            'Droit' => 'Droit',
        ];

        return $mapping[$topSubject] ?? $this->masterPrograms[array_rand($this->masterPrograms)];
    }

    private function generateSyntheticRecord()
    {
        // Choisir une filière cible
        $actualMaster = $this->masterPrograms[array_rand($this->masterPrograms)];

        // Générer un âge réaliste
        $age = rand(20, 30);

        // Choisir une provenance
        $provenance = $this->provinces[array_rand($this->provinces)];

        // Générer une moyenne cohérente avec la filière
        $baseAverage = rand(100, 180) / 10; // 10.0 à 18.0

        // Générer les notes par domaine avec un biais vers la filière choisie
        $gradesBySubject = [];
        foreach ($this->subjectAreas as $subject) {
            if ($this->isRelatedSubject($subject, $actualMaster)) {
                // Notes plus élevées pour les matières liées
                $gradesBySubject[$subject] = min(20, $baseAverage + rand(0, 30) / 10);
            } else {
                // Notes normales pour les autres matières
                $gradesBySubject[$subject] = max(8, $baseAverage + rand(-20, 10) / 10);
            }
            $gradesBySubject[$subject] = round($gradesBySubject[$subject], 2);
        }

        // Intention exprimée (70% de correspondance avec la filière réelle)
        $intentionExpressed = (rand(1, 100) <= 70)
            ? $actualMaster
            : $this->masterPrograms[array_rand($this->masterPrograms)];

        // Cours optionnels
        $optionalCourses = $this->generateOptionalCourses($actualMaster);

        // Stages
        $internships = $this->generateInternships($actualMaster);

        return [
            'age' => $age,
            'provenance' => $provenance,
            'intention_expressed' => $intentionExpressed,
            'optional_courses' => $optionalCourses,
            'internships' => $internships,
            'average_grade' => round($baseAverage, 2),
            'grades_by_subject' => $gradesBySubject,
            'actual_master' => $actualMaster,
            'is_synthetic' => true,
        ];
    }

    private function isRelatedSubject($subject, $masterProgram)
    {
        $relations = [
            'Informatique' => ['Informatique', 'Mathématiques'],
            'Génie Civil' => ['Physique', 'Mathématiques'],
            'Électromécanique' => ['Physique', 'Mathématiques'],
            'Gestion' => ['Gestion', 'Mathématiques'],
            'Droit' => ['Droit', 'Sciences Humaines'],
            'Économie' => ['Gestion', 'Mathématiques'],
            'Médecine' => ['Chimie', 'Physique'],
            'Sciences Politiques' => ['Sciences Humaines', 'Langues', 'Droit'],
        ];

        return in_array($subject, $relations[$masterProgram] ?? []);
    }

    private function generateOptionalCourses($masterProgram)
    {
        $coursesByProgram = [
            'Informatique' => ['Intelligence Artificielle', 'Big Data', 'Cybersécurité', 'Cloud Computing'],
            'Génie Civil' => ['BIM', 'Géotechnique Avancée', 'Structures Métalliques'],
            'Gestion' => ['Entrepreneuriat', 'Marketing Digital', 'Finance Internationale'],
            'Droit' => ['Droit International', 'Droit des Affaires', 'Droit Pénal'],
            'Médecine' => ['Anatomie Pathologique', 'Radiologie', 'Urgences Médicales'],
        ];

        $availableCourses = $coursesByProgram[$masterProgram] ?? ['Cours Optionnel 1', 'Cours Optionnel 2'];
        $count = rand(0, min(3, count($availableCourses)));

        return array_slice($availableCourses, 0, $count);
    }

    private function generateInternships($masterProgram)
    {
        $companiesByProgram = [
            'Informatique' => ['Vodacom', 'Airtel', 'Orange', 'Equity Bank'],
            'Génie Civil' => ['BCDC', 'Rawbank', 'SNEL', 'Regideso'],
            'Gestion' => ['BCDC', 'Rawbank', 'Equity Bank', 'Vodacom'],
            'Droit' => ['Cabinet Juridique', 'Ministère de la Justice', 'ONG Internationale'],
            'Médecine' => ['Hôpital Général', 'Clinique Ngaliema', 'Centre Médical'],
        ];

        $companies = $companiesByProgram[$masterProgram] ?? ['Entreprise Générale'];
        $count = rand(0, 2);
        $internships = [];

        for ($i = 0; $i < $count; $i++) {
            $internships[] = [
                'company' => $companies[array_rand($companies)],
                'duration_months' => [1, 2, 3, 6][array_rand([1, 2, 3, 6])],
                'year' => rand(2020, 2024)
            ];
        }

        return $internships;
    }
}
