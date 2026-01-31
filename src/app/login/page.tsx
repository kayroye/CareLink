'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MountainRidge } from '@/components/ui/mountain-ridge';
import { useAuth } from '@/contexts/AuthContext';
import { User, Stethoscope, Mail, Loader2, CheckCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';

type RoleSelection = 'patient' | 'nurse' | null;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isNurse, isPatient, loading: authLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleSelection>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      if (isNurse) {
        router.push('/dashboard');
      } else if (isPatient) {
        router.push('/my-referrals');
      }
    }
  }, [isAuthenticated, isNurse, isPatient, authLoading, router]);

  const handlePatientLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/magic-link/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send magic link');
      }

      setMagicLinkSent(true);

      // For demo purposes, show the magic link URL
      if (data.demo && data.url) {
        setMagicLinkUrl(data.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleNurseLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 relative z-10">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xl font-bold">R</span>
          </div>
          <h1 className="heading-2 text-foreground">ReferralLoop</h1>
        </div>

        {/* Tagline */}
        <p className="text-foreground/70 text-lg mb-10 text-center max-w-md">
          Seamless healthcare referral coordination for patients and providers
        </p>

        {/* Role Selection Cards */}
        {!selectedRole && (
          <div className="w-full max-w-lg space-y-6">
            <h2 className="heading-4 text-center text-foreground mb-6">How would you like to sign in?</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Patient Card */}
              <Button
                onClick={() => setSelectedRole('patient')}
                className="group p-6 bg-card rounded-xl border-2 border-border/80 hover:border-accent hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="w-14 h-14 rounded-lg bg-scheduled-muted flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                  <User className="h-7 w-7 text-accent" />
                </div>
                <h3 className="heading-5 text-foreground mb-2">I&apos;m a Patient</h3>
                <p className="text-sm text-foreground/70">
                  Access your referrals and appointments with a secure magic link
                </p>
              </Button>

              {/* Healthcare Provider Card */}
              <Button
                onClick={() => setSelectedRole('nurse')}
                className="group p-6 bg-card rounded-xl border-2 border-border/80 hover:border-accent hover:shadow-lg transition-all duration-200 text-left"
              >
                <div className="w-14 h-14 rounded-lg bg-secondary flex items-center justify-center mb-4 group-hover:bg-secondary/80 transition-colors">
                  <Stethoscope className="h-7 w-7 text-foreground/70" />
                </div>
                <h3 className="heading-5 text-foreground mb-2">I&apos;m a Healthcare Provider</h3>
                <p className="text-sm text-foreground/70">
                  Manage patient referrals and coordinate care
                </p>
              </Button>
            </div>
          </div>
        )}

        {/* Patient Login Form */}
        {selectedRole === 'patient' && !magicLinkSent && (
          <div className="w-full max-w-md">
            <Button
              onClick={() => setSelectedRole(null)}
              className="text-sm text-foreground/70 hover:text-foreground mb-6 flex items-center gap-1"
            >
              <span>&larr;</span> Back to role selection
            </Button>

            <div className="bg-card rounded-xl border border-border shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-scheduled-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <h2 className="heading-4 text-foreground">Patient Sign In</h2>
              </div>

              <p className="text-foreground/70 mb-6">
                Enter your email address and we&apos;ll send you a secure link to access your portal.
              </p>

              <form onSubmit={handlePatientLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-missed-muted border border-missed-muted rounded-lg text-sm text-missed-foreground">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4 mr-2" />
                      Send Magic Link
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        )}

        {/* Magic Link Sent Confirmation */}
        {selectedRole === 'patient' && magicLinkSent && (
          <div className="w-full max-w-md">
            <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-scheduled-muted flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-accent" />
              </div>

              <h2 className="heading-4 text-foreground mb-3">Check Your Email</h2>
              <p className="text-muted-foreground mb-6">
                We&apos;ve sent a secure login link to <strong>{email}</strong>.
                Click the link to access your patient portal.
              </p>

              {/* Demo mode: show the magic link */}
              {magicLinkUrl && (
                <div className="p-4 bg-pending-muted border border-pending-muted rounded-lg mb-6">
                  <p className="text-sm text-pending-foreground font-medium mb-2">Demo Mode</p>
                  <a
                    href={magicLinkUrl}
                    className="text-sm text-accent hover:text-accent/80 underline break-all"
                  >
                    Click here to sign in
                  </a>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  setMagicLinkSent(false);
                  setMagicLinkUrl(null);
                  setSelectedRole(null);
                }}
                className="w-full"
              >
                Back to Login
              </Button>
            </div>
          </div>
        )}

        {/* Nurse Login Form */}
        {selectedRole === 'nurse' && (
          <div className="w-full max-w-md">
            <Button
              onClick={() => setSelectedRole(null)}
              className="text-sm text-foreground/70 hover:text-foreground mb-6 flex items-center gap-1"
            >
              <span>&larr;</span> Back to role selection
            </Button>

            <div className="bg-card rounded-xl border border-border shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 text-muted-foreground" />
                </div>
                <h2 className="heading-4 text-foreground">Provider Sign In</h2>
              </div>

              <form onSubmit={handleNurseLogin} className="space-y-4">
                <div>
                  <Label htmlFor="nurse-email">
                    Email Address
                  </Label>
                  <Input
                    id="nurse-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@referralloop.com"
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label htmlFor="password">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 h-11"
                    required
                    disabled={loading}
                  />
                </div>

                {error && (
                  <div className="p-3 bg-missed-muted border border-missed-muted rounded-lg text-sm text-missed-foreground">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11"
                  disabled={loading || !email || !password}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-foreground/60 text-center">
                  Demo: Use any email ending in @referralloop.com, @hospital.com, or @clinic.com with any password
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mountain Ridge Background */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <MountainRidge color="#cbd5e1" className="h-40 sm:h-48 md:h-56" />
      </div>
    </div>
  );
}
