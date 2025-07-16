<?php

namespace Modules\Calendar\Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Modules\Calendar\Entities\CalendarEvent;

class CalendarEventFactory extends Factory
{
    protected $model = CalendarEvent::class;

    public function definition()
    {
        return [
            'title' => $this->faker->sentence,
            'description' => $this->faker->paragraph,
            'start_date' => $this->faker->dateTimeBetween('now', '+1 month'),
            'end_date' => $this->faker->dateTimeBetween('+1 month', '+2 months'),
            'location' => $this->faker->address,
            'type' => $this->faker->randomElement(['academic', 'event', 'holiday']),
        ];
    }
}