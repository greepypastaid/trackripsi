<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('focus_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->dateTime('started_at');
            $table->dateTime('ended_at');
            $table->unsignedSmallInteger('duration_minutes');
            $table->string('note', 500)->nullable();
            $table->timestamps();
            $table->index(['research_id', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('focus_sessions');
    }
};
