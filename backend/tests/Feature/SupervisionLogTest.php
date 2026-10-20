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
        'chapter_ids' => [$chapter->id],
        'feedback_notes' => 'Perbaiki rumusan masalah.',
        'action_items' => ['Tulis ulang latar belakang', 'Tambah 3 jurnal'],
    ])->assertCreated()->assertJsonCount(2, 'data.action_items')->json('data.id');

    $this->postJson("/api/v1/logs/{$logId}/convert-action-items")->assertOk();

    expect($chapter->tasks()->count())->toBe(2);
});

it('links one log to multiple chapters', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $c1 = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $c2 = $research->chapters()->create(['title' => 'Bab 2', 'order' => 2]);

    $response = $this->postJson("/api/v1/researches/{$research->id}/logs", [
        'meeting_date' => '2026-01-10',
        'chapter_ids' => [$c1->id, $c2->id],
        'feedback_notes' => 'Bahas kaitan Bab 1 dan Bab 2.',
    ])->assertCreated();

    $response->assertJsonCount(2, 'data.chapter_ids')
        ->assertJsonCount(2, 'data.chapters');

    $log = $research->supervisionLogs()->first();
    expect($log->chapters()->pluck('chapters.id')->all())->toEqualCanonicalizing([$c1->id, $c2->id]);
});

it('rejects a chapter that belongs to another research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $foreign = Research::factory()->for(User::factory())->create();
    $foreignChapter = $foreign->chapters()->create(['title' => 'Bab X', 'order' => 1]);

    $this->postJson("/api/v1/researches/{$research->id}/logs", [
        'meeting_date' => '2026-01-10',
        'chapter_ids' => [$foreignChapter->id],
        'feedback_notes' => 'x',
    ])->assertStatus(422);
});
