'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function NurseSettingsPage() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="heading-3 text-foreground">Settings</h2>
        <p className="text-muted-foreground">Manage your nurse portal preferences.</p>
      </div>

      <Card className="max-w-2xl card-elevated bg-card border-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-foreground font-semibold text-[18px] tracking-tight">Notifications</CardTitle>
          <CardDescription className="text-muted-foreground/90">Choose how you want to be alerted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 pb-2">
            <div className="flex-1">
              <Label htmlFor="sms-alerts" className="text-sm font-medium text-foreground">
                SMS alerts
              </Label>
              <p className="text-sm text-muted-foreground/90 mt-1 leading-relaxed">
                Get text updates for new referrals.
              </p>
            </div>
            <Switch id="sms-alerts" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
            <div className="flex-1 pt-2">
              <Label htmlFor="email-digests" className="text-sm font-medium text-foreground">
                Email digests
              </Label>
              <p className="text-sm text-muted-foreground/90 mt-1 leading-relaxed">
                Receive a daily summary of pending referrals.
              </p>
            </div>
            <Switch id="email-digests" />
          </div>
        </CardContent>
      </Card>

      {/* Logout Section */}
      <Card className="max-w-2xl mt-6 card-elevated bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Log Out</h3>
                <p className="text-sm text-muted-foreground">Sign out of your account</p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="h-12 px-6 text-base font-medium border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
