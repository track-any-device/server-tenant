<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

/**
 * Handles the OAuth2 callback from the central SSO provider.
 *
 * Does NOT use package-sso-client's SsoCallbackController because that
 * implementation relies on tenancy()->tenant for OAuth client resolution,
 * which is not initialized in server-tenant. Instead, credentials come
 * from env vars (via AppServiceProvider + config/services.php).
 *
 * Auth::loginUsingId() queries the central MySQL database via UsesCentralConnection
 * on the User model. Both hosted and on-premise deployments must have
 * the central MySQL accessible for authentication.
 */
class SsoCallbackController extends Controller
{
    public function __invoke(Request $request): RedirectResponse
    {
        try {
            $socialiteUser = Socialite::driver('sso')->stateless()->user();
        } catch (\Throwable) {
            return redirect()->route('login')
                ->with('error', 'Sign-in link is invalid or has expired. Please try again.');
        }

        $user = Auth::loginUsingId((int) $socialiteUser->getId());

        if (! $user) {
            return redirect()->route('login')
                ->with('error', 'Your account was not found. Contact your administrator.');
        }

        $request->session()->regenerate();

        // Store Socialite token for forwarding as X-User-Token to the central API.
        // This lets the central app attribute actions to the correct user.
        $request->session()->put('portal_user_token', $socialiteUser->token);

        return redirect()->intended(route('dashboard'));
    }
}
