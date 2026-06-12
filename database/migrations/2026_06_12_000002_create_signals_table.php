<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signals', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();

            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lon', 10, 7)->nullable();
            $table->float('speed')->nullable();
            $table->unsignedTinyInteger('battery')->nullable();
            $table->boolean('is_online')->default(true);

            // Original event name on the Soketi channel, e.g.
            // device.signal.received / signal.created / locations.batch
            $table->string('event', 64)->nullable();

            // Raw broadcast payload as received — kept for replay/debugging.
            $table->json('payload')->nullable();

            $table->timestamp('recorded_at');
            $table->timestamps();

            $table->index(['device_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signals');
    }
};
