<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SupervisionLogRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'meeting_date' => [$required, 'date'],
            'chapter_id' => ['nullable', 'integer', 'exists:chapters,id'],
            'feedback_notes' => [$required, 'string', 'max:20000'],
            'action_items' => ['nullable', 'array'],
            'action_items.*' => ['string', 'max:255'],
        ];
    }
}
