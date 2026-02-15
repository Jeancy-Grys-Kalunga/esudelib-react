<?php

namespace Modules\Institution\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Institution\Entities\Jury;
use Modules\Institution\Entities\Promotion;
use Modules\Institution\Entities\AcademicYear;
use Modules\Teacher\Entities\Teacher;

class JuryFactory extends Factory
{
    protected $model = Jury::class;

    public function definition(): array
    {
        $promotion = Promotion::factory()->create();
        return [
            'president_id' => Teacher::factory(),
            'secretary_id' => Teacher::factory(),
            'member_id' => Teacher::factory(),
            'promotion_id' => $promotion->id,
            'institution_id' => $promotion->institution_id,
            'academic_year_id' => AcademicYear::factory(),
            'observation' => $this->faker->sentence(),
        ];
    }
}
