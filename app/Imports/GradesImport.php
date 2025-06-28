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
    protected $session;
    protected $academicYear;
    protected $promotion;

    public function __construct(Course $course, Promotion $promotion, AcademicYear $academicYear, string $session = '')
    {
        $this->course = $course;
        $this->session = $session;
        $this->academicYear = $academicYear;
        $this->promotion = $promotion;
    }

    public function model(array $row)
    {
        $student = Student::where('matricule', $row['matricule'])->first();
        
        if ($student) {
            $session = $row['session'] ?? $this->session; 
            $observation = $row['observation'] ?? '';
            $situation = $row['situation'] ?? '';
            $participation = $row['participation'] ?? null;
            
            DB::table('notes')->updateOrInsert(
                [
                    'course_id' => $this->course->id,
                    'student_id' => $student->id,
                    'academic_year_id' => $this->academicYear->id,
                    'promotion_id' => $this->promotion->id,
                    'session' => $session,
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