'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ReferralWithMeta } from '@/lib/db/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface OverdueConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referral: ReferralWithMeta;
  newStatus: string;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function OverdueConfirmDialog({
  open,
  onOpenChange,
  referral,
  newStatus,
  onConfirm,
  onCancel,
}: OverdueConfirmDialogProps) {
  const [note, setNote] = useState('');

  const daysOverdue = Math.max(0, referral.daysSinceCreated - 14);

  const isNoteValid = note.trim().length >= 10;

  const handleConfirm = () => {
    if (isNoteValid) {
      onConfirm(note.trim());
      setNote('');
    }
  };

  const handleCancel = () => {
    setNote('');
    onCancel();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setNote('');
      onCancel();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pending-muted">
              <AlertTriangle className="h-5 w-5 text-pending-foreground" />
            </div>
            <DialogTitle className="text-lg font-semibold">
              Moving Overdue Referral
            </DialogTitle>
          </div>
          <DialogDescription className="pt-3 text-sm leading-relaxed">
            This referral requires a note explaining the status change because it is overdue.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          <div className="rounded-lg border border-pending bg-pending-muted p-5">
            <div className="space-y-3">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <span className="text-muted-foreground">Patient</span>
                <span className="font-medium text-right">{referral.patientName}</span>
                
                <span className="text-muted-foreground">Days Overdue</span>
                <span className="font-semibold text-missed-foreground text-right">
                  {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'}
                </span>
                
                <span className="text-muted-foreground">Moving to</span>
                <span className="font-medium capitalize text-right">{newStatus}</span>
              </div>
              
              <div className="space-y-1.5 pt-1">
                <div className="text-xs text-muted-foreground">Diagnosis</div>
                <div className="text-sm font-medium leading-relaxed">
                  {referral.diagnosis}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <label htmlFor="status-change-note" className="text-sm font-medium">
              Status Change Note <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="status-change-note"
              placeholder="Please explain why this overdue referral is being moved (min. 10 characters)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {note.trim().length}/10 characters minimum
              {!isNoteValid && note.trim().length > 0 && (
                <span className="ml-2 text-destructive">
                  ({10 - note.trim().length} more needed)
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!isNoteValid}>
            Confirm Move
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
