<?php

use App\Http\Controllers\Portal\BroadcastAuthController;
use App\Http\Controllers\Portal\DashboardController;
use App\Http\Controllers\Portal\DeviceController;
use App\Http\Controllers\Portal\MapController;
use App\Http\Controllers\PublicTrackerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public tracker (no auth) — the primary surface of this app
|--------------------------------------------------------------------------
|
| Anyone can look up a device by its public-facing id (IMEI / broadcast id)
| and see its CURRENT state. No login, no signal history, no incidents.
*/
Route::get('/', [PublicTrackerController::class, 'index'])->name('track');
Route::get('/track/{deviceId?}', [PublicTrackerController::class, 'index'])->name('track.lookup');
Route::get('/public/devices/{deviceId}', [PublicTrackerController::class, 'show'])->name('public.devices.show');

/*
|--------------------------------------------------------------------------
| Authenticated operational portal — minimal current-state view
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function (): void {
    // Dashboard
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Devices (current state only)
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/{id}', [DeviceController::class, 'show'])->name('devices.show');

    // Live map — passes Pusher config + initial device positions to the page
    Route::get('/map', MapController::class)->name('map.index');

    // Soketi broadcasting auth — browser POSTs here, we proxy to central platform
    Route::post('/broadcasting/auth', BroadcastAuthController::class)
        ->name('broadcasting.auth');
});

require __DIR__.'/settings.php';
