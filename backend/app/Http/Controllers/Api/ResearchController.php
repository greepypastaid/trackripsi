<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ResearchRequest;
use App\Http\Resources\ResearchResource;
use App\Models\Chapter;
use App\Models\Research;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    /** Track record: gabungan event dari data existing, tanpa tabel activity_log. */
    public function timeline(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        $limit = min(max((int) $request->query('limit', '30'), 1), 100);
        $events = collect();

        $chapters = $research->chapters()
            ->with(['tasks' => fn ($q) => $q->where('is_completed', true)])
            ->get();

        foreach ($chapters as $chapter) {
            foreach ($chapter->tasks as $task) {
                $events->push([
                    'type' => 'task_completed',
                    'title' => $task->title,
                    'chapter' => $chapter->title,
                    'occurred_at' => $task->updated_at->toIso8601String(),
                ]);
            }
        }

        foreach ($research->documents()->with('chapter')->limit($limit)->latest()->get() as $draft) {
            $events->push([
                'type' => 'draft_uploaded',
                'title' => $draft->file_name,
                'chapter' => $draft->chapter->title,
                'occurred_at' => $draft->created_at->toIso8601String(),
            ]);
        }

        $logs = $research->supervisionLogs()
            ->limit($limit)
            ->get();
        foreach ($logs as $log) {
            $events->push([
                'type' => 'supervision_logged',
                'title' => Str::limit($log->feedback_notes, 80),
                'chapter' => null,
                'occurred_at' => $log->meeting_date->toIso8601String(),
            ]);
        }

        foreach ($research->appointments()->where('status', 'done')->limit($limit)->get() as $appointment) {
            $events->push([
                'type' => 'appointment_done',
                'title' => 'Sesi bimbingan selesai',
                'chapter' => null,
                'occurred_at' => $appointment->scheduled_at->toIso8601String(),
            ]);
        }

        $timeline = $events->sortByDesc('occurred_at')->values()->take($limit)->all();

        return response()->json(['data' => $timeline]);
    }

    /** Rekap lengkap riset untuk diunduh (Markdown atau JSON mentah). */
    public function export(Request $request, Research $research): Response|JsonResponse
    {
        $this->authorize('view', $research);

        if ($request->query('format') === 'json') {
            $research->load([
                'chapters.tasks',
                'chapters.drafts',
                'supervisionLogs.actionItems',
                'supervisionLogs.chapters',
                'literatureEntries',
            ]);

            $filename = 'rekap-riset-'.$research->id.'.json';

            return response()->json(['data' => $research])
                ->header('Content-Disposition', 'attachment; filename="'.$filename.'"');
        }

        $research->load([
            'chapters.tasks',
            'chapters.drafts' => fn ($q) => $q->orderBy('created_at'),
            'supervisionLogs.actionItems',
            'supervisionLogs.chapters',
        ]);

        $lines = [
            '# Rekap: '.$research->title,
            '',
            '- Bidang: '.($research->faculty_field ?? '-'),
            '- Pembimbing: '.($research->supervisor_name ?? '-'),
            '- Target selesai: '.($research->target_completion_date?->toDateString() ?? '-'),
            '- Progres: '.$research->progressPercent().'%',
            '- Status: '.$research->status,
            '',
        ];

        foreach ($research->chapters as $chapter) {
            $lines[] = '## '.$chapter->title.' ('.$chapter->status.', '.$chapter->progress_percent.'%)';
            $lines[] = '';

            $lines[] = '### Tugas';
            if ($chapter->tasks->isEmpty()) {
                $lines[] = '- (belum ada)';
            }
            foreach ($chapter->tasks as $task) {
                $check = $task->is_completed ? 'x' : ' ';
                $due = $task->due_date ? ' (tenggat '.$task->due_date->toDateString().')' : '';
                $lines[] = '- ['.$check.'] '.$task->title.$due;
            }
            $lines[] = '';

            $lines[] = '### Draf';
            if ($chapter->drafts->isEmpty()) {
                $lines[] = '- (belum ada)';
            }
            foreach ($chapter->drafts as $draft) {
                $lines[] = '- '.$draft->version_label.' — '.$draft->file_name.' ('
                    .$draft->created_at->toDateString().')';
            }
            $lines[] = '';
        }

        $lines[] = '## Log Bimbingan';
        $lines[] = '';
        if ($research->supervisionLogs->isEmpty()) {
            $lines[] = '- (belum ada)';
        }
        foreach ($research->supervisionLogs->sortBy('meeting_date')->values() as $index => $log) {
            $lines[] = '### Sesi '.($index + 1).' — '.$log->meeting_date->toDateString();
            $lines[] = '';
            $chapters = $log->chapters->pluck('title')->implode(', ');
            if ($chapters !== '') {
                $lines[] = 'Bab: '.$chapters;
            }
            $lines[] = $log->feedback_notes;
            foreach ($log->actionItems as $item) {
                $check = $item->is_resolved ? 'x' : ' ';
                $lines[] = '- ['.$check.'] '.$item->description;
            }
            $lines[] = '';
        }

        $slug = Str::slug($research->title) ?: 'riset-'.$research->id;
        $markdown = implode("\n", $lines);

        return response($markdown, 200, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="rekap-'.$slug.'.md"',
        ]);
    }
}
