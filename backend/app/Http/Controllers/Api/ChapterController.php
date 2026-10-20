<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChapterRequest;
use App\Http\Resources\ChapterResource;
use App\Models\Chapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChapterController extends Controller
{
    public function store(ChapterRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $chapter = $research->chapters()->create([
            'title' => $request->validated('title'),
            'order' => $request->validated('order') ?? ($research->chapters()->max('order') + 1),
        ]);

        return response()->json(['data' => new ChapterResource($chapter->load('tasks'))], 201);
    }

    public function update(ChapterRequest $request, Chapter $chapter): JsonResponse
    {
        $this->authorizeChapter($request, $chapter);

        $chapter->update($request->validated());

        return response()->json(['data' => new ChapterResource($chapter->load('tasks'))]);
    }

    public function destroy(Request $request, Chapter $chapter): JsonResponse
    {
        $this->authorizeChapter($request, $chapter);

        $chapter->delete();

        return response()->json(['message' => 'Bab dihapus.']);
    }

    private function authorizeChapter(Request $request, Chapter $chapter): void
    {
        abort_unless(
            $chapter->research()->where('user_id', $request->user()->id)->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
