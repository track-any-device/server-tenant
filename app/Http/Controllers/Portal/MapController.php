<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Inertia\Inertia;
use Inertia\Response;

class MapController extends Controller
{
    public function __invoke(): Response
    {
        // Initial positions come from the local database; live updates
        // arrive in the browser straight from Soketi (the same channels
        // the tenant:listen-signals job records from).
        $devices = Device::query()
            ->whereNotNull('last_lat')
            ->orderBy('name')
            ->get()
            ->map(fn (Device $device) => $device->toPortalArray());

        return Inertia::render('map/index', [
            'devices' => $devices,
            'tenantId' => config('tenant.id'),
            'pusherKey' => config('broadcasting.connections.pusher.key'),
            'pusherHost' => config('broadcasting.connections.pusher.options.host'),
            'pusherPort' => config('broadcasting.connections.pusher.options.port'),
            'pusherScheme' => config('broadcasting.connections.pusher.options.scheme', 'https'),
            'pusherCluster' => config('broadcasting.connections.pusher.options.cluster', 'mt1'),
        ]);
    }
}
