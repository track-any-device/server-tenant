'use client';

import {
    usePlatformPageProps,
    usePlatformNavigate,
} from '@trackany-device/components';

interface Assignee {
    id: number;
    name: string;
    phone?: string;
    status: string;
    assignee_type?: { name: string };
    current_device_assignment?: {
        device?: { name: string; imei: string; status: string };
    };
}

interface PageProps {
    assignees: Assignee[];
}

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-600',
    on_leave: 'bg-yellow-100 text-yellow-700',
};

export default function AssigneesIndex() {
    const { assignees } = usePlatformPageProps<PageProps>();
    const navigate = usePlatformNavigate();

    return (
        <div className="space-y-4 p-6">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Assignees ({assignees.length})
            </h1>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                <table className="w-full text-sm">
                    <thead className="dark:bg-gray-750 bg-gray-50 text-xs text-gray-500 uppercase">
                        <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-left">Type</th>
                            <th className="px-4 py-3 text-left">Status</th>
                            <th className="px-4 py-3 text-left">Device</th>
                            <th className="px-4 py-3 text-left">Contact</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {assignees.map((a) => (
                            <tr
                                key={a.id}
                                onClick={() => navigate(`/assignees/${a.id}`)}
                                className="dark:hover:bg-gray-750 cursor-pointer transition-colors hover:bg-gray-50"
                            >
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                    {a.name}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {a.assignee_type?.name ?? '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[a.status] ?? 'bg-gray-100 text-gray-600'}`}
                                    >
                                        {a.status}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                    {a.current_device_assignment?.device
                                        ?.name ?? 'Unassigned'}
                                </td>
                                <td className="px-4 py-3 text-gray-500">
                                    {a.phone ?? '—'}
                                </td>
                            </tr>
                        ))}
                        {assignees.length === 0 && (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-4 py-8 text-center text-gray-400"
                                >
                                    No assignees found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
