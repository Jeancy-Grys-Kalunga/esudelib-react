<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class FixCourseDetails extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-course-details';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Corrige les heures et les crédits de la table course_program_details (supprime les décimales, pas de 0, crédits 2-6)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Démarrage de la correction de la table course_program_details...');

        // Récupérer toutes les lignes de la table
        $details = DB::table('course_program_details')->get();
        $count = 0;

        foreach ($details as $detail) {
            // Calculer le total des heures (en enlevant les virgules d'abord)
            $cm = (int) round($detail->cm);
            $td = (int) round($detail->td);
            $tp = (int) round($detail->tp);

            $totalHours = $cm + $td + $tp;

            // Déterminer les crédits = (total des heures) / 15
            // Si le total est 0, on met par défaut à 3 crédits (45h) pour éviter d'avoir 0
            if ($totalHours == 0) {
                $totalHours = 45;
            }

            $credits = (int) round($totalHours / 15);

            // La valeur du crédit doit être entre 2 et 6
            if ($credits < 2) {
                $credits = 2;
            } elseif ($credits > 6) {
                $credits = 6;
            }

            // On recalcule le total d'heures strict basé sur le crédit (pour équilibrer)
            $totalHours = $credits * 15;

            // On redistribue pour qu'il n'y ait pas de 0
            // On divise par 3 (CM, TD, TP), et on s'assure que chacun a au moins qqchose.
            // Si le total est un multiple de 15, on peut utiliser des répartitions standard :
            switch ($credits) {
                case 2: // 30h
                    $newCm = 10;
                    $newTd = 10;
                    $newTp = 10;
                    break;
                case 3: // 45h
                    $newCm = 15;
                    $newTd = 15;
                    $newTp = 15;
                    break;
                case 4: // 60h
                    $newCm = 30;
                    $newTd = 15;
                    $newTp = 15;
                    break;
                case 5: // 75h
                    $newCm = 45;
                    $newTd = 15;
                    $newTp = 15;
                    break;
                case 6: // 90h
                    $newCm = 60;
                    $newTd = 15;
                    $newTp = 15;
                    break;
                default:
                    // Cas par défaut (bien que bloqué à 2-6)
                    $newCm = 15;
                    $newTd = 15;
                    $newTp = 15;
                    $credits = 3;
                    break;
            }

            // Mise à jour de la ligne en DB
            DB::table('course_program_details')->where('id', $detail->id)->update([
                'cm' => $newCm,
                'td' => $newTd,
                'tp' => $newTp,
                'credits' => $credits,
            ]);

            $count++;
        }

        $this->info("Correction terminée ! $count lignes ont été modifiées.");
    }
}
