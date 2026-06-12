<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\TenantApiClient;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Signs the browser's private-channel subscriptions by proxying to the
 * central platform's tenant broadcasting auth endpoint, using the tenant
 * API token. The browser never holds the Pusher app secret or the token.
 */
class BroadcastAuthController extends Controller
{
    public function __construct(private TenantApiClient $api) {}

    public function __invoke(Request $request): JsonResponse
    {
        try {
            $auth = $this->api->broadcastAuth(
                $request->input('channel_name', ''),
                $request->input('socket_id', ''),
            );

            return response()->json($auth);
        } catch (RequestException $e) {
            return response()->json(
                ['message' => 'Channel auth failed.'],
                $e->response->status(),
            );
        }
    }
}
