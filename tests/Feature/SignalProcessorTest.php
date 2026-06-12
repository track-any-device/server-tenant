<?php

use App\Models\Device;
use App\Models\Incident;
use App\Models\Signal;
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

it('keeps a signal track per device', function () {
    $processor = app(SignalProcessor::class);
    $processor->handleEvent('device.signal.received', signalPayload());
    $processor->handleEvent('device.signal.received', signalPayload(['lat' => 33.7, 'lng' => 73.1]));

    $device = Device::sole();
    expect(Signal::count())->toBe(2)
        ->and($device->signals()->count())->toBe(2)
        ->and($device->last_lat)->toBe(33.7);
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
        ->and(Signal::count())->toBe(2);
});

it('opens a low_battery incident and resolves it on recovery', function () {
    $processor = app(SignalProcessor::class);

    $processor->handleEvent('device.signal.received', signalPayload(['battery' => 10]));
    expect(Device::sole()->openIncident(Incident::TYPE_LOW_BATTERY))->not->toBeNull();

    // Still below the recovery threshold — stays open, no duplicate.
    $processor->handleEvent('device.signal.received', signalPayload(['battery' => 20]));
    expect(Incident::count())->toBe(1)
        ->and(Incident::sole()->status)->toBe(Incident::STATUS_OPEN);

    $processor->handleEvent('device.signal.received', signalPayload(['battery' => 90]));
    expect(Incident::sole()->status)->toBe(Incident::STATUS_RESOLVED);
});

it('marks silent devices offline, opens an incident, and resolves when back', function () {
    $processor = app(SignalProcessor::class);
    $processor->handleEvent('device.signal.received', signalPayload());

    Device::sole()->update(['last_signal_at' => now()->subMinutes(30)]);
    $processor->markOfflineDevices();

    $device = Device::sole();
    expect($device->is_online)->toBeFalse()
        ->and($device->openIncident(Incident::TYPE_DEVICE_OFFLINE))->not->toBeNull();

    $processor->handleEvent('device.signal.received', signalPayload());
    expect(Device::sole()->is_online)->toBeTrue()
        ->and(Incident::where('status', Incident::STATUS_OPEN)->count())->toBe(0);
});
