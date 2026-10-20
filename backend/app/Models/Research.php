<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Research extends Model
{
    use HasFactory;

    protected $table = 'researches';

    public const CHAPTER_TEMPLATE = [
        'Bab 1: Pendahuluan',
        'Bab 2: Tinjauan Pustaka',
        'Bab 3: Metodologi Penelitian',
        'Bab 4: Hasil dan Pembahasan',
        'Bab 5: Penutup',
    ];

    protected $fillable = [
        'title',
        'faculty_field',
        'supervisor_name',
        'target_completion_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'target_completion_date' => 'date:Y-m-d',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function chapters(): HasMany
    {
        return $this->hasMany(Chapter::class)->orderBy('order');
    }

    public function supervisionLogs(): HasMany
    {
        return $this->hasMany(SupervisionLog::class)->latest('meeting_date');
    }

    public function documents(): HasManyThrough
    {
        return $this->hasManyThrough(DocumentDraft::class, Chapter::class);
    }

    public function progressPercent(): int
    {
        return (int) round((float) $this->chapters->avg('progress_percent'));
    }
}
