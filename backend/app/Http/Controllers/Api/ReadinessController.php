<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LiteratureEntry;
use App\Models\SupervisionAppointment;
use App\Models\SupervisionLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Kalkulasi runtime (tanpa tabel baru) sesuai brief F4.
 */
class ReadinessController extends Controller
{
    public function show(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $research->load(['chapters.drafts', 'supervisionLogs.actionItems']);

        $blockers = [];
        $completedChapters = $research->chapters->where('status', 'completed')->count();
        $chapterCount = $research->chapters->count();

        if ($chapterCount === 0 || $completedChapters < $chapterCount) {
            $blockers[] = [
                'key' => 'chapters',
                'label' => 'Semua bab selesai',
                'detail' => "{$completedChapters} dari {$chapterCount} bab berstatus selesai.",
            ];
        }

        $logCount = $research->supervisionLogs()->count();
        $minSessions = $research->min_supervision_sessions ?: 12;

        if ($logCount < $minSessions) {
            $blockers[] = [
                'key' => 'supervision',
                'label' => "Minimal {$minSessions} sesi bimbingan",
                'detail' => "Baru {$logCount} sesi tercatat.",
            ];
        }

        $chaptersWithoutDraft = $research->chapters->filter(fn ($chapter) => $chapter->drafts->isEmpty());

        if ($chaptersWithoutDraft->isNotEmpty()) {
            $blockers[] = [
                'key' => 'drafts',
                'label' => 'Setiap bab punya draf berkas',
                'detail' => $chaptersWithoutDraft->pluck('title')->implode(', ').' belum punya draf.',
            ];
        }

        $openActionItems = $research->supervisionLogs
            ->flatMap(fn (SupervisionLog $log) => $log->actionItems)
            ->where('is_resolved', false)
            ->count();

        // Cek ini hanya bisa dianggap terpenuhi jika sudah ada sesi bimbingan
        // yang mendokumentasikan bahwa tidak ada poin revisi tersisa.
        if ($logCount === 0) {
            $blockers[] = [
                'key' => 'action_items',
                'label' => 'Poin revisi diverifikasi lewat bimbingan',
                'detail' => 'Belum ada sesi bimbingan tercatat, jadi belum bisa dipastikan bebas poin revisi.',
            ];
        } elseif ($openActionItems > 0) {
            $blockers[] = [
                'key' => 'action_items',
                'label' => 'Tidak ada poin revisi terbuka',
                'detail' => "{$openActionItems} poin revisi belum diselesaikan.",
            ];
        }

        $included = $research->literatureEntries()->where('status', 'included')->count();

        if ($included < 10) {
            $blockers[] = [
                'key' => 'bibliography',
                'label' => 'Daftar pustaka memadai',
                'detail' => "{$included} sumber berstatus termasuk (disarankan ≥ 10).",
            ];
        }

        $checklist = $research->readiness_checklist ?? [];
        foreach ($checklist as $index => $item) {
            if (! ($item['done'] ?? false)) {
                $blockers[] = [
                    'key' => "checklist.{$index}",
                    'label' => $item['label'] ?? 'Checklist kampus',
                    'detail' => 'Belum ditandai selesai.',
                ];
            }
        }

        $targetDate = $research->target_completion_date;

        // Belum mengatur target juga berarti prasyarat waktu belum terpenuhi,
        // jangan biarkan cek ini lolos secara kosong dan menggelembungkan skor.
        if (! $targetDate) {
            $blockers[] = [
                'key' => 'deadline',
                'label' => 'Target waktu',
                'detail' => 'Belum mengatur tanggal target selesai riset.',
            ];
        } elseif ($targetDate->isPast()) {
            $blockers[] = [
                'key' => 'deadline',
                'label' => 'Target waktu',
                'detail' => 'Target selesai sudah lewat.',
            ];
        }

        // 6 cek inti + setiap butir checklist kampus dihitung sebagai satu cek.
        $totalChecks = 6 + count($checklist);
        $passed = max(0, $totalChecks - count($blockers));
        $score = (int) round(($passed / max(1, $totalChecks)) * 100);

        return response()->json(['data' => [
            'score' => $score,
            'blockers' => $blockers,
            'stats' => [
                'chapters_completed' => $completedChapters,
                'chapters_total' => $chapterCount,
                'supervision_logs' => $logCount,
                'min_supervision_sessions' => $minSessions,
                'literature_included' => $included,
                'open_action_items' => $openActionItems,
                'upcoming_appointments' => SupervisionAppointment::where('research_id', $research->id)
                    ->where('status', 'planned')
                    ->where('scheduled_at', '>=', now())
                    ->count(),
                'literature_total' => LiteratureEntry::where('research_id', $research->id)->count(),
            ],
        ]]);
    }

    public function updateChecklist(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $validated = $request->validate([
            'checklist' => ['present', 'array', 'max:30'],
            'checklist.*.label' => ['required', 'string', 'max:150'],
            'checklist.*.done' => ['required', 'boolean'],
        ], [
            'checklist.present' => 'Daftar checklist wajib dikirim.',
            'checklist.*.label.required' => 'Label checklist wajib diisi.',
        ]);

        $research->update(['readiness_checklist' => $validated['checklist']]);

        return $this->show($request, $researchId);
    }
}
