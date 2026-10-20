<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $required = $this->isMethod('post') ? 'required' : 'sometimes';

        return [
            'scheduled_at' => [$required, 'date'],
            'agenda' => ['nullable', 'array', 'max:20'],
            'agenda.*' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'in:planned,done,cancelled'],
        ];
    }

    public function messages(): array
    {
        return ['scheduled_at.required' => 'Jadwal pertemuan wajib diisi.'];
    }
}
