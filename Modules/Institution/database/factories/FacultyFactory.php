<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Faculty;
use Modules\Institution\Entities\Institution;

class FacultyFactory extends Factory
{
    protected $model = Faculty::class;

    public function definition()
    {
        return [
            'title' => $this->faker->words(3, true),
            'institution_id' => Institution::factory(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
