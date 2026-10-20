<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupervisionLog extends Model
{
    use HasFactory;

    protected $fillable = ['meeting_date', 'feedback_notes'];

    protected function casts(): array
    {
        return ['meeting_date' => 'date:Y-m-d'];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    /** Satu sesi bimbingan bisa membahas lebih dari satu bab. */
    public function chapters(): BelongsToMany
    {
        return $this->belongsToMany(Chapter::class, 'chapter_supervision_log');
    }

    public function actionItems(): HasMany
    {
        return $this->hasMany(ActionItem::class);
    }
}
