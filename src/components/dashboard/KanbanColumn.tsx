'use client';

import { Referral, Status } from '@/lib/db/schema';
import { ReferralCard } from './ReferralCard';

interface KanbanColumnProps {
  title: string;
  status: Status;
  referrals: Referral[];
}

const columnColors: Record<Status, string> = {
  pending: 'border-t-amber-500',
  scheduled: 'border-t-blue-500',
  completed: 'border-t-green-500',
  missed: 'border-t-red-500',
};

export function KanbanColumn({ title, status, referrals }: KanbanColumnProps) {
  // Sort overdue referrals to top for pending column
  const sortedReferrals = [...referrals].sort((a, b) => {
    if (status === 'pending') {
      const aDays = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const bDays = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const aOverdue = aDays >= 14;
      const bOverdue = bDays >= 14;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col min-h-[400px]">
      <div className={`rounded-t-lg border-t-4 bg-gray-100 px-3 py-2 ${columnColors[status]}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-white px-2 py-0.5 text-sm">
            {referrals.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-b-lg bg-gray-50 p-3">
        {sortedReferrals.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
        {referrals.length === 0 && (
          <p className="py-8 text-center text-sm text-gray-500">
            No referrals
          </p>
        )}
      </div>
    </div>
  );
}
