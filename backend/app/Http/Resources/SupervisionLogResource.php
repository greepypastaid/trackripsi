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
            'chapter_id' => $this->chapter_id,
            'meeting_date' => $this->meeting_date?->toDateString(),
            'feedback_notes' => $this->feedback_notes,
            'action_items' => ActionItemResource::collection($this->whenLoaded('actionItems')),
        ];
    }
}
