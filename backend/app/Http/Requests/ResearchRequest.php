<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ResearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'title' => [$required, 'string', 'max:500'],
            'faculty_field' => ['nullable', 'string', 'max:255'],
            'supervisor_name' => ['nullable', 'string', 'max:255'],
            'target_completion_date' => ['nullable', 'date'],
            'status' => ['sometimes', Rule::in(['active', 'completed', 'archived'])],
            'daily_target_minutes' => ['nullable', 'integer', 'min:5', 'max:1440'],
        ];
    }
}
