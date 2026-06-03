<?php

use Illuminate\Support\Facades\Route;

// All portal routes require authentication.
// Unauthenticated requests are redirected to /login (SsoRedirectController)
// which kicks off the OAuth2 flow to the central server-login.
Route::middleware('auth')->group(function (): void {
    Route::get('/', fn () => redirect()->route('dashboard'));
    Route::inertia('/dashboard', 'dashboard')->name('dashboard');
    Route::inertia('/devices', 'devices/index')->name('devices.index');
    Route::inertia('/devices/{id}', 'devices/show')->name('devices.show');
    Route::inertia('/incidents', 'incidents/index')->name('incidents.index');
    Route::inertia('/incidents/{id}', 'incidents/show')->name('incidents.show');
    Route::inertia('/beats', 'beats/index')->name('beats.index');
    Route::inertia('/beats/{id}', 'beats/show')->name('beats.show');
    Route::inertia('/assignees', 'assignees/index')->name('assignees.index');
    Route::inertia('/map', 'map/index')->name('map.index');
});
