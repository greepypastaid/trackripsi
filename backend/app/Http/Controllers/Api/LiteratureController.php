<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportDoiRequest;
use App\Http\Requests\LiteratureEntryRequest;
use App\Http\Requests\LiteratureValuesRequest;
use App\Http\Resources\LiteratureEntryResource;
use App\Models\LiteratureEntry;
use App\Services\LiteratureMetadata;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;

class LiteratureController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $query = $research->literatureEntries()->with('values');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($q = trim((string) $request->query('q'))) {
            $query->where(function ($builder) use ($q) {
                $builder->where('title', 'like', "%{$q}%")
                    ->orWhere('container', 'like', "%{$q}%")
                    ->orWhere('doi', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => LiteratureEntryResource::collection($query->latest('id')->get()),
        ]);
    }

    public function store(LiteratureEntryRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $entry = $research->literatureEntries()->create($request->validated());

        return response()->json(['data' => new LiteratureEntryResource($entry)], 201);
    }

    public function update(LiteratureEntryRequest $request, LiteratureEntry $entry): JsonResponse
    {
        $this->assertOwned($request, $entry);

        $entry->update($request->validated());

        return response()->json(['data' => new LiteratureEntryResource($entry->load('values'))]);
    }

    public function destroy(Request $request, LiteratureEntry $entry): JsonResponse
    {
        $this->assertOwned($request, $entry);

        $entry->delete();

        return response()->json(['message' => 'Sumber literatur dihapus.']);
    }

    /**
     * Ambil metadata dari OpenAlex, fallback Crossref. Tidak menyimpan data parsial.
     */
    public function importDoi(ImportDoiRequest $request, int $researchId, LiteratureMetadata $metadata): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);
        $doi = LiteratureMetadata::normalizeDoi($request->validated('doi'));

        if ($doi === '') {
            return response()->json(['message' => 'DOI tidak valid.'], 422);
        }

        if ($research->literatureEntries()->where('doi', $doi)->exists()) {
            return response()->json([
                'message' => 'Sumber dengan DOI ini sudah ada pada riset ini.',
                'errors' => ['doi' => ['DOI duplikat pada riset ini.']],
            ], 422);
        }

        $data = $metadata->fetchByDoi($doi);

        if ($data === null) {
            return response()->json([
                'message' => 'DOI tidak ditemukan di OpenAlex maupun Crossref.',
                'errors' => ['doi' => ['Metadata tidak ditemukan.']],
            ], 422);
        }

        $entry = $research->literatureEntries()->create(Arr::only($data, [
            'title', 'authors', 'year', 'container', 'volume', 'issue', 'pages',
            'doi', 'url', 'abstract', 'type', 'metadata_source',
        ]));

        return response()->json(['data' => new LiteratureEntryResource($entry)], 201);
    }

    public function storeValues(LiteratureValuesRequest $request, LiteratureEntry $entry): JsonResponse
    {
        $this->assertOwned($request, $entry);

        $payload = $request->validated();
        $fieldIds = $entry->research->synthesisFields()->pluck('id');
        $sent = collect($payload['values']);

        if ($sent->pluck('synthesis_field_id')->diff($fieldIds)->isNotEmpty()) {
            return response()->json([
                'message' => 'Data yang diberikan tidak valid.',
                'errors' => ['values' => ['Ada kolom sintesis yang bukan milik riset ini.']],
            ], 422);
        }

        foreach ($sent as $item) {
            $value = trim((string) ($item['value'] ?? ''));

            if ($value === '') {
                $entry->values()->where('synthesis_field_id', $item['synthesis_field_id'])->delete();

                continue;
            }

            $entry->values()->updateOrCreate(
                ['synthesis_field_id' => $item['synthesis_field_id']],
                ['value' => $value]
            );
        }

        return response()->json(['data' => new LiteratureEntryResource($entry->load('values'))]);
    }

    private function assertOwned(Request $request, LiteratureEntry $entry): void
    {
        abort_unless(
            $entry->research()->where('user_id', $request->user()->id)->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
