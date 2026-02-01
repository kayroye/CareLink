import { RxJsonSchema } from 'rxdb';

// User types
export type UserRole = 'nurse' | 'patient';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash?: string; // Only for nurses
  phone?: string; // Contact number for nurses, displayed to patients
  createdAt: string;
}

export interface MagicLinkToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
  used: boolean;
}

export const userSchema: RxJsonSchema<User> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    email: { type: 'string', maxLength: 320 },
    name: { type: 'string' },
    role: { type: 'string', enum: ['nurse', 'patient'] },
    passwordHash: { type: 'string' },
    phone: { type: 'string' },
    createdAt: { type: 'string' },
  },
  required: ['id', 'email', 'name', 'role', 'createdAt'],
  indexes: ['email'],
};

export const magicLinkTokenSchema: RxJsonSchema<MagicLinkToken> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    email: { type: 'string', maxLength: 320 },
    token: { type: 'string', maxLength: 1024 },
    expiresAt: { type: 'string' },
    used: { type: 'boolean' },
  },
  required: ['id', 'email', 'token', 'expiresAt', 'used'],
  indexes: ['token', 'email'],
};

export const FACILITIES = [
  {
    id: 'regional-hospital',
    name: 'Regional Hospital',
    address: '1020 Riverside Dr, Thunder Bay, ON',
    distance: '110km',
    types: ['Emergency', 'Surgery', 'Cardiology'],
  },
  {
    id: 'mental-health-center',
    name: 'Northern Mental Health Center',
    address: '455 Pinecrest Ave, Dryden, ON',
    distance: '85km',
    types: ['Mental Health', 'Counseling'],
  },
  {
    id: 'specialist-clinic',
    name: 'Lakeview Specialist Clinic',
    address: '88 Lakeview Blvd, Kenora, ON',
    distance: '95km',
    types: ['Cardiology', 'Oncology', 'Neurology'],
  },
  {
    id: 'community-health',
    name: 'Clearwater Nursing Station',
    address: '14 Birch St, Clearwater Bay, ON',
    distance: 'Local',
    types: ['Primary Care', 'Follow-up'],
  },
] as const;

export type FacilityId = (typeof FACILITIES)[number]['id'];
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'pending' | 'scheduled' | 'completed' | 'missed' | 'cancelled';

// Patient types
export type PreferredLanguage = 'en' | 'fr' | 'cree' | 'ojibwe';
export type CommunicationPreference = 'sms' | 'email' | 'both';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  healthCardNumber?: string;
  preferredLanguage: PreferredLanguage;
  preferredFacilityId?: FacilityId;
  communicationPreference: CommunicationPreference;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  accessibilityNeeds?: string;
  passwordHash?: string;
  createdAt: string;
  updatedAt: string;
}

export const patientSchema: RxJsonSchema<Patient> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    name: { type: 'string', maxLength: 200 },
    email: { type: 'string', maxLength: 320 },
    phone: { type: 'string' },
    dateOfBirth: { type: 'string' },
    healthCardNumber: { type: 'string' },
    preferredLanguage: { type: 'string', enum: ['en', 'fr', 'cree', 'ojibwe'] },
    preferredFacilityId: { type: 'string' },
    communicationPreference: { type: 'string', enum: ['sms', 'email', 'both'] },
    address: { type: 'string' },
    emergencyContactName: { type: 'string' },
    emergencyContactPhone: { type: 'string' },
    accessibilityNeeds: { type: 'string' },
    passwordHash: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
  required: ['id', 'name', 'email', 'preferredLanguage', 'communicationPreference', 'createdAt', 'updatedAt'],
  indexes: ['email', 'name'],
};

export interface StatusChangeNote {
  fromStatus: string;
  toStatus: string;
  note: string;
  changedAt: string;
  wasOverdue: boolean;
}

export interface PendingRequest {
  type: 'reschedule' | 'cancel';
  requestedDate?: string;
  reason?: string;
  requestedAt: string;
}

export interface Referral {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone?: string;
  diagnosis: string;
  patientSummary: string; // Patient-friendly explanation (shown to patients)
  createdByNurseId: string; // Links to nurse who created the referral
  priority: Priority;
  status: Status;
  facilityId: FacilityId;
  referralType: string;
  appointmentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  isSynced: boolean;
  statusChangeNotes?: StatusChangeNote[];
  pendingRequest?: PendingRequest;
}

export type ReferralWithMeta = Referral & {
  daysSinceCreated: number;
  isOverdue: boolean;
};

export const referralSchema: RxJsonSchema<Referral> = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    patientId: { type: 'string', maxLength: 100 },
    patientName: { type: 'string' },
    patientPhone: { type: 'string' },
    diagnosis: { type: 'string' },
    patientSummary: { type: 'string' },
    createdByNurseId: { type: 'string', maxLength: 100 },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    status: { type: 'string', enum: ['pending', 'scheduled', 'completed', 'missed', 'cancelled'] },
    facilityId: { type: 'string' },
    referralType: { type: 'string' },
    appointmentDate: { type: 'string' },
    notes: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    isSynced: { type: 'boolean' },
    statusChangeNotes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          fromStatus: { type: 'string' },
          toStatus: { type: 'string' },
          note: { type: 'string' },
          changedAt: { type: 'string' },
          wasOverdue: { type: 'boolean' },
        },
      },
    },
    pendingRequest: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['reschedule', 'cancel'] },
        requestedDate: { type: 'string' },
        reason: { type: 'string' },
        requestedAt: { type: 'string' },
      },
    },
  },
  required: ['id', 'patientId', 'patientName', 'diagnosis', 'patientSummary', 'createdByNurseId', 'priority', 'status', 'facilityId', 'referralType', 'createdAt', 'updatedAt', 'isSynced'],
};
