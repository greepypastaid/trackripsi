<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\SynthesisFieldRequest;
use App\Http\Resources\SynthesisFieldResource;
use App\Models\SynthesisField;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SynthesisFieldController extends Controller
{
    public function index(Request $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        return response()->json([
            'data' => SynthesisFieldResource::collection($research->synthesisFields()->get()),
        ]);
    }

    public function store(SynthesisFieldRequest $request, int $researchId): JsonResponse
    {
        $research = $request->user()->researches()->findOrFail($researchId);

        $field = $research->synthesisFields()->create([
            'label' => $request->validated('label'),
            'order' => $request->validated('order') ?? ($research->synthesisFields()->max('order') + 1),
        ]);

        return response()->json(['data' => new SynthesisFieldResource($field)], 201);
    }

    public function update(SynthesisFieldRequest $request, SynthesisField $field): JsonResponse
    {
        $this->assertOwned($request, $field);

        $field->update($request->validated());

        return response()->json(['data' => new SynthesisFieldResource($field)]);
    }

    public function destroy(Request $request, SynthesisField $field): JsonResponse
    {
        $this->assertOwned($request, $field);

        $field->delete();

        return response()->json(['message' => 'Kolom sintesis dihapus.']);
    }

    private function assertOwned(Request $request, SynthesisField $field): void
    {
        abort_unless(
            $field->research()->where('user_id', $request->user()->id)->exists(),
            403,
            'Akses tidak diizinkan.'
        );
    }
}
