<?php

use App\Models\Chapter;
use App\Models\DocumentDraft;
use App\Models\Research;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
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

it('updates a research owned by the user', function () {
    $owner = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($owner);

    $this->patchJson("/api/v1/researches/{$research->id}", [
        'title' => 'Judul Baru',
        'supervisor_name' => 'Dr. Pembimbing',
    ])->assertOk()
        ->assertJsonPath('data.title', 'Judul Baru')
        ->assertJsonPath('data.supervisor_name', 'Dr. Pembimbing');

    expect($research->refresh()->title)->toBe('Judul Baru');
});

it('changes research status to paused or inactive', function () {
    $owner = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($owner);

    foreach (['paused', 'inactive', 'active'] as $status) {
        $this->patchJson("/api/v1/researches/{$research->id}", ['status' => $status])
            ->assertOk()
            ->assertJsonPath('data.status', $status);

        expect($research->refresh()->status)->toBe($status);
    }

    $this->patchJson("/api/v1/researches/{$research->id}", ['status' => 'ditunda'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('status');

    expect($research->refresh()->status)->toBe('active');
});

it('blocks user B from updating user A research', function () {
    $research = Research::factory()->for(User::factory()->create())->create();

    Sanctum::actingAs(User::factory()->create());

    $this->patchJson("/api/v1/researches/{$research->id}", ['title' => 'Bukan Punya'])
        ->assertForbidden();
});

it('deletes own research along with drafts and their files', function () {
    Storage::fake('local');
    $owner = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);

    Storage::disk('local')->put('drafts/bab1.pdf', 'isi');
    $chapter->drafts()->create([
        'version_label' => 'v1.0',
        'file_path' => 'drafts/bab1.pdf',
        'file_name' => 'bab1.pdf',
        'mime_type' => 'application/pdf',
        'file_size_bytes' => 3,
    ]);

    Sanctum::actingAs($owner);

    $this->deleteJson("/api/v1/researches/{$research->id}")->assertOk();

    expect(Research::find($research->id))->toBeNull();
    expect(Chapter::where('research_id', $research->id)->count())->toBe(0);
    expect(DocumentDraft::count())->toBe(0);
    Storage::disk('local')->assertMissing('drafts/bab1.pdf');
});

it('blocks user B from deleting user A research', function () {
    $research = Research::factory()->for(User::factory()->create())->create();

    Sanctum::actingAs(User::factory()->create());

    $this->deleteJson("/api/v1/researches/{$research->id}")->assertForbidden();
    expect(Research::find($research->id))->not->toBeNull();
});
