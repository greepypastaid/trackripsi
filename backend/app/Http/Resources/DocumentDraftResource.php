<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentDraftResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chapter_id' => $this->chapter_id,
            'version_label' => $this->version_label,
            'file_name' => $this->file_name,
            'mime_type' => $this->mime_type,
            'file_size_bytes' => (int) $this->file_size_bytes,
            'created_at' => $this->created_at?->toIso8601String(),
            'download_url' => route('documents.download', $this->id, false),
        ];
    }
}
