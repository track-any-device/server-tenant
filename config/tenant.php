<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Tenant Identity
    |--------------------------------------------------------------------------
    |
    | Every server-tenant instance runs for exactly one tenant. The id must
    | match the tenant's id on the central platform — it is used to build
    | the Soketi channel names (tenant.{id}.device-logs / .locations).
    |
    */

    'slug' => env('APP_TENANT_SLUG'),
    'id' => (int) env('APP_TENANT_ID', 0),

    /*
    |--------------------------------------------------------------------------
    | Tenant API Token
    |--------------------------------------------------------------------------
    |
    | Scoped Sanctum token issued by the central platform for this tenant.
    | Used for the one-time device sync (devices.read) and for private
    | channel authentication against /api/v1/tenant/broadcasting/auth
    | (signals.read). This is the ONLY credential this app needs.
    |
    */

    'api_token' => env('TENANT_API_TOKEN'),

    /*
    |--------------------------------------------------------------------------
    | Incident Rules
    |--------------------------------------------------------------------------
    |
    | Incidents are calculated locally from the signal stream — the central
    | platform does not monitor tenant devices.
    |
    */

    'offline_after_minutes' => (int) env('TENANT_OFFLINE_AFTER_MINUTES', 15),
    'low_battery_threshold' => (int) env('TENANT_LOW_BATTERY_THRESHOLD', 15),
    'low_battery_recovered' => (int) env('TENANT_LOW_BATTERY_RECOVERED', 25),

];
