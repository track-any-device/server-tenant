<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * server-tenant became a PUBLIC, current-state-only tracker.
 *
 * It no longer logs signal history and no longer calculates incidents
 * locally — the listener now only upserts each device's CURRENT state into
 * the `devices` table. These two history tables are therefore removed.
 *
 * This migration drops them from any existing instance. The original
 * create_signals / create_incidents migrations have been deleted, so a
 * fresh install never creates them in the first place.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('incidents');
        Schema::dropIfExists('signals');
    }

    public function down(): void
    {
        // Intentionally irreversible — history is no longer part of this app.
    }
};
