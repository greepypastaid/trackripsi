<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FocusSession;
use App\Models\JournalEntry;
use App\Models\Research;
use App\Models\SupervisionAppointment;
use App\Models\SupervisionLog;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class CalendarController extends Controller
{
    /** Agenda bulanan: gabungan semua event bertanggal milik satu riset. */
    public function show(Request $request, Research $research): JsonResponse
    {
        $this->authorize('view', $research);

        try {
            $month = $request->filled('month')
                ? Carbon::createFromFormat('Y-m', $request->query('month') ?? '')
                : Carbon::now();
        } catch (\Throwable) {
            return response()->json(['message' => 'Format month harus YYYY-MM.'], 422);
        }

        $start = $month->copy()->startOfMonth()->startOfDay();
        $end = $month->copy()->endOfMonth()->endOfDay();

        $days = [];

        $tasks = $research->chapters()
            ->with(['tasks' => fn ($q) => $q
                ->whereNotNull('due_date')
                ->whereBetween('due_date', [$start->toDateString(), $end->toDateString()]),
            ])
            ->get()
            ->flatMap(fn ($chapter) => $chapter->tasks->map(fn (Task $task) => [
                'date' => $task->due_date->toDateString(),
                'id' => $task->id,
                'title' => $task->title,
                'chapter' => $chapter->title,
                'is_completed' => $task->is_completed,
            ]));
        foreach ($tasks as $task) {
            $days[$task['date']]['tasks'][] = $task;
        }

        $appointments = $research->appointments()
            ->whereBetween('scheduled_at', [$start, $end])
            ->get(['id', 'scheduled_at', 'status']);
        foreach ($appointments as $appointment) {
            /** @var SupervisionAppointment $appointment */
            $days[$appointment->scheduled_at->toDateString()]['appointments'][] = [
                'id' => $appointment->id,
                'scheduled_at' => $appointment->scheduled_at->toIso8601String(),
                'status' => $appointment->status,
            ];
        }

        $logs = $research->supervisionLogs()
            ->whereBetween('meeting_date', [$start->toDateString(), $end->toDateString()])
            ->get(['id', 'meeting_date', 'feedback_notes']);
        foreach ($logs as $log) {
            /** @var SupervisionLog $log */
            $days[$log->meeting_date->toDateString()]['supervision'][] = [
                'id' => $log->id,
                'title' => Str::limit($log->feedback_notes, 60),
            ];
        }

        $journals = $research->journalEntries()
            ->whereBetween('entry_date', [$start->toDateString(), $end->toDateString()])
            ->get(['id', 'entry_date', 'mood']);
        foreach ($journals as $entry) {
            /** @var JournalEntry $entry */
            $days[$entry->entry_date->toDateString()]['journal'][] = ['id' => $entry->id, 'mood' => $entry->mood];
        }

        $focus = FocusSession::where('research_id', $research->id)
            ->whereBetween('started_at', [$start, $end])
            ->get(['started_at', 'duration_minutes']);
        foreach ($focus as $session) {
            $date = $session->started_at->toDateString();
            $days[$date]['focus_minutes'] = ($days[$date]['focus_minutes'] ?? 0) + $session->duration_minutes;
        }

        ksort($days);

        return response()->json(['data' => $days]);
    }
}
