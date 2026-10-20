<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaskRequest;
use App\Http\Resources\TaskResource;
use App\Models\Chapter;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function store(TaskRequest $request, int $chapterId): JsonResponse
    {
        $chapter = $this->ownedChapter($request, $chapterId);

        $task = $chapter->tasks()->create($request->validated());

        return response()->json(['data' => new TaskResource($task)], 201);
    }

    public function update(TaskRequest $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        $task->update($request->validated());

        return response()->json(['data' => new TaskResource($task)]);
    }

    public function toggle(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        $task->update(['is_completed' => ! $task->is_completed]);

        return response()->json(['data' => new TaskResource($task)]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        $task->delete();

        return response()->json(['message' => 'Tugas dihapus.']);
    }

    private function ownedChapter(Request $request, int $chapterId): Chapter
    {
        return Chapter::whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($chapterId);
    }

    private function authorizeTask(Request $request, Task $task): void
    {
        abort_unless(
            $task->chapter()->whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
