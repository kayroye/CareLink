import { createEvent, EventAttributes } from 'ics';
import { Referral, FACILITIES } from './db/schema';

export async function generateICS(referral: Referral): Promise<string | null> {
  if (!referral.appointmentDate) return null;

  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const appointmentDate = new Date(referral.appointmentDate);

  const event: EventAttributes = {
    start: [
      appointmentDate.getFullYear(),
      appointmentDate.getMonth() + 1,
      appointmentDate.getDate(),
      appointmentDate.getHours(),
      appointmentDate.getMinutes(),
    ],
    duration: { hours: 1 },
    title: `Medical Appointment - ${referral.referralType}`,
    description: `Patient: ${referral.patientName}\nDiagnosis: ${referral.diagnosis}`,
    location: `${facility?.name} (${facility?.distance})`,
    categories: ['Medical', 'Appointment'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    alarms: [
      {
        action: 'display',
        description: 'Reminder: Medical appointment tomorrow',
        trigger: { hours: 24, before: true },
      },
    ],
  };

  return new Promise((resolve) => {
    createEvent(event, (error, value) => {
      if (error) {
        console.error('ICS generation error:', error);
        resolve(null);
      } else {
        resolve(value);
      }
    });
  });
}

export function downloadICS(icsContent: string, filename: string) {
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
