'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, MapPin } from 'lucide-react';
import { Referral, FACILITIES } from '@/lib/db/schema';

interface ReferralCardProps {
  referral: Referral;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function ReferralCard({ referral }: ReferralCardProps) {
  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const createdDate = new Date(referral.createdAt);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = referral.status === 'pending' && daysSinceCreated >= 14;

  return (
    <Link href={`/patient/${referral.id}`}>
      <Card className={`cursor-pointer transition-shadow hover:shadow-md ${isOverdue ? 'border-red-500 border-2' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{referral.patientName}</h3>
              <p className="text-sm text-gray-500">{referral.referralType}</p>
            </div>
            <div className="flex items-center gap-1">
              {referral.synced ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm line-clamp-2">{referral.diagnosis}</p>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{facility?.name} ({facility?.distance})</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={priorityColors[referral.priority]}>
                {referral.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">OVERDUE</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
