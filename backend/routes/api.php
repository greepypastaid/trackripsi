<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChapterController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\ResearchController;
use App\Http\Controllers\Api\SupervisionLogController;
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

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::apiResource('researches', ResearchController::class);
    Route::get('/researches/{research}/summary', [ResearchController::class, 'summary']);

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
});
