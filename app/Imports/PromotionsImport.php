<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Promotion;

class PromotionsImport implements ToCollection, WithHeadingRow
{
    protected $imported = 0;
    protected $skipped = 0;
    protected $duplicates = [];
    protected $facultiesCreated = 0;
    protected $institutionId;

    public function __construct($institutionId)
    {
        $this->institutionId = $institutionId;
    }

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Vérifier si la colonne 'intitule_promotion' existe et n'est pas vide
            if (!isset($row['intitule_promotion']) || empty(trim($row['intitule_promotion']))) {
                continue;
            }

            $promotionFullTitle = trim($row['intitule_promotion']);

            // Parser le titre pour extraire la promotion et la faculté
            // Format attendu: "BAC1 INFORMATIQUE", "BAC2 MÉDECINE", etc.
            $parts = preg_split('/\s+/', $promotionFullTitle, 2);

            if (count($parts) < 2) {
                // Si le format n'est pas correct, on ignore cette ligne
                continue;
            }

            $promotionLevel = strtoupper(trim($parts[0])); // "BAC1"
            $facultyName = strtoupper(trim($parts[1])); // "INFORMATIQUE"

            // Le nom de la promotion est la concaténation complète: niveau + faculté
            $promotionTitle = $promotionLevel . ' ' . $facultyName; // "BAC1 INFORMATIQUE"

            // Vérifier si la promotion existe déjà (insensible à la casse)
            $existingPromotion = Promotion::whereRaw('LOWER(title) = ?', [strtolower($promotionTitle)])
                ->where('institution_id', $this->institutionId)
                ->first();

            if ($existingPromotion) {
                $this->skipped++;
                $this->duplicates[] = $promotionTitle;
                continue;
            }

            // Vérifier si la faculté existe, sinon la créer
            $faculty = Faculty::whereRaw('LOWER(title) = ?', [strtolower($facultyName)])
                ->where('institution_id', $this->institutionId)
                ->first();

            if (!$faculty) {
                // Créer la faculté
                DB::transaction(function () use ($facultyName, &$faculty) {
                    $faculty = Faculty::create([
                        'title' => $facultyName,
                        'institution_id' => $this->institutionId,
                    ]);
                });
                $this->facultiesCreated++;
            }

            // Créer la promotion avec le titre complet
            DB::transaction(function () use ($promotionTitle, $faculty) {
                Promotion::create([
                    'title' => $promotionTitle,
                    'institution_id' => $this->institutionId,
                    'faculty_id' => $faculty->id,
                ]);
            });

            $this->imported++;
        }
    }

    public function getImported()
    {
        return $this->imported;
    }

    public function getSkipped()
    {
        return $this->skipped;
    }

    public function getDuplicates()
    {
        return $this->duplicates;
    }

    public function getFacultiesCreated()
    {
        return $this->facultiesCreated;
    }
}
