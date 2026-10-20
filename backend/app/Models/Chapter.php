<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Chapter extends Model
{
    use HasFactory;

    protected $fillable = ['title', 'order', 'status'];

    protected function casts(): array
    {
        return ['order' => 'integer'];
    }

    public function research(): BelongsTo
    {
        return $this->belongsTo(Research::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->orderBy('is_completed')->orderBy('id');
    }

    public function drafts(): HasMany
    {
        return $this->hasMany(DocumentDraft::class)->latest();
    }

    public function supervisionLogs(): HasMany
    {
        return $this->hasMany(SupervisionLog::class);
    }
}
