<?php

use App\Models\User;

it('registers a user and returns a token', function () {
    $response = $this->postJson('/api/v1/auth/register', [
        'name' => 'Andi',
        'email' => 'andi@example.test',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);
    expect(User::count())->toBe(1);
});

it('rejects weak password', function () {
    $this->postJson('/api/v1/auth/register', [
        'name' => 'Andi',
        'email' => 'andi@example.test',
        'password' => 'short',
        'password_confirmation' => 'short',
    ])->assertStatus(422)->assertJsonValidationErrors('password');
});

it('logs in and rejects wrong credentials', function () {
    $user = User::factory()->create(['password' => 'password123']);

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password123'])
        ->assertOk()->assertJsonStructure(['token']);

    $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'nope'])
        ->assertStatus(422);
});
