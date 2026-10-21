<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\JournalEntryRequest;
use App\Models\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class JournalEntryController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $entries = $research->journalEntries()
            ->when($request->filled('month'), fn ($q) => $q->whereBetween('entry_date', [
                $request->date('month')->startOfMonth()->toDateString(),
                $request->date('month')->endOfMonth()->toDateString(),
            ]))
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return response()->json(['data' => $entries->map(fn (JournalEntry $e) => [
            'id' => $e->id,
            'entry_date' => $e->entry_date->toDateString(),
            'mood' => $e->mood,
            'body' => $e->body,
        ])->all()]);
    }

    public function store(JournalEntryRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $entry = $research->journalEntries()->create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json(['data' => $entry], 201);
    }

    public function update(JournalEntryRequest $request, int $entryId): JsonResponse
    {
        $entry = JournalEntry::whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($entryId);
        $entry->update($request->validated());

        return response()->json(['data' => $entry->fresh()]);
    }

    public function destroy(Request $request, int $entryId): JsonResponse
    {
        $entry = JournalEntry::whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($entryId);
        $entry->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
