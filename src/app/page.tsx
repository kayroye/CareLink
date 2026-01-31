'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isNurse, isPatient, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to be determined
    if (loading) return;

    if (isAuthenticated) {
      if (isNurse) {
        router.push('/dashboard');
      } else if (isPatient) {
        router.push('/my-referrals');
      } else {
        // Default to login if role is unknown
        router.push('/login');
      }
    } else {
      router.push('/login');
    }
  }, [isAuthenticated, isNurse, isPatient, loading, router]);

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">R</span>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
        <p className="text-muted-foreground text-sm">Loading ReferralLoop...</p>
      </div>
    </div>
  );
}
