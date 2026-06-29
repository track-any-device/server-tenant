<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    /**
     * Shape consumed by the authenticated portal pages (devices/index,
     * devices/show, map).
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

    /**
     * Shape consumed by the PUBLIC device-id lookup (no auth). Deliberately
     * narrow — only the current-state fields a member of the public needs to
     * locate the device. No internal ids are exposed.
     *
     * @return array<string, mixed>
     */
    public function toPublicArray(): array
    {
        return [
            'imei' => $this->imei,
            'name' => $this->name,
            'is_online' => (bool) $this->is_online,
            'status' => $this->is_online ? 'online' : 'offline',
            'last_lat' => $this->last_lat,
            'last_lon' => $this->last_lon,
            'last_speed' => $this->last_speed,
            'battery_percent' => $this->battery_percent,
            'last_signal_at' => $this->last_signal_at?->toIso8601ZuluString(),
            'device_type' => $this->device_type_name,
        ];
    }
}
