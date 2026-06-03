<?php

return [

    'postmark' => ['key' => env('POSTMARK_API_KEY')],
    'resend'   => ['key' => env('RESEND_API_KEY')],
    'ses'      => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // ── Platform API ──────────────────────────────────────────────────────────
    // Central app/ REST API — all operational data flows through here.
    'platform' => [
        'api_url' => env('PLATFORM_API_URL', 'https://api.track-any-device.com'),
    ],

    // ── SSO — central identity provider ───────────────────────────────────────
    // Tenant-specific credentials injected via env vars.
    // AppServiceProvider uses these to override the Socialite 'sso' driver
    // so no database lookup is needed for the OAuth client credentials.
    'sso' => [
        'client_id'     => env('SSO_CLIENT_ID'),
        'client_secret' => env('SSO_CLIENT_SECRET'),
        'redirect'      => env('SSO_REDIRECT_URI'),
        'server_url'    => env('PLATFORM_SSO_URL', 'https://login.track-any-device.com'),
    ],

];
