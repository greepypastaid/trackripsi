<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupervisionAppointment extends Model
{
    protected $fillable = ['research_id', 'scheduled_at', 'agenda', 'log_id', 'status'];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'agenda' => 'array',
        ];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function log(): BelongsTo
    {
        return $this->belongsTo(SupervisionLog::class, 'log_id');
    }
}
