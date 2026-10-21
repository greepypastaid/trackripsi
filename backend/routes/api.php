<?php

use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\CitationController;
use App\Http\Controllers\Api\FocusSessionController;
use App\Http\Controllers\Api\GoogleAuthController;
use App\Http\Controllers\Api\JournalEntryController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\DefenseQuestionController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\LiteratureController;
use App\Http\Controllers\Api\LogbookController;
use App\Http\Controllers\Api\ReadinessController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\SupervisionLogController;
use App\Http\Controllers\Api\SynthesisFieldController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    try {
        DB::select('select 1');

        return response()->json(['status' => 'ok', 'database' => 'ok']);
    } catch (Throwable) {
        return response()->json(['status' => 'error', 'database' => 'down'], 503);
    }
});

Route::post('/auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('throttle:20,1');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('throttle:30,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::apiResource('researches', ResearchController::class);
    Route::get('/researches/{research}/summary', [ResearchController::class, 'summary']);
    Route::get('/researches/{research}/timeline', [ResearchController::class, 'timeline']);
    Route::get('/researches/{research}/export', [ResearchController::class, 'export']);

    Route::get('/researches/{research}/focus-sessions', [FocusSessionController::class, 'index']);
    Route::post('/researches/{research}/focus-sessions', [FocusSessionController::class, 'store']);
    Route::delete('/focus-sessions/{session}', [FocusSessionController::class, 'destroy']);

    Route::get('/researches/{research}/journal', [JournalEntryController::class, 'index']);
    Route::post('/researches/{research}/journal', [JournalEntryController::class, 'store']);
    Route::patch('/journal/{entry}', [JournalEntryController::class, 'update']);
    Route::delete('/journal/{entry}', [JournalEntryController::class, 'destroy']);

    Route::post('/researches/{research}/chapters', [ChapterController::class, 'store']);
    Route::patch('/chapters/{chapter}', [ChapterController::class, 'update']);
    Route::delete('/chapters/{chapter}', [ChapterController::class, 'destroy']);

    Route::post('/chapters/{chapter}/tasks', [TaskController::class, 'store']);
    Route::post('/chapters/{chapter}/drafts', [FileController::class, 'store']);
    Route::patch('/tasks/{task}', [TaskController::class, 'update']);
    Route::patch('/tasks/{task}/toggle', [TaskController::class, 'toggle']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

    Route::get('/researches/{research}/logs', [SupervisionLogController::class, 'index']);
    Route::post('/researches/{research}/logs', [SupervisionLogController::class, 'store']);
    Route::patch('/logs/{log}', [SupervisionLogController::class, 'update']);
    Route::delete('/logs/{log}', [SupervisionLogController::class, 'destroy']);
    Route::post('/logs/{log}/convert-action-items', [SupervisionLogController::class, 'convertActionItems']);

    Route::get('/documents/{draft}/download', [FileController::class, 'download'])->name('documents.download');
    Route::delete('/documents/{draft}', [FileController::class, 'destroy']);

    // F1/F2 — Matriks literatur, kolom sintesis, sitasi.
    Route::get('/researches/{research}/literature', [LiteratureController::class, 'index']);
    Route::post('/researches/{research}/literature', [LiteratureController::class, 'store']);
    Route::post('/researches/{research}/literature/import-doi', [LiteratureController::class, 'importDoi'])
        ->middleware('throttle:20,1');
    Route::get('/researches/{research}/literature/bibliography', [CitationController::class, 'bibliography']);
    Route::get('/researches/{research}/literature/export', [CitationController::class, 'bibtex']);
    Route::get('/researches/{research}/literature/{entry}/citation', [CitationController::class, 'citation']);
    Route::patch('/literature/{entry}', [LiteratureController::class, 'update']);
    Route::delete('/literature/{entry}', [LiteratureController::class, 'destroy']);
    Route::put('/literature/{entry}/values', [LiteratureController::class, 'storeValues']);

    Route::get('/researches/{research}/synthesis-fields', [SynthesisFieldController::class, 'index']);
    Route::post('/researches/{research}/synthesis-fields', [SynthesisFieldController::class, 'store']);
    Route::patch('/synthesis-fields/{field}', [SynthesisFieldController::class, 'update']);
    Route::delete('/synthesis-fields/{field}', [SynthesisFieldController::class, 'destroy']);

    // F3 — Jadwal bimbingan.
    Route::get('/researches/{research}/appointments', [AppointmentController::class, 'index']);
    Route::post('/researches/{research}/appointments', [AppointmentController::class, 'store']);
    Route::get('/researches/{research}/appointments/suggested-agenda', [AppointmentController::class, 'suggestedAgenda']);
    Route::post('/researches/{research}/appointments/{appointment}/complete', [AppointmentController::class, 'complete']);
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    // F4 — Kesiapan sidang.
    Route::get('/researches/{research}/readiness', [ReadinessController::class, 'show']);
    Route::put('/researches/{research}/readiness/checklist', [ReadinessController::class, 'updateChecklist']);

    // F5 — Lembar logbook untuk dicetak.
    Route::get('/search', [SearchController::class, 'search']);
    Route::get('/researches/{research}/logbook', [LogbookController::class, 'show']);
    Route::get('/researches/{research}/calendar', [CalendarController::class, 'show']);

    // F6 — Bank pertanyaan sidang.
    Route::get('/researches/{research}/defense-questions', [DefenseQuestionController::class, 'index']);
    Route::put('/researches/{research}/defense-questions/{question}/answer', [DefenseQuestionController::class, 'saveAnswer']);
});
