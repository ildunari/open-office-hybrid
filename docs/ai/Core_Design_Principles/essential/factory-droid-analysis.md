# Factory Droid / basement.studio Design System Analysis

> Research compiled for UI redesign reference. Sources: factory.ai, basement.studio,
> grotesque.basement.studio, foundry.basement.studio, GitHub repos, Codrops case study.

---

## 1. Core Design Philosophy

**Factory.ai** and **basement.studio** share a lineage in the terminal-native, utilitarian
design space but serve different purposes. Factory.ai builds developer tooling (Droid CLI/web)
with an industrial command-center aesthetic. basement.studio is a creative agency whose
own properties showcase brutalist, type-driven dark-mode design. Together they define a
visual language that is functional-first, information-dense, and unapologetically technical.

### Guiding Principles

- **Utilitarian density** -- information is packed, not spacious. Every pixel earns its place.
- **Terminal-native** -- the CLI is the hero, not a novelty skin. Design borrows from real
  terminal conventions (prompt indicators, monospace metadata, sequential numbering).
- **Performance as brand** -- basement.studio's tagline "We make cool shit that performs"
  applies to both visual impact and literal web performance.
- **Typography as architecture** -- type does the heavy lifting. No decorative illustration;
  bold sans-serif and monospace text create visual mass and hierarchy.
- **Restraint with accent** -- near-monochrome palette punctuated by a single warm accent
  (orange) creates focus without clutter.

---

## 2. Color System

### Factory.ai Palette

| Token | Role | Approximate Value |
|-------|------|-------------------|
| `dark-base-secondary` | Page background | Near-black (#0a0a0a - #111) |
| `base-1000` | Light mode background | White/off-white |
| `foreground` | Primary text | White on dark, dark on light |
| `base-300` | Secondary text | Mid-gray |
| `base-500` | Tertiary text / muted | Warm gray |
| `base-700` | Subtle borders | Dark gray |
| `base-800` | Primary borders | Darker gray |
| `orange-500` | **Primary accent** | ~#f97316 (Tailwind orange-500) |
| `accent-500` | Interactive elements | Same orange family |
| `accent-100` | Dot indicators | Light orange/muted |

### basement.studio Palette (Grotesque site)

| Value | Role |
|-------|------|
| `#101010` | Page background |
| `#ffffff` | Primary text |
| `#ff4d00` | **Accent orange** (notification banner, highlights) |
| `brand-k` | CSS var -- black/near-black |
| `brand-w` | CSS var -- white, with opacity variants (`brand-w1/10`, `brand-w1/30`) |

### Key Color Principles

1. **Semi-monotone base** -- warm grays and blacks, not pure blue-blacks. The warmth
   comes from slightly desaturated tones rather than cool neutrals.
2. **Single accent color** -- orange is the ONLY chromatic color. It appears on:
   - Interactive hover states (`hover:text-orange-500`)
   - Dot-prefix section indicators
   - Active/selected states
   - Notification banners
3. **Three-tier text hierarchy** -- foreground (primary), base-300 (secondary), base-500 (tertiary).
4. **Border-driven separation** -- `border-base-800` replaces shadows for visual hierarchy.
   1px borders in dark gray, never drop shadows or glows.
5. **No gradients** -- transitions are functional (color shifts), not decorative.

---

## 3. Typography

### Font Stack

| Context | Factory.ai | basement.studio |
|---------|------------|-----------------|
| Body / UI | System sans-serif (`font-sans`) | Inter + system fallbacks |
| Code / metadata | `font-mono` (system monospace) | Monospace for technical specs |
| Display / headlines | Sans-serif (14-48px range) | **Basement Grotesque** (custom, weight 800) |
| Foundry site display | -- | Basement Grotesque 120-246px |

### Typography Treatment

**ALL-CAPS usage:**
- Navigation labels: ALL-CAPS monospace
- Section identifiers and tags: ALL-CAPS with letter-spacing
- CTAs: "CONTACT SALES", "LOG IN" -- uppercase via CSS `text-transform`
- Metadata labels: "By [Author] - [Date] - [Read Time]" in mono-uppercase

**Size scale (Factory.ai):**
- H1: 30-48px (responsive)
- H2: 26-36px
- Body: 14-18px
- Metadata/labels: 12px monospace
- Line-height: tight, often 100-120% (`leading-[100%]`)

**Letter-spacing:**
- Display: tight, `-0.05625rem` to `-0.09rem`
- Monospace labels: `-0.0175rem` to `-0.02rem`
- basement.studio: aggressively tight (`-2px` to `-1px`) on display sizes

**Key typographic principles:**
- Monospace for ALL metadata, labels, navigation -- not just code
- Sans-serif for body content and primary headings
- Font weight is restrained -- even headings use `font-normal` (weight 400-500)
- Size contrast does the hierarchy work, not weight contrast
- Basement Grotesque at display sizes: type becomes visual mass, functioning as
  graphic elements rather than mere text

---

## 4. Layout & Grid

### Grid System

```
Mobile:  4-column grid, gap-x-4 (16px gaps), px-4 (16px padding)
Desktop: 12-column grid, gap-x-6 (24px gaps), px-8 to px-9 (32-36px padding)
Max:     max-w-[1920px] container constraint
```

### Spacing Patterns

- Section spacing: `my-20` to `my-30` (80-120px vertical rhythm)
- Content padding: `pb-12 pt-4` mobile, `pb-24` desktop
- Generous vertical space between sections, tight within sections

### Layout Principles

1. **Border-driven hierarchy** -- full-width horizontal dividers (`col-span-full h-px`)
   separate sections. No card shadows.
2. **Hard edges** -- basement.studio Grotesque site uses NO rounded corners. Pure rectangles.
   Factory.ai uses subtle rounding (`rounded-lg` on cards, `rounded-xl` to `rounded-3xl` on
   larger sections), but avoids the heavy pill-shape rounding of modern SaaS.
3. **Sticky navigation elements** -- header `sticky inset-x-0 top-0 z-60` with border-bottom.
   Table of contents uses sticky side positioning.
4. **Invert sections** -- entire sections flip between dark-on-light and light-on-dark using
   `bg-blend-difference` and color scheme inversion for contrast rhythm.
5. **Background texture** -- Factory uses `bg-[url("/assets/bg-lines.png")]` for subtle
   line-pattern textures. Not flat color alone.

---

## 5. Component Patterns

### Section Labels (Orange Dot Prefix)

Factory.ai uses small accent-colored circular indicators before section headings:
```css
/* Dot indicator */
.dot {
  background: accent-100; /* light orange */
  width: 8px;   /* size-2 = 0.5rem */
  height: 8px;
  border-radius: 9999px; /* rounded-full */
}
```
Pattern: `[orange dot] + [ALL-CAPS MONOSPACE LABEL]`

### Navigation

- Sticky header with logo left, nav center/right, auth buttons far right
- Animated underline on hover:
  ```css
  a::after {
    position: absolute;
    height: 1px;
    width: 0;
    transition: width 200ms;
  }
  a:hover::after {
    width: 100%;
  }
  ```
- Text color shifts to orange on hover

### Numbered Sections

Factory.ai organizes content with sequential numbering: "01", "02", "03" with animated
progress loaders. This reinforces the technical, sequential workflow metaphor.

### Cards / Feature Blocks

- Dark background with `border-base-800` (1px border)
- `rounded-xl` (small) or `rounded-2xl` (large)
- No shadow -- border-only separation
- Internal padding consistent with grid gaps
- SVG icons at `size-10` (40px)

### Code/Terminal Blocks

- Monospace font, 12-16px
- `data-language` and `data-theme` attributes for syntax highlighting
- Light background variant for code on dark pages (contrast inversion)
- Command prompt indicator: `>` prefix

### CTAs and Links

- Text links with animated underline (not button-shaped)
- Arrow-right icon pattern for navigation CTAs
- Pill-shaped tag labels with uppercase text for categories
- Transition timing: `duration-200` (fast) to `duration-300` (moderate)

### Blog/Content Typography

```css
/* Prose spacing */
[&_h2]:mt-14
[&_h2]:mb-6
```
Custom margins for content hierarchy within article layouts.

---

## 6. What Makes It "Factory Droid" vs Generic Modern Web

| Factory Droid Aesthetic | Generic Modern Web |
|------------------------|-------------------|
| Monospace for labels/nav | Sans-serif everywhere |
| Orange as ONLY accent | Multi-color accent palette |
| 1px borders, no shadows | Card shadows, elevation |
| ALL-CAPS section labels | Title Case or Sentence case |
| Dot-prefix indicators | Icon-heavy section headers |
| Sequential numbering (01, 02) | No explicit ordering |
| Terminal prompt `>` in UI | Button-heavy interfaces |
| Tight line-height (100-120%) | Generous line-height (150%+) |
| Warm gray near-black bg | Pure white or cool gray |
| Background line textures | Flat solid backgrounds |
| Information density | Spacious, airy layouts |
| Type as visual mass | Image/illustration heavy |
| Hard rectangular forms | Heavy border-radius pills |
| Font weight restraint | Bold weight hierarchy |
| Size contrast for hierarchy | Weight + color for hierarchy |

### The "feel" in three words: **Industrial. Precise. Restrained.**

The aesthetic communicates competence and seriousness. It says "this is a tool for
professionals" rather than "this is a friendly product for everyone." The terminal
conventions (monospace, prompts, sequential numbering) signal developer-native thinking.
The orange accent on near-black creates the visual tension of a control panel or
factory floor display -- functional warmth, not decorative warmth.

---

## 7. Concrete CSS / Design Token Patterns

### Recommended Token Map for Reimplementation

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;        /* near-black, warm */
  --bg-secondary: #111111;       /* slightly lighter panels */
  --bg-surface: #1a1a1a;         /* card/section backgrounds */
  --bg-invert: #ffffff;          /* inverted sections */

  /* Text */
  --text-primary: #ffffff;        /* foreground */
  --text-secondary: #999999;      /* base-300 equivalent */
  --text-muted: #666666;          /* base-500 equivalent */
  --text-invert: #0a0a0a;         /* on light sections */

  /* Accent */
  --accent: #f97316;              /* orange-500 (Factory) */
  --accent-vivid: #ff4d00;        /* orange (basement.studio) */
  --accent-muted: rgba(249, 115, 22, 0.15); /* accent-100, dot bg */

  /* Borders */
  --border-subtle: #1f1f1f;       /* base-700 */
  --border-default: #262626;      /* base-800 */
  --border-strong: #333333;       /* emphatic borders */

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', 'Fira Code', monospace;
  --font-display: 'Basement Grotesque', var(--font-sans); /* if using */

  /* Sizes */
  --text-xs: 0.75rem;     /* 12px - metadata, labels */
  --text-sm: 0.875rem;    /* 14px - body small */
  --text-base: 1rem;      /* 16px - body */
  --text-lg: 1.125rem;    /* 18px - body large */
  --text-xl: 1.625rem;    /* 26px - h2 mobile */
  --text-2xl: 1.875rem;   /* 30px - h1 mobile */
  --text-3xl: 2.25rem;    /* 36px - h2 desktop */
  --text-4xl: 3rem;       /* 48px - h1 desktop */

  /* Spacing */
  --gap-sm: 1rem;          /* 16px - mobile grid gap */
  --gap-md: 1.5rem;        /* 24px - desktop grid gap */
  --space-section: 5rem;   /* 80px - between sections */
  --space-section-lg: 7.5rem; /* 120px - large section gaps */

  /* Borders */
  --radius-sm: 0.5rem;    /* 8px - small elements */
  --radius-md: 0.75rem;   /* 12px - cards */
  --radius-lg: 1rem;      /* 16px - large cards */
  --radius-xl: 1.5rem;    /* 24px - hero sections */

  /* Transitions */
  --transition-fast: 200ms;
  --transition-normal: 300ms;
}
```

### Key Tailwind Extensions

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        base: {
          300: '#999999',
          500: '#666666',
          700: '#1f1f1f',
          800: '#262626',
          1000: '#ffffff',
        },
        accent: {
          100: 'rgba(249, 115, 22, 0.15)',
          500: '#f97316',
        },
        dark: {
          'base-secondary': '#111111',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SF Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.05625rem',
        display: '-0.09rem',
      },
      lineHeight: {
        tight: '100%',
        snug: '120%',
      },
    },
  },
}
```

---

## 8. basement.studio Technical Stack

For reference, their implementation approach:

- **Framework**: Next.js + TypeScript
- **Styling**: Tailwind CSS (2025 site), previously Stitches CSS-in-JS
- **Animation**: GSAP, Locomotive Scroll
- **3D/Visual**: WebGL, OGL, Three.js (React Three Fiber), GLSL shaders
- **Font**: Basement Grotesque (open source, SIL OFL 1.1) -- 413 glyphs, weight 800
- **CMS**: Contentful (asset management)
- **Deploy**: Vercel

---

## 9. Reference URLs

- Factory.ai main: https://factory.ai
- Factory CLI product: https://factory.ai/product/cli
- Factory Web product: https://factory.ai/product/web
- basement.studio: https://basement.studio
- Basement Grotesque specimen: https://grotesque.basement.studio
- Basement Foundry: https://foundry.basement.studio/fonts/grotesque
- Basement Grotesque GitHub: https://github.com/basementstudio/basement-grotesque
- basement.studio 2025 site source: https://github.com/basementstudio/website-2k25
- Codrops case study: https://tympanus.net/codrops/2021/12/13/case-study-a-unique-website-for-basement-grotesque/
- basement.studio Next.js starter: https://github.com/basementstudio/next-typescript
- Factory on X: https://x.com/FactoryAI
