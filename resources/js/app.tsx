'use client';

import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { Link, usePage, useForm, Head, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createInertiaAdapter, PlatformProvider } from '@trackany-device/components';
import { initializeTheme } from '@/hooks/use-appearance';

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
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
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
