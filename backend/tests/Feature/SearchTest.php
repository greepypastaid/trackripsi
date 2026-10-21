<?php

use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('searches tasks across own researches only', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create(['title' => 'Skripsi A']);
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $chapter->tasks()->create(['title' => 'Rumusan masalah unik']);

    // Riset user lain tidak boleh bocor.
    $other = Research::factory()->for(User::factory()->create())->create();
    $otherChapter = $other->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $otherChapter->tasks()->create(['title' => 'Rumusan masalah rahasia']);

    $data = $this->getJson('/api/v1/search?q=rumusan')->assertOk()->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['type'])->toBe('task');
    expect($data[0]['title'])->toBe('Rumusan masalah unik');
    expect($data[0]['research_id'])->toBe($research->id);
});

it('finds supervision logs by feedback content', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $research->supervisionLogs()->create([
        'meeting_date' => '2026-10-01',
        'feedback_notes' => 'Perkuat metodologi kualitatif',
    ]);

    $data = $this->getJson('/api/v1/search?q=metodologi')->assertOk()->json('data');

    expect($data[0]['type'])->toBe('supervision_log');
});

it('requires minimum query length', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->getJson('/api/v1/search?q=a')->assertUnprocessable();
});
