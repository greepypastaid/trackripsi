<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DefenseQuestion extends Model
{
    public const CATEGORIES = ['motivasi', 'kebaruan', 'metode', 'sampling', 'teori', 'hasil'];

    protected $fillable = ['chapter_order', 'category', 'text'];

    protected function casts(): array
    {
        return ['chapter_order' => 'integer'];
    }
}
