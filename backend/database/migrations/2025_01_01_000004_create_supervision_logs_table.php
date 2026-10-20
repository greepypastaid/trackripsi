<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervision_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('chapter_id')->nullable()->constrained()->nullOnDelete();
            $table->date('meeting_date');
            $table->text('feedback_notes');
            $table->timestamps();
            $table->index(['research_id', 'meeting_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervision_logs');
    }
};
