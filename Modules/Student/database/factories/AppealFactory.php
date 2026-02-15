<?php

namespace Modules\Student\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Student\Entities\Appeal;
use Modules\Student\Entities\Student;
use Modules\Institution\Entities\Course;

class AppealFactory extends Factory
{
    protected $model = Appeal::class;

    public function definition(): array
    {
        return [
            'object' => $this->faker->sentence,
            'justification' => $this->faker->paragraph,
            'course_id' => Course::factory(),
            'student_id' => Student::factory(),
            'status' => 'pending',
        ];
    }
}
