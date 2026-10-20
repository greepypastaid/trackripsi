<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChapterResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'research_id' => $this->research_id,
            'title' => $this->title,
            'order' => (int) $this->order,
            'status' => $this->status,
            'progress_percent' => (int) $this->progress_percent,
            'tasks' => TaskResource::collection($this->whenLoaded('tasks')),
            'drafts' => DocumentDraftResource::collection($this->whenLoaded('drafts')),
        ];
    }
}
