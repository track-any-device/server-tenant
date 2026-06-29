<?php

use App\Models\Device;
use App\Services\SignalProcessor;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function signalPayload(array $overrides = []): array
{
    return [
        'device_id' => 101,
        'imei' => 'TEST-IMEI-001',
        'lat' => 33.6844,
        'lng' => 73.0479,
        'battery' => 80,
        'is_online' => true,
        'last_seen_at' => now()->toIso8601ZuluString(),
        ...$overrides,
    ];
}

it('auto-creates a device when it first appears on the broadcast stream', function () {
    app(SignalProcessor::class)->handleEvent('device.signal.received', signalPayload());

    $device = Device::sole();
    expect($device->imei)->toBe('TEST-IMEI-001')
        ->and($device->platform_id)->toBe(101)
        ->and($device->is_online)->toBeTrue()
        ->and($device->battery_percent)->toBe(80);
});

it('only upserts the current state — no signal history is stored', function () {
    $processor = app(SignalProcessor::class);
    $processor->handleEvent('device.signal.received', signalPayload());
    $processor->handleEvent('device.signal.received', signalPayload(['lat' => 33.7, 'lng' => 73.1]));

    // One device, overwritten in place. No signals table exists.
    expect(Device::count())->toBe(1)
        ->and(Device::sole()->last_lat)->toBe(33.7);
});

it('handles signal.created and locations.batch event shapes', function () {
    $processor = app(SignalProcessor::class);

    $processor->handleEvent('signal.created', [
        'device_id' => 102,
        'imei' => 'TEST-IMEI-002',
        'signal' => ['latitude' => 24.86, 'longitude' => 67.0, 'battery_percent' => 55],
    ]);

    $processor->handleEvent('locations.batch', [
        'locations' => [
            ['device_id' => 103, 'imei' => 'TEST-IMEI-003', 'lat' => 31.5, 'lon' => 74.3, 'battery' => 70],
        ],
    ]);

    expect(Device::pluck('imei')->all())->toBe(['TEST-IMEI-002', 'TEST-IMEI-003'])
        ->and(Device::where('imei', 'TEST-IMEI-002')->sole()->battery_percent)->toBe(55);
});

it('marks silent devices offline and flips them back online when they signal again', function () {
    $processor = app(SignalProcessor::class);
    $processor->handleEvent('device.signal.received', signalPayload());

    Device::sole()->update(['last_signal_at' => now()->subMinutes(30)]);
    $processor->markOfflineDevices();

    expect(Device::sole()->is_online)->toBeFalse();

    $processor->handleEvent('device.signal.received', signalPayload());
    expect(Device::sole()->is_online)->toBeTrue();
});
