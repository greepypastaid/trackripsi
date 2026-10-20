<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('researches', function (Blueprint $table) {
            $table->enum('citation_style', ['apa7', 'ieee', 'harvard', 'chicago_author_date'])
                ->default('apa7')
                ->after('status');
            $table->unsignedSmallInteger('min_supervision_sessions')->default(12)->after('citation_style');
            $table->json('readiness_checklist')->nullable()->after('min_supervision_sessions');
        });
    }

    public function down(): void
    {
        Schema::table('researches', function (Blueprint $table) {
            $table->dropColumn(['citation_style', 'min_supervision_sessions', 'readiness_checklist']);
        });
    }
};
