<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        apiPrefix: 'api/v1',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Di belakang reverse proxy / Cloudflare agar url() memakai https
        // (Google menolak redirect URI http untuk domain non-localhost).
        $trustedProxies = env('TRUSTED_PROXIES', '*');
        $middleware->trustProxies(
            at: $trustedProxies === '*' ? '*' : array_map('trim', explode(',', $trustedProxies)),
        );
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));

        $exceptions->render(function (Throwable $e, Request $request) {
            if (! $request->is('api/*') || ! $e instanceof HttpExceptionInterface) {
                return null;
            }

            if (in_array($e->getStatusCode(), [401, 403, 404, 405], true)) {
                $message = $e->getStatusCode() === 401
                    ? 'Sesi tidak valid atau sudah berakhir.'
                    : ($e->getMessage() ?: 'Akses tidak diizinkan.');

                return response()->json(['message' => $message], $e->getStatusCode());
            }

            return null;
        });
    })->create();
