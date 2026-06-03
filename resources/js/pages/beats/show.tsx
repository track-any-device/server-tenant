'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface DeviceAssignment {
    device?: { id: number; name: string; imei: string; status: string };
}

interface Beat {
    id: number;
    name: string;
    description?: string;
    zone_type: 'inclusion' | 'exclusion';
    status: string;
    geo_fence_type: string;
    coordinates?: any;
    supervisor?: { name: string };
    children?: { id: number; name: string; zone_type: string }[];
    beat_assignments?: DeviceAssignment[];
}

interface PageProps {
    beat: Beat;
}

const ZONE_BADGE: Record<string, string> = {
    inclusion: 'bg-blue-100 text-blue-700',
    exclusion: 'bg-red-100 text-red-700',
};

export default function BeatShow() {
    const { beat } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/beats')}
                    className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                >
                    ← Beats
                </button>
                <span className="text-gray-300 dark:text-gray-600">/</span>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {beat.name}
                </h1>
                <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ZONE_BADGE[beat.zone_type] ?? 'bg-gray-100 text-gray-600'}`}
                >
                    {beat.zone_type === 'inclusion'
                        ? 'Inclusion Zone'
                        : 'Exclusion Zone'}
                </span>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Info */}
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                        Zone Info
                    </h2>
                    <dl className="space-y-2">
                        {[
                            ['Shape', beat.geo_fence_type],
                            ['Status', beat.status],
                            ['Supervisor', beat.supervisor?.name ?? '—'],
                            ['Sub-beats', beat.children?.length ?? 0],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="flex justify-between text-sm"
                            >
                                <dt className="text-gray-500">{label}</dt>
                                <dd className="font-medium text-gray-900 dark:text-white">
                                    {String(value)}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {beat.description && (
                        <p className="border-t border-gray-100 pt-3 text-sm text-gray-500 dark:border-gray-700">
                            {beat.description}
                        </p>
                    )}
                    <p className="text-xs text-gray-400 italic">
                        {beat.zone_type === 'inclusion'
                            ? 'Devices must stay inside — incident raised when they exit.'
                            : 'Devices must stay outside — incident raised when they enter.'}
                    </p>
                </div>

                {/* Assigned devices */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                        Assigned Devices ({beat.beat_assignments?.length ?? 0})
                    </h2>
                    {beat.beat_assignments &&
                    beat.beat_assignments.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {beat.beat_assignments.map((ba, i) => (
                                <li
                                    key={i}
                                    className="dark:hover:bg-gray-750 flex cursor-pointer items-center justify-between rounded px-1 py-2 hover:bg-gray-50"
                                    onClick={() =>
                                        ba.device &&
                                        navigate(`/devices/${ba.device.id}`)
                                    }
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {ba.device?.name ?? '—'}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {ba.device?.imei}
                                        </p>
                                    </div>
                                    <span
                                        className={`rounded px-1.5 py-0.5 text-xs ${
                                            ba.device?.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                        }`}
                                    >
                                        {ba.device?.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400">
                            No devices assigned to this beat.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
