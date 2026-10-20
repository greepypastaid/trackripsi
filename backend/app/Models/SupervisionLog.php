<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupervisionLog extends Model
{
    use HasFactory;

    protected $fillable = ['chapter_id', 'meeting_date', 'feedback_notes'];

    protected function casts(): array
    {
        return ['meeting_date' => 'date:Y-m-d'];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    public function actionItems(): HasMany
    {
        return $this->hasMany(ActionItem::class);
    }
}
