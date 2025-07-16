<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Modules\Institution\Entities\Course;
use Illuminate\Support\Collection;

class CourseStudentsExport implements FromCollection, WithHeadings
{
    protected $course;

    public function __construct(Course $course)
    {
        $this->course = $course;
    }

    public function collection()
    {
        return new Collection(
            $this->course->students->map(function ($student) {
                return [
                    'matricule' => $student->matricule,
                    'nom' => $student->name,
                    'point' => '', 
                    'participation' => '',
                ];
            })
        );
    }

    public function headings(): array
    {
        return ['Matricule', 'Nom de l\'étudiant', 'Point/20', 'Participation'];
    }
}