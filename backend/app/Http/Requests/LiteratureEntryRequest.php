<?php

namespace App\Http\Requests;

use App\Models\LiteratureEntry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LiteratureEntryRequest extends FormRequest
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
            'authors' => ['nullable', 'array', 'max:100'],
            'authors.*.family' => ['required_with:authors', 'string', 'max:200'],
            'authors.*.given' => ['nullable', 'string', 'max:200'],
            'year' => ['nullable', 'integer', 'min:1000', 'max:2100'],
            'container' => ['nullable', 'string', 'max:255'],
            'volume' => ['nullable', 'string', 'max:50'],
            'issue' => ['nullable', 'string', 'max:50'],
            'pages' => ['nullable', 'string', 'max:50'],
            'doi' => ['nullable', 'string', 'max:255'],
            'url' => ['nullable', 'string', 'max:2000'],
            'abstract' => ['nullable', 'string', 'max:20000'],
            'type' => ['sometimes', Rule::in(LiteratureEntry::TYPES)],
            'status' => ['sometimes', Rule::in(LiteratureEntry::STATUSES)],
            'exclusion_reason' => ['nullable', 'string', 'max:255', 'required_if:status,excluded'],
            'notes' => ['nullable', 'string', 'max:20000'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Judul sumber wajib diisi.',
            'authors.*.family.required_with' => 'Nama keluarga penulis wajib diisi.',
            'exclusion_reason.required_if' => 'Alasan eksklusi wajib diisi untuk sumber yang dikecualikan.',
        ];
    }
}
