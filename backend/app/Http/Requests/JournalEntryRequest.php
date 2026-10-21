<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class JournalEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'entry_date' => ['required', 'date'],
            'mood' => ['required', 'in:produktif,biasa,struggle'],
            'body' => ['required', 'string', 'max:5000'],
        ];
    }
}
