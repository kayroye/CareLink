'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, FileText, Loader2, Phone, Settings } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/layout/Sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isPatient, loading } = useAuth();
  const patientNavItems = [
    { href: '/my-referrals', label: 'My Referrals', icon: FileText },
    { href: '/appointments', label: 'Appointments', icon: Calendar },
    { href: '/request-callback', label: 'Request Callback', icon: Phone },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    // Wait for auth to load
    if (loading) return;

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Redirect to nurse dashboard if not a patient
    if (!isPatient) {
      router.push('/dashboard');
      return;
    }
  }, [isAuthenticated, isPatient, loading, router]);

  // Apply saved text size on initial load
  useEffect(() => {
    const savedTextSize = localStorage.getItem('patientTextSize');
    if (savedTextSize) {
      const root = document.documentElement;
      root.classList.remove('text-size-default', 'text-size-large', 'text-size-extra-large');
      root.classList.add(`text-size-${savedTextSize}`);
    }
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  // Don't render until auth is confirmed
  if (!isAuthenticated || !isPatient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600 dark:text-teal-400" />
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar navItems={patientNavItems} />
      <SidebarInset>
        {/* Simplified Patient Header (mobile only) */}
        <div className="md:hidden">
          <header className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href="/my-referrals" className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-linear-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm overflow-hidden">
                    <Image src="/icon.png" alt="CareLink logo" width={36} height={36} />
                  </div>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-100">
                    CareLink
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-4">
                {user && (
                  <span className="hidden sm:inline text-sm text-slate-600 dark:text-slate-400">
                    {user.name}
                  </span>
                )}
              </div>
            </div>
          </header>
        </div>

        {/* Main Content with increased padding and larger text */}
        <main className="p-6 text-lg">{children}</main>

        {/* Simple Patient Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg md:hidden">
          <div className="px-6 py-3">
            <div className="flex justify-around items-center">
              <Link
                href="/my-referrals"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[64px] justify-center"
              >
                <svg
                  className="h-6 w-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Referrals
                </span>
              </Link>

              <Link
                href="/appointments"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[64px] justify-center"
              >
                <svg
                  className="h-6 w-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Appointments
                </span>
              </Link>

              <Link
                href="/request-callback"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[64px] justify-center"
              >
                <svg
                  className="h-6 w-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Callback
                </span>
              </Link>

              <Link
                href="/settings"
                className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[64px] justify-center"
              >
                <svg
                  className="h-6 w-6 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Settings
                </span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Bottom padding for fixed nav */}
        <div className="h-24 md:hidden" />
      </SidebarInset>
    </SidebarProvider>
  );
}
