<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Device;
use Illuminate\Console\Command;

/**
 * Deletes devices that have stopped broadcasting.
 *
 * This is a current-state tracker — the listener auto-creates a device the first time it sees a
 * signal, so abandoned/decommissioned ids would otherwise linger forever. This command drops any
 * device whose last broadcast (last_signal_at, falling back to created_at for one that was synced
 * but never reported) is older than the configured window. A device that comes back later is simply
 * re-created by the listener (or re-synced), so deletion is safe.
 *
 * Scheduled hourly (routes/console.php) and run by the `schedule:work` supervisord program.
 */
class PruneStaleDevices extends Command
{
    protected $signature = 'tenant:prune-stale-devices';

    protected $description = 'Delete devices with no broadcast within the configured window (default 24h)';

    public function handle(): int
    {
        $hours = (int) config('tenant.prune_after_hours');

        if ($hours <= 0) {
            $this->info('Device pruning is disabled (TENANT_PRUNE_AFTER_HOURS <= 0).');

            return self::SUCCESS;
        }

        $cutoff = now()->subHours($hours);

        $deleted = Device::query()
            ->where(function ($q) use ($cutoff): void {
                $q->where('last_signal_at', '<', $cutoff)
                    ->orWhere(function ($q2) use ($cutoff): void {
                        $q2->whereNull('last_signal_at')->where('created_at', '<', $cutoff);
                    });
            })
            ->delete();

        $this->info("Pruned {$deleted} device(s) silent for over {$hours}h.");

        return self::SUCCESS;
    }
}
