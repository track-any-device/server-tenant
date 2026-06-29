<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Device;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Log;

/**
 * Turns broadcast payloads from the central Soketi stream into each device's
 * CURRENT state.
 *
 * This app is a PUBLIC, current-state-only tracker: it stores NO per-signal
 * history and calculates NO incidents. Every event simply overwrites the
 * matching device row in place (last position / battery / speed / status /
 * last_signal_at). Unknown devices are auto-created so a device added on the
 * platform mid-stream is picked up without re-running the sync.
 */
class SignalProcessor
{
    /**
     * Handle one event from the Soketi stream.
     */
    public function handleEvent(string $event, array $payload): void
    {
        match ($event) {
            'device.signal.received' => $this->record($event, $payload),
            'signal.created' => $this->record($event, $this->normalizeSignalCreated($payload)),
            'locations.batch' => $this->handleBatch($payload),
            default => null,
        };
    }

    /**
     * Sweep for devices that stopped signalling and flip them offline. Called
     * periodically by the listener. No history, no incidents — just the
     * current online/offline flag the public page reads.
     */
    public function markOfflineDevices(): void
    {
        $cutoff = now()->subMinutes((int) config('tenant.offline_after_minutes'));

        Device::query()
            ->where('is_online', true)
            ->whereNotNull('last_signal_at')
            ->where('last_signal_at', '<', $cutoff)
            ->update(['is_online' => false]);
    }

    /**
     * @param array{device_id?: int|null, imei?: string|null, lat?: float|null, lng?: float|null,
     *               speed?: float|null, battery?: int|null, is_online?: bool, last_seen_at?: string|null} $payload
     */
    private function record(string $event, array $payload): void
    {
        $imei = $payload['imei'] ?? null;
        $platformId = $payload['device_id'] ?? null;

        if ($imei === null && $platformId === null) {
            Log::warning('Signal payload without imei or device_id — skipped', ['event' => $event]);

            return;
        }

        $device = $this->resolveDevice($platformId, $imei);
        $recordedAt = isset($payload['last_seen_at'])
            ? CarbonImmutable::parse($payload['last_seen_at'])
            : CarbonImmutable::now();

        // Current-state only: overwrite the device row in place.
        $device->update(array_filter([
            'last_lat' => $payload['lat'] ?? null,
            'last_lon' => $payload['lng'] ?? null,
            'last_speed' => $payload['speed'] ?? null,
            'battery_percent' => $payload['battery'] ?? null,
        ], fn ($v) => $v !== null) + [
            'is_online' => $payload['is_online'] ?? true,
            'last_signal_at' => $recordedAt,
        ]);
    }

    /** A locations.batch payload carries many positions in one event. */
    private function handleBatch(array $payload): void
    {
        foreach ($payload['locations'] ?? [] as $location) {
            $this->record('locations.batch', [
                'device_id' => $location['device_id'] ?? null,
                'imei' => $location['imei'] ?? null,
                'lat' => $location['lat'] ?? null,
                'lng' => $location['lng'] ?? $location['lon'] ?? null,
                'battery' => $location['battery'] ?? null,
                'is_online' => true,
                'last_seen_at' => $location['recorded_at'] ?? null,
            ]);
        }
    }

    /** signal.created wraps the values in a nested signal object. */
    private function normalizeSignalCreated(array $payload): array
    {
        $signal = $payload['signal'] ?? [];

        return [
            'device_id' => $payload['device_id'] ?? null,
            'imei' => $payload['imei'] ?? null,
            'lat' => $signal['latitude'] ?? null,
            'lng' => $signal['longitude'] ?? null,
            'speed' => $signal['speed'] ?? null,
            'battery' => $signal['battery_percent'] ?? null,
            'is_online' => true,
            'last_seen_at' => $signal['device_time'] ?? null,
        ];
    }

    /**
     * Find the local device, or auto-create it when it first appears on the
     * broadcast stream.
     */
    private function resolveDevice(?int $platformId, ?string $imei): Device
    {
        $device = Device::query()
            ->when($platformId !== null, fn ($q) => $q->where('platform_id', $platformId))
            ->when($platformId === null, fn ($q) => $q->where('imei', $imei))
            ->first();

        if ($device === null && $imei !== null) {
            $device = Device::where('imei', $imei)->first();
        }

        if ($device !== null) {
            // Backfill the platform id when a synced-by-imei device shows up
            // in the stream with its central id.
            if ($device->platform_id === null && $platformId !== null) {
                $device->update(['platform_id' => $platformId]);
            }

            return $device;
        }

        return Device::create([
            'platform_id' => $platformId,
            'imei' => $imei ?? "platform-{$platformId}",
            'name' => $imei ?? "Device {$platformId}",
            'status' => 'active',
        ]);
    }
}
