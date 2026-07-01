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

// TAD-PAK brand — Pakistan flag green.
const BRAND = '#01411C';

// Public page — no sidebar, no auth. Opt out of the default PortalLayout.
TrackPage.layout = (page: ReactNode) => page;

export default function TrackPage() {
    const { deviceId, device, notFound, tenant } =
        usePlatformPageProps<PageProps>();

    // Two layouts: a centred search (auth style) until a device is found, then a
    // split view with the device card on the left and the live map on the right.
    return device ? (
        <DeviceFound device={device} tenant={tenant} />
    ) : (
        <DeviceSearch deviceId={deviceId} notFound={notFound} tenant={tenant} />
    );
}

/* ── Search — centred auth layout ──────────────────────────────────────── */
function DeviceSearch({
    deviceId,
    notFound,
    tenant,
}: Pick<PageProps, 'deviceId' | 'notFound' | 'tenant'>) {
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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {tenant.name}
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        Track a device — enter its ID to see where it is right
                        now.
                    </p>
                </div>

                <form onSubmit={submit} className="flex flex-col gap-3">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter device ID (IMEI)"
                        autoFocus
                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-[#01411C] focus:ring-2 focus:ring-[#01411C] focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        style={{ backgroundColor: BRAND }}
                        className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    >
                        Track device
                    </button>
                </form>

                {notFound && (
                    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        No device found for{' '}
                        <span className="font-mono font-medium">
                            {deviceId}
                        </span>
                        . Check the ID and try again.
                    </div>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    Don&rsquo;t see your device? Contact{' '}
                    <a
                        href="https://tadpak.pk"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: BRAND }}
                        className="font-semibold underline-offset-2 hover:underline dark:text-green-400"
                    >
                        tadpak.pk
                    </a>{' '}
                    to register your devices.
                </p>
            </div>
        </div>
    );
}

/* ── Found — split auth layout: device card (left) + live map (right) ──── */
function DeviceFound({
    device,
    tenant,
}: {
    device: PublicDevice;
    tenant: PageProps['tenant'];
}) {
    const navigate = usePlatformNavigate();
    const hasLocation = device.last_lat != null && device.last_lon != null;

    return (
        <div className="flex min-h-screen flex-col lg:flex-row">
            {/* Left: centred device card */}
            <div className="flex flex-1 items-center justify-center bg-gray-50 px-6 py-10 lg:w-1/2 dark:bg-gray-950">
                <div className="w-full max-w-md">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="mb-4 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
                    >
                        &larr; Track another device
                    </button>
                    <DeviceCard device={device} tenant={tenant} />
                </div>
            </div>

            {/* Right: live map */}
            <div className="relative min-h-[55vh] flex-1 bg-gray-100 lg:min-h-screen lg:w-1/2 dark:bg-gray-900">
                {hasLocation ? (
                    <DeviceMap device={device} />
                ) : (
                    <div className="flex h-full min-h-[55vh] items-center justify-center p-8 text-center text-sm text-gray-400">
                        No location reported yet for this device.
                    </div>
                )}
            </div>
        </div>
    );
}

function DeviceCard({
    device,
    tenant,
}: {
    device: PublicDevice;
    tenant: PageProps['tenant'];
}) {
    const hasLocation = device.last_lat != null && device.last_lon != null;

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <p className="text-xs font-medium tracking-wide text-gray-400 uppercase">
                {tenant.name}
            </p>

            <span
                className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    device.is_online
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                }`}
            >
                {device.status}
            </span>

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
                {device.name}
            </h2>
            <p className="mt-1 font-mono text-xs text-gray-400">
                {device.imei}
            </p>
            {device.device_type && (
                <p className="mt-1 text-xs text-gray-500">
                    {device.device_type}
                </p>
            )}

            <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-gray-100 pt-6 dark:border-gray-800">
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
                            ? new Date(device.last_signal_at).toLocaleString()
                            : '—'
                    }
                />
            </dl>

            {hasLocation && (
                <p className="mt-5 font-mono text-xs text-gray-400">
                    {device.last_lat!.toFixed(5)},{' '}
                    {device.last_lon!.toFixed(5)}
                </p>
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
        <div className="text-center">
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
        <div ref={mapRef} className="absolute inset-0" style={{ zIndex: 0 }} />
    );
}
