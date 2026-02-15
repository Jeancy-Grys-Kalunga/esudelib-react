<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Semestre;

class SemestreFactory extends Factory
{
    protected $model = Semestre::class;

    public function definition(): array
    {
        return [
            'title' => $this->faker->word(),
        ];
    }
}
