'use client';

import { useEffect, useRef, useState } from 'react';
import { usePlatformPageProps } from '@trackany-device/components';

interface DevicePosition {
    id: number;
    name: string;
    imei: string;
    status: string;
    last_lat: number | null;
    last_lon: number | null;
    battery_percent: number | null;
    last_signal_at: string | null;
}

interface LocationsBatchPayload {
    positions: Array<{
        device_id: number;
        lat: number;
        lon: number;
        battery: number | null;
        recorded_at: string;
    }>;
}

interface PageProps {
    devices: DevicePosition[];
    tenantId: number;
    pusherKey: string;
    pusherHost: string;
    pusherPort: number;
    pusherScheme: string;
    pusherCluster: string;
    tenant: { id: number };
}

export default function MapIndex() {
    const {
        devices: initialDevices,
        tenantId,
        pusherKey,
        pusherHost,
        pusherPort,
        pusherScheme,
        pusherCluster,
    } = usePlatformPageProps<PageProps>();

    const [devices, setDevices] = useState<DevicePosition[]>(initialDevices);
    const pusherRef = useRef<any>(null);

    useEffect(() => {
        if (!pusherKey) return;

        // Dynamically import Pusher to keep it out of the initial bundle
        import('pusher-js').then(({ default: Pusher }) => {
            const pusher = new Pusher(pusherKey, {
                cluster: pusherCluster,
                wsHost: pusherHost,
                wsPort: pusherPort,
                wssPort: pusherPort,
                forceTLS: pusherScheme === 'https',
                disableStats: true,
                // Auth proxied through this portal's /broadcasting/auth
                // which in turn calls the central platform for signing.
                channelAuthorization: {
                    endpoint: '/broadcasting/auth',
                    transport: 'ajax',
                    headers: {
                        'X-CSRF-Token': (
                            document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
                        )?.content ?? '',
                    },
                },
            });

            const channel = pusher.subscribe(`private-tenant.${tenantId}.locations`);

            channel.bind('App\\Events\\LocationsBatchEvent', (payload: LocationsBatchPayload) => {
                setDevices((prev) => {
                    const next = [...prev];
                    for (const pos of payload.positions) {
                        const idx = next.findIndex((d) => d.id === pos.device_id);
                        if (idx !== -1) {
                            next[idx] = {
                                ...next[idx],
                                last_lat: pos.lat,
                                last_lon: pos.lon,
                                battery_percent: pos.battery,
                                last_signal_at: pos.recorded_at,
                            };
                        }
                    }
                    return next;
                });
            });

            pusherRef.current = pusher;
        });

        return () => {
            pusherRef.current?.disconnect();
        };
    }, [pusherKey, pusherHost, pusherPort, pusherScheme, pusherCluster, tenantId]);

    const active = devices.filter((d) => d.last_lat != null && d.last_lon != null);

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Live Map</h1>
                <span className="text-sm text-gray-500">
                    {active.length} / {devices.length} devices with location
                </span>
            </div>

            {/* Map placeholder — wire to Google Maps or Leaflet with offline tiles */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 h-[60vh] flex items-center justify-center">
                <div className="text-center space-y-2">
                    <p className="text-gray-400 text-sm">Map component goes here</p>
                    <p className="text-gray-300 text-xs">
                        Connected to private-tenant.{tenantId}.locations
                    </p>
                </div>
            </div>

            {/* Device list with live positions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-750 text-xs uppercase text-gray-500">
                        <tr>
                            <th className="px-4 py-3 text-left">Device</th>
                            <th className="px-4 py-3 text-left">Lat</th>
                            <th className="px-4 py-3 text-left">Lon</th>
                            <th className="px-4 py-3 text-left">Battery</th>
                            <th className="px-4 py-3 text-left">Last update</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {devices.map((d) => (
                            <tr key={d.id}>
                                <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{d.name}</td>
                                <td className="px-4 py-2 text-gray-500">{d.last_lat?.toFixed(6) ?? '—'}</td>
                                <td className="px-4 py-2 text-gray-500">{d.last_lon?.toFixed(6) ?? '—'}</td>
                                <td className="px-4 py-2 text-gray-500">
                                    {d.battery_percent != null ? `${d.battery_percent}%` : '—'}
                                </td>
                                <td className="px-4 py-2 text-gray-400 text-xs">
                                    {d.last_signal_at
                                        ? new Date(d.last_signal_at).toLocaleTimeString()
                                        : '—'
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
