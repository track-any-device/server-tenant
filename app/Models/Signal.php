<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Signal extends Model
{
    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lon' => 'float',
            'speed' => 'float',
            'battery' => 'integer',
            'is_online' => 'boolean',
            'payload' => 'array',
            'recorded_at' => 'datetime',
        ];
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
