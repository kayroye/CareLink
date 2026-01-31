'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function NurseSettingsPage() {
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
    </div>
  );
}
