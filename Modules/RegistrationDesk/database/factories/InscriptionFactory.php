<?php

namespace Modules\RegistrationDesk\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\RegistrationDesk\Entities\Inscription;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\AcademicYear;

class InscriptionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Inscription::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'student_id' => Student::factory(),
            'promotion_id' => Promotion::factory(),
            'institution_id' => Institution::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
