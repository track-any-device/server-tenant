'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';
import { useState } from 'react';

interface Incident {
    id: number;
    event_type: string;
    status: string;
    priority: string;
    level: number;
    description?: string;
    triggered_at: string;
    resolved_at: string | null;
    resolution_notes: string | null;
    latitude: number | null;
    longitude: number | null;
    reopen_count: number;
    device?: { id: number; name: string; imei: string };
    assignee?: { id: number; name: string };
    beat?: { id: number; name: string };
}

interface PageProps {
    incident: Incident;
}

const STATUSES = [
    { value: 'open', label: 'Open' },
    { value: 'acknowledged', label: 'Acknowledge' },
    { value: 'escalated', label: 'Escalate' },
    { value: 'resolved', label: 'Resolve' },
];

const PRIORITY_COLORS: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-600',
};

export default function IncidentShow() {
    const { incident } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();
    const [notes, setNotes] = useState('');
    const [processing, setProcessing] = useState(false);

    const updateStatus = async (status: string) => {
        if (processing) {
            return;
        }

        setProcessing(true);

        try {
            await fetch(`/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? '',
                },
                body: JSON.stringify({
                    status,
                    resolution_notes: notes || undefined,
                }),
            });
            navigate(`/incidents/${incident.id}`, { replace: true });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/incidents')}
                        className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
                    >
                        ← Incidents
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {incident.device?.name ?? 'Unknown Device'} —{' '}
                            {incident.event_type}
                        </h1>
                        <div className="mt-1 flex items-center gap-2">
                            <span
                                className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[incident.priority] ?? ''}`}
                            >
                                {incident.priority}
                            </span>
                            <span className="text-xs text-gray-500">
                                Level {incident.level} ·{' '}
                                {new Date(
                                    incident.triggered_at,
                                ).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Details */}
                <div className="space-y-4 lg:col-span-2">
                    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">
                            Details
                        </h2>
                        <dl className="space-y-2">
                            {[
                                ['Status', incident.status],
                                ['Device', incident.device?.name ?? '—'],
                                ['Beat', incident.beat?.name ?? '—'],
                                ['Assignee', incident.assignee?.name ?? '—'],
                                [
                                    'Location',
                                    incident.latitude && incident.longitude
                                        ? `${incident.latitude.toFixed(5)}, ${incident.longitude.toFixed(5)}`
                                        : '—',
                                ],
                                [
                                    'Reopened',
                                    incident.reopen_count > 0
                                        ? `${incident.reopen_count}×`
                                        : 'Never',
                                ],
                                [
                                    'Resolved',
                                    incident.resolved_at
                                        ? new Date(
                                              incident.resolved_at,
                                          ).toLocaleString()
                                        : '—',
                                ],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between text-sm"
                                >
                                    <dt className="text-gray-500">{label}</dt>
                                    <dd className="font-medium text-gray-900 dark:text-white">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                        {incident.resolution_notes && (
                            <div className="mt-4 border-t border-gray-100 pt-4 dark:border-gray-700">
                                <p className="mb-1 text-xs text-gray-500">
                                    Resolution notes
                                </p>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    {incident.resolution_notes}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {incident.status !== 'resolved' && (
                    <div className="h-fit space-y-4 rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                            Update Status
                        </h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Resolution notes (optional)"
                            rows={3}
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <div className="space-y-2">
                            {STATUSES.filter(
                                (s) => s.value !== incident.status,
                            ).map((s) => (
                                <button
                                    key={s.value}
                                    onClick={() => updateStatus(s.value)}
                                    disabled={processing}
                                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                                        s.value === 'resolved'
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : s.value === 'escalated'
                                              ? 'bg-red-600 text-white hover:bg-red-700'
                                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
