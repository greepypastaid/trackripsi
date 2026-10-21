<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class GoogleAuthController extends Controller
{
    private const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

    /**
     * Kembalikan URL consent Google. Frontend yang melakukan redirect browser.
     */
    public function redirect(): JsonResponse
    {
        abort_if(blank(config('services.google.client_id')), 503, 'Login Google belum dikonfigurasi.');

        $state = Str::random(40);
        Cache::put("google_state:{$state}", true, now()->addMinutes(10));

        return response()->json([
            'url' => self::AUTHORIZE_URL.'?'.http_build_query([
                'client_id' => config('services.google.client_id'),
                'redirect_uri' => $this->callbackUrl(),
                'response_type' => 'code',
                'scope' => 'openid email profile',
                'state' => $state,
                'prompt' => 'select_account',
            ]),
        ]);
    }

    /**
     * Tukar authorization code ke Google, lalu terbitkan token Sanctum.
     * Token dikirim lewat fragment URL agar tidak tercatat di log server/referer.
     */
    public function callback(Request $request): RedirectResponse
    {
        if ($request->filled('error') || ! Cache::pull('google_state:'.$request->query('state'))) {
            return $this->frontend('error=invalid_state');
        }

        $code = $request->query('code');
        if (! is_string($code) || $code === '') {
            return $this->frontend('error=invalid_state');
        }

        try {
            $tokenResponse = Http::asForm()
                ->connectTimeout(3)
                ->timeout(8)
                ->post(self::TOKEN_URL, [
                    'code' => $code,
                    'client_id' => config('services.google.client_id'),
                    'client_secret' => config('services.google.client_secret'),
                    'redirect_uri' => $this->callbackUrl(),
                    'grant_type' => 'authorization_code',
                ]);

            if ($tokenResponse->failed()) {
                Log::warning('Google token exchange gagal', [
                    'status' => $tokenResponse->status(),
                    'error' => $tokenResponse->json('error'),
                ]);

                return $this->frontend('error='.urlencode((string) ($tokenResponse->json('error') ?? 'token_exchange')));
            }

            $userinfo = Http::withToken((string) $tokenResponse->json('access_token'))
                ->connectTimeout(3)
                ->timeout(8)
                ->get(self::USERINFO_URL);

            if ($userinfo->failed()) {
                Log::warning('Google userinfo gagal', ['status' => $userinfo->status()]);

                return $this->frontend('error=userinfo');
            }

            $profile = $userinfo->json();
        } catch (Throwable $e) {
            Log::warning('Google OAuth exception', ['exception' => $e->getMessage()]);

            return $this->frontend('error=failed');
        }

        $email = $profile['email'] ?? null;
        $sub = $profile['sub'] ?? null;

        if (! is_string($email) || ! is_string($sub) || $sub === '' || ($profile['email_verified'] ?? true) === false) {
            return $this->frontend('error=email');
        }

        try {
            $user = User::where('google_id', $sub)->first()
                ?? User::where('email', $email)->first()
                ?? new User;

            $user->fill([
                'name' => $user->name ?: ($profile['name'] ?? Str::before($email, '@')),
                'google_id' => $sub,
            ]);

            // Jangan rebut email milik akun lain (mis. email sudah dipakai akun password).
            $emailTaken = User::where('email', $email)->whereKeyNot($user->getKey())->exists();
            if (! $emailTaken) {
                $user->email = $email;
            }

            // Akun Google-only tetap punya password acak agar login email/password tidak bisa dipakai.
            if (! $user->exists) {
                $user->password = Str::random(40);
            }

            $user->save();
            $token = $user->createToken('spa')->plainTextToken;
        } catch (Throwable $e) {
            Log::error('Google login gagal menyimpan user', [
                'exception' => $e->getMessage(),
                'has_google_id_column' => Schema::hasColumn('users', 'google_id'),
            ]);

            return $this->frontend('error=db');
        }

        return $this->frontend('token='.urlencode($token));
    }

    private function callbackUrl(): string
    {
        return config('services.google.redirect') ?: url('/api/v1/auth/google/callback');
    }

    private function frontend(string $fragment): RedirectResponse
    {
        // FRONTEND_URL boleh berisi daftar origin (dipakai CORS); redirect hanya ke origin pertama.
        $origins = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) config('services.google.frontend_url')),
        )));

        $base = rtrim($origins[0] ?? 'http://localhost:5173', '/');

        return redirect()->away("{$base}/auth/google/callback#{$fragment}");
    }
}
