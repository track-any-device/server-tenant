<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

/**
 * HTTP client for all calls to the central app/ REST API.
 *
 * Every data request from this portal (devices, incidents, beats, assignees)
 * goes through this class — never raw Http:: calls in controllers.
 *
 * Authentication:
 *   Authorization: Bearer {APP_TENANT_API_KEY}  — identifies this tenant
 *   X-Tenant-Id:   {APP_TENANT_ID}              — for efficient key lookup
 *   X-User-Token:  {session value}              — identifies the acting user
 *
 * All methods throw on HTTP errors so controllers can rely on data being
 * present and let the exception handler surface a clean error page.
 */
class PlatformApiClient
{
    private string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.platform.api_url'), '/').'/api/portal';
    }

    // ── Devices ───────────────────────────────────────────────────────────────

    public function devices(array $params = []): array
    {
        return $this->http()->get('devices', $params)->throw()->json();
    }

    public function device(int $id): array
    {
        return $this->http()->get("devices/{$id}")->throw()->json();
    }

    public function deviceSignals(int $id): array
    {
        return $this->http()->get("devices/{$id}/signals")->throw()->json();
    }

    // ── Incidents ─────────────────────────────────────────────────────────────

    public function incidents(array $params = []): array
    {
        return $this->http()->get('incidents', $params)->throw()->json();
    }

    public function incident(int $id): array
    {
        return $this->http()->get("incidents/{$id}")->throw()->json();
    }

    public function createIncident(array $data): array
    {
        return $this->http()->post('incidents', $data)->throw()->json();
    }

    public function updateIncident(int $id, array $data): array
    {
        return $this->http()->patch("incidents/{$id}", $data)->throw()->json();
    }

    // ── Beats ─────────────────────────────────────────────────────────────────

    public function beats(): array
    {
        return $this->http()->get('beats')->throw()->json();
    }

    public function beat(int $id): array
    {
        return $this->http()->get("beats/{$id}")->throw()->json();
    }

    // ── Assignees ─────────────────────────────────────────────────────────────

    public function assignees(): array
    {
        return $this->http()->get('assignees')->throw()->json();
    }

    public function assignee(int $id): array
    {
        return $this->http()->get("assignees/{$id}")->throw()->json();
    }

    // ── Soketi channel auth proxy ─────────────────────────────────────────────

    public function broadcastAuth(string $channelName, string $socketId): array
    {
        return $this->http()
            ->post('broadcasting/auth', [
                'channel_name' => $channelName,
                'socket_id'    => $socketId,
            ])
            ->throw()
            ->json();
    }

    // ── HTTP base ─────────────────────────────────────────────────────────────

    private function http(): PendingRequest
    {
        $headers = [
            'Authorization' => 'Bearer '.config('tenant.api_key'),
            'X-Tenant-Id'   => config('tenant.id'),
            'Accept'        => 'application/json',
        ];

        // Forward the acting user's identity when available.
        if ($userToken = session('portal_user_token')) {
            $headers['X-User-Token'] = $userToken;
        }

        return Http::baseUrl($this->baseUrl)
            ->withHeaders($headers)
            ->timeout(15);
    }
}
