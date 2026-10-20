<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LiteratureEntryValue extends Model
{
    protected $fillable = ['literature_entry_id', 'synthesis_field_id', 'value'];

    public function entry(): BelongsTo
    {
        return $this->belongsTo(LiteratureEntry::class, 'literature_entry_id');
    }

    public function field(): BelongsTo
    {
        return $this->belongsTo(SynthesisField::class, 'synthesis_field_id');
    }
}
