<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LiteratureEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'research_id' => $this->research_id,
            'title' => $this->title,
            'authors' => $this->authors ?? [],
            'year' => $this->year,
            'container' => $this->container,
            'volume' => $this->volume,
            'issue' => $this->issue,
            'pages' => $this->pages,
            'doi' => $this->doi,
            'url' => $this->url,
            'abstract' => $this->abstract,
            'type' => $this->type,
            'status' => $this->status,
            'exclusion_reason' => $this->exclusion_reason,
            'notes' => $this->notes,
            'metadata_source' => $this->metadata_source,
            'values' => $this->whenLoaded('values', fn () => $this->values->map(fn ($value) => [
                'synthesis_field_id' => $value->synthesis_field_id,
                'value' => $value->value,
            ])->all()),
        ];
    }
}
