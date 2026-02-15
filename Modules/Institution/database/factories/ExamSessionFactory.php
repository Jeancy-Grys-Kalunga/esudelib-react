<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\ExamSession;
use Modules\Institution\Entities\Institution;

class ExamSessionFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = ExamSession::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'institution_id' => Institution::factory(),
            'title' => $this->faker->words(3, true),
            'status' => 'open',
            'acceptance_rate' => $this->faker->numberBetween(10, 90),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
