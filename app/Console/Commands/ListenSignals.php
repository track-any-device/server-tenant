<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\SignalProcessor;
use App\Services\TenantApiClient;
use Illuminate\Console\Command;
use Throwable;
use WebSocket\Client;
use WebSocket\Connection;
use WebSocket\Message\Message;

/**
 * The background job that keeps this app independent of the central platform:
 * it connects to the tenant Soketi websocket and upserts each device's
 * CURRENT state into the local database. No signal history, no incidents.
 *
 * Run under supervisord (see docker/supervisord.conf). Flow:
 *
 *   1. If the local devices table is empty, load it once via the Tenant API.
 *   2. Connect to Soketi and subscribe to the tenant's private channels,
 *      signing the subscription via /api/portal/broadcasting/auth with the
 *      tenant access key (Bearer) + X-Tenant-Id.
 *   3. Every signal event → SignalProcessor (device CURRENT state overwritten
 *      in place; unknown devices are auto-created).
 *   4. A periodic sweep flips silent devices to offline.
 */
class ListenSignals extends Command
{
    private const SWEEP_INTERVAL_SECONDS = 60;

    protected $signature = 'tenant:listen-signals
                            {--once : Exit after the first disconnect instead of reconnecting}';

    protected $description = 'Connect to the tenant websocket, log device signals, and calculate incidents';

    private ?string $socketId = null;

    private int $lastSweepAt = 0;

    public function handle(TenantApiClient $api, SignalProcessor $processor): int
    {
        $tenantId = (int) config('tenant.id');

        if ($tenantId === 0 || ! config('tenant.api_token')) {
            $this->error('APP_TENANT_ID and TENANT_API_TOKEN must be set.');

            return self::FAILURE;
        }

        // One-time initial load — afterwards the stream keeps us current.
        if (Device::count() === 0) {
            $this->info('Devices table empty — running initial sync.');
            $this->call('tenant:sync-devices');
        }

        $channels = [
            "private-tenant.{$tenantId}.device-logs",
            "private-tenant.{$tenantId}.locations",
        ];

        $backoff = 1;

        do {
            try {
                $this->listen($api, $processor, $channels);
                $backoff = 1;
            } catch (Throwable $e) {
                $this->warn("Connection lost: {$e->getMessage()}");
            }

            if (! $this->option('once')) {
                $this->line("Reconnecting in {$backoff}s…");
                sleep($backoff);
                $backoff = min($backoff * 2, 60);
            }
        } while (! $this->option('once'));

        return self::SUCCESS;
    }

    /** @param list<string> $channels */
    private function listen(TenantApiClient $api, SignalProcessor $processor, array $channels): void
    {
        $this->socketId = null;
        $client = new Client($this->socketUri());

        $client
            ->setTimeout(30)
            ->onText(function (Client $client, Connection $connection, Message $message) use ($api, $processor, $channels): void {
                $this->handleMessage($client, (string) $message->getContent(), $api, $channels, $processor);
            })
            ->onTick(function (Client $client) use ($processor): void {
                if (time() - $this->lastSweepAt < self::SWEEP_INTERVAL_SECONDS) {
                    return;
                }
                $this->lastSweepAt = time();
                $processor->markOfflineDevices();

                // Keep the Soketi connection alive between sparse signals.
                if ($this->socketId !== null && $client->isConnected()) {
                    $client->text(json_encode(['event' => 'pusher:ping']));
                }
            })
            ->onError(function (Client $client, ?Connection $connection, Throwable $e): void {
                $this->warn("Websocket error: {$e->getMessage()}");
            });

        $this->info("Connecting to {$this->socketUri()}");
        $client->start();
    }

    /** @param list<string> $channels */
    private function handleMessage(
        Client $client,
        string $raw,
        TenantApiClient $api,
        array $channels,
        SignalProcessor $processor,
    ): void {
        $message = json_decode($raw, true);

        if (! is_array($message) || ! isset($message['event'])) {
            return;
        }

        // Pusher protocol: the data field is a JSON-encoded string.
        $data = $message['data'] ?? [];
        if (is_string($data)) {
            $data = json_decode($data, true) ?: [];
        }

        switch ($message['event']) {
            case 'pusher:connection_established':
                $this->socketId = (string) $data['socket_id'];
                $this->info("Connected (socket {$this->socketId}) — subscribing…");

                foreach ($channels as $channel) {
                    $auth = $api->broadcastAuth($channel, $this->socketId);
                    $client->text(json_encode([
                        'event' => 'pusher:subscribe',
                        'data' => ['channel' => $channel, 'auth' => $auth['auth']],
                    ]));
                }
                break;

            case 'pusher_internal:subscription_succeeded':
                $this->info("Subscribed to {$message['channel']}");
                break;

            case 'pusher:ping':
                $client->text(json_encode(['event' => 'pusher:pong']));
                break;

            case 'pusher:error':
                $this->warn('Pusher error: '.json_encode($data));
                break;

            case 'pusher:pong':
                break;

            default:
                $processor->handleEvent($message['event'], $data);
        }
    }

    private function socketUri(): string
    {
        $config = config('broadcasting.connections.pusher');
        $scheme = ($config['options']['scheme'] ?? 'https') === 'https' ? 'wss' : 'ws';
        $host = $config['options']['host'] ?? 'localhost';
        $port = $config['options']['port'] ?? 6001;
        $key = $config['key'] ?? '';

        return "{$scheme}://{$host}:{$port}/app/{$key}?protocol=7&client=server-tenant&version=1.0";
    }
}
