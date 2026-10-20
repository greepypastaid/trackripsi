<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SupervisionLogRequest;
use App\Http\Resources\SupervisionLogResource;
use App\Models\Chapter;
use App\Models\SupervisionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupervisionLogController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        return response()->json([
            'data' => SupervisionLogResource::collection(
                $research->supervisionLogs()->with('actionItems')->get()
            ),
        ]);
    }

    public function store(SupervisionLogRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);
        $validated = $request->validated();

        $this->assertChapterOwned($research->id, $validated['chapter_id'] ?? null);

        $log = DB::transaction(function () use ($research, $validated) {
            $log = $research->supervisionLogs()->create([
                'chapter_id' => $validated['chapter_id'] ?? null,
                'meeting_date' => $validated['meeting_date'],
                'feedback_notes' => $validated['feedback_notes'],
            ]);

            foreach ($validated['action_items'] ?? [] as $description) {
                $log->actionItems()->create(['description' => $description]);
            }

            return $log;
        });

        return response()->json(
            ['data' => new SupervisionLogResource($log->load('actionItems'))],
            201
        );
    }

    public function update(SupervisionLogRequest $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);
        $validated = $request->validated();
        $this->assertChapterOwned($log->research_id, $validated['chapter_id'] ?? null);

        $log->update(collect($validated)->except('action_items')->all());

        return response()->json(['data' => new SupervisionLogResource($log->load('actionItems'))]);
    }

    public function destroy(Request $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);

        $log->delete();

        return response()->json(['message' => 'Log bimbingan dihapus.']);
    }

    /**
     * Convert log action items into checklist tasks of the linked chapter (FR-05).
     */
    public function convertActionItems(Request $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);

        abort_if($log->chapter_id === null, 422, 'Log ini tidak terhubung ke bab.');

        $chapter = Chapter::findOrFail($log->chapter_id);
        $created = DB::transaction(function () use ($log, $chapter) {
            foreach ($log->actionItems()->where('is_resolved', false)->get() as $item) {
                $chapter->tasks()->create(['title' => $item->description]);
                $item->update(['is_resolved' => true]);
            }

            return $chapter->tasks()->count();
        });

        return response()->json(['message' => 'Poin revisi dikonversi ke checklist.', 'task_count' => $created]);
    }

    private function assertChapterOwned(int $researchId, ?int $chapterId): void
    {
        if ($chapterId === null) {
            return;
        }

        abort_unless(
            Chapter::where('id', $chapterId)->where('research_id', $researchId)->exists(),
            422,
            'Bab tidak termasuk dalam riset ini.'
        );
    }

    private function authorizeLog(Request $request, SupervisionLog $log): void
    {
        abort_unless(
            $log->research()->where('user_id', $request->user()->id)->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
