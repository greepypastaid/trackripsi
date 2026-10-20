<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DocumentUploadRequest;
use App\Http\Resources\DocumentDraftResource;
use App\Models\Chapter;
use App\Models\DocumentDraft;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
{
    public function store(DocumentUploadRequest $request, int $chapterId): JsonResponse
    {
        $chapter = Chapter::whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($chapterId);

        $file = $request->file('file');
        $path = $file->store("drafts/{$request->user()->id}/{$chapter->id}", 'local');

        $draft = $chapter->drafts()->create([
            'version_label' => $request->validated('version_label') ?? $this->nextVersion($chapter),
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size_bytes' => $file->getSize(),
        ]);

        // PRD §8: cap drafts per chapter at 5 to protect disk capacity.
        $chapter->drafts()->latest('id')->skip(5)->take(PHP_INT_MAX)->get()->each->delete();

        return response()->json(['data' => new DocumentDraftResource($draft)], 201);
    }

    public function download(Request $request, DocumentDraft $draft)
    {
        abort_unless(
            $draft->chapter()->whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))->exists(),
            403,
            'Akses tidak diizinkan.'
        );

        abort_unless(Storage::disk('local')->exists($draft->file_path), 404, 'Berkas tidak ditemukan.');

        return Storage::disk('local')->download($draft->file_path, $draft->file_name);
    }

    public function destroy(Request $request, DocumentDraft $draft): JsonResponse
    {
        abort_unless(
            $draft->chapter()->whereHas('research', fn ($q) => $q->where('user_id', $request->user()->id))->exists(),
            403,
            'Akses tidak diizinkan.'
        );

        $draft->delete();

        return response()->json(['message' => 'Draf dihapus.']);
    }

    private function nextVersion(Chapter $chapter): string
    {
        return 'v'.($chapter->drafts()->count() + 1).'.0';
    }
}
