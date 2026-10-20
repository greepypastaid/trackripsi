<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class DocumentDraft extends Model
{
    use HasFactory;

    protected $fillable = ['version_label', 'file_path', 'file_name', 'mime_type', 'file_size_bytes'];

    protected function casts(): array
    {
        return ['file_size_bytes' => 'integer'];
    }

    public function chapter(): BelongsTo
    {
        return $this->belongsTo(Chapter::class);
    }

    protected static function booted(): void
    {
        static::deleting(fn (DocumentDraft $draft) => Storage::disk('local')->delete($draft->file_path));
    }
}
