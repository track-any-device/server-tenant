<?php

use App\Models\Device;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('returns the current state for a known device via the public JSON API', function () {
    Device::create([
        'platform_id' => 1,
        'imei' => '123456789012345',
        'name' => 'Truck 1',
        'status' => 'active',
        'is_online' => true,
        'last_lat' => 33.6844,
        'last_lon' => 73.0479,
        'battery_percent' => 72,
        'last_signal_at' => now(),
    ]);

    $this->getJson('/public/devices/123456789012345')
        ->assertOk()
        ->assertJsonPath('data.imei', '123456789012345')
        ->assertJsonPath('data.status', 'online')
        ->assertJsonPath('data.battery_percent', 72)
        ->assertJsonMissingPath('data.id');
});

it('returns 404 for an unknown device id — no fabricated data', function () {
    $this->getJson('/public/devices/does-not-exist')
        ->assertNotFound()
        ->assertJsonMissingPath('data');
});

it('serves the public lookup page without authentication', function () {
    $this->get('/')->assertOk();
    $this->get('/track')->assertOk();
});
