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
}

// Give this page a full-screen layout (no sidebar padding) by overriding
// the default PortalLayout with null — the layout wrapper still renders the
// sidebar but without the default content padding.
MapIndex.layout = undefined; // Use default PortalLayout — map fills AppContent area

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
    const mapRef        = useRef<HTMLDivElement>(null);
    const leafletMap    = useRef<any>(null);
    const markersRef    = useRef<Map<number, any>>(new Map());
    const pusherRef     = useRef<any>(null);

    // ── Leaflet map init ──────────────────────────────────────────────────────
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        import('leaflet').then((L) => {
            // Fix default marker icon paths (webpack/vite asset issue)
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Default center — Pakistan if no devices have coordinates
            const withCoords = devices.filter(d => d.last_lat != null && d.last_lon != null);
            const center: [number, number] = withCoords.length > 0
                ? [withCoords[0].last_lat!, withCoords[0].last_lon!]
                : [30.3753, 69.3451]; // Pakistan center

            const map = L.map(mapRef.current!).setView(center, withCoords.length > 0 ? 13 : 5);

            // OpenStreetMap tiles (falls back to the platform tile server if configured)
            const tileUrl = (window as any).__TAD_TILE_URL__ ?? 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
            L.tileLayer(tileUrl, {
                attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 18,
            }).addTo(map);

            // Initial markers
            withCoords.forEach((device) => {
                const marker = L.marker([device.last_lat!, device.last_lon!])
                    .addTo(map)
                    .bindPopup(devicePopup(device));
                markersRef.current.set(device.id, marker);
            });

            // Fit to markers if multiple devices
            if (withCoords.length > 1) {
                const bounds = L.latLngBounds(withCoords.map(d => [d.last_lat!, d.last_lon!]));
                map.fitBounds(bounds, { padding: [40, 40] });
            }

            leafletMap.current = map;
        });

        return () => {
            leafletMap.current?.remove();
            leafletMap.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Update markers when device positions change ───────────────────────────
    useEffect(() => {
        if (!leafletMap.current) return;

        import('leaflet').then((L) => {
            devices.forEach((device) => {
                if (device.last_lat == null || device.last_lon == null) return;

                const existing = markersRef.current.get(device.id);
                if (existing) {
                    existing.setLatLng([device.last_lat, device.last_lon]);
                    existing.setPopupContent(devicePopup(device));
                } else {
                    const marker = L.marker([device.last_lat, device.last_lon])
                        .addTo(leafletMap.current!)
                        .bindPopup(devicePopup(device));
                    markersRef.current.set(device.id, marker);
                }
            });
        });
    }, [devices]);

    // ── Pusher real-time updates ──────────────────────────────────────────────
    useEffect(() => {
        if (!pusherKey) return;

        import('pusher-js').then(({ default: Pusher }) => {
            const pusher = new Pusher(pusherKey, {
                cluster:          pusherCluster,
                wsHost:           pusherHost,
                wsPort:           pusherPort,
                wssPort:          pusherPort,
                forceTLS:         pusherScheme === 'https',
                disableStats:     true,
                channelAuthorization: {
                    endpoint:  '/broadcasting/auth',
                    transport: 'ajax',
                    headers: {
                        'X-CSRF-Token': (
                            document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement
                        )?.content ?? '',
                    },
                },
            });

            const ch = pusher.subscribe(`private-tenant.${tenantId}.locations`);

            ch.bind('App\\Events\\LocationsBatchEvent', (payload: LocationsBatchPayload) => {
                setDevices((prev) => {
                    const next = [...prev];
                    for (const pos of payload.positions) {
                        const idx = next.findIndex((d) => d.id === pos.device_id);
                        if (idx !== -1) {
                            next[idx] = {
                                ...next[idx],
                                last_lat:       pos.lat,
                                last_lon:       pos.lon,
                                battery_percent: pos.battery,
                                last_signal_at:  pos.recorded_at,
                            };
                        }
                    }
                    return next;
                });
            });

            pusherRef.current = pusher;
        });

        return () => { pusherRef.current?.disconnect(); };
    }, [pusherKey, pusherHost, pusherPort, pusherScheme, pusherCluster, tenantId]);

    const active = devices.filter(d => d.last_lat != null);

    return (
        <div className="flex flex-col h-full">
            {/* Header strip */}
            <div className="shrink-0 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-white">Live Map</h1>
                <span className="text-xs text-gray-500">
                    {active.length} / {devices.length} with location · real-time via Soketi
                </span>
            </div>

            {/* Leaflet map — fills remaining height */}
            <div ref={mapRef} className="flex-1 min-h-0" style={{ zIndex: 0 }} />
        </div>
    );
}

function devicePopup(device: DevicePosition): string {
    const battery = device.battery_percent != null ? `${device.battery_percent}%` : '—';
    const updated = device.last_signal_at
        ? new Date(device.last_signal_at).toLocaleTimeString()
        : '—';
    return `
        <div style="min-width:160px;font-family:sans-serif;font-size:13px">
            <strong style="display:block;margin-bottom:4px">${device.name}</strong>
            <div style="color:#6b7280;font-size:11px">${device.imei}</div>
            <div style="margin-top:6px;display:flex;gap:8px">
                <span>🔋 ${battery}</span>
                <span style="color:#6b7280">@ ${updated}</span>
            </div>
        </div>
    `;
}
