<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

/**
 * Client for the central platform's public Tenant API (/api/v1/tenant).
 *
 * server-tenant is a standalone app — this client is used for exactly two
 * things, both authenticated with the tenant's scoped Sanctum token:
 *
 *   1. The one-time device sync (`tenant:sync-devices`) — devices.read scope.
 *   2. Private Soketi channel auth (browser map page + the background
 *      signal listener) — signals.read scope.
 *
 * All operational data after the initial sync lives in the local SQLite
 * database, fed by the websocket signal stream.
 */
class TenantApiClient
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.platform.api_url'), '/').'/api/v1/tenant';
    }

    /**
     * One page of this tenant's devices.
     *
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, mixed>}
     */
    public function devices(int $page = 1, int $perPage = 100): array
    {
        return $this->http()
            ->get('devices', ['page' => $page, 'per_page' => $perPage])
            ->throw()
            ->json();
    }

    /**
     * Sign a private Soketi channel subscription for this tenant.
     *
     * @return array{auth: string}
     */
    public function broadcastAuth(string $channelName, string $socketId): array
    {
        return $this->http()
            ->post('broadcasting/auth', [
                'channel_name' => $channelName,
                'socket_id' => $socketId,
            ])
            ->throw()
            ->json();
    }

    private function http(): PendingRequest
    {
        return Http::baseUrl($this->baseUrl)
            ->withToken((string) config('tenant.api_token'))
            ->acceptJson()
            ->timeout(15);
    }
}
