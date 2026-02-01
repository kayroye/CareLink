'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle, CalendarPlus, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { generateICS, downloadICS } from '@/lib/ics';
import { useEffect, useState } from 'react';
import { useReferrals } from '@/lib/db/hooks';
import { usePatients } from '@/lib/db/use-patients';
import { FACILITIES, FacilityId, Priority, Status } from '@/lib/db/schema';
import { QRWallet } from './QRWallet';
import { toast } from 'sonner';

interface PatientDetailProps {
  referralId: string;
}

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-scheduled-muted text-scheduled-foreground',
  high: 'bg-pending-muted text-pending-foreground',
  critical: 'bg-missed-muted text-missed-foreground',
};

const statusColors: Record<string, string> = {
  pending: 'bg-pending-muted text-pending-foreground',
  scheduled: 'bg-scheduled-muted text-scheduled-foreground',
  completed: 'bg-completed-muted text-completed-foreground',
  missed: 'bg-missed-muted text-missed-foreground',
};

export function PatientDetail({ referralId }: PatientDetailProps) {
  const router = useRouter();
  const { referrals, updateStatus, updateReferral } = useReferrals();
  const { getPatientById } = usePatients();
  const referral = referrals.find((r) => r.id === referralId);
  const patient = referral ? getPatientById(referral.patientId) : undefined;
  const [isSendingSMS, setIsSendingSMS] = useState(false);
  const [appointmentInput, setAppointmentInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateMeetLink = () => {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const makePart = (length: number) =>
      Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
    return `https://meet.google.com/${makePart(3)}-${makePart(4)}-${makePart(3)}`;
  };

  const toDateTimeLocal = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const buildEditValues = (data?: ReferralWithMeta) => ({
    patientName: data?.patientName ?? '',
    patientPhone: data?.patientPhone ?? '',
    diagnosis: data?.diagnosis ?? '',
    patientSummary: data?.patientSummary ?? '',
    referralType: data?.referralType ?? '',
    facilityId: data?.facilityId ?? '',
    priority: (data?.priority ?? 'medium') as Priority,
    status: (data?.status ?? 'pending') as Status,
    appointmentDate: toDateTimeLocal(data?.appointmentDate),
    notes: data?.notes ?? '',
  });

  const [editValues, setEditValues] = useState(() => buildEditValues(referral));

  useEffect(() => {
    if (!isEditing) {
      setEditValues(buildEditValues(referral));
    }
  }, [referral, isEditing]);

  if (!referral) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Referral not found or still loading...</p>
        <Button variant="link" onClick={() => router.push('/dashboard')}>
          Back to Dashboard
        </Button>
      </div>
    );
  }

  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const createdDate = new Date(referral.createdAt).toLocaleDateString();
  const daysSinceCreated = referral.daysSinceCreated;
  const isOverdue = referral.isOverdue;

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

  const handleSaveEdits = async () => {
    if (!referral) return;
    setIsSaving(true);
    try {
      await updateReferral(referral.id, {
        patientName: editValues.patientName.trim() || referral.patientName,
        patientPhone: editValues.patientPhone.trim() || undefined,
        diagnosis: editValues.diagnosis.trim() || referral.diagnosis,
        patientSummary: editValues.patientSummary.trim() || referral.patientSummary,
        referralType: editValues.referralType.trim() || referral.referralType,
        facilityId: (editValues.facilityId || referral.facilityId) as FacilityId,
        priority: editValues.priority || referral.priority,
        status: editValues.status || referral.status,
        appointmentDate: editValues.appointmentDate
          ? new Date(editValues.appointmentDate).toISOString()
          : undefined,
        notes: editValues.notes.trim() || undefined,
      });
      toast.success('Referral updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update referral');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdits = () => {
    setIsEditing(false);
    setEditValues(buildEditValues(referral));
  };

  const handleSendReminder = async () => {
    if (!referral.patientPhone || !referral.appointmentDate) {
      toast.error('Phone number and appointment date are required');
      return;
    }

    const facility = FACILITIES.find((f) => f.id === referral.facilityId);

    setIsSendingSMS(true);
    try {
      const response = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: referral.patientPhone,
          patientName: referral.patientName,
          appointmentDate: referral.appointmentDate,
          facility: facility?.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error('Failed to send');

      if (data.demo) {
        toast.success('Demo mode: SMS reminder would be sent');
      } else {
        toast.success(`SMS sent to ${referral.patientPhone}`);
      }
    } catch {
      toast.error('Failed to send reminder');
    } finally {
      setIsSendingSMS(false);
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
              <p className="text-muted-foreground">{referral.referralType}</p>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSaveEdits} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdits} disabled={isSaving}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {referral.isSynced ? (
                <Badge variant="outline" className="bg-completed-muted">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Synced
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-pending-muted">
                  <Clock className="mr-1 h-3 w-3" />
                  Pending Sync
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {isEditing && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="editPatientName">Patient Name</Label>
                  <Input
                    id="editPatientName"
                    value={editValues.patientName}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, patientName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editPatientPhone">Phone</Label>
                  <Input
                    id="editPatientPhone"
                    value={editValues.patientPhone}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, patientPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Facility</Label>
                  <Select
                    value={editValues.facilityId}
                    onValueChange={(value) =>
                      setEditValues((prev) => ({ ...prev, facilityId: value, referralType: '' }))
                    }
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {FACILITIES.map((facility) => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name} ({facility.distance})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Referral Type</Label>
                  <Select
                    value={editValues.referralType}
                    onValueChange={(value) => setEditValues((prev) => ({ ...prev, referralType: value }))}
                    disabled={!editValues.facilityId}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder={editValues.facilityId ? 'Select type' : 'Select facility first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {FACILITIES.find((facility) => facility.id === editValues.facilityId)?.types.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={editValues.priority}
                    onValueChange={(value) => setEditValues((prev) => ({ ...prev, priority: value as Priority }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Routine</SelectItem>
                      <SelectItem value="medium">Medium - Standard</SelectItem>
                      <SelectItem value="high">High - Soon</SelectItem>
                      <SelectItem value="critical">Critical - Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={editValues.status}
                    onValueChange={(value) => setEditValues((prev) => ({ ...prev, status: value as Status }))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editAppointmentDate">Appointment</Label>
                  <Input
                    id="editAppointmentDate"
                    type="datetime-local"
                    value={editValues.appointmentDate}
                    onChange={(e) => setEditValues((prev) => ({ ...prev, appointmentDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDiagnosis">Diagnosis</Label>
                <Textarea
                  id="editDiagnosis"
                  value={editValues.diagnosis}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, diagnosis: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="editPatientSummary">Patient Summary</Label>
                  {editValues.facilityId === 'online' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = generateMeetLink();
                        const separator = editValues.patientSummary?.trim() ? '\n\n' : '';
                        setEditValues((prev) => ({
                          ...prev,
                          patientSummary: `${prev.patientSummary || ''}${separator}Meet link: ${link}`,
                        }));
                      }}
                    >
                      Generate meet link
                    </Button>
                  )}
                </div>
                <Textarea
                  id="editPatientSummary"
                  value={editValues.patientSummary}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, patientSummary: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea
                  id="editNotes"
                  value={editValues.notes}
                  onChange={(e) => setEditValues((prev) => ({ ...prev, notes: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}

          {!isEditing && (
            <>
              <div className="flex flex-wrap gap-2">
                <Badge className={priorityColors[referral.priority]}>
                  {referral.priority} priority
                </Badge>
                <Badge className={statusColors[referral.status]}>
                  {referral.status}
                </Badge>
                {isOverdue && <Badge className="bg-destructive text-destructive-foreground font-semibold">OVERDUE - {daysSinceCreated} days</Badge>}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="mb-1 text-sm font-medium text-muted-foreground">Facility</h4>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{facility?.name}</span>
                    <Badge variant="secondary">{facility?.distance}</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="mb-1 text-sm font-medium text-muted-foreground">Created</h4>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{createdDate}</span>
                  </div>
                </div>

                {patient?.email && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">Carelink Email</h4>
                    <span>{patient.email}</span>
                  </div>
                )}

                {referral.patientPhone && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">Phone</h4>
                    <span>{referral.patientPhone}</span>
                  </div>
                )}

                {referral.appointmentDate && (
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-muted-foreground">Appointment</h4>
                    <span>{new Date(referral.appointmentDate).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">Diagnosis</h4>
                <p>{referral.diagnosis}</p>
              </div>

              <div>
                <h4 className="mb-1 text-sm font-medium text-muted-foreground">Patient Summary</h4>
                <p>{referral.patientSummary}</p>
              </div>

              {referral.notes && (
                <div>
                  <h4 className="mb-1 text-sm font-medium text-muted-foreground">Notes</h4>
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
                    <div className="w-full mt-4 space-y-3">
                      <Label htmlFor="appointmentDate">Set Appointment Date & Time</Label>
                      <div className="flex gap-2">
                        <Input
                          id="appointmentDate"
                          type="datetime-local"
                          className="flex-1"
                          value={appointmentInput}
                          onChange={(e) => setAppointmentInput(e.target.value)}
                        />
                        <Button
                          onClick={async () => {
                            if (appointmentInput) {
                              await updateReferral(referral.id, {
                                appointmentDate: new Date(appointmentInput).toISOString()
                              });
                              toast.success('Appointment confirmed');
                              setAppointmentInput('');
                            } else {
                              toast.error('Please select a date and time');
                            }
                          }}
                          disabled={!appointmentInput}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Confirm
                        </Button>
                      </div>
                    </div>
                  )}

                  {referral.appointmentDate && (
                    <Button variant="outline" onClick={handleDownloadICS}>
                      <CalendarPlus className="mr-2 h-4 w-4" />
                      Add to Calendar
                    </Button>
                  )}

                  {referral.patientPhone && referral.appointmentDate && (
                    <Button
                      variant="outline"
                      onClick={handleSendReminder}
                      disabled={isSendingSMS}
                    >
                      <MessageSquare className="mr-2 h-4 w-4" />
                      {isSendingSMS ? 'Sending...' : 'Send SMS Reminder'}
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
