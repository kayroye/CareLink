'use client';

import { ReactNode } from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { CloudOff } from 'lucide-react';

interface HeaderProps {
  children?: ReactNode;
}

export function Header({ children }: HeaderProps) {
  const { isOnline } = useNetwork();

  return (
    <header className={`sticky top-0 z-50 border-b px-3 py-2 md:px-4 md:py-3 transition-colors duration-300 ${
      isOnline ? 'header-glass' : 'header-glass-offline border-amber-200'
    }`}>
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          {children ?? <span className="text-sm font-semibold text-foreground">CareLink</span>}
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pending-muted border border-pending-muted">
              <CloudOff className="h-3.5 w-3.5 text-pending-foreground" />
              <span className="text-xs font-medium text-pending-foreground">Offline</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
