<?php

namespace Database\Seeders;

use App\Models\Research;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::firstOrCreate(
            ['email' => 'demo@skripsi.test'],
            ['name' => 'Mahasiswa Demo', 'password' => 'password123'],
        );

        if ($user->researches()->exists()) {
            return;
        }

        $research = $user->researches()->create([
            'title' => 'Sistem Rekomendasi Topik Skripsi Berbasis Content-Based Filtering',
            'faculty_field' => 'Teknik Informatika',
            'supervisor_name' => 'Dosen Pembimbing',
            'target_completion_date' => now()->addMonths(5)->toDateString(),
        ]);

        foreach (Research::CHAPTER_TEMPLATE as $i => $title) {
            $chapter = $research->chapters()->create(['title' => $title, 'order' => $i + 1]);
            $chapter->tasks()->create(['title' => 'Kumpulkan referensi '.$title]);

            if ($i === 0) {
                $chapter->tasks()->create(['title' => 'Revisi rumusan masalah', 'is_completed' => true]);
                $chapter->update(['status' => 'in_progress']);
            }
        }

        $log = $research->supervisionLogs()->create([
            'meeting_date' => now()->subWeek()->toDateString(),
            'feedback_notes' => 'Perbaiki rumusan masalah dan tambah referensi 5 tahun terakhir.',
        ]);

        // Bab terkait sekarang lewat tabel pivot, bukan kolom chapter_id.
        $log->chapters()->attach($research->chapters()->first()->id);

        $log->actionItems()->createMany([
            ['description' => 'Tulis ulang latar belakang'],
            ['description' => 'Tambah 3 jurnal SINTA 2'],
        ]);
    }
}
