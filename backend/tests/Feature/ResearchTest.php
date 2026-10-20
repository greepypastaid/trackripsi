<?php

use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('creates a research with the default five chapters', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $response = $this->postJson('/api/v1/researches', ['title' => 'Skripsi A']);

    $response->assertCreated()->assertJsonPath('data.title', 'Skripsi A');
    expect(Research::first()->chapters)->toHaveCount(5);
});

it('blocks user B from reading user A research', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}")->assertForbidden();
});

it('blocks user B from deleting user A chapter task', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $task = $chapter->tasks()->create(['title' => 'Revisi']);

    Sanctum::actingAs($other);

    $this->patchJson("/api/v1/tasks/{$task->id}/toggle")->assertForbidden();
    $this->deleteJson("/api/v1/tasks/{$task->id}")->assertForbidden();
});

it('recalculates chapter progress when tasks change', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);

    $a = $this->postJson("/api/v1/chapters/{$chapter->id}/tasks", ['title' => 'A'])->json('data.id');
    $this->postJson("/api/v1/chapters/{$chapter->id}/tasks", ['title' => 'B']);

    $this->patchJson("/api/v1/tasks/{$a}/toggle")->assertOk();

    expect($chapter->refresh()->progress_percent)->toBe(50);
    expect($this->getJson("/api/v1/researches/{$research->id}/summary")->json('data.progress_percent'))->toBe(50);
});
