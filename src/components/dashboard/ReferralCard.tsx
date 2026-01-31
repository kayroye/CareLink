'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, MapPin, AlertCircle } from 'lucide-react';
import { Referral, FACILITIES } from '@/lib/db/schema';

interface ReferralCardProps {
  referral: Referral;
}

const priorityStyles: Record<string, string> = {
  low: 'badge-low',
  medium: 'badge-medium',
  high: 'badge-high',
  critical: 'badge-critical',
};

export function ReferralCard({ referral }: ReferralCardProps) {
  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const createdDate = new Date(referral.createdAt);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = referral.status === 'pending' && daysSinceCreated >= 14;

  return (
    <Link href={`/patient/${referral.id}`}>
      <Card className={`
        cursor-pointer card-elevated bg-white
        ${isOverdue ? 'border-red-400 border-2 card-overdue' : 'border-transparent'}
      `}>
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-[15px] leading-tight tracking-tight truncate">
                {referral.patientName}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">{referral.referralType}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {referral.synced ? (
                <div className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              ) : (
                <div className="flex items-center gap-1 text-amber-500 sync-pulse">
                  <Clock className="h-4 w-4" />
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {referral.diagnosis}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{facility?.name}</span>
              <span className="text-muted-foreground/60">·</span>
              <span className="font-medium text-foreground/70">{facility?.distance}</span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${priorityStyles[referral.priority]}`}>
                {referral.priority}
              </span>
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-red-500 text-white font-semibold uppercase tracking-wide">
                  <AlertCircle className="h-3 w-3" />
                  Overdue
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
