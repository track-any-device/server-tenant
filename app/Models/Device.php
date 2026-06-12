<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'last_lat' => 'float',
            'last_lon' => 'float',
            'last_speed' => 'float',
            'battery_percent' => 'integer',
            'is_online' => 'boolean',
            'last_signal_at' => 'datetime',
            'synced_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function signals(): HasMany
    {
        return $this->hasMany(Signal::class);
    }

    public function incidents(): HasMany
    {
        return $this->hasMany(Incident::class);
    }

    public function openIncident(string $eventType): ?Incident
    {
        return $this->incidents()
            ->where('event_type', $eventType)
            ->where('status', 'open')
            ->latest('triggered_at')
            ->first();
    }

    /**
     * Shape consumed by the React pages (devices/index, devices/show, map).
     *
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'platform_id' => $this->platform_id,
            'imei' => $this->imei,
            'name' => $this->name,
            'status' => $this->is_online ? $this->status : 'offline',
            'last_lat' => $this->last_lat,
            'last_lon' => $this->last_lon,
            'last_speed' => $this->last_speed,
            'battery_percent' => $this->battery_percent,
            'last_signal_at' => $this->last_signal_at?->toIso8601ZuluString(),
            'device_type' => $this->device_type_name
                ? ['name' => $this->device_type_name, 'slug' => $this->device_type_slug]
                : null,
        ];
    }
}
