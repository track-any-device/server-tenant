<?php

use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function makeTrackedDevice(string $imei, array $attrs = []): Device
{
    return Device::create(array_merge([
        'imei' => $imei,
        'name' => 'Device '.$imei,
        'status' => 'active',
    ], $attrs));
}

it('deletes devices silent past the prune window and keeps recent ones', function () {
    config()->set('tenant.prune_after_hours', 24);

    $stale = makeTrackedDevice('1000000000001', ['last_signal_at' => now()->subHours(25)]);
    $fresh = makeTrackedDevice('1000000000002', ['last_signal_at' => now()->subHours(2)]);
    // Synced but never reported: judged by created_at.
    $neverSeenOld = makeTrackedDevice('1000000000003', ['last_signal_at' => null, 'created_at' => now()->subHours(48)]);
    $neverSeenNew = makeTrackedDevice('1000000000004', ['last_signal_at' => null, 'created_at' => now()->subHour()]);

    $this->artisan('tenant:prune-stale-devices')->assertSuccessful();

    expect(Device::find($stale->id))->toBeNull();
    expect(Device::find($neverSeenOld->id))->toBeNull();
    expect(Device::find($fresh->id))->not->toBeNull();
    expect(Device::find($neverSeenNew->id))->not->toBeNull();
});

it('keeps every device when pruning is disabled', function () {
    config()->set('tenant.prune_after_hours', 0);

    makeTrackedDevice('2000000000001', ['last_signal_at' => now()->subDays(10)]);

    $this->artisan('tenant:prune-stale-devices')->assertSuccessful();

    expect(Device::count())->toBe(1);
});
