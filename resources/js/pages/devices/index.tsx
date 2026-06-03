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
    battery_percent: number | null;
    last_signal_at: string | null;
    device_type?: { name: string };
    current_assignment?: { assignee?: { name: string } };
}

interface PageProps {
    devices: {
        data: Device[];
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: { search?: string; status?: string };
}

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    offline: 'bg-red-100 text-red-700',
    inventory: 'bg-blue-100 text-blue-700',
};

export default function DevicesIndex() {
    const { devices } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Devices ({devices.total})
                </h1>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full text-sm">
                    <thead className="dark:bg-gray-750 bg-gray-50 text-xs tracking-wider text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Device</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Assignee</th>
                            <th className="px-4 py-3 text-left">Battery</th>
                            <th className="px-4 py-3 text-left">Last signal</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {devices.data.map((device) => (
                            <tr
                                key={device.id}
                                className="dark:hover:bg-gray-750 cursor-pointer transition-colors hover:bg-gray-50"
                                onClick={() =>
                                    navigate(`/devices/${device.id}`)
                                }
                            >
                                <td className="px-4 py-3">
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {device.name}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {device.imei}
                                    </p>
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[device.status] ?? 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {device.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {device.current_assignment?.assignee
                                        ?.name ?? '—'}
                                </td>
                                <td className="px-4 py-3">
                                    {device.battery_percent != null ? (
                                        <span
                                            className={
                                                device.battery_percent < 20
                                                    ? 'font-medium text-red-600'
                                                    : 'text-gray-600 dark:text-gray-300'
                                            }
                                        >
                                            {device.battery_percent}%
                                        </span>
                                    ) : (
                                        <span className="text-gray-400">—</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    {device.last_signal_at
                                        ? new Date(
                                              device.last_signal_at,
                                          ).toLocaleString()
                                        : '—'}
                                </td>
                            </tr>
                        ))}
                        {devices.data.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No devices found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
