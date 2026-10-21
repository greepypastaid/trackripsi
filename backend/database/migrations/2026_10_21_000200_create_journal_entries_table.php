<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->date('entry_date');
            $table->enum('mood', ['produktif', 'biasa', 'struggle'])->default('biasa');
            $table->text('body');
            $table->timestamps();
            $table->index(['research_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('journal_entries');
    }
};
