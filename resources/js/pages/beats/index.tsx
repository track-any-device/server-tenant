'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface Beat {
    id: number;
    name: string;
    description?: string;
    zone_type: 'inclusion' | 'exclusion';
    status: string;
    geo_fence_type: string;
    supervisor?: { name: string };
    children?: Beat[];
    beat_assignments?: { device?: { name: string } }[];
}

interface PageProps {
    beats: Beat[];
}

const ZONE_COLORS: Record<string, string> = {
    inclusion: 'bg-blue-100 text-blue-700',
    exclusion: 'bg-red-100 text-red-700',
};

export default function BeatsIndex() {
    const { beats } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-4 p-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Beats & Boundaries ({beats.length})
            </h1>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {beats.map((beat) => (
                    <div
                        key={beat.id}
                        onClick={() => navigate(`/beats/${beat.id}`)}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-700"
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                {beat.name}
                            </h3>
                            <span
                                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ZONE_COLORS[beat.zone_type] ?? 'bg-gray-100 text-gray-600'}`}
                            >
                                {beat.zone_type}
                            </span>
                        </div>

                        {beat.description && (
                            <p className="mt-1.5 line-clamp-2 text-xs text-gray-500">
                                {beat.description}
                            </p>
                        )}

                        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                            <span>{beat.geo_fence_type}</span>
                            {beat.supervisor && (
                                <span>· {beat.supervisor.name}</span>
                            )}
                            {beat.children && beat.children.length > 0 && (
                                <span>· {beat.children.length} sub-beats</span>
                            )}
                        </div>
                    </div>
                ))}
                {beats.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        No beats defined yet.
                    </div>
                )}
            </div>
        </div>
    );
}
