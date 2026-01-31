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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Choose how you want to be alerted.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="sms-alerts" className="text-sm font-medium">
                SMS alerts
              </Label>
              <p className="text-sm text-muted-foreground">
                Get text updates for new referrals.
              </p>
            </div>
            <Switch id="sms-alerts" defaultChecked />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label htmlFor="email-digests" className="text-sm font-medium">
                Email digests
              </Label>
              <p className="text-sm text-muted-foreground">
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
