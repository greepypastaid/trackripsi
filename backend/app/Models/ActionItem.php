<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActionItem extends Model
{
    use HasFactory;

    protected $fillable = ['description', 'is_resolved'];

    protected function casts(): array
    {
        return ['is_resolved' => 'boolean'];
    }

    public function supervisionLog(): BelongsTo
    {
        return $this->belongsTo(SupervisionLog::class);
    }

    public function log(): BelongsTo
    {
        return $this->supervisionLog();
    }
}
