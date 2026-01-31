'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, ExternalLink, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FACILITIES, FacilityId, Referral } from '@/lib/db/schema';
import { AddToCalendarButton } from '@/components/appointments/AddToCalendarButton';

interface AppointmentCardProps {
  id: string;
  referralType: string;
  facilityId: FacilityId;
  appointmentDate: string;
  referral?: Referral;
  onConfirm?: (id: string) => Promise<void>;
  onRequestReschedule?: (id: string) => void;
  isConfirmed?: boolean;
}

export function AppointmentCard({
  id,
  referralType,
  facilityId,
  appointmentDate,
  referral,
  onConfirm,
  onRequestReschedule,
  isConfirmed = false,
}: AppointmentCardProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(isConfirmed);

  const facility = FACILITIES.find((f) => f.id === facilityId);
  const date = new Date(appointmentDate);

  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const handleConfirm = async () => {
    if (onConfirm) {
      setIsConfirming(true);
      try {
        await onConfirm(id);
        setConfirmed(true);
      } finally {
        setIsConfirming(false);
      }
    }
  };

  const handleReschedule = () => {
    if (onRequestReschedule) {
      onRequestReschedule(id);
    }
  };

  // Generate Google Maps link
  const mapsLink = facility
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name)}`
    : '#';

  return (
    <Card className="bg-card shadow-md hover:shadow-lg transition-shadow border-border">
      <CardContent className="p-6 space-y-6">
        {/* Date and Time - Prominently Displayed */}
        <div className="text-center p-6 bg-scheduled-muted rounded-xl border border-scheduled-muted">
          <div className="flex items-center justify-center gap-2 text-scheduled-foreground mb-2">
            <Calendar className="h-6 w-6" />
            <span className="text-xl font-semibold">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-scheduled-foreground">
            <Clock className="h-5 w-5" />
            <span className="text-2xl font-bold">{formattedTime}</span>
          </div>
        </div>

        {/* Referral Type */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">{referralType}</h3>
        </div>

        {/* Facility Information */}
        <div className="p-4 bg-surface-sunken rounded-lg border border-border space-y-3">
          <div className="flex items-start gap-3">
            <MapPin className="h-6 w-6 text-accent shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-lg font-medium text-foreground">{facility?.name || 'Unknown Facility'}</p>
              {facility?.distance && (
                <p className="text-base text-muted-foreground">{facility.distance} away</p>
              )}
            </div>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-accent hover:text-accent/80 font-medium py-2 px-4 rounded-lg bg-card border border-accent hover:bg-accent/10 transition-colors"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="text-base">Open in Maps</span>
          </a>
        </div>

        {/* Confirmation Status or Actions */}
        <div className="space-y-4">
          {confirmed ? (
            <div className="flex items-center justify-center gap-3 p-4 bg-completed-muted rounded-lg border border-completed-muted">
              <CheckCircle className="h-7 w-7 text-completed-foreground" />
              <span className="text-lg font-medium text-completed-foreground">
                Attendance Confirmed
              </span>
            </div>
          ) : (
            <Button
              onClick={handleConfirm}
              disabled={isConfirming}
              className={cn(
                'w-full h-12 text-base font-semibold',
                'bg-accent hover:bg-accent/90 text-accent-foreground',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isConfirming ? 'Confirming...' : 'Confirm Attendance'}
            </Button>
          )}

          {referral && <AddToCalendarButton className="w-full h-12 text-base" referral={referral} />}

          {!confirmed && (
            <Button
              variant="outline"
              onClick={handleReschedule}
              className="w-full h-12 text-base border-destructive text-destructive hover:bg-destructive/10 hover:border-destructive"
            >
              Request Reschedule
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
