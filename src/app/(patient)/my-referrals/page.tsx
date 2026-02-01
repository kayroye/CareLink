'use client';

import { useReferrals } from '@/lib/db/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { ReferralCard } from '@/components/patient/ReferralCard';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MyReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { referrals, loading } = useReferrals();

  // Debug logging
  console.log('=== MY REFERRALS DEBUG ===');
  console.log('User ID:', user?.id);
  console.log('Total referrals:', referrals.length);
  console.log('Referral patientIds:', referrals.map(r => ({ id: r.id, patientId: r.patientId, name: r.patientName })));

  // Filter referrals by the logged-in patient's ID
  const patientReferrals = referrals.filter((r) => r.patientId === user?.id);
  console.log('Filtered referrals:', patientReferrals.length);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-accent" />
        <p className="text-lg text-muted-foreground">Loading your referrals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">My Health Referrals</h1>
        <p className="text-lg text-muted-foreground">
          View and track the status of your healthcare referrals
        </p>
      </div>

      {/* Referrals List or Empty State */}
      {patientReferrals.length === 0 ? (
        <Card className="bg-card shadow-md border-border">
          <CardContent className="p-12 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-3 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold text-foreground">No Referrals Yet</h2>
              <p className="text-lg text-muted-foreground">
                You do not have any active referrals at this time. When your healthcare provider
                creates a referral for you, it will appear here.
              </p>
            </div>

            <div className="p-4 bg-scheduled-muted rounded-lg border border-scheduled-muted max-w-md mx-auto">
              <p className="text-base text-scheduled-foreground">
                If you believe you should have a referral, please contact your healthcare provider
                or request a callback.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 bg-card rounded-lg border border-border shadow-sm">
            <p className="text-lg text-foreground">
              You have <span className="font-semibold text-accent">{patientReferrals.length}</span>{' '}
              active referral{patientReferrals.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Referral Cards */}
          <div className="space-y-6">
            {patientReferrals.map((referral) => (
              <ReferralCard
                key={referral.id}
                referralType={referral.referralType}
                facilityId={referral.facilityId}
                status={referral.status}
                appointmentDate={referral.appointmentDate}
                onViewDetails={() => router.push(`/my-referrals/${referral.id}`)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
