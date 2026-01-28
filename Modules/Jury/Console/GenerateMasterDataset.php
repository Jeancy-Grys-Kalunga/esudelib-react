<?php

namespace Modules\Jury\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class GenerateMasterDataset extends Command
{
    protected $signature = 'dataset:generate';
    protected $description = 'Génère le dataset d\'entraînement pour le modèle ML';

    public function handle()
    {
        $this->info('Génération du dataset d\'entraînement...');

        // Logique pour générer le dataset
        // À adapter selon votre structure de données

        $dataset = DB::table('students')
            ->join('notes', 'students.id', '=', 'notes.student_id')
            ->select([
                'students.gender as genre',
                DB::raw('NULL as intention'), // À adapter
                DB::raw('JSON_ARRAY() as optional_courses'), // À adapter
                DB::raw('"Kinshasa" as provenance_region'), // À adapter
                DB::raw('"ESU-DELIB" as etablissement'),
                DB::raw('YEAR(CURDATE()) - YEAR(students.date_of_birth) as age'),
                DB::raw('AVG(notes.cote) as moyenne_licence'),
                DB::raw('"Informatique" as actual_master') // À adapter avec les vraies données
            ])
            ->groupBy('students.id')
            ->get();

        // Sauvegarder dans la table master_training_datasets
        foreach ($dataset as $record) {
            DB::table('master_training_datasets')->insert([
                'genre' => $record->genre,
                'intention' => $record->intention,
                'optional_courses' => $record->optional_courses,
                'provenance_region' => $record->provenance_region,
                'etablissement' => $record->etablissement,
                'age' => $record->age,
                'moyenne_licence' => $record->moyenne_licence,
                'actual_master' => $record->actual_master,
                'created_at' => now(),
                'updated_at' => now()
            ]);
        }

        $this->info('Dataset généré avec succès: ' . count($dataset) . ' enregistrements.');
    }
}
