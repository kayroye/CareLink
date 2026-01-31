'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MountainRidge } from '@/components/ui/mountain-ridge';

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithMagicLink } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    // Verify the magic link
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setError('No verification token provided');
        return;
      }

      try {
        await loginWithMagicLink(token);
        setStatus('success');

        // Redirect to patient portal after a brief delay
        setTimeout(() => {
          router.push('/my-referrals');
        }, 1500);
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      }
    };

    verify();
  }, [searchParams, loginWithMagicLink, router]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="h-8 w-8 text-accent dark:text-teal-400 animate-spin" />
            </div>
            <h2 className="heading-4 text-foreground mb-3">Verifying Your Link</h2>
            <p className="text-foreground/70">
              Please wait while we verify your secure login link...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="heading-4 text-foreground mb-3">Welcome Back!</h2>
            <p className="text-foreground/70">
              You&apos;ve been signed in successfully. Redirecting to your portal...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-500/10 dark:bg-red-400/10 flex items-center justify-center mx-auto mb-6">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="heading-4 text-foreground mb-3">Verification Failed</h2>
            <p className="text-foreground/70 mb-6">
              {error || 'The link may have expired or already been used.'}
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full h-11"
            >
              Return to Login
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="h-8 w-8 text-accent dark:text-teal-400 animate-spin" />
        </div>
        <h2 className="heading-4 text-foreground mb-3">Loading...</h2>
        <p className="text-foreground/70">
          Please wait...
        </p>
      </div>
    </div>
  );
}

export default function VerifyMagicLinkPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <h1 className="heading-2 text-foreground">CareLink</h1>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <VerifyContent />
        </Suspense>
      </div>

      {/* Mountain Ridge Background */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <MountainRidge color="#cbd5e1" className="h-40 sm:h-48 md:h-56" />
      </div>
    </div>
  );
}
