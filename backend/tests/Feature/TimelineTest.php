<?php

use App\Models\Chapter;
use App\Models\DocumentDraft;
use App\Models\Research;
use App\Models\SupervisionLog;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function makeChapter(Research $research, string $title = 'Bab 1', int $order = 1): Chapter
{
    return $research->chapters()->create(['title' => $title, 'order' => $order]);
}

it('returns merged timeline of events newest first', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = makeChapter($research);

    $task = $chapter->tasks()->create(['title' => 'Tulis latar belakang']);
    $task->update(['is_completed' => true]);

    $log = new SupervisionLog([
        'meeting_date' => now()->subDay()->toDateString(),
        'feedback_notes' => 'Perjelas rumusan masalah.',
    ]);
    $research->supervisionLogs()->save($log);

    $research->appointments()->create([
        'scheduled_at' => now()->subDays(2),
        'status' => 'done',
    ]);

    // Draft: lewat endpoint upload agar realistis, atau langsung model.
    $draft = new DocumentDraft([
        'version_label' => 'v1',
        'file_name' => 'bab1-draft.pdf',
        'mime_type' => 'application/pdf',
        'file_size_bytes' => 1024,
        'file_path' => 'drafts/bab1-draft.pdf',
    ]);
    $chapter->drafts()->save($draft);

    $data = $this->getJson("/api/v1/researches/{$research->id}/timeline")->assertOk()->json('data');

    expect($data)->toHaveCount(4);
    expect(array_column($data, 'type'))->toContain('draft_uploaded', 'task_completed', 'supervision_logged', 'appointment_done');
    $dates = array_column($data, 'occurred_at');
    expect($dates)->toEqual(collect($dates)->sortDesc()->values()->all());
});

it('blocks user B from reading user A timeline', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}/timeline")->assertForbidden();
});

it('caps timeline limit to 100', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = makeChapter($research);

    foreach (range(1, 3) as $i) {
        $task = $chapter->tasks()->create(['title' => "Task $i"]);
        $task->update(['is_completed' => true]);
    }

    $data = $this->getJson("/api/v1/researches/{$research->id}/timeline?limit=2")->assertOk()->json('data');

    expect($data)->toHaveCount(2);
});
