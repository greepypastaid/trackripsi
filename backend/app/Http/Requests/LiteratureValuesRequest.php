<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LiteratureValuesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'values' => ['present', 'array', 'max:50'],
            'values.*.synthesis_field_id' => ['required', 'integer'],
            'values.*.value' => ['nullable', 'string', 'max:5000'],
        ];
    }

    public function messages(): array
    {
        return [
            'values.present' => 'Daftar nilai matriks wajib dikirim.',
            'values.*.synthesis_field_id.required' => 'ID kolom sintesis wajib diisi.',
        ];
    }
}
