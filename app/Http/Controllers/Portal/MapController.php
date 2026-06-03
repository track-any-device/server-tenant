<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function __invoke(): Response
    {
        // Devices with their last known coordinates for the initial map render.
        // Real-time updates arrive via Soketi (private-tenant.{id}.locations).
        $devices = $this->api->devices(['per_page' => 500]);

        return Inertia::render('map/index', [
            'devices'        => data_get($devices, 'data', []),
            'tenantId'       => config('tenant.id'),
            'pusherKey'      => config('broadcasting.connections.pusher.key'),
            'pusherHost'     => config('broadcasting.connections.pusher.host'),
            'pusherPort'     => config('broadcasting.connections.pusher.port'),
            'pusherScheme'   => config('broadcasting.connections.pusher.scheme', 'https'),
            'pusherCluster'  => config('broadcasting.connections.pusher.options.cluster', 'mt1'),
        ]);
    }
}
