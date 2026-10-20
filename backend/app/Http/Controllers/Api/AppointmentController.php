<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AppointmentRequest;
use App\Http\Requests\SupervisionLogRequest;
use App\Http\Resources\SupervisionAppointmentResource;
use App\Http\Resources\SupervisionLogResource;
use App\Models\ActionItem;
use App\Models\Chapter;
use App\Models\SupervisionAppointment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AppointmentController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $appointments = $research->appointments()->get();

        $next = $appointments
            ->where('status', 'planned')
            ->filter(fn (SupervisionAppointment $item) => $item->scheduled_at->greaterThanOrEqualTo(now()->startOfDay()))
            ->sortBy('scheduled_at')
            ->first();

        return response()->json([
            'data' => SupervisionAppointmentResource::collection($appointments),
            'meta' => [
                'next' => $next ? (new SupervisionAppointmentResource($next))->resolve() : null,
            ],
        ]);
    }

    public function store(AppointmentRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $appointment = $research->appointments()->create([
            'scheduled_at' => $request->validated('scheduled_at'),
            'agenda' => array_values(array_filter($request->validated('agenda') ?? [])),
            'status' => 'planned',
        ]);

        return response()->json(['data' => new SupervisionAppointmentResource($appointment)], 201);
    }

    public function update(AppointmentRequest $request, SupervisionAppointment $appointment): JsonResponse
    {
        $this->assertOwned($request, $appointment);

        $appointment->update($request->validated());

        return response()->json(['data' => new SupervisionAppointmentResource($appointment)]);
    }

    public function destroy(Request $request, SupervisionAppointment $appointment): JsonResponse
    {
        $this->assertOwned($request, $appointment);

        $appointment->delete();

        return response()->json(['message' => 'Jadwal bimbingan dihapus.']);
    }

    /**
     * Selesaikan jadwal: buat tepat satu supervision_logs, lalu tandai appointment done.
     */
    public function complete(
        SupervisionLogRequest $request,
        int $researchId,
        SupervisionAppointment $appointment
    ): JsonResponse {
        $research = $request->user()->researches()->findOrFail($researchId);
        abort_unless($appointment->research_id === $research->id, 403, 'Akses tidak diizinkan.');
        abort_if($appointment->status === 'done', 422, 'Jadwal bimbingan ini sudah diselesaikan.');

        $validated = $request->validated();

        if (! empty($validated['chapter_id'])) {
            abort_unless(
                Chapter::where('id', $validated['chapter_id'])->where('research_id', $research->id)->exists(),
                422,
                'Bab tidak termasuk dalam riset ini.'
            );
        }

        $log = DB::transaction(function () use ($research, $appointment, $validated) {
            $log = $research->supervisionLogs()->create([
                'chapter_id' => $validated['chapter_id'] ?? null,
                'meeting_date' => $validated['meeting_date'],
                'feedback_notes' => $validated['feedback_notes'],
            ]);

            foreach ($validated['action_items'] ?? [] as $description) {
                $log->actionItems()->create(['description' => $description]);
            }

            $appointment->update(['status' => 'done', 'log_id' => $log->id]);

            return $log;
        });

        return response()->json([
            'data' => new SupervisionLogResource($log->load('actionItems')),
            'appointment' => new SupervisionAppointmentResource($appointment),
        ], 201);
    }

    /**
     * Saran agenda tanpa AI: poin revisi terbuka, tugas terlambat, bab berstatus revisi.
     */
    public function suggestedAgenda(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $research->load('chapters.tasks');

        $openActionItems = ActionItem::query()
            ->where('is_resolved', false)
            ->whereHas('log', fn ($query) => $query->where('research_id', $research->id))
            ->latest()
            ->limit(10)
            ->pluck('description');

        $overdueTasks = $research->chapters
            ->flatMap(fn (Chapter $chapter) => $chapter->tasks
                ->where('is_completed', false)
                ->filter(fn ($task) => $task->due_date?->isPast())
                ->map(fn ($task) => "Selesaikan tugas terlambat: {$task->title} ({$chapter->title})"))
            ->values();

        $revisionChapters = $research->chapters
            ->where('status', 'revision')
            ->map(fn (Chapter $chapter) => "Bahas revisi {$chapter->title}");

        return response()->json(['data' => array_values(array_unique(array_merge(
            $openActionItems->all(),
            $overdueTasks->all(),
            $revisionChapters->all()
        )))]);
    }

    private function assertOwned(Request $request, SupervisionAppointment $appointment): void
    {
        abort_unless(
            $appointment->research()->where('user_id', $request->user()->id)->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
