---
version: 1
name: SPK-Koperasi-design
description: A calm, precise analytical dashboard for a decision-support tool. Neutral slate surfaces let dense data tables and numbers dominate, anchored by a single trustworthy indigo accent reserved for primary actions and active state. Light theme is the default for transactional, data-entry work; an equal-contrast dark theme is available. Numbers use tabular figures and right-alignment. The system trusts spacing rhythm, consistent radii, and one component per pattern over decorative chrome. Explicitly not a crypto-trading aesthetic.
colors:
  accent: "#4f46e5"           # indigo 600 - primary actions, active nav, focus
  accent-hover: "#4338ca"     # indigo 700
  accent-soft: "#eef2ff"      # indigo 50 - tinted active/selected backgrounds (light)
  accent-soft-dark: "#1e1b4b" # indigo 950 - tinted active backgrounds (dark)
  bg: "#f8fafc"               # slate 50 - app canvas (light)
  surface: "#ffffff"          # cards, panels, dropdowns (light)
  surface-muted: "#f1f5f9"    # slate 100 - table header, subtle fills (light)
  ink: "#0f172a"              # slate 900 - primary text (light)
  ink-secondary: "#475569"    # slate 600 - secondary text (light)
  ink-muted: "#64748b"        # slate 500 - captions, column headers (light)
  border: "#e2e8f0"           # slate 200 - hairlines (light)
  border-strong: "#cbd5e1"    # slate 300
  bg-dark: "#0b0f1a"          # app canvas (dark)
  surface-dark: "#111725"     # cards, panels, dropdowns (dark)
  surface-muted-dark: "#1a2234" # table header, subtle fills (dark)
  ink-dark: "#f1f5f9"         # primary text (dark)
  ink-secondary-dark: "#cbd5e1"
  ink-muted-dark: "#94a3b8"
  border-dark: "#22293b"      # hairlines (dark)
  success: "#16a34a"          # green 600 - benefit, complete, valid
  success-soft: "#dcfce7"
  danger: "#dc2626"           # red 600 - cost, destructive, invalid
  danger-soft: "#fee2e2"
  warning: "#d97706"          # amber 600 - belum lengkap, peringatan
  warning-soft: "#fef3c7"
typography:
  font-sans: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  font-mono: "'JetBrains Mono', 'SF Mono', ui-monospace, monospace"  # numbers, codes
  page-title: { size: 24px, weight: 600, lineHeight: 1.25, tracking: -0.01em }
  section-title: { size: 16px, weight: 600, lineHeight: 1.4 }
  body: { size: 14px, weight: 400, lineHeight: 1.55 }
  label: { size: 13px, weight: 500, lineHeight: 1.4 }
  caption: { size: 12px, weight: 500, lineHeight: 1.4, tracking: 0.01em }
  number: { family: mono, size: 14px, weight: 500, feature: "tabular-nums" }
rounded:
  sm: 6px      # badges, small controls
  md: 8px      # buttons, inputs, dropdowns
  lg: 12px     # cards, dialogs
  full: 9999px # pills, avatars, status dots
spacing:
  base: 4px
  scale: [4, 8, 12, 16, 20, 24, 32, 48, 64]
  card-padding: 20px
  page-padding: 32px
  field-gap: 16px
elevation:
  flat: "none"                                   # body, table rows
  card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)"  # cards (light)
  popover: "0 4px 12px rgba(15,23,42,0.08), 0 2px 4px rgba(15,23,42,0.06)"  # dropdowns, dialogs
  focus-ring: "0 0 0 3px rgba(79,70,229,0.35)"   # keyboard focus
---

## Overview

SPK Koperasi is a **product-register analytical dashboard**: design serves the data, not the other way around. The canvas is a soft neutral slate (`#f8fafc` light / `#0b0f1a` dark). Cards and tables sit on flat `surface` with a single hairline border and the faintest card shadow — no heavy drop shadows, no gradients, no glassmorphism. A single **indigo accent** (`#4f46e5`) carries primary CTAs, active navigation, focus rings, and the ranking-#1 highlight. Everything else is grayscale so the numbers and tables read instantly.

The product is **light-default** (data entry and reading is more comfortable on light), with a fully supported equal-contrast dark theme toggled via the `.dark` class on `<html>`.

**Key characteristics:**
- One accent only. Indigo for "primary / active / focus". Never decorative.
- Semantic colors are scoped: green = benefit/complete/valid, red = cost/destructive/invalid, amber = incomplete/warning. Used as text + soft-tint badges, never as full card fills.
- Numbers and codes (C1, A3, 0.367) render in **JetBrains Mono with tabular figures**, right-aligned in tables for scan-down comparison.
- Consistency is enforced: every dropdown is the same custom `Select`, every "back" affordance is the same breadcrumb (no stray text links), every destructive action routes through a confirm dialog.

## Colors

### Accent
- **Indigo `#4f46e5`**: primary buttons, active sidebar item, selected dropdown option, focus ring base, ranking-1 marker. Hover darkens to `#4338ca`. Selected/active backgrounds use the soft tint (`accent-soft` light / `accent-soft-dark` dark).

### Surfaces (light → dark)
- Canvas: `#f8fafc` → `#0b0f1a`
- Card/panel/dropdown: `#ffffff` → `#111725`
- Subtle fill (table header, inset): `#f1f5f9` → `#1a2234`
- Border hairline: `#e2e8f0` → `#22293b`

### Text
- Primary ink: `#0f172a` → `#f1f5f9`
- Secondary: `#475569` → `#cbd5e1`
- Muted (captions, column headers): `#64748b` → `#94a3b8`
- All meet WCAG AA on their intended surface. Never put muted gray on a tinted background for body copy.

### Semantic
- **Benefit / Lengkap / Valid** → green `#16a34a` text, `success-soft` badge bg.
- **Cost / Hapus / Tidak valid** → red `#dc2626`.
- **Belum lengkap / Peringatan** → amber `#d97706`.
- Consistency status in AHP uses green (konsisten) / amber (tidak konsisten) — not red, since it's a caution not an error.

## Typography

- **Inter** for all UI text. **JetBrains Mono** for numbers, codes, and matrix cells.
- Page title 24/600, section title 16/600, body 14/400, label 13/500, caption 12/500.
- Numbers always `font-variant-numeric: tabular-nums` and right-aligned in tables.
- No font heavier than 600. Hierarchy comes from size + color + spacing, not bold weight.

## Layout

- App shell: fixed 248px sidebar (light surface, indigo active item) + top bar (64px) + scrollable content with 32px page padding.
- Content max-width ~1200px for forms/detail; tables may go full-width.
- Spacing scale strictly from `[4,8,12,16,20,24,32,48,64]`. Card padding 20px. Field gap 16px. Never ad-hoc values.
- Forms: labels above inputs, full-width fields in a single column or an even 2-column grid where **both columns share identical width** (no mismatched field widths).

## Components

### Buttons
- **Primary**: indigo bg, white text, `md` radius, height 36px, 12–16px horizontal padding. Hover `accent-hover`.
- **Secondary/outline**: surface bg, `border` hairline, ink text. Hover `surface-muted`.
- **Ghost**: transparent, ink text, hover `surface-muted`. For icon-only row actions.
- **Destructive**: red text on transparent (ghost-destructive) for triggers; solid red only inside confirm dialogs.
- All buttons share one height per size token; icons are 16px, gap 8px.

### Select (custom — never native)
Custom dropdown built on the UI library's Select primitive. Trigger looks like an input (surface bg, border, `md` radius, 36px). Menu: `surface` bg, `popover` shadow, `border`, 4px padding; options 32px tall with hover `surface-muted` and selected state showing `accent-soft` bg + indigo check. Fully keyboard navigable. **No native `<select>` anywhere.**

### Cards
`surface` bg, 1px `border`, `lg` radius, `card` shadow (very subtle), 20px padding. Header row: section title left, actions right. No nested heavy shadows.

### Tables
Header row on `surface-muted`, muted uppercase-tracked column labels, 12px caption size. Body rows separated by `border` hairlines, 12px vertical padding. Numbers right-aligned mono. Row hover `surface-muted`. Codes (C1/A1/K1) as mono indigo chips or plain mono.

### Badges
Soft-tint bg + matching darker text, `sm` radius, 12px caption, 2–8px padding. Status dot (`full` radius) optional. Variants: success/danger/warning/neutral/accent.

### Breadcrumb & back
Single pattern: breadcrumb trail at top of every sub-page (`Model SPK / {name} / {section}`), clickable segments in muted → ink on hover. **No stray "← Kembali" text links** scattered in the body.

### Dialog
Centered, `surface` bg, `lg` radius, `popover` shadow, 24px padding, max-width 440px (confirm) / 520px (form). Title 16/600, description muted body, actions right-aligned (secondary then primary). Every destructive/irreversible action (duplikat, publish, arsip, restore, hapus) confirms here.

### Empty states
Centered icon in a muted circle, one-line bold message, one-line muted hint, primary action. No walls of gray text.

## Do's and Don'ts

### Do
- Keep indigo scarce: primary action, active nav, focus, rank-1.
- Right-align and mono-format every number; use tabular figures.
- Route every mutating/destructive action through a confirm dialog with a clear consequence sentence.
- Keep one component per pattern; reuse the custom Select, the breadcrumb, the confirm dialog everywhere.
- Center-align paired comparison rows (AHP) on a fixed 3-column grid so the "vs" never wanders.

### Don't
- No Binance/crypto palette (neon yellow on black). No second accent.
- No native `<select>`. No unstyled dropdowns.
- No muted-gray body text on tinted backgrounds.
- No mismatched field widths in a form grid.
- No decorative brand glyph next to the wordmark ("SPK" tile beside "SPK Koperasi" is removed).
- No heavy shadows, gradients, or glow.

## Accessibility

WCAG 2.1 AA. Visible focus ring (`focus-ring`) on every interactive element. Full keyboard support on Select and Dialog. Respect `prefers-reduced-motion` (disable non-essential transitions). Dark theme keeps equal contrast ratios. Status never relies on color alone — pair with text label or icon.
