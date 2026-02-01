'use client';

import { ReferralWithMeta, Status } from '@/lib/db/schema';
import { ReferralCard } from './ReferralCard';
import { Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

interface KanbanColumnProps {
  title: string;
  status: Status;
  referrals: ReferralWithMeta[];
}

const columnConfig: Record<Status, {
  borderColor: string;
  headerClass: string;
  icon: React.ReactNode;
  countBg: string;
  titleClass: string;
}> = {
  pending: {
    borderColor: 'border-t-pending',
    headerClass: 'column-header-pending',
    icon: <Clock className="h-4 w-4 text-pending-foreground" />,
    countBg: 'bg-pending text-white dark:bg-pending/80',
    titleClass: 'text-pending-foreground',
  },
  scheduled: {
    borderColor: 'border-t-scheduled',
    headerClass: 'column-header-scheduled',
    icon: <Calendar className="h-4 w-4 text-scheduled-foreground" />,
    countBg: 'bg-scheduled text-white dark:bg-scheduled/80',
    titleClass: 'text-scheduled-foreground',
  },
  completed: {
    borderColor: 'border-t-completed',
    headerClass: 'column-header-completed',
    icon: <CheckCircle2 className="h-4 w-4 text-completed-foreground" />,
    countBg: 'bg-completed text-white dark:bg-completed/80',
    titleClass: 'text-completed-foreground',
  },
  missed: {
    borderColor: 'border-t-missed',
    headerClass: 'column-header-missed',
    icon: <XCircle className="h-4 w-4 text-missed-foreground" />,
    countBg: 'bg-missed text-white dark:bg-missed/80',
    titleClass: 'text-missed-foreground',
  },
  cancelled: {
    borderColor: 'border-t-missed',
    headerClass: 'column-header-missed',
    icon: <XCircle className="h-4 w-4 text-missed-foreground" />,
    countBg: 'bg-missed text-white dark:bg-missed/80',
    titleClass: 'text-missed-foreground',
  },
};

export function KanbanColumn({ title, status, referrals }: KanbanColumnProps) {
  const config = columnConfig[status];
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  // Sort overdue referrals to top for pending column
  const sortedReferrals = [...referrals].sort((a, b) => {
    if (status === 'pending') {
      const aOverdue = a.isOverdue;
      const bOverdue = b.isOverdue;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col min-h-[420px]">
      <div className={`rounded-t-xl border-t-4 px-4 py-3 border-x border-border/50 dark:border-border ${config.borderColor} ${config.headerClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {config.icon}
            <h3 className={`font-semibold text-[15px] tracking-tight ${config.titleClass}`}>{title}</h3>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold shadow-sm ${config.countBg}`}>
            {referrals.length}
          </span>
        </div>
      </div>
      <div
        ref={setNodeRef}
        className={`
          flex-1 space-y-3 overflow-y-auto rounded-b-xl p-3 custom-scrollbar border border-t-0 border-border
          transition-colors duration-200
          ${isOver ? 'bg-interactive-muted ring-2 ring-interactive ring-inset' : 'bg-surface-sunken'}
        `}
      >
        {sortedReferrals.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
        {referrals.length === 0 && (
          <div className={`py-12 text-center transition-colors ${isOver ? 'bg-interactive-muted/50 rounded-lg' : ''}`}>
            <div className="mx-auto w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-3">
              {config.icon}
            </div>
            <p className="text-sm text-muted-foreground/70">
              {isOver ? 'Drop here' : 'No referrals'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
