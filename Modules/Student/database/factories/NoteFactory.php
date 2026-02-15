<?php

namespace Modules\Student\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Student\Entities\Note;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\ExamSession;

class NoteFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Note::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'cote' => $this->faker->randomFloat(2, 0, 20),
            'observation' => $this->faker->sentence(),
            'situation' => $this->faker->randomElement(['Passed', 'Failed']),
            'student_id' => Student::factory(),
            'course_id' => Course::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'exam_session_id' => ExamSession::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
