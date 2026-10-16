---
name: Writenex
description: Existing visual system for the browser Markdown editor and marketing pages.
colors:
  brand-400: '#5c7cff'
  brand-500: '#335dff'
  brand-600: '#2a4ecc'
  zinc-50: '#fafafa'
  zinc-100: '#f4f4f5'
  zinc-150: '#ececef'
  zinc-200: '#e4e4e7'
  zinc-300: '#d4d4d8'
  zinc-400: '#a1a1aa'
  zinc-500: '#71717a'
  zinc-600: '#52525b'
  zinc-700: '#3f3f46'
  zinc-800: '#27272a'
  zinc-850: '#1f1f23'
  zinc-900: '#18181b'
  zinc-950: '#09090b'
  success-400: '#34d399'
  success-500: '#10b981'
  warning-400: '#fbbf24'
  warning-500: '#f59e0b'
  error-400: '#f87171'
  error-500: '#ef4444'
  error-600: '#dc2626'
  info-400: '#a78bfa'
  info-500: '#8b5cf6'
  info-600: '#7c3aed'
  white: '#ffffff'
  prose-body: '#334155'
  prose-heading: '#1e293b'
  prose-divider: '#e2e8f0'
  quote-surface: '#f8fafc'
  dialog-dark: '#161b22'
  highlight: '#fde047'
typography:
  body:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 1rem
    lineHeight: 1.5
  label:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 0.75rem
    fontWeight: 500
  code:
    fontFamily: Agave Nerd Font Mono, ui-monospace, Cascadia Code, Menlo, Consolas, Courier New, monospace
  display:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.25
  headline:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 1.875rem
    fontWeight: 700
  title:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 1.125rem
    fontWeight: 600
  control:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 0.875rem
    fontWeight: 500
rounded:
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  full: 9999px
  xl: 0.75rem
  2xl: 1rem
spacing:
  '1': 0.25rem
  '2': 0.5rem
  '3': 0.75rem
  '4': 1rem
  '5': 1.25rem
  '6': 1.5rem
  '8': 2rem
  '12': 3rem
  '20': 5rem
components:
  button-default:
    backgroundColor: '{colors.zinc-900}'
    textColor: '{colors.zinc-50}'
    rounded: '{rounded.md}'
    padding: 8px 16px
    height: 36px
  button-destructive:
    backgroundColor: '{colors.error-500}'
    textColor: '{colors.zinc-50}'
    rounded: '{rounded.md}'
    padding: 8px 16px
  button-outline:
    backgroundColor: '{colors.white}'
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 8px 16px
  button-secondary:
    backgroundColor: '{colors.zinc-100}'
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 8px 16px
  button-ghost:
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 8px 16px
  button-link:
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 8px 16px
  button-default-dark:
    backgroundColor: '{colors.zinc-50}'
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 8px 16px
    height: 36px
  button-brand:
    backgroundColor: '{colors.brand-500}'
    textColor: '{colors.white}'
    rounded: '{rounded.lg}'
    padding: 12px 20px
  button-brand-hover:
    backgroundColor: '{colors.brand-600}'
    textColor: '{colors.white}'
    rounded: '{rounded.lg}'
  input:
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.md}'
    padding: 4px 12px
  feature-card:
    backgroundColor: '{colors.white}'
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.xl}'
    padding: 24px
  document-tab:
    backgroundColor: '{colors.white}'
    textColor: '{colors.zinc-900}'
    rounded: '{rounded.lg}'
    padding: 8px 12px
---

# Design System: Writenex

## Overview

**Creative North Star: "The Quiet Writing Desk"**

A calm, practical writing workspace with compact controls, rounded boundaries, blue accents, and generous room for content. The writing canvas leads; navigation and document tools form a restrained frame around it.

The browser editor pairs a light/dark writing workspace with more spacious marketing pages. Marketing calls to action use blue; shared editor buttons default to neutral contrast. This is a code-derived record of the incumbent interface. The metaphor and descriptive language are provisional defaults pending user feedback, rather than newly established brand commitments.

**Key Characteristics:**

- Blue brand accents with zinc interface neutrals.
- Compact rounded controls around an expansive writing surface.
- Explicit hover, focus, disabled, and document-status treatments.

## Colors

The palette uses Writing Blue for brand emphasis, zinc neutrals for interface structure, and distinct semantic colors for document state. Frontmatter preserves source values and token names.

### Primary

- **Writing Blue** (`brand-500`): logo, key actions, links, and Astro focus outlines.
- **Light Writing Blue** (`brand-400`): lighter brand emphasis and dark-theme links.
- **Deep Writing Blue** (`brand-600`): blue-button hover and stronger emphasis.

### Neutral

- **Zinc neutrals** (`zinc-50` through `zinc-950`): text, panels, borders, and surfaces. Intermediate steps are retained from the implementation.
- **White** (`white`): light surfaces and text on blue actions.
- **Slate prose** (`prose-body`, `prose-heading`, `prose-divider`, `quote-surface`): rendered Markdown overrides; these coexist with zinc chrome.
- **Dark dialog surface** (`dialog-dark`): the shared dialog’s existing dark background.

Status colors are semantic, rather than secondary brand palettes: **Emerald** for saved/success, **Amber** for caution/pending, **Red** for error/destructive states, and **Violet** for metadata. **Highlight Yellow** marks search matches. The source also defines alpha overlays and selection colors; retain those CSS definitions rather than substituting opaque fills.

**The Semantic Color Rule.** Keep status meaning consistent across indicators and destructive actions.

## Typography

**Display and body:** Plus Jakarta Sans with system sans-serif fallbacks.

**Code:** self-hosted Agave Nerd Font Mono with system monospace fallbacks.

Marketing display text starts at 36px, grows to 48px at the small breakpoint and 60px at the large breakpoint, with bold weight and tight leading. Section headings grow from 30px to 36px. Feature titles are 18px semibold. Shared controls are 14px medium; small buttons use 12px. Marketing lead paragraphs are 18–20px. The editor uses the bundled MDXEditor theme and explicit prose overrides; do not apply the marketing display scale to its toolbar.

## Layout

Marketing containers use 72rem for feature sections, 56rem for hero/CTA blocks, 48rem for FAQ content, and 42rem for lead copy. Horizontal gutters grow from 16px to 24px to 32px. Major marketing sections use 80px vertical padding; grids progress from one column to multiple columns at responsive breakpoints.

The editor fills the available space and gives its writing surface independent scrolling. Document tabs scroll horizontally and range from 120px to 240px wide. Below the small breakpoint, header actions and tab close/add controls have 44px minimum targets; the brand text hides and the header tool group scrolls within 60vw. Editor padding grows from 8px to 16px. Tailwind default breakpoints in use include sm (640px), md (768px), and lg (1024px); an editor media query also targets max-width 768px.

## Elevation & Depth

Layered workspace, lifted overlays: tonal backgrounds and thin borders separate persistent chrome. Shadows distinguish floating controls, panels, and dialogs. This phrase is provisional; the measurements below come from code.

Marketing cards and shared inputs use a small shadow. Shared dialogs use Tailwind’s large shadow, an 80% black overlay, and 200ms opening/closing transitions. The fixed marketing header uses 80% opacity and a small backdrop blur. These treatments belong to those components, rather than all surfaces.

## Shapes

Controls use gently rounded corners (6px). Marketing CTAs use 8px; feature cards use 12px; large step icons use 16px. Pills and circular badges use full rounding. Document tabs round only the top corners. Shared dialogs gain 8px rounding at the small breakpoint. Thin borders provide most structural separation.

## Components

Compact and restrained is the provisional character description. The component facts below are extracted from source.

### Buttons

The shared default button uses a dark zinc fill in light mode and a near-white fill in dark mode. Its default height is 36px with 8px by 16px padding and 6px corners. Variants include destructive, outline, secondary, ghost, and link; size variants are small (32px), default (36px), large (40px), and icon (36px square). Focus uses a two-pixel ring with offset; disabled buttons have 50% opacity. Marketing CTAs separately use Writing Blue, 8px corners, and typically 12px by 20px padding. Do not turn the shared default variant blue to match a landing-page CTA.

### Inputs / Fields

Shared inputs are 36px tall, transparent, with 4px by 12px padding, a zinc border, 6px corners, and a small shadow. Focus uses a one-pixel zinc ring, with a lighter ring in dark mode. Disabled inputs have 50% opacity and a disabled cursor.

### Navigation

The marketing header is fixed, 64px tall, and contains a blue logo plus editor CTA; its secondary link hides below 640px. Editor navigation uses document tabs with neutral active surfaces and keyboard focus. Icon-button labels remain available through accessible names and tooltips.

### Cards and chips

Marketing feature cards use a border, white/dark zinc surface, 12px corners, 24px padding, and a small shadow. Brand announcement chips use a blue alpha fill with pill rounding. These patterns are composed directly on the page; there is no shared Card or Badge component API.

## Do's and Don'ts

### Do:

- Do preserve the shared brand palette while respecting this target’s theme implementation.
- Do keep prose and code typography distinct.
- Do retain keyboard focus and disabled states when extending controls.

### Don't:

- Don’t replace semantic status colors with decorative accents.
- Don’t copy theme selectors or spacing-token names across targets without checking their definitions.
- Don’t treat archival screenshots as authority over current component source.

Evidence: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/components/landing/`, `lib/ui/`, and `lib/editor/styles/`. Archival desktop/mobile screenshots were inspected, but current header and touch-target code supersedes them.
