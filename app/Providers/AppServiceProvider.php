<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\PlatformApiClient;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Contracts\Factory as SocialiteFactory;
use Laravel\Socialite\SocialiteManager;
use TrackAnyDevice\SsoClient\Socialite\SsoProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // PlatformApiClient is a singleton — one HTTP client per container lifecycle.
        $this->app->singleton(PlatformApiClient::class);
    }

    public function boot(): void
    {
        Date::use(CarbonImmutable::class);

        $this->bootTenantContext();
        $this->bootSsoDriver();
    }

    /**
     * Publish tenant identity from env vars to the config namespace so
     * controllers, middleware, and Inertia shared props can read them
     * without re-parsing env on every call.
     */
    private function bootTenantContext(): void
    {
        config([
            'tenant.slug'    => env('APP_TENANT_SLUG'),
            'tenant.id'      => (int) env('APP_TENANT_ID', 0),
            'tenant.api_key' => env('APP_TENANT_API_KEY'),
        ]);
    }

    /**
     * Override the Socialite 'sso' driver with credentials from env vars.
     *
     * The default SsoClientServiceProvider tries to resolve credentials from
     * the central database (oauth_clients table). For server-tenant, the
     * tenant-specific OAuth client credentials are supplied via environment
     * variables so this app can authenticate to the SSO provider without
     * needing a direct database connection to the central oauth_clients table.
     */
    private function bootSsoDriver(): void
    {
        $this->callAfterResolving(SocialiteFactory::class, function (SocialiteManager $socialite): void {
            $resolve = fn (Application $app) => [
                'client_id'     => config('services.sso.client_id'),
                'client_secret' => config('services.sso.client_secret'),
                'redirect'      => config('services.sso.redirect'),
                'server_url'    => config('services.sso.server_url'),
            ];

            $socialite->extend('sso', function (Application $app) use ($resolve): SsoProvider {
                $config = $resolve($app);

                return (new SsoProvider(
                    $app['request'],
                    $config['client_id'] ?? '',
                    $config['client_secret'] ?? '',
                    $config['redirect'] ?? '',
                ))->setConfig($config);
            });
        });
    }
}
