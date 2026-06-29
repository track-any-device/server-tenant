'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface Device {
    id: number;
    name: string;
    imei: string;
    status: string;
    last_lat: number | null;
    last_lon: number | null;
    last_speed: number | null;
    battery_percent: number | null;
    last_signal_at: string | null;
    device_type?: { name: string; slug: string };
}

interface PageProps {
    device: Device;
}

export default function DeviceShow() {
    const { device } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-6 p-6">
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
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        device.status === 'offline'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                    }`}
                >
                    {device.status}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Device info */}
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Device Info
                    </h2>
                    <dl className="space-y-2">
                        {[
                            ['IMEI', device.imei],
                            ['Type', device.device_type?.name ?? '—'],
                            ['Status', device.status],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between text-sm"
                            >
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                {/* Current state */}
                <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Current State
                    </h2>
                    <dl className="space-y-2">
                        {[
                            ['Latitude', device.last_lat?.toFixed(6) ?? '—'],
                            ['Longitude', device.last_lon?.toFixed(6) ?? '—'],
                            [
                                'Speed',
                                device.last_speed != null
                                    ? `${device.last_speed} km/h`
                                    : '—',
                            ],
                            [
                                'Battery',
                                device.battery_percent != null
                                    ? `${device.battery_percent}%`
                                    : '—',
                            ],
                            [
                                'Last signal',
                                device.last_signal_at
                                    ? new Date(
                                          device.last_signal_at,
                                      ).toLocaleString()
                                    : '—',
                            ],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between text-sm"
                            >
                                <dt className="text-gray-500">{label}</dt>
                                <dd
                                    className={`font-medium ${
                                        label === 'Battery' &&
                                        device.battery_percent != null &&
                                        device.battery_percent < 20
                                            ? 'text-red-600'
                                            : 'text-gray-900 dark:text-white'
                                    }`}
                                >
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
}
