<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Maatwebsite\Excel\Concerns\WithStyles;
use Illuminate\Support\Collection;

class AssignmentsExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize, WithStyles
{
    protected $assignments;

    public function __construct($assignments)
    {
        $this->assignments = $assignments;
    }

    public function collection()
    {
        return $this->assignments ?: new Collection();
    }

    public function map($assignment): array
    {
        $promotion = 'Non défini';
        $semester = 'Non défini';
        $cm = $td = $tp = $credits = 0;

        // Check for course program details that match the assignment's promotion first
        if ($assignment->course && $assignment->course->courseProgramDetails->isNotEmpty()) {

            // Try to find the detail specifically for this assignment's promotion
            $details = $assignment->course->courseProgramDetails->first(function ($detail) use ($assignment) {
                return $detail->promotion_id == $assignment->promotion_id;
            });

            // Fallback to first if not found (though logic suggests it should be there if promotion_id matches)
            if (!$details) {
                $details = $assignment->course->courseProgramDetails->first();
            }

            if ($details) {
                $promotion = $details->promotion->title ?? ($assignment->promotion ? $assignment->promotion->title : 'Non défini');
                $semester = $details->semestre->title ?? 'Non défini';
                $cm = $details->cm ?? 0;
                $td = $details->td ?? 0;
                $tp = $details->tp ?? 0;
                $credits = $details->credits ?? 0;
            }
        } elseif ($assignment->promotion) {
            // Fallback if no course details but promotion exists
            $promotion = $assignment->promotion->title;
        }

        return [
            $promotion,
            $assignment->course->title ?? 'Cours inconnu',
            $semester,
            $cm,
            $tp,
            $td,
            $credits,
            $assignment->holder?->name ?? '',
            $assignment->collaborator?->name ?? '',
        ];
    }

    public function headings(): array
    {
        return [
            'Promotion',
            'Nom du cours',
            'Semestre',
            'CM',
            'TP',
            'TD',
            'Crédits',
            'Titulaire',
            'Collaborateur',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style de la première ligne (en-têtes)
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['argb' => 'FFD9D9D9']
                ]
            ],
        ];
    }
}
