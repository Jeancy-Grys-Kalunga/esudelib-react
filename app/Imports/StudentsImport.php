<?php

namespace App\Imports;

use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

use Modules\Student\Entities\Student;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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
        foreach ($rows as $row) {
            // Génération du matricule
            $matricule = 'MAT-' . date('Y') . '-' . Str::padLeft(Student::max('id') + 1, 5, '0');
            
            // Création de l'étudiant
            $student = Student::create([
                'matricule' => $matricule,
                'name' => $row['nom_complet'],
                'gendre' => $row['genre'] ?? 'Masculin',
                'date_of_birth' => $row['date_naissance'] ?? null,
                'email' => $this->generateStudentEmail($row['nom_complet']),
                'phone' => $row['telephone'] ?? null,
                'institution_id' => $this->institutionId,
            ]);

            // Création de l'inscription
            Inscription::create([
                'student_id' => $student->id,
                'academic_year_id' => $this->academicYearId,
                'institution_id' => $this->institutionId,
                'promotion_id' => $this->promotionId,
            ]);

            // Création du compte utilisateur
            $this->createStudentUser($student);
        }
    }

    private function generateStudentEmail(string $name): string
    {
        return Str::slug($name) . '.' . Str::random(4) . '@esudelib.com';
    }

    private function createStudentUser(Student $student)
    {
        $password = Hash::make(Str::random(12));
        
        $user = User::create([
            'name' => $student->name,
            'email' => $student->email,
            'password' => $password,
            'is_active' => true,
        ]);

        $user->assignRole('Etudiant');
        $user->institutions()->attach($student->institution_id);
    }
}
