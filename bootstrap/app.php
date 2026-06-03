<?php

use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\SsoCallbackController;
use App\Http\Controllers\Auth\SsoRedirectController;
use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // SSO routes must be outside the auth middleware so unauthenticated
            // users can reach the callback to complete the login handshake.
            Route::middleware('web')->group(function (): void {
                Route::get('/login', SsoRedirectController::class)->name('login');
                Route::get('/sso/callback', SsoCallbackController::class)->name('sso.callback');
                Route::post('/logout', LogoutController::class)->name('logout')
                    ->middleware('auth');
            });
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
