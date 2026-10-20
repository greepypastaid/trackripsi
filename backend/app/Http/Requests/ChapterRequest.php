<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ChapterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:255'],
            'order' => ['nullable', 'integer', 'min:1', 'max:255'],
            'status' => ['sometimes', Rule::in(['not_started', 'in_progress', 'revision', 'completed'])],
        ];
    }
}
