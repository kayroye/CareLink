'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Calendar, XCircle } from 'lucide-react';

interface RequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'reschedule' | 'cancel';
  currentDate?: string;
  onSubmit: (requestedDate?: string, reason?: string) => Promise<void>;
}

export function RequestModal({ open, onOpenChange, type, currentDate, onSubmit }: RequestModalProps) {
  const [requestedDate, setRequestedDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReschedule = type === 'reschedule';

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(isReschedule ? requestedDate : undefined, reason);
      onOpenChange(false);
      setRequestedDate('');
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = isReschedule ? requestedDate.trim() !== '' : reason.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReschedule ? (
              <>
                <Calendar className="h-5 w-5 text-scheduled-foreground" />
                Request Reschedule
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Request Cancellation
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isReschedule
              ? 'Request a new date/time for your appointment. A nurse will review and confirm.'
              : 'Request to cancel your appointment. Please provide a reason.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isReschedule && (
            <>
              {currentDate && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">Current appointment:</p>
                  <p className="font-medium">
                    {new Date(currentDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="requestedDate">Preferred New Date & Time *</Label>
                <Input
                  id="requestedDate"
                  type="datetime-local"
                  value={requestedDate}
                  onChange={(e) => setRequestedDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason {!isReschedule && '*'}
            </Label>
            <Textarea
              id="reason"
              placeholder={
                isReschedule
                  ? 'Optional: Why do you need to reschedule?'
                  : 'Please explain why you need to cancel...'
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>

          {!isReschedule && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">
                Cancelling may delay your care. Please only cancel if absolutely necessary.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Go Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            variant={isReschedule ? 'default' : 'destructive'}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
