<?php

use App\Models\LiteratureEntry;
use App\Models\Research;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

it('adds a manual literature entry with default synthesis fields ready', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->postJson("/api/v1/researches/{$research->id}/literature", [
        'title' => 'Metodologi Penelitian Kualitatif',
        'authors' => [['family' => 'Moleong', 'given' => 'Lexy J.']],
        'year' => 2019,
        'type' => 'book',
    ])->assertCreated()->assertJsonPath('data.title', 'Metodologi Penelitian Kualitatif');

    expect($research->synthesisFields()->count())->toBe(5);
});

it('requires an exclusion reason when status is excluded', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $id = $this->postJson("/api/v1/researches/{$research->id}/literature", [
        'title' => 'Sumber A',
    ])->json('data.id');

    $this->patchJson("/api/v1/literature/{$id}", ['status' => 'excluded'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('exclusion_reason');
});

it('imports metadata from openalex and stores authors', function () {
    Http::fake([
        'api.openalex.org/*' => Http::response([
            'title' => 'Stres Skripsi',
            'publication_year' => 2025,
            'doi' => 'https://doi.org/10.70570/jikmc.v4i1.1568',
            'type' => 'article',
            'biblio' => ['volume' => '4', 'issue' => '1', 'first_page' => '50', 'last_page' => '57'],
            'authorships' => [
                ['author' => ['display_name' => 'Eko Arik Susmiatin']],
                ['author' => ['display_name' => 'Linda Ishariani']],
            ],
            'abstract_inverted_index' => ['Stres' => [0], 'skripsi' => [1]],
            'primary_location' => ['source' => ['display_name' => 'Jurnal Mandira']],
        ]),
    ]);

    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $response = $this->postJson("/api/v1/researches/{$research->id}/literature/import-doi", [
        'doi' => 'https://doi.org/10.70570/jikmc.v4i1.1568',
    ]);

    $response->assertCreated()
        ->assertJsonPath('data.metadata_source', 'openalex')
        ->assertJsonPath('data.authors.0.family', 'Susmiatin')
        ->assertJsonPath('data.abstract', 'Stres skripsi');
});

it('falls back to crossref when openalex misses', function () {
    Http::fake([
        'api.openalex.org/*' => Http::response([], 404),
        'api.crossref.org/*' => Http::response([
            'message' => [
                'title' => ['Judul dari Crossref'],
                'author' => [['family' => 'Kucsko', 'given' => 'G.']],
                'issued' => ['date-parts' => [[2013]]],
                'type' => 'journal-article',
            ],
        ]),
    ]);

    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->postJson("/api/v1/researches/{$research->id}/literature/import-doi", ['doi' => '10.1038/nature12373'])
        ->assertCreated()
        ->assertJsonPath('data.metadata_source', 'crossref')
        ->assertJsonPath('data.title', 'Judul dari Crossref');
});

it('rejects unknown doi without storing partial data', function () {
    Http::fake([
        'api.openalex.org/*' => Http::response([], 404),
        'api.crossref.org/*' => Http::response('Resource not found.', 404),
    ]);

    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    $this->postJson("/api/v1/researches/{$research->id}/literature/import-doi", ['doi' => '10.9999/x'])
        ->assertStatus(422);

    expect($research->literatureEntries()->count())->toBe(0);
});

it('rejects a duplicate doi on the same research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Ada',
        'doi' => '10.1/abc',
    ]);

    $this->postJson("/api/v1/researches/{$research->id}/literature/import-doi", ['doi' => '10.1/ABC'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('doi');

    Http::assertNothingSent();
});

it('blocks cross-user access to literature entries and values', function () {
    $owner = User::factory()->create();
    $other = User::factory()->create();
    $research = Research::factory()->for($owner)->create();
    $entry = LiteratureEntry::create(['research_id' => $research->id, 'title' => 'Rahasia']);
    $fieldId = $research->synthesisFields()->first()->id;

    Sanctum::actingAs($other);

    $this->getJson("/api/v1/researches/{$research->id}/literature")->assertNotFound();
    $this->patchJson("/api/v1/literature/{$entry->id}", ['title' => 'Bajak'])->assertForbidden();
    $this->deleteJson("/api/v1/literature/{$entry->id}")->assertForbidden();
    $this->putJson("/api/v1/literature/{$entry->id}/values", [
        'values' => [['synthesis_field_id' => $fieldId, 'value' => 'x']],
    ])->assertForbidden();
});

it('bulk upserts matrix values and clears them when empty', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $entry = LiteratureEntry::create(['research_id' => $research->id, 'title' => 'Studi']);
    $fields = $research->synthesisFields;

    $this->putJson("/api/v1/literature/{$entry->id}/values", [
        'values' => [
            ['synthesis_field_id' => $fields[0]->id, 'value' => 'Kuantitatif'],
            ['synthesis_field_id' => $fields[1]->id, 'value' => 'Kepuasan'],
        ],
    ])->assertOk()->assertJsonCount(2, 'data.values');

    $this->putJson("/api/v1/literature/{$entry->id}/values", [
        'values' => [['synthesis_field_id' => $fields[0]->id, 'value' => '']],
    ])->assertOk()->assertJsonCount(1, 'data.values');
});

it('rejects a synthesis field from another research', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $otherResearch = Research::factory()->for($user)->create();
    $entry = LiteratureEntry::create(['research_id' => $research->id, 'title' => 'Studi']);

    $this->putJson("/api/v1/literature/{$entry->id}/values", [
        'values' => [['synthesis_field_id' => $otherResearch->synthesisFields()->first()->id, 'value' => 'x']],
    ])->assertStatus(422);
});

it('generates citation, bibliography, and bibtex export', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Judul Sitasi',
        'authors' => [['family' => 'Susmiatin', 'given' => 'Eko Arik']],
        'year' => 2025,
        'container' => 'Jurnal Mandira',
        'doi' => '10.1/xyz',
        'status' => 'included',
    ]);
    LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Dikecualikan',
        'status' => 'excluded',
        'exclusion_reason' => 'Tidak relevan',
    ]);

    $response = $this->getJson("/api/v1/researches/{$research->id}/literature/bibliography");
    $response->assertOk()->assertJsonPath('data.count', 1);
    expect($response->json('data.text'))->toContain('Susmiatin');

    $bibtex = $this->get("/api/v1/researches/{$research->id}/literature/export?format=bibtex");
    $bibtex->assertOk();
    expect($bibtex->getContent())->toContain('@article{')->not->toContain('Dikecualikan');
});

it('exposes the default citation style on research and respects the style query', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();
    $entry = LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Studi',
        'authors' => [['family' => 'Moleong', 'given' => 'Lexy']],
        'year' => 2019,
    ]);

    $this->getJson("/api/v1/researches/{$research->id}/literature/{$entry->id}/citation")
        ->assertOk()
        ->assertJsonPath('data.style', 'apa7');

    $this->getJson("/api/v1/researches/{$research->id}/literature/{$entry->id}/citation?style=ieee")
        ->assertOk()
        ->assertJsonPath('data.in_text', '[1]');
});

it('numbers ieee citations to match the bibliography order', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    // Urutan dimasukkan: Zebra, Alpha, Mango. IEEE mengikuti urutan ini,
    // bukan alfabetis, dan nomornya harus sama dengan daftar pustaka.
    $titles = ['Zebra', 'Alpha', 'Mango'];
    $ids = [];
    foreach ($titles as $index => $title) {
        $ids[$title] = LiteratureEntry::create([
            'research_id' => $research->id,
            'title' => $title,
            'authors' => [['family' => $title, 'given' => 'A']],
            'year' => 2020 + $index,
            'status' => 'included',
        ])->id;
    }

    LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Dikecualikan',
        'authors' => [['family' => 'Buang', 'given' => 'B']],
        'year' => 2019,
        'status' => 'excluded',
        'exclusion_reason' => 'Tidak relevan',
    ]);

    $bibliography = $this->getJson("/api/v1/researches/{$research->id}/literature/bibliography?style=ieee")
        ->assertOk()
        ->json('data');

    expect(array_column($bibliography['items'], 'number'))->toBe([1, 2, 3]);
    expect(array_column($bibliography['items'], 'id'))->toBe([
        $ids['Zebra'], $ids['Alpha'], $ids['Mango'],
    ]);
    expect($bibliography['text'])->toStartWith('[1] Zebra');

    foreach (['Zebra' => 1, 'Alpha' => 2, 'Mango' => 3] as $title => $number) {
        $this->getJson("/api/v1/researches/{$research->id}/literature/{$ids[$title]}/citation?style=ieee")
            ->assertOk()
            ->assertJsonPath('data.number', $number)
            ->assertJsonPath('data.included', true)
            ->assertJsonPath('data.in_text', "[{$number}]");
    }

    // Gaya lain nggak pakai nomor: nomornya harus null dan sitasinya penulis-tahun.
    $apa = $this->getJson("/api/v1/researches/{$research->id}/literature/{$ids['Alpha']}/citation?style=apa7")
        ->assertOk()
        ->json('data');
    expect($apa['number'])->toBeNull();
    expect($apa['in_text'])->toBe('(Alpha, 2021)');

    // Sumber yang belum "Termasuk" tetap dapat nomor perkiraan, tapi ditandai
    // belum masuk daftar pustaka biar UI bisa memperingatkan.
    $candidate = LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => 'Masih Kandidat',
        'authors' => [['family' => 'Kandidat', 'given' => 'K']],
        'year' => 2024,
    ]);

    $this->getJson("/api/v1/researches/{$research->id}/literature/{$candidate->id}/citation?style=ieee")
        ->assertOk()
        ->assertJsonPath('data.included', false)
        ->assertJsonPath('data.number', 4);
});

it('escapes html from third-party metadata in bibliography output', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);
    $research = Research::factory()->for($user)->create();

    LiteratureEntry::create([
        'research_id' => $research->id,
        'title' => '<script>alert(1)</script> Judul Jahat',
        'authors' => [['family' => '<img src=x onerror=alert(1)>', 'given' => 'A']],
        'year' => 2025,
        'container' => '<b>Jurnal</b>',
        'status' => 'included',
    ]);

    $item = $this->getJson("/api/v1/researches/{$research->id}/literature/bibliography")
        ->assertOk()
        ->json('data.items.0.reference');

    expect($item)
        ->toContain('&lt;script&gt;')
        ->not->toContain('<script')
        ->not->toContain('<img')
        ->toContain('*&lt;b&gt;Jurnal&lt;/b&gt;*');
});
