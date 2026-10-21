<?php

use App\Models\FocusSession;
use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function focusResearch(): Research
{
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    return Research::factory()->for($user)->create();
}

it('stores a focus session and computes duration server-side', function () {
    $research = focusResearch();

    $response = $this->postJson("/api/v1/researches/{$research->id}/focus-sessions", [
        'started_at' => '2026-10-21 08:00:00',
        'ended_at' => '2026-10-21 09:30:00',
        'note' => 'Draft Bab 1',
    ]);

    $response->assertCreated();
    expect($response->json('data.duration_minutes'))->toBe(90);
    expect(FocusSession::first()->research_id)->toBe($research->id);
});

it('rejects ended_at before started_at', function () {
    $research = focusResearch();

    $this->postJson("/api/v1/researches/{$research->id}/focus-sessions", [
        'started_at' => '2026-10-21 09:30:00',
        'ended_at' => '2026-10-21 08:00:00',
    ])->assertUnprocessable();
});

it('lists sessions with weekly totals', function () {
    $research = focusResearch();
    $research->focusSessions()->create([
        'user_id' => $research->user_id,
        'started_at' => now()->subHour(),
        'ended_at' => now(),
        'duration_minutes' => 60,
    ]);
    $research->focusSessions()->create([
        'user_id' => $research->user_id,
        'started_at' => now()->subWeeks(2),
        'ended_at' => now()->subWeeks(2)->addHour(),
        'duration_minutes' => 30,
    ]);

    $data = $this->getJson("/api/v1/researches/{$research->id}/focus-sessions")->assertOk()->json('data');

    expect($data['sessions'])->toHaveCount(2);
    expect($data['total_minutes'])->toBe(90);
    expect($data['week_minutes'])->toBe(60);
});

it('blocks user B from deleting user A focus session', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $session = $research->focusSessions()->create([
        'user_id' => $owner->id,
        'started_at' => now()->subHour(),
        'ended_at' => now(),
        'duration_minutes' => 60,
    ]);

    Sanctum::actingAs($other);

    $this->deleteJson("/api/v1/focus-sessions/{$session->id}")->assertNotFound();
});

it('computes today minutes and streak against daily target', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create(['daily_target_minutes' => 60]);

    // Kemarin & dua hari lalu: capai target. Hari ini: belum.
    foreach ([2, 1] as $daysAgo) {
        $research->focusSessions()->create([
            'user_id' => $user->id,
            'started_at' => now()->subDays($daysAgo)->setHour(8),
            'ended_at' => now()->subDays($daysAgo)->setHour(9),
            'duration_minutes' => 60,
        ]);
    }

    $data = $this->getJson("/api/v1/researches/{$research->id}/focus-sessions")->assertOk()->json('data');

    expect($data['daily_target_minutes'])->toBe(60);
    expect($data['today_minutes'])->toBe(0);
    expect($data['streak_days'])->toBe(2);

    // Tambah sesi hari ini 60 menit → streak jadi 3.
    $research->focusSessions()->create([
        'user_id' => $user->id,
        'started_at' => now()->setHour(8),
        'ended_at' => now()->setHour(9),
        'duration_minutes' => 60,
    ]);

    $data = $this->getJson("/api/v1/researches/{$research->id}/focus-sessions")->json('data');
    expect($data['streak_days'])->toBe(3);
});
