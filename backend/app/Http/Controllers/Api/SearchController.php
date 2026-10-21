<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentDraft;
use App\Models\JournalEntry;
use App\Models\SupervisionLog;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class SearchController extends Controller
{
    /** Pencarian lintas entitas milik user yang sedang aktif. */
    public function search(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'min:2', 'max:100']]);

        $user = $request->user();
        $q = '%'.str_replace(['%', '_'], ['\%', '\_'], $request->query('q')).'%';
        $results = collect();

        $taskRows = Task::whereHas('chapter.research', fn ($r) => $r->where('user_id', $user->id))
            ->where('title', 'like', $q)
            ->limit(10)
            ->with('chapter.research')
            ->get();
        foreach ($taskRows as $task) {
            $results->push([
                'type' => 'task',
                'id' => $task->id,
                'title' => $task->title,
                'research_id' => $task->chapter->research_id,
                'research_title' => $task->chapter->research->title,
            ]);
        }

        $draftRows = DocumentDraft::whereHas('chapter.research', fn ($r) => $r->where('user_id', $user->id))
            ->where('file_name', 'like', $q)
            ->limit(10)
            ->with('chapter.research')
            ->get();
        foreach ($draftRows as $draft) {
            $results->push([
                'type' => 'draft',
                'id' => $draft->id,
                'title' => $draft->file_name,
                'research_id' => $draft->chapter->research_id,
                'research_title' => $draft->chapter->research->title,
            ]);
        }

        $logRows = SupervisionLog::whereHas('research', fn ($r) => $r->where('user_id', $user->id))
            ->where('feedback_notes', 'like', $q)
            ->limit(10)
            ->with('research')
            ->get();
        foreach ($logRows as $log) {
            $results->push([
                'type' => 'supervision_log',
                'id' => $log->id,
                'title' => Str::limit($log->feedback_notes, 80),
                'research_id' => $log->research_id,
                'research_title' => $log->research->title,
            ]);
        }

        $journalRows = JournalEntry::where('user_id', $user->id)
            ->where('body', 'like', $q)
            ->limit(10)
            ->with('research')
            ->get();
        foreach ($journalRows as $entry) {
            $results->push([
                'type' => 'journal',
                'id' => $entry->id,
                'title' => Str::limit($entry->body, 80),
                'research_id' => $entry->research_id,
                'research_title' => $entry->research->title,
            ]);
        }

        return response()->json(['data' => $results->take(30)->values()->all()]);
    }
}
