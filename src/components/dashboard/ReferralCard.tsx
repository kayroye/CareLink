'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Clock, CheckCircle2, MapPin, AlertCircle, GripVertical } from 'lucide-react';
import { ReferralWithMeta, FACILITIES } from '@/lib/db/schema';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface ReferralCardProps {
  referral: ReferralWithMeta;
  isDragging?: boolean;
}

const priorityStyles: Record<string, string> = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
};

export function ReferralCard({ referral, isDragging: isDraggingOverlay }: ReferralCardProps) {
  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const isOverdue = referral.isOverdue;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: referral.id,
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  const cardContent = (
    <Card
      className={`
        cursor-pointer card-elevated bg-card
        ${isOverdue ? 'border-destructive border-2 card-overdue' : 'border-border'}
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        ${isDraggingOverlay ? 'shadow-2xl border-interactive border-2' : ''}
      `}
    >
      <CardHeader className="pb-2 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[15px] leading-tight tracking-tight truncate text-foreground">
              {referral.patientName}
            </h3>
            <p className="text-sm text-muted-foreground/90 dark:text-muted-foreground mt-0.5">{referral.referralType}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {!isDraggingOverlay && (
              <div
                {...listeners}
                {...attributes}
                className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing touch-none"
                onClick={(e) => e.preventDefault()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {referral.isSynced ? (
              <div className="flex items-center gap-1 text-completed-foreground">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-pending-foreground sync-pulse">
                <Clock className="h-4 w-4" />
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground/90 dark:text-muted-foreground line-clamp-2 leading-relaxed">
            {referral.diagnosis}
          </p>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80 dark:text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{facility?.name}</span>
            <span className="text-muted-foreground/50 dark:text-muted-foreground/60">·</span>
            <span className="font-medium text-foreground/80 dark:text-foreground/90">{facility?.distance}</span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${priorityStyles[referral.priority]}`}>
              {referral.priority}
            </span>
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-destructive text-destructive-foreground font-semibold uppercase tracking-wide">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // When being used as overlay, don't wrap in Link or draggable container
  if (isDraggingOverlay) {
    return cardContent;
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Link href={`/patient/${referral.id}`} className={isDragging ? 'pointer-events-none' : ''}>
        {cardContent}
      </Link>
    </div>
  );
}
