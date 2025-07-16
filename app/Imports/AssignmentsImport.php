<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Validation\Rule;
use Modules\Institution\Entities\Assignment;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Promotion;
use Modules\Teacher\Entities\Teacher;
use Modules\Institution\Entities\AcademicYear;

class AssignmentsImport implements ToModel, WithHeadingRow, SkipsEmptyRows, WithValidation
{
    public function model(array $row)
    {
        // Recherche des entités correspondantes
        $promotion = Promotion::where('title', $row['Promotion'])->first();
        $course = Course::where('title', $row['Nom du cours'])->first();
        $holder = Teacher::where('name', $row['Titulaire'])->first();
        $collaborator = Teacher::where('name', $row['Collaborateur'])->first();
        $academicYear = AcademicYear::current()->first();

        return new Assignment([
            'promotion_id' => $promotion->id ?? null,
            'course_id' => $course->id ?? null,
            'holder_id' => $holder->id ?? null,
            'collaborator_id' => $collaborator->id ?? null,
            'academic_year_id' => $academicYear->id ?? null,
            'institution_id' => auth()->user()->institutions()->first()->id,
            'observation' => $row['Observation'] ?? null,
        ]);
    }

    public function rules(): array
    {
        return [
            'Promotion' => 'required|exists:promotions,title',
            'Nom du cours' => 'required|exists:courses,title',
            'Titulaire' => 'required|exists:teachers,name',
            'Collaborateur' => 'nullable|exists:teachers,name',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'Promotion.exists' => 'La promotion ":input" n\'existe pas dans le système',
            'Nom du cours.exists' => 'Le cours ":input" n\'existe pas dans le système',
            'Titulaire.exists' => 'L\'enseignant ":input" n\'existe pas dans le système',
            'Collaborateur.exists' => 'Le collaborateur ":input" n\'existe pas dans le système',
        ];
    }
}