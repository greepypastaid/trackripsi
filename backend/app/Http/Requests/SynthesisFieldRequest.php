<?php

namespace App\Http\Requests;

use App\Models\SynthesisField;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SynthesisFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'label' => [$required, 'string', 'max:100', Rule::unique(SynthesisField::class)->where(
                'research_id', $this->route('research')->id ?? null
            )],
            'order' => ['sometimes', 'integer', 'min:1', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'label.required' => 'Nama kolom sintesis wajib diisi.',
            'label.unique' => 'Kolom sintesis dengan nama itu sudah ada.',
        ];
    }
}
