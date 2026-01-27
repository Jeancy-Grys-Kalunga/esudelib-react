<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Course;

class CoursesImport implements ToCollection, WithHeadingRow
{
    protected $imported = 0;
    protected $skipped = 0;
    protected $duplicates = [];

    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {
            // Vérifier si la colonne 'intitule_cours' existe et n'est pas vide
            if (!isset($row['intitule_cours']) || empty(trim($row['intitule_cours']))) {
                continue;
            }

            $courseTitle = trim($row['intitule_cours']);

            // Vérifier si le cours existe déjà (insensible à la casse)
            $existingCourse = Course::whereRaw('LOWER(title) = ?', [strtolower($courseTitle)])->first();

            if ($existingCourse) {
                $this->skipped++;
                $this->duplicates[] = $courseTitle;
                continue;
            }

            // Créer le cours
            DB::transaction(function () use ($courseTitle) {
                Course::create([
                    'title' => $courseTitle,
                    'orientation' => null, // Nullable lors de l'importation
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
}
