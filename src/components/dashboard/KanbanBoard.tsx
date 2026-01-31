'use client';

import { useReferrals } from '@/lib/db/hooks';
import { KanbanColumn } from './KanbanColumn';
import { Status } from '@/lib/db/schema';

const columns: { title: string; status: Status }[] = [
  { title: 'Pending', status: 'pending' },
  { title: 'Scheduled', status: 'scheduled' },
  { title: 'Completed', status: 'completed' },
  { title: 'Missed', status: 'missed' },
];

export function KanbanBoard() {
  const { referrals, loading } = useReferrals();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-500">Loading referrals...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          status={column.status}
          referrals={referrals.filter((r) => r.status === column.status)}
        />
      ))}
    </div>
  );
}
