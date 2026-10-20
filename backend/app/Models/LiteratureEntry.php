<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LiteratureEntry extends Model
{
    use HasFactory;

    public const TYPES = ['journal', 'book', 'thesis', 'web', 'other'];

    public const STATUSES = ['candidate', 'included', 'excluded'];

    protected $fillable = [
        'research_id',
        'title',
        'authors',
        'year',
        'container',
        'volume',
        'issue',
        'pages',
        'doi',
        'url',
        'abstract',
        'type',
        'status',
        'exclusion_reason',
        'notes',
        'metadata_source',
    ];

    protected function casts(): array
    {
        return [
            'authors' => 'array',
            'year' => 'integer',
        ];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function values(): HasMany
    {
        return $this->hasMany(LiteratureEntryValue::class);
    }

    public function synthesisFields(): BelongsToMany
    {
        return $this->belongsToMany(SynthesisField::class, 'literature_entry_values')
            ->withPivot('value')
            ->withTimestamps();
    }
}
