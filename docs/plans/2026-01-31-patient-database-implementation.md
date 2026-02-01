# Patient Database Rework Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add proper patient records with CouchDB sync, preset demo accounts, OCR-assisted patient matching, and patient request system.

**Architecture:** Client-side RxDB syncs bidirectionally with CouchDB. Nurses have full read/write, patients have read + request-only writes. Fuzzy matching via Fuse.js connects OCR-extracted names to existing patients.

**Tech Stack:** RxDB, CouchDB, Fuse.js, React Hook Form, Radix UI Dialog, Next.js API routes

---

## Parallel Execution Groups

Tasks within the same group can be executed in parallel. Groups must be executed sequentially.

```
GROUP 1: Foundation (can run in parallel)
├── Task 1: Install dependencies
├── Task 2: Setup CouchDB databases
└── Task 3: Add Patient schema to RxDB

GROUP 2: Database Layer (can run in parallel after Group 1)
├── Task 4: Update Referral schema
├── Task 5: Create usePatients hook
└── Task 6: Setup CouchDB replication

GROUP 3: Seed Data (sequential, after Group 2)
└── Task 7: Update seed data with patients and nurses

GROUP 4: Auth Updates (can run in parallel after Group 3)
├── Task 8: Update login API for demo accounts
└── Task 9: Update AuthContext for patient login

GROUP 5: Patient Selection UI (can run in parallel after Group 4)
├── Task 10: Create PatientSelect component
├── Task 11: Create CreatePatientModal component
└── Task 12: Update ScanForm with patient selection

GROUP 6: Patient Request System (can run in parallel after Group 5)
├── Task 13: Create RequestModal component
├── Task 14: Update patient referral detail page
├── Task 15: Add request badge to ReferralCard
└── Task 16: Update KanbanBoard for request handling

GROUP 7: Patient Filtering (after Group 6)
└── Task 17: Filter my-referrals by logged-in patient
```

---

## GROUP 1: Foundation

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install fuse.js for fuzzy matching**

Run:
```bash
npm install fuse.js
```

Expected: Package added to dependencies

**Step 2: Verify installation**

Run:
```bash
npm ls fuse.js
```

Expected: Shows fuse.js version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add fuse.js for patient name matching"
```

---

### Task 2: Setup CouchDB Databases

**Files:**
- None (external setup)

**Step 1: Create CouchDB databases**

Run:
```bash
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_patients
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_referrals
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_users
```

Expected: `{"ok":true}` for each command

**Step 2: Verify databases exist**

Run:
```bash
curl http://carelink-admin:secure-password1@localhost:5984/_all_dbs
```

Expected: Array containing `carelink_patients`, `carelink_referrals`, `carelink_users`

---

### Task 3: Add Patient Schema to RxDB

**Files:**
- Modify: `src/lib/db/schema.ts:1-153`

**Step 1: Add Patient interface and schema**

Add after line 21 (after MagicLinkToken interface):

```typescript
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
    name: { type: 'string' },
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
```

**Step 2: Run lint to verify no errors**

Run:
```bash
npm run lint
```

Expected: No errors related to schema.ts

**Step 3: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): add Patient schema with full profile fields"
```

---

## GROUP 2: Database Layer

### Task 4: Update Referral Schema

**Files:**
- Modify: `src/lib/db/schema.ts`

**Step 1: Add PendingRequest interface**

Add after StatusChangeNote interface (around line 95):

```typescript
export interface PendingRequest {
  type: 'reschedule' | 'cancel';
  requestedDate?: string;
  reason?: string;
  requestedAt: string;
}
```

**Step 2: Update Status type to include 'cancelled'**

Change line 87 from:
```typescript
export type Status = 'pending' | 'scheduled' | 'completed' | 'missed';
```

To:
```typescript
export type Status = 'pending' | 'scheduled' | 'completed' | 'missed' | 'cancelled';
```

**Step 3: Update Referral interface**

Add after `statusChangeNotes` field (around line 111):

```typescript
  patientId: string;
  pendingRequest?: PendingRequest;
```

**Step 4: Update referralSchema properties**

Add to properties object in referralSchema (around line 136):

```typescript
    patientId: { type: 'string', maxLength: 100 },
    pendingRequest: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['reschedule', 'cancel'] },
        requestedDate: { type: 'string' },
        reason: { type: 'string' },
        requestedAt: { type: 'string' },
      },
    },
```

**Step 5: Update status enum in schema**

Change:
```typescript
status: { type: 'string', enum: ['pending', 'scheduled', 'completed', 'missed'] },
```

To:
```typescript
status: { type: 'string', enum: ['pending', 'scheduled', 'completed', 'missed', 'cancelled'] },
```

**Step 6: Add patientId to required array**

Update required array to include `'patientId'`

**Step 7: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat(db): add patientId, pendingRequest, and cancelled status to Referral"
```

---

### Task 5: Create usePatients Hook

**Files:**
- Create: `src/lib/db/use-patients.ts`

**Step 1: Create the hook file**

```typescript
'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RxDocument } from 'rxdb';
import Fuse from 'fuse.js';
import { getDatabase } from './index';
import { Patient } from './schema';

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [fuse, setFuse] = useState<Fuse<Patient> | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | undefined;

    async function init() {
      const db = await getDatabase();
      subscription = db.patients.find().$.subscribe((docs: RxDocument<Patient>[]) => {
        const patientList = docs.map((doc) => doc.toJSON() as Patient);
        setPatients(patientList);
        setFuse(
          new Fuse(patientList, {
            keys: ['name', 'email'],
            threshold: 0.4,
            includeScore: true,
          })
        );
        setLoading(false);
      });
    }

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const addPatient = useCallback(
    async (data: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>) => {
      const db = await getDatabase();
      const now = new Date().toISOString();
      const newPatient: Patient = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      await db.patients.insert(newPatient);
      return newPatient;
    },
    []
  );

  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    const db = await getDatabase();
    const doc = await db.patients.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
      });
    }
  }, []);

  const getPatientById = useCallback(
    (id: string): Patient | undefined => {
      return patients.find((p) => p.id === id);
    },
    [patients]
  );

  const getPatientByEmail = useCallback(
    (email: string): Patient | undefined => {
      return patients.find((p) => p.email.toLowerCase() === email.toLowerCase());
    },
    [patients]
  );

  const searchPatients = useCallback(
    (query: string): Array<{ item: Patient; score: number }> => {
      if (!fuse || !query.trim()) return [];
      const results = fuse.search(query);
      return results.map((r) => ({ item: r.item, score: r.score ?? 1 }));
    },
    [fuse]
  );

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    getPatientById,
    getPatientByEmail,
    searchPatients,
  };
}
```

**Step 2: Run lint**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/lib/db/use-patients.ts
git commit -m "feat(db): add usePatients hook with fuzzy search"
```

---

### Task 6: Update Database Index with Patient Collection

**Files:**
- Modify: `src/lib/db/index.ts`

**Step 1: Import Patient types**

Update imports at top of file:

```typescript
import {
  Referral,
  referralSchema,
  User,
  userSchema,
  MagicLinkToken,
  magicLinkTokenSchema,
  Patient,
  patientSchema,
} from './schema';
```

**Step 2: Add PatientCollection type**

After line 16:

```typescript
type PatientCollection = RxCollection<Patient>;
```

**Step 3: Update DatabaseCollections interface**

```typescript
interface DatabaseCollections {
  referrals: ReferralCollection;
  users: UserCollection;
  magicLinkTokens: MagicLinkTokenCollection;
  patients: PatientCollection;
}
```

**Step 4: Add patients collection in addCollections**

Update the addCollections call (around line 53):

```typescript
  await db.addCollections({
    referrals: {
      schema: referralSchema,
    },
    users: {
      schema: userSchema,
    },
    magicLinkTokens: {
      schema: magicLinkTokenSchema,
    },
    patients: {
      schema: patientSchema,
    },
  });
```

**Step 5: Export PatientCollection type**

Update export line:

```typescript
export type { CareLinkDatabase, ReferralCollection, UserCollection, MagicLinkTokenCollection, PatientCollection };
```

**Step 6: Commit**

```bash
git add src/lib/db/index.ts
git commit -m "feat(db): register patients collection in database"
```

---

### Task 6B: Setup CouchDB Replication

**Files:**
- Create: `src/lib/db/sync.ts`

**Step 1: Create sync configuration file**

```typescript
import { replicateCouchDB } from 'rxdb/plugins/replication-couchdb';
import { CareLinkDatabase } from './index';

const COUCHDB_URL = process.env.NEXT_PUBLIC_COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.NEXT_PUBLIC_COUCHDB_USER || 'carelink-admin';
const COUCHDB_PASSWORD = process.env.NEXT_PUBLIC_COUCHDB_PASSWORD || 'secure-password1';

interface SyncState {
  patients: ReturnType<typeof replicateCouchDB> | null;
  referrals: ReturnType<typeof replicateCouchDB> | null;
}

const syncState: SyncState = {
  patients: null,
  referrals: null,
};

function getAuthHeaders() {
  const credentials = btoa(`${COUCHDB_USER}:${COUCHDB_PASSWORD}`);
  return {
    Authorization: `Basic ${credentials}`,
  };
}

export async function startSync(db: CareLinkDatabase, userRole: 'nurse' | 'patient') {
  // Stop any existing sync
  await stopSync();

  const isNurse = userRole === 'nurse';

  // Sync patients collection
  syncState.patients = replicateCouchDB({
    collection: db.patients,
    url: `${COUCHDB_URL}/carelink_patients/`,
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          ...getAuthHeaders(),
        },
      }),
    live: true,
    pull: {
      batchSize: 100,
    },
    push: isNurse
      ? {
          batchSize: 100,
        }
      : undefined, // Patients can only pull
  });

  // Sync referrals collection
  syncState.referrals = replicateCouchDB({
    collection: db.referrals,
    url: `${COUCHDB_URL}/carelink_referrals/`,
    fetch: (url, options) =>
      fetch(url, {
        ...options,
        headers: {
          ...options?.headers,
          ...getAuthHeaders(),
        },
      }),
    live: true,
    pull: {
      batchSize: 100,
    },
    push: {
      batchSize: 100,
      // For patients, we'll handle request-only updates in the hook
    },
  });

  // Handle errors
  syncState.patients.error$.subscribe((err) => {
    console.error('Patients sync error:', err);
  });

  syncState.referrals.error$.subscribe((err) => {
    console.error('Referrals sync error:', err);
  });

  return syncState;
}

export async function stopSync() {
  if (syncState.patients) {
    await syncState.patients.cancel();
    syncState.patients = null;
  }
  if (syncState.referrals) {
    await syncState.referrals.cancel();
    syncState.referrals = null;
  }
}

export function getSyncState() {
  return syncState;
}
```

**Step 2: Create environment variables file**

Create `.env.local` if it doesn't exist, add:

```
NEXT_PUBLIC_COUCHDB_URL=http://localhost:5984
NEXT_PUBLIC_COUCHDB_USER=carelink-admin
NEXT_PUBLIC_COUCHDB_PASSWORD=secure-password1
```

**Step 3: Commit**

```bash
git add src/lib/db/sync.ts
git commit -m "feat(db): add CouchDB replication with role-based sync"
```

---

## GROUP 3: Seed Data

### Task 7: Update Seed Data with Patients and Nurses

**Files:**
- Modify: `src/lib/seed-data.ts`

**Step 1: Rewrite seed-data.ts with patient records**

```typescript
import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import { Patient, FacilityId } from './db/schema';
import { hashPassword } from './auth';

// Demo password for all preset accounts
const DEMO_PASSWORD = 'demo123';

// Patient seed data - matches existing referrals
const samplePatients: Array<Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'passwordHash'>> = [
  {
    name: 'Margaret Thompson',
    email: 'margaret@patient.demo',
    phone: '+1-555-0101',
    dateOfBirth: '1952-03-15',
    healthCardNumber: 'ON-9876543210',
    preferredLanguage: 'en',
    preferredFacilityId: 'regional-hospital',
    communicationPreference: 'both',
    address: '45 Lakeside Dr, Clearwater Bay, ON',
    emergencyContactName: 'John Thompson',
    emergencyContactPhone: '+1-555-0111',
  },
  {
    name: 'James Whitehorse',
    email: 'james@patient.demo',
    phone: '+1-555-0102',
    dateOfBirth: '1978-08-22',
    healthCardNumber: 'ON-8765432109',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'sms',
    address: '12 Pine Ridge Rd, Kenora, ON',
    emergencyContactName: 'Mary Whitehorse',
    emergencyContactPhone: '+1-555-0112',
  },
  {
    name: 'Sarah Running Bear',
    email: 'sarah@patient.demo',
    phone: '+1-555-0103',
    dateOfBirth: '1990-11-08',
    preferredLanguage: 'cree',
    preferredFacilityId: 'mental-health-center',
    communicationPreference: 'email',
    address: '88 Northern Lights Ave, Dryden, ON',
  },
  {
    name: 'Robert Chen',
    email: 'robert@patient.demo',
    phone: '+1-555-0104',
    dateOfBirth: '1985-05-30',
    healthCardNumber: 'ON-7654321098',
    preferredLanguage: 'en',
    preferredFacilityId: 'community-health',
    communicationPreference: 'both',
    address: '23 Birch St, Clearwater Bay, ON',
  },
  {
    name: 'Emily Blackwood',
    email: 'emily@patient.demo',
    phone: '+1-555-0105',
    dateOfBirth: '1968-02-14',
    healthCardNumber: 'ON-6543210987',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'sms',
    address: '56 Forest Trail, Thunder Bay, ON',
    emergencyContactName: 'David Blackwood',
    emergencyContactPhone: '+1-555-0115',
    accessibilityNeeds: 'Requires wheelchair access',
  },
  {
    name: 'William Frost',
    email: 'william@patient.demo',
    phone: '+1-555-0106',
    dateOfBirth: '1975-09-03',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'both',
    address: '34 Logger Lane, Red Lake, ON',
  },
  {
    name: 'Dorothy Clearsky',
    email: 'dorothy@patient.demo',
    phone: '+1-555-0107',
    dateOfBirth: '1945-12-25',
    healthCardNumber: 'ON-5432109876',
    preferredLanguage: 'ojibwe',
    preferredFacilityId: 'regional-hospital',
    communicationPreference: 'both',
    address: '67 Elder Circle, Sioux Lookout, ON',
    emergencyContactName: 'Michael Clearsky',
    emergencyContactPhone: '+1-555-0117',
    accessibilityNeeds: 'Hard of hearing - prefers written communication',
  },
];

// Nurse seed data
const sampleNurses = [
  {
    name: 'Demo Nurse',
    email: 'nurse@carelink.demo',
  },
  {
    name: 'Admin Nurse',
    email: 'admin@carelink.demo',
  },
];

export async function seedDatabase() {
  const db = await getDatabase();

  // Check if already seeded
  const existingPatients = await db.patients.find().exec();
  if (existingPatients.length > 0) {
    console.log('Database already has patient data, skipping seed');
    return false;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Create patient records and store their IDs
  const patientIds: Map<string, string> = new Map();

  for (const patient of samplePatients) {
    const id = uuidv4();
    patientIds.set(patient.name, id);

    await db.patients.insert({
      ...patient,
      id,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create nurse records in users collection
  for (const nurse of sampleNurses) {
    await db.users.insert({
      id: uuidv4(),
      email: nurse.email,
      name: nurse.name,
      role: 'nurse',
      passwordHash,
      createdAt: now,
    });
  }

  // Create referrals linked to patients
  const sampleReferrals = [
    {
      patientName: 'Margaret Thompson',
      patientPhone: '+1-555-0101',
      diagnosis: 'Atrial fibrillation with rapid ventricular response. Requires cardiology follow-up and anticoagulation management.',
      priority: 'critical' as const,
      status: 'pending' as const,
      facilityId: 'regional-hospital' as FacilityId,
      referralType: 'Cardiology',
      notes: 'Patient experienced palpitations during community dinner. ECG showed AFib. Started on rate control.',
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'James Whitehorse',
      patientPhone: '+1-555-0102',
      diagnosis: 'Type 2 diabetes with poor glycemic control. HbA1c 9.2%. Needs endocrinology consultation for insulin adjustment.',
      priority: 'high' as const,
      status: 'scheduled' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Cardiology',
      appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Sarah Running Bear',
      diagnosis: 'Generalized anxiety disorder with recent increase in symptoms following community layoffs. Requesting counseling services.',
      priority: 'medium' as const,
      status: 'pending' as const,
      facilityId: 'mental-health-center' as FacilityId,
      referralType: 'Mental Health',
      notes: 'Patient prefers virtual appointments due to stigma concerns. Has reliable internet access.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Robert Chen',
      patientPhone: '+1-555-0104',
      diagnosis: 'Post-surgical follow-up for appendectomy performed during last medical evacuation. Healing well, no complications.',
      priority: 'low' as const,
      status: 'completed' as const,
      facilityId: 'community-health' as FacilityId,
      referralType: 'Follow-up',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Emily Blackwood',
      patientPhone: '+1-555-0105',
      diagnosis: 'Suspected breast mass on self-exam. Urgent imaging and oncology referral needed for evaluation.',
      priority: 'critical' as const,
      status: 'scheduled' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Oncology',
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'William Frost',
      patientPhone: '+1-555-0106',
      diagnosis: 'Chronic lower back pain with radiculopathy. MRI shows L4-L5 disc herniation. Requires neurology consultation.',
      priority: 'medium' as const,
      status: 'pending' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Neurology',
      notes: 'Patient is a forestry worker. Pain affecting ability to work.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Dorothy Clearsky',
      diagnosis: 'Missed cardiology follow-up due to highway closure. Patient stable but needs rescheduling.',
      priority: 'high' as const,
      status: 'missed' as const,
      facilityId: 'regional-hospital' as FacilityId,
      referralType: 'Cardiology',
      notes: 'Original appointment was during January storm. Family concerned about transportation.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const referral of sampleReferrals) {
    const patientId = patientIds.get(referral.patientName);
    if (!patientId) {
      console.error(`No patient ID found for ${referral.patientName}`);
      continue;
    }

    await db.referrals.insert({
      ...referral,
      id: uuidv4(),
      patientId,
      updatedAt: now,
      isSynced: Math.random() > 0.3,
    });
  }

  console.log('Database seeded with patients, nurses, and referrals');
  return true;
}

export async function clearDatabase() {
  const db = await getDatabase();

  const referrals = await db.referrals.find().exec();
  for (const doc of referrals) {
    await doc.remove();
  }

  const patients = await db.patients.find().exec();
  for (const doc of patients) {
    await doc.remove();
  }

  const users = await db.users.find().exec();
  for (const doc of users) {
    await doc.remove();
  }

  console.log('Database cleared');
}

export { DEMO_PASSWORD };
```

**Step 2: Commit**

```bash
git add src/lib/seed-data.ts
git commit -m "feat(seed): add patient and nurse preset accounts with linked referrals"
```

---

## GROUP 4: Auth Updates

### Task 8: Update Login API for Demo Accounts

**Files:**
- Modify: `src/app/api/auth/login/route.ts`

**Step 1: Rewrite login route to support demo accounts**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

// Valid nurse email domains for demo
const NURSE_EMAIL_DOMAINS = [
  '@carelink.com',
  '@carelink.demo',
  '@hospital.com',
  '@clinic.com',
  '@health.gov',
  '@clearwaterridge.ca',
];

// Demo patient domain
const PATIENT_DEMO_DOMAIN = '@patient.demo';

function isNurseEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  return NURSE_EMAIL_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));
}

function isPatientDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(PATIENT_DEMO_DOMAIN);
}

function formatName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = await getDatabase();

    // Check for demo patient account
    if (isPatientDemoEmail(normalizedEmail)) {
      const patient = await db.patients.findOne({ selector: { email: normalizedEmail } }).exec();

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient account not found. Use a demo account like margaret@patient.demo' },
          { status: 401 }
        );
      }

      const patientData = patient.toJSON();

      if (patientData.passwordHash) {
        const isValid = await verifyPassword(password, patientData.passwordHash);
        if (!isValid) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
      }

      const user = {
        id: patientData.id,
        email: patientData.email,
        name: patientData.name,
        role: 'patient' as const,
        createdAt: patientData.createdAt,
      };

      console.log('=================================');
      console.log('PATIENT LOGIN SUCCESS');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Name: ${user.name}`);
      console.log('=================================');

      return NextResponse.json({ success: true, user });
    }

    // Check for demo nurse account
    if (normalizedEmail.endsWith('@carelink.demo')) {
      const nurse = await db.users.findOne({ selector: { email: normalizedEmail } }).exec();

      if (nurse) {
        const nurseData = nurse.toJSON();
        if (nurseData.passwordHash) {
          const isValid = await verifyPassword(password, nurseData.passwordHash);
          if (!isValid) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
          }
        }

        const user = {
          id: nurseData.id,
          email: nurseData.email,
          name: nurseData.name,
          role: 'nurse' as const,
          createdAt: nurseData.createdAt,
        };

        console.log('=================================');
        console.log('NURSE LOGIN SUCCESS (Demo Account)');
        console.log(`Email: ${normalizedEmail}`);
        console.log(`Name: ${user.name}`);
        console.log('=================================');

        return NextResponse.json({ success: true, user });
      }
    }

    // Regular nurse login (non-demo organizational emails)
    if (!isNurseEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'Invalid credentials. Healthcare providers must use an organizational email.',
          hint: 'Demo: Use nurse@carelink.demo or an email ending in @hospital.com',
        },
        { status: 401 }
      );
    }

    // For non-demo nurse domains, accept any password (demo mode)
    const user = {
      id: generateId(),
      email: normalizedEmail,
      name: formatName(normalizedEmail),
      role: 'nurse' as const,
      createdAt: new Date().toISOString(),
    };

    console.log('=================================');
    console.log('NURSE LOGIN SUCCESS');
    console.log(`Email: ${normalizedEmail}`);
    console.log(`Name: ${user.name}`);
    console.log('=================================');

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/auth/login/route.ts
git commit -m "feat(auth): support demo patient and nurse account login"
```

---

### Task 9: Update useReferrals Hook with patientId

**Files:**
- Modify: `src/lib/db/hooks.ts`

**Step 1: Update addReferral to require patientId**

Change the addReferral function signature and implementation:

```typescript
const addReferral = async (data: Omit<Referral, 'id' | 'createdAt' | 'updatedAt' | 'isSynced'>) => {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.referrals.insert({
    ...data,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    isSynced: false,
  });
};
```

**Step 2: Add submitRequest function for patients**

Add after updateStatus function:

```typescript
const submitRequest = async (id: string, requestType: 'reschedule' | 'cancel', requestedDate?: string, reason?: string) => {
  const db = await getDatabase();
  const doc = await db.referrals.findOne(id).exec();
  if (doc) {
    await doc.patch({
      pendingRequest: {
        type: requestType,
        requestedDate,
        reason,
        requestedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  }
};

const clearRequest = async (id: string) => {
  const db = await getDatabase();
  const doc = await db.referrals.findOne(id).exec();
  if (doc) {
    await doc.patch({
      pendingRequest: undefined,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    });
  }
};

const approveRequest = async (id: string) => {
  const db = await getDatabase();
  const doc = await db.referrals.findOne(id).exec();
  if (doc) {
    const referral = doc.toJSON() as Referral;
    const request = referral.pendingRequest;

    if (!request) return;

    const updates: Partial<Referral> = {
      pendingRequest: undefined,
      updatedAt: new Date().toISOString(),
      isSynced: false,
    };

    if (request.type === 'reschedule' && request.requestedDate) {
      updates.appointmentDate = request.requestedDate;
    } else if (request.type === 'cancel') {
      updates.status = 'cancelled';
    }

    await doc.patch(updates);
  }
};
```

**Step 3: Update return statement**

```typescript
return { referrals, loading, addReferral, updateReferral, updateStatus, syncAll, submitRequest, clearRequest, approveRequest };
```

**Step 4: Commit**

```bash
git add src/lib/db/hooks.ts
git commit -m "feat(hooks): add patient request functions to useReferrals"
```

---

## GROUP 5: Patient Selection UI

### Task 10: Create PatientSelect Component

**Files:**
- Create: `src/components/scan/PatientSelect.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, UserPlus, Check } from 'lucide-react';
import { usePatients } from '@/lib/db/use-patients';
import { Patient } from '@/lib/db/schema';

interface PatientSelectProps {
  value?: string; // patientId
  onSelect: (patient: Patient) => void;
  onCreateNew: (suggestedName?: string) => void;
  suggestedName?: string; // From OCR
}

export function PatientSelect({ value, onSelect, onCreateNew, suggestedName }: PatientSelectProps) {
  const { patients, searchPatients, getPatientById, loading } = usePatients();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Array<{ item: Patient; score: number }>>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedPatient = value ? getPatientById(value) : undefined;

  // Auto-search when suggestedName changes (from OCR)
  useEffect(() => {
    if (suggestedName && !value) {
      setQuery(suggestedName);
      const searchResults = searchPatients(suggestedName);
      setResults(searchResults);

      // If no good matches, prompt to create
      if (searchResults.length === 0 || (searchResults[0]?.score ?? 1) > 0.3) {
        // Will show "Create new patient" prominently
      }
      setIsOpen(true);
    }
  }, [suggestedName, value, searchPatients]);

  // Search as user types
  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchPatients(query);
      setResults(searchResults);
    } else {
      setResults([]);
    }
  }, [query, searchPatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    onSelect(patient);
    setQuery('');
    setIsOpen(false);
  };

  const handleCreateNew = () => {
    onCreateNew(query || suggestedName);
    setIsOpen(false);
  };

  if (loading) {
    return (
      <div className="h-10 bg-muted animate-pulse rounded-md" />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {selectedPatient ? (
        <div className="flex items-center gap-2 p-3 bg-completed-muted rounded-md border border-completed-muted">
          <Check className="h-4 w-4 text-completed-foreground" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">{selectedPatient.name}</p>
            <p className="text-sm text-muted-foreground truncate">{selectedPatient.email}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onSelect(undefined as unknown as Patient); // Clear selection
              setIsOpen(true);
            }}
          >
            Change
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name or email..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="pl-10 bg-background"
            />
          </div>

          {isOpen && (
            <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-auto shadow-lg border-border">
              {results.length > 0 ? (
                <div className="p-1">
                  {results.map(({ item, score }) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {item.email} {item.phone && `· ${item.phone}`}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {Math.round((1 - score) * 100)}% match
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : query.trim() ? (
                <div className="p-4 text-center text-muted-foreground">
                  No patients found matching &quot;{query}&quot;
                </div>
              ) : null}

              <div className="border-t border-border p-1">
                <button
                  type="button"
                  onClick={handleCreateNew}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-accent"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create new patient{query ? `: "${query}"` : '...'}</span>
                </button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/scan/PatientSelect.tsx
git commit -m "feat(ui): add PatientSelect component with fuzzy search"
```

---

### Task 11: Create CreatePatientModal Component

**Files:**
- Create: `src/components/scan/CreatePatientModal.tsx`

**Step 1: Create the modal component**

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { usePatients } from '@/lib/db/use-patients';
import { Patient, FACILITIES } from '@/lib/db/schema';
import { toast } from 'sonner';

const createPatientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  healthCardNumber: z.string().optional(),
  preferredLanguage: z.enum(['en', 'fr', 'cree', 'ojibwe']),
  preferredFacilityId: z.string().optional(),
  communicationPreference: z.enum(['sms', 'email', 'both']),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
});

type CreatePatientFormData = z.infer<typeof createPatientSchema>;

interface CreatePatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPatientCreated: (patient: Patient) => void;
  suggestedName?: string;
}

export function CreatePatientModal({
  open,
  onOpenChange,
  onPatientCreated,
  suggestedName,
}: CreatePatientModalProps) {
  const { addPatient } = usePatients();

  const form = useForm<CreatePatientFormData>({
    resolver: zodResolver(createPatientSchema),
    defaultValues: {
      name: suggestedName || '',
      email: '',
      phone: '',
      dateOfBirth: '',
      healthCardNumber: '',
      preferredLanguage: 'en',
      preferredFacilityId: '',
      communicationPreference: 'both',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      accessibilityNeeds: '',
    },
  });

  // Update name when suggestedName changes
  if (suggestedName && form.getValues('name') !== suggestedName && !form.formState.isDirty) {
    form.setValue('name', suggestedName);
  }

  const onSubmit = async (data: CreatePatientFormData) => {
    try {
      const newPatient = await addPatient({
        ...data,
        preferredFacilityId: data.preferredFacilityId || undefined,
      });
      toast.success(`Patient "${newPatient.name}" created`);
      onPatientCreated(newPatient);
      onOpenChange(false);
      form.reset();
    } catch {
      toast.error('Failed to create patient');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Patient</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Required Fields */}
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Patient's full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="patient@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="healthCardNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Health Card Number</FormLabel>
                  <FormControl>
                    <Input placeholder="ON-1234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="preferredLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Language *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="cree">Cree</SelectItem>
                        <SelectItem value="ojibwe">Ojibwe</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="communicationPreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Communication Preference *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sms">SMS Only</SelectItem>
                        <SelectItem value="email">Email Only</SelectItem>
                        <SelectItem value="both">Both SMS & Email</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredFacilityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Facility</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preferred facility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FACILITIES.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Full address" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="emergencyContactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Contact name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="emergencyContactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="555-123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="accessibilityNeeds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Accessibility Needs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any accessibility requirements..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Creating...' : 'Create Patient'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/scan/CreatePatientModal.tsx
git commit -m "feat(ui): add CreatePatientModal for inline patient creation"
```

---

### Task 12: Update ScanForm with Patient Selection

**Files:**
- Modify: `src/components/scan/ScanForm.tsx`
- Modify: `src/components/scan/scanFormSchema.ts`

**Step 1: Update scanFormSchema.ts to include patientId**

```typescript
import { z } from 'zod';
import { FACILITIES } from '@/lib/db/schema';

const facilityIds = FACILITIES.map((facility) => facility.id);

export const scanFormSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
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
  patientId: '',
  patientName: '',
  patientPhone: '',
  diagnosis: '',
  priority: 'medium',
  facilityId: '',
  referralType: '',
  notes: '',
};
```

**Step 2: Update ScanForm.tsx to use PatientSelect**

Replace the entire file with:

```typescript
'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, FacilityId, Patient } from '@/lib/db/schema';
import { ImageUpload } from './ImageUpload';
import { PatientSelect } from './PatientSelect';
import { CreatePatientModal } from './CreatePatientModal';
import { toast } from 'sonner';
import { scanFormDefaults, scanFormSchema, ScanFormData, ScanFormOcrData } from './scanFormSchema';

export function ScanForm() {
  const router = useRouter();
  const { addReferral } = useReferrals();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [suggestedPatientName, setSuggestedPatientName] = useState<string>();

  const form = useForm<ScanFormData>({
    defaultValues: scanFormDefaults,
    resolver: zodResolver(scanFormSchema),
    mode: 'onBlur',
  });

  const facilityId = form.watch('facilityId');
  const facility = FACILITIES.find((f) => f.id === facilityId);

  const handleOcrComplete = (data: ScanFormOcrData) => {
    if (data.patientName) {
      setSuggestedPatientName(data.patientName);
      form.setValue('patientName', data.patientName, { shouldValidate: true });
    }
    if (data.diagnosis) form.setValue('diagnosis', data.diagnosis, { shouldValidate: true });
    if (data.priority) form.setValue('priority', data.priority, { shouldValidate: true });
    if (data.referralType) form.setValue('referralType', data.referralType, { shouldValidate: true });
    if (data.notes) form.setValue('notes', data.notes, { shouldValidate: false });

    toast.success('Form auto-filled from OCR. Please verify and select patient.');
  };

  const handleOcrError = (error: string) => {
    toast.error(error);
  };

  const handlePatientSelect = useCallback(
    (patient: Patient | undefined) => {
      if (patient) {
        form.setValue('patientId', patient.id, { shouldValidate: true });
        form.setValue('patientName', patient.name, { shouldValidate: true });
        if (patient.phone) {
          form.setValue('patientPhone', patient.phone, { shouldValidate: true });
        }
      } else {
        form.setValue('patientId', '', { shouldValidate: true });
        form.setValue('patientName', '', { shouldValidate: true });
        form.setValue('patientPhone', '', { shouldValidate: true });
      }
    },
    [form]
  );

  const handleCreatePatient = useCallback((suggestedName?: string) => {
    setSuggestedPatientName(suggestedName);
    setShowCreateModal(true);
  }, []);

  const handlePatientCreated = useCallback(
    (patient: Patient) => {
      handlePatientSelect(patient);
      setShowCreateModal(false);
    },
    [handlePatientSelect]
  );

  const onSubmit = async (data: ScanFormData) => {
    try {
      await addReferral({
        patientId: data.patientId,
        patientName: data.patientName,
        patientPhone: data.patientPhone,
        diagnosis: data.diagnosis,
        priority: data.priority,
        status: 'pending',
        facilityId: data.facilityId as FacilityId,
        referralType: data.referralType,
        notes: data.notes,
      });

      toast.success('Referral created and saved locally.');
      router.push('/dashboard');
    } catch {
      toast.error('Failed to create referral.');
    }
  };

  return (
    <div className="space-y-6">
      <ImageUpload onOcrComplete={handleOcrComplete} onError={handleOcrError} />

      <Card className="card-elevated bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground font-semibold text-[18px] tracking-tight">
            Referral Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Patient Selection */}
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Patient *</FormLabel>
                    <FormControl>
                      <PatientSelect
                        value={field.value}
                        onSelect={handlePatientSelect}
                        onCreateNew={handleCreatePatient}
                        suggestedName={suggestedPatientName}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="diagnosis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">
                      Diagnosis / Reason for Referral *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the diagnosis or reason for this referral"
                        {...field}
                        className="bg-background resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="facilityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Facility *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('referralType', '', { shouldValidate: true });
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Select facility" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FACILITIES.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.distance})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="referralType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-foreground">Referral Type *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={!facility}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={facility ? 'Select type' : 'Select facility first'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {facility?.types.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Priority *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low - Routine</SelectItem>
                        <SelectItem value="medium">Medium - Standard</SelectItem>
                        <SelectItem value="high">High - Soon</SelectItem>
                        <SelectItem value="critical">Critical - Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-foreground">Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional information..."
                        {...field}
                        className="bg-background resize-none min-h-[100px]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full font-semibold"
                  disabled={form.formState.isSubmitting}
                  size="lg"
                >
                  {form.formState.isSubmitting ? 'Creating...' : 'Create Referral'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <CreatePatientModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onPatientCreated={handlePatientCreated}
        suggestedName={suggestedPatientName}
      />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/scan/ScanForm.tsx src/components/scan/scanFormSchema.ts
git commit -m "feat(scan): integrate patient selection with OCR matching"
```

---

## GROUP 6: Patient Request System

### Task 13: Create RequestModal Component

**Files:**
- Create: `src/components/patient/RequestModal.tsx`

**Step 1: Create the modal component**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/patient/RequestModal.tsx
git commit -m "feat(ui): add RequestModal for patient reschedule/cancel requests"
```

---

### Task 14: Update Patient Referral Detail Page

**Files:**
- Modify: `src/app/(patient)/my-referrals/[id]/page.tsx`

**Step 1: Add request buttons and modal integration**

Replace the entire file with:

```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calendar, ChevronLeft, MapPin, CalendarX, RefreshCw } from 'lucide-react';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES } from '@/lib/db/schema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RequestModal } from '@/components/patient/RequestModal';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, { label: string; tone: string }> = {
  pending: { label: 'Awaiting Scheduling', tone: 'bg-pending-muted text-pending-foreground' },
  scheduled: { label: 'Appointment Scheduled', tone: 'bg-scheduled-muted text-scheduled-foreground' },
  completed: { label: 'Completed', tone: 'bg-completed-muted text-completed-foreground' },
  missed: { label: 'Missed - Please Contact Us', tone: 'bg-missed-muted text-missed-foreground' },
  cancelled: { label: 'Cancelled', tone: 'bg-muted text-muted-foreground' },
};

export default function ReferralDetailPage() {
  const params = useParams<{ id: string }>();
  const { referrals, loading, submitRequest } = useReferrals();
  const [requestType, setRequestType] = useState<'reschedule' | 'cancel' | null>(null);

  const referral = referrals.find((item) => item.id === params.id);
  const facility = referral ? FACILITIES.find((item) => item.id === referral.facilityId) : null;
  const nursePhone = '1 (705) 555-0199';

  const canRequest = referral?.status === 'scheduled' && !referral.pendingRequest;
  const hasPendingRequest = !!referral?.pendingRequest;

  const handleSubmitRequest = async (requestedDate?: string, reason?: string) => {
    if (!referral || !requestType) return;

    try {
      await submitRequest(referral.id, requestType, requestedDate, reason);
      toast.success(
        requestType === 'reschedule'
          ? 'Reschedule request submitted. A nurse will contact you.'
          : 'Cancellation request submitted. A nurse will review it.'
      );
      setRequestType(null);
    } catch {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="text-lg text-muted-foreground">Loading referral details...</p>
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="space-y-6">
        <Link href="/my-referrals" className="inline-flex items-center gap-2 text-accent">
          <ChevronLeft className="h-4 w-4" />
          Back to referrals
        </Link>
        <Card>
          <CardContent className="p-8 text-center space-y-3">
            <h1 className="text-2xl font-semibold text-foreground">Referral not found</h1>
            <p className="text-muted-foreground">
              This referral is no longer available. Please return to your referrals list.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[referral.status] ?? {
    label: referral.status,
    tone: 'bg-muted text-muted-foreground',
  };

  return (
    <div className="space-y-6">
      <Link href="/my-referrals" className="inline-flex items-center gap-2 text-accent">
        <ChevronLeft className="h-4 w-4" />
        Back to referrals
      </Link>

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">{referral.referralType}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 text-accent" />
              <span>{facility?.name ?? 'Unknown Facility'}</span>
            </div>
          </div>

          <Badge className={`text-sm px-3 py-1 ${statusInfo.tone}`}>{statusInfo.label}</Badge>

          {/* Pending Request Notice */}
          {hasPendingRequest && referral.pendingRequest && (
            <div className="p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted">
              <p className="font-medium text-scheduled-foreground">
                {referral.pendingRequest.type === 'reschedule'
                  ? 'Reschedule Request Pending'
                  : 'Cancellation Request Pending'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Submitted{' '}
                {new Date(referral.pendingRequest.requestedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
                . A nurse will review your request soon.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Diagnosis</p>
              <p className="text-base text-foreground">{referral.diagnosis}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Facility Address</p>
              <p className="text-base text-foreground">{facility?.address ?? 'Address not available'}</p>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Nurse Contact</p>
            <p className="text-base text-foreground">{nursePhone}</p>
          </div>

          {referral.appointmentDate && (
            <div className="flex items-center gap-3 p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted">
              <Calendar className="h-5 w-5 text-scheduled-foreground" />
              <div>
                <p className="text-sm text-scheduled-foreground">Appointment Date</p>
                <p className="text-base text-foreground">
                  {new Date(referral.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Request Buttons */}
          {canRequest && (
            <div className="grid gap-3 sm:grid-cols-2 pt-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setRequestType('reschedule')}
              >
                <RefreshCw className="h-4 w-4" />
                Request Reschedule
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => setRequestType('cancel')}
              >
                <CalendarX className="h-4 w-4" />
                Request Cancellation
              </Button>
            </div>
          )}

          {referral.notes && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="text-base text-foreground whitespace-pre-line">{referral.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Modal */}
      <RequestModal
        open={requestType !== null}
        onOpenChange={(open) => !open && setRequestType(null)}
        type={requestType ?? 'reschedule'}
        currentDate={referral.appointmentDate}
        onSubmit={handleSubmitRequest}
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(patient)/my-referrals/[id]/page.tsx
git commit -m "feat(patient): add reschedule and cancel request buttons"
```

---

### Task 15: Add Request Badge to ReferralCard

**Files:**
- Modify: `src/components/dashboard/ReferralCard.tsx`

**Step 1: Update ReferralCard to show request badge**

Add import at top:
```typescript
import { Bell } from 'lucide-react';
```

Find the badge section (around line 87-96) and update it:

```typescript
          <div className="flex items-center gap-2 pt-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs ${priorityStyles[referral.priority]}`}>
              {referral.priority}
            </span>
            {referral.pendingRequest && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-scheduled-muted text-scheduled-foreground font-semibold">
                <Bell className="h-3 w-3" />
                Request
              </span>
            )}
            {isOverdue && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-destructive text-destructive-foreground font-semibold uppercase tracking-wide">
                <AlertCircle className="h-3 w-3" />
                Overdue
              </span>
            )}
          </div>
```

**Step 2: Commit**

```bash
git add src/components/dashboard/ReferralCard.tsx
git commit -m "feat(ui): add pending request badge to ReferralCard"
```

---

### Task 16: Update KanbanBoard for Request Handling and Cancelled Status

**Files:**
- Modify: `src/components/dashboard/KanbanBoard.tsx`
- Create: `src/components/dashboard/RequestApprovalDialog.tsx`

**Step 1: Create RequestApprovalDialog component**

```typescript
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
```

**Step 2: Update KanbanBoard columns to include cancelled**

Update the columns array at the top:

```typescript
const columns: { title: string; status: Status; statuses?: Status[] }[] = [
  { title: 'Pending', status: 'pending' },
  { title: 'Scheduled', status: 'scheduled' },
  { title: 'Completed', status: 'completed' },
  { title: 'Missed / Cancelled', status: 'missed', statuses: ['missed', 'cancelled'] },
];
```

**Step 3: Update the column rendering to handle multiple statuses**

Update the columns.map section:

```typescript
{columns.map((column) => (
  <KanbanColumn
    key={column.status}
    title={column.title}
    status={column.status}
    referrals={referrals.filter((r) =>
      column.statuses ? column.statuses.includes(r.status) : r.status === column.status
    )}
  />
))}
```

**Step 4: Commit**

```bash
git add src/components/dashboard/KanbanBoard.tsx src/components/dashboard/RequestApprovalDialog.tsx
git commit -m "feat(kanban): add request approval dialog and cancelled status column"
```

---

## GROUP 7: Patient Filtering

### Task 17: Filter My-Referrals by Logged-in Patient

**Files:**
- Modify: `src/app/(patient)/my-referrals/page.tsx`

**Step 1: Update to filter by logged-in patient**

Replace the entire file with:

```typescript
'use client';

import { useReferrals } from '@/lib/db/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralCard } from '@/components/patient/ReferralCard';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { referrals, loading } = useReferrals();

  // Filter referrals by the logged-in patient's ID
  const patientReferrals = referrals.filter((r) => r.patientId === user?.id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-lg text-muted-foreground">Loading your referrals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Health Referrals</h1>
        <p className="text-lg text-muted-foreground">
          View and track the status of your healthcare referrals
        </p>
      </div>

      {/* Referrals List or Empty State */}
      {patientReferrals.length === 0 ? (
        <Card className="bg-card shadow-md border-border">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground">No Referrals Yet</h2>
              <p className="text-lg text-muted-foreground">
                You do not have any active referrals at this time. When your healthcare provider
                creates a referral for you, it will appear here.
              </p>
            </div>

            <div className="p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted max-w-md mx-auto">
              <p className="text-base text-scheduled-foreground">
                If you believe you should have a referral, please contact your healthcare provider
                or request a callback.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
            <p className="text-lg text-foreground">
              You have <span className="font-semibold text-accent">{patientReferrals.length}</span>{' '}
              active referral{patientReferrals.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Referral Cards */}
          <div className="space-y-6">
            {patientReferrals.map((referral) => (
              <ReferralCard
                key={referral.id}
                referralType={referral.referralType}
                facilityId={referral.facilityId}
                status={referral.status}
                appointmentDate={referral.appointmentDate}
                onViewDetails={() => router.push(`/my-referrals/${referral.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/app/(patient)/my-referrals/page.tsx
git commit -m "feat(patient): filter referrals by logged-in patient ID"
```

---

## Final Verification

### Task 18: Build and Test

**Step 1: Run linter**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 2: Run build**

Run:
```bash
npm run build
```

Expected: Build succeeds

**Step 3: Test demo flow**

1. Start the app: `npm run dev`
2. Ensure CouchDB is running: `docker-compose up -d`
3. Login as nurse: `nurse@carelink.demo` / `demo123`
4. Load sample data if empty
5. Login as patient: `margaret@patient.demo` / `demo123`
6. Verify patient sees only their referrals
7. Test reschedule request flow

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete patient database rework with sync and request system"
```

---

## Summary

**Parallel Groups:**
- GROUP 1: Tasks 1, 2, 3 (foundation)
- GROUP 2: Tasks 4, 5, 6 (database layer)
- GROUP 4: Tasks 8, 9 (auth updates)
- GROUP 5: Tasks 10, 11, 12 (patient selection UI)
- GROUP 6: Tasks 13, 14, 15, 16 (patient request system)

**Sequential Groups:**
- GROUP 3: Task 7 (must complete after GROUP 2)
- GROUP 7: Task 17 (must complete after GROUP 6)

**Total Tasks:** 18
**Estimated Commits:** 18
