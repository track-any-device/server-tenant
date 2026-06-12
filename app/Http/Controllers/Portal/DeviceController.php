<?php

declare(strict_types=1);

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function index(Request $request): Response
    {
        $devices = Device::query()
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(fn ($q) => $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('imei', 'like', "%{$search}%"));
            })
            ->when($request->string('status')->isNotEmpty(), function ($query) use ($request): void {
                match ($request->string('status')->toString()) {
                    'offline' => $query->where('is_online', false),
                    default => $query
                        ->where('status', $request->string('status')->toString())
                        ->where('is_online', true),
                };
            })
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (Device $device) => $device->toPortalArray());

        return Inertia::render('devices/index', [
            'devices' => $devices,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function show(int $id): Response
    {
        $device = Device::findOrFail($id);
        $latest = $device->signals()->latest('recorded_at')->first();

        return Inertia::render('devices/show', [
            'device' => $device->toPortalArray(),
            'signals' => [
                'lat' => $latest?->lat,
                'lon' => $latest?->lon,
                'speed' => $latest?->speed,
                'battery' => $latest?->battery,
                'recorded_at' => $latest?->recorded_at?->toIso8601ZuluString(),
            ],
        ]);
    }
}
