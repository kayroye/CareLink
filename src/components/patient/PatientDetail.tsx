'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, CalendarPlus, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateICS, downloadICS } from '@/lib/ics';
import { useState } from 'react';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, Status } from '@/lib/db/schema';
import { QRWallet } from './QRWallet';
import { toast } from 'sonner';

interface PatientDetailProps {
  referralId: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  missed: 'bg-red-100 text-red-800',
};

export function PatientDetail({ referralId }: PatientDetailProps) {
  const router = useRouter();
  const { referrals, updateStatus, updateReferral } = useReferrals();
  const referral = referrals.find((r) => r.id === referralId);
  const [isSendingSMS, setIsSendingSMS] = useState(false);

  if (!referral) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Referral not found or still loading...</p>
        <Button variant="link" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const createdDate = new Date(referral.createdAt).toLocaleDateString();
  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(referral.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isOverdue = referral.status === 'pending' && daysSinceCreated >= 14;

  const handleStatusChange = async (newStatus: Status) => {
    await updateStatus(referral.id, newStatus);
    toast.success(`Referral marked as ${newStatus}`);
  };

  const handleDownloadICS = async () => {
    const ics = await generateICS(referral);
    if (ics) {
      downloadICS(ics, `appointment-${referral.patientName.replace(/\s+/g, '-')}.ics`);
      toast.success('Calendar file downloaded');
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={() => router.push('/dashboard')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{referral.patientName}</CardTitle>
              <p className="text-gray-500">{referral.referralType}</p>
            </div>
            <div className="flex items-center gap-2">
              {referral.synced ? (
                <Badge variant="outline" className="bg-green-50">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Synced
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-amber-50">
                  <Clock className="mr-1 h-3 w-3" />
                  Pending Sync
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityColors[referral.priority]}>
              {referral.priority} priority
            </Badge>
            <Badge className={statusColors[referral.status]}>
              {referral.status}
            </Badge>
            {isOverdue && <Badge variant="destructive">OVERDUE - {daysSinceCreated} days</Badge>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-500">Facility</h4>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{facility?.name}</span>
                <Badge variant="secondary">{facility?.distance}</Badge>
              </div>
            </div>

            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-500">Created</h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{createdDate}</span>
              </div>
            </div>

            {referral.patientPhone && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-500">Phone</h4>
                <span>{referral.patientPhone}</span>
              </div>
            )}

            {referral.appointmentDate && (
              <div>
                <h4 className="mb-1 text-sm font-medium text-gray-500">Appointment</h4>
                <span>{new Date(referral.appointmentDate).toLocaleString()}</span>
              </div>
            )}
          </div>

          <div>
            <h4 className="mb-1 text-sm font-medium text-gray-500">Diagnosis</h4>
            <p>{referral.diagnosis}</p>
          </div>

          {referral.notes && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-gray-500">Notes</h4>
              <p>{referral.notes}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Update Status</h4>
            <Select value={referral.status} onValueChange={(v) => handleStatusChange(v as Status)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Actions</h4>
            <div className="flex flex-wrap gap-2">
              <QRWallet referral={referral} />

              {referral.status === 'scheduled' && !referral.appointmentDate && (
                <div className="w-full mt-4">
                  <Label htmlFor="appointmentDate">Set Appointment Date & Time</Label>
                  <Input
                    id="appointmentDate"
                    type="datetime-local"
                    className="mt-1"
                    onChange={async (e) => {
                      if (e.target.value) {
                        await updateReferral(referral.id, {
                          appointmentDate: new Date(e.target.value).toISOString()
                        });
                        toast.success('Appointment scheduled');
                      }
                    }}
                  />
                </div>
              )}

              {referral.appointmentDate && (
                <Button variant="outline" onClick={handleDownloadICS}>
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Add to Calendar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
