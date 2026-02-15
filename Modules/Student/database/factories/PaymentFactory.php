<?php

namespace Modules\Student\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Student\Entities\Payment;
use Modules\Student\Entities\Student;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'amount' => $this->faker->numberBetween(1000, 50000),
            'status' => 'pending',
            'metadata' => json_encode(['reference' => $this->faker->uuid]),
        ];
    }
}
