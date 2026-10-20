<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResearchRequest;
use App\Http\Resources\ResearchResource;
use App\Models\Chapter;
use App\Models\Research;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $researches = $request->user()->researches()
            ->with('chapters')
            ->latest()
            ->get();

        return response()->json(['data' => ResearchResource::collection($researches)]);
    }

    public function store(ResearchRequest $request): JsonResponse
    {
        $research = DB::transaction(function () use ($request) {
            $research = $request->user()->researches()->create($request->validated());

            foreach (Research::CHAPTER_TEMPLATE as $index => $title) {
                $research->chapters()->create([
                    'title' => $title,
                    'order' => $index + 1,
                ]);
            }

            return $research;
        });

        return response()->json(
            ['data' => new ResearchResource($research->load('chapters.tasks'))],
            201
        );
    }

    public function show(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        return response()->json([
            'data' => new ResearchResource(
                $research->load(['chapters.tasks', 'chapters.drafts', 'supervisionLogs.actionItems'])
            ),
        ]);
    }

    public function update(ResearchRequest $request, Research $research): JsonResponse
    {
        $this->authorize('update', $research);

        $research->update($request->validated());

        return response()->json(['data' => new ResearchResource($research->load('chapters'))]);
    }

    public function destroy(Research $research): JsonResponse
    {
        $this->authorize('delete', $research);

        DB::transaction(fn () => $research->delete());

        return response()->json(['message' => 'Riset dihapus.']);
    }

    /**
     * Aggregated metrics used by the dashboard.
     */
    public function summary(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        $research->load('chapters.tasks');
        $chapters = $research->chapters;

        return response()->json(['data' => [
            'progress_percent' => $research->progressPercent(),
            'chapters_total' => $chapters->count(),
            'chapters_completed' => $chapters->where('status', 'completed')->count(),
            'tasks_total' => $chapters->sum(fn (Chapter $c) => $c->tasks->count()),
            'tasks_pending' => $chapters->sum(fn (Chapter $c) => $c->tasks->where('is_completed', false)->count()),
            'tasks_overdue' => $chapters->sum(
                fn (Chapter $c) => $c->tasks
                    ->where('is_completed', false)
                    ->filter(fn ($t) => $t->due_date?->isPast())
                    ->count()
            ),
        ]]);
    }
}
