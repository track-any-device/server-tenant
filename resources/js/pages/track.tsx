'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';

interface PublicDevice {
    imei: string;
    name: string;
    is_online: boolean;
    status: string;
    last_lat: number | null;
    last_lon: number | null;
    last_speed: number | null;
    battery_percent: number | null;
    last_signal_at: string | null;
    device_type: string | null;
}

interface PageProps {
    deviceId: string | null;
    device: PublicDevice | null;
    notFound: boolean;
    tenant: { slug: string; id: number; name: string };
}

// Public page — no sidebar, no auth. Opt out of the default PortalLayout.
TrackPage.layout = (page: ReactNode) => page;

export default function TrackPage() {
    const { deviceId, device, notFound, tenant } =
        usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();
    const [query, setQuery] = useState(deviceId ?? '');

    const submit = (e: FormEvent) => {
        e.preventDefault();
        const id = query.trim();

        if (id) {
            navigate(`/track/${encodeURIComponent(id)}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="mx-auto max-w-2xl px-4 py-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tenant.name}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Track a device — enter its ID to see where it is right
                        now.
                    </p>
                </div>

                {/* Lookup form */}
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-2 sm:flex-row"
                >
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter device ID (IMEI)"
                        autoFocus
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                    >
                        Track
                    </button>
                </form>

                {/* Not found */}
                {notFound && (
                    <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        No device found for{' '}
                        <span className="font-mono font-medium">
                            {deviceId}
                        </span>
                        . Check the ID and try again.
                    </div>
                )}

                {/* Result */}
                {device && <DeviceResult device={device} />}
            </div>
        </div>
    );
}

function DeviceResult({ device }: { device: PublicDevice }) {
    const hasLocation = device.last_lat != null && device.last_lon != null;

    return (
        <div className="mt-6 space-y-4">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                {/* Status header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                    <div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {device.name}
                        </p>
                        <p className="font-mono text-xs text-gray-400">
                            {device.imei}
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                            device.is_online
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                        }`}
                    >
                        {device.status}
                    </span>
                </div>

                {/* Stats */}
                <dl className="grid grid-cols-2 gap-px bg-gray-100 sm:grid-cols-3 dark:bg-gray-800">
                    <Stat
                        label="Battery"
                        value={
                            device.battery_percent != null
                                ? `${device.battery_percent}%`
                                : '—'
                        }
                        alert={
                            device.battery_percent != null &&
                            device.battery_percent < 20
                        }
                    />
                    <Stat
                        label="Speed"
                        value={
                            device.last_speed != null
                                ? `${device.last_speed} km/h`
                                : '—'
                        }
                    />
                    <Stat
                        label="Last seen"
                        value={
                            device.last_signal_at
                                ? new Date(
                                      device.last_signal_at,
                                  ).toLocaleString()
                                : '—'
                        }
                    />
                </dl>
            </div>

            {/* Map */}
            {hasLocation ? (
                <DeviceMap device={device} />
            ) : (
                <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-400 dark:border-gray-800 dark:bg-gray-900">
                    No location reported yet for this device.
                </div>
            )}
        </div>
    );
}

function Stat({
    label,
    value,
    alert,
}: {
    label: string;
    value: string;
    alert?: boolean;
}) {
    return (
        <div className="bg-white px-4 py-3 dark:bg-gray-900">
            <dt className="text-xs text-gray-500">{label}</dt>
            <dd
                className={`mt-0.5 text-sm font-medium ${
                    alert ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}
            >
                {value}
            </dd>
        </div>
    );
}

function DeviceMap({ device }: { device: PublicDevice }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<any>(null);

    useEffect(() => {
        if (
            !mapRef.current ||
            leafletMap.current ||
            device.last_lat == null ||
            device.last_lon == null
        ) {
            return;
        }

        import('leaflet').then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:
                    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!).setView(
                [device.last_lat!, device.last_lon!],
                14,
            );

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution:
                    '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
            }).addTo(map);

            L.marker([device.last_lat!, device.last_lon!])
                .addTo(map)
                .bindPopup(device.name);

            leafletMap.current = map;
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [device.imei]);

    return (
        <div
            ref={mapRef}
            className="h-80 w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800"
            style={{ zIndex: 0 }}
        />
    );
}
