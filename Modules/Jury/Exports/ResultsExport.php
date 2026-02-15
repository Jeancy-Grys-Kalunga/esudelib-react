<?php

namespace Modules\Jury\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Illuminate\Support\Facades\DB;

class ResultsExport implements FromCollection, WithHeadings, WithMapping
{
    public $academicYearId;
    public $promotionId;

    public function __construct($academicYearId, $promotionId)
    {
        $this->academicYearId = $academicYearId;
        $this->promotionId = $promotionId;
    }

    public function collection()
    {
        return DB::table('students')
            ->select(
                'students.id',
                'students.matricule',
                'students.name',
                'courses.title as course_title',
                'notes.cote',
                'notes.observation',
                'notes.participation',
                'notes.situation',
                DB::raw("(SELECT AVG(n2.cote) FROM notes n2 WHERE n2.student_id = students.id AND n2.academic_year_id = ?) as average"),
                'students.created_at'
            )
            ->join('notes', 'notes.student_id', '=', 'students.id')
            ->join('courses', 'courses.id', '=', 'notes.course_id')
            ->where('notes.academic_year_id', $this->academicYearId)
            ->where('notes.promotion_id', $this->promotionId)
            ->addBinding($this->academicYearId, 'select')
            ->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'Matricule',
            'Nom',
            'Cours',
            'Note',
            'Observation',
            'Participation',
            'Situation',
            'Moyenne',
            'Date'
        ];
    }

    public function map($result): array
    {
        return [
            $result->id,
            $result->matricule,
            $result->name,
            $result->course_title,
            $result->cote,
            $result->observation,
            $result->participation,
            $result->situation,
            $result->average,
            $result->created_at
        ];
    }
}
