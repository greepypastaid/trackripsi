<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DefenseQuestion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DefenseQuestionController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $answers = $research->defenseAnswers()->get()->keyBy('defense_question_id');

        $data = DefenseQuestion::orderBy('chapter_order')->orderBy('id')->get()->map(function (DefenseQuestion $question) use ($answers) {
            $answer = $answers->get($question->id);

            return [
                'id' => $question->id,
                'chapter_order' => $question->chapter_order,
                'category' => $question->category,
                'text' => $question->text,
                'answer' => $answer?->answer,
                'is_ready' => (bool) ($answer?->is_ready ?? false),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Upsert satu jawaban. Body: answer, is_ready.
     */
    public function saveAnswer(Request $request, int $researchId, DefenseQuestion $question): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $validated = $request->validate([
            'answer' => ['nullable', 'string', 'max:20000'],
            'is_ready' => ['sometimes', 'boolean'],
        ], ['answer.max' => 'Jawaban terlalu panjang.']);

        $answer = $research->defenseAnswers()->updateOrCreate(
            ['defense_question_id' => $question->id],
            [
                'answer' => $validated['answer'] ?? null,
                'is_ready' => $validated['is_ready'] ?? false,
            ]
        );

        return response()->json(['data' => [
            'defense_question_id' => $question->id,
            'answer' => $answer->answer,
            'is_ready' => (bool) $answer->is_ready,
        ]]);
    }
}
