<?php

namespace Modules\Student\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\Institution;
use Modules\Student\Entities\Student;
use App\Models\User;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Institution\Entities\Promotion;
use Carbon\Carbon;
use Modules\Institution\Entities\Faculty;

class GeneralStudentsImport implements ToCollection, WithHeadingRow
{
    public function __construct(
        protected $academicYearId,
        protected $importId = null
    ) {}

    public function collection(Collection $rows)
    {
        $total = count($rows);
        $processed = 0;

        $iscKeywords = [
            'COMPTABILITE',
            'FISCALITE',
            'DOUANE',
            'MARKETING',
            'BANQUE',
            'INFORMATIQUE DE GESTION'
        ];

        $issKeywords = [
            'LOGICIEL',
            'INTELLIGENCE',
            'ARTIFICIELLE',
            'RESEAUX',
            'TELECOMMUNICATION',
            'STATISTIQUE',
            'COMPTABILITE',
            'FISCALITE',
            'DOUANE',
            'MARKETING',
            'BANQUE',
            'INFORMATIQUE DE GESTION'
        ];

        foreach ($rows as $row) {
            // Ignore rows without 'nom_complet'
            if (empty($row['nom_complet'])) {
                $processed++;
                continue;
            }

            try {
                DB::transaction(function () use ($row, $iscKeywords, $issKeywords) {
                    // Determine Institution
                    $etablissement = strtoupper(trim($row['etablissement'] ?? ''));
                    $institutionName = '';
                    $targetFacultiesIds = [];

                    if ($etablissement === 'ISC') {
                        $institutionName = 'ISC Lubumbashi';
                        $targetFacultiesIds = $this->getFacultyIds($iscKeywords);
                    } elseif ($etablissement === 'ISS') {
                        $institutionName = 'ISS Lubumbashi';
                        $targetFacultiesIds = $this->getFacultyIds($issKeywords);
                    } else {
                        // Skip if institution not recognized
                        return;
                    }

                    $institution = Institution::where('name', 'LIKE', "%{$institutionName}%")->first();
                    if (!$institution) return;

                    // Random Promotion
                    $promotion = Promotion::where('institution_id', $institution->id)
                        ->whereIn('faculty_id', $targetFacultiesIds)
                        ->inRandomOrder()
                        ->first();

                    if (!$promotion) return;

                    // Date of Birth from Age
                    $age = (int) ($row['age'] ?? 0);
                    $dob = $age > 0 ? Carbon::now()->subYears($age)->format('Y-m-d') : null;

                    // Gender
                    $genderInput = strtoupper(trim($row['genre'] ?? ''));
                    if (empty($genderInput) && isset($row['sexe'])) {
                        $genderInput = strtoupper(trim($row['sexe']));
                    }
                    $gender = ($genderInput === 'M' || $genderInput === 'MASCULIN') ? 'Masculin' : 'Feminin';

                    // Create User
                    $user = $this->createStudentUser($row, $institution);

                    // Matricule
                    $matricule = 'MAT-' . date('Y') . '-' . Str::padLeft(Student::max('id') + 1, 5, '0');

                    // Create Student
                    $student = Student::create([
                        'matricule' => $matricule,
                        'name' => $row['nom_complet'],
                        'gendre' => $gender,
                        'date_of_birth' => $dob,
                        'email' => $user->email,
                        'phone' => $row['telephone'] ?? null,
                        'institution_id' => $institution->id,
                        'user_id' => $user->id,
                        'provenance_region' => $row['provenance_region'] ?? null,
                        'provenance_localite' => $row['provenance_localite'] ?? null,
                    ]);

                    // Create Inscription
                    Inscription::create([
                        'student_id' => $student->id,
                        'academic_year_id' => $this->academicYearId,
                        'institution_id' => $institution->id,
                        'promotion_id' => $promotion->id,
                    ]);
                });
            } catch (\Exception $e) {
                // Log error but continue
                \Illuminate\Support\Facades\Log::error("Error importing row: " . $e->getMessage());
            }

            $processed++;

            // Update Progress Cache
            if ($this->importId && ($processed % 10 === 0 || $processed === $total)) {
                $percentage = round(($processed / $total) * 100);
                \Illuminate\Support\Facades\Cache::put("import_progress_{$this->importId}", ['status' => 'processing', 'progress' => $percentage], 3600);
            }
        }
    }

    private function createStudentUser($row, $institution)
    {
        $password = Hash::make('12345678');
        $email = $this->generateStudentEmail($row['nom_complet'], $institution);

        $user = User::create([
            'name' => $row['nom_complet'],
            'email' => $email,
            'password' => $password,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $user->assignRole('Etudiant');
        $user->institutions()->attach($institution->id);

        return $user;
    }

    private function generateStudentEmail(string $name, $institution): string
    {
        $baseEmail = Str::slug($name) . '@' . Str::slug($institution->name) . '.edu';

        $counter = 1;
        $email = $baseEmail;

        while (User::where('email', $email)->exists()) {
            $email = Str::slug($name) . $counter . '@' . Str::slug($institution->name) . '.edu';
            $counter++;
        }

        return strtolower($email);
    }

    private function getFacultyIds(array $keywords): array
    {
        return Faculty::where(function ($query) use ($keywords) {
            foreach ($keywords as $keyword) {
                $query->orWhere('title', 'LIKE', "%{$keyword}%");
            }
        })->pluck('id')->toArray();
    }
}
