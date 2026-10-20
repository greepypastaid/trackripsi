<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupervisionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Data untuk halaman cetak logbook (F5). Rendering print dilakukan di frontend.
 */
class LogbookController extends Controller
{
    public function show(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $logs = $research->supervisionLogs()
            ->with(['actionItems', 'chapters'])
            ->reorder()
            ->orderBy('meeting_date')
            ->orderBy('id')
            ->get();

        return response()->json(['data' => [
            'research' => [
                'id' => $research->id,
                'title' => $research->title,
                'faculty_field' => $research->faculty_field,
                'supervisor_name' => $research->supervisor_name,
                'min_supervision_sessions' => $research->min_supervision_sessions,
            ],
            'sessions' => $logs->values()->map(fn (SupervisionLog $log, int $index) => [
                'number' => $index + 1,
                'meeting_date' => $log->meeting_date?->toDateString(),
                'chapters' => $log->chapters->pluck('title')->all(),
                'feedback_notes' => $log->feedback_notes,
                'action_items' => $log->actionItems->pluck('description')->all(),
            ])->all(),
            'total' => $logs->count(),
        ]]);
    }
}
