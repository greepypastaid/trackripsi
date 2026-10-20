<?php

use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('stores a log with action items and converts them to tasks', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);

    $logId = $this->postJson("/api/v1/researches/{$research->id}/logs", [
        'meeting_date' => '2026-01-10',
        'chapter_id' => $chapter->id,
        'feedback_notes' => 'Perbaiki rumusan masalah.',
        'action_items' => ['Tulis ulang latar belakang', 'Tambah 3 jurnal'],
    ])->assertCreated()->assertJsonCount(2, 'data.action_items')->json('data.id');

    $this->postJson("/api/v1/logs/{$logId}/convert-action-items")->assertOk();

    expect($chapter->tasks()->count())->toBe(2);
});

it('rejects a chapter that belongs to another research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $foreign = Research::factory()->for(User::factory())->create();
    $foreignChapter = $foreign->chapters()->create(['title' => 'Bab X', 'order' => 1]);

    $this->postJson("/api/v1/researches/{$research->id}/logs", [
        'meeting_date' => '2026-01-10',
        'chapter_id' => $foreignChapter->id,
        'feedback_notes' => 'x',
    ])->assertStatus(422);
});
