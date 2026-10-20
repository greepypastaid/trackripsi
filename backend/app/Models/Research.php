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
        'citation_style',
        'min_supervision_sessions',
        'readiness_checklist',
    ];

    protected function casts(): array
    {
        return [
            'target_completion_date' => 'date:Y-m-d',
            'min_supervision_sessions' => 'integer',
            'readiness_checklist' => 'array',
        ];
    }

    /**
     * Setiap riset baru mendapat kolom matriks sintesis default.
     */
    protected static function booted(): void
    {
        static::created(function (self $research) {
            foreach (SynthesisField::DEFAULTS as $index => $label) {
                $research->synthesisFields()->firstOrCreate(
                    ['label' => $label],
                    ['order' => $index + 1]
                );
            }
        });
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
        return $this->hasMany(SupervisionLog::class)->with('chapters')->latest('meeting_date');
    }

    public function documents(): HasManyThrough
    {
        return $this->hasManyThrough(DocumentDraft::class, Chapter::class);
    }

    public function literatureEntries(): HasMany
    {
        return $this->hasMany(LiteratureEntry::class);
    }

    public function synthesisFields(): HasMany
    {
        return $this->hasMany(SynthesisField::class)->orderBy('order');
    }

    public function appointments(): HasMany
    {
        return $this->hasMany(SupervisionAppointment::class)->orderBy('scheduled_at');
    }

    public function defenseAnswers(): HasMany
    {
        return $this->hasMany(DefenseAnswer::class);
    }

    public function progressPercent(): int
    {
        return (int) round((float) $this->chapters->avg('progress_percent'));
    }
}
