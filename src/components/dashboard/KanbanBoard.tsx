'use client';

import { useReferrals } from '@/lib/db/hooks';
import { KanbanColumn } from './KanbanColumn';
import { ReferralWithMeta, Status } from '@/lib/db/schema';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Trash2 } from 'lucide-react';
import { useSeed } from '@/lib/db/use-seed';
import { toast } from 'sonner';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useState } from 'react';
import { ReferralCard } from './ReferralCard';
import { OverdueConfirmDialog } from './OverdueConfirmDialog';

const columns: { title: string; status: Status; statuses?: Status[] }[] = [
  { title: 'Pending', status: 'pending' },
  { title: 'Scheduled', status: 'scheduled' },
  { title: 'Completed', status: 'completed' },
  { title: 'Missed / Cancelled', status: 'missed', statuses: ['missed', 'cancelled'] },
];

type PendingSort = 'priority' | 'timeliness';

export function KanbanBoard() {
  const { referrals, loading, updateStatus } = useReferrals();
  const { seed, clear, isSeeding } = useSeed();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingSort, setPendingSort] = useState<PendingSort>('priority');
  const [pendingMove, setPendingMove] = useState<{
    referral: ReferralWithMeta;
    newStatus: Status;
  } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleSeed = async () => {
    const seeded = await seed();
    if (seeded) {
      toast.success('Sample data loaded');
    } else {
      toast.info('Database already has data');
    }
  };

  const handleClear = async () => {
    await clear();
    toast.success('Database cleared');
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const referralId = active.id as string;
    const newStatus = over.id as Status;

    const referral = referrals.find((r) => r.id === referralId);
    if (referral && referral.status !== newStatus) {
      // Check if the referral is overdue
      if (referral.isOverdue) {
        // Show confirmation dialog for overdue referrals
        setPendingMove({ referral, newStatus });
        setDialogOpen(true);
      } else {
        // Move immediately for non-overdue referrals
        await updateStatus(referralId, newStatus);
        toast.success(`Moved to ${newStatus}`);
      }
    }
  };

  const handleConfirmMove = async (note: string) => {
    if (pendingMove) {
      await updateStatus(pendingMove.referral.id, pendingMove.newStatus, note);
      toast.success(`Moved to ${pendingMove.newStatus}`);
      setPendingMove(null);
      setDialogOpen(false);
    }
  };

  const handleCancelMove = () => {
    setPendingMove(null);
    setDialogOpen(false);
  };

  const activeReferral = activeId ? referrals.find((r) => r.id === activeId) : null;

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading referrals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {referrals.length === 0 && (
        <div className="flex justify-center gap-2 py-4">
          <Button onClick={handleSeed} disabled={isSeeding} variant="outline">
            <Database className="mr-2 h-4 w-4" />
            {isSeeding ? 'Loading...' : 'Load Sample Data'}
          </Button>
        </div>
      )}

      {referrals.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 shadow-xs dark:bg-input/30 dark:border-input">
            <span className="text-sm font-medium text-muted-foreground">Pending sort</span>
            <Select value={pendingSort} onValueChange={(value) => setPendingSort(value as PendingSort)}>
              <SelectTrigger size="sm">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="timeliness">Latest to Earliest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleClear} disabled={isSeeding} variant="outline" size="sm">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Data
            </Button>
            <Button onClick={handleSeed} disabled={isSeeding} variant="outline" size="sm">
              <Database className="mr-2 h-4 w-4" />
              Reset Demo Data
            </Button>
          </div>
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((column) => (
            <KanbanColumn
              key={column.status}
              title={column.title}
              status={column.status}
              referrals={referrals.filter((r) =>
                column.statuses ? column.statuses.includes(r.status) : r.status === column.status
              )}
              pendingSort={column.status === 'pending' ? pendingSort : undefined}
              onPendingSortChange={column.status === 'pending' ? setPendingSort : undefined}
            />
          ))}
        </div>

        <DragOverlay>
          {activeReferral ? (
            <div className="rotate-3 scale-105">
              <ReferralCard referral={activeReferral} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {pendingMove && (
        <OverdueConfirmDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          referral={pendingMove.referral}
          newStatus={pendingMove.newStatus}
          onConfirm={handleConfirmMove}
          onCancel={handleCancelMove}
        />
      )}
    </div>
  );
}
