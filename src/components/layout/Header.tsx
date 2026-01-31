'use client';

import { useState, ReactNode } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useReferrals } from '@/lib/db/hooks';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { isOnline, toggleNetwork } = useNetwork();
  const { syncAll, referrals } = useReferrals();
  const [isSyncing, setIsSyncing] = useState(false);

  const unsyncedCount = referrals.filter((r) => !r.isSynced).length;

  const handleSync = async () => {
    if (isOnline && unsyncedCount > 0) {
      setIsSyncing(true);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await syncAll();
      setIsSyncing(false);
    }
  };

  return (
    <header className={`sticky top-0 z-50 border-b px-4 py-3.5 transition-colors duration-300 ${
      isOnline ? 'header-glass' : 'header-glass-offline border-amber-200'
    }`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {children}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-linear-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent">
              ReferralLoop
            </h1>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pending-muted border border-pending-muted">
              <CloudOff className="h-3.5 w-3.5 text-pending-foreground" />
              <span className="text-xs font-medium text-pending-foreground">Offline</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {unsyncedCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-interactive-muted border border-interactive-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-interactive sync-pulse" />
              <span className="text-xs font-medium text-interactive-foreground">
                {unsyncedCount} pending
              </span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline || unsyncedCount === 0 || isSyncing}
            className={`
              transition-all duration-200
              ${isSyncing ? 'bg-interactive-muted border-interactive-muted' : ''}
              ${unsyncedCount > 0 && isOnline ? 'border-interactive hover:bg-interactive-muted hover:border-interactive' : ''}
            `}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-interactive-foreground' : ''}`} />
            <span className="text-sm">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-border">
            <div className={`p-1.5 rounded-full transition-colors ${isOnline ? 'bg-completed-muted' : 'bg-muted'}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-completed-foreground" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleNetwork}
              className="data-[state=checked]:bg-completed"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
