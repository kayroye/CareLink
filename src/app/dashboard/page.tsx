'use client';

import { KanbanBoard } from '@/components/dashboard/KanbanBoard';

export default function DashboardPage() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Referral Dashboard</h2>
        <p className="text-gray-500">
          Track and manage patient referrals for Clearwater Ridge
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
