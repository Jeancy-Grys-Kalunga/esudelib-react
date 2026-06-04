<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CopyProgramCourses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:copy-courses-to-isc';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Copie tous les cours du programme GESTION COMMERCIALE (ISS) vers COMMERCIALE (ISC)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Démarrage de la copie des cours...");

        $sourceInstitutionName = 'ISS Lubumbashi';
        $destInstitutionName = 'ISC Lubumbashi';
        $sourceProgramName = 'GESTION COMMERCIALE ET ADMINISTRATIVE';
        $destProgramName = 'GESTION COMMERCIALE ET ADMINISTRATIVE';

        // 1. Trouver les institutions
        $sourceInstitution = DB::table('institutions')->where('name', 'LIKE', "%$sourceInstitutionName%")->first();
        $destInstitution = DB::table('institutions')->where('name', 'LIKE', "%$destInstitutionName%")->first();

        if (!$sourceInstitution || !$destInstitution) {
            $this->error("Institution source ou destination introuvable.");
            return;
        }

        // 2. Trouver les programmes
        $sourceProgram = DB::table('programs')
            ->where('institution_id', $sourceInstitution->id)
            ->where('name', 'LIKE', "%$sourceProgramName%")
            ->first();
            
        $destProgram = DB::table('programs')
            ->where('institution_id', $destInstitution->id)
            ->where('name', 'LIKE', "%$destProgramName%")
            ->first();

        if (!$sourceProgram || !$destProgram) {
            $this->error("Programme source ou destination introuvable.");
            return;
        }

        // 3. Récupérer les cours du programme source
        $details = DB::table('course_program_details')->where('program_id', $sourceProgram->id)->get();
        $this->info("Trouvé " . $details->count() . " cours dans le programme source.");

        $count = 0;
        foreach ($details as $detail) {
            // Trouver la promotion source
            $sourcePromo = DB::table('promotions')->where('id', $detail->promotion_id)->first();
            if (!$sourcePromo) continue;

            // Trouver l'équivalent de la promotion dans la destination
            $destPromo = DB::table('promotions')
                ->where('institution_id', $destInstitution->id)
                ->where('title', $sourcePromo->title)
                ->first();

            if (!$destPromo) {
                $this->warn("Promotion '{$sourcePromo->title}' introuvable dans ISC. Création automatique...");
                
                // 1. Trouver la faculté source
                $sourceFaculty = DB::table('faculties')->where('id', $sourcePromo->faculty_id)->first();
                $destFacultyId = null;

                if ($sourceFaculty) {
                    // 2. Chercher la faculté destination avec le même titre
                    $destFaculty = DB::table('faculties')
                        ->where('institution_id', $destInstitution->id)
                        ->where('title', $sourceFaculty->title)
                        ->first();
                        
                    if ($destFaculty) {
                        $destFacultyId = $destFaculty->id;
                    } else {
                        $this->warn("Faculté '{$sourceFaculty->title}' introuvable dans ISC. Création...");
                        $destFacultyId = DB::table('faculties')->insertGetId([
                            'title' => $sourceFaculty->title,
                            'institution_id' => $destInstitution->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                } else {
                    // Si on ne trouve pas de faculté source (théoriquement impossible si Not Null)
                    // on assigne une faculté par défaut ou on crée une générique.
                    $fallbackFaculty = DB::table('faculties')->where('institution_id', $destInstitution->id)->first();
                    if ($fallbackFaculty) {
                        $destFacultyId = $fallbackFaculty->id;
                    } else {
                        $destFacultyId = DB::table('faculties')->insertGetId([
                            'title' => 'Faculté Générale',
                            'institution_id' => $destInstitution->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }

                $destPromoId = DB::table('promotions')->insertGetId([
                    'title' => $sourcePromo->title,
                    'institution_id' => $destInstitution->id,
                    'faculty_id' => $destFacultyId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $destPromoId = $destPromo->id;
            }

            // Vérifier si le cours existe déjà pour éviter les doublons
            $exists = DB::table('course_program_details')
                ->where('program_id', $destProgram->id)
                ->where('course_id', $detail->course_id)
                ->where('promotion_id', $destPromoId)
                ->where('units_teaching_id', $detail->units_teaching_id)
                ->exists();

            if (!$exists) {
                // Copier la ligne
                DB::table('course_program_details')->insert([
                    'course_id' => $detail->course_id,
                    'program_id' => $destProgram->id,
                    'promotion_id' => $destPromoId,
                    'units_teaching_id' => $detail->units_teaching_id,
                    'course_category_id' => $detail->course_category_id,
                    'semestre_id' => $detail->semestre_id ?? null,
                    'cm' => $detail->cm,
                    'td' => $detail->td,
                    'tp' => $detail->tp,
                    'credits' => $detail->credits,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $count++;
            }
        }

        $this->info("Terminé ! $count cours ont été copiés avec succès vers le programme ISC.");
    }
}
