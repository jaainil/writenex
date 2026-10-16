---
name: Writenex Astro
description: Existing visual system for the Astro content-collection editor.
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
  white: '#ffffff'
  highlight: '#fde047'
typography:
  body:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 0.875rem
    lineHeight: 1.5
  label:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 0.75rem
    fontWeight: 500
  code:
    fontFamily: ui-monospace, Cascadia Code, Menlo, Consolas, Courier New, monospace
  headline:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: clamp(1.75rem, 1.5rem + 1vw, 2.25rem)
    lineHeight: 1.2
  prose:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: clamp(0.9375rem, 0.9rem + 0.2vw, 1rem)
    lineHeight: 1.75
  title:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 1.125rem
    fontWeight: 700
  field:
    fontFamily: Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif
    fontSize: 0.8125rem
rounded:
  sm: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  full: 9999px
spacing:
  '1': 0.25rem
  '2': 0.375rem
  '3': 0.5rem
  '4': 0.75rem
  '5': 1rem
  '6': 1.25rem
  '7': 1.5rem
  '8': 2rem
  '9': 3rem
components:
  button-primary:
    backgroundColor: '{colors.brand-500}'
    textColor: '{colors.white}'
    rounded: '{rounded.md}'
    padding: 6px 12px
  button-secondary:
    textColor: '{colors.zinc-300}'
    rounded: '{rounded.md}'
    padding: 6px 12px
  button-ghost:
    textColor: '{colors.zinc-400}'
    rounded: '{rounded.md}'
    padding: 6px 12px
  input:
    backgroundColor: '{colors.zinc-950}'
    textColor: '{colors.zinc-50}'
    rounded: '{rounded.md}'
    padding: 8px
  badge:
    textColor: rgba(255, 255, 255, 0.5)
    rounded: '{rounded.sm}'
    padding: 4px 8px
  navigation:
    backgroundColor: '{colors.zinc-900}'
    textColor: '{colors.zinc-50}'
    width: 280px
    padding: 12px
  panel:
    backgroundColor: '{colors.zinc-900}'
    textColor: '{colors.zinc-50}'
    width: 320px
---

# Design System: Writenex Astro

## Overview

**Creative North Star: "The Quiet Writing Desk"**

A calm, practical writing workspace with compact controls, rounded boundaries, blue accents, and generous room for content. The writing canvas leads; navigation and document tools form a restrained frame around it.

The Astro integration uses a dark-first shell, collection navigation, a frontmatter side panel, and fluid prose typography. Light mode is implemented through scoped overrides. This is a code-derived record of the incumbent interface. The metaphor and descriptive language are provisional defaults pending user feedback, rather than newly established brand commitments.

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

Status colors are semantic, rather than secondary brand palettes: **Emerald** for saved/success, **Amber** for caution/pending, **Red** for error/destructive states, and **Violet** for metadata. **Highlight Yellow** marks search matches. The source also defines alpha overlays and selection colors; retain those CSS definitions rather than substituting opaque fills.

**The Semantic Color Rule.** Keep status meaning consistent across indicators and destructive actions.

## Typography

**Display and body:** Plus Jakarta Sans with system sans-serif fallbacks.

**Code:** the system monospace stack; Astro does not load Agave.

Interface text uses 14px by default, 13px for secondary fields, 12px for hints and badges, 16px for panel titles, and 18px for section titles. Prose is fluid (15–16px) with line height 1.75. Prose h1 ranges from 28–36px with line height 1.2; h2 ranges from 20–24px with line height 1.3. The frontmatter records the exact fluid expressions.

## Layout

A viewport-height flex shell holds the header, content bar, and scrolling editor. The header has a 72px minimum height; the content bar has a 48px minimum height. The collection sidebar is 280px; the frontmatter panel is 320px. Closed panels collapse to zero width. Modal maximum widths are 24rem, 28rem, 36rem, and 72rem depending on task.

The spacing scale is explicit and nonuniform: source steps 1–9 run from 4px to 48px, including 6px and 20px. No viewport media-query breakpoints were found in the client CSS; do not claim parity with the web app’s responsive behavior. Narrow-screen usability needs separate verification when extending this target.

## Elevation & Depth

Layered workspace, lifted overlays: tonal backgrounds and thin borders separate persistent chrome. Shadows distinguish floating controls, panels, and dialogs. This phrase is provisional; the measurements below come from code.

Shadow tokens: small (`0 1px 2px var(--wn-overlay-light-10)`), medium (`0 4px 12px rgba(0, 0, 0, 0.3)`), large (`0 25px 50px -12px rgba(0, 0, 0, 0.5)`), and side panel (`-4px 0 16px rgba(0, 0, 0, 0.3)`). Light-mode overrides reduce these opacities; modal backdrops use the source backdrop tokens.

## Shapes

Controls use gently rounded corners (6px). Small badges use 4px; panels and modals use 8px; pills use the full-radius token. Thin borders provide most structural separation.

## Components

Compact and restrained is the provisional character description. The component facts below are extracted from source.

### Buttons

Primary buttons use Writing Blue with white text, 6px corners, and 6px by 12px padding. Hover uses Deep Writing Blue. Secondary buttons are transparent with zinc borders; ghost buttons are borderless. All three variants use a 2px blue focus outline with 2px offset. Disabled buttons have 50% opacity and ignore pointer events. Icon controls are usually 32px square.

### Inputs / Fields

Frontmatter fields use 8px padding, a zinc-950 fill, a white 10% border, 6px corners, and 13px type. Focus changes the border to Writing Blue; light-theme overrides change the field surface and text.

### Navigation

Collection navigation occupies the collapsible left sidebar. Section labels use small uppercase type with 0.05em tracking. Toolbars group 32px icon buttons within an 8px rounded container, separated by vertical dividers.

### Panels and metadata

Frontmatter and history panels are structural workspace surfaces with border-separated headers and independently scrollable bodies. Header metadata badges use 12px uppercase type, 4px corners, and 4px by 8px padding. Autosave state uses explicit saved, saving, error, pending, and idle colors. There is no shared standalone card primitive to invent here.

## Do's and Don'ts

### Do:

- Do preserve the shared brand palette while respecting this target’s theme implementation.
- Do keep prose and code typography distinct.
- Do retain keyboard focus and disabled states when extending controls.

### Don't:

- Don’t replace semantic status colors with decorative accents.
- Don’t copy theme selectors or spacing-token names across targets without checking their definitions.
- Don’t treat archival screenshots as authority over current component source.

Evidence: `src/client/variables.css`, `src/client/styles.css`, and component styles under `src/client/components/`.
