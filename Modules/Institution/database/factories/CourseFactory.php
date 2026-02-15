<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Course;

class CourseFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Course::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'title' => $this->faker->sentence(3),
            'orientation' => $this->faker->word(),
            'is_optional' => $this->faker->boolean(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
