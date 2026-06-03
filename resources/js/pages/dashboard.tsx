'use client';

import { usePlatformPageProps } from '@trackany-device/components';

interface PageProps {
    tenant: { slug: string; id: number; name: string };
    auth: { user: { name: string; email: string } | null };
}

export default function Dashboard() {
    const { tenant, auth } = usePlatformPageProps<PageProps>();

    return (
        <div className="p-8">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {tenant.name} — Dashboard
            </h1>
            {auth.user && (
                <p className="mt-2 text-sm text-gray-500">
                    Signed in as {auth.user.name}
                </p>
            )}
        </div>
    );
}
