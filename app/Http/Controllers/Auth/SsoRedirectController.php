<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;

/**
 * Kicks off the SSO flow by redirecting to the central login provider.
 *
 * Credentials (client_id, client_secret, redirect) are read from
 * config('services.sso') which is populated from env vars and overridden
 * by AppServiceProvider to use this tenant's specific OAuth client.
 */
class SsoRedirectController extends Controller
{
    public function __invoke(): RedirectResponse
    {
        return Socialite::driver('sso')->redirect();
    }
}
