<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\UnitsTeaching;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Course;

class UnitsTeachingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = UnitsTeaching::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'title' => $this->faker->words(3, true),
            'promotion_id' => Promotion::factory(),
            'course_id' => Course::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
