<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama lengkapmu belum diisi.',
            'email.required' => 'Emailnya belum diisi.',
            'email.email' => 'Format emailnya belum benar.',
            'email.unique' => 'Email ini udah dipakai akun lain. Coba masuk, atau pakai email lain.',
            'password.required' => 'Kata sandinya belum diisi.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'password.confirmed' => 'Kata sandi sama ulangannya beda.',
        ];
    }
}
