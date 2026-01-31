'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { Header } from './Header';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  // Try to get auth state - will be null during initial SSR
  let isNurse = false;
  let isAuthenticated = false;

  try {
    const auth = useAuth();
    isNurse = auth.isNurse;
    isAuthenticated = auth.isAuthenticated;
  } catch {
    // AuthContext not available yet (during SSR)
  }

  // Determine if we should show the nurse shell (sidebar, header, bottom nav)
  const isLoginPage = pathname === '/login';
  const isPatientRoute = pathname?.startsWith('/my-referrals') ||
                         pathname?.startsWith('/appointments') ||
                         pathname?.startsWith('/request-callback') ||
                         pathname?.startsWith('/settings') && !isNurse;

  const showNurseShell = isAuthenticated && isNurse && !isLoginPage && !isPatientRoute;

  // Login page and patient pages don't use the nurse shell
  if (isLoginPage || isPatientRoute || !showNurseShell) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </SidebarInset>

      {/* Mobile Bottom Nav - visible on mobile, hidden on md+ */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
