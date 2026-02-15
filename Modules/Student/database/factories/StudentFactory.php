<?php

namespace Modules\Student\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Student\Entities\Student;
use App\Models\User;
use Modules\Institution\Entities\Institution;

class StudentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Student::class;

    /**
     * Define the model's default state.
     *
     * @return array
     */
    public function definition()
    {
        return [
            'user_id' => User::factory(),
            'institution_id' => Institution::factory(),
            'matricule' => $this->faker->unique()->bothify('STU####??'),
            'name' => $this->faker->name(),
            'email' => $this->faker->unique()->safeEmail(),
            'phone' => $this->faker->phoneNumber(),
            'gendre' => $this->faker->randomElement(['M', 'F']),
            'date_of_birth' => $this->faker->date(),
            'provenance_region' => $this->faker->state(),
            'provenance_localite' => $this->faker->city(),
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }
}
