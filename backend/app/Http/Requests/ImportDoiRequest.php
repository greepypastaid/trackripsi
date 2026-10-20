<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ImportDoiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doi' => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return ['doi.required' => 'DOI wajib diisi.'];
    }
}
