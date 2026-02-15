<?php

namespace App\Imports;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Institution;
use Modules\Teacher\Entities\Teacher;

class TeacherImport implements ToCollection, WithHeadingRow
{
    public function __construct(protected $institutionId) {}

    private $rowsKey = 0;

    public function collection(Collection $rows)
    {
        ini_set('max_execution_time', 3600); // 1 Hour
        set_time_limit(3600);

        $institution = Institution::findOrFail($this->institutionId);
        $count = 0;
        $skipped = 0;

        Log::info("Début de l'importation des enseignants. Nombre de lignes trouvées : " . $rows->count());

        foreach ($rows as $index => $row) {
            $this->rowsKey++;

            // Log debugging info for the first row to check column names
            if ($index === 0) {
                Log::info("En-têtes détectés (clés de la première ligne) : " . implode(', ', array_keys($row->toArray())));
            }

            // Mapping de colonnes flexible
            $nomComplet = $row['nom_complet'] ?? $row['noms_et_post_noms'] ?? null;
            $matricule = $row['matricule'] ?? null;
            $dateNaissanceRaw = $row['date_naissance'] ?? $row['lieu_et_date_de_naissance'] ?? null;
            $sexe = $row['sexe'] ?? 'Masculin';
            $telephone = $row['telephone'] ?? $row['n_de_telephone'] ?? null;
            $grade = $row['grade'] ?? 'Gradué(e)';
            $niveauEtude = $row['niveau_etude'] ?? $row['niveau_detude'] ?? 'Chargé(e) de cours';
            $specialite = $row['specialty'] ?? $row['specialite'] ?? 'N/A';

            // Validation sommaire
            if (!$nomComplet || !$matricule) {
                Log::warning("Ligne {$this->rowsKey} ignorée : 'nom_complet' ou 'matricule' manquant.", $row->toArray());
                $skipped++;
                continue;
            }

            try {
                DB::transaction(function () use ($row, $institution, $nomComplet, $matricule, $dateNaissanceRaw, $sexe, $telephone, $grade, $niveauEtude, $specialite) {
                    // Parsing date of birth
                    $dateOfBirth = null;
                    if ($dateNaissanceRaw) {
                        try {
                            if (is_numeric($dateNaissanceRaw)) {
                                $dateOfBirth = Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($dateNaissanceRaw))->format('Y-m-d');
                            } else {
                                // Nettoyage et extraction de la date dans "Lieu, Date" ou "Lieu;Date"
                                // On cherche la partie qui ressemble à une date (ex: 23/12/1981 ou 10/4/1981)
                                if (preg_match('/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/', $dateNaissanceRaw, $matches)) {
                                    $dateString = $matches[1];
                                    // Remplacement des - par / pour uniformiser
                                    $dateString = str_replace('-', '/', $dateString);
                                    $parsedDate = Carbon::createFromFormat('d/m/Y', $dateString);
                                    $dateOfBirth = $parsedDate ? $parsedDate->format('Y-m-d') : null;
                                } else {
                                    // Tentative de parsing direct si pas de correspondance regex complexe
                                    $parsedDate = Carbon::parse($dateNaissanceRaw);
                                    $dateOfBirth = $parsedDate->format('Y-m-d');
                                }
                            }
                        } catch (\Exception $e) {
                            Log::warning("Erreur date ligne {$this->rowsKey} ('$dateNaissanceRaw') : " . $e->getMessage());
                        }
                    }

                    // Create User
                    $email = Str::slug($nomComplet) . Str::slug($institution->name) . '@esudelib.com';

                    $user = User::where('email', strtolower($email))->first();
                    if (!$user) {
                        $user = User::create([
                            'name'      => $nomComplet,
                            'email'     => strtolower($email),
                            'password'  => Hash::make('1234'),
                            'is_active' => true,
                        ]);
                        $user->assignRole('Enseignant');
                    }

                    if (!$user->institutions()->where('id', $this->institutionId)->exists()) {
                        $user->institutions()->attach($this->institutionId);
                    }

                    // Create/Update Teacher
                    $teacher = Teacher::where('matricule', $matricule)->first();

                    $teacherData = [
                        'name'           => $nomComplet,
                        'gendre'         => $sexe,
                        'date_of_birth'  => $dateOfBirth,
                        'phone'          => $telephone,
                        'grade'          => $grade,
                        'academic_level' => $niveauEtude,
                        'specialty'      => $specialite,
                        'user_id'        => $user->id,
                    ];

                    if ($teacher) {
                        $teacher->update($teacherData);
                    } else {
                        $teacher = Teacher::create(array_merge($teacherData, [
                            'matricule' => $matricule,
                            'date_of_hire' => now(),
                        ]));
                    }

                    // Attach institution to teacher
                    if (!$teacher->institutions()->where('id', $this->institutionId)->exists()) {
                        $teacher->institutions()->attach($this->institutionId);
                    }
                });
                $count++;
            } catch (\Exception $e) {
                Log::error("Erreur lors de l'importation de la ligne {$this->rowsKey} : " . $e->getMessage());
                // On peut aussi throw pour arrêter tout, mais on continue pour voir les autres erreurs
            }
        }

        Log::info("Fin de l'importation. Importés: $count, Ignorés/Erreurs: $skipped");

        // Stocker le résultat en session pour l'afficher ou le logger
        session()->flash('import_summary', "Importés: $count, Ignorés/Erreurs: $skipped. Vérifiez les logs pour plus de détails.");
    }
}
