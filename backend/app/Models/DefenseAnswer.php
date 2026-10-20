<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DefenseAnswer extends Model
{
    protected $fillable = ['research_id', 'defense_question_id', 'answer', 'is_ready'];

    protected function casts(): array
    {
        return ['is_ready' => 'boolean'];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function question(): BelongsTo
    {
        return $this->belongsTo(DefenseQuestion::class, 'defense_question_id');
    }
}
