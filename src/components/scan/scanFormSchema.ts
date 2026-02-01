import { z } from 'zod';
import { FACILITIES } from '@/lib/db/schema';

const facilityIds = FACILITIES.map((facility) => facility.id) as string[];

export const scanFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientName: z.string().trim().min(1, 'Patient name is required'),
  patientPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  diagnosis: z.string().trim().min(1, 'Diagnosis is required'),
  patientSummary: z.string().trim().min(1, 'Patient summary is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  facilityId: z
    .string()
    .trim()
    .min(1, 'Facility is required')
    .refine((value) => facilityIds.includes(value), {
      message: 'Facility is required',
    }),
  referralType: z.string().trim().min(1, 'Referral type is required'),
  notes: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
});

export type ScanFormData = z.infer<typeof scanFormSchema>;

export type ScanFormOcrData = Partial<
  Pick<ScanFormData, 'patientName' | 'diagnosis' | 'priority' | 'referralType' | 'notes'>
>;

export const scanFormDefaults: ScanFormData = {
  patientId: '',
  patientName: '',
  patientPhone: '',
  diagnosis: '',
  patientSummary: '',
  priority: 'medium',
  facilityId: '',
  referralType: '',
  notes: '',
};
