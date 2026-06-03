<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Proxies Soketi private-channel auth from the browser through the central
 * app/ API. The browser never holds the Pusher app secret — this controller
 * acts as the auth intermediary.
 *
 * The central BroadcastAuthController validates that the requested channel
 * belongs to this tenant before signing. If the channel is not scoped to
 * this tenant, the central API returns 403 and we forward that too.
 */
class BroadcastAuthController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $auth = $this->api->broadcastAuth(
                $request->input('channel_name', ''),
                $request->input('socket_id', ''),
            );

            return response()->json($auth);
        } catch (\Illuminate\Http\Client\RequestException $e) {
            return response()->json(
                ['message' => 'Channel auth failed.'],
                $e->response->status(),
            );
        }
    }
}
