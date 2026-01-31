'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TextSize = 'default' | 'large' | 'xl';

const TEXT_SIZE_CONFIG: Record<TextSize, { label: string; size: number }> = {
  default: { label: 'A', size: 16 },
  large: { label: 'A+', size: 18 },
  xl: { label: 'A++', size: 20 },
};

const TEXT_SIZE_ORDER: TextSize[] = ['default', 'large', 'xl'];
const STORAGE_KEY = 'CareLink-text-size';

function getNextSize(current: TextSize): TextSize {
  const currentIndex = TEXT_SIZE_ORDER.indexOf(current);
  const nextIndex = (currentIndex + 1) % TEXT_SIZE_ORDER.length;
  return TEXT_SIZE_ORDER[nextIndex];
}

function getStoredTextSize(): TextSize {
  if (typeof window === 'undefined') return 'default';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && TEXT_SIZE_ORDER.includes(stored as TextSize)) {
      return stored as TextSize;
    }
  } catch {
    // localStorage might not be available
  }

  return 'default';
}

function setStoredTextSize(size: TextSize): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, size);
  } catch {
    // localStorage might not be available
  }
}

function applyTextSize(size: TextSize): void {
  if (typeof document === 'undefined') return;

  document.documentElement.setAttribute('data-text-size', size);
  document.documentElement.style.fontSize = `${TEXT_SIZE_CONFIG[size].size}px`;
}

interface TextSizeToggleProps {
  className?: string;
}

export function TextSizeToggle({ className }: TextSizeToggleProps) {
  const [textSize, setTextSize] = React.useState<TextSize>('default');
  const [mounted, setMounted] = React.useState(false);

  // Initialize from localStorage on mount
  React.useEffect(() => {
    const stored = getStoredTextSize();
    setTextSize(stored);
    applyTextSize(stored);
    setMounted(true);
  }, []);

  const handleToggle = React.useCallback(() => {
    const nextSize = getNextSize(textSize);
    setTextSize(nextSize);
    setStoredTextSize(nextSize);
    applyTextSize(nextSize);
  }, [textSize]);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn('min-w-[3rem] font-semibold', className)}
        disabled
        aria-label="Loading text size preference"
      >
        A
      </Button>
    );
  }

  const config = TEXT_SIZE_CONFIG[textSize];

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('min-w-[3rem] font-semibold', className)}
      onClick={handleToggle}
      aria-label={`Current text size: ${config.size}px. Click to cycle through sizes.`}
      title={`Text size: ${config.size}px`}
    >
      {config.label}
    </Button>
  );
}

// Hook for programmatic text size control
export function useTextSize() {
  const [textSize, setTextSizeState] = React.useState<TextSize>('default');

  React.useEffect(() => {
    const stored = getStoredTextSize();
    setTextSizeState(stored);
  }, []);

  const setTextSize = React.useCallback((size: TextSize) => {
    setTextSizeState(size);
    setStoredTextSize(size);
    applyTextSize(size);
  }, []);

  const cycleTextSize = React.useCallback(() => {
    const nextSize = getNextSize(textSize);
    setTextSize(nextSize);
  }, [textSize, setTextSize]);

  return {
    textSize,
    setTextSize,
    cycleTextSize,
    config: TEXT_SIZE_CONFIG[textSize],
  };
}

export { TEXT_SIZE_CONFIG, TEXT_SIZE_ORDER, type TextSize };
