---
name: API Lens
colors:
  surface: '#f8f9fe'
  surface-dim: '#d8dadf'
  surface-bright: '#f8f9fe'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3f8'
  surface-container: '#eceef3'
  surface-container-high: '#e7e8ed'
  surface-container-highest: '#e1e2e7'
  on-surface: '#191c1f'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3134'
  inverse-on-surface: '#eff0f5'
  outline: '#747687'
  outline-variant: '#c3c5d8'
  surface-tint: '#074dea'
  primary: '#0049e3'
  on-primary: '#ffffff'
  primary-container: '#3264ff'
  on-primary-container: '#fbf8ff'
  inverse-primary: '#b7c4ff'
  secondary: '#505d85'
  on-secondary: '#ffffff'
  secondary-container: '#c3d0fe'
  on-secondary-container: '#4b5880'
  tertiary: '#4c5887'
  on-tertiary: '#ffffff'
  tertiary-container: '#6570a1'
  on-tertiary-container: '#faf8ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001552'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b8c5f3'
  on-secondary-fixed: '#0a1a3d'
  on-secondary-fixed-variant: '#38456b'
  tertiary-fixed: '#dce1ff'
  tertiary-fixed-dim: '#b8c4fa'
  on-tertiary-fixed: '#0a1844'
  on-tertiary-fixed-variant: '#394472'
  background: '#f8f9fe'
  on-background: '#191c1f'
  surface-variant: '#e1e2e7'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0em
  label-code-lg:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.02em
  tabular-kpi:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system defines an interface for developer-first security observability, runtime telemetry, and API contract monitoring. It synthesizes utilitarian technical clarity with refined, approachable modern SaaS aesthetics.

### Brand Personality & Core Audience
- **Target Audience:** Platform engineers, DevSecOps leads, backend architects, and site reliability teams requiring high signal-to-noise ratios across complex microservice graphs.
- **Tone:** Authoritative, transparent, surgical, and composed.
- **Emotional Response:** Inspires quiet confidence, operational control, speed without friction, and effortless diagnostic precision.

### Design Movement: Precision Technical Modernism
The visual language avoids dark, retro-terminal hacker clichés in favor of luminous high-contrast clarity:
- **Crisp Structural Outlines:** Fine 1px tinted borders establish explicit containment boundaries without visual heaviness.
- **Soft Tonal Tiering:** Luminous micro-tinted surfaces (soft lavender, cool slate-white) isolate telemetry contexts cleanly against pure white workspaces.
- **Electric Accent Calibration:** Energetic cobalt blue is reserved strictly for operational focal points, state transitions, active selections, and actionable telemetry cues.

## Colors

The palette leverages a cool-tinted daylight foundation balanced by precise signal hues. High-contrast typography guarantees WCAG AAA legibility against ambient structural surfaces.

### Foundation & Surfaces
- **Canvas Base (`#FFFFFF`):** Primary panel background and core card surface.
- **Surface Muted (`#F8F9FE`):** App shell canvas, inactive table headers, structural lanes.
- **Surface Soft Lavender (`#F2F4FD`):** Filter wells, secondary panels, code block headers.
- **Surface Accent Light (`#EBF0FF`):** Active nav items, tag highlights, interactive pill selections.
- **Section Wash Alpha (`#F5F7FF` & `#EEF2FF`):** Alternating analytical card groupings, payload inspectors, and preview zones.

### Core Brands & Neutrals
- **Primary Electric Blue (`#3264FF`):** Action targets, dominant indicators, focused controls.
- **Primary Hover (`#2550DB`):** Activated and depressed button states.
- **Text Primary (`#101D49`):** Deep navy with zero chromatic sludge, ensuring crisp text rendering across high-density readouts.
- **Text Secondary (`#58658D`):** Muted slate navy for metadata labels, column headers, and structural hints.
- **Text Subtle (`#8F9BB3`):** Auxiliary timestamps, placeholder tokens, inactive icons, and empty KPI hyphens (`--`).
- **Border Subtle (`#DCE5FF`):** Definitive 1px division line throughout cards, tables, inputs, and section boundaries.

### Diagnostic & Status Accents
- **Success (`#0E9F6E` / wash `#DEF7EC`):** Valid schemas, 2xx responses, verified tokens.
- **Warning (`#E07A5F` / wash `#FEF3EC`):** Latency degradation, expiring certificates, payload drift.
- **Critical / Threat (`#E02424` / wash `#FDE8E8`):** 5xx spikes, broken contract validations, unauthorized calls.
- **Neutral Info (`#4B5563` / wash `#F3F4F6`):** Deprecated endpoints, internal redirects, protocol metadata.

## Typography

The typographic balance bridges clean editorial precision with monospaced data alignment.

- **Primary UI Typeface:** Plus Jakarta Sans provides high x-height clarity, rounded geometric clarity, and crisp render legibility on high-DPI displays.
- **Technical & Metric Typeface:** JetBrains Mono is assigned to all API routes, HTTP method tags, status indicators, payload schema dumps, and tabular metric tables.
- **Tabular Figures:** All statistical monitors, percentile histograms, latency counters, and rate metrics enforce monospaced or `tnum` numeric alignment to eliminate jitter during active streaming updates.

## Layout & Spacing

The architecture operates on an 8pt dynamic scale (with a 4pt baseline for granular UI controls), maximizing screen density while preserving visual air.

### Breakpoints & Layout Adapters
- **Desktop (>= 1280px):** Fixed left navigation rail (240px default, 64px collapsed), fluid master layout utilizing 12 columns with 24px gutters (`gutter-desktop`) and 32px canvas margins (`margin-desktop`).
- **Tablet (768px - 1279px):** Off-canvas slideover sidebar, 8-column layout, 16px gutters, and 24px canvas margins.
- **Mobile (< 768px):** Single-column stacked stream, collapsed header with bottom action sheet navigation, 16px fixed canvas margin (`margin`).

### Spacing Application Rules
- **Component Tight (`space-xs` = 4px, `space-sm` = 8px):** Method badge padding, inline icon labels, filter tag lists.
- **Component Medium (`space-md` = 16px):** Standard card inner padding, input internal spacing, table row gap rhythm.
- **Section Structural (`space-lg` = 24px, `space-xl` = 32px):** Metric grid separations, telemetry chart group divisions, empty-state containers.

## Elevation & Depth

Visual hierarchy uses crisp line definitions and faint ambient diffusion instead of traditional heavy drop shadows.

### Elevation Levels
- **Level 0 (Flat Ground):** Background `#F8F9FE` and `#FFFFFF` with static 1px `#DCE5FF` borders.
- **Level 1 (Dashboard Tile Default):**
  - Border: `1px solid #DCE5FF`
  - Shadow: `0px 1px 3px rgba(16, 29, 73, 0.04), 0px 4px 8px -2px rgba(50, 100, 255, 0.02)`
- **Level 2 (Hover & Active Drag):**
  - Border: `1px solid #BAC9F5`
  - Shadow: `0px 4px 16px -4px rgba(16, 29, 73, 0.08), 0px 2px 6px -1px rgba(50, 100, 255, 0.05)`
  - Translation: `translateY(-1px)`
- **Level 3 (Flyouts, Command Palettes, Popovers):**
  - Border: `1px solid #BAC9F5`
  - Shadow: `0px 12px 32px -6px rgba(16, 29, 73, 0.12), 0px 4px 12px -2px rgba(16, 29, 73, 0.04)`
  - Backdrop Blur: `8px` blur on the overlay scrim (`rgba(16, 29, 73, 0.3)`).

## Shapes

The design system standardizes on geometric, structural radii. Corner geometry remains structured enough to communicate analytical density while soft enough to avoid harsh industrial rigidity.

- **Tokens:**
  - Micro (`rounded-sm` / 4px): Code badges, table cell pills, validation badges.
  - Standard Control (`rounded-md` / 8px): Primary buttons, text inputs, search fields, menu options.
  - Cards & Shells (`rounded-xl` / 12px): Standard observability cards, telemetry panels, modal dialogs.
  - Complete Pills (`rounded-full` / 9999px): Active navigation selection markers, avatar counters, status badges.

## Components

### Buttons
- **Primary:** Solid `#3264FF` background, `#FFFFFF` text, font weight 600. On hover: `#2550DB`. Focus ring: 3px `#EBF0FF` glow with `#3264FF` inner boundary.
- **Secondary:** Surface `#FFFFFF`, border `1px solid #DCE5FF`, text `#101D49`. On hover: surface `#F8F9FE`, border `#BAC9F5`.
- **Ghost / Utility:** Transparent fill, `#58658D` text. On hover: `#F2F4FD` fill, `#101D49` text.
- **Icon Actions:** 36x36px bounding box, 8px radius, subtle hover wash (`#F2F4FD`).

### Modern Developer Dashboard Cards
- **Geometry:** 12px corner radius (`rounded-xl`), background `#FFFFFF`, border `1px solid #DCE5FF`.
- **Card Header:** Height 48px, horizontal layout. Left: Title (`headline-sm`, `#101D49`) and optional mono metadata tag. Right: Action cluster (time filter, context menu). Bottom separator: optional subtle `1px solid #F2F4FD`.
- **Hover State:** Smooth transition (150ms ease), border transitions to `#BAC9F5`, Level 2 elevation shadow applied.

### Sidebar Navigation
- **Structure:** 240px wide, background `#FFFFFF`, right border `1px solid #DCE5FF`.
- **Header:** Brand mark with electric blue glyph and technical deep navy wordmark.
- **Navigation Groups:** Section labels in uppercase `label-code-sm` (`#8F9BB3`), 12px top/bottom separation.
- **Active State:** Surface `#EBF0FF`, text `#3264FF`, weight 600, featuring a 3px vertical pill indicator pinned to the left margin or an integrated electric-blue container highlight.
- **Inactive Items:** Text `#58658D`. On hover: background `#F8F9FE`, text `#101D49`.

### Top Header Bar
- **Dimensions:** 60px height, fixed sticky top, surface `#FFFFFF` with ambient border bottom `1px solid #DCE5FF`.
- **Breadcrumbs:** Structured sequence (`Project / Microservice / Telemetry`), split by slash divider (`#8F9BB3`), trailing segment weighted 600 (`#101D49`).
- **Global Search:** Pill container (`#F8F9FE`), border `1px solid #DCE5FF`, leading search glyph, trailing hotkey indicator badge (`⌘K` in JetBrains Mono).
- **User Profile Area:** Circular or rounded-md avatar accompanied by tenant selector dropdown with a subtle chevron.

### Inputs, Chips, & Form Controls
- **Inputs:** Height 38px, background `#FFFFFF`, border `1px solid #DCE5FF`, typography `body-md`. Focus state uses `#3264FF` border outline with `0 0 0 3px #EBF0FF`.
- **Method Chips (GET, POST, PUT, DELETE):** JetBrains Mono bold text, 4px corner radius, tight padding (2px 6px).
  - `GET`: text `#0284C7`, background `#E0F2FE`
  - `POST`: text `#059669`, background `#D1FAE5`
  - `PUT`: text `#D97706`, background `#FEF3C7`
  - `DELETE`: text `#DC2626`, background `#FEE2E2`
- **Checkboxes & Radios:** 16x16px, border `1.5px solid #DCE5FF`, active state solid `#3264FF` with centered checkmark or dot.

### Zero-Data Empty States
- **Container:** Rounded 12px, border `1px dashed #BAC9F5`, inner background `#F8F9FE` with a soft lavender gradient center (`#EEF2FF` at 40% radial falloff).
- **Vector Illustration:** Minimal 2-color vector line illustration using Deep Navy (`#101D49`) and Electric Blue (`#3264FF`) accented with translucent fills.
- **KPI Placeholders:** Metric tiles without live telemetry prominently display `--` in `tabular-kpi` style colored in `#8F9BB3` alongside an explanatory subtitle ("Awaiting ingress traffic").
- **Call-to-Action:** Inline code installation snippet or clear primary action button ("Deploy Agent", "Import OpenAPI Spec").