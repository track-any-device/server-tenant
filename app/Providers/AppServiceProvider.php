<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\TenantApiClient;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // TenantApiClient is a singleton — one HTTP client per container lifecycle.
        $this->app->singleton(TenantApiClient::class);
    }

    public function boot(): void
    {
        Date::use(CarbonImmutable::class);
    }
}
