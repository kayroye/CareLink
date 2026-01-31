# CareLink Design Document

**Date:** 2026-01-30
**Project:** Spark 2026 Hackathon - Clearwater Ridge Healthcare Coordination
**Team Size:** 3-4 (Claude Code as primary implementer with parallel subagents)

---

## Overview

CareLink is an offline-first Progressive Web App (PWA) for tracking patient referrals in remote communities where connectivity is unreliable. The app enables healthcare workers to create, track, and manage referrals even during network outages, with automatic sync when connectivity returns.

**Core Problem:** The Clearwater Ridge cardiac incident—a missed referral that led to a preventable emergency airlift—happened because referrals fall into a "black hole" with no tracking or accountability.

**Solution:** A local-first referral tracking system with intelligent alerts, patient-portable QR codes, and multi-channel reminders.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Database | RxDB with IndexedDB adapter |
| UI | Tailwind CSS + shadcn/ui (via frontend-design skill) |
| OCR | Groq Vision API (Llama 3.2 Vision) |
| QR Codes | qrcode.react |
| Calendar | ics (npm package) |
| SMS | Twilio Programmable Messaging |
| Deployment | Vercel (PWA) |

---

## Data Model

### Preset Facilities

```typescript
const FACILITIES = [
  { id: 'regional-hospital', name: 'Regional Hospital', distance: '110km', types: ['Emergency', 'Surgery', 'Cardiology'] },
  { id: 'mental-health-center', name: 'Northern Mental Health Center', distance: '85km', types: ['Mental Health', 'Counseling'] },
  { id: 'specialist-clinic', name: 'Lakeview Specialist Clinic', distance: '95km', types: ['Cardiology', 'Oncology', 'Neurology'] },
  { id: 'community-health', name: 'Clearwater Nursing Station', distance: 'Local', types: ['Primary Care', 'Follow-up'] },
];
```

### Referral Schema (RxDB)

```typescript
{
  id: string,              // UUID, generated client-side
  patientName: string,
  patientPhone?: string,
  diagnosis: string,
  priority: 'low' | 'medium' | 'high' | 'critical',
  status: 'pending' | 'scheduled' | 'completed' | 'missed',
  facilityId: string,      // References preset facility
  referralType: string,    // "Cardiology", "Mental Health", etc.
  appointmentDate?: string,// ISO timestamp (when scheduled)
  notes?: string,
  createdAt: string,       // ISO timestamp
  updatedAt: string,
  synced: boolean          // false = pending sync, true = synced
}
```

---

## Page Structure

### `/dashboard` - Home Screen
- Header: App title, network toggle switch, sync button
- Kanban columns: Pending → Scheduled → Completed → Missed
- Referral cards show: patient name, referral type, facility, priority badge, sync status icon
- Stale referrals (14+ days pending) show red border and "OVERDUE" badge
- Floating "+" button to create new referral

### `/scan` - New Referral Creation
- Two tabs: "Scan Form" | "Manual Entry"
- Scan tab: Image upload → Groq Vision API → pre-filled form
- If offline: "OCR requires connectivity" message, manual entry only
- Manual tab: Standard form with facility dropdown, referral type, priority, notes
- Save creates referral with `synced: false`

### `/patient/[id]` - Referral Detail
- Full referral information
- Status change buttons (Scheduled, Completed, Missed)
- When scheduled: date/time picker, "Add to Calendar" (ICS download), SMS reminder toggle
- "Generate QR Code" button for patient wallet
- Edit capability

### `/wallet/[data]` - Patient Smart Wallet (Read-Only)
- Decodes patient data from URL
- Displays: name, priority conditions, current medications, recent referrals
- No database lookup needed—data is encoded in the URL
- Time-limited (expiry timestamp encoded)

---

## Key Features

### A. Network Toggle & Sync Simulation
- Global toggle in header: "Online" ↔ "Offline" (simulated for demo)
- Offline state: gray overlay on header, "Offline Mode" badge
- Referral cards show sync icon: ⏳ (pending) or ✓ (synced)
- "Sync Now" button animates all pending cards to synced state

### B. OCR with Groq Vision
- User uploads/captures image of paper referral form
- Image sent to Groq Vision API (Llama 3.2 Vision)
- Returns structured JSON: patient name, diagnosis, priority, facility
- Form pre-fills with extracted data
- Offline fallback: manual entry with "OCR unavailable" message

### C. Stale State Alerts
- Client-side check: referrals with `status: 'pending'` and `createdAt` > 14 days
- Visual treatment: red border, "OVERDUE" badge, sorted to top
- Prevents patients from being "lost" in the system

### D. QR Code Smart Wallet
- Generates QR containing: patient name, DOB, current medications (max 5), recent referrals (max 3)
- Uses qrcode.react library (client-side generation)
- QR links to `/wallet/[encoded-data]` for read-only view
- Data compressed to fit QR limit (~2KB)
- Time-limited via encoded expiry timestamp

### E. ICS Calendar Generation
- Available when referral status is "Scheduled"
- Generates .ics file client-side using `ics` package
- Contains: appointment title, date/time, location, 24-hour reminder
- Downloads directly—works offline

### F. SMS Reminders (Twilio)
- Triggered when referral scheduled with appointment date
- Sends 24 hours before: "Reply YES to confirm or NO to reschedule"
- Patient reply updates referral status via webhook
- No reply / "NO" → flags for Community Health Rep follow-up

---

## Implementation Phases

### Phase 1: Foundation (Parallel - 3 agents)

| Agent | Task | Output |
|-------|------|--------|
| Agent A | Next.js 16 setup, Tailwind, shadcn/ui init, layout shell | `/app/layout.tsx`, base components |
| Agent B | RxDB setup, schema, database hooks | `/lib/db.ts`, `useReferrals()` hook |
| Agent C | Routing structure, placeholder pages | All route files with basic structure |

### Phase 2: Core Features (Parallel - 3 agents)

| Agent | Task | Output |
|-------|------|--------|
| Agent A | Dashboard Kanban board with drag-drop | Referral cards, column layout, filtering |
| Agent B | Scan page + Groq Vision integration | Image upload, API call, form pre-fill |
| Agent C | Patient detail page + QR code generation | Full referral view, qrcode.react |

### Phase 3: Enhancements (Parallel - 4 agents)

| Agent | Task | Output |
|-------|------|--------|
| Agent A | Network toggle + sync simulation | Global context, visual states, animation |
| Agent B | Stale state alerts (14-day logic) | Red styling, sorting, badge |
| Agent C | ICS file generation | Download button, ics package |
| Agent D | Twilio SMS integration | API routes, webhook handler |

### Phase 4: Polish (Sequential)
- Invoke `frontend-design` skill for UI refinement
- Create sample referral forms (PDFs) for demo
- Pre-seed database with realistic test data
- Mobile viewport testing

---

## Demo Script (7 Minutes)

### [0:00-1:00] Problem Setup
> "January 2026. A storm hits Clearwater Ridge. The highway closes. An elderly patient misses their cardiology follow-up. Two weeks later, they're airlifted in a preventable emergency."

- Reference case study incident
- "This happened because a referral fell into a black hole."

### [1:00-2:30] Solution Introduction
> "CareLink is an offline-first referral tracking system."

- Show dashboard with Kanban board
- Point out: "Every referral has a status. Nothing gets lost."
- Show red "OVERDUE" card: "Flagged automatically after 14 days."

### [2:30-4:00] Offline Demo (Killer Moment)
> "Let's simulate the storm."

- Flip Network Toggle to OFFLINE
- Upload referral form: "The nurse receives a fax. But we're offline."
- Show manual entry fallback
- Save referral: "Saved instantly to local database."
- Show ⏳ pending sync icon

### [4:00-5:00] Data Mule Moment
> "A volunteer driver arrives. Their tablet connects to WiFi."

- Flip Network Toggle to ONLINE
- Click "Sync Now"
- Cards animate: ⏳ → ✓
- "We transported data using the car, not broken phone lines."

### [5:00-6:00] Patient Empowerment
- Generate QR code: "Medical summary travels with the patient."
- Show ICS download: "Calendar reminders work offline."
- Trigger live SMS (if Twilio ready)

### [6:00-7:00] Impact & Close
- Budget: fits $60K first-year, <$25K ongoing
- "Every missed referral costs $200. Every airlift costs $15,000."
- "CareLink ensures no patient falls through the cracks."

---

## Error Handling

| Scenario | Handling |
|----------|----------|
| Groq API fails | Toast: "OCR unavailable", fallback to manual entry |
| Image too large | Client-side resize to max 1MB |
| RxDB init fails | Error screen with "Clear data & retry" |
| Twilio webhook fails | Log error, show "Reminder status unknown" |
| QR data too large | Truncate to essential fields only |

---

## Security Notes (Q&A Prep)

- All data stays on device until user-initiated sync
- QR wallet URLs are time-limited (expiry timestamp encoded)
- No PHI transmitted without explicit user action
- "In production: encryption at rest, role-based access, audit logging"

---

## Budget Alignment

| Component | Estimated Cost |
|-----------|----------------|
| Development (this hackathon) | $0 (team time) |
| Vercel hosting (free tier) | $0 |
| Groq API (free tier) | $0 |
| Twilio (trial credit) | $0 for demo |
| **Production annual:** | |
| Vercel Pro | ~$240/year |
| Twilio messaging | ~$500/year (estimated volume) |
| Groq API | ~$200/year |
| Tablets (4 units) | ~$2,400 one-time |
| **Total Year 1:** | ~$3,340 |
| **Ongoing:** | ~$940/year |

Well within the $60K first-year and $25K ongoing budget constraints.

---

## Next Steps

1. Save this design document
2. Set up git worktree for isolated development
3. Create detailed implementation plan
4. Execute Phase 1 with parallel agents
