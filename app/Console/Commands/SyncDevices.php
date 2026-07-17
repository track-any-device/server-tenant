<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\TenantApiClient;
use Illuminate\Console\Command;

/**
 * One-time load of this tenant's devices from the central platform.
 *
 * Run once after install (or whenever a full re-sync is wanted). After
 * that the websocket listener keeps the local database current and
 * auto-creates devices that newly appear on the broadcast stream.
 */
class SyncDevices extends Command
{
    protected $signature = 'tenant:sync-devices';

    protected $description = 'Load this tenant\'s devices from the central platform API into the local database';

    public function handle(TenantApiClient $api): int
    {
        if (! config('tenant.api_token')) {
            $this->error('TENANT_API_TOKEN is not set.');

            return self::FAILURE;
        }

        $page = 1;
        $count = 0;
        $seenImeis = [];

        do {
            $response = $api->devices($page);

            foreach ($response['data'] ?? [] as $remote) {
                $seenImeis[] = (string) $remote['imei'];
                Device::updateOrCreate(
                    ['imei' => $remote['imei']],
                    [
                        'platform_id' => $remote['id'],
                        'name' => $remote['name'] ?? $remote['imei'],
                        'status' => $remote['status'] ?? 'active',
                        'device_type_name' => $remote['device_type']['name'] ?? null,
                        'device_type_slug' => $remote['device_type']['slug'] ?? null,
                        'last_lat' => $remote['last_lat'] ?? null,
                        'last_lon' => $remote['last_lon'] ?? null,
                        'battery_percent' => $remote['battery_level'] ?? null,
                        'last_signal_at' => $remote['last_seen_at'] ?? null,
                        'synced_at' => now(),
                    ],
                );
                $count++;
            }

            $lastPage = (int) data_get($response, 'meta.last_page', 1);
        } while ($page++ < $lastPage);

        // Reconcile: a device the platform no longer lists for this tenant was
        // re-assigned or retired — remove it. Only runs after EVERY page
        // fetched successfully ($api->devices() throws on any failure), so a
        // partial sync can never mass-delete.
        $removed = 0;
        if ($seenImeis !== []) {
            $removed = Device::query()->whereNotIn('imei', $seenImeis)->delete();
        } elseif (Device::query()->exists()) {
            $this->warn('Platform returned no devices — skipping removal of local devices (check tenant credentials).');
        }

        $this->info("Synced {$count} devices from the platform.".($removed > 0 ? " Removed {$removed} no longer associated." : ''));

        return self::SUCCESS;
    }
}
