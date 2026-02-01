'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ChevronLeft, MapPin, CalendarX, RefreshCw, User } from 'lucide-react';
import { useReferrals, useUser } from '@/lib/db/hooks';
import { FACILITIES } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RequestModal } from '@/components/patient/RequestModal';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Awaiting Scheduling', tone: 'bg-pending-muted text-pending-foreground' },
  scheduled: { label: 'Appointment Scheduled', tone: 'bg-scheduled-muted text-scheduled-foreground' },
  completed: { label: 'Completed', tone: 'bg-completed-muted text-completed-foreground' },
  missed: { label: 'Missed - Please Contact Us', tone: 'bg-missed-muted text-missed-foreground' },
  cancelled: { label: 'Cancelled', tone: 'bg-muted text-muted-foreground' },
};

export default function ReferralDetailPage() {
  const params = useParams<{ id: string }>();
  const { referrals, loading, submitRequest } = useReferrals();
  const [requestType, setRequestType] = useState<'reschedule' | 'cancel' | null>(null);

  const referral = referrals.find((item) => item.id === params.id);
  const facility = referral ? FACILITIES.find((item) => item.id === referral.facilityId) : null;
  const { user: nurse } = useUser(referral?.createdByNurseId);

  const canRequest = referral?.status === 'scheduled' && !referral.pendingRequest;
  const hasPendingRequest = !!referral?.pendingRequest;

  const handleSubmitRequest = async (requestedDate?: string, reason?: string) => {
    if (!referral || !requestType) return;

    try {
      await submitRequest(referral.id, requestType, requestedDate, reason);
      toast.success(
        requestType === 'reschedule'
          ? 'Reschedule request submitted. A nurse will contact you.'
          : 'Cancellation request submitted. A nurse will review it.'
      );
      setRequestType(null);
    } catch {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-lg text-muted-foreground">Loading referral details...</p>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="space-y-6">
        <Link href="/my-referrals" className="inline-flex items-center gap-2 text-accent">
          <ChevronLeft className="h-4 w-4" />
          Back to referrals
        </Link>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">Referral not found</h1>
            <p className="text-muted-foreground">
              This referral is no longer available. Please return to your referrals list.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[referral.status] ?? {
    label: referral.status,
    tone: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <Link href="/my-referrals" className="inline-flex items-center gap-2 text-accent">
        <ChevronLeft className="h-4 w-4" />
        Back to referrals
      </Link>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{referral.referralType}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{facility?.name ?? 'Unknown Facility'}</span>
            </div>
          </div>

          <Badge className={`text-sm px-3 py-1 ${statusInfo.tone}`}>{statusInfo.label}</Badge>

          {/* Pending Request Notice */}
          {hasPendingRequest && referral.pendingRequest && (
            <div className="p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted">
              <p className="font-medium text-scheduled-foreground">
                {referral.pendingRequest.type === 'reschedule'
                  ? 'Reschedule Request Pending'
                  : 'Cancellation Request Pending'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Submitted{' '}
                {new Date(referral.pendingRequest.requestedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                . A nurse will review your request soon.
              </p>
            </div>
          )}

          {/* About Your Referral - Patient-friendly summary */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">About Your Referral</p>
            <p className="text-base text-foreground">{referral.patientSummary}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Facility Address</p>
            <p className="text-base text-foreground">{facility?.address ?? 'Address not available'}</p>
          </div>

          {/* Care Coordinator */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <User className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="text-sm text-muted-foreground">Your Care Coordinator</p>
              <p className="text-base font-medium text-foreground">{nurse?.name ?? 'Care Team'}</p>
              {nurse?.phone && (
                <p className="text-sm text-muted-foreground">{nurse.phone}</p>
              )}
            </div>
          </div>

          {referral.appointmentDate && (
            <div className="flex items-center gap-3 p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted">
              <Calendar className="h-5 w-5 text-scheduled-foreground" />
              <div>
                <p className="text-sm text-scheduled-foreground">Appointment Date</p>
                <p className="text-base text-foreground">
                  {new Date(referral.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Request Buttons */}
          {canRequest && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setRequestType('reschedule')}
              >
                <RefreshCw className="h-4 w-4" />
                Request Reschedule
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setRequestType('cancel')}
              >
                <CalendarX className="h-4 w-4" />
                Request Cancellation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      <RequestModal
        open={requestType !== null}
        onOpenChange={(open) => !open && setRequestType(null)}
        type={requestType ?? 'reschedule'}
        currentDate={referral.appointmentDate}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}
