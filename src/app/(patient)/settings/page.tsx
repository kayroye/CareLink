'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Type, Bell, CheckCircle, Palette, Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type TextSize = 'default' | 'large' | 'extra-large';

const TEXT_SIZE_OPTIONS: { value: TextSize; label: string; description: string }[] = [
  { value: 'default', label: 'Default', description: 'Standard text size' },
  { value: 'large', label: 'Large', description: 'Larger, easier to read' },
  { value: 'extra-large', label: 'Extra Large', description: 'Maximum readability' },
];

export default function SettingsPage() {
  const [textSize, setTextSize] = useState<TextSize>('default');
  const [smsReminders, setSmsReminders] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Avoid hydration mismatch for theme
  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedTextSize = localStorage.getItem('patientTextSize') as TextSize;
    const savedSmsReminders = localStorage.getItem('patientSmsReminders');

    if (savedTextSize) {
      setTimeout(() => setTextSize(savedTextSize), 0);
    }
    if (savedSmsReminders !== null) {
      setTimeout(() => setSmsReminders(savedSmsReminders === 'true'), 0);
    }
  }, []);

  // Apply text size to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('text-size-default', 'text-size-large', 'text-size-extra-large');
    root.classList.add(`text-size-${textSize}`);
  }, [textSize]);

  const handleSave = () => {
    localStorage.setItem('patientTextSize', textSize);
    localStorage.setItem('patientSmsReminders', String(smsReminders));

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleTextSizeChange = (size: TextSize) => {
    setTextSize(size);
  };

  const handleSmsToggle = (checked: boolean) => {
    setSmsReminders(checked);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-lg text-muted-foreground">Customize your experience</p>
      </div>

      {/* Theme Section */}
      <Card className="bg-card shadow-md border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-linear-to-br from-amber-100 to-indigo-100 dark:from-amber-900/30 dark:to-indigo-900/30 flex items-center justify-center">
              <Palette className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Appearance</CardTitle>
              <p className="text-base text-muted-foreground">Choose your preferred color theme</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mounted && (
            <Tabs
              value={theme}
              onValueChange={setTheme}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 bg-muted p-1.5 h-14 gap-1">
                <TabsTrigger
                  value="light"
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 h-full',
                    'data-[state=active]:bg-card data-[state=active]:shadow-md',
                    'data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400',
                    'text-muted-foreground'
                  )}
                >
                  <Sun className="h-5 w-5" />
                  <span className="text-sm font-medium">Light</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dark"
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 h-full',
                    'data-[state=active]:bg-card data-[state=active]:shadow-md',
                    'data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400',
                    'text-muted-foreground'
                  )}
                >
                  <Moon className="h-5 w-5" />
                  <span className="text-sm font-medium">Dark</span>
                </TabsTrigger>
                <TabsTrigger
                  value="system"
                  className={cn(
                    'flex flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 h-full',
                    'data-[state=active]:bg-card data-[state=active]:shadow-md',
                    'data-[state=active]:text-accent',
                    'text-muted-foreground'
                  )}
                >
                  <Monitor className="h-5 w-5" />
                  <span className="text-sm font-medium">System</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Theme Preview */}
          <div className="mt-4 p-4 rounded-lg border-2 border-dashed border-border bg-background">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-linear-to-br from-teal-400 to-teal-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">R</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Preview</p>
                <p className="text-xs text-muted-foreground">
                  Currently using {resolvedTheme === 'dark' ? 'Northern Night' : 'Northern Professional'} theme
                </p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="h-8 rounded bg-teal-500 dark:bg-teal-400" title="Accent" />
              <div className="h-8 rounded bg-amber-500 dark:bg-amber-400" title="Warning" />
              <div className="h-8 rounded bg-rose-500 dark:bg-rose-400" title="Critical" />
              <div className="h-8 rounded bg-emerald-500 dark:bg-emerald-400" title="Success" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Text Size Section */}
      <Card className="bg-card shadow-md border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-scheduled-muted flex items-center justify-center">
              <Type className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Text Size</CardTitle>
              <p className="text-base text-muted-foreground">Choose a text size that is comfortable for you</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {TEXT_SIZE_OPTIONS.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleTextSizeChange(option.value)}
              className={cn(
                'w-full p-4 rounded-lg border-2 text-left transition-all',
                'hover:border-accent hover:bg-scheduled-muted',
                textSize === option.value
                  ? 'border-accent bg-scheduled-muted'
                  : 'border-border bg-card'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className={cn(
                      'font-semibold text-foreground',
                      option.value === 'default' && 'text-base',
                      option.value === 'large' && 'text-lg',
                      option.value === 'extra-large' && 'text-xl'
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-base text-muted-foreground">{option.description}</p>
                </div>
                {textSize === option.value && (
                  <CheckCircle className="h-6 w-6 text-accent" />
                )}
              </div>

              {/* Preview Text */}
              <div className="mt-3 p-3 bg-muted rounded">
                <p
                  className={cn(
                    'text-foreground',
                    option.value === 'default' && 'text-base',
                    option.value === 'large' && 'text-lg',
                    option.value === 'extra-large' && 'text-xl'
                  )}
                >
                  This is how your text will look.
                </p>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-card shadow-md border-border">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-scheduled-muted flex items-center justify-center">
              <Bell className="h-6 w-6 text-accent" />
            </div>
            <div>
              <CardTitle className="text-xl text-foreground">Notifications</CardTitle>
              <p className="text-base text-muted-foreground">Manage how we communicate with you</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-background rounded-lg border border-border">
            <div className="space-y-1">
              <p className="text-lg font-medium text-foreground">SMS Appointment Reminders</p>
              <p className="text-base text-muted-foreground">
                Receive text message reminders before your appointments
              </p>
            </div>
            <Switch
              checked={smsReminders}
              onCheckedChange={handleSmsToggle}
              className="data-[state=checked]:bg-accent scale-125"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className={cn(
            'h-14 px-8 text-lg font-semibold transition-all',
            isSaved
              ? 'bg-completed-foreground hover:bg-completed-foreground/90'
              : 'bg-accent hover:bg-accent/90'
          )}
        >
          {isSaved ? (
            <>
              <CheckCircle className="h-5 w-5 mr-2" />
              Saved
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>

      {/* Help Section */}
      <Card className="bg-background border-border">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Need Help?</h3>
          <p className="text-base text-muted-foreground">
            If you need assistance with your account or have any questions, please{' '}
            <a href="/request-callback" className="text-accent font-medium hover:underline">
              request a callback
            </a>{' '}
            and we will be happy to help.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
