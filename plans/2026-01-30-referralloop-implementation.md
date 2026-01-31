# ReferralLoop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an offline-first PWA for tracking patient referrals in Clearwater Ridge with OCR scanning, stale alerts, QR wallet, and SMS reminders.

**Architecture:** Next.js 16 App Router with RxDB for offline-first storage. Groq Vision API for OCR. Simulated network state for demo. All data persists in IndexedDB.

**Tech Stack:** Next.js 16, TypeScript, RxDB, Tailwind CSS, shadcn/ui, qrcode.react, ics, Twilio

**Verification:** Use Playwright MCP after each phase to screenshot and verify UI renders correctly.

**Commit Strategy:** Commit after each task. Run `npm run build` before each commit to ensure no build errors.

---

## Phase 1: Foundation

### Task 1.1: Initialize Next.js Project

**Files:**
- Create: `package.json`, `next.config.js`, `tsconfig.json`, `tailwind.config.ts`, etc.

**Step 1: Create Next.js app with TypeScript and Tailwind**

```bash
cd /c/Users/dsmas/SynologyDrive/Coding\ Projects/Hackathons/Spark\ 26/spark-hackathon-26/.worktrees/referral-loop
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

Select options:
- Would you like to use TypeScript? Yes
- Would you like to use ESLint? Yes
- Would you like to use Tailwind CSS? Yes
- Would you like your code inside a `src/` directory? Yes
- Would you like to use App Router? Yes
- Would you like to use Turbopack? Yes
- Would you like to customize the import alias? Yes (@/*)

**Step 2: Verify project runs**

```bash
npm run dev
```

Open http://localhost:3000 - should see Next.js welcome page.

**Step 3: Verify with Playwright**

Use Playwright MCP `browser_navigate` to http://localhost:3000 and `browser_snapshot` to confirm page loads.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js 16 project with TypeScript and Tailwind"
```

---

### Task 1.2: Install and Configure shadcn/ui

**Files:**
- Modify: `package.json`
- Create: `components.json`
- Create: `src/lib/utils.ts`
- Create: `src/components/ui/*`

**Step 1: Initialize shadcn/ui**

```bash
npx shadcn@latest init
```

Select options:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 2: Add core UI components**

```bash
npx shadcn@latest add button card input badge dialog toast sheet select tabs form label textarea
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add shadcn/ui with core components"
```

---

### Task 1.3: Set Up RxDB with IndexedDB

**Files:**
- Create: `src/lib/db/index.ts`
- Create: `src/lib/db/schema.ts`
- Create: `src/lib/db/hooks.ts`
- Modify: `package.json`

**Step 1: Install RxDB dependencies**

```bash
npm install rxdb rxjs uuid
npm install --save-dev @types/uuid
```

**Step 2: Create database schema**

Create `src/lib/db/schema.ts`:

```typescript
import { RxJsonSchema } from 'rxdb';

export const FACILITIES = [
  { id: 'regional-hospital', name: 'Regional Hospital', distance: '110km', types: ['Emergency', 'Surgery', 'Cardiology'] },
  { id: 'mental-health-center', name: 'Northern Mental Health Center', distance: '85km', types: ['Mental Health', 'Counseling'] },
  { id: 'specialist-clinic', name: 'Lakeview Specialist Clinic', distance: '95km', types: ['Cardiology', 'Oncology', 'Neurology'] },
  { id: 'community-health', name: 'Clearwater Nursing Station', distance: 'Local', types: ['Primary Care', 'Follow-up'] },
] as const;

export type FacilityId = typeof FACILITIES[number]['id'];
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type Status = 'pending' | 'scheduled' | 'completed' | 'missed';

export interface Referral {
  id: string;
  patientName: string;
  patientPhone?: string;
  diagnosis: string;
  priority: Priority;
  status: Status;
  facilityId: FacilityId;
  referralType: string;
  appointmentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
}

export const referralSchema: RxJsonSchema<Referral> = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    patientName: { type: 'string' },
    patientPhone: { type: 'string' },
    diagnosis: { type: 'string' },
    priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
    status: { type: 'string', enum: ['pending', 'scheduled', 'completed', 'missed'] },
    facilityId: { type: 'string' },
    referralType: { type: 'string' },
    appointmentDate: { type: 'string' },
    notes: { type: 'string' },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
    synced: { type: 'boolean' },
  },
  required: ['id', 'patientName', 'diagnosis', 'priority', 'status', 'facilityId', 'referralType', 'createdAt', 'updatedAt', 'synced'],
};
```

**Step 3: Create database initialization**

Create `src/lib/db/index.ts`:

```typescript
import { createRxDatabase, RxDatabase, RxCollection } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { Referral, referralSchema } from './schema';

type ReferralCollection = RxCollection<Referral>;

interface DatabaseCollections {
  referrals: ReferralCollection;
}

type ReferralLoopDatabase = RxDatabase<DatabaseCollections>;

let dbPromise: Promise<ReferralLoopDatabase> | null = null;

export async function getDatabase(): Promise<ReferralLoopDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = createRxDatabase<DatabaseCollections>({
    name: 'referralloop',
    storage: getRxStorageDexie(),
  }).then(async (db) => {
    await db.addCollections({
      referrals: {
        schema: referralSchema,
      },
    });
    return db;
  });

  return dbPromise;
}

export type { ReferralLoopDatabase, ReferralCollection };
```

**Step 4: Create React hooks for database access**

Create `src/lib/db/hooks.ts`:

```typescript
'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './index';
import { Referral, Status, Priority, FacilityId } from './schema';

export function useReferrals() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: any;

    async function init() {
      const db = await getDatabase();
      subscription = db.referrals.find().$.subscribe((docs) => {
        setReferrals(docs.map((doc) => doc.toJSON() as Referral));
        setLoading(false);
      });
    }

    init();

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const addReferral = async (data: Omit<Referral, 'id' | 'createdAt' | 'updatedAt' | 'synced'>) => {
    const db = await getDatabase();
    const now = new Date().toISOString();
    await db.referrals.insert({
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      synced: false,
    });
  };

  const updateReferral = async (id: string, updates: Partial<Referral>) => {
    const db = await getDatabase();
    const doc = await db.referrals.findOne(id).exec();
    if (doc) {
      await doc.patch({
        ...updates,
        updatedAt: new Date().toISOString(),
        synced: false,
      });
    }
  };

  const updateStatus = async (id: string, status: Status) => {
    await updateReferral(id, { status });
  };

  const syncAll = async () => {
    const db = await getDatabase();
    const unsyncedDocs = await db.referrals.find({ selector: { synced: false } }).exec();
    for (const doc of unsyncedDocs) {
      await doc.patch({ synced: true });
    }
  };

  return { referrals, loading, addReferral, updateReferral, updateStatus, syncAll };
}
```

**Step 5: Verify build**

```bash
npm run build
```

Expected: Build succeeds (may have warnings about client-side only code, that's OK).

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add RxDB with referral schema and hooks"
```

---

### Task 1.4: Create Network Context

**Files:**
- Create: `src/contexts/NetworkContext.tsx`

**Step 1: Create network context**

Create `src/contexts/NetworkContext.tsx`:

```typescript
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface NetworkContextType {
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  toggleNetwork: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  const toggleNetwork = () => setIsOnline((prev) => !prev);

  return (
    <NetworkContext.Provider value={{ isOnline, setIsOnline, toggleNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
}
```

**Step 2: Verify build**

```bash
npm run build
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add network context for online/offline simulation"
```

---

### Task 1.5: Create App Layout Shell

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/layout/Header.tsx`
- Create: `src/components/layout/BottomNav.tsx`

**Step 1: Update globals.css for medical theme**

Modify `src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 199 89% 48%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 199 89% 48%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}

.offline-mode {
  @apply bg-gray-100;
}
```

**Step 2: Create Header component**

Create `src/components/layout/Header.tsx`:

```typescript
'use client';

import { useNetwork } from '@/contexts/NetworkContext';
import { useReferrals } from '@/lib/db/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

export function Header() {
  const { isOnline, toggleNetwork } = useNetwork();
  const { syncAll, referrals } = useReferrals();

  const unsyncedCount = referrals.filter((r) => !r.synced).length;

  const handleSync = async () => {
    if (isOnline) {
      await syncAll();
    }
  };

  return (
    <header className={`sticky top-0 z-50 border-b bg-white px-4 py-3 ${!isOnline ? 'bg-gray-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-primary">ReferralLoop</h1>
          {!isOnline && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Offline Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {unsyncedCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {unsyncedCount} pending sync
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline || unsyncedCount === 0}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync
          </Button>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-gray-400" />
            )}
            <Switch checked={isOnline} onCheckedChange={toggleNetwork} />
          </div>
        </div>
      </div>
    </header>
  );
}
```

**Step 3: Create BottomNav component**

Create `src/components/layout/BottomNav.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanLine, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scan', label: 'New Referral', icon: Plus },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 text-sm',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

**Step 4: Update layout.tsx**

Modify `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ReferralLoop - Offline-First Patient Referral Tracking',
  description: 'Track and manage patient referrals even when offline',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NetworkProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </div>
          <Toaster />
        </NetworkProvider>
      </body>
    </html>
  );
}
```

**Step 5: Install lucide-react icons**

```bash
npm install lucide-react
```

**Step 6: Add switch component from shadcn**

```bash
npx shadcn@latest add switch
```

**Step 7: Verify build**

```bash
npm run build
```

**Step 8: Start dev server and verify with Playwright**

```bash
npm run dev
```

Use Playwright MCP:
1. `browser_navigate` to http://localhost:3000
2. `browser_snapshot` to verify header with network toggle renders

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add app layout with header and bottom navigation"
```

---

### Task 1.6: Create Route Structure

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/scan/page.tsx`
- Create: `src/app/patient/[id]/page.tsx`
- Create: `src/app/wallet/[data]/page.tsx`
- Modify: `src/app/page.tsx`

**Step 1: Create dashboard page placeholder**

Create `src/app/dashboard/page.tsx`:

```typescript
export default function DashboardPage() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <p className="text-muted-foreground">Referral tracking board coming soon...</p>
    </div>
  );
}
```

**Step 2: Create scan page placeholder**

Create `src/app/scan/page.tsx`:

```typescript
export default function ScanPage() {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">New Referral</h2>
      <p className="text-muted-foreground">OCR scanning and form entry coming soon...</p>
    </div>
  );
}
```

**Step 3: Create patient detail page placeholder**

Create `src/app/patient/[id]/page.tsx`:

```typescript
export default function PatientPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Patient Details</h2>
      <p className="text-muted-foreground">Referral ID: {params.id}</p>
    </div>
  );
}
```

**Step 4: Create wallet page placeholder**

Create `src/app/wallet/[data]/page.tsx`:

```typescript
export default function WalletPage({ params }: { params: { data: string } }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold">Patient Wallet</h2>
      <p className="text-muted-foreground">QR-decoded patient summary coming soon...</p>
    </div>
  );
}
```

**Step 5: Update home page to redirect**

Modify `src/app/page.tsx`:

```typescript
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

**Step 6: Verify build and navigation**

```bash
npm run build
npm run dev
```

Use Playwright MCP:
1. Navigate to http://localhost:3000 - should redirect to /dashboard
2. Click "New Referral" in bottom nav - should go to /scan
3. `browser_snapshot` each page

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add route structure with placeholder pages"
```

---

## Phase 1 Complete Checkpoint

**Verify:**
1. `npm run build` succeeds
2. App runs at http://localhost:3000
3. Header shows with network toggle
4. Bottom nav works
5. All routes accessible

**Use Playwright MCP to take screenshots of:**
- /dashboard
- /scan
- Toggle network to offline mode

**Commit summary:**

```bash
git log --oneline -6
```

Should show 6 commits for Phase 1.

---

## Phase 2: Core Features

### Task 2.1: Dashboard Kanban Board

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/KanbanBoard.tsx`
- Create: `src/components/dashboard/ReferralCard.tsx`
- Create: `src/components/dashboard/KanbanColumn.tsx`

**Step 1: Create ReferralCard component**

Create `src/components/dashboard/ReferralCard.tsx`:

```typescript
'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, MapPin } from 'lucide-react';
import { Referral, FACILITIES } from '@/lib/db/schema';
import { cn } from '@/lib/utils';

interface ReferralCardProps {
  referral: Referral;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export function ReferralCard({ referral }: ReferralCardProps) {
  const facility = FACILITIES.find((f) => f.id === referral.facilityId);
  const createdDate = new Date(referral.createdAt);
  const daysSinceCreated = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = referral.status === 'pending' && daysSinceCreated >= 14;

  return (
    <Link href={`/patient/${referral.id}`}>
      <Card className={cn(
        'cursor-pointer transition-shadow hover:shadow-md',
        isOverdue && 'border-red-500 border-2'
      )}>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold">{referral.patientName}</h3>
              <p className="text-sm text-muted-foreground">{referral.referralType}</p>
            </div>
            <div className="flex items-center gap-1">
              {referral.synced ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm line-clamp-2">{referral.diagnosis}</p>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{facility?.name} ({facility?.distance})</span>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={priorityColors[referral.priority]}>
                {referral.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">OVERDUE</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

**Step 2: Create KanbanColumn component**

Create `src/components/dashboard/KanbanColumn.tsx`:

```typescript
'use client';

import { Referral, Status } from '@/lib/db/schema';
import { ReferralCard } from './ReferralCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  title: string;
  status: Status;
  referrals: Referral[];
  className?: string;
}

const columnColors = {
  pending: 'border-t-amber-500',
  scheduled: 'border-t-blue-500',
  completed: 'border-t-green-500',
  missed: 'border-t-red-500',
};

export function KanbanColumn({ title, status, referrals, className }: KanbanColumnProps) {
  // Sort overdue referrals to top for pending column
  const sortedReferrals = [...referrals].sort((a, b) => {
    if (status === 'pending') {
      const aDays = Math.floor((Date.now() - new Date(a.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const bDays = Math.floor((Date.now() - new Date(b.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const aOverdue = aDays >= 14;
      const bOverdue = bDays >= 14;
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={cn('flex flex-col', className)}>
      <div className={cn('rounded-t-lg border-t-4 bg-muted px-3 py-2', columnColors[status])}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="rounded-full bg-background px-2 py-0.5 text-sm">
            {referrals.length}
          </span>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto rounded-b-lg bg-muted/50 p-3">
        {sortedReferrals.map((referral) => (
          <ReferralCard key={referral.id} referral={referral} />
        ))}
        {referrals.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No referrals
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create KanbanBoard component**

Create `src/components/dashboard/KanbanBoard.tsx`:

```typescript
'use client';

import { useReferrals } from '@/lib/db/hooks';
import { KanbanColumn } from './KanbanColumn';
import { Status } from '@/lib/db/schema';

const columns: { title: string; status: Status }[] = [
  { title: 'Pending', status: 'pending' },
  { title: 'Scheduled', status: 'scheduled' },
  { title: 'Completed', status: 'completed' },
  { title: 'Missed', status: 'missed' },
];

export function KanbanBoard() {
  const { referrals, loading } = useReferrals();

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading referrals...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.status}
          title={column.title}
          status={column.status}
          referrals={referrals.filter((r) => r.status === column.status)}
          className="min-h-[400px]"
        />
      ))}
    </div>
  );
}
```

**Step 4: Update dashboard page**

Modify `src/app/dashboard/page.tsx`:

```typescript
'use client';

import { KanbanBoard } from '@/components/dashboard/KanbanBoard';

export default function DashboardPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Referral Dashboard</h2>
        <p className="text-muted-foreground">
          Track and manage patient referrals for Clearwater Ridge
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
```

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Verify with Playwright**

```bash
npm run dev
```

Use Playwright MCP to navigate to /dashboard and snapshot - should show empty Kanban columns.

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Kanban board dashboard with referral cards"
```

---

### Task 2.2: Scan Page with OCR

**Files:**
- Modify: `src/app/scan/page.tsx`
- Create: `src/components/scan/ScanForm.tsx`
- Create: `src/components/scan/ImageUpload.tsx`
- Create: `src/lib/ocr.ts`
- Create: `src/app/api/ocr/route.ts`

**Step 1: Create OCR API route for Groq**

Create `src/app/api/ocr/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json();

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the following information from this medical referral form and return it as JSON:
{
  "patientName": "full name",
  "diagnosis": "diagnosis or reason for referral",
  "priority": "low" | "medium" | "high" | "critical",
  "referralType": "type of specialist or department",
  "notes": "any additional notes"
}

If a field is not found, use null. For priority, infer from urgency words (urgent/emergency = critical, soon = high, routine = low).`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    }

    return NextResponse.json({ error: 'Could not parse OCR result' }, { status: 500 });
  } catch (error) {
    console.error('OCR error:', error);
    return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
  }
}
```

**Step 2: Create .env.local file (add to .gitignore)**

Create `.env.local`:

```
GROQ_API_KEY=your_groq_api_key_here
```

Update `.gitignore` to include:

```
.env.local
```

**Step 3: Create ImageUpload component**

Create `src/components/scan/ImageUpload.tsx`:

```typescript
'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';

interface ImageUploadProps {
  onOcrComplete: (data: any) => void;
  onError: (error: string) => void;
}

export function ImageUpload({ onOcrComplete, onError }: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useNetwork();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);

      if (isOnline) {
        await processImage(base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (base64: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      if (!response.ok) {
        throw new Error('OCR failed');
      }

      const data = await response.json();
      onOcrComplete(data);
    } catch (error) {
      onError('Failed to process image. Please enter details manually.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        {!isOnline && (
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-800">
            <p className="text-sm font-medium">OCR unavailable offline</p>
            <p className="text-sm">Please enter referral details manually below.</p>
          </div>
        )}

        {!image ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isOnline}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'image/*';
                    fileInputRef.current.capture = 'environment';
                    fileInputRef.current.click();
                  }
                }}
                disabled={!isOnline}
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <p className="text-sm text-muted-foreground">
              {isOnline
                ? 'Upload or photograph a referral form to auto-fill details'
                : 'Connect to network to enable OCR scanning'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={image}
                alt="Uploaded referral form"
                className="max-h-64 w-full rounded-lg object-contain"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute right-2 top-2"
                onClick={clearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {isProcessing && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing image with AI...</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 4: Create ScanForm component**

Create `src/components/scan/ScanForm.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useReferrals } from '@/lib/db/hooks';
import { FACILITIES, Priority, FacilityId } from '@/lib/db/schema';
import { ImageUpload } from './ImageUpload';

interface FormData {
  patientName: string;
  patientPhone: string;
  diagnosis: string;
  priority: Priority;
  facilityId: FacilityId;
  referralType: string;
  notes: string;
}

export function ScanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { addReferral } = useReferrals();
  const [selectedFacility, setSelectedFacility] = useState<string>('');

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    defaultValues: {
      patientName: '',
      patientPhone: '',
      diagnosis: '',
      priority: 'medium',
      facilityId: '' as FacilityId,
      referralType: '',
      notes: '',
    },
  });

  const facility = FACILITIES.find((f) => f.id === selectedFacility);

  const handleOcrComplete = (data: any) => {
    if (data.patientName) setValue('patientName', data.patientName);
    if (data.diagnosis) setValue('diagnosis', data.diagnosis);
    if (data.priority) setValue('priority', data.priority);
    if (data.referralType) setValue('referralType', data.referralType);
    if (data.notes) setValue('notes', data.notes);

    toast({
      title: 'Form auto-filled',
      description: 'OCR extracted data from the image. Please verify and complete.',
    });
  };

  const handleOcrError = (error: string) => {
    toast({
      title: 'OCR Error',
      description: error,
      variant: 'destructive',
    });
  };

  const onSubmit = async (data: FormData) => {
    try {
      await addReferral({
        ...data,
        status: 'pending',
      });

      toast({
        title: 'Referral created',
        description: 'The referral has been saved locally.',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create referral.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <ImageUpload onOcrComplete={handleOcrComplete} onError={handleOcrError} />

      <Card>
        <CardHeader>
          <CardTitle>Referral Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient Name *</Label>
                <Input
                  id="patientName"
                  {...register('patientName', { required: 'Patient name is required' })}
                  placeholder="Full name"
                />
                {errors.patientName && (
                  <p className="text-sm text-destructive">{errors.patientName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone Number</Label>
                <Input
                  id="patientPhone"
                  {...register('patientPhone')}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis / Reason for Referral *</Label>
              <Textarea
                id="diagnosis"
                {...register('diagnosis', { required: 'Diagnosis is required' })}
                placeholder="Describe the diagnosis or reason for this referral"
              />
              {errors.diagnosis && (
                <p className="text-sm text-destructive">{errors.diagnosis.message}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="facilityId">Facility *</Label>
                <Select
                  value={selectedFacility}
                  onValueChange={(value) => {
                    setSelectedFacility(value);
                    setValue('facilityId', value as FacilityId);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select facility" />
                  </SelectTrigger>
                  <SelectContent>
                    {FACILITIES.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.distance})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralType">Referral Type *</Label>
                <Select
                  value={watch('referralType')}
                  onValueChange={(value) => setValue('referralType', value)}
                  disabled={!facility}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {facility?.types.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={watch('priority')}
                onValueChange={(value) => setValue('priority', value as Priority)}
              >
                <SelectTrigger>
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
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Any additional information..."
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Referral'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 5: Install react-hook-form**

```bash
npm install react-hook-form
```

**Step 6: Update scan page**

Modify `src/app/scan/page.tsx`:

```typescript
import { ScanForm } from '@/components/scan/ScanForm';

export default function ScanPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">New Referral</h2>
        <p className="text-muted-foreground">
          Scan a referral form or enter details manually
        </p>
      </div>
      <ScanForm />
    </div>
  );
}
```

**Step 7: Verify build**

```bash
npm run build
```

**Step 8: Test with Playwright**

```bash
npm run dev
```

Use Playwright MCP:
1. Navigate to /scan
2. Snapshot - should show image upload and form
3. Toggle network offline - should show "OCR unavailable" message

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: add scan page with Groq OCR and referral form"
```

---

### Task 2.3: Patient Detail Page with QR Code

**Files:**
- Modify: `src/app/patient/[id]/page.tsx`
- Create: `src/components/patient/PatientDetail.tsx`
- Create: `src/components/patient/QRWallet.tsx`

**Step 1: Install QR code library**

```bash
npm install qrcode.react
```

**Step 2: Create QRWallet component**

Create `src/components/patient/QRWallet.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode } from 'lucide-react';
import { Referral, FACILITIES } from '@/lib/db/schema';

interface QRWalletProps {
  referral: Referral;
}

interface WalletData {
  n: string; // patient name
  d: string; // diagnosis
  p: string; // priority
  f: string; // facility name
  t: string; // referral type
  e: number; // expiry timestamp
}

export function QRWallet({ referral }: QRWalletProps) {
  const [isOpen, setIsOpen] = useState(false);

  const facility = FACILITIES.find((f) => f.id === referral.facilityId);

  // Create compact wallet data (expires in 24 hours)
  const walletData: WalletData = {
    n: referral.patientName,
    d: referral.diagnosis.substring(0, 100), // Truncate for QR size limit
    p: referral.priority,
    f: facility?.name || '',
    t: referral.referralType,
    e: Date.now() + 24 * 60 * 60 * 1000, // 24 hour expiry
  };

  const encodedData = btoa(JSON.stringify(walletData));
  const walletUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/wallet/${encodedData}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <QrCode className="mr-2 h-4 w-4" />
          Generate QR Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Patient Smart Wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 p-4">
          <QRCodeSVG
            value={walletUrl}
            size={256}
            level="M"
            includeMargin
          />
          <div className="text-center">
            <p className="font-semibold">{referral.patientName}</p>
            <p className="text-sm text-muted-foreground">
              Scan to view patient health summary
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Expires in 24 hours
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 3: Create PatientDetail component**

Create `src/components/patient/PatientDetail.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useReferrals } from '@/lib/db/hooks';
import { Referral, FACILITIES, Status } from '@/lib/db/schema';
import { QRWallet } from './QRWallet';
import { useToast } from '@/hooks/use-toast';

interface PatientDetailProps {
  referralId: string;
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  missed: 'bg-red-100 text-red-800',
};

export function PatientDetail({ referralId }: PatientDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { referrals, updateStatus } = useReferrals();
  const referral = referrals.find((r) => r.id === referralId);

  if (!referral) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">Referral not found</p>
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
    toast({
      title: 'Status updated',
      description: `Referral marked as ${newStatus}`,
    });
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

          {referral.notes && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-muted-foreground">Notes</h4>
              <p>{referral.notes}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Update Status</h4>
            <div className="flex flex-wrap gap-2">
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
          </div>

          <div className="border-t pt-4">
            <h4 className="mb-3 text-sm font-medium">Patient Wallet</h4>
            <QRWallet referral={referral} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 4: Update patient page**

Modify `src/app/patient/[id]/page.tsx`:

```typescript
import { PatientDetail } from '@/components/patient/PatientDetail';

export default function PatientPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-4">
      <PatientDetail referralId={params.id} />
    </div>
  );
}
```

**Step 5: Update wallet page to decode QR data**

Modify `src/app/wallet/[data]/page.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock } from 'lucide-react';

interface WalletData {
  n: string;
  d: string;
  p: string;
  f: string;
  t: string;
  e: number;
}

export default function WalletPage({ params }: { params: { data: string } }) {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    try {
      const decoded = JSON.parse(atob(params.data));
      setWalletData(decoded);
      setIsExpired(Date.now() > decoded.e);
    } catch (e) {
      setError('Invalid wallet data');
    }
  }, [params.data]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive" />
              <p className="text-lg font-medium">Invalid Wallet</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 text-center">
              <Clock className="h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Wallet Expired</p>
              <p className="text-muted-foreground">
                This patient wallet has expired. Please request a new QR code.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <span className="text-2xl">🏥</span>
          </div>
          <CardTitle>Patient Health Summary</CardTitle>
          <p className="text-sm text-muted-foreground">Clearwater Ridge Community Health</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4">
            <h3 className="text-lg font-semibold">{walletData.n}</h3>
            <div className="mt-2 flex gap-2">
              <Badge className={priorityColors[walletData.p] || 'bg-gray-100'}>
                {walletData.p} priority
              </Badge>
              <Badge variant="outline">{walletData.t}</Badge>
            </div>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">Referred To</h4>
            <p>{walletData.f}</p>
          </div>

          <div>
            <h4 className="mb-1 text-sm font-medium text-muted-foreground">Diagnosis</h4>
            <p>{walletData.d}</p>
          </div>

          <div className="border-t pt-4 text-center text-xs text-muted-foreground">
            <p>This is a read-only patient summary.</p>
            <p>Valid until: {new Date(walletData.e).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add patient detail page with QR wallet generation"
```

---

## Phase 2 Complete Checkpoint

**Verify with Playwright MCP:**
1. Navigate to /scan, fill form, create referral
2. Navigate to /dashboard - referral should appear in Pending column
3. Click referral card - should go to patient detail
4. Click "Generate QR Wallet" - should show QR code
5. Screenshot all pages

**Commit summary:**

```bash
git log --oneline -3
```

---

## Phase 3: Enhancements

### Task 3.1: ICS Calendar File Generation

**Files:**
- Create: `src/lib/ics.ts`
- Modify: `src/components/patient/PatientDetail.tsx`

**Step 1: Install ics package**

```bash
npm install ics
npm install --save-dev @types/ics
```

**Step 2: Create ICS helper**

Create `src/lib/ics.ts`:

```typescript
import { createEvent, EventAttributes } from 'ics';
import { Referral, FACILITIES } from '@/lib/db/schema';

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
```

**Step 3: Add ICS download to PatientDetail**

Modify `src/components/patient/PatientDetail.tsx` - add to imports:

```typescript
import { CalendarPlus } from 'lucide-react';
import { generateICS, downloadICS } from '@/lib/ics';
```

Add handler inside component:

```typescript
const handleDownloadICS = async () => {
  const ics = await generateICS(referral);
  if (ics) {
    downloadICS(ics, `appointment-${referral.patientName.replace(/\s+/g, '-')}.ics`);
    toast({
      title: 'Calendar file downloaded',
      description: 'Add to your calendar app to set a reminder.',
    });
  }
};
```

Add button after QRWallet in the render:

```typescript
{referral.appointmentDate && (
  <Button variant="outline" onClick={handleDownloadICS}>
    <CalendarPlus className="mr-2 h-4 w-4" />
    Add to Calendar
  </Button>
)}
```

**Step 4: Add appointment date field when scheduling**

This requires adding a date picker when status is changed to "scheduled". Add to PatientDetail component after the status select:

```typescript
{referral.status === 'scheduled' && !referral.appointmentDate && (
  <div className="mt-4">
    <Label htmlFor="appointmentDate">Set Appointment Date</Label>
    <Input
      id="appointmentDate"
      type="datetime-local"
      onChange={async (e) => {
        if (e.target.value) {
          await updateReferral(referral.id, {
            appointmentDate: new Date(e.target.value).toISOString()
          });
          toast({
            title: 'Appointment scheduled',
            description: 'You can now download the calendar file.',
          });
        }
      }}
    />
  </div>
)}
```

Add updateReferral to the useReferrals destructure and add Label to imports.

**Step 5: Verify build**

```bash
npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add ICS calendar file generation for appointments"
```

---

### Task 3.2: Twilio SMS Integration

**Files:**
- Create: `src/app/api/sms/send/route.ts`
- Create: `src/app/api/sms/webhook/route.ts`
- Modify: `src/components/patient/PatientDetail.tsx`

**Step 1: Install Twilio**

```bash
npm install twilio
```

**Step 2: Add Twilio env vars**

Update `.env.local`:

```
GROQ_API_KEY=your_groq_api_key_here
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Step 3: Create SMS send API route**

Create `src/app/api/sms/send/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function POST(request: NextRequest) {
  try {
    const { to, patientName, appointmentDate, facility } = await request.json();

    if (!to || !patientName || !appointmentDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const formattedDate = new Date(appointmentDate).toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    const message = await client.messages.create({
      body: `Reminder: ${patientName} has a medical appointment at ${facility} on ${formattedDate}. Reply YES to confirm or NO to reschedule.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: to,
    });

    return NextResponse.json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
```

**Step 4: Create SMS webhook route**

Create `src/app/api/sms/webhook/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const body = formData.get('Body')?.toString().toUpperCase().trim();
    const from = formData.get('From')?.toString();

    console.log(`SMS received from ${from}: ${body}`);

    // In a real app, you would update the referral status in a server-side database
    // For demo purposes, we just log the response

    let responseMessage = '';
    if (body === 'YES') {
      responseMessage = 'Thank you! Your appointment is confirmed.';
    } else if (body === 'NO') {
      responseMessage = 'We will contact you to reschedule your appointment.';
    } else {
      responseMessage = 'Reply YES to confirm or NO to reschedule your appointment.';
    }

    // TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${responseMessage}</Message>
</Response>`;

    return new NextResponse(twiml, {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
```

**Step 5: Add SMS button to PatientDetail**

Add to imports in PatientDetail.tsx:

```typescript
import { MessageSquare } from 'lucide-react';
```

Add state and handler:

```typescript
const [isSendingSMS, setIsSendingSMS] = useState(false);

const handleSendReminder = async () => {
  if (!referral.patientPhone || !referral.appointmentDate) {
    toast({
      title: 'Cannot send reminder',
      description: 'Phone number and appointment date are required.',
      variant: 'destructive',
    });
    return;
  }

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

    if (!response.ok) throw new Error('Failed to send');

    toast({
      title: 'Reminder sent',
      description: `SMS sent to ${referral.patientPhone}`,
    });
  } catch (error) {
    toast({
      title: 'Failed to send reminder',
      description: 'Please try again later.',
      variant: 'destructive',
    });
  } finally {
    setIsSendingSMS(false);
  }
};
```

Add button after the ICS download button:

```typescript
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
```

**Step 6: Verify build**

```bash
npm run build
```

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Twilio SMS reminder integration"
```

---

### Task 3.3: Sync Animation Enhancement

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/dashboard/ReferralCard.tsx`

**Step 1: Add sync animation to Header**

Update the handleSync function in Header.tsx:

```typescript
const [isSyncing, setIsSyncing] = useState(false);

const handleSync = async () => {
  if (isOnline && unsyncedCount > 0) {
    setIsSyncing(true);
    // Simulate network delay for demo effect
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await syncAll();
    setIsSyncing(false);
  }
};
```

Update the sync button:

```typescript
<Button
  variant="outline"
  size="sm"
  onClick={handleSync}
  disabled={!isOnline || unsyncedCount === 0 || isSyncing}
>
  <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
  {isSyncing ? 'Syncing...' : 'Sync'}
</Button>
```

**Step 2: Add transition to ReferralCard sync icon**

Update the sync icon section in ReferralCard.tsx:

```typescript
<div className="flex items-center gap-1">
  {referral.synced ? (
    <CheckCircle className="h-4 w-4 text-green-600 transition-all duration-500" />
  ) : (
    <Clock className="h-4 w-4 text-amber-500 animate-pulse" />
  )}
</div>
```

**Step 3: Verify build**

```bash
npm run build
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: enhance sync animation for demo impact"
```

---

## Phase 3 Complete Checkpoint

**Verify with Playwright MCP:**
1. Create a referral with phone number
2. Change status to "scheduled", set appointment date
3. Verify "Add to Calendar" button appears
4. Verify "Send SMS Reminder" button appears
5. Test network toggle + sync animation
6. Screenshot the full flow

---

## Phase 4: Polish

### Task 4.1: Use frontend-design Skill for UI Polish

**Invoke the frontend-design skill to:**
1. Refine the color scheme for medical/clinical feel
2. Improve card shadows and hover states
3. Add subtle animations
4. Ensure mobile responsiveness
5. Polish the Kanban board layout

### Task 4.2: Create Sample Data and Demo Forms

**Files:**
- Create: `src/lib/seed-data.ts`
- Create: `public/sample-forms/referral-cardiac.pdf`
- Create: `public/sample-forms/referral-mental-health.pdf`

**Step 1: Create seed data script**

Create `src/lib/seed-data.ts`:

```typescript
import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';

const sampleReferrals = [
  {
    patientName: 'Margaret Thompson',
    patientPhone: '+1-555-0101',
    diagnosis: 'Atrial fibrillation with rapid ventricular response. Requires cardiology follow-up and anticoagulation management.',
    priority: 'critical' as const,
    status: 'pending' as const,
    facilityId: 'regional-hospital' as const,
    referralType: 'Cardiology',
    notes: 'Patient experienced palpitations during community dinner. ECG showed AFib. Started on rate control.',
    createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(), // 16 days ago - OVERDUE
  },
  {
    patientName: 'James Whitehorse',
    patientPhone: '+1-555-0102',
    diagnosis: 'Type 2 diabetes with poor glycemic control. HbA1c 9.2%. Needs endocrinology consultation.',
    priority: 'high' as const,
    status: 'scheduled' as const,
    facilityId: 'specialist-clinic' as const,
    referralType: 'Cardiology',
    appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientName: 'Sarah Running Bear',
    diagnosis: 'Generalized anxiety disorder with recent increase in symptoms. Requesting counseling services.',
    priority: 'medium' as const,
    status: 'pending' as const,
    facilityId: 'mental-health-center' as const,
    referralType: 'Mental Health',
    notes: 'Patient prefers virtual appointments due to stigma concerns.',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientName: 'Robert Chen',
    patientPhone: '+1-555-0104',
    diagnosis: 'Post-surgical follow-up for appendectomy. Healing well, no complications.',
    priority: 'low' as const,
    status: 'completed' as const,
    facilityId: 'community-health' as const,
    referralType: 'Follow-up',
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    patientName: 'Emily Blackwood',
    patientPhone: '+1-555-0105',
    diagnosis: 'Suspected breast mass on self-exam. Urgent imaging and oncology referral needed.',
    priority: 'critical' as const,
    status: 'scheduled' as const,
    facilityId: 'specialist-clinic' as const,
    referralType: 'Oncology',
    appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export async function seedDatabase() {
  const db = await getDatabase();
  const existing = await db.referrals.find().exec();

  if (existing.length > 0) {
    console.log('Database already has data, skipping seed');
    return;
  }

  const now = new Date().toISOString();

  for (const referral of sampleReferrals) {
    await db.referrals.insert({
      ...referral,
      id: uuidv4(),
      updatedAt: now,
      synced: Math.random() > 0.5, // Some synced, some not
    });
  }

  console.log('Database seeded with sample data');
}
```

**Step 2: Add seed button to dashboard (dev only)**

Add to dashboard page for demo purposes.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add sample data seeding for demo"
```

### Task 4.3: Final Build and Verification

**Step 1: Full build check**

```bash
npm run build
```

**Step 2: Playwright verification of all flows**

Use Playwright MCP to:
1. Screenshot /dashboard with sample data
2. Screenshot /scan page (online and offline)
3. Screenshot patient detail with QR modal open
4. Screenshot wallet page from QR scan
5. Record the network toggle demo flow

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete ReferralLoop MVP for hackathon demo"
```

---

## Execution Checklist

- [ ] Phase 1: Foundation (6 commits)
- [ ] Phase 2: Core Features (3 commits)
- [ ] Phase 3: Enhancements (3 commits)
- [ ] Phase 4: Polish (3 commits)
- [ ] Playwright verification screenshots saved
- [ ] Demo script practiced

---

## Demo Preparation

1. Pre-seed database with sample data
2. Prepare sample referral form PDFs
3. Set up Groq API key in .env.local
4. (Optional) Set up Twilio for live SMS demo
5. Test network toggle flow
6. Practice 7-minute pitch

---

## Post-Hackathon Merge

When complete:

```bash
cd /path/to/main/repo
git merge feature/referral-loop
git push origin main
```

Or create PR for review.
