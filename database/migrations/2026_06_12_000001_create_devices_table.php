<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devices', function (Blueprint $table): void {
            $table->id();

            // Device id on the central platform — broadcast payloads carry it,
            // so it is the primary correlation key. Nullable because a device
            // may first appear via a payload that only has an IMEI.
            $table->unsignedBigInteger('platform_id')->nullable()->unique();
            $table->string('imei', 32)->unique();
            $table->string('name');
            $table->string('status', 32)->default('active');

            $table->string('device_type_name')->nullable();
            $table->string('device_type_slug')->nullable();

            $table->decimal('last_lat', 10, 7)->nullable();
            $table->decimal('last_lon', 10, 7)->nullable();
            $table->float('last_speed')->nullable();
            $table->unsignedTinyInteger('battery_percent')->nullable();
            $table->boolean('is_online')->default(false);
            $table->timestamp('last_signal_at')->nullable();

            $table->json('metadata')->nullable();
            $table->timestamp('synced_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devices');
    }
};
