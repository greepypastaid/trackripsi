<?php

use App\Models\JournalEntry;
use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function journalResearch(): Research
{
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    return Research::factory()->for($user)->create();
}

it('creates a journal entry', function () {
    $research = journalResearch();

    $response = $this->postJson("/api/v1/researches/{$research->id}/journal", [
        'entry_date' => '2026-10-21',
        'mood' => 'produktif',
        'body' => 'Selesai drafting rumusan masalah.',
    ]);

    $response->assertCreated();
    expect($response->json('data.mood'))->toBe('produktif');
    expect(JournalEntry::first()->research_id)->toBe($research->id);
});

it('rejects invalid mood', function () {
    $research = journalResearch();

    $this->postJson("/api/v1/researches/{$research->id}/journal", [
        'entry_date' => '2026-10-21',
        'mood' => 'senang',
        'body' => 'x',
    ])->assertUnprocessable();
});

it('lists entries filtered by month', function () {
    $research = journalResearch();
    $research->journalEntries()->create([
        'user_id' => $research->user_id,
        'entry_date' => '2026-10-05',
        'mood' => 'biasa',
        'body' => 'Oktober',
    ]);
    $research->journalEntries()->create([
        'user_id' => $research->user_id,
        'entry_date' => '2026-09-15',
        'mood' => 'struggle',
        'body' => 'September',
    ]);

    $data = $this->getJson("/api/v1/researches/{$research->id}/journal?month=2026-10")->assertOk()->json('data');

    expect($data)->toHaveCount(1);
    expect($data[0]['body'])->toBe('Oktober');
});

it('updates and deletes own entry', function () {
    $research = journalResearch();
    $entry = $research->journalEntries()->create([
        'user_id' => $research->user_id,
        'entry_date' => '2026-10-05',
        'mood' => 'biasa',
        'body' => 'Awal',
    ]);

    $this->patchJson("/api/v1/journal/{$entry->id}", [
        'entry_date' => '2026-10-05',
        'mood' => 'produktif',
        'body' => 'Revisi',
    ])->assertOk()->assertJsonPath('data.body', 'Revisi');

    $this->deleteJson("/api/v1/journal/{$entry->id}")->assertOk();
    expect(JournalEntry::find($entry->id))->toBeNull();
});

it('blocks user B from updating user A entry', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $entry = $research->journalEntries()->create([
        'user_id' => $owner->id,
        'entry_date' => '2026-10-05',
        'mood' => 'biasa',
        'body' => 'Rahasia',
    ]);

    Sanctum::actingAs($other);

    $this->patchJson("/api/v1/journal/{$entry->id}", [
        'entry_date' => '2026-10-05',
        'mood' => 'biasa',
        'body' => 'Diretas',
    ])->assertNotFound();
});
