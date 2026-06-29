<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Device;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The PUBLIC, no-auth surface of this app — the primary one.
 *
 * Anyone can enter a device's public-facing id (IMEI / broadcast id) and see
 * that device's CURRENT state: last location, battery, speed, last-seen and
 * online/offline status. There is no signal history and no incidents — the
 * listener keeps the local `devices` table at the latest known state.
 */
class PublicTrackerController extends Controller
{
    /**
     * The public landing page: a device-id lookup form. When a deviceId is
     * supplied (e.g. /track/123456789012345) the page is pre-loaded with that
     * device's current state, or a not-found flag for an unknown id.
     */
    public function index(Request $request, ?string $deviceId = null): Response
    {
        $deviceId = $deviceId !== null ? trim($deviceId) : null;

        $device = $deviceId !== null && $deviceId !== ''
            ? $this->lookup($deviceId)
            : null;

        return Inertia::render('track', [
            'deviceId' => $deviceId,
            'device' => $device?->toPublicArray(),
            'notFound' => $deviceId !== null && $deviceId !== '' && $device === null,
        ]);
    }

    /**
     * Public JSON API: current state for one device by its public-facing id.
     * Returns 404 (no fabricated data) when the id is unknown.
     */
    public function show(string $deviceId): JsonResponse
    {
        $device = $this->lookup($deviceId);

        if ($device === null) {
            return response()->json([
                'message' => 'No device found for that id.',
            ], 404);
        }

        return response()->json(['data' => $device->toPublicArray()]);
    }

    /**
     * Resolve a device by its public-facing id. The id is the IMEI / broadcast
     * id; for convenience the numeric platform id is also accepted.
     */
    private function lookup(string $deviceId): ?Device
    {
        $deviceId = trim($deviceId);

        if ($deviceId === '') {
            return null;
        }

        return Device::query()
            ->where('imei', $deviceId)
            ->when(
                ctype_digit($deviceId),
                fn ($q) => $q->orWhere('platform_id', (int) $deviceId),
            )
            ->first();
    }
}
