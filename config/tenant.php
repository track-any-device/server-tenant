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
    | Tenant Access Key
    |--------------------------------------------------------------------------
    |
    | The tenant's machine access key (tk_…), generated/copied from the admin
    | org-details screen. Sent to the platform's /api/portal endpoints as
    | `Authorization: Bearer {key}` alongside `X-Tenant-Id: {id}` (above) for the
    | one-time device sync and private Soketi channel auth. This is the ONLY
    | credential this app needs (validated against the tenant's key_hash).
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

    /*
    |--------------------------------------------------------------------------
    | Stale-device Pruning
    |--------------------------------------------------------------------------
    |
    | A device that stops broadcasting for this many hours is deleted by the
    | scheduled `tenant:prune-stale-devices` command (hourly). The listener
    | re-creates a device if it ever reports again, so this is safe. Set to 0
    | (or a negative value) to disable pruning and keep devices indefinitely.
    |
    */

    'prune_after_hours' => (int) env('TENANT_PRUNE_AFTER_HOURS', 24),

];
