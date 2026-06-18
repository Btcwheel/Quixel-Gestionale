
# Design System — Quixel
> Project Management Dashboard | May 2026

---

## 1. Visual Theme & Atmosphere

**Mood**: Modern efficiency. Clean productivity. Intelligent simplicity.

**Philosophy**: Panze communicates clarity through organized information architecture, subtle color coding, and functional elegance. The design prioritizes readability and quick scanning while maintaining visual appeal through thoughtful use of color accents and data visualization.

**Aesthetic school**: Modern SaaS — clean interfaces meet functional beauty. Think Linear meets Notion. The brand balances professional utility with approachable design through rounded corners, soft shadows, and a carefully curated color palette.

**Key atmosphere words**: Organized. Efficient. Clear. Modern. Functional. Approachable.

---

## 2. Colour Palette & Roles

### Base Colors

| Role | Name | Hex | Usage |
|------|------|-----|-------|
| **Background** | Cool White | `#f8f9fa` | Primary page background |
| **Surface** | Pure White | `#ffffff` | Cards, widgets, panels |
| **Surface Hover** | Light Gray | `#f1f3f5` | Card hover states, interactive surfaces |
| **Text Primary** | Dark Charcoal | `#212529` | Headings, primary text |
| **Text Secondary** | Medium Gray | `#495057` | Body copy, labels |
| **Text Muted** | Gray | `#868e96` | Metadata, secondary info |
| **Text Light** | Light Gray | `#adb5bd` | Placeholders, inactive states |
| **Border** | Light Border | `#e9ecef` | Card borders, dividers |
| **Border Strong** | Medium Border | `#dee2e6` | Input borders, active dividers |

### Status & Accent Colors

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| **Orange** | Progress | `#fd7e14` | In Progress status, active indicators |
| **Blue** | Completed | `#339af0` | Completed tasks, primary actions |
| **Purple** | Overdue | `#9775fa` | Overdue invoices, urgent items |
| **Red** | Not Paid | `#fa5252` | Payment required, critical alerts |
| **Cyan** | Partial | `#22b8cf` | Partially paid, in-progress states |
| **Green** | Success | `#51cf66` | Fully paid, completed, success states |
| **Yellow** | Draft | `#ffd43b` | Draft status, warnings |
| **Pink** | Mobile App | `#f783ac` | Mobile project indicator |
| **Indigo** | Web Design | `#5c7cfa` | Web project indicator |

---

## 3. Typography

### Font Families

| Family | Role | Notes |
|--------|------|-------|
| **Inter** | All UI text | Modern, readable, professional. Primary typeface |
| **Inter SemiBold** | Headings, buttons, emphasis | Weight 600 |
| **Inter Regular** | Body, labels, captions | Weight 400 |
| **Inter Medium** | Secondary emphasis | Weight 500 |

### Type Scale

| Element | Size | Weight | Line Height | Color |
|---------|------|--------|-------------|-------|
| Page Title | `28px` | 600 | 1.3 | `#212529` |
| Card Title | `16px` | 600 | 1.4 | `#212529` |
| H2 | `20px` | 600 | 1.35 | `#212529` |
| H3 | `18px` | 600 | 1.35 | `#212529` |
| Body | `14px` | 400 | 1.5 | `#495057` |
| Small | `13px` | 400 | 1.4 | `#868e96` |
| Caption | `12px` | 400 | 1.4 | `#868e96` |
| Button | `14px` | 500 | 1.4 | `#ffffff` (on dark) |
| Tab Label | `14px` | 500 | 1.4 | `#495057` |

---

## 4. Component Styles

### Navigation / Sidebar

- **Width**: `280px` desktop, collapsible on tablet
- **Background**: `#ffffff`
- **Border**: Right border `1px solid #e9ecef`
- **Logo**: "panze" wordmark, Inter SemiBold, `24px`, `#212529`
- **Nav Items**: 
  - Icon + label layout
  - `14px` Inter Regular
  - Inactive: `#495057`
  - Active: `#212529` with background `#f1f3f5`
  - Padding: `12px 20px`
  - Border radius: `8px`
- **Icons**: `20px`, stroke width `1.5px`

### Top Navigation / Header

- **Height**: `64px`
- **Background**: `#f8f9fa` (transparent over content)
- **Time Tabs**: 
  - Pill shape: `border-radius: 20px`
  - Inactive: background `#ffffff`, text `#495057`
  - Active: background `#212529`, text `#ffffff`
  - Padding: `8px 20px`
  - Spacing: `8px` between tabs
- **Search Bar**:
  - Background: `#ffffff`
  - Border: `1px solid #e9ecef`
  - Border radius: `12px`
  - Padding: `10px 16px`
  - Placeholder: `#adb5bd`
  - Icon: `#868e96`
- **User Profile**:
  - Avatar: `36px` circle
  - Name: `14px` Inter Medium
  - Role: `12px` Inter Regular, `#868e96`

### Cards

- **Background**: `#ffffff`
- **Border Radius**: `16px`
- **Shadow**: `0 2px 12px rgba(0, 0, 0, 0.04)`
- **Border**: `1px solid #e9ecef` (subtle)
- **Padding**: `24px`
- **Hover**: Shadow increases to `0 4px 20px rgba(0, 0, 0, 0.08)`

### Buttons

#### Primary
```css
background: #212529;
color: #ffffff;
border-radius: 8px;
padding: 10px 20px;
font: Inter Medium, 14px;
border: none;
transition: background 200ms ease;
```
- **Hover**: Background `#000000`

#### Secondary/Ghost
```css
background: #ffffff;
border: 1px solid #e9ecef;
color: #495057;
border-radius: 8px;
padding: 10px 20px;
font: Inter Medium, 14px;
```

#### Icon Button
- Size: `36px` square
- Border radius: `8px`
- Background: transparent or `#f1f3f5` on hover
- Icon: `20px`

### Progress Bars

```css
height: 8px;
background: #e9ecef;
border-radius: 4px;
fill: status-color; /* dynamic */
transition: width 300ms ease;
```

### Charts

#### Line Chart
- Stroke width: `2px`
- Fill: Gradient with opacity `0.1`
- Grid lines: `#e9ecef`
- Axis labels: `12px` Inter Regular, `#868e96`
- Tooltip: Background `#212529`, text `#ffffff`, radius `8px`

#### Donut Chart
- Stroke width: `12px`
- Gap between segments: `2px`
- Center: White circle with stats
- Colors: Status palette

### Task Cards

```css
background: #ffffff;
border-left: 3px solid status-color;
padding: 16px;
border-radius: 12px;
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
```

- **Status Indicator**: Colored dot `8px`
- **Title**: `14px` Inter SemiBold
- **Description**: `13px` Inter Regular, `#868e96`

### Meeting Cards

- **Time**: `14px` Inter SemiBold, `#212529`
- **Platform Badge**: 
  - Background: `#f1f3f5`
  - Padding: `4px 12px`
  - Border radius: `6px`
  - Icon + label
- **Arrow**: `#adb5bd`, right chevron

### Invoice Overview Bars

```css
/* Container */
width: 100%;
display: flex;
align-items: center;
gap: 12px;

/* Label */
font: 14px Inter Medium;
color: #212529;

/* Progress Bar */
height: 12px;
background: #e9ecef;
border-radius: 6px;
overflow: hidden;

/* Fill */
background: status-color; /* dynamic */

/* Amount & Count */
font: 14px Inter SemiBold/Regular;
color: #212529 / #868e96;
```

### Ticket Cards

- **Avatar**: `40px` circle
- **Name**: `14px` Inter SemiBold
- **Message**: `13px` Inter Regular, `#868e96`, 2 lines max
- **Check Button**: 
  - Text: `13px` Inter Medium
  - Color: `#339af0`
  - Arrow icon

### Input Fields

```css
background: #ffffff;
border: 1px solid #e9ecef;
border-radius: 8px;
padding: 12px 16px;
font: Inter Regular, 14px;
color: #212529;
placeholder: #adb5bd;
```

- **Focus**: Border `#339af0`, no shadow
- **Label**: `13px` Inter Medium, `#495057`, margin bottom `6px`

---

## 5. Layout Principles

### Core Tokens

| Token | Value |
|-------|-------|
| **Max Content Width** | `1440px` |
| **Sidebar Width** | `280px` |
| **Main Content Padding** | `32px` |
| **Grid Gap** | `24px` |
| **Card Spacing** | `24px` |
| **Section Padding** | `24px 32px` |

### Grid System

**Dashboard Grid**: 3-column layout on desktop
```
┌─────────────────────────────────────┐
│ SIDEBAR │                           │
│ 280px   │  MAIN CONTENT (flex)     │
│         │ ┌─────┬───────┬─────┐    │
│         │ │TASKS│OVERVIEW│MTGS │    │
│         │ │narr │ wide  │med  │    │
│         │ └─────┴───────┴─────┘    │
└─────────┴──────────────────────────┘
```

**Responsive Breakpoints**:
| Breakpoint | Width | Layout |
|------------|-------|--------|
| Desktop | `> 1200px` | 3 columns, fixed sidebar |
| Tablet | `768px - 1200px` | 2 columns, collapsible sidebar |
| Mobile | `< 768px` | 1 column, sidebar as drawer |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight spacing, icon gaps |
| `--space-sm` | `8px` | Small gaps, inline elements |
| `--space-md` | `16px` | Standard spacing, card padding |
| `--space-lg` | `24px` | Section spacing, grid gaps |
| `--space-xl` | `32px` | Large sections, page padding |
| `--space-2xl` | `48px` | Major divisions, hero sections |

---

## 6. Design System Notes for Generation

```css
/* 
  DESIGN SYSTEM: Quixel Project Management Dashboard
  AESTHETIC: Modern SaaS — clean, functional, data-driven
*/

/* FONTS */
:root {
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
}

/* PALETTE */
:root {
  /* Base */
  --bg: #f8f9fa;
  --surface: #ffffff;
  --surface-hover: #f1f3f5;
  
  /* Text */
  --text-primary: #212529;
  --text-secondary: #495057;
  --text-muted: #868e96;
  --text-light: #adb5bd;
  
  /* Borders */
  --border: #e9ecef;
  --border-strong: #dee2e6;
  
  /* Status Colors */
  --status-orange: #fd7e14;  /* in progress */
  --status-blue: #339af0;    /* completed */
  --status-purple: #9775fa;  /* overdue */
  --status-red: #fa5252;     /* not paid */
  --status-cyan: #22b8cf;    /* partial */
  --status-green: #51cf66;   /* success */
  --status-yellow: #ffd43b;  /* draft */
  --status-pink: #f783ac;    /* mobile app */
  --status-indigo: #5c7cfa;  /* web design */
}

/* COMPONENT RULES */
:root {
  /* Cards */
  --card-radius: 16px;
  --card-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  --card-shadow-hover: 0 4px 20px rgba(0, 0, 0, 0.08);
  --card-padding: 24px;
  
  /* Buttons */
  --btn-radius: 8px;
  --btn-padding-y: 10px;
  --btn-padding-x: 20px;
  --btn-font-size: 14px;
  
  /* Inputs */
  --input-radius: 8px;
  --input-padding: 12px 16px;
  --input-border: 1px solid var(--border);
  
  /* Progress */
  --progress-height: 8px;
  --progress-radius: 4px;
  
  /* Shadows */
  --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 12px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 4px 20px rgba(0, 0, 0, 0.08);
  
  /* Transitions */
  --transition-fast: 200ms ease;
  --transition-normal: 300ms ease;
}

/* LAYOUT */
:root {
  --max-width: 1440px;
  --sidebar-width: 280px;
  --header-height: 64px;
  --grid-gap: 24px;
  --section-padding: 32px;
}

/* UTILITIES */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-sm { gap: 8px; }
.gap-md { gap: 16px; }
.gap-lg { gap: 24px; }
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
```

### Atmosphere Guidelines
```
Professional productivity tool — efficient, organized, 
approachable. Every element serves a function. Color is used 
strategically for status indication, not decoration.

Visual hierarchy is achieved through:
1. Size (headings > body > captions)
2. Weight (SemiBold > Medium > Regular)
3. Color contrast (primary > secondary > muted)
4. Spacing (generous whitespace between sections)

Interactions should feel:
- Responsive (200-300ms transitions)
- Subtle (opacity/shadow changes, no bounces)
- Predictable (consistent hover/focus states)
```

---

## 7. Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Use status colors consistently (orange=in progress, blue=completed, etc.) | Use colors randomly or inconsistently |
| Keep shadows subtle and layered (`0 2px 12px rgba(0,0,0,0.04)`) | Use heavy shadows or multiple shadow layers |
| Maintain `16px` border radius on cards | Mix different border radius values randomly |
| Use Inter font family throughout | Mix multiple typefaces |
| Provide clear visual hierarchy with size and weight | Use color alone for hierarchy |
| Show data visualizations with smooth curves | Use jagged or harsh chart lines |
| Keep spacing consistent (`24px` grid system) | Cram elements together |
| Use white space to separate sections | Add unnecessary decorative elements |
| Make interactive elements clearly clickable | Hide affordances or make buttons unclear |
| Show status with colored indicators (dots, bars, badges) | Rely only on text for status |
| Keep the sidebar visible and accessible on desktop | Hide navigation in hamburger menus on desktop |
| Use pill-shaped tabs for time filters (`border-radius: 20px`) | Use square or sharp tabs |
| Use `#f8f9fa` as page background | Use pure `#ffffff` as page background |
| Keep button hover states subtle (color darken only) | Add scale transforms or animations on hover |

---

## 8. Component Examples

### Task Item
```html
<div class="task-card" style="border-left: 3px solid #fd7e14;">
  <div class="task-header">
    <span class="task-icon">🎨</span>
    <h4 class="task-title">BrightBridge - Website Design</h4>
  </div>
  <p class="task-desc">Design a framer website with modern templates</p>
  <div class="task-meta">
    <span class="status-dot" style="background: #fd7e14;"></span>
    <span class="status-text">In Progress</span>
  </div>
</div>
```

### Invoice Progress Bar
```html
<div class="invoice-row">
  <span class="invoice-label">Overdue</span>
  <div class="progress-bar">
    <div class="progress-fill" style="width: 45%; background: #9775fa;"></div>
  </div>
  <div class="invoice-stats">
    <span class="invoice-count">5</span>
    <span class="invoice-amount">USD 183.00$</span>
  </div>
</div>
```

### Meeting Card
```html
<div class="meeting-card">
  <div class="meeting-time">6:45 PM</div>
  <div class="meeting-content">
    <div class="meeting-title">App Project</div>
    <span class="platform-badge">
      <svg class="meet-icon">...</svg>
      Meet
    </span>
  </div>
  <svg class="chevron-arrow">...</svg>
</div>
```

### Time Filter Tabs
```html
<div class="time-tabs">
  <button class="tab active">Today</button>
  <button class="tab">Week</button>
  <button class="tab">Month</button>
  <button class="tab">Year</button>
</div>

<style>
.time-tabs {
  display: flex;
  gap: 8px;
  background: #ffffff;
  padding: 4px;
  border-radius: 20px;
  border: 1px solid #e9ecef;
}
.tab {
  padding: 8px 20px;
  border-radius: 16px;
  font: 14px Inter Medium;
  color: #495057;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
}
.tab.active {
  background: #212529;
  color: #ffffff;
}
</style>
```

---

## 9. Accessibility Guidelines

### Color Contrast
- Text on background: minimum `4.5:1` ratio
- Large text (18px+): minimum `3:1` ratio
- UI components (icons, borders): minimum `3:1` ratio

### Focus States
```css
:focus-visible {
  outline: 2px solid #339af0;
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support
- All icons: `aria-hidden="true"` with text labels
- Interactive elements: clear `aria-label` or visible text
- Status indicators: `role="status"` with live regions for dynamic updates

---

> **Version**: 1.0  
> **Last Updated**: May 2026  
> **Maintained by**: Quixel Design Team
