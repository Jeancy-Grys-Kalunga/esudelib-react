<?php

namespace App\Imports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Teacher\Entities\Teacher;

class TeacherImport  implements ToCollection, WithHeadingRow
{
    /**
     * @param Collection $collection
     */
    public function collection(Collection $rows)
    {
        foreach ($rows as $row) {

            $teacher = Teacher::where('matricule', $row['matricule'])->first();
            if (is_numeric($row['date_denregistrement'])) {
                $created_at = Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['date_dexpiration']))->format('Y-m-d');
            } else {
                $created_at = Carbon::createFromFormat('d/m/Y', $row['date_denregistrement'])->format('Y-m-d');
            }

            if ($teacher) {
                $teacher->update([
                    'name' => $row['nom_institution'],
                    'description' => $row['description'],
                    'address' => $row['adresse'],
                    'phone' => $row['n_telephone'],
                    'updated_at' => $created_at
                ]);
            } else {
                Teacher::create([
                    'name' => $row['nom_institution'],
                    'description' => $row['description'],
                    'address' => $row['adresse'],
                    'phone' => $row['n_telephone'],
                    'created_at' => $created_at
                ]);
            }
        }
    }
}
