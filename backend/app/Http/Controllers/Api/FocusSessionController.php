<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\FocusSessionRequest;
use App\Models\FocusSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FocusSessionController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $sessions = $research->focusSessions()->limit(50)->get();

        $weekStart = now()->startOfWeek();
        $target = $research->daily_target_minutes;

        // Menit fokus per hari 30 hari terakhir untuk streak.
        $perDay = $research->focusSessions()
            ->where('started_at', '>=', now()->subDays(30)->startOfDay())
            ->get()
            ->groupBy(fn (FocusSession $s) => $s->started_at->toDateString())
            ->map(fn ($day) => (int) $day->sum('duration_minutes'));

        $streak = 0;
        if ($target !== null && $target > 0) {
            // Anchor streak: hari ini; kalau hari ini belum capai target, mulai dari kemarin.
            $cursor = ($perDay[$today = now()->toDateString()] ?? 0) >= $target
                ? now()
                : (($perDay[now()->subDay()->toDateString()] ?? 0) >= $target ? now()->subDay() : null);
            while ($cursor !== null && ($perDay[$cursor->toDateString()] ?? 0) >= $target) {
                $streak++;
                $cursor = $cursor->subDay();
            }
        }

        return response()->json(['data' => [
            'sessions' => $sessions->map(fn (FocusSession $s) => [
                'id' => $s->id,
                'started_at' => $s->started_at->toIso8601String(),
                'ended_at' => $s->ended_at->toIso8601String(),
                'duration_minutes' => $s->duration_minutes,
                'note' => $s->note,
            ])->all(),
            'total_minutes' => (int) $sessions->sum('duration_minutes'),
            'week_minutes' => (int) $sessions
                ->where('started_at', '>=', $weekStart)
                ->sum('duration_minutes'),
            'today_minutes' => $perDay[now()->toDateString()] ?? 0,
            'daily_target_minutes' => $target,
            'streak_days' => $streak,
        ]]);
    }

    public function store(FocusSessionRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $validated = $request->validated();
        $validated['user_id'] = $request->user()->id;
        $minutes = (int) round(
            (strtotime($validated['ended_at']) - strtotime($validated['started_at'])) / 60,
        );
        $validated['duration_minutes'] = max(1, $minutes);

        $session = $research->focusSessions()->create($validated);

        return response()->json(['data' => $session], 201);
    }

    public function destroy(Request $request, int $sessionId): JsonResponse
    {
        $session = FocusSession::whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($sessionId);
        $session->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
