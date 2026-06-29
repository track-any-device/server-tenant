'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface PageProps {
    deviceCount: number;
    onlineCount: number;
    tenant: { slug: string; id: number; name: string };
    auth: { user: { name: string } | null };
}

export default function Dashboard() {
    const { deviceCount, onlineCount, tenant, auth } =
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
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-green-400 dark:border-gray-700 dark:bg-gray-800"
                    onClick={() => navigate('/devices?status=online')}
                >
                    <p className="text-sm text-gray-500">Online Now</p>
                    <p className="mt-1 text-3xl font-bold text-green-600">
                        {onlineCount}
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
        </div>
    );
}
