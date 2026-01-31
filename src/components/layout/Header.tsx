'use client';

import { useState } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useReferrals } from '@/lib/db/hooks';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, RefreshCw, CloudOff } from 'lucide-react';

export function Header() {
  const { isOnline, toggleNetwork } = useNetwork();
  const { syncAll, referrals } = useReferrals();
  const [isSyncing, setIsSyncing] = useState(false);

  const unsyncedCount = referrals.filter((r) => !r.synced).length;

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
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-sky-600 to-sky-500 bg-clip-text text-transparent">
              ReferralLoop
            </h1>
          </div>
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200">
              <CloudOff className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-xs font-medium text-amber-700">Offline</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {unsyncedCount > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-100">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-500 sync-pulse" />
              <span className="text-xs font-medium text-sky-700">
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
              ${isSyncing ? 'bg-sky-50 border-sky-200' : ''}
              ${unsyncedCount > 0 && isOnline ? 'border-sky-300 hover:bg-sky-50 hover:border-sky-400' : ''}
            `}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
            <span className="text-sm">{isSyncing ? 'Syncing...' : 'Sync'}</span>
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
            <div className={`p-1.5 rounded-full transition-colors ${isOnline ? 'bg-emerald-50' : 'bg-gray-100'}`}>
              {isOnline ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <Switch
              checked={isOnline}
              onCheckedChange={toggleNetwork}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
