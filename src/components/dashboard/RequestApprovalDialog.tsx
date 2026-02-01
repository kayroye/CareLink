'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ReferralWithMeta } from '@/lib/db/schema';
import { Calendar, XCircle } from 'lucide-react';

interface RequestApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral: ReferralWithMeta;
  onApprove: () => Promise<void>;
  onDeny: () => Promise<void>;
}

export function RequestApprovalDialog({
  open,
  onOpenChange,
  referral,
  onApprove,
  onDeny,
}: RequestApprovalDialogProps) {
  const request = referral.pendingRequest;
  if (!request) return null;

  const isReschedule = request.type === 'reschedule';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReschedule ? (
              <>
                <Calendar className="h-5 w-5 text-scheduled-foreground" />
                Reschedule Request
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-destructive" />
                Cancellation Request
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {referral.patientName} has requested to{' '}
            {isReschedule ? 'reschedule their appointment' : 'cancel their appointment'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 bg-muted rounded-md space-y-2">
            <p className="text-sm text-muted-foreground">Patient</p>
            <p className="font-medium">{referral.patientName}</p>
          </div>

          {isReschedule && request.requestedDate && (
            <div className="p-3 bg-scheduled-muted rounded-md space-y-2">
              <p className="text-sm text-scheduled-foreground">Requested New Date</p>
              <p className="font-medium">
                {new Date(request.requestedDate).toLocaleDateString('en-US', {
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

          {request.reason && (
            <div className="p-3 bg-muted rounded-md space-y-2">
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="text-foreground">{request.reason}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            Submitted{' '}
            {new Date(request.requestedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onDeny}>
            Deny Request
          </Button>
          <Button onClick={onApprove} variant={isReschedule ? 'default' : 'destructive'}>
            {isReschedule ? 'Approve & Reschedule' : 'Approve Cancellation'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
