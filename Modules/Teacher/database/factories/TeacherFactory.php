<?php

namespace Modules\Teacher\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Teacher\Entities\Teacher;
use App\Models\User;

class TeacherFactory extends Factory
{
    protected $model = Teacher::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'matricule' => $this->faker->unique()->bothify('TCH-####'),
            'name' => $this->faker->name,
            'gendre' => $this->faker->randomElement(['M', 'F']),
            'date_of_birth' => $this->faker->date(),
            'academic_level' => 'Doctorat',
            'specialty' => $this->faker->word,
        ];
    }
}
