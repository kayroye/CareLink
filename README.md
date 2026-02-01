# CareLink

**Offline-First Patient Referral Tracking for Rural Healthcare**

CareLink is a Progressive Web Application (PWA) designed for healthcare coordination in remote Canadian communities. Built for the Spark 2026 Hackathon, it addresses the challenge of tracking patient referrals in areas with unreliable internet connectivity.

## Built For

**WDS Spark 2026 Hackathon** - Technology for Rural Healthcare Access (Clearwater Ridge)

This project addresses the challenge of healthcare coordination in remote Canadian communities, where internet connectivity is unreliable and referrals to regional hospitals often get lost in paper-based/disconnected systems.

## The Problem

Healthcare workers at Clearwater Ridge nursing station currently track referrals using paper forms, spreadsheets, and phone calls. Referrals often get "lost" in the system, leading to missed appointments and delayed care. Winter disruptions and geographical isolation make consistent communication with regional hospitals difficult.

## The Solution

CareLink provides a closed-loop digital referral system that works offline and syncs when connectivity is available. It features a Kanban-style dashboard for nurses and a patient-facing portal for appointment tracking.

---

## Key Features

### For Nurses
- **Kanban Dashboard** - Visual tracking of referrals across statuses (Pending, Scheduled, Completed, Missed)
- **OCR Document Scanner** - Photograph paper referrals and auto-extract patient data using AI
- **Stale Referral Alerts** - Automatic flagging of referrals older than 14 days
- **Patient Request Management** - Approve/deny reschedule and cancellation requests
- **Fuzzy Patient Matching** - Smart suggestions when creating new referrals

### For Patients
- **My Referrals** - View all referrals with patient-friendly summaries
- **Appointment Calendar** - See scheduled appointments with Add to Calendar (ICS) support
- **Reschedule/Cancel Requests** - Submit requests directly through the app
- **Accessibility Settings** - Adjustable text size, language preferences
- **QR Wallet** - Shareable QR code with critical health information

### System Features
- **Offline-First** - Full functionality without internet, syncs automatically when online
- **PWA Support** - Installable on mobile devices, works like a native app
- **Real-time Sync** - CouchDB replication for multi-device synchronization
- **Multi-language** - English, French, Cree, and Ojibwe support

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4, shadcn/ui, Radix UI |
| Local Database | RxDB with Dexie.js (IndexedDB) |
| Server Database | CouchDB 3 |
| PWA | Serwist 9 |
| Forms | React Hook Form, Zod |
| OCR | Groq API (LLaMA Vision) |
| SMS | Twilio |

---

## Prerequisites

Before starting, ensure you have:

- **Node.js** 20+ (LTS recommended)
- **npm** or **yarn**
- **Docker** and **Docker Compose**
- **Git**

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/spark-hackathon-26.git
cd spark-hackathon-26
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start CouchDB with Docker

Start the CouchDB container:

```bash
docker-compose up -d
```

This starts CouchDB on port `5984` with:
- **Username:** `carelink-admin`
- **Password:** `secure-password1`

Verify CouchDB is running:

```bash
curl http://localhost:5984/
```

You should see:
```json
{"couchdb":"Welcome","version":"3.x.x",...}
```

### 4. Initialize the Databases

CareLink requires three databases. Create them with these curl commands:

```bash
# Create patients database
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_patients

# Create referrals database
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_referrals

# Create users database
curl -X PUT http://carelink-admin:secure-password1@localhost:5984/carelink_users
```

Each command should return:
```json
{"ok":true}
```

#### Verify Database Creation

```bash
curl http://carelink-admin:secure-password1@localhost:5984/_all_dbs
```

You should see:
```json
["_replicator","_users","carelink_patients","carelink_referrals","carelink_users"]
```

### 5. Configure Environment Variables

Create a `.env.local` file in the project root:

```bash
# CouchDB Configuration
COUCHDB_URL="http://localhost:5984"
COUCHDB_USER="carelink-admin"
COUCHDB_PASSWORD="secure-password1"

# Groq API (for OCR document scanning)
GROQ_API_KEY="your-groq-api-key-here"

# Twilio (optional - for SMS reminders)
# TWILIO_ACCOUNT_SID="your-twilio-sid"
# TWILIO_AUTH_TOKEN="your-twilio-token"
# TWILIO_PHONE_NUMBER="+1234567890"
```

> **Note:** Get a free Groq API key at [console.groq.com](https://console.groq.com)

### 6. Start the Development Server

```bash
npm run dev
```

The app will be available at `https://localhost:3000` (HTTPS is required for PWA features).

> **Note:** You may need to accept the self-signed certificate warning in your browser.

---

## Demo Accounts

The app seeds demo accounts on first run for testing:

### Nurse Accounts

| Email | Password | Role |
|-------|----------|------|
| nurse@carelink.demo | demo123 | Nurse |
| admin@carelink.demo | demo123 | Nurse |

### Patient Accounts

| Email | Password | Name |
|-------|----------|------|
| margaret@patient.demo | demo123 | Margaret Thompson |
| james@patient.demo | demo123 | James Whitehorse |
| sarah@patient.demo | demo123 | Sarah Running Bear |
| robert@patient.demo | demo123 | Robert Chen |
| emily@patient.demo | demo123 | Emily Blackwood |
| william@patient.demo | demo123 | William Frost |
| dorothy@patient.demo | demo123 | Dorothy Clearsky |

---

## Project Structure

```
spark-hackathon-26/
├── src/
│   ├── app/
│   │   ├── (nurse)/              # Nurse-specific pages
│   │   │   ├── dashboard/        # Kanban board
│   │   │   ├── patient/[id]/     # Patient details
│   │   │   ├── scan/             # OCR scanner
│   │   │   └── nurse-settings/   # Nurse preferences
│   │   ├── (patient)/            # Patient-specific pages
│   │   │   ├── my-referrals/     # Patient's referral list
│   │   │   ├── appointments/     # Appointment calendar
│   │   │   ├── request-callback/ # SMS callback requests
│   │   │   └── settings/         # Patient preferences
│   │   ├── api/                  # API routes
│   │   │   ├── auth/             # Authentication endpoints
│   │   │   ├── couchdb/          # CouchDB proxy
│   │   │   ├── ocr/              # Vision API
│   │   │   └── sms/              # Twilio integration
│   │   ├── login/                # Login page
│   │   └── sw.ts                 # Service Worker
│   ├── lib/
│   │   ├── db/                   # RxDB database layer
│   │   │   ├── index.ts          # Database initialization
│   │   │   ├── schema.ts         # TypeScript schemas
│   │   │   ├── sync.ts           # CouchDB replication
│   │   │   └── hooks.ts          # React hooks
│   │   ├── auth/                 # Authentication utilities
│   │   └── seed-data.ts          # Demo data
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── dashboard/            # Kanban components
│   │   └── layout/               # App shell
│   └── contexts/                 # React contexts
├── docs/plans/                   # Design documentation
├── docker-compose.yml            # CouchDB container config
├── couchdb.ini                   # CouchDB CORS config
└── package.json
```

---

## API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Email/password login |
| `/api/auth/logout` | POST | Clear session |
| `/api/auth/magic-link/send` | POST | Send magic link email |
| `/api/auth/magic-link/verify` | POST | Verify magic link token |

### OCR

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/ocr` | POST | Extract data from referral document image |

**Request:**
```json
{
  "image": "base64-encoded-image-or-url"
}
```

**Response:**
```json
{
  "patientName": "John Doe",
  "diagnosis": "Cardiac arrhythmia",
  "priority": "high",
  "referralType": "Cardiology",
  "notes": "Requires urgent evaluation"
}
```

### SMS

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sms/send` | POST | Send appointment reminder |
| `/api/sms/webhook` | POST | Receive SMS replies |

### CouchDB Proxy

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/couchdb/*` | ALL | Authenticated proxy to CouchDB |

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│  Nurse Device   │     │ Patient Device  │
│  ┌───────────┐  │     │  ┌───────────┐  │
│  │   RxDB    │  │     │  │   RxDB    │  │
│  │(IndexedDB)│  │     │  │(IndexedDB)│  │
│  └─────┬─────┘  │     │  └─────┬─────┘  │
│        │        │     │        │        │
└────────┼────────┘     └────────┼────────┘
         │ push/pull             │ pull-only
         │ replication           │ replication
         └───────────┬───────────┘
                     │
              ┌──────┴──────┐
              │   CouchDB   │
              │   Server    │
              │ (Docker or  │
              │   Cloud)    │
              └─────────────┘
```

**Offline Behavior:**
- **Online:** Real-time bidirectional sync
- **Offline:** Full read/write access to local data, changes queue locally
- **Back Online:** Queued changes push automatically, pulls latest data

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (HTTPS, port 3000) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Docker Commands Reference

```bash
# Start CouchDB
docker-compose up -d

# Stop CouchDB
docker-compose down

# View CouchDB logs
docker-compose logs -f couchdb

# Stop and remove data volume (reset database)
docker-compose down -v
```

---

## Troubleshooting

### CouchDB Connection Issues

1. **Verify CouchDB is running:**
   ```bash
   docker ps
   curl http://localhost:5984/
   ```

2. **Check CORS is enabled:**
   ```bash
   curl http://carelink-admin:secure-password1@localhost:5984/_node/_local/_config/chttpd/enable_cors
   ```
   Should return `"true"`

3. **Reset databases (if needed):**
   ```bash
   curl -X DELETE http://carelink-admin:secure-password1@localhost:5984/carelink_patients
   curl -X DELETE http://carelink-admin:secure-password1@localhost:5984/carelink_referrals
   curl -X DELETE http://carelink-admin:secure-password1@localhost:5984/carelink_users
   # Then recreate with PUT commands
   ```

### PWA/Service Worker Issues

- Clear browser cache and service worker registration
- Ensure you're accessing via HTTPS
- Check the browser console for errors

### Demo Data Not Appearing

- Clear browser IndexedDB storage
- Refresh the page - demo data seeds automatically on first load


---

## Authors
- Kalan Roye
- Christopher Tela
- Daimen Miller

## License

MIT
