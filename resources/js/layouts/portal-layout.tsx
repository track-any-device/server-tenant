'use client';

import { usePlatformPageProps } from '@trackany-device/components';
import AppSidebarLayout from '@trackany-device/components/layouts/app/app-sidebar-layout';
import type { ReactNode } from 'react';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string; role?: string } | null;
    };
    tenant: { slug: string; id: number; name: string };
    flash: { success?: string | null; error?: string | null };
}

export default function PortalLayout({ children }: { children: ReactNode }) {
    const { auth, tenant } = usePlatformPageProps<SharedProps>();

    return (
        <AppSidebarLayout
            user={
                auth.user
                    ? { name: auth.user.name, email: auth.user.email }
                    : null
            }
            tenant={{ display_name: tenant?.name ?? 'Portal' }}
            logoutUrl="/logout"
            dashboardHref="/dashboard"
        >
            {children}
        </AppSidebarLayout>
    );
}
