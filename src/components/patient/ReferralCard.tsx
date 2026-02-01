'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Status, FACILITIES, FacilityId } from '@/lib/db/schema';

interface ReferralCardProps {
  referralType: string;
  facilityId: FacilityId;
  status: Status;
  appointmentDate?: string;
  onViewDetails?: () => void;
}

const STATUS_CONFIG: Record<Status, { label: string; step: number; color: string; bgColor: string }> = {
  pending: {
    label: 'Awaiting Scheduling',
    step: 1,
    color: 'text-pending-foreground',
    bgColor: 'bg-pending-muted',
  },
  scheduled: {
    label: 'Appointment Scheduled',
    step: 2,
    color: 'text-scheduled-foreground',
    bgColor: 'bg-scheduled-muted',
  },
  completed: {
    label: 'Completed',
    step: 4,
    color: 'text-completed-foreground',
    bgColor: 'bg-completed-muted',
  },
  missed: {
    label: 'Missed - Please Contact Us',
    step: 2,
    color: 'text-missed-foreground',
    bgColor: 'bg-missed-muted',
  },
  cancelled: {
    label: 'Cancelled',
    step: 2,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

function getStatusStep(status: Status): number {
  return STATUS_CONFIG[status].step;
}

function getNextAction(status: Status, appointmentDate?: string): string {
  switch (status) {
    case 'pending':
      return 'We are working on scheduling your appointment';
    case 'scheduled':
      return appointmentDate
        ? `Please attend your appointment on ${new Date(appointmentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}`
        : 'Your appointment date will be confirmed soon';
    case 'completed':
      return 'Your referral has been completed. Thank you!';
    case 'missed':
      return 'You missed your scheduled appointment. Please request a callback to reschedule.';
    case 'cancelled':
      return 'This referral has been cancelled. Please contact your provider if you need assistance.';
    default:
      return '';
  }
}

export function ReferralCard({
  referralType,
  facilityId,
  status,
  appointmentDate,
  onViewDetails,
}: ReferralCardProps) {
  const facility = FACILITIES.find((f) => f.id === facilityId);
  const currentStep = getStatusStep(status);
  const statusConfig = STATUS_CONFIG[status];
  const nextAction = getNextAction(status, appointmentDate);
  const progressColor = status === 'missed' ? 'bg-destructive' : 'bg-accent';

  return (
    <Card className="bg-card shadow-md hover:shadow-lg transition-shadow border-border">
      <CardContent className="p-6 space-y-6">
        {/* Header with Referral Type and Facility */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-foreground">{referralType}</h3>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5 text-accent" />
            <span className="text-lg">{facility?.name || 'Unknown Facility'}</span>
          </div>
        </div>

        {/* Status Badge */}
        <Badge className={cn('text-base px-4 py-1.5', statusConfig.bgColor, statusConfig.color)}>
          {statusConfig.label}
        </Badge>

        {/* Progress Indicator */}
        <div className="space-y-3">
          <p className="text-base font-medium text-foreground">
            Step {currentStep} of 4: {statusConfig.label}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={cn(
                  'h-3 flex-1 rounded-full transition-colors',
                  step <= currentStep ? progressColor : 'bg-muted'
                )}
              />
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Pending</span>
            <span>Scheduled</span>
            <span>Attended</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Appointment Date (if scheduled) */}
        {appointmentDate && status === 'scheduled' && (
          <div className="flex items-center gap-3 p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted">
            <Calendar className="h-6 w-6 text-scheduled-foreground" />
            <div>
              <p className="text-base font-medium text-scheduled-foreground">Appointment Date</p>
              <p className="text-lg text-foreground">
                {new Date(appointmentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        )}

        {/* Next Action */}
        <div className="p-4 bg-surface-sunken rounded-lg border border-border">
          <p className="text-base text-foreground">{nextAction}</p>
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <Button
            onClick={onViewDetails}
            variant="outline"
            className="w-full h-14 text-lg border-accent text-accent hover:bg-accent/10 hover:border-accent"
          >
            View Details
            <ChevronRight className="h-5 w-5 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
