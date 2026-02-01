'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Type, Bell, CheckCircle, Palette, Sun, Moon, Monitor, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/theme';
import { useAuth } from '@/contexts/AuthContext';
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
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

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

  // Apply text size to document only when saved
  const applyTextSize = (size: TextSize) => {
    const root = document.documentElement;
    root.classList.remove('text-size-default', 'text-size-large', 'text-size-extra-large');
    root.classList.add(`text-size-${size}`);
  };

  // Load and apply saved text size on mount
  useEffect(() => {
    const savedTextSize = localStorage.getItem('patientTextSize') as TextSize;
    if (savedTextSize) {
      applyTextSize(savedTextSize);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('patientTextSize', textSize);
    localStorage.setItem('patientSmsReminders', String(smsReminders));
    
    // Apply text size when saved
    applyTextSize(textSize);

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
              <TabsList className="w-full grid grid-cols-3 items-stretch bg-muted h-20! p-1! gap-0.5">
                <TabsTrigger
                  value="light"
                  className={cn(
                    'flex h-full flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 py-0',
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
                    'flex h-full flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 py-0',
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
                    'flex h-full flex-col items-center justify-center gap-1 rounded-lg transition-all duration-200 py-0',
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
          <div className="grid grid-cols-3 gap-3">
            {TEXT_SIZE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTextSizeChange(option.value)}
                className={cn(
                  'relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200',
                  'hover:border-accent/50 hover:shadow-md',
                  'focus:outline-none focus:ring-2 focus:ring-accent/50',
                  textSize === option.value
                    ? 'border-accent bg-scheduled-muted shadow-md'
                    : 'border-border bg-card hover:bg-muted/50'
                )}
              >
                {/* Size indicator */}
                <div className={cn(
                  'flex items-center justify-center w-14 h-14 rounded-full mb-3 transition-all',
                  textSize === option.value
                    ? 'bg-accent text-white'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <span className={cn(
                    'font-bold',
                    option.value === 'default' && 'text-lg',
                    option.value === 'large' && 'text-xl',
                    option.value === 'extra-large' && 'text-2xl'
                  )}>
                    Aa
                  </span>
                </div>
                
                {/* Label */}
                <p className={cn(
                  'font-semibold text-foreground mb-1',
                  option.value === 'default' && 'text-sm',
                  option.value === 'large' && 'text-base',
                  option.value === 'extra-large' && 'text-lg'
                )}>
                  {option.label}
                </p>
                
                {/* Check indicator */}
                {textSize === option.value && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-5 w-5 text-accent" />
                  </div>
                )}
              </button>
            ))}
          </div>
          
          {/* Live Preview */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2 font-medium">Preview</p>
            <p className={cn(
              'text-foreground transition-all duration-200',
              textSize === 'default' && 'text-base',
              textSize === 'large' && 'text-lg',
              textSize === 'extra-large' && 'text-xl'
            )}>
              This is how your text will appear throughout the app. Appointments, referrals, and notifications will all use this size.
            </p>
          </div>
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

      {/* Logout Section */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                <LogOut className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Log Out</h3>
                <p className="text-base text-muted-foreground">Sign out of your account</p>
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
