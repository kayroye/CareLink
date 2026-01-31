'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  /** Compact mode for sidebar (icons only) */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function ThemeToggle({ compact = false, className }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn('h-9 w-full animate-pulse rounded-lg bg-muted/30', className)} />
    );
  }

  if (compact) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-1', className)}>
        <button
          onClick={() => setTheme('light')}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            theme === 'light'
              ? 'bg-amber-500/20 text-amber-500'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
          title="Light mode"
          aria-label="Light mode"
        >
          <Sun className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            theme === 'dark'
              ? 'bg-indigo-500/20 text-indigo-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
          title="Dark mode"
          aria-label="Dark mode"
        >
          <Moon className="h-4 w-4" />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={cn(
            'p-2 rounded-md transition-all duration-200',
            theme === 'system'
              ? 'bg-teal-500/20 text-teal-400'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
          title="System preference"
          aria-label="System preference"
        >
          <Monitor className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <Tabs
      value={theme}
      onValueChange={setTheme}
      className={cn('w-full', className)}
    >
      <TabsList className="w-full grid grid-cols-3 bg-slate-100 dark:bg-slate-800/60 p-1 h-11">
        <TabsTrigger
          value="light"
          className={cn(
            'flex items-center justify-center gap-2 rounded-md transition-all duration-200',
            'data-[state=active]:bg-white data-[state=active]:text-amber-600 data-[state=active]:shadow-sm',
            'dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-amber-400',
            'text-slate-500 dark:text-slate-400'
          )}
        >
          <Sun className="h-4 w-4" />
          <span className="text-sm font-medium">Light</span>
        </TabsTrigger>
        <TabsTrigger
          value="dark"
          className={cn(
            'flex items-center justify-center gap-2 rounded-md transition-all duration-200',
            'data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm',
            'dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-indigo-400',
            'text-slate-500 dark:text-slate-400'
          )}
        >
          <Moon className="h-4 w-4" />
          <span className="text-sm font-medium">Dark</span>
        </TabsTrigger>
        <TabsTrigger
          value="system"
          className={cn(
            'flex items-center justify-center gap-2 rounded-md transition-all duration-200',
            'data-[state=active]:bg-white data-[state=active]:text-teal-600 data-[state=active]:shadow-sm',
            'dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-teal-400',
            'text-slate-500 dark:text-slate-400'
          )}
        >
          <Monitor className="h-4 w-4" />
          <span className="text-sm font-medium">Auto</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

/** Simple icon button for header/nav */
export function ThemeToggleButton({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className={cn('h-10 w-10 animate-pulse rounded-lg bg-muted/30', className)} />;
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'relative h-10 w-10 rounded-lg flex items-center justify-center',
        'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
        'hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-teal-500/50',
        className
      )}
      title={`Current: ${theme}. Click to cycle.`}
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      <Sun
        className={cn(
          'h-5 w-5 absolute transition-all duration-300',
          resolvedTheme === 'light'
            ? 'rotate-0 scale-100 text-amber-500'
            : 'rotate-90 scale-0 text-slate-400'
        )}
      />
      <Moon
        className={cn(
          'h-5 w-5 absolute transition-all duration-300',
          resolvedTheme === 'dark' && theme !== 'system'
            ? 'rotate-0 scale-100 text-indigo-400'
            : '-rotate-90 scale-0 text-slate-400'
        )}
      />
      <Monitor
        className={cn(
          'h-4 w-4 absolute transition-all duration-300',
          theme === 'system'
            ? 'rotate-0 scale-100 text-teal-500'
            : 'rotate-90 scale-0 text-slate-400'
        )}
      />
    </button>
  );
}
