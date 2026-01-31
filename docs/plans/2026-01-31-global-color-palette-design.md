# Global Color Palette Refactor Design

## Problem

Dark mode and light mode are poorly implemented. The application has a comprehensive CSS variable system in `globals.css`, but components use hardcoded Tailwind color classes (`bg-amber-100`, `text-emerald-600`, etc.) instead of referencing the existing CSS variables. This causes:

1. Inconsistent theme switching
2. Colors that don't respond to dark/light mode changes
3. Maintenance burden when updating the design system

## Solution

1. Expand the existing CSS variable system with missing semantic tokens
2. Register these variables in Tailwind's `@theme` block
3. Migrate all 21 affected files to use CSS variables instead of hardcoded colors

---

## CSS Variable Additions

### New Variables for `:root` (Light Mode)

```css
:root {
  /* Foreground variants for status colors (text on status backgrounds) */
  --pending-foreground: 38 80% 30%;
  --scheduled-foreground: 168 70% 25%;
  --completed-foreground: 152 60% 28%;
  --missed-foreground: 350 75% 40%;

  /* Subtle background variants (for info boxes, badges) */
  --pending-muted: 38 80% 95%;
  --scheduled-muted: 168 60% 95%;
  --completed-muted: 152 50% 95%;
  --missed-muted: 350 70% 96%;

  /* Interactive/focus states (sync, drag/drop) */
  --interactive: 199 89% 48%;
  --interactive-foreground: 199 80% 30%;
  --interactive-muted: 199 80% 95%;

  /* Surface hierarchy */
  --surface-elevated: 0 0% 100%;
  --surface-sunken: 210 40% 96%;
}
```

### New Variables for `.dark` (Dark Mode)

```css
.dark {
  /* Foreground variants adjusted for dark backgrounds */
  --pending-foreground: 38 85% 70%;
  --scheduled-foreground: 168 70% 65%;
  --completed-foreground: 152 60% 65%;
  --missed-foreground: 350 75% 70%;

  /* Muted backgrounds - darker, semi-transparent */
  --pending-muted: 38 60% 15%;
  --scheduled-muted: 168 50% 15%;
  --completed-muted: 152 45% 15%;
  --missed-muted: 350 55% 15%;

  /* Interactive states for dark mode */
  --interactive: 199 85% 55%;
  --interactive-foreground: 199 80% 75%;
  --interactive-muted: 199 60% 18%;

  /* Surface hierarchy */
  --surface-elevated: 222 47% 11%;
  --surface-sunken: 217 33% 14%;
}
```

---

## Tailwind Theme Extensions

Add to the `@theme` block in `globals.css`:

```css
@theme {
  /* Status colors */
  --color-pending: hsl(var(--pending));
  --color-pending-foreground: hsl(var(--pending-foreground));
  --color-pending-muted: hsl(var(--pending-muted));

  --color-scheduled: hsl(var(--scheduled));
  --color-scheduled-foreground: hsl(var(--scheduled-foreground));
  --color-scheduled-muted: hsl(var(--scheduled-muted));

  --color-completed: hsl(var(--completed));
  --color-completed-foreground: hsl(var(--completed-foreground));
  --color-completed-muted: hsl(var(--completed-muted));

  --color-missed: hsl(var(--missed));
  --color-missed-foreground: hsl(var(--missed-foreground));
  --color-missed-muted: hsl(var(--missed-muted));

  /* Interactive */
  --color-interactive: hsl(var(--interactive));
  --color-interactive-foreground: hsl(var(--interactive-foreground));
  --color-interactive-muted: hsl(var(--interactive-muted));

  /* Surfaces */
  --color-surface: hsl(var(--surface));
  --color-surface-elevated: hsl(var(--surface-elevated));
  --color-surface-sunken: hsl(var(--surface-sunken));
}
```

---

## Color Mapping Reference

### Status Colors

| Hardcoded Class | CSS Variable | Tailwind Class |
|-----------------|--------------|----------------|
| `bg-amber-100`, `bg-amber-50` | `--pending-muted` | `bg-pending-muted` |
| `text-amber-700`, `text-amber-600` | `--pending-foreground` | `text-pending-foreground` |
| `border-amber-200` | `--pending-muted` | `border-pending-muted` |
| `bg-teal-100`, `bg-teal-50` | `--scheduled-muted` | `bg-scheduled-muted` |
| `text-teal-700`, `text-teal-600` | `--scheduled-foreground` | `text-scheduled-foreground` |
| `border-teal-200` | `--scheduled-muted` | `border-scheduled-muted` |
| `bg-emerald-100`, `bg-emerald-50` | `--completed-muted` | `bg-completed-muted` |
| `text-emerald-700`, `text-emerald-600` | `--completed-foreground` | `text-completed-foreground` |
| `border-emerald-200` | `--completed-muted` | `border-completed-muted` |
| `bg-red-100`, `bg-red-50` | `--missed-muted` | `bg-missed-muted` |
| `text-red-700`, `text-red-600` | `--missed-foreground` | `text-missed-foreground` |
| `border-red-200`, `border-red-400` | `--missed-muted` | `border-missed-muted` |

### Neutral/Surface Colors

| Hardcoded Class | CSS Variable | Tailwind Class |
|-----------------|--------------|----------------|
| `bg-white dark:bg-slate-800` | `--card` | `bg-card` |
| `bg-slate-50 dark:bg-slate-700/50` | `--surface-sunken` | `bg-surface-sunken` |
| `border-slate-200 dark:border-slate-700` | `--border` | `border-border` |
| `text-slate-900 dark:text-slate-100` | `--foreground` | `text-foreground` |
| `text-slate-600 dark:text-slate-400` | `--muted-foreground` | `text-muted-foreground` |

### Interactive/Brand Colors

| Hardcoded Class | CSS Variable | Tailwind Class |
|-----------------|--------------|----------------|
| `bg-teal-600 hover:bg-teal-700` | `--accent` | `bg-accent hover:bg-accent/90` |
| `text-teal-600 dark:text-teal-400` | `--accent` | `text-accent` |
| `bg-sky-50`, `border-sky-100` | `--interactive-muted` | `bg-interactive-muted` |
| `text-sky-600`, `text-sky-700` | `--interactive-foreground` | `text-interactive-foreground` |
| `ring-blue-400` | `--interactive` | `ring-interactive` |

---

## Files to Migrate

### Priority 1: Core UI Components (4 files)
- `src/components/ui/button.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/select.tsx`

### Priority 2: Layout Components (3 files)
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/BottomNav.tsx`

### Priority 3: Patient Components (5 files)
- `src/components/patient/ReferralCard.tsx`
- `src/components/patient/AppointmentCard.tsx`
- `src/components/patient/CallbackForm.tsx`
- `src/components/patient/PatientDetail.tsx`
- `src/components/patient/QRWallet.tsx`

### Priority 4: Dashboard Components (3 files)
- `src/components/dashboard/KanbanColumn.tsx`
- `src/components/dashboard/ReferralCard.tsx`
- `src/components/dashboard/OverdueConfirmDialog.tsx`

### Priority 5: Page Components (6 files)
- `src/app/(patient)/appointments/page.tsx`
- `src/app/(patient)/request-callback/page.tsx`
- `src/app/(patient)/my-referrals/page.tsx`
- `src/app/(patient)/settings/page.tsx`
- `src/app/login/page.tsx`
- `src/app/page.tsx`

---

## Implementation Steps

1. **Update `globals.css`**
   - Add new CSS variables to `:root`
   - Add corresponding dark mode variables to `.dark`
   - Extend `@theme` block with Tailwind color mappings

2. **Migrate UI Components (Priority 1)**
   - Update shadcn components to use CSS variables
   - Test that components render correctly in both modes

3. **Migrate Layout Components (Priority 2)**
   - Update Header, Sidebar, BottomNav
   - Verify consistent appearance across all pages

4. **Migrate Patient Components (Priority 3)**
   - Update all patient-facing components
   - Test status color consistency

5. **Migrate Dashboard Components (Priority 4)**
   - Update Kanban and referral cards
   - Verify drag/drop states use correct colors

6. **Migrate Page Components (Priority 5)**
   - Update all page-level components
   - Final verification of theme switching

---

## Metrics

| Item | Count |
|------|-------|
| New CSS variables | 15 |
| Tailwind theme extensions | 15 |
| Files to migrate | 21 |
| Estimated color replacements | ~200 |
