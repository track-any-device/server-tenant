<?php

use App\Http\Controllers\Portal\AssigneeController;
use App\Http\Controllers\Portal\BeatController;
use App\Http\Controllers\Portal\BroadcastAuthController;
use App\Http\Controllers\Portal\DashboardController;
use App\Http\Controllers\Portal\DeviceController;
use App\Http\Controllers\Portal\IncidentController;
use App\Http\Controllers\Portal\MapController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function (): void {
    Route::get('/', fn () => redirect()->route('dashboard'));

    // Dashboard
    Route::get('/dashboard', DashboardController::class)->name('dashboard');

    // Devices
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/{id}', [DeviceController::class, 'show'])->name('devices.show');

    // Incidents
    Route::get('/incidents', [IncidentController::class, 'index'])->name('incidents.index');
    Route::get('/incidents/{id}', [IncidentController::class, 'show'])->name('incidents.show');
    Route::patch('/incidents/{id}', [IncidentController::class, 'update'])->name('incidents.update');

    // Beats (geo-fence zones)
    Route::get('/beats', [BeatController::class, 'index'])->name('beats.index');
    Route::get('/beats/{id}', [BeatController::class, 'show'])->name('beats.show');

    // Assignees (field personnel)
    Route::get('/assignees', [AssigneeController::class, 'index'])->name('assignees.index');
    Route::get('/assignees/{id}', [AssigneeController::class, 'show'])->name('assignees.show');

    // Live map — passes Pusher config + initial device positions to the page
    Route::get('/map', MapController::class)->name('map.index');

    // Soketi broadcasting auth — browser POSTs here, we proxy to central platform
    Route::post('/broadcasting/auth', BroadcastAuthController::class)
        ->name('broadcasting.auth');
});
