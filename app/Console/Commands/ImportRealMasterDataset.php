<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Modules\Jury\Entities\MasterTrainingDataset;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportRealMasterDataset extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ml:import-real-dataset {path?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import real dataset from Excel file to replace synthetic training data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $path = $this->argument('path') ?: 'C:\Users\jeanc\Documents\DATASETCORRIGE.xlsx';

        if (!file_exists($path)) {
            $this->error("Fichier non trouvé: {$path}");
            return 1;
        }

        $this->info("Début de l'importation depuis: {$path}");

        // Vider la table actuelle
        $this->info("Suppression des anciennes données...");
        DB::table('master_training_datasets')->truncate();

        $this->info("Lecture du fichier Excel...");
        $spreadsheet = IOFactory::load($path);
        $worksheet = $spreadsheet->getActiveSheet();

        $rows = $worksheet->toArray();
        $headers = array_shift($rows); // Enlever la ligne d'en-tête

        $totalRows = count($rows);
        $this->info("{$totalRows} lignes trouvées.");

        $bar = $this->output->createProgressBar($totalRows);
        $bar->start();

        $batch = [];
        $batchSize = 500;
        $importedCount = 0;

        foreach ($rows as $row) {
            // Ignorer les lignes vides
            if (empty($row[0])) {
                $bar->advance();
                continue;
            }

            // Extraction des cours optionnels
            $optionalCoursesStr = $row[4] ?? '';
            $optionalCourses = array_values(array_filter(array_map('trim', explode(',', $optionalCoursesStr))));

            $moyenne = (float)($row[5] ?? 10.0);
            $batch[] = [
                'genre' => $row[1] ?? 'M',
                'age' => (int)($row[2] ?? 20),
                'intention' => $row[3],
                'optional_courses' => json_encode($optionalCourses, JSON_UNESCAPED_UNICODE),
                'moyenne_licence' => $moyenne,
                'provenance_region' => rtrim($row[7] ?? ''),
                'etablissement' => rtrim($row[9] ?? ''),
                'actual_master' => rtrim($row[10] ?? ''),
                // Backfill for old NOT NULL columns
                'average_grade' => $moyenne,
                'provenance' => rtrim($row[7] ?? ''),
                'intention_expressed' => $row[3],
                'internships' => json_encode([rtrim($row[6] ?? '')], JSON_UNESCAPED_UNICODE),
                'grades_by_subject' => json_encode([]),
                'is_synthetic' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];

            if (count($batch) >= $batchSize) {
                DB::table('master_training_datasets')->insert($batch);
                $importedCount += count($batch);
                $batch = [];
            }
            $bar->advance();
        }

        // Insérer le reste
        if (count($batch) > 0) {
            DB::table('master_training_datasets')->insert($batch);
            $importedCount += count($batch);
        }

        $bar->finish();
        $this->newLine(2);

        // Mettre à jour la liste des filières distinctes extraites :
        $filieres = DB::table('master_training_datasets')->select('actual_master')->distinct()->pluck('actual_master')->toArray();
        $this->info("Importation terminée. {$importedCount} enregistrements insérés.");
        $this->info("Filières trouvées: " . implode(', ', $filieres));

        return 0;
    }
}
