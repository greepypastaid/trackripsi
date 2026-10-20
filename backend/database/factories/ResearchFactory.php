<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ResearchFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'title' => fake()->sentence(6),
            'faculty_field' => 'Teknik Informatika',
            'supervisor_name' => fake()->name(),
            'target_completion_date' => now()->addMonths(6)->toDateString(),
            'status' => 'active',
        ];
    }
}
