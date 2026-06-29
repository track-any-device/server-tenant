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
    | Offline Threshold
    |--------------------------------------------------------------------------
    |
    | This app is current-state only — no incidents. The listener's periodic
    | sweep simply flips a device to offline once it has been silent for this
    | many minutes (the public page shows online/offline from this flag).
    |
    */

    'offline_after_minutes' => (int) env('TENANT_OFFLINE_AFTER_MINUTES', 15),

];
