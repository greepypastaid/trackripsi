<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('literature_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->string('title', 500);
            $table->json('authors')->nullable();
            $table->smallInteger('year')->nullable();
            $table->string('container')->nullable();
            $table->string('volume', 50)->nullable();
            $table->string('issue', 50)->nullable();
            $table->string('pages', 50)->nullable();
            $table->string('doi', 255)->nullable();
            $table->text('url')->nullable();
            $table->text('abstract')->nullable();
            $table->enum('type', ['journal', 'book', 'thesis', 'web', 'other'])->default('journal');
            $table->enum('status', ['candidate', 'included', 'excluded'])->default('candidate');
            $table->string('exclusion_reason')->nullable();
            $table->text('notes')->nullable();
            $table->enum('metadata_source', ['manual', 'openalex', 'crossref'])->default('manual');
            $table->timestamps();

            $table->index(['research_id', 'status']);
            $table->unique(['research_id', 'doi']);
        });

        Schema::create('synthesis_fields', function (Blueprint $table) {
            $table->id();
            $table->foreignId('research_id')->constrained('researches')->cascadeOnDelete();
            $table->string('label', 100);
            $table->unsignedInteger('order')->default(1);
            $table->timestamps();

            $table->unique(['research_id', 'label']);
        });

        Schema::create('literature_entry_values', function (Blueprint $table) {
            $table->id();
            $table->foreignId('literature_entry_id')->constrained('literature_entries')->cascadeOnDelete();
            $table->foreignId('synthesis_field_id')->constrained('synthesis_fields')->cascadeOnDelete();
            $table->text('value');
            $table->timestamps();

            $table->unique(['literature_entry_id', 'synthesis_field_id'], 'entry_field_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('literature_entry_values');
        Schema::dropIfExists('synthesis_fields');
        Schema::dropIfExists('literature_entries');
    }
};
