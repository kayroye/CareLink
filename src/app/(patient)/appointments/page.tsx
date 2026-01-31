'use client';

import { useState } from 'react';
import { useReferrals } from '@/lib/db/hooks';
import { AppointmentCard } from '@/components/patient/AppointmentCard';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Loader2, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AppointmentsPage() {
  const { referrals, loading } = useReferrals();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [, setConfirmedAppointment] = useState<string | null>(null);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [, setSelectedReferralId] = useState<string | null>(null);

  // Filter to only scheduled referrals with appointment dates
  const scheduledAppointments = referrals.filter(
    (r) => r.status === 'scheduled' && r.appointmentDate
  );

  // Track confirmed appointments locally (in real app, this would be stored in DB)
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());

  const handleConfirm = async (id: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mark as confirmed locally
    setConfirmedIds((prev) => new Set(prev).add(id));
    setConfirmedAppointment(id);
    setConfirmationOpen(true);
  };

  const handleRequestReschedule = (id: string) => {
    setSelectedReferralId(id);
    setRescheduleModalOpen(true);
  };

  const handleSubmitReschedule = async () => {
    // In a real app, this would submit the reschedule request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRescheduleModalOpen(false);
    setSelectedReferralId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-lg text-muted-foreground">Loading your appointments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Appointments</h1>
        <p className="text-lg text-muted-foreground">
          View and manage your upcoming healthcare appointments
        </p>
      </div>

      {/* Appointments List or Empty State */}
      {scheduledAppointments.length === 0 ? (
        <Card className="bg-card shadow-md border-border">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground">No Upcoming Appointments</h2>
              <p className="text-lg text-muted-foreground">
                You do not have any scheduled appointments at this time. Once your referral is
                scheduled, your appointment will appear here.
              </p>
            </div>

            <div className="p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted max-w-md mx-auto">
              <p className="text-base text-scheduled-foreground">
                Check your referrals page to see the status of pending appointments.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
            <p className="text-lg text-foreground">
              You have{' '}
              <span className="font-semibold text-accent">{scheduledAppointments.length}</span>{' '}
              upcoming appointment{scheduledAppointments.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Appointment Cards */}
          <div className="space-y-6">
            {scheduledAppointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                id={appointment.id}
                referralType={appointment.referralType}
                facilityId={appointment.facilityId}
                appointmentDate={appointment.appointmentDate!}
                onConfirm={handleConfirm}
                onRequestReschedule={handleRequestReschedule}
                isConfirmed={confirmedIds.has(appointment.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Confirmation Success Dialog */}
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-completed-muted flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-completed-foreground" />
              </div>
            </div>
            <DialogTitle className="text-2xl">Attendance Confirmed</DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              Thank you for confirming your attendance. We look forward to seeing you at your
              appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6">
            <Button
              onClick={() => setConfirmationOpen(false)}
              className="w-full h-12 text-lg bg-accent hover:bg-accent/90"
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reschedule Request Dialog */}
      <Dialog open={rescheduleModalOpen} onOpenChange={setRescheduleModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Request Reschedule</DialogTitle>
            <DialogDescription className="text-lg text-muted-foreground">
              We will contact you within 24 hours to reschedule your appointment.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div className="p-4 bg-pending-muted rounded-lg border border-pending-muted">
              <p className="text-base text-pending-foreground">
                Please note that rescheduling may delay your care. Only request a reschedule if
                absolutely necessary.
              </p>
            </div>

            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setRescheduleModalOpen(false)}
                className="flex-1 h-12 text-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReschedule}
                className="flex-1 h-12 text-lg bg-accent hover:bg-accent/90"
              >
                Request Reschedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
