<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Incident extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_ACKNOWLEDGED = 'acknowledged';

    public const STATUS_RESOLVED = 'resolved';

    public const TYPE_DEVICE_OFFLINE = 'device_offline';

    public const TYPE_LOW_BATTERY = 'low_battery';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'level' => 'integer',
            'meta' => 'array',
            'triggered_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }

    /**
     * Shape consumed by the React pages (incidents/index, incidents/show, dashboard).
     *
     * @return array<string, mixed>
     */
    public function toPortalArray(): array
    {
        return [
            'id' => $this->id,
            'event_type' => $this->event_type,
            'status' => $this->status,
            'priority' => $this->priority,
            'level' => $this->level,
            'title' => $this->title,
            'description' => $this->description,
            'resolution_notes' => $this->resolution_notes,
            'triggered_at' => $this->triggered_at?->toIso8601ZuluString(),
            'resolved_at' => $this->resolved_at?->toIso8601ZuluString(),
            'device' => $this->relationLoaded('device') && $this->device
                ? ['id' => $this->device->id, 'name' => $this->device->name, 'imei' => $this->device->imei]
                : null,
        ];
    }
}
