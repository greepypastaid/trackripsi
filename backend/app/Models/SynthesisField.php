<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SynthesisField extends Model
{
    public const DEFAULTS = ['Metode', 'Variabel/Fokus', 'Temuan', 'Limitasi', 'Gap'];

    protected $fillable = ['research_id', 'label', 'order'];

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }
}
