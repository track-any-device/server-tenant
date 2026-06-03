'use client';

import { createInertiaApp } from '@inertiajs/react';
import { Link, usePage, useForm, Head, router } from '@inertiajs/react';
import { createInertiaAdapter, PlatformProvider } from '@trackany-device/components';
import type {ReactNode} from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from '@/hooks/use-appearance';
import PortalLayout from '@/layouts/portal-layout';

const appName = import.meta.env.VITE_APP_NAME || 'Fleet Portal';

const adapter = createInertiaAdapter({
    Link,
    usePage,
    useForm: useForm as any,
    Head,
    router,
});

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');
        const page = (await pages[`./pages/${name}.tsx`]()) as { default: any };
        // Set PortalLayout as the default persistent layout for every portal page.
        // Pages that need a different layout (e.g. a full-screen map without sidebar)
        // can override by setting their own `.layout` export.
        page.default.layout ??= (page: ReactNode) => <PortalLayout>{page}</PortalLayout>;

        return page.default;
    },
    setup({ el, App, props }) {
        createRoot(el).render(
            <PlatformProvider adapter={adapter}>
                <App {...props} />
            </PlatformProvider>,
        );
    },
    progress: { color: '#4B5563' },
});

initializeTheme();
