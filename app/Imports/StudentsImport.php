<?php

namespace App\Imports;

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

class StudentsImport implements ToCollection, WithHeadingRow
{
    public function __construct(
        protected $academicYearId,
        protected $institutionId,
        protected $promotionId
    ) {}

    public function collection(Collection $rows)
    {
        $institution = Institution::find($this->institutionId);
        
        foreach ($rows as $row) {
            DB::transaction(function () use ($row, $institution) {
                // Création du compte utilisateur en premier
                $user = $this->createStudentUser($row, $institution);
                
                // Génération du matricule
                $matricule = 'MAT-' . date('Y') . '-' . Str::padLeft(Student::max('id') + 1, 5, '0');
                
                // Création de l'étudiant avec le user_id
                $student = Student::create([
                    'matricule' => $matricule,
                    'name' => $row['nom_complet'],
                    'gendre' => $row['genre'] ?? 'Masculin',
                    'date_of_birth' => $row['date_naissance'] ?? null,
                    'email' => $user->email,
                    'phone' => $row['telephone'] ?? null,
                    'institution_id' => $this->institutionId,
                    'user_id' => $user->id,
                ]);

                // Création de l'inscription
                Inscription::create([
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYearId,
                    'institution_id' => $this->institutionId,
                    'promotion_id' => $this->promotionId,
                ]);
            });
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
        ]);

        $user->assignRole('Etudiant');
        $user->institutions()->attach($this->institutionId);

        return $user;
    }

    private function generateStudentEmail(string $name, $institution): string
    {
        $baseEmail = Str::slug($name) . '@' . Str::slug($institution->name) . '.edu';
        
        // Vérification de l'unicité
        $counter = 1;
        $email = $baseEmail;
        
        while (User::where('email', $email)->exists()) {
            $email = Str::slug($name) . $counter . '@' . Str::slug($institution->name) . '.edu';
            $counter++;
        }
        
        return strtolower($email);
    }
}