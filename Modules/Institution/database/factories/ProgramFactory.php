<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Program;
use Modules\Institution\Entities\Institution;
use Modules\Institution\Entities\Department;
use Modules\Institution\Entities\Faculty;

class ProgramFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Program::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'institution_id' => Institution::factory(),
            'name' => $this->faker->sentence(3),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
