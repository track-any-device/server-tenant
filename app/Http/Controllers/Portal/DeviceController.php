<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Services\PlatformApiClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function __construct(private PlatformApiClient $api) {}

    public function index(Request $request): Response
    {
        $devices = $this->api->devices(
            $request->only(['search', 'status', 'page'])
        );

        return Inertia::render('devices/index', [
            'devices' => $devices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(int $id): Response
    {
        $device  = $this->api->device($id);
        $signals = $this->api->deviceSignals($id);

        return Inertia::render('devices/show', [
            'device'  => $device,
            'signals' => $signals,
        ]);
    }
}
