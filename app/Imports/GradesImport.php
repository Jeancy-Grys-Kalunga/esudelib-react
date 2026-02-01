<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Modules\Institution\Entities\AcademicYear;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\Promotion;
use Illuminate\Support\Facades\DB;

class GradesImport implements ToModel, WithHeadingRow
{
    protected $course;
    protected $promotion;
    protected $academicYear;
    protected $session;
    protected $examSessionId;

    public function __construct(Course $course, Promotion $promotion, AcademicYear $academicYear, string $session = '', int $examSessionId)
    {
        $this->course = $course;
        $this->promotion = $promotion;
        $this->academicYear = $academicYear;
        $this->session = $session;
        $this->examSessionId = $examSessionId;
    }

    public function model(array $row)
    {
        $matricule = isset($row['matricule']) ? trim($row['matricule']) : '';
        $student = Student::where('matricule', $matricule)->first();

        if ($student) {
            // Rechercher l'inscription de l'étudiant pour l'année académique concernée
            // afin d'associer la note à sa promotion réelle (cas des cours partagés)
            $inscription = \Modules\RegistrationDesk\Entities\Inscription::where('student_id', $student->id)
                ->where('academic_year_id', $this->academicYear->id)
                ->first();

            // Si une inscription est trouvée, on utilise sa promotion, sinon on garde celle du fichier/prof
            $targetPromotionId = $inscription ? $inscription->promotion_id : $this->promotion->id;

            $session = $row['session'] ?? $this->session;
            $observation = $row['observation'] ?? '';
            $situation = $row['situation'] ?? '';
            $participation = $row['participation'] ?? null;

            DB::table('notes')->updateOrInsert(
                [
                    'course_id' => $this->course->id,
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYear->id,
                    'promotion_id' => $targetPromotionId, // Utiliser la promotion réelle de l'étudiant
                    'exam_session_id' => $this->examSessionId,
                ],
                [
                    'cote' => isset($row['point20']) ? floatval(str_replace(',', '.', $row['point20'])) : null,
                    'observation' => $observation,
                    'situation' => $situation,
                    'participation' => $participation,
                    'is_submitted' => true,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );
        }

        return null;
    }
}
