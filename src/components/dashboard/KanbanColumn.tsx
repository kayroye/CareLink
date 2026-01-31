'use client';

import { Referral, Status } from '@/lib/db/schema';
import { ReferralCard } from './ReferralCard';
import { Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

interface KanbanColumnProps {
  title: string;
  status: Status;
  referrals: Referral[];
}

const columnConfig: Record<Status, {
  borderColor: string;
  headerClass: string;
  icon: React.ReactNode;
  countBg: string;
}> = {
  pending: {
    borderColor: 'border-t-amber-400',
    headerClass: 'column-header-pending',
    icon: <Clock className="h-4 w-4 text-amber-600" />,
    countBg: 'bg-amber-100 text-amber-700',
  },
  scheduled: {
    borderColor: 'border-t-sky-400',
    headerClass: 'column-header-scheduled',
    icon: <Calendar className="h-4 w-4 text-sky-600" />,
    countBg: 'bg-sky-100 text-sky-700',
  },
  completed: {
    borderColor: 'border-t-emerald-400',
    headerClass: 'column-header-completed',
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    countBg: 'bg-emerald-100 text-emerald-700',
  },
  missed: {
    borderColor: 'border-t-red-400',
    headerClass: 'column-header-missed',
    icon: <XCircle className="h-4 w-4 text-red-500" />,
    countBg: 'bg-red-100 text-red-600',
  },
};

export function KanbanColumn({ title, status, referrals }: KanbanColumnProps) {
  const config = columnConfig[status];

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
    <div className="flex flex-col min-h-[420px]">
      <div className={`rounded-t-xl border-t-4 px-4 py-3 ${config.borderColor} ${config.headerClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <h3 className="font-semibold text-[15px] tracking-tight">{title}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.countBg}`}>
            {referrals.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-b-xl bg-white/50 p-3 custom-scrollbar border border-t-0 border-gray-100">
        {sortedReferrals.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
        {referrals.length === 0 && (
          <div className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              {config.icon}
            </div>
            <p className="text-sm text-muted-foreground">No referrals</p>
          </div>
        )}
      </div>
    </div>
  );
}
