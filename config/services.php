<?php

return [

    'postmark' => ['key' => env('POSTMARK_API_KEY')],
    'resend' => ['key' => env('RESEND_API_KEY')],
    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    // ── Platform API ──────────────────────────────────────────────────────────
    // Central platform — used ONLY for the one-time device sync and for
    // Soketi private-channel auth, both via the tenant API token.
    'platform' => [
        'api_url' => env('PLATFORM_API_URL', 'https://api.track-any-device.com'),
    ],

];
