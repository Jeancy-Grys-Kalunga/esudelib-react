<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\AcademicYear;

class PromotionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Promotion::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'institution_id' => Institution::factory(),
            'faculty_id' => Faculty::factory(),
            'title' => $this->faker->words(3, true),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
