<?php

use App\Models\Research;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

it('uploads a pdf draft and downloads it only for the owner', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);

    $id = $this->postJson("/api/v1/chapters/{$chapter->id}/drafts", [
        'file' => UploadedFile::fake()->create('bab1.pdf', 500, 'application/pdf'),
    ])->assertCreated()->assertJsonPath('data.version_label', 'v1.0')->json('data.id');

    $this->get("/api/v1/documents/{$id}/download")->assertOk();

    Sanctum::actingAs(User::factory()->create());
    $this->get("/api/v1/documents/{$id}/download")->assertForbidden();
});

it('rejects a non pdf/docx file', function () {
    Storage::fake('local');
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 1', 'order' => 1]);

    $this->postJson("/api/v1/chapters/{$chapter->id}/drafts", [
        'file' => UploadedFile::fake()->create('evil.exe', 10, 'application/x-msdownload'),
    ])->assertStatus(422);
});
