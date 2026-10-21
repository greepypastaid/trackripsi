<?php

use App\Models\Research;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

function exportFixture(): Research
{
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create(['title' => 'Skripsi A']);
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);
    $task = $chapter->tasks()->create(['title' => 'Tulis latar belakang', 'due_date' => '2026-11-01']);
    $task->update(['is_completed' => true]);
    $chapter->drafts()->create([
        'version_label' => 'v1',
        'file_name' => 'bab1.pdf',
        'mime_type' => 'application/pdf',
        'file_size_bytes' => 1024,
        'file_path' => 'drafts/bab1.pdf',
    ]);

    return $research;
}

it('exports research recap as markdown attachment', function () {
    $research = exportFixture();

    $response = $this->getJson("/api/v1/researches/{$research->id}/export");

    $response->assertOk()
        ->assertHeader('Content-Type', 'text/markdown; charset=UTF-8')
        ->assertHeader('Content-Disposition', 'attachment; filename="rekap-skripsi-a.md"');

    $content = $response->getContent();
    expect($content)->toContain('# Rekap: Skripsi A');
    expect($content)->toContain('## Bab 1');
    expect($content)->toContain('- [x] Tulis latar belakang');
    expect($content)->toContain('- v1 — bab1.pdf');
    expect($content)->toContain('## Log Bimbingan');
});

it('exports research recap as json with relations', function () {
    $research = exportFixture();

    $data = $this->getJson("/api/v1/researches/{$research->id}/export?format=json")
        ->assertOk()
        ->json('data');

    expect($data['title'])->toBe('Skripsi A');
    expect($data['chapters'][0]['tasks'][0]['title'])->toBe('Tulis latar belakang');
    expect($data['chapters'][0]['drafts'][0]['file_name'])->toBe('bab1.pdf');
});

it('blocks user B from exporting user A recap', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}/export")->assertForbidden();
});
