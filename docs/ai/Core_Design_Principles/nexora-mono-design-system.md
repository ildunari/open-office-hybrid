# NexoraSIM™ — Visual & UX Design Guidelines

## Color System

### Philosophy

The design is **strictly monochromatic** — black, white, and grays. No brand colors, no accent hues. The aesthetic references technical schematics and engineering blueprints. Color conveys hierarchy through opacity and shade, not hue.

### Palette (Light Mode — Active)

The app uses two CSS custom property systems. The **page components** use direct color values (hardcoded Tailwind classes). The **shadcn/ui layer** defines HSL-based tokens in `styles/globals.css` for the component library.

#### Page-Level Colors (used in app components)

| Token / Class | Value | Usage |
|---------------|-------|-------|
| `bg-white` | `#ffffff` | Primary background (Hero, AI Section) |
| `bg-gray-50` | `#fafafa` | Secondary background (Features, Footer) |
| `bg-black` | `#000000` | Inverted section background (Vercel), text, accents |
| `text-black` | `#000000` | Primary text, headlines |
| `text-gray-600` | `#525252` | Body text, descriptions |
| `text-gray-500` | `#737373` | Labels, metric labels, nav inactive |
| `text-gray-400` | `#a3a3a3` | Muted text, sublabels (dark section) |
| `border-gray-200` | `#e5e5e5` | Card borders (inactive), section dividers |
| `border-gray-300` | `#d4d4d4` | Footer borders, decorative elements |
| `border-gray-700` | `#404040` | Card borders on dark background |
| `bg-gray-900` | `#171717` | Card backgrounds on dark section |
| `bg-gray-300` | `#d4d4d4` | Inactive indicators |
| `bg-gray-400` | `#a3a3a3` | Inactive status dots, connection nodes |

#### Accent Colors (Vercel Section only)

| Class | Usage |
|-------|-------|
| `bg-green-600` | Deployment status: LIVE |
| `bg-green-500` | APP node pulse when LIVE |
| `bg-blue-600` | Deployment status: READY |
| `bg-yellow-600` | Deployment status: BUILDING / DEPLOYING |

#### shadcn/ui Design Tokens (CSS Custom Properties)

Defined in `styles/globals.css` using HSL values (without `hsl()` wrapper — consumed via `hsl(var(--token))`):

```css
/* Light mode (:root) */
--background: 0 0% 100%;           /* #ffffff — white */
--foreground: 0 0% 3.9%;           /* #0a0a0a — near-black */
--card: 0 0% 100%;                 /* #ffffff */
--card-foreground: 0 0% 3.9%;      /* #0a0a0a */
--popover: 0 0% 100%;              /* #ffffff */
--popover-foreground: 0 0% 3.9%;   /* #0a0a0a */
--primary: 0 0% 9%;                /* #171717 — dark gray */
--primary-foreground: 0 0% 98%;    /* #fafafa */
--secondary: 0 0% 96.1%;           /* #f5f5f5 */
--secondary-foreground: 0 0% 9%;   /* #171717 */
--muted: 0 0% 96.1%;               /* #f5f5f5 */
--muted-foreground: 0 0% 45.1%;    /* #737373 */
--accent: 0 0% 96.1%;              /* #f5f5f5 */
--accent-foreground: 0 0% 9%;      /* #171717 */
--destructive: 0 84.2% 60.2%;      /* #ef4444 — red */
--destructive-foreground: 0 0% 98%;
--border: 0 0% 89.8%;              /* #e5e5e5 */
--input: 0 0% 89.8%;               /* #e5e5e5 */
--ring: 0 0% 3.9%;                 /* #0a0a0a */
--radius: 0.5rem;                  /* 8px */
```

#### Chart Colors (defined but unused in current pages)

```css
/* Light */
--chart-1: 12 76% 61%;    /* warm orange */
--chart-2: 173 58% 39%;   /* teal */
--chart-3: 197 37% 24%;   /* dark blue */
--chart-4: 43 74% 66%;    /* gold */
--chart-5: 27 87% 67%;    /* orange */

/* Dark */
--chart-1: 220 70% 50%;   /* blue */
--chart-2: 160 60% 45%;   /* green */
--chart-3: 30 80% 55%;    /* orange */
--chart-4: 280 65% 60%;   /* purple */
--chart-5: 340 75% 55%;   /* pink */
```

#### Sidebar Tokens (defined but unused — no sidebar in current pages)

```css
--sidebar-background: 0 0% 98%;
--sidebar-foreground: 240 5.3% 26.1%;
--sidebar-primary: 240 5.9% 10%;
--sidebar-primary-foreground: 0 0% 98%;
--sidebar-accent: 240 4.8% 95.9%;
--sidebar-accent-foreground: 240 5.9% 10%;
--sidebar-border: 220 13% 91%;
--sidebar-ring: 217.2 91.2% 59.8%;
```

### Dark Mode Tokens (defined, not active)

Dark mode tokens exist in `styles/globals.css` under `.dark` class but are **never applied** — `next-themes` ThemeProvider is not mounted in the layout. The Vercel section achieves its "dark" appearance via explicit `bg-black text-white` classes, not the theme system.

```css
.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --border: 0 0% 14.9%;
  /* ... */
}
```

### Opacity as Design Tool

Opacity is used extensively to create depth hierarchy in SVG visualizations:

| Opacity | Usage |
|---------|-------|
| `0.4–0.5` | Active SVG elements, primary globe lines |
| `0.2–0.3` | Secondary SVG lines, inner globe rings |
| `0.1–0.15` | Tertiary decorative elements, background patterns |
| `0.05` (`opacity-5`) | Grid/circuit background patterns |

## Typography

### Font Families

| Role | Font | CSS Variable | Loading |
|------|------|-------------|---------|
| **Sans-serif (body)** | Inter | `--font-inter` | Google Fonts, `font-display: swap`, latin subset |
| **Monospace (technical)** | JetBrains Mono | `--font-mono` | Google Fonts, `font-display: swap`, latin subset |

The monospace font is the dominant typeface — used for all headings, labels, metrics, status text, nav items, and code-like content. Inter (sans) is used only for body paragraphs and descriptions.

### Tailwind Font Stack

```js
fontFamily: {
  sans: ["var(--font-inter)", "system-ui", "sans-serif"],
  mono: ["var(--font-mono)", "monospace"],
}
```

### Type Scale (as used in components)

| Tailwind Class | Size | Where Used |
|----------------|------|------------|
| `text-8xl` | 6rem / 96px | Hero headline ("NEXORASIM™") |
| `text-5xl` | 3rem / 48px | Section headings ("CORE FEATURES", "ONEX™ AI ENGINE") |
| `text-4xl` | 2.25rem / 36px | Footer brand name |
| `text-3xl` | 1.875rem / 30px | Metric values (stats, KPIs) |
| `text-2xl` | 1.5rem / 24px | Hero subtitle, footer performance values, trademark sup |
| `text-xl` | 1.25rem / 20px | Feature card titles, section subtitles, footer section headings |
| `text-lg` | 1.125rem / 18px | Tagline mono line, section descriptions, neural net heading |
| `text-sm` | 0.875rem / 14px | Nav links, descriptions, card body text |
| `text-xs` | 0.75rem / 12px | Labels, metric keys, status text, codes, footer badges |

### Font Weights

| Tailwind Class | Weight | Usage |
|----------------|--------|-------|
| `font-bold` | 700 | Metric values, "SIM" in logo, section headings (mono), card titles |
| `font-semibold` | 600 | Badge text (shadcn/ui) |
| `font-medium` | 500 | Button text (shadcn/ui) |
| `font-light` | 300 | "NEXORA" in logo, section heading base, hero subtitle |

### Text Styling Patterns

- **All-caps throughout:** Every heading, label, nav item, status indicator, and metric label is uppercase (via literal uppercase text in JSX, not CSS `text-transform`).
- **Tracking:** `tracking-wider` on major headings, `tracking-wide` on card titles and nav links
- **Line height:** `leading-relaxed` (1.625) on body paragraphs and descriptions
- **Letter spacing:** Wider tracking on monospace headings creates the technical/industrial aesthetic

### Typographic Hierarchy Pattern

```
Section Heading:  text-5xl font-light tracking-wider font-mono  (e.g., "CORE FEATURES")
Thin divider:     w-32 h-px bg-black mx-auto mb-8
Section subtitle: text-gray-600 text-lg                          (Inter, regular)
Card title:       text-xl font-mono font-bold tracking-wide
Card body:        text-gray-600 leading-relaxed                  (Inter, regular)
Metric label:     text-xs font-mono text-gray-500 uppercase
Metric value:     text-3xl font-mono font-bold
```

## Spacing & Layout

### Container & Grid

- **Max-width container:** `max-w-7xl mx-auto px-6` (1280px + 24px horizontal padding) — consistent across all sections
- **Section padding:** `py-32` (128px vertical) for main sections, `py-20` (80px) for footer
- **Component grid:** CSS Grid via Tailwind (`grid grid-cols-1 md:grid-cols-3`, `lg:grid-cols-4`, etc.)
- **No explicit breakpoint system** beyond Tailwind defaults

### Tailwind Breakpoints (default, not customized)

| Prefix | Width | Usage |
|--------|-------|-------|
| (none) | 0px | Single column, mobile-first |
| `sm:` | 640px | Show "LIVE" indicator in nav |
| `md:` | 768px | Multi-column grids, desktop nav |
| `lg:` | 1024px | 2-column layout in AI section |

### Spacing Values Used

| Value | Tailwind | Where |
|-------|----------|-------|
| 4px | `space-x-1` | Vertical bar indicators |
| 8px | `space-x-2`, `gap-3` | Icon + text pairs, small gaps |
| 12px | `space-x-3`, `space-y-3` | Icon + label groups |
| 16px | `p-4`, `px-4` | Nav padding, small card padding |
| 24px | `p-6`, `px-6`, `space-x-6`, `gap-6` | Card padding, container padding, grid gaps |
| 32px | `p-8`, `gap-8`, `space-x-8`, `mb-8` | Primary card padding, feature grid gap |
| 40px | `p-10` | Large card padding (architecture diagram) |
| 48px | `space-x-12`, `gap-12`, `mb-12` | Column gaps, major spacing |
| 64px | `space-x-16`, `gap-16` | AI section two-column gap, status indicators gap |
| 80px | `mb-20` | Section heading to content |

### Responsive Layout Adaptation

| Breakpoint | Navigation | Feature Cards | AI Section | Vercel Cards |
|------------|-----------|---------------|------------|--------------|
| Mobile | Hamburger menu | 1 column | 1 column, stacked | 1 column |
| md (768px) | Horizontal scrollable links | 3 columns | 1 column | 2 columns |
| lg (1024px) | Same | Same | 2 columns side-by-side | 4 columns |

## Component Tokens

### Border Radius

```js
// tailwind.config.js
borderRadius: {
  lg: "var(--radius)",              // 0.5rem = 8px
  md: "calc(var(--radius) - 2px)",  // 6px
  sm: "calc(var(--radius) - 4px)",  // 4px
}
```

**In practice:** The page components use **zero border-radius** almost everywhere — cards, buttons, metrics boxes, and status indicators are all sharp rectangles. `rounded-full` is used only for status dots, the loading spinner, and nav scroll buttons. The shadcn/ui library uses `rounded-md` for buttons and badges.

### Border Styles

| Pattern | CSS | Usage |
|---------|-----|-------|
| Card border (inactive) | `border-2 border-gray-200` | Feature cards, metric boxes |
| Card border (active) | `border-2 border-black` | Active feature card, status panels |
| Card border (dark bg) | `border-2 border-gray-700` | Vercel section cards |
| Section divider | `border-t-2 border-gray-200` | Footer top border |
| Decorative line | `w-32 h-px bg-black` | Section heading underlines |
| Corner brackets | `border-t-2 border-l-2 border-black` | Feature card corner decorations |

### Shadow / Elevation

| Level | Tailwind | When |
|-------|----------|------|
| None | (default) | All resting states |
| `shadow-lg` | `0 10px 15px ...` | Feature card hover |
| `shadow-xl` | `0 20px 25px ...` | Active feature card |
| `shadow-md` | `0 4px 6px ...` | Nav scroll buttons |

No custom box-shadow values. The design is intentionally flat with shadows used sparingly.

### Transitions & Animations

#### CSS Transitions

```css
/* Global wildcard transition (app/globals.css) */
* {
  transition: opacity 0.3s ease, transform 0.3s ease, color 0.2s ease, border-color 0.2s ease;
}
```

This applies a baseline transition to **all elements**. Additional specific transitions:

| Duration | Property | Usage |
|----------|----------|-------|
| 200ms | `transition-colors` | Nav links, hover states |
| 300ms | `transition-all duration-300` | Card hover, panel expand, corner bracket grow |
| 500ms | `transition-all duration-500` | Feature card active state change |

#### Custom Keyframe Animations

| Name | Duration | Easing | Effect |
|------|----------|--------|--------|
| `fadeIn` | 0.5s | ease-out | Opacity 0→1 + translateY(10px→0) |
| `slideInFromLeft` | 0.6s | ease-out | Opacity 0→1 + translateX(-20px→0) |
| `slideInFromRight` | 0.6s | ease-out | Opacity 0→1 + translateX(20px→0) |
| `slideDown` | 0.3s | ease-out | Mobile menu reveal |
| `dataFlow` | 2s | linear infinite | SVG stroke-dashoffset animation |

#### Tailwind Animation Utilities

| Class | Duration | Usage |
|-------|----------|-------|
| `animate-pulse` | 2s | Status dots, progress bars, processing indicators |
| `animate-bounce` | 1s | Scroll indicator, decorative elements |
| `animate-ping` | 1s | Status dots, notification indicators |
| `animate-spin` | varies | Loading spinner (default), globe rings (30s, 20s custom) |

#### Custom Tailwind Animations

```js
animation: {
  "spin-slow": "spin 30s linear infinite",
  "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
  "bounce-slow": "bounce 2s infinite",
  "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
}
```

#### JavaScript Animations

| Type | Mechanism | FPS/Interval | Component |
|------|-----------|-------------|-----------|
| Canvas particles | `requestAnimationFrame` | 60fps | Hero |
| Globe rotation | `setInterval` | 50ms (20fps) | Hero |
| Globe pulse | `setInterval` | 3000ms | Hero |
| Node activation | `setInterval` | 2000ms | Hero |
| Connection lines | `setInterval` | 2000ms | Features |
| Feature auto-cycle | `setInterval` | 5000ms | Features |
| Metric jitter | `setInterval` | 2000ms | AISection, VercelSection |
| Processing pulse | `setInterval` | 5000ms (1.5s duration) | AISection |
| Deploy status cycle | `setInterval` | 4000ms | VercelSection |
| System status | `setInterval` | 15000ms | Footer |

### Opacity Values

| Value | Tailwind | Usage |
|-------|----------|-------|
| 0.05 | `opacity-5` | Background grid patterns |
| 0.08 | `opacity-8` | Circuit pattern overlay |
| 0.10 | `opacity-10` | Decorative geometric shapes, globe inner rings |
| 0.15 | `opacity-15` | Secondary decorative elements |
| 0.20 | `opacity-20` | Tertiary decorative shapes |
| 0.30 | `opacity-30` | Canvas particle layer, hero ping dot |
| 0.60 | `opacity-60` | Vercel card status dots |

## Interactive States

### Hover Patterns

```css
/* Feature cards */
.inactive-card:hover {
  border-color: #a3a3a3;     /* border-gray-400 */
  box-shadow: /* shadow-lg */;
  transform: translateY(-4px); /* hover:-translate-y-1 */
}

/* Active feature card */
.active-card {
  border-color: #000000;     /* border-black */
  box-shadow: /* shadow-xl */;
  transform: translateY(-16px); /* -translate-y-4 */
  background: #fafafa;       /* bg-gray-50 */
}

/* Vercel cards */
.vercel-card:hover {
  border-color: #737373;     /* border-gray-500 */
  transform: translateY(-8px); /* hover:-translate-y-2 */
}

/* Nav links */
a:hover { color: #525252; }   /* text-gray-600 */

/* Custom utility classes */
.hover-lift:hover { transform: translateY(-2px); }
.hover-scale:hover { transform: scale(1.02); }

/* Corner brackets expand */
.corner:hover { width: 48px; height: 48px; } /* from 32px */
```

### Focus States

```css
button:focus, a:focus {
  outline: 2px solid #000;
  outline-offset: 2px;
}

/* shadcn/ui components */
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring        /* hsl(0 0% 3.9%) = near-black */
focus-visible:ring-offset-2
```

### Disabled States

shadcn/ui components: `disabled:pointer-events-none disabled:opacity-50`

No disabled states in custom page components (no interactive forms).

### Cursor Behaviors

- Feature cards: `cursor-pointer` (clickable to select)
- AI panels: `cursor-pointer`
- Nav links: default anchor cursor
- All other elements: default

## Component Inventory

### shadcn/ui Library (50+ components, "new-york" style)

All from [ui.shadcn.com](https://ui.shadcn.com), configured with:
- Style: `new-york`
- Base color: `neutral`
- CSS variables: enabled
- Icon library: `lucide`
- RSC: enabled

**Installed components** (in `components/ui/`):

| Component | Radix Dependency | Used in Pages? |
|-----------|-----------------|----------------|
| accordion | @radix-ui/react-accordion | No |
| alert-dialog | @radix-ui/react-alert-dialog | No |
| alert | — | No |
| aspect-ratio | @radix-ui/react-aspect-ratio | No |
| avatar | @radix-ui/react-avatar | No |
| badge | — (CVA) | No |
| breadcrumb | — | No |
| button | @radix-ui/react-slot (CVA) | No |
| button-group | — | No |
| calendar | react-day-picker | No |
| card | — | No |
| carousel | embla-carousel-react | No |
| chart | recharts | No |
| checkbox | @radix-ui/react-checkbox | No |
| collapsible | @radix-ui/react-collapsible | No |
| command | cmdk | No |
| context-menu | @radix-ui/react-context-menu | No |
| dialog | @radix-ui/react-dialog | No |
| drawer | vaul | No |
| dropdown-menu | @radix-ui/react-dropdown-menu | No |
| empty | — | No |
| field | — | No |
| form | react-hook-form | No |
| hover-card | @radix-ui/react-hover-card | No |
| input-group | — | No |
| input-otp | input-otp | No |
| input | — | No |
| item | — | No |
| kbd | — | No |
| label | @radix-ui/react-label | No |
| menubar | @radix-ui/react-menubar | No |
| navigation-menu | @radix-ui/react-navigation-menu | No |
| pagination | — | No |
| popover | @radix-ui/react-popover | No |
| progress | @radix-ui/react-progress | No |
| radio-group | @radix-ui/react-radio-group | No |
| resizable | react-resizable-panels | No |
| scroll-area | @radix-ui/react-scroll-area | No |
| select | @radix-ui/react-select | No |
| separator | @radix-ui/react-separator | No |
| sheet | @radix-ui/react-dialog | No |
| sidebar | — | No |
| skeleton | — | No |
| slider | @radix-ui/react-slider | No |
| sonner | sonner | No |
| spinner | — | No |
| switch | @radix-ui/react-switch | No |
| table | — | No |
| tabs | @radix-ui/react-tabs | No |
| textarea | — | No |
| toast | @radix-ui/react-toast | No |
| toaster | — | No |
| toggle | @radix-ui/react-toggle | No |
| toggle-group | @radix-ui/react-toggle-group | No |
| tooltip | @radix-ui/react-tooltip | No |

**Notable:** None of the shadcn/ui components are used in the current page components. They were bulk-installed (likely via v0.app scaffolding) and are available for future development.

### Variant System (CVA)

Button variants:

```typescript
variant: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
size: 'default' (h-10 px-4) | 'sm' (h-9 px-3) | 'lg' (h-11 px-8) | 'icon' (h-10 w-10)
```

Badge variants:

```typescript
variant: 'default' | 'secondary' | 'destructive' | 'outline'
```

### Custom Page Components

| Component | Type | Unique Visual Elements |
|-----------|------|----------------------|
| Navigation | Fixed header | Scroll spy, horizontal scroll arrows, mobile dropdown |
| Hero | Full-viewport section | Canvas particles, SVG globe with animated nodes, corner decorations |
| Features | Card grid | Corner bracket borders, inline SVG schematics, connection line SVG overlay |
| AISection | Two-column layout | Neural network SVG visualization, processing overlay, metric cards |
| VercelSection | Inverted dark section | Deployment status badge, vertical architecture diagram, circuit pattern background |
| Footer | Multi-column footer | System status bar, GSMA certification badge, geometric decorations |
| LoadingSpinner | Full-screen overlay | CSS-only rotating border spinner |

## Iconography

### Library

**Lucide React** (`lucide-react` ^0.454.0) — MIT-licensed, 1px stroke icons.

### Icons Used

| Icon | Size | Component | Context |
|------|------|-----------|---------|
| `Search` | 20px | Features | ICCID Search feature |
| `Cpu` | 20px | Features | SM-DP+ Integration feature |
| `QrCode` | 20px | Features | QR Code Activation feature |
| `Brain` | 24px | AISection | Predictive Analytics panel |
| `Zap` | 24px | AISection, VercelSection | Smart Provisioning, Turbo Previews, Edge Functions |
| `Settings` | 24px | AISection | Workflow Automation panel |
| `Cloud` | 24px | VercelSection | Fluid Compute feature |
| `Eye` | 24px | VercelSection | Observability feature |
| `Mail` | 16px | Footer | Email contact |
| `Phone` | 16px | Footer | Phone contact |
| `MapPin` | 16px | Footer | Address |
| `Menu` | 24px | Navigation | Mobile hamburger |
| `X` | 24px | Navigation | Mobile close |
| `ChevronLeft` | 16px | Navigation | Scroll left button |
| `ChevronRight` | 16px | Navigation | Scroll right button |

### Sizing Conventions

- 16px — inline with text (contact info, nav scroll buttons)
- 20px — card header accents (feature cards)
- 24px — panel/section header icons

### Color on Icons

Icons use `text-gray-600` (features, AI) or `text-gray-400` (Vercel dark section, contact labels). No colored icons.

## Theming Strategy

### Current State

The app is **light-mode only** in practice. While infrastructure for dark mode exists:

1. `next-themes` is installed and a `ThemeProvider` component is defined in `components/theme-provider.tsx`
2. Dark mode CSS tokens are defined in `styles/globals.css` under `.dark` class
3. `tailwind.config.js` sets `darkMode: ["class"]`

**However**, the `ThemeProvider` is **not mounted** in `app/layout.tsx`. The layout renders raw `<html>` and `<body>` without any theme context. All page components use hardcoded colors (`bg-white`, `bg-black`, `text-gray-600`) rather than semantic tokens (`bg-background`, `text-foreground`).

### How the "Dark" Vercel Section Works

The Vercel section achieves a dark appearance via explicit inversion: `bg-black text-white` on the section element, with `bg-gray-900` cards and `border-gray-700` borders. This is not connected to the theme system.

### CSS Architecture

**Two stylesheet layers:**

1. **`styles/globals.css`** — shadcn/ui design tokens layer. Defines `:root` and `.dark` CSS custom properties inside `@layer base`. Consumed by shadcn/ui components via Tailwind config mapping (`hsl(var(--primary))`). Also sets global `border-border` and `bg-background text-foreground` on body.

2. **`app/globals.css`** — Application styles layer. Defines `--font-inter` and `--font-mono` custom properties, global resets, custom animations, utility classes, scrollbar styles, accessibility media queries, and decorative patterns. Does **not** use the shadcn token system.

These two files have overlapping concerns (both define body styles, both use `@tailwind` directives). In production, Tailwind/PostCSS merges them. The app-level `globals.css` (imported in `layout.tsx`) takes visual precedence since it applies direct color values (`color: #000; background: #fff`).

### Enabling Full Dark Mode (future)

Would require:
1. Mount `<ThemeProvider>` in `layout.tsx` wrapping `{children}`
2. Replace hardcoded color classes with semantic tokens across all page components
3. Add dark-specific styles for SVG visualizations (currently all `stroke="#000"`)
4. Handle the Vercel section's inherent dark design (already dark, would need special treatment)
