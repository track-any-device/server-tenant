'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface Incident {
    id: number;
    event_type: string;
    status: string;
    priority: string;
    triggered_at: string;
    device?: { name: string; imei: string };
}

interface PageProps {
    deviceCount: number;
    openIncidents: { data: Incident[]; total: number };
    tenant: { slug: string; id: number; name: string };
    auth: { user: { name: string } | null };
}

export default function Dashboard() {
    const { deviceCount, openIncidents, tenant, auth } =
        usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {tenant.name}
                </h1>
                {auth.user && (
                    <p className="mt-1 text-sm text-gray-500">
                        Welcome, {auth.user.name}
                    </p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-blue-400 dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => navigate('/devices')}
                >
                    <p className="text-sm text-gray-500">Total Devices</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">
                        {deviceCount}
                    </p>
                </div>

                <div
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-orange-400 dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => navigate('/incidents?status=open')}
                >
                    <p className="text-sm text-gray-500">Open Incidents</p>
                    <p className="mt-1 text-3xl font-bold text-orange-600">
                        {openIncidents.total}
                    </p>
                </div>

                <div
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-green-400 dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => navigate('/map')}
                >
                    <p className="text-sm text-gray-500">Live Map</p>
                    <p className="mt-1 text-sm font-medium text-green-600">
                        View all devices →
                    </p>
                </div>
            </div>

            {/* Recent open incidents */}
            {openIncidents.data.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-700">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Recent Incidents
                        </h2>
                        <button
                            onClick={() => navigate('/incidents?status=open')}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            View all
                        </button>
                    </div>
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {openIncidents.data.map((incident) => (
                            <li
                                key={incident.id}
                                className="dark:hover:bg-gray-750 flex cursor-pointer items-center justify-between px-5 py-3 hover:bg-gray-50"
                                onClick={() =>
                                    navigate(`/incidents/${incident.id}`)
                                }
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {incident.device?.name ??
                                            `Device #${incident.id}`}
                                    </p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {incident.event_type}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                        incident.priority === 'critical'
                                            ? 'bg-red-100 text-red-700'
                                            : incident.priority === 'high'
                                              ? 'bg-orange-100 text-orange-700'
                                              : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                    {incident.priority}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
