'use client';

import { useState } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { useReferrals } from '@/lib/db/hooks';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

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
    <header className={`sticky top-0 z-50 border-b px-4 py-3 ${isOnline ? 'bg-white' : 'bg-gray-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold" style={{ color: 'hsl(199 89% 48%)' }}>ReferralLoop</h1>
          {!isOnline && (
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
              Offline Mode
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {unsyncedCount > 0 && (
            <Badge variant="outline" className="text-gray-500">
              {unsyncedCount} pending sync
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={!isOnline || unsyncedCount === 0 || isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync'}
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
