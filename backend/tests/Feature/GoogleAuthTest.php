<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    config([
        'services.google.client_id' => 'client-id',
        'services.google.client_secret' => 'client-secret',
        'services.google.frontend_url' => 'http://localhost:5173',
    ]);
});

it('builds a google consent url with state', function () {
    $url = $this->getJson('/api/v1/auth/google/redirect')->assertOk()->json('url');

    expect($url)->toStartWith('https://accounts.google.com/o/oauth2/v2/auth?')
        ->toContain('client_id=client-id')
        ->toContain('state=')
        ->toContain('scope=openid+email+profile');
});

it('creates a google-only user and redirects with a token', function () {
    Cache::put('google_state:test-state', true, 600);

    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['access_token' => 'ya29.token']),
        'openidconnect.googleapis.com/*' => Http::response([
            'sub' => 'google-123',
            'email' => 'google@example.test',
            'email_verified' => true,
            'name' => 'Google User',
        ]),
    ]);

    $this->get('/api/v1/auth/google/callback?code=abc&state=test-state')
        ->assertRedirect()
        ->assertRedirectContains('http://localhost:5173/auth/google/callback#token=');

    $user = User::where('google_id', 'google-123')->firstOrFail();
    expect($user->email)->toBe('google@example.test')
        ->and($user->name)->toBe('Google User')
        ->and($user->password)->not->toBeNull()
        ->and($user->tokens()->count())->toBe(1);
});

it('links google to an existing account by email', function () {
    $user = User::factory()->create(['email' => 'andi@example.test', 'password' => 'password123']);
    Cache::put('google_state:link-state', true, 600);

    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['access_token' => 'ya29.token']),
        'openidconnect.googleapis.com/*' => Http::response([
            'sub' => 'google-456',
            'email' => 'andi@example.test',
            'email_verified' => true,
        ]),
    ]);

    $this->get('/api/v1/auth/google/callback?code=abc&state=link-state')->assertRedirect();

    expect($user->refresh()->google_id)->toBe('google-456')
        ->and(Hash::check('password123', $user->password))->toBeTrue();
});

it('rejects a callback with unknown state', function () {
    $this->get('/api/v1/auth/google/callback?code=abc&state=forged')
        ->assertRedirect('http://localhost:5173/auth/google/callback#error=invalid_state');

    expect(User::count())->toBe(0);
});

it('redirects to the first frontend origin when FRONTEND_URL lists several', function () {
    config(['services.google.frontend_url' => 'http://localhost:5173,http://localhost:5174']);

    $this->get('/api/v1/auth/google/callback?code=abc&state=forged')
        ->assertRedirect('http://localhost:5173/auth/google/callback#error=invalid_state');
});

it('forwards google token exchange errors to the frontend', function () {
    Cache::put('google_state:fail-state', true, 600);

    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['error' => 'invalid_client'], 401),
    ]);

    $this->get('/api/v1/auth/google/callback?code=abc&state=fail-state')
        ->assertRedirect('http://localhost:5173/auth/google/callback#error=invalid_client');

    expect(User::count())->toBe(0);
});
