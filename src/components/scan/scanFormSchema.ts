import { z } from 'zod';
import { FACILITIES } from '@/lib/db/schema';

const facilityIds = FACILITIES.map((facility) => facility.id);

export const scanFormSchema = z.object({
  patientName: z.string().trim().min(1, 'Patient name is required'),
  patientPhone: z
    .string()
    .trim()
    .optional()
    .or(z.literal('')),
  diagnosis: z.string().trim().min(1, 'Diagnosis is required'),
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
  patientName: '',
  patientPhone: '',
  diagnosis: '',
  priority: 'medium',
  facilityId: '',
  referralType: '',
  notes: '',
};
