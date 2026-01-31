/**
 * Design Tokens for CareLink
 * "Northern Professional" Design System
 *
 * Cool, trustworthy healthcare interface with bold accents
 */

// Color Palette
export const colors = {
  // Primary colors
  primary: {
    DEFAULT: '#475569', // Slate blue
    light: '#64748b',
    dark: '#334155',
  },

  // Accent color
  accent: {
    DEFAULT: '#0d9488', // Deep teal
    light: '#14b8a6',
    dark: '#0f766e',
  },

  // Alert/Warning color
  alert: {
    DEFAULT: '#f59e0b', // Amber
    light: '#fbbf24',
    dark: '#d97706',
  },

  // Critical/Error color
  critical: {
    DEFAULT: '#e11d48', // Rose
    light: '#fb7185',
    dark: '#be123c',
  },

  // Surface colors
  surface: {
    DEFAULT: '#f8fafc', // Cool white
    card: '#ffffff', // Pure white
    muted: '#f1f5f9',
  },

  // Muted/secondary colors
  muted: {
    DEFAULT: '#94a3b8', // Slate
    light: '#cbd5e1',
    dark: '#64748b',
  },

  // Status colors (healthcare specific)
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    pending: '#f59e0b',
    scheduled: '#0d9488',
    completed: '#22c55e',
    missed: '#e11d48',
  },

  // Border colors
  border: {
    DEFAULT: '#e2e8f0',
    light: '#f1f5f9',
    dark: '#cbd5e1',
  },
} as const;

// Typography Scale
export const typography = {
  fonts: {
    heading: 'var(--font-merriweather), ui-serif, Georgia, serif',
    body: 'var(--font-source-sans), ui-sans-serif, system-ui, sans-serif',
  },

  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  sizes: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  lineHeights: {
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.6,
    loose: 2,
  },

  // Heading scale
  headings: {
    h1: {
      fontSize: '2.25rem',
      lineHeight: 1.2,
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '1.875rem',
      lineHeight: 1.25,
      fontWeight: 700,
      letterSpacing: '-0.015em',
    },
    h3: {
      fontSize: '1.5rem',
      lineHeight: 1.3,
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.25rem',
      lineHeight: 1.4,
      fontWeight: 700,
      letterSpacing: '0',
    },
    h5: {
      fontSize: '1.125rem',
      lineHeight: 1.4,
      fontWeight: 700,
      letterSpacing: '0',
    },
    h6: {
      fontSize: '1rem',
      lineHeight: 1.5,
      fontWeight: 700,
      letterSpacing: '0',
    },
  },
} as const;

// Spacing Scale (based on 4px grid)
export const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem', // 2px
  1: '0.25rem', // 4px
  1.5: '0.375rem', // 6px
  2: '0.5rem', // 8px
  2.5: '0.625rem', // 10px
  3: '0.75rem', // 12px
  3.5: '0.875rem', // 14px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  7: '1.75rem', // 28px
  8: '2rem', // 32px
  9: '2.25rem', // 36px
  10: '2.5rem', // 40px
  11: '2.75rem', // 44px
  12: '3rem', // 48px
  14: '3.5rem', // 56px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  28: '7rem', // 112px
  32: '8rem', // 128px
} as const;

// Border Radius (8px standard)
export const borderRadius = {
  none: '0',
  sm: '0.25rem', // 4px
  DEFAULT: '0.5rem', // 8px - standard
  md: '0.5rem', // 8px
  lg: '0.5rem', // 8px - keeping consistent
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  '3xl': '1.5rem', // 24px
  full: '9999px',
} as const;

// Shadows (flat, subtle)
export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
} as const;

// Z-index scale
export const zIndex = {
  auto: 'auto',
  0: 0,
  10: 10,
  20: 20,
  30: 30,
  40: 40,
  50: 50, // Modals, dropdowns
  60: 60, // Tooltips
  70: 70, // Fixed headers
  80: 80, // Overlays
  90: 90, // Top-level alerts
  100: 100, // Maximum priority
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Animation durations
export const durations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// Text size toggle options
export const textSizes = {
  default: 16,
  large: 18,
  xl: 20,
} as const;

// Export all tokens as a single object
export const designTokens = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  zIndex,
  breakpoints,
  durations,
  textSizes,
} as const;

export default designTokens;
