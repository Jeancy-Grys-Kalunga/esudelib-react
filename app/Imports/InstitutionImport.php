<?php

namespace App\Imports;

use Carbon\Carbon;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Institution;

class InstitutionImport implements ToCollection, WithHeadingRow
{
    /**
     * @param Collection $collection
     */
    public function collection(Collection $rows)
    {

        foreach ($rows as $row) {

            $institution = Institution::where('name', $row['nom_institution'])->first();
            if (is_numeric($row['date_denregistrement'])) {
                $created_at = Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row['date_dexpiration']))->format('Y-m-d');
            } else {
                $created_at = Carbon::createFromFormat('d/m/Y', $row['date_denregistrement'])->format('Y-m-d');
            }

            if ($institution) {
                $institution->update([
                    'name' => $row['nom_institution'],
                    'description' => $row['description'],
                    'address' => $row['adresse'],
                    'phone' => $row['n_telephone'],
                    'updated_at' => $created_at
                ]);
            } else {
                Institution::create([
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
