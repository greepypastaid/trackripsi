<?php

use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function calendarResearch(): Research
{
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    return Research::factory()->for($user)->create();
}

it('aggregates monthly events by date', function () {
    $research = calendarResearch();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $chapter->tasks()->create(['title' => 'Latar belakang', 'due_date' => '2026-10-05']);
    $research->appointments()->create(['scheduled_at' => '2026-10-06 09:00:00', 'status' => 'planned']);
    $research->supervisionLogs()->create([
        'meeting_date' => '2026-10-06',
        'feedback_notes' => 'Bagus, lanjutkan.',
    ]);
    $research->journalEntries()->create([
        'user_id' => $research->user_id,
        'entry_date' => '2026-10-07',
        'mood' => 'produktif',
        'body' => 'Mantap.',
    ]);
    $research->focusSessions()->create([
        'user_id' => $research->user_id,
        'started_at' => '2026-10-07 08:00:00',
        'ended_at' => '2026-10-07 09:00:00',
        'duration_minutes' => 60,
    ]);
    // Di luar bulan — tidak boleh muncul.
    $research->focusSessions()->create([
        'user_id' => $research->user_id,
        'started_at' => '2026-09-07 08:00:00',
        'ended_at' => '2026-09-07 09:00:00',
        'duration_minutes' => 60,
    ]);

    $days = $this->getJson("/api/v1/researches/{$research->id}/calendar?month=2026-10")
        ->assertOk()
        ->json('data');

    expect(array_keys($days))->toEqual(['2026-10-05', '2026-10-06', '2026-10-07']);
    expect($days['2026-10-05']['tasks'][0]['title'])->toBe('Latar belakang');
    expect($days['2026-10-06']['appointments'])->toHaveCount(1);
    expect($days['2026-10-06']['supervision'])->toHaveCount(1);
    expect($days['2026-10-07']['focus_minutes'])->toBe(60);
    expect($days['2026-10-07']['journal'][0]['mood'])->toBe('produktif');
});

it('rejects invalid month format', function () {
    $research = calendarResearch();

    $this->getJson("/api/v1/researches/{$research->id}/calendar?month=oktober")
        ->assertStatus(422);
});

it('blocks user B from reading user A calendar', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}/calendar")->assertForbidden();
});
