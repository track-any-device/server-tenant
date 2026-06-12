<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('incidents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();

            // device_offline | low_battery | ... — calculated locally by the
            // signal listener; the central platform does not monitor tenant devices.
            $table->string('event_type', 64);
            $table->string('status', 32)->default('open');
            $table->string('priority', 32)->default('medium');
            $table->unsignedTinyInteger('level')->default(1);

            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->json('meta')->nullable();

            $table->timestamp('triggered_at');
            $table->timestamp('resolved_at')->nullable();

            $table->timestamps();

            $table->index(['device_id', 'event_type', 'status']);
            $table->index(['status', 'triggered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('incidents');
    }
};
