<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Department;
use Modules\Institution\Entities\Institution;

class DepartmentFactory extends Factory
{
    protected $model = Department::class;

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
