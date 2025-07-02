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

        // Accéder aux détails si disponibles
        if ($assignment->course && $assignment->course->courseProgramDetails->isNotEmpty()) {
            $details = $assignment->course->courseProgramDetails->first();

            $promotion = $details->promotion->title ?? 'Non défini';
            $semester = $details->semestre->title ?? 'Non défini';
            $cm = $details->cm ?? 0;
            $td = $details->td ?? 0;
            $tp = $details->tp ?? 0;
            $credits = $details->credits ?? 0;
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