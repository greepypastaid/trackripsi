<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supervision_appointments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->dateTime('scheduled_at');
            $table->json('agenda')->nullable();
            $table->foreignId('log_id')->nullable()->constrained('supervision_logs')->nullOnDelete();
            $table->enum('status', ['planned', 'done', 'cancelled'])->default('planned');
            $table->timestamps();

            $table->index(['research_id', 'scheduled_at']);
        });

        Schema::create('defense_questions', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('chapter_order')->nullable();
            $table->enum('category', ['motivasi', 'kebaruan', 'metode', 'sampling', 'teori', 'hasil']);
            $table->string('text', 500);
            $table->timestamps();
        });

        Schema::create('defense_answers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->foreignId('defense_question_id')->constrained('defense_questions')->cascadeOnDelete();
            $table->text('answer')->nullable();
            $table->boolean('is_ready')->default(false);
            $table->timestamps();

            $table->unique(['research_id', 'defense_question_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('defense_answers');
        Schema::dropIfExists('defense_questions');
        Schema::dropIfExists('supervision_appointments');
    }
};
