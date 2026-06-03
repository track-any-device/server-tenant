'use client';

import { usePlatformPageProps, usePlatformNavigate } from '@trackany-device/components';

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
    const { deviceCount, openIncidents, tenant, auth } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {tenant.name}
                </h1>
                {auth.user && (
                    <p className="text-sm text-gray-500 mt-1">Welcome, {auth.user.name}</p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-blue-400 transition-colors"
                    onClick={() => navigate('/devices')}
                >
                    <p className="text-sm text-gray-500">Total Devices</p>
                    <p className="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{deviceCount}</p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-orange-400 transition-colors"
                    onClick={() => navigate('/incidents?status=open')}
                >
                    <p className="text-sm text-gray-500">Open Incidents</p>
                    <p className="mt-1 text-3xl font-bold text-orange-600">{openIncidents.total}</p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:border-green-400 transition-colors"
                    onClick={() => navigate('/map')}
                >
                    <p className="text-sm text-gray-500">Live Map</p>
                    <p className="mt-1 text-sm font-medium text-green-600">View all devices →</p>
                </div>
            </div>

            {/* Recent open incidents */}
            {openIncidents.data.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Incidents</h2>
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
                                className="px-5 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                                onClick={() => navigate(`/incidents/${incident.id}`)}
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {incident.device?.name ?? `Device #${incident.id}`}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">{incident.event_type}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                    incident.priority === 'critical'
                                        ? 'bg-red-100 text-red-700'
                                        : incident.priority === 'high'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-gray-100 text-gray-600'
                                }`}>
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
