<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupervisionLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'research_id' => $this->research_id,
            'chapter_ids' => $this->whenLoaded('chapters', fn () => $this->chapters->pluck('id')),
            'chapters' => $this->whenLoaded('chapters', fn () => $this->chapters->pluck('title')),
            'meeting_date' => $this->meeting_date?->toDateString(),
            'feedback_notes' => $this->feedback_notes,
            'action_items' => ActionItemResource::collection($this->whenLoaded('actionItems')),
        ];
    }
}
