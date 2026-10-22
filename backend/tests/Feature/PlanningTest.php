<?php

use App\Models\Research;
use App\Models\SupervisionAppointment;
use App\Models\SupervisionLog;
use App\Models\User;
use Database\Seeders\DefenseQuestionSeeder;
use Laravel\Sanctum\Sanctum;

it('creates an appointment and returns it as the next one', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->postJson("/api/v1/researches/{$research->id}/appointments", [
        'scheduled_at' => now()->addDays(3)->toDateTimeString(),
        'agenda' => ['Bahas Bab 1', ''],
    ])->assertCreated()->assertJsonCount(1, 'data.agenda');

    $this->getJson("/api/v1/researches/{$research->id}/appointments")
        ->assertOk()
        ->assertJsonPath('meta.next.agenda.0', 'Bahas Bab 1');
});

it('completes an appointment creating exactly one supervision log', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $appointment = SupervisionAppointment::create([
        'research_id' => $research->id,
        'scheduled_at' => now()->addDay(),
        'agenda' => ['Bahas metodologi'],
    ]);

    $this->postJson("/api/v1/researches/{$research->id}/appointments/{$appointment->id}/complete", [
        'meeting_date' => now()->toDateString(),
        'feedback_notes' => 'Metode disetujui.',
        'action_items' => ['Perbaiki sampel'],
    ])->assertCreated()->assertJsonCount(1, 'data.action_items');

    expect(SupervisionLog::where('research_id', $research->id)->count())->toBe(1);
    expect($appointment->refresh()->status)->toBe('done');
    expect($appointment->log_id)->not->toBeNull();
});

it('rejects completing an already completed appointment', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $appointment = SupervisionAppointment::create([
        'research_id' => $research->id,
        'scheduled_at' => now()->addDay(),
        'status' => 'done',
    ]);

    $this->postJson("/api/v1/researches/{$research->id}/appointments/{$appointment->id}/complete", [
        'meeting_date' => now()->toDateString(),
        'feedback_notes' => 'x',
    ])->assertStatus(422);
});

it('suggests an agenda from open action items and overdue tasks', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $chapter = $research->chapters()->create(['title' => 'Bab 3', 'order' => 3, 'status' => 'revision']);
    $chapter->tasks()->create(['title' => 'Tugas terlambat', 'due_date' => now()->subDays(2)->toDateString()]);

    $log = $research->supervisionLogs()->create(['meeting_date' => now()->toDateString(), 'feedback_notes' => 'x']);
    $log->actionItems()->create(['description' => 'Revisi rumusan masalah']);

    $agenda = $this->getJson("/api/v1/researches/{$research->id}/appointments/suggested-agenda")
        ->assertOk()
        ->json('data');

    expect($agenda)->toContain('Revisi rumusan masalah');
    expect(implode(' | ', $agenda))->toContain('Tugas terlambat');
    expect(implode(' | ', $agenda))->toContain('Bahas revisi Bab 3');
});

it('blocks cross-user appointment access', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $appointment = SupervisionAppointment::create([
        'research_id' => $research->id,
        'scheduled_at' => now()->addDay(),
    ]);

    Sanctum::actingAs($other);

    // findOrFail menyembunyikan keberadaan riset milik user lain (404), bukan 403.
    $this->getJson("/api/v1/researches/{$research->id}/appointments")->assertNotFound();
    $this->patchJson("/api/v1/appointments/{$appointment->id}", ['status' => 'cancelled'])->assertForbidden();
    $this->postJson("/api/v1/researches/{$research->id}/appointments/{$appointment->id}/complete", [
        'meeting_date' => now()->toDateString(),
        'feedback_notes' => 'x',
    ])->assertNotFound();
});

it('calculates readiness blockers and score', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $response = $this->getJson("/api/v1/researches/{$research->id}/readiness")->assertOk();

    expect($response->json('data.blockers'))->not->toBeEmpty();
    expect($response->json('data.stats.min_supervision_sessions'))->toBe(12);
    expect($response->json('data.score'))->toBeLessThan(100);
});

it('scores readiness proportionally so an untouched research starts at zero', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $base = $this->getJson("/api/v1/researches/{$research->id}/readiness")->assertOk()->json('data');

    // Target waktu sudah diisi factory, tapi itu bukan progres: skor tetap 0.
    expect($base['score'])->toBe(0);
    expect($base['checks'])->toHaveCount(5);

    $chapter = $research->chapters()->create([
        'title' => 'Bab 1: Pendahuluan',
        'order' => 1,
        'status' => 'completed',
    ]);

    $after = $this->getJson("/api/v1/researches/{$research->id}/readiness")->json('data');

    // 1 dari 1 bab selesai cuma menyumbang bobot bab (30%), bukan skor penuh.
    expect($after['score'])->toBe(30);

    $chapter->update(['status' => 'in_progress']);
    $this->postJson("/api/v1/researches/{$research->id}/logs", [
        'meeting_date' => now()->toDateString(),
        'feedback_notes' => 'Bimbingan awal',
    ])->assertCreated();

    // Satu sesi dari 12 minimal cuma menyumbang sebagian kecil bobot bimbingan.
    $partial = $this->getJson("/api/v1/researches/{$research->id}/readiness")->json('data');
    expect($partial['score'])->toBe(3);
    expect(collect($partial['checks'])->firstWhere('key', 'supervision')['progress'])->toBeLessThan(0.1);
});

it('stores a manual readiness checklist per research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->putJson("/api/v1/researches/{$research->id}/readiness/checklist", [
        'checklist' => [
            ['label' => 'Bebas plagiasi', 'done' => true],
            ['label' => 'TOEFL', 'done' => false],
        ],
    ])->assertOk();

    expect($research->refresh()->readiness_checklist)->toHaveCount(2);
    expect($this->getJson("/api/v1/researches/{$research->id}/readiness")->json('data.blockers'))
        ->toContain(['key' => 'checklist.1', 'label' => 'TOEFL', 'detail' => 'Belum ditandai selesai.']);
});

it('seeds defense questions and stores answers per research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->seed(DefenseQuestionSeeder::class);

    $questions = $this->getJson("/api/v1/researches/{$research->id}/defense-questions")
        ->assertOk()
        ->json('data');

    expect($questions)->not->toBeEmpty();
    expect($questions[0]['is_ready'])->toBeFalse();

    $this->putJson("/api/v1/researches/{$research->id}/defense-questions/{$questions[0]['id']}/answer", [
        'answer' => 'Karena masalah ini belum diteliti di kampus kami.',
        'is_ready' => true,
    ])->assertOk()->assertJsonPath('data.is_ready', true);

    $this->getJson("/api/v1/researches/{$research->id}/defense-questions")
        ->assertJsonPath('data.0.is_ready', true);
});

it('returns ordered logbook sessions for printing', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $research->supervisionLogs()->create(['meeting_date' => '2026-02-01', 'feedback_notes' => 'Kedua']);
    $research->supervisionLogs()->create(['meeting_date' => '2026-01-01', 'feedback_notes' => 'Pertama']);

    $this->getJson("/api/v1/researches/{$research->id}/logbook")
        ->assertOk()
        ->assertJsonPath('data.total', 2)
        ->assertJsonPath('data.sessions.0.feedback_notes', 'Pertama')
        ->assertJsonPath('data.sessions.1.number', 2);
});

it('blocks cross-user readiness and logbook access', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}/readiness")->assertNotFound();
    $this->getJson("/api/v1/researches/{$research->id}/logbook")->assertNotFound();
    $this->getJson("/api/v1/researches/{$research->id}/defense-questions")->assertNotFound();
});
