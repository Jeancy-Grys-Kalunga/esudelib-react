<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\CourseCategory;
use Modules\Institution\Entities\CourseProgramDetail;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Semestre;
use Modules\Institution\Entities\UnitsTeaching;

class ProgramsImport implements ToCollection, WithHeadingRow
{
    protected $institutionId;
    protected $importedCount = 0;
    protected $programsCreated = 0;
    protected $skippedCount = 0;
    protected $errors = [];

    public function __construct($institutionId)
    {
        $this->institutionId = $institutionId;
    }

    public function collection(Collection $rows)
    {
        // Pré-charger les données pour éviter les requêtes N+1
        // Les cours semblent être globaux maintenant (plus de institution_id)
        $existingCourses = Course::pluck('id', 'title')->mapWithKeys(fn($id, $title) => [strtoupper($title) => $id]);
        $existingPromotions = Promotion::where('institution_id', $this->institutionId)->pluck('id', 'title')->mapWithKeys(fn($id, $title) => [strtoupper($title) => $id]);

        // Récupérer ou créer des valeurs par défaut pour les champs obligatoires mais optionnels dans l'import

        $defaultSemestre = Semestre::firstOrCreate(
            ['title' => 'Semestre 1']
        );

        foreach ($rows as $row) {
            try {
                // Validation basique
                if (!isset($row['intitule_cours']) || !isset($row['promotion'])) {
                    $this->skippedCount++;
                    continue;
                }

                $courseTitle = strtoupper(trim($row['intitule_cours']));
                $promotionName = strtoupper(trim($row['promotion']));

                // 1. Récupérer le programme basé sur la logique métier
                $programName = $this->determineProgramName($promotionName);

                if (!$programName) {
                    // Si aucune correspondance, on peut soit skipper, soit créer un programme générique
                    // Pour l'instant, on skip en loggant une erreur
                    $this->errors[] = "Impossible de déterminer le programme pour la promotion : $promotionName";
                    $this->skippedCount++;
                    continue;
                }

                // Trouver ou créer le programme
                $program = Program::firstOrCreate(
                    ['name' => $programName, 'institution_id' => $this->institutionId]
                );

                if ($program->wasRecentlyCreated) {
                    $this->programsCreated++;
                }

                // 2. Trouver les IDs liés
                $courseId = $existingCourses[$courseTitle] ?? null;
                // Si le cours n'existe pas, on skip (selon la demande "déjà enregistrer")
                if (!$courseId) {
                    $this->errors[] = "Cours non trouvé : $courseTitle";
                    $this->skippedCount++;
                    continue;
                }

                $promotionId = $existingPromotions[$promotionName] ?? null;
                // Si la promotion n'existe pas, on tente de voir si elle contient le nom de la faculté
                // La demande dit "Promotion le nom de la promotion enregistrée", on suppose qu'elle doit exister.
                if (!$promotionId) {
                    // Recherche approximative ou création ? Pour l'instant on skip.
                    $this->errors[] = "Promotion non trouvée : $promotionName";
                    $this->skippedCount++;
                    continue;
                }

                // 3. Calculer les heures
                $cm = isset($row['cmi']) ? (float)$row['cmi'] : 0;
                $tp_val = isset($row['tp']) ? (float)$row['tp'] : 0;
                $td = $tp_val / 2;
                $tp = $tp_val / 2;
                $credits = isset($row['credit']) ? (float)$row['credit'] : 0;

                // 4. Gérer Unité et Catégorie (Optionnels et Nullables)
                $unitId = null;
                if (!empty($row['unite_denseignement'])) {
                    $unit = UnitsTeaching::firstOrCreate(
                        ['title' => trim($row['unite_denseignement'])]
                    );
                    $unitId = $unit->id;
                }

                $categoryId = null;
                if (!empty($row['categorie'])) {
                    $cat = CourseCategory::firstOrCreate(['name' => trim($row['categorie'])]);
                    $categoryId = $cat->id;
                }

                // 5. Enregistrer les détails du programme
                CourseProgramDetail::updateOrCreate(
                    [
                        'program_id' => $program->id,
                        'course_id' => $courseId,
                        'promotion_id' => $promotionId,
                    ],
                    [
                        'units_teaching_id' => $unitId,
                        'course_category_id' => $categoryId,
                        'semestre_id' => $defaultSemestre->id, // Pas de colonne semestre mentionnée, défaut
                        'cm' => $cm,
                        'td' => $td,
                        'tp' => $tp,
                        'credits' => $credits,
                    ]
                );

                $this->importedCount++;
            } catch (\Exception $e) {
                // Log error
                $this->errors[] = "Erreur ligne : " . $e->getMessage();
                $this->skippedCount++;
            }
        }
    }

    private function determineProgramName($promotionName)
    {
        // Logique de mappage
        // Si la promotion est liée à la faculté (GENIE LOGICIEL, INTELLIGENCE ARTIFICIELLE, RESEAUX ET TELECOMMUNICATION, STATISTIQUE) 
        // -> SCIENCES ET TELECOMMUNICATION
        $sciencesTelecomKeywords = ['GENIE LOGICIEL', 'INTELLIGENCE ARTIFICIELLE', 'RESEAUX ET TELECOMMUNICATION', 'STATISTIQUE'];
        foreach ($sciencesTelecomKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'SCIENCES ET TELECOMMUNICATION';
            }
        }

        // Si la promotion est liée à la faculté (COMPTABILITE, FISCALITE ET DOUANE, MARKETING, BANQUE) 
        // -> GESTION COMMERCIALES ET ADMINISTRATIVE
        $gestionCommercialeKeywords = ['COMPTABILITE', 'FISCALITE ET DOUANE', 'MARKETING', 'BANQUE'];
        foreach ($gestionCommercialeKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'GESTION COMMERCIALES ET ADMINISTRATIVE';
            }
        }

        // Si la promotion est liée à la faculté (INFORMATIQUE DE GESTION) 
        // -> SCIENCES ECONOMIQUE ET DE GESTION
        if (str_contains($promotionName, 'INFORMATIQUE DE GESTION')) {
            return 'SCIENCES ECONOMIQUE ET DE GESTION';
        }

        return null;
    }

    public function getStats()
    {
        return [
            'imported' => $this->importedCount,
            'skipped' => $this->skippedCount,
            'programs_created' => $this->programsCreated,
            'errors' => $this->errors
        ];
    }
}
