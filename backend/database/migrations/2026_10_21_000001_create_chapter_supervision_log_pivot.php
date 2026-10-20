<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chapter_supervision_log', function (Blueprint $table) {
            $table->id();
            $table->foreignId('chapter_id')->constrained()->cascadeOnDelete();
            $table->foreignId('supervision_log_id')->constrained()->cascadeOnDelete();
            $table->unique(['chapter_id', 'supervision_log_id']);
        });

        // Pindahkan relasi lama (satu bab per log) ke pivot.
        DB::table('chapter_supervision_log')->insertUsing(
            ['chapter_id', 'supervision_log_id'],
            DB::table('supervision_logs')->whereNotNull('chapter_id')->select('chapter_id', 'id')
        );

        Schema::table('supervision_logs', function (Blueprint $table) {
            $table->dropForeign(['chapter_id']);
            $table->dropColumn('chapter_id');
        });
    }

    public function down(): void
    {
        Schema::table('supervision_logs', function (Blueprint $table) {
            $table->foreignId('chapter_id')->nullable()->constrained()->nullOnDelete();
        });

        DB::table('supervision_logs')
            ->whereIn('id', DB::table('chapter_supervision_log')->select('supervision_log_id'))
            ->update([
                'chapter_id' => DB::raw('(select chapter_id from chapter_supervision_log where supervision_log_id = supervision_logs.id limit 1)'),
            ]);

        Schema::dropIfExists('chapter_supervision_log');
    }
};
