<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah status "ditunda" dan "tidak aktif" di samping active/completed/archived
 * yang sudah ada, supaya mahasiswa bisa parkir riset tanpa mengarsipkannya.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('researches', function (Blueprint $table) {
            $table->enum('status', ['active', 'paused', 'inactive', 'completed', 'archived'])
                ->default('active')
                ->change();
        });
    }

    public function down(): void
    {
        // Baris dengan status baru harus diselamatkan dulu, kalau tidak
        // rollback gagal karena nilai enum-nya nggak dikenal.
        DB::table('researches')->whereIn('status', ['paused', 'inactive'])->update(['status' => 'archived']);

        Schema::table('researches', function (Blueprint $table) {
            $table->enum('status', ['active', 'completed', 'archived'])
                ->default('active')
                ->change();
        });
    }
};
