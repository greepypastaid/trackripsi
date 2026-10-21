<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class FocusSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return [
            'started_at' => ['required', 'date'],
            'ended_at' => ['required', 'date', 'after:started_at'],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
