<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Drop devices that have stopped broadcasting (default 24h; TENANT_PRUNE_AFTER_HOURS, 0 disables).
// Run by the `schedule:work` supervisord program.
Schedule::command('tenant:prune-stale-devices')->hourly();
