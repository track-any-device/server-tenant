'use client';

import { usePlatformPageProps, usePlatformNavigate } from '@trackany-device/components';

interface Signal {
    lat: number | null;
    lon: number | null;
    battery: number | null;
    speed: number | null;
    recorded_at: string | null;
}

interface Device {
    id: number;
    name: string;
    imei: string;
    status: string;
    onboarding_status: string;
    gsm_number?: string;
    last_lat: number | null;
    last_lon: number | null;
    last_speed: number | null;
    battery_percent: number | null;
    last_signal_at: string | null;
    device_type?: { name: string; slug: string };
    current_assignment?: { assignee?: { name: string; id: number } };
}

interface PageProps {
    device: Device;
    signals: Signal;
}

export default function DeviceShow() {
    const { device, signals } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/devices')}
                    className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    ← Devices
                </button>
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {device.name}
                </h1>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    device.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                }`}>
                    {device.status}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Device info */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Device Info</h2>
                    <dl className="space-y-2">
                        {[
                            ['IMEI', device.imei],
                            ['Type', device.device_type?.name ?? '—'],
                            ['Status', device.onboarding_status],
                            ['Assignee', device.current_assignment?.assignee?.name ?? 'Unassigned'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm">
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Last signal */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Last Signal</h2>
                    <dl className="space-y-2">
                        {[
                            ['Latitude', signals.lat?.toFixed(6) ?? '—'],
                            ['Longitude', signals.lon?.toFixed(6) ?? '—'],
                            ['Speed', signals.speed != null ? `${signals.speed} km/h` : '—'],
                            ['Battery', signals.battery != null ? `${signals.battery}%` : '—'],
                            ['Recorded', signals.recorded_at
                                ? new Date(signals.recorded_at).toLocaleString()
                                : '—'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between text-sm">
                                <dt className="text-gray-500">{label}</dt>
                                <dd className={`font-medium ${
                                    label === 'Battery' && signals.battery != null && signals.battery < 20
                                        ? 'text-red-600'
                                        : 'text-gray-900 dark:text-white'
                                }`}>{value}</dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
