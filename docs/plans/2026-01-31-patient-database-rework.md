# Patient Database Rework Design

## Overview

Rework the database to support proper patient records with CouchDB sync, enabling:
- Preset demo accounts for hackathon presentation
- Patient-referral linking via foreign keys
- OCR-assisted patient matching on referral creation
- Patient request system (reschedule/cancel) with nurse approval
- Offline-first sync between nurse and patient devices

## Data Model

### Patient Schema (NEW)

```typescript
interface Patient {
  id: string;

  // Basic info
  name: string;
  email: string;           // unique, used for magic link login
  phone?: string;
  dateOfBirth?: string;

  // Healthcare identifiers
  healthCardNumber?: string;

  // Preferences
  preferredLanguage: 'en' | 'fr' | 'cree' | 'ojibwe';
  preferredFacilityId?: FacilityId;
  communicationPreference: 'sms' | 'email' | 'both';

  // Contact & accessibility
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  accessibilityNeeds?: string;

  // Auth
  passwordHash?: string;   // for demo login

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### Updated Referral Schema

```typescript
interface Referral {
  // ... existing fields ...

  patientId: string;        // NEW: foreign key to Patient
  patientName: string;      // KEEP: for display convenience

  // NEW: pending request from patient
  pendingRequest?: {
    type: 'reschedule' | 'cancel';
    requestedDate?: string; // for reschedule requests
    reason?: string;
    requestedAt: string;
  };

  // Updated status options
  status: 'pending' | 'scheduled' | 'completed' | 'missed' | 'cancelled';
}
```

## Demo Accounts

### Preset Patient Accounts

| Name | Email | Password |
|------|-------|----------|
| Margaret Thompson | margaret@patient.demo | demo123 |
| James Whitehorse | james@patient.demo | demo123 |
| Sarah Running Bear | sarah@patient.demo | demo123 |
| Robert Chen | robert@patient.demo | demo123 |
| Emily Blackwood | emily@patient.demo | demo123 |
| William Frost | william@patient.demo | demo123 |
| Dorothy Clearsky | dorothy@patient.demo | demo123 |

### Preset Nurse Accounts

| Name | Email | Password |
|------|-------|----------|
| Demo Nurse | nurse@carelink.demo | demo123 |
| Admin Nurse | admin@carelink.demo | demo123 |

### Auth Changes

- Patients can log in with email + password (in addition to magic link)
- `@patient.demo` and `@carelink.demo` domains use seeded accounts
- Magic link flow remains for realistic patient onboarding

## Referral Creation Flow

```
NURSE UPLOADS REFERRAL IMAGE
            ↓
OCR EXTRACTS: name, diagnosis, phone, etc.
            ↓
PATIENT MATCHING LOGIC
┌─────────────────────────────────────────────────┐
│ Search patients by extracted name (fuzzy match) │
│                                                  │
│ IF matches found:                                │
│   → Show dropdown with suggestions               │
│   → "Margaret Thompson" (92% match)              │
│   → "Create new patient..." option               │
│                                                  │
│ IF no matches:                                   │
│   → Auto-open "Create Patient" modal             │
│   → Name field pre-filled from OCR               │
└─────────────────────────────────────────────────┘
            ↓
FORM SHOWS: Patient (selected/created), Diagnosis,
            Facility, Priority, Notes
            ↓
SUBMIT → Creates referral with patientId
```

## Patient Request System

### Patient Actions

On referral detail page, patients with scheduled appointments see:
- "Request Reschedule" button → date picker + optional reason
- "Request Cancellation" button → required reason + confirmation

Submitting creates a `pendingRequest` object on the referral.

### Nurse Notification

Badge appears on referral card in Kanban:
```
┌─────────────────────────────────────┐
│  Margaret Thompson      🔔 REQUEST  │
│  Cardiology - Critical              │
│  Regional Hospital                  │
└─────────────────────────────────────┘
```

Clicking shows request details with Approve/Deny buttons:
- Approve reschedule → updates appointment date, clears request
- Approve cancel → changes status to "cancelled", clears request
- Deny → clears request (optionally with reason)

## Status Flow

```
pending ──────→ scheduled ──────→ completed
    │               │
    │               ├──────────→ missed
    │               │
    │               └──────────→ cancelled
    │
    └─────────────────────────→ cancelled
```

### Kanban Layout

4 columns with cancelled grouped under missed:
```
| Pending | Scheduled | Completed | Missed/Cancelled |
```

## Sync Architecture

### CouchDB Setup

Using existing docker-compose.yml:
- Host: localhost:5984
- Admin: carelink-admin / secure-password1
- Databases: carelink_patients, carelink_referrals, carelink_users

### Sync Diagram

```
NURSE DEVICE                      PATIENT DEVICE
┌─────────────┐                   ┌─────────────┐
│ RxDB        │                   │ RxDB        │
│ (IndexedDB) │                   │ (IndexedDB) │
└──────┬──────┘                   └──────┬──────┘
       │                                  │
       │  push/pull                       │  pull-only
       │  replication                     │  replication
       ▼                                  ▼
┌─────────────────────────────────────────────────────┐
│              CouchDB (localhost:5984)               │
└─────────────────────────────────────────────────────┘
```

### Sync Rules by Role

| Role | Patients | Referrals | Users |
|------|----------|-----------|-------|
| Nurse | Read/Write | Read/Write | Read own |
| Patient | Read own | Read own + Write requests only | Read own |

### Conflict Resolution

- Last-write-wins for most fields
- Nurse always wins for status changes
- Requests are append-only (patient adds, nurse resolves)

### Offline Behavior

- Online: Real-time sync, changes appear within seconds
- Offline: Full read access to last-synced data, writes queue locally
- Back online: Queued changes push automatically, pull latest from server

## Implementation Plan

### Files to Create

- `src/lib/db/patients.ts` - Patient collection schema & hooks
- `src/lib/db/sync.ts` - CouchDB replication setup
- `src/components/scan/PatientSelect.tsx` - Searchable patient dropdown
- `src/components/scan/CreatePatientModal.tsx` - Inline patient creation
- `src/components/patient/RequestModal.tsx` - Reschedule/cancel request modals

### Files to Modify

- `src/lib/db/schema.ts` - Add Patient schema, update Referral
- `src/lib/db/index.ts` - Register patient collection, init sync
- `src/lib/db/hooks.ts` - Add usePatients(), update referral hooks
- `src/lib/seed-data.ts` - Seed patient + nurse accounts, link referrals
- `src/components/scan/ScanForm.tsx` - Replace name input with PatientSelect
- `src/app/api/auth/login/route.ts` - Support patient password login
- `src/app/(patient)/my-referrals/page.tsx` - Filter by logged-in patientId
- `src/app/(patient)/my-referrals/[id]/page.tsx` - Add request buttons
- `src/components/dashboard/ReferralCard.tsx` - Add request badge
- `src/components/dashboard/KanbanBoard.tsx` - Handle request approval, cancelled status

### New Dependencies

- `fuse.js` - Fuzzy patient name matching for OCR results

## CouchDB Database Setup

Before running the app, create required databases:

```bash
# Create databases
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_patients
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_referrals
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_users
```
