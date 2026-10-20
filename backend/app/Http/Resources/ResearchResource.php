<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ResearchResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'faculty_field' => $this->faculty_field,
            'supervisor_name' => $this->supervisor_name,
            'target_completion_date' => $this->target_completion_date?->toDateString(),
            'status' => $this->status,
            'citation_style' => $this->citation_style,
            'min_supervision_sessions' => $this->min_supervision_sessions,
            'readiness_checklist' => $this->readiness_checklist ?? [],
            'progress_percent' => $this->whenLoaded('chapters', fn () => $this->progressPercent()),
            'chapters' => ChapterResource::collection($this->whenLoaded('chapters')),
            'supervision_logs' => SupervisionLogResource::collection($this->whenLoaded('supervisionLogs')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
