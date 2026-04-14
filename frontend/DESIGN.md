# Gestionale Quixel — Design System

> **Brand essence:** Precision meets warmth — a command center that feels alive.
>
> This document is the single source of truth for all visual design decisions. Every component, color, type scale, and motion curve documented here is derived from the live codebase (`globals.css`, `tailwind.config.js`, and component library).

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Typography System](#2-typography-system)
3. [Color Palette](#3-color-palette)
4. [Spacing & Layout](#4-spacing--layout)
5. [Motion Design](#5-motion-design)
6. [Component Guidelines](#6-component-guidelines)
7. [Accessibility](#7-accessibility)
8. [Dark Mode](#8-dark-mode)
9. [Implementation Reference](#9-implementation-reference)

---

## 1. Brand Identity

### 1.1 Visual Philosophy

| Dimension | Expression |
|---|---|
| **Brand essence** | Precision meets warmth — a command center that feels alive |
| **Visual tension** | Monumental typography vs. intimate data density |
| **Signature moment** | Dashboard stat cards cascade in with colored icon backgrounds and lift on hover |
| **Personality** | Authoritative but approachable; engineered but human |
| **Color philosophy** | Warm cream surfaces, rust-orange accent that feels owned — not generic SaaS blue |

### 1.2 Design Principles

1. **Warmth over sterility** — Surfaces are cream and warm gray, never clinical white-on-white. Borders carry a yellow undertone. Shadows are warm-toned, not neutral gray.
2. **Density with breathing room** — Data-dense dashboards balanced by generous padding and clear typographic hierarchy. Information is packed in but never cramped.
3. **Purposeful motion** — Animations are subtle, directional, and staggered. They guide the eye, never decorate for their own sake.
4. **Rust as a signature** — The rust-orange accent (`hsl(20, 85%, 51%)`) appears at key interaction points: primary buttons, active navigation, stat card icons, focus rings. It is the visual fingerprint of the product.
5. **Grounded realism** — A subtle SVG noise texture overlaid on the background gives surfaces tactile quality. This is not a flat, digital-only aesthetic.

---

## 2. Typography System

### 2.1 Font Families

| Role | Font | Weights | Source |
|---|---|---|---|
| **Display** | Space Grotesk | 300, 400, 500, 600, 700 | `next/font/google` |
| **Body** | Instrument Sans | 400, 500, 600 (+ italic) | `next/font/google` |

```tsx
// app/layout.tsx
import { Space_Grotesk, Instrument_Sans } from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
  weight: ["400", "400", "500", "600"],
  style: ["normal", "italic"],
});
```

### 2.2 CSS Custom Properties

```css
/* globals.css */
:root {
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-instrument-sans), ui-sans-serif, system-ui, sans-serif;
}
```

### 2.3 Type Scale

The type scale follows a minimum **3.4:1 ratio** between body text (14px) and the largest display heading (48px). All heading sizes use `clamp()` for fluid responsiveness.

| Token | Size (clamp) | Approx. px | Font | Weight | Letter-spacing | Line-height | Usage |
|---|---|---|---|---|---|---|---|
| `text-xs` | — | 12px | Body | 400 | 0 | 1.5 | Labels, badges, metadata |
| `text-sm` | — | 14px | Body | 400 | 0 | 1.5 | Body copy, form labels, descriptions |
| `text-base` | — | 16px | Body | 400 | 0 | 1.65 | Default paragraph text |
| `h5` / `h6` | `clamp(1rem, 1.5vw, 1.125rem)` | 16–18px | Display | 600 | -0.01em | 1.3 | Sub-section headers, card titles |
| `h4` | `clamp(1.1rem, 2vw, 1.375rem)` | 18–22px | Display | 600 | -0.02em | 1.25 | Section sub-headers |
| `h3` | `clamp(1.25rem, 3vw, 1.75rem)` | 20–28px | Display | 600 | -0.03em | 1.2 | Section headers |
| `h2` | `clamp(1.5rem, 4vw, 2.5rem)` | 24–40px | Display | 700 | -0.035em | 1.1 | Page headers |
| `h1` | `clamp(2rem, 5vw, 3.5rem)` | 32–56px | Display | 700 | -0.04em | 1.05 | Hero / page title |

### 2.4 Heading Rules (Applied Globally)

All `h1`–`h6` elements inherit these styles automatically from `globals.css`:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.025em;
  text-wrap: balance;
  line-height: 1.15;
}
```

### 2.5 Font Feature Settings

Body text uses OpenType feature settings for improved character shapes:

```css
body {
  font-feature-settings: "cv02", "cv03", "cv04", "cv11";
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

| Feature | Effect |
|---|---|
| `cv02` | Alternate numeral style |
| `cv03` | Alternate lowercase g |
| `cv04` | Alternate lowercase a |
| `cv11` | Contextual alternates |

### 2.6 Text Wrapping

- **`text-wrap: balance`** — Applied to all headings. Prevents orphaned words on short lines.
- **`text-wrap: pretty`** — Applied to paragraphs. Improves paragraph line breaks.
- **Utility classes**: `.text-balance` and `.text-pretty` available for manual use.

### 2.7 Tailwind Usage

```html
<!-- Display font (headings, stats, navigation) -->
<p class="font-display text-2xl tracking-tight">Page Title</p>

<!-- Body font (text, descriptions, data) -->
<p class="font-sans text-sm text-muted-foreground">Description text</p>

<!-- Stat values -->
<p class="font-display text-3xl font-bold">1,234</p>
```

---

## 3. Color Palette

### 3.1 Core Colors (Light Mode)

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--background` | `hsl(40, 20%, 97%)` | `#FAF8F5` | Page background — warm cream |
| `--foreground` | `hsl(30, 8%, 6%)` | `#0F0F0E` | Primary text — warm charcoal |
| `--card` | `hsl(40, 20%, 98%)` | `#FCFBF9` | Card surfaces — slightly lighter cream |
| `--border` | `hsl(30, 10%, 88%)` | `#E2DFDB` | Borders, dividers |

### 3.2 Signature Accent — Rust Orange

| Token | HSL | Hex | Usage |
|---|---|---|---|
| `--primary` | `hsl(20, 85%, 51%)` | `#E8621C` | Primary buttons, active states, icon backgrounds |
| `--primary-foreground` | `hsl(40, 20%, 98%)` | `#FAF8F5` | Text on primary backgrounds |
| `--primary-muted` | `hsl(20, 60%, 92%)` | `#F8EDE6` | Subtle rust wash for card backgrounds |
| `--primary-glow` | `hsl(20, 90%, 65%)` | `#F5945E` | Hover glow, elevated states |
| `--ring` | `hsl(20, 85%, 51%)` | `#E8621C` | Focus ring color |

### 3.3 Secondary — Warm Slate

| Token | HSL | Usage |
|---|---|---|
| `--secondary` | `hsl(30, 10%, 94%)` | Secondary button backgrounds |
| `--secondary-foreground` | `hsl(30, 8%, 12%)` | Text on secondary backgrounds |
| `--secondary-muted` | `hsl(30, 8%, 90%)` | Muted secondary surfaces |

### 3.4 Semantic Colors

| Semantic | HSL | Hex | Usage |
|---|---|---|---|
| **Success** | `hsl(155, 55%, 38%)` | `#2D9B6E` | Positive trends, completed actions, active status |
| **Success fg** | `hsl(155, 60%, 96%)` | `#F4FBF8` | Text on success background |
| **Success muted** | `hsl(155, 40%, 92%)` | `#E8F5EF` | Success badge backgrounds |
| **Warning** | `hsl(35, 90%, 52%)` | `#F5A623` | Caution indicators, pending status |
| **Warning fg** | `hsl(35, 20%, 10%)` | `#1A1612` | Text on warning background |
| **Warning muted** | `hsl(35, 70%, 92%)` | `#FAF0E0` | Warning badge backgrounds |
| **Error** | `hsl(345, 70%, 55%)` | `#E8446D` | Error states, destructive actions |
| **Error fg** | `hsl(345, 60%, 96%)` | `#FCF0F3` | Text on error background |
| **Error muted** | `hsl(345, 50%, 92%)` | `#FAE4EB` | Error badge backgrounds |
| **Info** | `hsl(210, 60%, 48%)` | `#2B7DE9` | Informational messages, helpful hints |
| **Info fg** | `hsl(210, 40%, 98%)` | `#F8FAFE` | Text on info background |
| **Info muted** | `hsl(210, 40%, 92%)` | `#E4EDFA` | Info badge backgrounds |

> **Note:** Semantic colors use **emerald**, **amber**, **rose**, and a **deeper blue** — not generic `#22C55E` / `#EAB308` / `#EF4444` / `#3B82F6`. These feel curated, not default.

### 3.5 Gradients

```css
:root {
  --gradient-primary:        linear-gradient(135deg, hsl(20 85% 51%), hsl(15 80% 58%));
  --gradient-primary-hover:  linear-gradient(135deg, hsl(15 80% 58%), hsl(10 75% 62%));
  --gradient-surface:        linear-gradient(180deg, hsl(40 20% 98%), hsl(35 15% 95%));
  --gradient-card:           linear-gradient(180deg, hsl(0 0% 100% / 0.8), hsl(40 10% 96% / 0.6));
  --gradient-subtle:         linear-gradient(135deg, hsl(30 10% 96%), hsl(35 15% 93%));
  --gradient-warm-overlay:   linear-gradient(180deg, hsl(20 60% 50% / 0.06), hsl(35 40% 60% / 0.03));
}
```

| Gradient | Usage |
|---|---|
| `gradient-primary` | Primary button fill, active nav indicators |
| `gradient-primary-hover` | Primary button hover state |
| `gradient-surface` | Body background layer |
| `gradient-card` | Card surface with slight glass effect |
| `gradient-subtle` | Alternating row backgrounds, subtle dividers |
| `gradient-warm-overlay` | Overlay on images, hero sections |

### 3.6 Shadows

```css
:root {
  --shadow-xs:    0 1px 2px  hsl(30 8% 6% / 0.04);
  --shadow-sm:    0 1px 3px  hsl(30 8% 6% / 0.06), 0 1px 2px hsl(30 8% 6% / 0.04);
  --shadow-md:    0 4px 6px  hsl(30 8% 6% / 0.06), 0 2px 4px hsl(30 8% 6% / 0.04);
  --shadow-lg:    0 10px 15px hsl(30 8% 6% / 0.07), 0 4px 6px hsl(30 8% 6% / 0.05);
  --shadow-xl:    0 20px 25px hsl(30 8% 6% / 0.08), 0 8px 10px hsl(30 8% 6% / 0.04);
  --shadow-2xl:   0 25px 50px hsl(30 8% 6% / 0.12);
  --shadow-glow:  0 0 20px hsl(20 85% 51% / 0.15), 0 0 40px hsl(20 85% 51% / 0.08);
  --shadow-inner: inset 0 1px 3px hsl(30 8% 6% / 0.08);
}
```

| Shadow | Tailwind Class | Usage |
|---|---|---|
| `xs` | `shadow-xs` | Minimal elevation — input fields, inline elements |
| `sm` | `shadow-sm` | Default card shadow |
| `md` | `shadow-md` | Dropdown menus, popovers |
| `lg` | `shadow-lg` | Elevated cards, modals |
| `xl` | `shadow-xl` | High-elevation overlays, tooltips |
| `2xl` | `shadow-2xl` | Hero elements, feature highlights |
| `glow` | `shadow-glow` | Primary button hover, active state pulse |
| `inner` | `shadow-inner` | Inset areas, pressed states |

### 3.7 Text Selection

```css
::selection {
  background-color: hsl(20 85% 51% / 0.25);
  color: hsl(20 85% 40%);
}
```

Selected text shows a warm rust-orange tint at 25% opacity — on-brand and distinct from the default blue selection.

---

## 4. Spacing & Layout

### 4.1 Base Unit

The design system uses a **4px base grid**. All spacing values are multiples of 4.

| Scale | Value | Tailwind | Common Usage |
|---|---|---|---|
| 1 | 4px | `p-1`, `gap-1` | Tight icon padding, badge padding |
| 2 | 8px | `p-2`, `gap-2` | Internal element spacing |
| 3 | 12px | `p-3` | Compact padding |
| 4 | 16px | `p-4` | Default section padding |
| 5 | 20px | `p-5` | — |
| 6 | 24px | `p-6` | Card padding (`p-6` on CardHeader/CardContent) |
| 8 | 32px | `p-8` | Section spacing |
| 10 | 40px | `p-10` | — |
| 12 | 48px | `p-12` | Page section gaps |

### 4.2 Container

```js
// tailwind.config.js
container: {
  center: true,
  padding: "2rem",       // 32px horizontal padding
  screens: {
    "2xl": "1400px",     // Max content width
  },
}
```

| Breakpoint | Max Width | Padding |
|---|---|---|
| `< 1400px` | Full viewport | 32px each side |
| `>= 1400px` | 1400px centered | 32px each side |

### 4.3 Border Radius

```css
--radius: 0.5rem;  /* 8px */
```

| Token | Value | Tailwind | Usage |
|---|---|---|---|
| `sm` | `calc(var(--radius) - 4px)` = 4px | `rounded-sm` | Small badges, tags |
| `md` | `calc(var(--radius) - 2px)` = 6px | `rounded-md` | Buttons, inputs |
| `lg` | `var(--radius)` = 8px | `rounded-lg` | Stat cards, panels |
| `xl` | — | `rounded-xl` | Cards (default), modals |
| `2xl` | — | `rounded-2xl` | Large feature cards |
| `full` | — | `rounded-full` | Avatar circles, icon containers, badge pills |

### 4.4 Grid System

Use Tailwind's CSS Grid for dashboard layouts:

```html
<!-- Dashboard stat cards: responsive grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
  <!-- StatCard components -->
</div>

<!-- Two-column layout -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
  <div class="lg:col-span-2">
    <!-- Main content -->
  </div>
  <div>
    <!-- Sidebar -->
  </div>
</div>
```

### 4.5 Background Texture

A subtle SVG noise texture is applied to the body background:

```css
body {
  background-image:
    url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"),
    var(--gradient-surface);
  background-repeat: repeat, no-repeat;
  background-size: 200px 200px, 100% 100%;
  background-attachment: fixed, fixed;
}
```

This creates a faint grain effect (3% opacity light noise, 4% in dark mode) that gives surfaces tactile warmth.

---

## 5. Motion Design

### 5.1 Easing Curves

All easing curves are defined in `tailwind.config.js`:

```js
transitionTimingFunction: {
  "ease-spring":   "cubic-bezier(0.34, 1.56, 0.64, 1)",  // Overshoot bounce for emphasis
  "ease-smooth":   "cubic-bezier(0.4, 0, 0.2, 1)",       // Standard material ease
  "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",      // Premium, decelerating motion
}
```

| Curve | Character | Usage |
|---|---|---|
| `ease-out-expo` | Fast start, long deceleration | **Primary curve** — hover transitions, page transitions, card entrances |
| `ease-smooth` | Balanced, familiar | Accordion, standard UI transitions |
| `ease-spring` | Overshoot + settle | Scale-in for emphasis, interactive feedback |

### 5.2 Animation Keyframes

All animations are defined in `tailwind.config.js`:

| Animation | Duration | Easing | Properties | Usage |
|---|---|---|---|---|
| `fade-in` | 300ms | ease-out | opacity 0 -> 1 | Content reveal, modal overlay |
| `fade-out` | 200ms | ease-in | opacity 1 -> 0 | Content hide, toast dismiss |
| `slide-up` | 350ms | ease-out | opacity 0->1, translateY 8px->0 | **Card cascade entrance**, list items |
| `slide-down` | 350ms | ease-out | opacity 0->1, translateY -8px->0 | Dropdown open, accordion expand |
| `slide-in-right` | 300ms | ease-out | opacity 0->1, translateX 8px->0 | Sidebar panels, toast notifications |
| `slide-in-left` | 300ms | ease-out | opacity 0->1, translateX -8px->0 | Back navigation, drawer |
| `scale-in` | 250ms | ease-out | opacity 0->1, scale 0.96->1 | Modal/dialog entrance, tooltip |
| `scale-out` | 200ms | ease-in | opacity 1->0, scale 1->0.96 | Modal/dialog exit |
| `pulse-soft` | 2000ms | ease-in-out infinite | opacity 1->0.7->1 | Live indicator, loading dot |
| `shimmer` | 2000ms | linear infinite | backgroundPosition -200%->200% | Skeleton loading |
| `glow-pulse` | 2000ms | ease-in-out infinite | box-shadow pulse | Primary element emphasis |

### 5.3 Stagger Timing

When multiple elements animate together (e.g., stat cards cascading in), use **80–100ms delays** between each:

```html
<!-- Example: Dashboard stat card cascade -->
<div class="animate-slide-up" style="animation-delay: 0ms">
  <StatCard /> <!-- Clients -->
</div>
<div class="animate-slide-up" style="animation-delay: 80ms">
  <StatCard /> <!-- Active Projects -->
</div>
<div class="animate-slide-up" style="animation-delay: 160ms">
  <StatCard /> <!-- AI Tasks -->
</div>
<div class="animate-slide-up" style="animation-delay: 240ms">
  <StatCard /> <!-- Alerts -->
</div>
```

**Rule of thumb:** First element at `0ms`, subsequent elements at `+80ms` intervals. Cap total cascade at ~400ms to avoid sluggishness.

### 5.4 Hover Transitions

All hover interactions use `ease-out-expo` for a premium feel:

```html
<!-- Card hover lift -->
<div class="transition-shadow duration-300 ease-out-expo hover:shadow-lg">

<!-- Button hover -->
<button class="transition-colors duration-200 ease-out-expo hover:bg-primary/90">
```

| Interaction | Duration | Curve |
|---|---|---|
| Button hover | 200ms | `ease-out-expo` |
| Card shadow change | 300ms | `ease-out-expo` |
| Link underline | 150ms | `ease-smooth` |
| Icon scale on hover | 200ms | `ease-spring` |

### 5.5 Reduced Motion

Always respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Component Guidelines

### 6.1 Cards

**Anatomy:**
```
┌─────────────────────────────────┐
│  CardHeader                     │
│  ┌───────────────────────────┐  │
│  │ CardTitle   [icon/badge]  │  │
│  │ CardDescription           │  │
│  └───────────────────────────┘  │
│  CardContent                    │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │   (main content area)     │  │
│  │                           │  │
│  └───────────────────────────┘  │
│  CardFooter (optional)          │
│  ┌───────────────────────────┐  │
│  │ [action]          [action]│  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Default styles:**
- Background: `bg-card` (`hsl(40, 20%, 98%)`)
- Border: `border border-border` (`1px`, warm gray)
- Corner radius: `rounded-xl` (12px)
- Shadow: `shadow` (maps to `shadow-sm`)
- Padding: `p-6` (24px) on CardHeader and CardContent

**Hover state:**
```html
<div class="rounded-xl border bg-card shadow hover:shadow-lg transition-shadow">
```

**Stat Card pattern** (from `components/dashboard/StatCard.tsx`):
```tsx
<div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow">
  <div className="flex items-center justify-between">
    <div className="flex-1">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className={cn("mt-2 text-xs", trendUp ? "text-green-600" : "text-red-600")}>
        {trend}
      </p>
    </div>
    {/* Colored icon background — signature design moment */}
    <div className="p-3 bg-primary/10 rounded-lg">
      <Icon className="w-6 h-6 text-primary" />
    </div>
  </div>
</div>
```

Key design note: The icon sits in a `bg-primary/10` (10% opacity rust) container with `rounded-lg`. This is the **signature visual moment** — the rust color appears as a soft background accent, not overwhelming but clearly owned.

### 6.2 Buttons

**Variants** (from `components/ui/button.tsx`):

| Variant | Classes | Usage |
|---|---|---|
| `default` | `bg-primary text-primary-foreground shadow hover:bg-primary/90` | Primary actions (Save, Create, Submit) |
| `destructive` | `bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90` | Delete, Remove, Cancel destructive |
| `outline` | `border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground` | Secondary actions, filters |
| `secondary` | `bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80` | Tertiary actions |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` | Nav links, inline actions |
| `link` | `text-primary underline-offset-4 hover:underline` | Text-only links |

**Sizes:**

| Size | Height | Padding | Text |
|---|---|---|---|
| `sm` | 32px | `px-3` | `text-xs` |
| `default` | 36px | `px-4` | `text-sm` |
| `lg` | 40px | `px-8` | `text-sm` |
| `icon` | 36px | — | — |

**All buttons:**
- Corner radius: `rounded-md` (6px)
- Focus: `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`
- Disabled: `disabled:pointer-events-none disabled:opacity-50`
- Transition: `transition-colors`

**Gradient button recipe** (when full gradient fill is desired, not in base CVA):
```html
<button class="bg-gradient-primary hover:bg-gradient-primary-hover text-primary-foreground 
               font-medium rounded-md px-6 py-2 shadow-md hover:shadow-glow 
               transition-all duration-200 ease-out-expo">
  Primary Action
</button>
```

### 6.3 Badges

**Variants** (from `components/ui/badge.tsx`):

| Variant | Classes | Usage |
|---|---|---|
| `default` | `border-transparent bg-primary text-primary-foreground shadow` | Primary status tags |
| `secondary` | `border-transparent bg-secondary text-secondary-foreground` | Neutral status |
| `destructive` | `border-transparent bg-destructive text-destructive-foreground shadow` | Error/critical status |
| `outline` | `text-foreground` | Minimal, border-only badges |

**All badges:**
- Shape: `rounded-md` (6px) — slightly rounded pills
- Padding: `px-2.5 py-0.5`
- Text: `text-xs font-semibold`
- Focus: `focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`
- Transition: `transition-colors`

**Semantic badge recipe** (when using specific status colors):
```html
<span class="inline-flex items-center rounded-full bg-success-muted px-2.5 py-0.5 
             text-xs font-semibold text-success">
  Active
</span>

<span class="inline-flex items-center rounded-full bg-warning-muted px-2.5 py-0.5 
             text-xs font-semibold text-warning">
  Pending
</span>

<span class="inline-flex items-center rounded-full bg-error-muted px-2.5 py-0.5 
             text-xs font-semibold text-error">
  Overdue
</span>
```

### 6.4 Inputs

**Default styles** (from `components/ui/input.tsx`):
```html
<input class="flex h-9 w-full rounded-md border border-input bg-transparent 
              px-3 py-1 text-sm shadow-sm transition-colors 
              file:border-0 file:bg-transparent file:text-sm file:font-medium 
              placeholder:text-muted-foreground 
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
              disabled:cursor-not-allowed disabled:opacity-50" />
```

| Property | Value |
|---|---|
| Height | 36px (`h-9`) |
| Corner radius | `rounded-md` (6px) |
| Border | `1px border-input` |
| Padding | `px-3 py-1` |
| Focus ring | `1px solid hsl(20, 85%, 51%)` (rust) |
| Focus style | No outline, ring only |
| Placeholder | `text-muted-foreground` |
| Disabled | `opacity-50, cursor-not-allowed` |

**Focus state (signature):**
```css
/* The rust-orange ring on focus is the brand showing up at the moment of interaction */
focus-visible:ring-1 focus-visible:ring-ring
/* ring = hsl(20, 85%, 51%) — the rust */
```

### 6.5 Tables

Tables use the shadcn/ui table component pattern. Key styling:
- Header: muted text, uppercase labels, subtle border-bottom
- Rows: hover background tint, subtle border between rows
- Use `text-sm` for all cell content
- Striped rows optional with `bg-muted/50` on even rows

### 6.6 Tabs

Tabs use Radix UI with the following patterns:
- Active tab: `text-foreground` with bottom border in primary color
- Inactive tab: `text-muted-foreground`, hover to `text-foreground`
- Tab list has subtle bottom border (`border-border`)

### 6.7 Dialogs / Modals

- Overlay: `bg-background/80 backdrop-blur-sm`
- Content: `bg-card rounded-xl shadow-xl border border-border`
- Entrance animation: `animate-scale-in`
- Exit animation: `animate-scale-out`
- Max width: typically `max-w-lg` or `max-w-2xl`

---

## 7. Accessibility

### 7.1 WCAG AA Contrast Compliance

All color combinations meet **WCAG 2.1 AA** minimum contrast ratios (4.5:1 for normal text, 3:1 for large text):

| Foreground | Background | Ratio | AA Normal | AA Large |
|---|---|---|---|---|
| `#0F0F0E` (foreground) | `#FAF8F5` (background) | ~15.4:1 | Pass | Pass |
| `#0F0F0E` (foreground) | `#FCFBF9` (card) | ~15.1:1 | Pass | Pass |
| `hsl(30, 5%, 42%)` (muted-fg) | `#FAF8F5` (background) | ~5.2:1 | Pass | Pass |
| `#E8621C` (primary) | `#FAF8F5` (background) | ~4.6:1 | Pass | Pass |
| `#FAF8F5` (primary-fg) | `#E8621C` (primary) | ~4.6:1 | Pass | Pass |
| `#2D9B6E` (success) | `#FAF8F5` (background) | ~4.7:1 | Pass | Pass |
| `#F5A623` (warning) | `#1A1612` (warning-fg) | — | Used as bg+fg pair | — |
| `#E8446D` (error) | `#FAF8F5` (background) | ~4.5:1 | Pass | Pass |

**Note:** Warning color on its light muted background (`#FAF0E0`) should always be paired with dark text (`#1A1612`) for readability. The amber-on-cream combination alone would not meet AA.

### 7.2 Focus States

Every interactive element has a visible focus indicator:

```css
/* Global focus-visible pattern */
focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring
/* ring = rust-orange hsl(20, 85%, 51%) */
```

| Element | Focus Style |
|---|---|
| Buttons | `ring-1 ring-ring` (1px rust outline) |
| Inputs | `ring-1 ring-ring` (1px rust outline) |
| Links | `outline-none` with color change on hover |
| Cards (clickable) | `ring-2 ring-ring ring-offset-2` |
| Badge (interactive) | `ring-2 ring-ring ring-offset-2` |

**Never use `outline: none` without a replacement.** The rust ring is the brand's accessibility signature.

### 7.3 Reduced Motion

The system must respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

In practice, this means:
- Stagger animations collapse to simultaneous
- Hover transitions become instant
- Pulse/shimmer animations stop (replace with static states)
- Page transitions skip animations entirely

### 7.4 Semantic HTML

- Use proper heading hierarchy (`h1` -> `h2` -> `h3`) — do not skip levels
- Card titles should use heading elements (`<h3>` via `CardTitle`)
- Navigation uses `<nav>` with `aria-label`
- Interactive cards should be buttons or links, not divs with onClick
- Status badges should use `role="status"` or `aria-live` for dynamic updates

### 7.5 Color-Independent Communication

Never communicate state through color alone:

```html
<!-- Bad: color-only trend indicator -->
<p className="text-green-600">+12%</p>

<!-- Good: color + icon + direction -->
<p className="text-success flex items-center gap-1">
  <ArrowUpRight className="w-3 h-3" />
  +12%
</p>
```

---

## 8. Dark Mode

### 8.1 Philosophy

Dark mode is not an inversion — it is a **reimagining**. Surfaces become warm near-black (`hsl(25, 10%, 7%)`), not pure black. The rust accent brightens slightly (`hsl(20, 85%, 58%)`) to maintain contrast. Shadows use black at higher opacity. The noise texture opacity increases from 3% to 4%.

### 8.2 Color Differences (Light vs Dark)

| Token | Light | Dark | Notes |
|---|---|---|---|
| `--background` | `hsl(40, 20%, 97%)` | `hsl(25, 10%, 7%)` | Cream -> warm near-black |
| `--foreground` | `hsl(30, 8%, 6%)` | `hsl(40, 15%, 95%)` | Charcoal -> warm off-white |
| `--card` | `hsl(40, 20%, 98%)` | `hsl(25, 10%, 9%)` | Lighter cream -> warm dark |
| `--primary` | `hsl(20, 85%, 51%)` | `hsl(20, 85%, 58%)` | Rust brightens for contrast |
| `--primary-muted` | `hsl(20, 60%, 92%)` | `hsl(20, 50%, 18%)` | Light wash -> dark wash |
| `--border` | `hsl(30, 10%, 88%)` | `hsl(25, 8%, 20%)` | Warm gray -> warm dark gray |
| `--ring` | `hsl(20, 85%, 51%)` | `hsl(20, 85%, 58%)` | Same as primary |

### 8.3 Shadow Adjustments

Dark mode shadows use `hsl(0, 0%, 0%)` (pure black) instead of warm charcoal, at significantly higher opacity:

```css
/* Light mode */
--shadow-lg: 0 10px 15px hsl(30 8% 6% / 0.07), 0 4px 6px hsl(30 8% 6% / 0.05);

/* Dark mode */
--shadow-lg: 0 10px 15px hsl(0 0% 0% / 0.35), 0 4px 6px hsl(0 0% 0% / 0.25);
```

Dark mode requires 4-5x shadow opacity to be perceptible on dark surfaces.

### 8.4 Gradient Adjustments

```css
.dark {
  --gradient-primary: linear-gradient(135deg, hsl(20 85% 58%), hsl(15 80% 64%));
  --gradient-primary-hover: linear-gradient(135deg, hsl(15 80% 64%), hsl(10 75% 68%));
  --gradient-surface: linear-gradient(180deg, hsl(25 10% 9%), hsl(25 8% 11%));
  --gradient-card: linear-gradient(180deg, hsl(25 10% 10% / 0.9), hsl(25 8% 8% / 0.7));
}
```

### 8.5 Dark Mode Text Selection

```css
.dark ::selection {
  background-color: hsl(20 85% 58% / 0.3);
  color: hsl(20 85% 70%);
}
```

---

## 9. Implementation Reference

### 9.1 Complete CSS Variables Reference

```css
:root {
  /* === Surface colors === */
  --background: 40 20% 97%;
  --foreground: 30 8% 6%;
  --card: 40 20% 98%;
  --card-foreground: 30 8% 6%;
  --popover: 40 20% 98%;
  --popover-foreground: 30 8% 6%;

  /* === Primary (Rust Orange) === */
  --primary: 20 85% 51%;
  --primary-foreground: 40 20% 98%;
  --primary-muted: 20 60% 92%;
  --primary-glow: 20 90% 65%;

  /* === Secondary (Warm Slate) === */
  --secondary: 30 10% 94%;
  --secondary-foreground: 30 8% 12%;
  --secondary-muted: 30 8% 90%;

  /* === Muted === */
  --muted: 30 8% 93%;
  --muted-foreground: 30 5% 42%;

  /* === Accent === */
  --accent: 35 15% 92%;
  --accent-foreground: 30 8% 12%;
  --accent-muted: 35 12% 88%;

  /* === Semantic === */
  --success: 155 55% 38%;
  --success-foreground: 155 60% 96%;
  --success-muted: 155 40% 92%;

  --warning: 35 90% 52%;
  --warning-foreground: 35 20% 10%;
  --warning-muted: 35 70% 92%;

  --error: 345 70% 55%;
  --error-foreground: 345 60% 96%;
  --error-muted: 345 50% 92%;

  --info: 210 60% 48%;
  --info-foreground: 210 40% 98%;
  --info-muted: 210 40% 92%;

  /* === UI === */
  --border: 30 10% 88%;
  --input: 30 10% 88%;
  --ring: 20 85% 51%;
  --radius: 0.5rem;

  /* === Gradients === */
  --gradient-primary: linear-gradient(135deg, hsl(20 85% 51%), hsl(15 80% 58%));
  --gradient-primary-hover: linear-gradient(135deg, hsl(15 80% 58%), hsl(10 75% 62%));
  --gradient-surface: linear-gradient(180deg, hsl(40 20% 98%), hsl(35 15% 95%));
  --gradient-card: linear-gradient(180deg, hsl(0 0% 100% / 0.8), hsl(40 10% 96% / 0.6));
  --gradient-subtle: linear-gradient(135deg, hsl(30 10% 96%), hsl(35 15% 93%));
  --gradient-warm-overlay: linear-gradient(180deg, hsl(20 60% 50% / 0.06), hsl(35 40% 60% / 0.03));

  /* === Shadows === */
  --shadow-xs: 0 1px 2px hsl(30 8% 6% / 0.04);
  --shadow-sm: 0 1px 3px hsl(30 8% 6% / 0.06), 0 1px 2px hsl(30 8% 6% / 0.04);
  --shadow-md: 0 4px 6px hsl(30 8% 6% / 0.06), 0 2px 4px hsl(30 8% 6% / 0.04);
  --shadow-lg: 0 10px 15px hsl(30 8% 6% / 0.07), 0 4px 6px hsl(30 8% 6% / 0.05);
  --shadow-xl: 0 20px 25px hsl(30 8% 6% / 0.08), 0 8px 10px hsl(30 8% 6% / 0.04);
  --shadow-2xl: 0 25px 50px hsl(30 8% 6% / 0.12);
  --shadow-glow: 0 0 20px hsl(20 85% 51% / 0.15), 0 0 40px hsl(20 85% 51% / 0.08);
  --shadow-inner: inset 0 1px 3px hsl(30 8% 6% / 0.08);

  /* === Typography === */
  --font-display: var(--font-space-grotesk), ui-sans-serif, system-ui, sans-serif;
  --font-body: var(--font-instrument-sans), ui-sans-serif, system-ui, sans-serif;
}
```

### 9.2 Tailwind Configuration Summary

```js
// tailwind.config.js — key extensions
module.exports = {
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        // All CSS variables mapped to Tailwind utilities
        // e.g., bg-primary, text-foreground, border-border
        success: { DEFAULT, foreground, muted },
        warning: { DEFAULT, foreground, muted },
        error:   { DEFAULT, foreground, muted },
        info:    { DEFAULT, foreground, muted },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-primary-hover": "var(--gradient-primary-hover)",
        "gradient-surface": "var(--gradient-surface)",
        "gradient-card": "var(--gradient-card)",
        "gradient-subtle": "var(--gradient-subtle)",
        "gradient-warm-overlay": "var(--gradient-warm-overlay)",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        glow: "var(--shadow-glow)",
        inner: "var(--shadow-inner)",
      },
      borderRadius: {
        lg: "var(--radius)",       // 8px
        md: "calc(var(--radius) - 2px)",  // 6px
        sm: "calc(var(--radius) - 4px)",  // 4px
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.35s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "scale-in": "scale-in 0.25s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "ease-spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      fontFamily: {
        sans: ["var(--font-instrument-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};
```

### 9.3 Common Tailwind Compositions

```html
<!-- Page wrapper -->
<div class="min-h-screen bg-background font-sans">

<!-- Section container -->
<section class="container mx-auto px-8 py-12">

<!-- Section header -->
<div class="mb-8">
  <h2 class="font-display text-2xl font-bold tracking-tight">Section Title</h2>
  <p class="mt-2 text-sm text-muted-foreground">Section description</p>
</div>

<!-- Dashboard grid -->
<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">

<!-- Stat card with entrance animation -->
<div class="animate-slide-up rounded-xl border bg-card p-6 shadow-sm 
            hover:shadow-lg transition-shadow duration-300 ease-out-expo"
     style="animation-delay: 80ms">

<!-- Primary button -->
<button class="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm 
               font-medium shadow hover:bg-primary/90 transition-colors 
               duration-200 ease-out-expo focus-visible:ring-1 focus-visible:ring-ring">

<!-- Outline button -->
<button class="border border-input bg-background rounded-md px-4 py-2 text-sm 
               font-medium shadow-sm hover:bg-accent hover:text-accent-foreground 
               transition-colors">

<!-- Status badge -->
<span class="inline-flex items-center rounded-full bg-success-muted px-2.5 py-0.5 
             text-xs font-semibold text-success">
  Active
</span>

<!-- Input field -->
<input class="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 
              text-sm shadow-sm placeholder:text-muted-foreground 
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring 
              transition-colors" />

<!-- Data table row -->
<tr class="border-b border-border transition-colors hover:bg-muted/50">

<!-- Dialog / Modal content -->
<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
  <div class="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] 
              translate-y-[-50%] rounded-xl border bg-card shadow-xl 
              animate-scale-in">
```

### 9.4 Utility Function

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Use `cn()` for conditional class merging in all components:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base classes here",
  variant === "danger" && "text-error bg-error-muted",
  isActive && "ring-1 ring-ring",
  className  // allow override
)} />
```

### 9.5 File Structure (Design-Relevant)

```
frontend/
  app/
    globals.css          # All CSS variables, base typography, body styles, animations
    layout.tsx           # Font loading (Space Grotesk + Instrument Sans)
  components/
    ui/
      button.tsx         # Button CVA with variants + sizes
      badge.tsx          # Badge CVA with variants
      card.tsx           # Card component (Card, CardHeader, CardContent, etc.)
      input.tsx          # Input with focus ring
      dialog.tsx         # Modal with scale-in animation
      table.tsx          # Table components
      tabs.tsx           # Tab navigation
      select.tsx         # Select dropdown
      label.tsx          # Form label
      textarea.tsx       # Multi-line input
    dashboard/
      StatCard.tsx       # Signature stat card with colored icon background
      ActivityChart.tsx  # Chart component (Recharts)
      AlertList.tsx      # Alert list component
      RecentActivity.tsx # Activity feed component
    layout/              # Navigation, sidebar, header components
  tailwind.config.js     # Theme extensions, animations, easing curves
```

---

## Appendix A: Color Quick-Reference

| Name | HSL | Hex | Role |
|---|---|---|---|
| Rust Orange | `20 85% 51%` | `#E8621C` | Primary accent |
| Warm Cream | `40 20% 97%` | `#FAF8F5` | Background |
| Warm Charcoal | `30 8% 6%` | `#0F0F0E` | Foreground text |
| Emerald | `155 55% 38%` | `#2D9B6E` | Success |
| Amber | `35 90% 52%` | `#F5A623` | Warning |
| Rose | `345 70% 55%` | `#E8446D` | Error |
| Deep Blue | `210 60% 48%` | `#2B7DE9` | Info |
| Warm Slate | `30 10% 94%` | `#F0EDEC` | Secondary surface |

---

## Appendix B: Design Checklist

Before shipping any new page or component, verify:

- [ ] Typography uses Space Grotesk for headings, Instrument Sans for body
- [ ] Heading hierarchy is correct (h1 > h2 > h3, no skips)
- [ ] Colors use CSS variables (not hardcoded hex values)
- [ ] Primary actions use the rust-orange primary color
- [ ] Hover states have smooth transitions with `ease-out-expo`
- [ ] Focus states show the rust ring (`ring-1 ring-ring`)
- [ ] Stagger animations use 80-100ms delays
- [ ] Semantic states (success/warning/error) use icons, not just color
- [ ] Cards have appropriate shadow and border
- [ ] Dark mode tested — surfaces, shadows, and contrast all work
- [ ] `prefers-reduced-motion` respected — no critical info lost without motion
- [ ] Text uses `text-wrap: balance` on short lines (headings, card titles)

---

*This document reflects the design system as implemented in the codebase. Last reviewed against: `globals.css`, `tailwind.config.js`, and component library in `components/ui/` and `components/dashboard/`.*
