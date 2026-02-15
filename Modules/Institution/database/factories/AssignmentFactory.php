<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Assignment;
use Modules\Institution\Entities\Course;
use Modules\Institution\Entities\AcademicYear;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Promotion;
use Modules\Teacher\Entities\Teacher;

class AssignmentFactory extends Factory
{
    protected $model = Assignment::class;

    public function definition(): array
    {
        return [
            'holder_id' => Teacher::factory(),
            'collaborator_id' => null,
            'course_id' => Course::factory(),
            'academic_year_id' => AcademicYear::factory(),
            'institution_id' => Institution::factory(),
            'promotion_id' => Promotion::factory(),
            'observation' => $this->faker->sentence(),
        ];
    }
}
