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

                // 2. Trouver ou Créer le cours
                $courseId = $existingCourses[$courseTitle] ?? null;

                if (!$courseId) {
                    // Si le cours n'existe pas, on le crée pour ne pas ignorer la ligne.
                    // On utilise le titre original (trimé) pour la création.
                    $newCourse = Course::create([
                        'title' => trim($row['intitule_cours']),
                    ]);
                    $courseId = $newCourse->id;
                    $existingCourses[$courseTitle] = $courseId;
                }


                // 3. Calculer les heures et crédits (Une seule fois pour la ligne)
                $cm = isset($row['cmi']) ? (float)$row['cmi'] : (isset($row['cm']) ? (float)$row['cm'] : 0);

                $raw_tp = isset($row['tp']) ? (float)$row['tp'] : 0;
                $raw_td = isset($row['td']) ? (float)$row['td'] : 0;

                if (isset($row['td'])) {
                    $td = $raw_td;
                    $tp = $raw_tp;
                } else {
                    $half_tp = $raw_tp / 2;
                    $tp = $half_tp;
                    $td = $half_tp;
                }

                $credits = isset($row['credit']) ? (float)$row['credit'] : (isset($row['credits']) ? (float)$row['credits'] : 0);
                if ($credits == 0) {
                    $vh = $cm + $tp + $td;
                    if ($vh > 0) {
                        $credits = $vh / 15;
                    }
                }

                // 4. Gérer Unité et Catégorie (Une seule fois)
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

                // 2. Trouver ou Créer le cours (Une seule fois)
                $courseTitle = strtoupper(trim($row['intitule_cours']));
                $courseId = $existingCourses[$courseTitle] ?? null;

                if (!$courseId) {
                    $newCourse = Course::create([
                        'title' => trim($row['intitule_cours']),
                    ]);
                    $courseId = $newCourse->id;
                    $existingCourses[$courseTitle] = $courseId;
                }

                // --- GESTION DES PROMOTIONS MULTIPLES ---
                $rawPromotionString = strtoupper(trim($row['promotion']));

                // Découpage par virgule
                $promotionList = array_map('trim', explode(',', $rawPromotionString));

                // Détection du préfixe sur le premier élément (ex: "BAC1 " dans "BAC1 INFORMATIQUE")
                // On suppose que le préfixe est le premier mot ou pattern commun ?
                // Approche simple : on regarde le premier élément.
                $firstPromo = $promotionList[0] ?? '';
                $prefix = '';

                // Si on détecte BAC1, BAC2, BAC3, L1, L2, L3, M1, M2 au début
                if (preg_match('/^(BAC\s*\d+|L\d+|M\d+)/i', $firstPromo, $matches)) {
                    $prefix = $matches[0];
                }

                foreach ($promotionList as $index => $promoName) {
                    if (empty($promoName)) continue;

                    // Tentative de résolution du nom complet
                    $resolvedPromotionName = $promoName;
                    $promotionId = $existingPromotions[$resolvedPromotionName] ?? null;

                    // Si pas trouvé et que ce n'est pas le premier élément, on tente d'ajouter le préfixe
                    if (!$promotionId && $index > 0 && !empty($prefix) && !str_starts_with($promoName, $prefix)) {
                        // Exemple : on a "RESEAUX" et prefix "BAC1", on tente "BAC1 RESEAUX"
                        // Attention aux espaces. Le prefix capturé inclut-il l'espace ? 
                        // Ma regex capture "BAC1" ou "BAC 1". On ajoute un espace si besoin.
                        $testName = $prefix . ' ' . $promoName;
                        // On nettoie les doubles espaces éventuels "BAC 1  RESEAUX" -> "BAC 1 RESEAUX"
                        $testName = preg_replace('/\s+/', ' ', $testName);

                        if (isset($existingPromotions[$testName])) {
                            $resolvedPromotionName = $testName;
                            $promotionId = $existingPromotions[$testName];
                        }
                    }

                    if (!$promotionId) {
                        // Fallback : Si tojours pas trouvé, on peut tenter de le créer ou de le skipper.
                        // La demande implique que ça DOIT marcher pour "BAC1 INFORMATIQUE, RESEAUX".
                        // Si "BAC1 RESEAUX" n'existe pas dans la DB, on ne peut pas l'inventer sans risque.
                        // Pour l'instant on loggue l'erreur pour cette sous-promotion.
                        $this->errors[] = "Promotion non trouvée : $resolvedPromotionName (dérivé de $promoName)";
                        continue; // On passe à la prochaine promotion de la liste
                    }

                    // 1. Déterminer le programme pour CETTE promotion
                    $programName = $this->determineProgramName($resolvedPromotionName);

                    if (!$programName) {
                        // Ne devrait pas arriver avec le fallback ajouté précédemment, mais au cas où
                        $programName = 'PROGRAMME ' . $resolvedPromotionName;
                    }

                    // Trouver ou créer le programme (Specifique à l'institution)
                    $program = Program::firstOrCreate(
                        ['name' => $programName, 'institution_id' => $this->institutionId]
                    );

                    if ($program->wasRecentlyCreated) {
                        $this->programsCreated++;
                    }

                    // 5. Enregistrer les détails
                    CourseProgramDetail::updateOrCreate(
                        [
                            'program_id' => $program->id,
                            'course_id' => $courseId,
                            'promotion_id' => $promotionId,
                        ],
                        [
                            'units_teaching_id' => $unitId,
                            'course_category_id' => $categoryId,
                            'semestre_id' => $defaultSemestre->id,
                            'cm' => $cm,
                            'td' => $td,
                            'tp' => $tp,
                            'credits' => $credits,
                        ]
                    );
                }

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
        $promotionName = strtoupper($promotionName);

        // 1. SCIENCES ET TECHNOLOGIE
        $sciencesTelecomKeywords = ['GENIE LOGICIEL', 'INTELLIGENCE ARTIFICIELLE', 'RESEAUX ET TELECOMMUNICATION', 'STATISTIQUE'];
        foreach ($sciencesTelecomKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'SCIENCES ET TECHNOLOGIE';
            }
        }

        // 2. GESTION COMMERCIALES ET ADMINISTRATIVE
        $gestionCommercialeKeywords = ['COMPTABILITE', 'FISCALITE ET DOUANE', 'MARKETING', 'BANQUE'];
        foreach ($gestionCommercialeKeywords as $keyword) {
            if (str_contains($promotionName, $keyword)) {
                return 'GESTION COMMERCIALES ET ADMINISTRATIVE';
            }
        }

        // 3. SCIENCES ECONOMIQUE ET DE GESTION
        if (str_contains($promotionName, 'INFORMATIQUE DE GESTION')) {
            return 'SCIENCES ECONOMIQUE ET DE GESTION';
        }

        // Si aucune correspondance, on retourne null pour que la ligne soit ignorée ou logguée comme erreur
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
