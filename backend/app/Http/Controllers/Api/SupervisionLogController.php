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

        $chapterIds = $this->assertChaptersOwned($research->id, $validated['chapter_ids'] ?? []);

        $log = DB::transaction(function () use ($research, $validated, $chapterIds) {
            $log = $research->supervisionLogs()->create([
                'meeting_date' => $validated['meeting_date'],
                'feedback_notes' => $validated['feedback_notes'],
            ]);
            $log->chapters()->sync($chapterIds);

            foreach ($validated['action_items'] ?? [] as $description) {
                $log->actionItems()->create(['description' => $description]);
            }

            return $log;
        });

        return response()->json(
            ['data' => new SupervisionLogResource($log->load(['actionItems', 'chapters']))],
            201
        );
    }

    public function update(SupervisionLogRequest $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);
        $validated = $request->validated();
        $chapterIds = $this->assertChaptersOwned($log->research_id, $validated['chapter_ids'] ?? []);

        $log->update(collect($validated)->except(['action_items', 'chapter_ids'])->all());
        $log->chapters()->sync($chapterIds);

        return response()->json(
            ['data' => new SupervisionLogResource($log->load(['actionItems', 'chapters']))]
        );
    }

    public function destroy(Request $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);

        $log->delete();

        return response()->json(['message' => 'Log bimbingan dihapus.']);
    }

    /**
     * Convert log action items into checklist tasks (FR-05).
     * ponytail: tugas dibuat di bab pertama yang terkait; upgrade = pilih bab per poin revisi.
     */
    public function convertActionItems(Request $request, SupervisionLog $log): JsonResponse
    {
        $this->authorizeLog($request, $log);

        $chapter = $log->chapters()->first();
        abort_if($chapter === null, 422, 'Log ini tidak terhubung ke bab.');

        $created = DB::transaction(function () use ($log, $chapter) {
            foreach ($log->actionItems()->where('is_resolved', false)->get() as $item) {
                $chapter->tasks()->create(['title' => $item->description]);
                $item->update(['is_resolved' => true]);
            }

            return $chapter->tasks()->count();
        });

        return response()->json(['message' => 'Poin revisi dikonversi ke checklist.', 'task_count' => $created]);
    }

    /** Semua bab wajib milik riset ini; kembalikan id yang sudah tervalidasi. */
    private function assertChaptersOwned(int $researchId, array $chapterIds): array
    {
        $ids = array_values(array_unique(array_map('intval', $chapterIds)));

        $owned = Chapter::where('research_id', $researchId)->whereIn('id', $ids)->pluck('id');

        abort_if(
            $owned->count() !== count($ids),
            422,
            'Bab tidak termasuk dalam riset ini.'
        );

        return $ids;
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
