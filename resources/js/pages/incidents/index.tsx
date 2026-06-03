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
    level: number;
    triggered_at: string;
    resolved_at: string | null;
    device?: { name: string; imei: string };
    assignee?: { name: string };
    beat?: { name: string };
}

interface PageProps {
    incidents: { data: Incident[]; total: number };
    filters: { status?: string };
}

const PRIORITY_COLORS: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
    open: 'bg-red-50 text-red-700 border border-red-200',
    acknowledged: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    escalated: 'bg-orange-50 text-orange-700 border border-orange-200',
    resolved: 'bg-green-50 text-green-700 border border-green-200',
};

export default function IncidentsIndex() {
    const { incidents } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Incidents ({incidents.total})
                </h1>
            </div>

            <div className="space-y-2">
                {incidents.data.map((incident) => (
                    <div
                        key={incident.id}
                        className="cursor-pointer rounded-xl border border-gray-200 bg-white px-5 py-4 transition-colors hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800"
                        onClick={() => navigate(`/incidents/${incident.id}`)}
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[incident.status] ?? ''}`}
                                    >
                                        {incident.status}
                                    </span>
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[incident.priority] ?? ''}`}
                                    >
                                        {incident.priority}
                                    </span>
                                    {incident.level > 1 && (
                                        <span className="text-xs font-semibold text-red-600">
                                            L{incident.level}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1.5 text-sm font-medium text-gray-900 dark:text-white">
                                    {incident.device?.name ?? '—'} —{' '}
                                    {incident.event_type}
                                </p>
                                <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-gray-500">
                                    {incident.beat && (
                                        <span>Beat: {incident.beat.name}</span>
                                    )}
                                    {incident.assignee && (
                                        <span>
                                            Assignee: {incident.assignee.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <time className="shrink-0 text-xs whitespace-nowrap text-gray-400">
                                {new Date(
                                    incident.triggered_at,
                                ).toLocaleString()}
                            </time>
                        </div>
                    </div>
                ))}
                {incidents.data.length === 0 && (
                    <div className="py-12 text-center text-gray-400">
                        No incidents found.
                    </div>
                )}
            </div>
        </div>
    );
}
