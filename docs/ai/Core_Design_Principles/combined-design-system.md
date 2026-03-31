# Combined Design System Reference

> All design system files from `Core_Design_Principles/` unified into a single document.
> Organized by system: Forge, Nexora Mono, Factory Droid, then Icon Inventory.

---

## Table of Contents

1. [Systems Overview](#1-systems-overview)
2. [Forge Design System](#2-forge-design-system)
   - 2.1 [Forge Design System (Documentation)](#21-forge-design-system-documentation)
   - 2.2 [Forge Office Agents Brief](#22-forge-office-agents-brief)
   - 2.3 [Forge Tokens (CSS)](#23-forge-tokens-css)
   - 2.4 [Forge Tokens (JSON)](#24-forge-tokens-json)
   - 2.5 [Forge Buttons (CSS)](#25-forge-buttons-css)
   - 2.6 [Forge Cards (CSS)](#26-forge-cards-css)
   - 2.7 [Forge Chat (CSS)](#27-forge-chat-css)
   - 2.8 [Forge Inputs (CSS)](#28-forge-inputs-css)
   - 2.9 [Forge Patterns (CSS)](#29-forge-patterns-css)
   - 2.10 [Forge Tags (CSS)](#210-forge-tags-css)
   - 2.11 [Forge Terminal (CSS)](#211-forge-terminal-css)
3. [Nexora Mono Design System](#3-nexora-mono-design-system)
   - 3.1 [Nexora Mono Design System (Documentation)](#31-nexora-mono-design-system-documentation)
   - 3.2 [Nexora Mono Design Guidelines](#32-nexora-mono-design-guidelines)
   - 3.3 [Nexora Mono Design (NexoraSIM)](#33-nexora-mono-design-nexorasim)
   - 3.4 [Nexora Mono Architecture](#34-nexora-mono-architecture)
   - 3.5 [Nexora Mono Tokens (CSS)](#35-nexora-mono-tokens-css)
   - 3.6 [Nexora Mono Tokens (JSON)](#36-nexora-mono-tokens-json)
   - 3.7 [Nexora Mono App Globals (CSS)](#37-nexora-mono-app-globals-css)
   - 3.8 [Nexora Mono Badges (CSS)](#38-nexora-mono-badges-css)
   - 3.9 [Nexora Mono Buttons (CSS)](#39-nexora-mono-buttons-css)
   - 3.10 [Nexora Mono Cards (CSS)](#310-nexora-mono-cards-css)
   - 3.11 [Nexora Mono Inputs (CSS)](#311-nexora-mono-inputs-css)
4. [Factory Droid Reference](#4-factory-droid-reference)
   - 4.1 [Factory Droid Analysis](#41-factory-droid-analysis)
   - 4.2 [Forge Factory Droid Research](#42-forge-factory-droid-research)
5. [Icon Inventory](#5-icon-inventory)

---

# 1. Systems Overview

*Source: `systems-overview.md`*

# Design Systems

Complete, self-contained design system packages. Each system is a full kit: tokens, components, documentation, and a live preview.

## What belongs here

- Full design systems with CSS tokens, component styles, and docs
- Each system in its own subfolder
- Systems that define an entire visual language (colors, type, spacing, components, motion)

## What does NOT belong here

- Standalone color palettes → `../palettes/`
- Individual font pairings → `../typography/`
- Loose animation presets → `../motion/`
- One-off UI patterns → `../patterns/`
- Standalone icon sets → `../iconography/`

## Related Assets

Systems often have companion assets in other categories. Use the family prefix to find them:

```
systems/forge/                     ← Full system
iconography/forge-tool-icons/      ← Icons for this system
motion/forge-terminal/             ← Animations for this system
```

## Required Structure per System

```
{system-name}/
  manifest.json              Metadata (name, version, heritage, targets)
  README.md                  Overview and quick start
  tokens/                    CSS, JSON, Tailwind tokens
  preview/                   Interactive visual reference (index.html)
  components/                Component stylesheets
  docs/                      Specification, usage guide, research
  assets/                    Local fonts/icons (if needed)
  reference-app/             Working implementation (optional)
```

## Systems

| Name | Accent | Heritage | Status |
|------|--------|----------|--------|
| [forge](forge/) | `#D15010` | Geist x Factory Droid | Complete (tokens, components, preview, docs) |
| [forge-mobile](forge-mobile/) | `#FF4F00` | Factory Hybrid | Spec only (design doc) |
| [nexora-mono](nexora-mono/) | None (pure B&W) | Monochromatic blueprint | Spec + reference app |

---

# 2. Forge Design System

---

## 2.1 Forge Design System (Documentation)

*Source: `forge-design-system.md`*

# Office Agents — Design System

> A hybrid of **Vercel Geist** and **Factory Droid** — industrial precision meets systematic design. Semi-monotone, terminal-native, enterprise-grade.

---

## Philosophy

Three principles, borrowed from both parents:

1. **Precision over decoration** (Factory) — No gradients, no illustration, no visual noise. Every element earns its pixels.
2. **System extension, not novelty** (Geist) — Every token, font, and component shares a common grid and metric system. Mixing weights and variants never breaks rhythm.
3. **Developer-native** (both) — Dark mode primary, monospace-forward, terminal-influenced. The UI speaks the same language as the people building with it.

---

## Color System

### Philosophy: Semi-Monotone + One Accent

The palette is deliberately constrained. A grayscale foundation with a single brand accent — warm enough to feel intentional, restrained enough to feel industrial.

The Geist 10-step scale provides depth. Factory's discipline keeps it monotone.

### Core Tokens (Dark Mode — Primary)

```css
:root[data-theme="dark"] {
  /* ── Backgrounds ── */
  --bg-base:        #020202;    /* Factory: near-pure black (rgb 2,2,2) */
  --bg-raised:      #0A0A0A;    /* Geist: background-100 */
  --bg-surface:     #111111;    /* Factory: card/section background */
  --bg-overlay:     #1A1A1A;    /* Elevated panels, modals */
  --bg-inset:       #000000;    /* Code blocks, terminal regions */

  /* ── Borders ── */
  --border-default: #4D4947;    /* Factory: warm dark gray (rgb 77,73,71) */
  --border-subtle:  #2A2827;    /* Halved Factory border */
  --border-strong:  #8A8380;    /* Factory: medium warm gray (rgb 138,131,128) */
  --border-focus:   var(--accent-500); /* Accent ring on focus */

  /* ── Text ── */
  --text-primary:   #EEEEEE;    /* Factory: body text (rgb 238,238,238) */
  --text-secondary: #A49D9A;    /* Factory: nav/muted text (rgb 164,157,154) */
  --text-tertiary:  #6B6462;    /* Dimmed labels, timestamps */
  --text-ghost:     #3D3A39;    /* Placeholder text, disabled */
  --text-inverse:   #020202;    /* Text on light/accent backgrounds */

  /* ── Accent: Forge Orange ── */
  /* Factory's #D15010 blended with Geist amber scale structure */
  --accent-100:     #1C0E04;    /* Tinted background */
  --accent-200:     #2D1508;    /* Subtle hover bg */
  --accent-300:     #4A200D;    /* Active background */
  --accent-400:     #6B2E12;    /* Border on accent elements */
  --accent-500:     #D15010;    /* Factory primary orange (rgb 209,80,16) */
  --accent-600:     #E8650A;    /* Perplexity extracted (~#E8450A adjusted) */
  --accent-700:     #F07A1A;    /* Hover state */
  --accent-800:     #F5933D;    /* Active/pressed light */
  --accent-900:     #FBBF7A;    /* High contrast, badges */
  --accent-1000:    #FEF0DC;    /* Near-white tinted */

  /* ── Semantic ── */
  --success:        hsl(135, 70%, 34%);   /* Geist green-600 */
  --error:          hsl(358, 75%, 59%);   /* Geist red-600 */
  --warning:        var(--accent-600);     /* Reuse accent */
  --info:           hsl(206, 100%, 50%);  /* Geist blue-600 */
}
```

### Core Tokens (Light Mode — Secondary)

```css
:root[data-theme="light"] {
  --bg-base:        #FAFAFA;    /* Geist-style off-white */
  --bg-raised:      #FFFFFF;
  --bg-surface:     #F4F4F4;    /* Factory: light section bg */
  --bg-overlay:     #FFFFFF;
  --bg-inset:       #F0EFEE;    /* Code blocks on light */

  --border-default: #E0DEDD;
  --border-subtle:  #EEEDEC;
  --border-strong:  #B8B3B0;    /* Factory: light border */
  --border-focus:   var(--accent-500);

  --text-primary:   #111111;
  --text-secondary: #6B6462;
  --text-tertiary:  #A49D9A;
  --text-ghost:     #D0CDCC;
  --text-inverse:   #EEEEEE;

  /* Accent scale stays the same — it's warm enough for both modes */
}
```

### Gray Scale (Geist-derived, warm-shifted to match Factory)

Factory's grays have a warm brown undertone (`rgb(164, 157, 154)` ≠ pure neutral). We shift Geist's neutral grays toward Factory's warmth:

| Step | Dark Mode | Light Mode | Usage |
|------|-----------|------------|-------|
| 100  | `#1C1A19` | `#F8F7F6` | Subtle surface tint |
| 200  | `#242221` | `#F0EFEE` | Card bg, insets |
| 300  | `#2E2C2A` | `#E0DEDD` | Borders, dividers |
| 400  | `#3D3A39` | `#D0CDCC` | Disabled, placeholder |
| 500  | `#4D4947` | `#B8B3B0` | Muted icons |
| 600  | `#6B6462` | `#8A8380` | Secondary text (dark) |
| 700  | `#8A8380` | `#6B6462` | Secondary text (light) |
| 800  | `#A49D9A` | `#4D4947` | Body text secondary |
| 900  | `#D0CDCC` | `#2E2C2A` | Strong foreground |
| 1000 | `#EEEEEE` | `#1C1A19` | Primary foreground |

### Chromatic Accents (Use Sparingly)

Only for semantic states — never decorative. Pulled from Geist's scale, desaturated 15% to stay monotone-compatible:

| Color | Value (Dark) | When to use |
|-------|-------------|-------------|
| Blue  | `hsl(212, 80%, 45%)` | Links, info states, selected items |
| Red   | `hsl(358, 65%, 52%)` | Errors, destructive actions, diff deletions |
| Green | `hsl(135, 55%, 38%)` | Success, connected, diff additions |
| Amber | `var(--accent-600)`  | Warnings — same as brand accent |

---

## Typography

### Font Stack

Factory literally uses Geist — their site ships with `font-family: Geist, "Geist Fallback"` for body and `Geist Mono, "Geist Mono Fallback"` for navigation and code. We extend this with the Pixel variant for display moments.

```css
:root {
  /* ── Font families ── */
  --font-sans:       'Geist', 'Geist Fallback', -apple-system, system-ui, sans-serif;
  --font-mono:       'Geist Mono', 'Geist Mono Fallback', 'SF Mono', 'Fira Code', monospace;
  --font-pixel:      'Geist Pixel Square', var(--font-mono);   /* Display/hero */
  --font-pixel-grid: 'Geist Pixel Grid', var(--font-mono);     /* Loading/skeleton */
  --font-pixel-line: 'Geist Pixel Line', var(--font-mono);     /* Decorative alt */

  /* ── Type scale (modular, 1.2 ratio) ── */
  --text-xs:    0.694rem;   /* 11.1px — timestamps, badges */
  --text-sm:    0.833rem;   /* 13.3px — captions, metadata */
  --text-base:  1rem;       /* 16px   — body text */
  --text-md:    1.2rem;     /* 19.2px — subheadings */
  --text-lg:    1.44rem;    /* 23px   — section heads */
  --text-xl:    1.728rem;   /* 27.6px — page titles */
  --text-2xl:   2.074rem;   /* 33.2px — hero text */
  --text-3xl:   2.488rem;   /* 39.8px — display */

  /* ── Font weights ── */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ── Line heights ── */
  --leading-tight:   1.2;   /* Headings */
  --leading-normal:  1.5;   /* Body text */
  --leading-relaxed: 1.65;  /* Long-form reading */

  /* ── Letter spacing ── */
  --tracking-tight:  -0.02em;  /* Large headings */
  --tracking-normal:  0em;
  --tracking-wide:    0.08em;  /* ALL-CAPS labels (Factory style) */
  --tracking-mono:    0em;     /* Monospace — already wide */
}
```

### Type Roles

| Role | Font | Weight | Size | Tracking | Case | Example |
|------|------|--------|------|----------|------|---------|
| **Display** | `--font-pixel` | 700 | `--text-3xl` | `--tracking-tight` | Mixed | Hero headings, splash text |
| **Page title** | `--font-sans` | 600 | `--text-xl` | `--tracking-tight` | Mixed | "Settings", "Sessions" |
| **Section head** | `--font-sans` | 600 | `--text-lg` | `--tracking-tight` | Mixed | Panel headers |
| **Section label** | `--font-mono` | 500 | `--text-xs` | `--tracking-wide` | ALL-CAPS | `● VALUES`, `● FEATURES` (Factory eyebrow) |
| **Body** | `--font-sans` | 400 | `--text-base` | `--tracking-normal` | Mixed | Chat messages, descriptions |
| **Code / Terminal** | `--font-mono` | 400 | `--text-sm` | `--tracking-mono` | Mixed | Code blocks, CLI output, tool calls |
| **Nav items** | `--font-mono` | 400 | `--text-sm` | `--tracking-wide` | ALL-CAPS | Navigation labels (Factory pattern) |
| **Caption** | `--font-sans` | 400 | `--text-sm` | `--tracking-normal` | Mixed | Timestamps, model names, metadata |
| **Badge / Tag** | `--font-mono` | 500 | `--text-xs` | `--tracking-wide` | ALL-CAPS | Status pills, category tags |

### Pixel Font Variant Usage

The five Geist Pixel variants share identical metrics. Use them intentionally:

| Variant | CSS Variable | When |
|---------|-------------|------|
| **Square** | `--font-geist-pixel-square` | Default display/hero — classic bitmap |
| **Grid** | `--font-geist-pixel-grid` | Loading states, skeleton text, "scanning" feel |
| **Circle** | `--font-geist-pixel-circle` | Friendly moments — onboarding, success states |
| **Triangle** | `--font-geist-pixel-triangle` | Vercel-aligned moments, geometric emphasis |
| **Line** | `--font-geist-pixel-line` | Decorative background text, watermarks |

**Animation trick:** Because all five share metrics, you can animate between variants via `font-family` transitions — e.g., a loading indicator that morphs Grid → Square on completion.

---

## Spacing & Layout

### Spacing Scale

```css
:root {
  --space-0:    0;
  --space-1:    0.25rem;  /*  4px */
  --space-2:    0.5rem;   /*  8px */
  --space-3:    0.75rem;  /* 12px */
  --space-4:    1rem;     /* 16px */
  --space-5:    1.25rem;  /* 20px */
  --space-6:    1.5rem;   /* 24px */
  --space-8:    2rem;     /* 32px */
  --space-10:   2.5rem;   /* 40px */
  --space-12:   3rem;     /* 48px */
  --space-16:   4rem;     /* 64px */
  --space-20:   5rem;     /* 80px */
  --space-24:   6rem;     /* 96px */
}
```

### Border Radius

```css
:root {
  --radius-none: 0;
  --radius-sm:   4px;    /* Buttons, inputs, badges */
  --radius-md:   8px;    /* Cards, panels */
  --radius-lg:   12px;   /* Modals, dialogs, device frames */
  --radius-xl:   16px;   /* Outer containers */
  --radius-full: 9999px; /* Pills, avatars */
}
```

Factory leans toward tighter radii (8–12px). Geist uses slightly rounder. Our hybrid: **use `--radius-sm` for interactive elements, `--radius-md` for containers.**

### Borders

```css
:root {
  --border-width:  1px;
  --border-style:  solid;
  --border:        var(--border-width) var(--border-style) var(--border-default);
  --border-dashed: var(--border-width) dashed var(--border-default);

  /* Factory uses dotted separators in pricing — we adopt this for section dividers */
  --border-dotted: 2px dotted var(--border-subtle);
}
```

### Shadows

Minimal. Factory uses zero shadows — only borders for elevation. We add one subtle shadow for floating elements:

```css
:root {
  --shadow-none:    none;
  --shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md:      0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.7);
}
```

---

## Components

### Section Labels (Factory Pattern)

The orange-dot-prefixed all-caps label — Factory's signature pattern:

```css
.section-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.section-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--accent-500);
  flex-shrink: 0;
}
```

### Buttons

Two styles, borrowed from Factory with Geist's refinement:

```css
/* Primary — filled */
.btn-primary {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-inverse);
  background: var(--text-primary);     /* White bg on dark mode */
  border: 1px solid var(--text-primary);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: opacity 150ms ease;
}
.btn-primary:hover { opacity: 0.85; }

/* Secondary — outlined */
.btn-secondary {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  cursor: pointer;
  transition: border-color 150ms ease;
}
.btn-secondary:hover { border-color: var(--text-primary); }

/* Ghost — text only, arrow suffix */
.btn-ghost {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-secondary);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
}
.btn-ghost::after { content: ' →'; }
.btn-ghost:hover { color: var(--text-primary); }

/* Accent — for CTAs that need to pop */
.btn-accent {
  composes: btn-primary;
  color: var(--text-primary);
  background: var(--accent-500);
  border-color: var(--accent-500);
}
.btn-accent:hover { background: var(--accent-600); }
```

### Cards

```css
.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-6);
}

/* Highlighted card (active tier, selected item) */
.card-highlighted {
  composes: card;
  border-color: var(--border-strong);
}
```

### Tags / Chips (Factory section-label style)

```css
.tag {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-primary);
  background: var(--bg-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  line-height: 1;
}
.tag-accent {
  background: var(--accent-300);
  color: var(--accent-900);
}
```

### Terminal / Code Blocks

```css
.terminal {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-primary);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
}

/* Syntax highlighting — only accent + grays */
.terminal .keyword  { color: var(--accent-700); }
.terminal .string   { color: var(--accent-900); }
.terminal .comment  { color: var(--text-tertiary); font-style: italic; }
.terminal .function { color: var(--text-primary); }
.terminal .number   { color: var(--accent-500); }
.terminal .operator { color: var(--text-secondary); }

/* Run button (Factory pattern — inline in terminal) */
.terminal-run {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--bg-base);
  background: var(--accent-500);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
}
```

---

## Chat Interface Tokens

Specific tokens for the Office Agents chat panel:

```css
:root {
  /* ── Chat layout ── */
  --chat-max-width:      640px;
  --chat-message-gap:    var(--space-4);
  --chat-bubble-padding: var(--space-3) var(--space-4);
  --chat-input-height:   48px;

  /* ── Message bubbles ── */
  --chat-user-bg:        var(--bg-surface);
  --chat-user-border:    var(--border-default);
  --chat-user-text:      var(--text-primary);

  --chat-agent-bg:       transparent;
  --chat-agent-border:   none;
  --chat-agent-text:     var(--text-primary);

  /* ── Tool calls ── */
  --chat-tool-bg:        var(--bg-inset);
  --chat-tool-border:    var(--border-subtle);
  --chat-tool-accent:    var(--accent-500);
  --chat-tool-label:     var(--text-secondary);

  /* ── Input area ── */
  --chat-input-bg:       var(--bg-raised);
  --chat-input-border:   var(--border-default);
  --chat-input-text:     var(--text-primary);
  --chat-input-placeholder: var(--text-ghost);
  --chat-input-focus:    var(--accent-500);

  /* ── Status indicators ── */
  --chat-typing-color:   var(--accent-500);
  --chat-error-color:    var(--error);
  --chat-success-color:  var(--success);
}
```

---

## Motion

### Principles

1. **Functional, not decorative** — Motion communicates state changes, never entertains.
2. **Quick and precise** — Match the industrial feel. Nothing floaty or bouncy.
3. **Terminal-inspired** — Cursor blinks, text streams, instant reveals.

### Timing

```css
:root {
  --duration-instant:  75ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     400ms;
  --ease-default:      cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out:          cubic-bezier(0, 0, 0.25, 1);
  --ease-in-out:       cubic-bezier(0.42, 0, 0.58, 1);
}
```

### Patterns

| Pattern | Duration | Easing | Usage |
|---------|----------|--------|-------|
| Hover state | `--duration-fast` | `--ease-default` | Buttons, links, cards |
| Panel open | `--duration-normal` | `--ease-out` | Settings, dropdowns |
| Message appear | `--duration-fast` | `--ease-out` | Chat messages stream in |
| Skeleton pulse | `2s infinite` | `ease-in-out` | Loading states, use Geist Pixel Grid |
| Terminal cursor | `1s step-end infinite` | — | Blinking cursor in code/chat input |
| Pixel variant cycle | `--duration-slow` per step | `step-end` | Grid → Square on load completion |

### Pixel Font Loading Animation

```css
@keyframes pixel-resolve {
  0%   { font-family: var(--font-pixel-grid); opacity: 0.5; }
  60%  { font-family: var(--font-pixel-grid); opacity: 1; }
  100% { font-family: var(--font-pixel); opacity: 1; }
}

.loading-text {
  animation: pixel-resolve 1.2s var(--ease-out) forwards;
}
```

---

## Iconography

- **Style**: Outline, 1.5px stroke — matches Geist's Lucide icon set
- **Size**: 16px (inline), 20px (buttons), 24px (navigation)
- **Color**: `var(--text-secondary)` default, `var(--text-primary)` on hover
- **Factory markers**: Orange filled dot `●` for section labels only (not general bullets)
- **CTA arrows**: Use `→` character inline, not arrow icons

---

## Design Audit Checklist

When reviewing UI against this system:

- [ ] Background is `--bg-base` or `--bg-surface` — never arbitrary dark grays
- [ ] Only one chromatic color visible at a time (accent orange or a semantic color, not both)
- [ ] All-caps text uses `--font-mono` + `--tracking-wide` (never sans-serif all-caps)
- [ ] Section labels have the orange dot prefix
- [ ] Code/terminal text uses `--font-mono` with `--bg-inset`
- [ ] Interactive elements have `--radius-sm` (4px), containers have `--radius-md` (8px)
- [ ] No shadows except on overlays/modals — use borders for elevation
- [ ] Focus states use `--accent-500` outline
- [ ] Pixel font variants used only for display text, never body copy
- [ ] Gray values are warm-shifted (`--border-default: #4D4947`), not neutral

---

## Token Quick Reference

| Token | Dark | Light | Description |
|-------|------|-------|-------------|
| `--bg-base` | `#020202` | `#FAFAFA` | Page background |
| `--bg-surface` | `#111111` | `#F4F4F4` | Card/panel background |
| `--border-default` | `#4D4947` | `#E0DEDD` | Standard border |
| `--text-primary` | `#EEEEEE` | `#111111` | Primary text |
| `--text-secondary` | `#A49D9A` | `#6B6462` | Muted text |
| `--accent-500` | `#D15010` | `#D15010` | Brand orange (mode-stable) |
| `--font-sans` | Geist | — | Body, headings |
| `--font-mono` | Geist Mono | — | Nav, code, labels, badges |
| `--font-pixel` | Geist Pixel Square | — | Display, hero |

---

## Ancestry

| Decision | From Geist | From Factory | Hybrid |
|----------|-----------|-------------|--------|
| Color scale structure | 10-step numbered tokens | — | Adopted |
| Monotone palette | — | Black + white + one accent | Adopted, warm-shifted |
| Accent color | Amber scale | `#E8450A` / `#D15010` | Factory orange, Geist scale structure |
| Primary font | Geist Sans | Geist Sans (they use it!) | Geist Sans |
| Nav/label font | — | Geist Mono, ALL-CAPS | Adopted |
| Display font | Geist Pixel (new) | — | Added pixel variants |
| Border style | 1px solid, neutral | 1px solid, warm gray | Factory warm gray |
| Shadows | Subtle | None | Minimal (overlays only) |
| Radius | 8–16px | 8–12px | 4px interactive, 8px containers |
| Section labels | — | `● ALL-CAPS MONO` | Adopted as signature pattern |
| CTA style | — | Filled, ALL-CAPS, `→` suffix | Adopted |
| Dark mode bg | `#0A0A0A` | `#020202` | Factory's darker base |
| P3 color support | Full P3 scale | — | Available via Geist tokens |

---

*System version: 1.0 — March 2026*
*Heritage: Vercel Geist Design System + Factory Droid (basement.studio)*

---

## 2.2 Forge Office Agents Brief

*Source: `forge-office-agents-brief.md`*

We are designing a side panel plugin/extension for Office Word, Excel and Powerpoint. Do not actually design the interface yet until we get all the ideas and design principles in order first. It is supposed to be similar to the side panel AI Agents from Google Chrome, or Claude in Chrome, or Comet side panel. But tailored towards Word, Excel and Powerpoint. As in, chat box on the bottom, messages back and forth, animated elements for thinking, tool calls (different tool calls = different tool call icon/svg), settings, folder, chat tabs can located on the top of the plugin interface. We can start it off from there for now. Have consistence between the three plugins, same design language and family, and most of the action items and elements. Have them in their own individual lanes so that we can then work and expand each one as we go along. Thats kind of what I have in mind so far. We should probably build up a design.md document as well. And a design language/theme/token implementation, like the colors, element design, padding, shading, interactions, animations etc. We should think of all these things before implementing any actual apps. I have a few links and files to share that we can use/add for inspiration. The factory design language is somewhat what I had in mind, both light and dark aesthetics. We are also aiming for a hybrid between droid/Factory.ai and some of the nice vercel design principles. [**__https://v0-texture-library-creation.vercel.app/__**](https://v0-texture-library-creation.vercel.app/) - good for background chat ideas.

---

## 2.3 Forge Tokens (CSS)

*Source: `forge-tokens.css`*

```css
/*
 * FORGE DESIGN SYSTEM — CSS Custom Properties
 * Geist x Factory Droid | v1.0 | March 2026
 *
 * Usage: Add this file to your project, then reference tokens as var(--token-name).
 * Default theme is dark. Add data-theme="light" to <html> for light mode.
 *
 * Fonts: Load Geist via Google Fonts CDN:
 * <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
 */

/* ================================================
   DARK MODE (default)
   ================================================ */
:root,
[data-theme="dark"] {

  /* ── Backgrounds ── */
  --bg-base:        #020202;
  --bg-raised:      #0A0A0A;
  --bg-surface:     #111111;
  --bg-overlay:     #1A1A1A;
  --bg-inset:       #000000;

  /* ── Warm Gray Scale (10 steps) ── */
  --gray-100:       #1C1A19;
  --gray-200:       #242221;
  --gray-300:       #2E2C2A;
  --gray-400:       #3D3A39;
  --gray-500:       #4D4947;
  --gray-600:       #6B6462;
  --gray-700:       #8A8380;
  --gray-800:       #A49D9A;
  --gray-900:       #D0CDCC;
  --gray-1000:      #EEEEEE;

  /* ── Forge Orange Accent (10 steps) ── */
  --accent-100:     #1C0E04;
  --accent-200:     #2D1508;
  --accent-300:     #4A200D;
  --accent-400:     #6B2E12;
  --accent-500:     #D15010;
  --accent-600:     #E8650A;
  --accent-700:     #F07A1A;
  --accent-800:     #F5933D;
  --accent-900:     #FBBF7A;
  --accent-1000:    #FEF0DC;

  /* ── Borders ── */
  --border-subtle:  #2A2827;
  --border-default: #4D4947;
  --border-strong:  #8A8380;
  --border-focus:   var(--accent-500);

  /* ── Text ── */
  --text-primary:   #EEEEEE;
  --text-secondary: #A49D9A;
  --text-tertiary:  #6B6462;
  --text-ghost:     #3D3A39;
  --text-inverse:   #020202;

  /* ── Semantic Colors ── */
  --success:        hsl(135, 70%, 34%);
  --error:          hsl(358, 75%, 59%);
  --warning:        var(--accent-600);
  --info:           hsl(206, 100%, 50%);

  /* ── Shadows ── */
  --shadow-none:    none;
  --shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md:      0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.7);

  /* ── Semantic Blue (Geist-derived) ── */
  --blue-100:       hsl(216, 50%, 12%);
  --blue-200:       hsl(214, 59%, 15%);
  --blue-300:       hsl(213, 71%, 20%);
  --blue-400:       hsl(212, 78%, 23%);
  --blue-500:       hsl(211, 86%, 27%);
  --blue-600:       hsl(206, 100%, 50%);
  --blue-700:       hsl(212, 100%, 48%);
  --blue-800:       hsl(212, 100%, 41%);
  --blue-900:       hsl(210, 100%, 66%);
  --blue-1000:      hsl(206, 100%, 96%);

  /* ── Semantic Red (Geist-derived) ── */
  --red-100:        hsl(357, 37%, 12%);
  --red-200:        hsl(357, 46%, 16%);
  --red-300:        hsl(356, 54%, 22%);
  --red-400:        hsl(357, 55%, 26%);
  --red-500:        hsl(357, 60%, 32%);
  --red-600:        hsl(358, 75%, 59%);
  --red-700:        hsl(358, 75%, 59%);
  --red-800:        hsl(358, 69%, 52%);
  --red-900:        hsl(358, 100%, 69%);
  --red-1000:       hsl(353, 90%, 96%);

  /* ── Semantic Green (Geist-derived) ── */
  --green-100:      hsl(136, 50%, 9%);
  --green-200:      hsl(137, 50%, 12%);
  --green-300:      hsl(136, 50%, 14%);
  --green-400:      hsl(135, 70%, 16%);
  --green-500:      hsl(135, 70%, 23%);
  --green-600:      hsl(135, 70%, 34%);
  --green-700:      hsl(131, 41%, 46%);
  --green-800:      hsl(132, 43%, 39%);
  --green-900:      hsl(131, 43%, 57%);
  --green-1000:     hsl(136, 73%, 94%);

  /* ── Semantic Teal (Geist-derived) ── */
  --teal-100:       hsl(169, 78%, 7%);
  --teal-200:       hsl(170, 74%, 9%);
  --teal-300:       hsl(171, 75%, 13%);
  --teal-400:       hsl(171, 85%, 13%);
  --teal-500:       hsl(172, 85%, 20%);
  --teal-600:       hsl(172, 85%, 32%);
  --teal-700:       hsl(173, 80%, 36%);
  --teal-800:       hsl(173, 83%, 30%);
  --teal-900:       hsl(174, 90%, 41%);
  --teal-1000:      hsl(166, 71%, 93%);

  /* ── Typography ── */
  --font-sans:      'Geist', 'Geist Fallback', -apple-system, system-ui, sans-serif;
  --font-mono:      'Geist Mono', 'Geist Mono Fallback', 'SF Mono', 'Fira Code', monospace;
  --font-pixel:     'Geist Pixel Square', var(--font-mono);
  --font-pixel-grid:'Geist Pixel Grid', var(--font-mono);
  --font-pixel-line:'Geist Pixel Line', var(--font-mono);

  /* ── Type Scale (1.2 modular ratio) ── */
  --text-xs:        0.694rem;   /* 11.1px */
  --text-sm:        0.833rem;   /* 13.3px */
  --text-base:      1rem;       /* 16px   */
  --text-md:        1.2rem;     /* 19.2px */
  --text-lg:        1.44rem;    /* 23px   */
  --text-xl:        1.728rem;   /* 27.6px */
  --text-2xl:       2.074rem;   /* 33.2px */
  --text-3xl:       2.488rem;   /* 39.8px */

  /* ── Font Weights ── */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ── Line Heights ── */
  --leading-tight:   1.2;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;

  /* ── Letter Spacing ── */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.08em;

  /* ── Spacing Scale ── */
  --space-0:        0;
  --space-1:        0.25rem;   /*  4px */
  --space-2:        0.5rem;    /*  8px */
  --space-3:        0.75rem;   /* 12px */
  --space-4:        1rem;      /* 16px */
  --space-5:        1.25rem;   /* 20px */
  --space-6:        1.5rem;    /* 24px */
  --space-8:        2rem;      /* 32px */
  --space-10:       2.5rem;    /* 40px */
  --space-12:       3rem;      /* 48px */
  --space-16:       4rem;      /* 64px */
  --space-20:       5rem;      /* 80px */
  --space-24:       6rem;      /* 96px */

  /* ── Border Radius ── */
  --radius-none:    0;
  --radius-sm:      4px;
  --radius-md:      8px;
  --radius-lg:      12px;
  --radius-xl:      16px;
  --radius-full:    9999px;

  /* ── Motion ── */
  --duration-instant:  75ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     400ms;
  --ease-default:      cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out:          cubic-bezier(0, 0, 0.25, 1);
  --ease-in-out:       cubic-bezier(0.42, 0, 0.58, 1);

  /* ── Chat Interface ── */
  --chat-max-width:         640px;
  --chat-message-gap:       var(--space-4);
  --chat-bubble-padding:    var(--space-3) var(--space-4);
  --chat-input-height:      48px;
  --chat-user-bg:           var(--bg-surface);
  --chat-user-border:       var(--border-default);
  --chat-agent-bg:          transparent;
  --chat-tool-bg:           var(--bg-inset);
  --chat-tool-border:       var(--border-subtle);
  --chat-tool-accent:       var(--accent-500);
  --chat-input-bg:          var(--bg-raised);
  --chat-input-border:      var(--border-default);
  --chat-input-focus:       var(--accent-500);
  --chat-typing-color:      var(--accent-500);
}


/* ================================================
   LIGHT MODE
   ================================================ */
[data-theme="light"] {

  /* ── Backgrounds ── */
  --bg-base:        #FAFAFA;
  --bg-raised:      #FFFFFF;
  --bg-surface:     #F4F4F4;
  --bg-overlay:     #FFFFFF;
  --bg-inset:       #F0EFEE;

  /* ── Warm Gray Scale (inverted) ── */
  --gray-100:       #F8F7F6;
  --gray-200:       #F0EFEE;
  --gray-300:       #E0DEDD;
  --gray-400:       #D0CDCC;
  --gray-500:       #B8B3B0;
  --gray-600:       #8A8380;
  --gray-700:       #6B6462;
  --gray-800:       #4D4947;
  --gray-900:       #2E2C2A;
  --gray-1000:      #1C1A19;

  /* ── Borders ── */
  --border-subtle:  #EEEDEC;
  --border-default: #E0DEDD;
  --border-strong:  #B8B3B0;

  /* ── Text ── */
  --text-primary:   #111111;
  --text-secondary: #6B6462;
  --text-tertiary:  #A49D9A;
  --text-ghost:     #D0CDCC;
  --text-inverse:   #EEEEEE;

  /* ── Shadows (softer for light) ── */
  --shadow-sm:      0 1px 2px rgba(0, 0, 0, 0.06);
  --shadow-md:      0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-overlay: 0 8px 32px rgba(0, 0, 0, 0.12);

  /* ── Semantic Blue (light mode) ── */
  --blue-100:       hsl(216, 50%, 96%);
  --blue-600:       hsl(206, 100%, 50%);
  --blue-900:       hsl(212, 80%, 30%);

  /* ── Semantic Red (light mode) ── */
  --red-100:        hsl(353, 90%, 96%);
  --red-600:        hsl(358, 75%, 52%);
  --red-900:        hsl(357, 60%, 30%);

  /* ── Semantic Green (light mode) ── */
  --green-100:      hsl(136, 73%, 94%);
  --green-600:      hsl(135, 70%, 34%);
  --green-900:      hsl(135, 70%, 20%);
}
```

---

## 2.4 Forge Tokens (JSON)

*Source: `forge-tokens.json`*

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "name": "Forge",
  "version": "1.0.0",
  "heritage": ["Vercel Geist", "Factory Droid"],

  "color": {
    "background": {
      "base":    { "dark": "#020202", "light": "#FAFAFA" },
      "raised":  { "dark": "#0A0A0A", "light": "#FFFFFF" },
      "surface": { "dark": "#111111", "light": "#F4F4F4" },
      "overlay": { "dark": "#1A1A1A", "light": "#FFFFFF" },
      "inset":   { "dark": "#000000", "light": "#F0EFEE" }
    },
    "gray": {
      "100":  { "dark": "#1C1A19", "light": "#F8F7F6" },
      "200":  { "dark": "#242221", "light": "#F0EFEE" },
      "300":  { "dark": "#2E2C2A", "light": "#E0DEDD" },
      "400":  { "dark": "#3D3A39", "light": "#D0CDCC" },
      "500":  { "dark": "#4D4947", "light": "#B8B3B0" },
      "600":  { "dark": "#6B6462", "light": "#8A8380" },
      "700":  { "dark": "#8A8380", "light": "#6B6462" },
      "800":  { "dark": "#A49D9A", "light": "#4D4947" },
      "900":  { "dark": "#D0CDCC", "light": "#2E2C2A" },
      "1000": { "dark": "#EEEEEE", "light": "#1C1A19" }
    },
    "accent": {
      "100":  { "value": "#1C0E04" },
      "200":  { "value": "#2D1508" },
      "300":  { "value": "#4A200D" },
      "400":  { "value": "#6B2E12" },
      "500":  { "value": "#D15010" },
      "600":  { "value": "#E8650A" },
      "700":  { "value": "#F07A1A" },
      "800":  { "value": "#F5933D" },
      "900":  { "value": "#FBBF7A" },
      "1000": { "value": "#FEF0DC" }
    },
    "border": {
      "subtle":  { "dark": "#2A2827", "light": "#EEEDEC" },
      "default": { "dark": "#4D4947", "light": "#E0DEDD" },
      "strong":  { "dark": "#8A8380", "light": "#B8B3B0" },
      "focus":   { "value": "#D15010" }
    },
    "text": {
      "primary":   { "dark": "#EEEEEE", "light": "#111111" },
      "secondary": { "dark": "#A49D9A", "light": "#6B6462" },
      "tertiary":  { "dark": "#6B6462", "light": "#A49D9A" },
      "ghost":     { "dark": "#3D3A39", "light": "#D0CDCC" },
      "inverse":   { "dark": "#020202", "light": "#EEEEEE" }
    },
    "semantic": {
      "success": { "value": "hsl(135, 70%, 34%)" },
      "error":   { "value": "hsl(358, 75%, 59%)" },
      "warning": { "value": "#E8650A" },
      "info":    { "value": "hsl(206, 100%, 50%)" }
    }
  },

  "typography": {
    "fontFamily": {
      "sans":      "'Geist', 'Geist Fallback', -apple-system, system-ui, sans-serif",
      "mono":      "'Geist Mono', 'Geist Mono Fallback', 'SF Mono', 'Fira Code', monospace",
      "pixel":     "'Geist Pixel Square'",
      "pixelGrid": "'Geist Pixel Grid'",
      "pixelLine": "'Geist Pixel Line'"
    },
    "fontSize": {
      "xs":   { "rem": "0.694",  "px": 11.1 },
      "sm":   { "rem": "0.833",  "px": 13.3 },
      "base": { "rem": "1",      "px": 16 },
      "md":   { "rem": "1.2",    "px": 19.2 },
      "lg":   { "rem": "1.44",   "px": 23 },
      "xl":   { "rem": "1.728",  "px": 27.6 },
      "2xl":  { "rem": "2.074",  "px": 33.2 },
      "3xl":  { "rem": "2.488",  "px": 39.8 }
    },
    "fontWeight": {
      "regular":  400,
      "medium":   500,
      "semibold": 600,
      "bold":     700
    },
    "lineHeight": {
      "tight":   1.2,
      "normal":  1.5,
      "relaxed": 1.65
    },
    "letterSpacing": {
      "tight":  "-0.02em",
      "normal": "0em",
      "wide":   "0.08em"
    },
    "roles": [
      { "name": "Display",       "font": "pixel",  "weight": 700, "size": "3xl", "tracking": "tight",  "case": "mixed" },
      { "name": "Page Title",    "font": "sans",   "weight": 600, "size": "xl",  "tracking": "tight",  "case": "mixed" },
      { "name": "Section Head",  "font": "sans",   "weight": 600, "size": "lg",  "tracking": "tight",  "case": "mixed" },
      { "name": "Section Label", "font": "mono",   "weight": 500, "size": "xs",  "tracking": "wide",   "case": "uppercase" },
      { "name": "Body",          "font": "sans",   "weight": 400, "size": "base","tracking": "normal", "case": "mixed" },
      { "name": "Code",          "font": "mono",   "weight": 400, "size": "sm",  "tracking": "normal", "case": "mixed" },
      { "name": "Nav Item",      "font": "mono",   "weight": 500, "size": "sm",  "tracking": "wide",   "case": "uppercase" },
      { "name": "Caption",       "font": "sans",   "weight": 400, "size": "sm",  "tracking": "normal", "case": "mixed" },
      { "name": "Badge",         "font": "mono",   "weight": 500, "size": "xs",  "tracking": "wide",   "case": "uppercase" }
    ]
  },

  "spacing": {
    "0":  "0",
    "1":  "0.25rem",
    "2":  "0.5rem",
    "3":  "0.75rem",
    "4":  "1rem",
    "5":  "1.25rem",
    "6":  "1.5rem",
    "8":  "2rem",
    "10": "2.5rem",
    "12": "3rem",
    "16": "4rem",
    "20": "5rem",
    "24": "6rem"
  },

  "borderRadius": {
    "none": "0",
    "sm":   "4px",
    "md":   "8px",
    "lg":   "12px",
    "xl":   "16px",
    "full": "9999px"
  },

  "motion": {
    "duration": {
      "instant": "75ms",
      "fast":    "150ms",
      "normal":  "250ms",
      "slow":    "400ms"
    },
    "easing": {
      "default": "cubic-bezier(0.25, 0.1, 0.25, 1)",
      "out":     "cubic-bezier(0, 0, 0.25, 1)",
      "inOut":   "cubic-bezier(0.42, 0, 0.58, 1)"
    }
  }
}
```

---

## 2.5 Forge Buttons (CSS)

*Source: `forge-buttons.css`*

```css
/* Forge — Buttons
   Requires: tokens/forge.css */

.btn {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  text-decoration: none;
  line-height: 1;
  transition: all var(--duration-fast) var(--ease-default);
}

/* Primary — filled white (dark) / black (light) */
.btn-primary {
  color: var(--text-inverse);
  background: var(--text-primary);
  border: 1px solid var(--text-primary);
}
.btn-primary:hover { opacity: 0.85; }

/* Secondary — outlined */
.btn-secondary {
  color: var(--text-primary);
  background: transparent;
  border: 1px solid var(--border-strong);
}
.btn-secondary:hover { border-color: var(--text-primary); }

/* Ghost — text only, arrow suffix */
.btn-ghost {
  color: var(--text-secondary);
  background: none;
  border: 1px solid transparent;
  padding-left: 0;
  padding-right: 0;
}
.btn-ghost::after { content: ' \2192'; }
.btn-ghost:hover { color: var(--text-primary); }

/* Accent — orange CTA */
.btn-accent {
  color: var(--text-primary);
  background: var(--accent-500);
  border: 1px solid var(--accent-500);
}
.btn-accent:hover {
  background: var(--accent-600);
  border-color: var(--accent-600);
}

/* Danger — red destructive */
.btn-danger {
  color: var(--gray-1000);
  background: var(--error);
  border: 1px solid var(--error);
}
.btn-danger:hover { opacity: 0.85; }

/* Disabled state */
.btn:disabled,
.btn[disabled] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}
```

---

## 2.6 Forge Cards (CSS)

*Source: `forge-cards.css`*

```css
/* Forge — Cards
   Requires: tokens/forge.css */

.card {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-6);
  transition: border-color var(--duration-fast) var(--ease-default);
}
.card:hover {
  border-color: var(--border-strong);
}

/* Highlighted — active tier, selected */
.card-highlighted {
  border-color: var(--border-strong);
}

/* Card with accent border */
.card-accent {
  border-color: var(--accent-500);
}

/* Card content helpers */
.card-title {
  font-family: var(--font-sans);
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.card-description {
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}
```

---

## 2.7 Forge Chat (CSS)

*Source: `forge-chat.css`*

```css
/* Forge — Chat Interface Components
   Requires: tokens/forge.css */

/* Container */
.chat-panel {
  max-width: var(--chat-max-width);
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
  background: var(--bg-raised);
}
.chat-header-left {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.chat-header-icon {
  width: 28px; height: 28px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-bold);
  color: var(--accent-500);
}
.chat-header-title {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--text-primary);
}
.chat-model-tag {
  font-family: var(--font-mono);
  font-size: 9px;
  font-weight: var(--weight-medium);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-secondary);
  background: var(--gray-100);
  padding: 3px 8px;
  border-radius: var(--radius-sm);
}

/* Messages area */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--chat-message-gap);
}

/* User message */
.chat-msg-user {
  align-self: flex-end;
  max-width: 85%;
}
.chat-msg-user-bubble {
  background: var(--chat-user-bg);
  border: 1px solid var(--chat-user-border);
  border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm) var(--radius-lg);
  padding: var(--chat-bubble-padding);
  font-size: var(--text-base);
  line-height: var(--leading-normal);
  color: var(--text-primary);
}

/* Agent message */
.chat-msg-agent {
  align-self: flex-start;
  max-width: 90%;
}
.chat-msg-agent-bubble {
  padding: var(--space-1) 0;
  font-size: var(--text-base);
  line-height: var(--leading-relaxed);
  color: var(--gray-900);
}

/* Message meta */
.chat-msg-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-ghost);
  margin-top: var(--space-1);
  letter-spacing: 0.02em;
}

/* Tool call block */
.chat-tool-call {
  background: var(--chat-tool-bg);
  border: 1px solid var(--chat-tool-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin: var(--space-1) 0;
}
.chat-tool-call-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--gray-100);
  background: var(--bg-raised);
}
.chat-tool-call-dot {
  width: 6px; height: 6px;
  border-radius: var(--radius-full);
  background: var(--chat-tool-accent);
}
.chat-tool-call-name {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: 0.04em;
  color: var(--text-secondary);
}
.chat-tool-call-status {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--green-700);
  margin-left: auto;
}
.chat-tool-call-body {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: var(--leading-normal);
  color: var(--text-tertiary);
  padding: var(--space-3);
}

/* Typing indicator */
.chat-typing {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-2) 0;
}
.chat-typing-dot {
  width: 6px; height: 6px;
  border-radius: var(--radius-full);
  background: var(--chat-typing-color);
  animation: forge-pulse 1.4s ease-in-out infinite;
}
.chat-typing-dot:nth-child(2) { animation-delay: 0.2s; }
.chat-typing-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes forge-pulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}
.chat-typing-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-ghost);
  letter-spacing: 0.04em;
}

/* Input area */
.chat-input-area {
  padding: var(--space-3) var(--space-4);
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-raised);
}
.chat-input-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  padding: var(--space-1) var(--space-1) var(--space-1) var(--space-4);
  transition: border-color var(--duration-fast) var(--ease-default);
}
.chat-input-wrapper:focus-within {
  border-color: var(--chat-input-focus);
}
.chat-input-field {
  flex: 1;
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  padding: var(--space-2) 0;
}
.chat-input-field::placeholder {
  color: var(--text-ghost);
}
.chat-send-btn {
  width: 36px; height: 36px;
  background: var(--accent-500);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  font-size: 16px;
  flex-shrink: 0;
  transition: background var(--duration-fast) var(--ease-default);
}
.chat-send-btn:hover { background: var(--accent-600); }
```

---

## 2.8 Forge Inputs (CSS)

*Source: `forge-inputs.css`*

```css
/* Forge — Form Inputs
   Requires: tokens/forge.css */

.input {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-primary);
  background: var(--bg-inset);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  outline: none;
  width: 100%;
  transition: border-color var(--duration-fast) var(--ease-default);
}
.input:focus {
  border-color: var(--accent-500);
}
.input::placeholder {
  color: var(--text-ghost);
}
.input:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Label */
.input-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-tertiary);
  display: block;
  margin-bottom: var(--space-1);
}

/* Input group (label + input) */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
```

---

## 2.9 Forge Patterns (CSS)

*Source: `forge-patterns.css`*

```css
/* Forge — Factory Patterns
   Requires: tokens/forge.css
   Signature patterns inherited from Factory Droid */

/* ── Section Label (orange dot + ALL-CAPS mono) ── */
.section-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.section-label::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--accent-500);
  flex-shrink: 0;
}

/* ── Status Indicators ── */
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  display: inline-block;
}
.status-dot-success { background: var(--success); }
.status-dot-error   { background: var(--error); }
.status-dot-warning { background: var(--accent-500); }
.status-dot-info    { background: var(--info); }

.status-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

/* ── Bug Tracker Row (Factory pattern) ── */
.tracker-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  transition: border-color var(--duration-fast) var(--ease-default);
}
.tracker-row:hover {
  border-color: var(--border-default);
}
.tracker-id {
  color: var(--text-tertiary);
  min-width: 56px;
}
.tracker-title {
  color: var(--text-primary);
  flex: 1;
}

/* ── Dividers ── */
.divider {
  height: 1px;
  background: var(--border-subtle);
  border: none;
}
.divider-dotted {
  border: none;
  border-top: 2px dotted var(--border-subtle);
}

/* ── CTA with arrow (Factory pattern) ── */
.cta-arrow::after {
  content: ' \2192';
}

/* ── Nav item (Factory ALL-CAPS mono) ── */
.nav-item {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--duration-fast) var(--ease-default);
}
.nav-item:hover {
  color: var(--text-primary);
}
.nav-item.active {
  color: var(--accent-500);
}

/* ── Skeleton / Loading (uses Geist Pixel Grid concept) ── */
.skeleton {
  background: linear-gradient(
    90deg,
    var(--gray-200) 25%,
    var(--gray-300) 50%,
    var(--gray-200) 75%
  );
  background-size: 200% 100%;
  animation: forge-skeleton 2s ease-in-out infinite;
  border-radius: var(--radius-sm);
}
@keyframes forge-skeleton {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── Terminal cursor blink ── */
.cursor-blink::after {
  content: '\2588';
  animation: forge-blink 1s step-end infinite;
  color: var(--accent-500);
}
@keyframes forge-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```

---

## 2.10 Forge Tags (CSS)

*Source: `forge-tags.css`*

```css
/* Forge — Tags / Chips
   Requires: tokens/forge.css */

.tag {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.tag-default {
  color: var(--text-secondary);
  background: var(--gray-100);
}

.tag-accent {
  color: var(--accent-900);
  background: var(--accent-300);
}

.tag-success {
  color: var(--green-900);
  background: var(--green-100);
}

.tag-error {
  color: var(--red-900);
  background: var(--red-100);
}

.tag-info {
  color: var(--blue-900);
  background: var(--blue-100);
}
```

---

## 2.11 Forge Terminal (CSS)

*Source: `forge-terminal.css`*

```css
/* Forge — Terminal / Code Block
   Requires: tokens/forge.css
   Syntax highlighting uses only accent + grays (semi-monotone rule) */

.terminal {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--leading-relaxed);
  color: var(--text-secondary);
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  overflow-x: auto;
}

/* Window chrome */
.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
  padding-bottom: var(--space-3);
  border-bottom: 1px solid var(--gray-100);
}

.terminal-dots {
  display: flex;
  gap: 6px;
}
.terminal-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  background: var(--gray-300);
}

.terminal-title {
  font-size: var(--text-xs);
  color: var(--text-ghost);
  letter-spacing: 0.04em;
}

/* Run button (Factory pattern) */
.terminal-run {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--bg-base);
  background: var(--accent-500);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease-default);
}
.terminal-run:hover { background: var(--accent-600); }

/* Syntax highlighting — monotone palette */
.syntax-keyword  { color: var(--accent-500); }
.syntax-string   { color: var(--accent-900); }
.syntax-comment  { color: var(--text-ghost); font-style: italic; }
.syntax-function { color: var(--text-primary); }
.syntax-number   { color: var(--accent-700); }
.syntax-operator { color: var(--text-tertiary); }
.syntax-prompt   { color: var(--text-ghost); }

/* Inline code */
code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: 3px;
  color: var(--accent-900);
}
```

---

# 3. Nexora Mono Design System

---

## 3.1 Nexora Mono Design System (Documentation)

*Source: `nexora-mono-design-system.md`*

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

### Border Radius

```js
borderRadius: {
  lg: "var(--radius)",              // 0.5rem = 8px
  md: "calc(var(--radius) - 2px)",  // 6px
  sm: "calc(var(--radius) - 4px)",  // 4px
}
```

**In practice:** The page components use **zero border-radius** almost everywhere — cards, buttons, metrics boxes, and status indicators are all sharp rectangles. `rounded-full` is used only for status dots, the loading spinner, and nav scroll buttons.

### Border Styles

| Pattern | CSS | Usage |
|---------|-----|-------|
| Card border (inactive) | `border-2 border-gray-200` | Feature cards, metric boxes |
| Card border (active) | `border-2 border-black` | Active feature card, status panels |
| Card border (dark bg) | `border-2 border-gray-700` | Vercel section cards |
| Section divider | `border-t-2 border-gray-200` | Footer top border |
| Decorative line | `w-32 h-px bg-black` | Section heading underlines |
| Corner brackets | `border-t-2 border-l-2 border-black` | Feature card corner decorations |

---

## 3.2 Nexora Mono Design Guidelines

*Source: `nexora-mono-design-guidelines.md`*

# Visual & UX Design Guidelines

## Color System

The palette is **entirely monochromatic** — no hue, no saturation. Every color is a shade of gray, from near-black to near-white. This is a deliberate design choice: the textures themselves are the visual content, so the UI recedes into a neutral backdrop.

### Design Tokens — Light & Dark

| Token | Light | Dark | Semantic Role |
|---|---|---|---|
| `--background` | `#f7f7f7` | `#141414` | Page background |
| `--foreground` | `#1a1a1a` | `#fafafa` | Primary text |
| `--card` | `#efefef` | `#1a1a1a` | Card surfaces |
| `--card-foreground` | `#1a1a1a` | `#fafafa` | Card text |
| `--popover` | `#efefef` | `#1a1a1a` | Popover surfaces |
| `--popover-foreground` | `#1a1a1a` | `#fafafa` | Popover text |
| `--primary` | `#404040` | `#909090` | Primary interactive elements |
| `--primary-foreground` | `#fafafa` | `#0f0f0f` | Text on primary |
| `--secondary` | `#e8e8e8` | `#1f1f1f` | Secondary surfaces (inputs, filters) |
| `--secondary-foreground` | `#333333` | `#b8b8b8` | Text on secondary |
| `--muted` | `#e8e8e8` | `#1f1f1f` | Muted backgrounds |
| `--muted-foreground` | `#555555` | `#707070` | De-emphasized text (labels, tags) |
| `--accent` | `#404040` | `#909090` | Accent = same as primary |
| `--accent-foreground` | `#fafafa` | `#0f0f0f` | Text on accent |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.577 0.245 27.325)` | Error/danger (the only chromatic color — red) |
| `--border` | `#d4d4d4` | `#333333` | Default borders |
| `--input` | `#e8e8e8` | `#1f1f1f` | Input backgrounds |
| `--ring` | `#404040` | `#555555` | Focus ring |
| `--pattern` | `hsl(0 0% 29%)` | `hsl(0 0% 59%)` | **Texture rendering color** |
| `--card-border` | `#d4d4d4` | `#242424` | Card-specific border |

### Chart Colors (Monochromatic Scale)

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#555555` | `#555555` |
| `--chart-2` | `#707070` | `#707070` |
| `--chart-3` | `#909090` | `#909090` |
| `--chart-4` | `#b8b8b8` | `#b8b8b8` |
| `--chart-5` | `#d4d4d4` | `#d4d4d4` |

### Key Design Decision

The `--pattern` token is separate from `--foreground` to allow independent control over texture rendering density/contrast. In light mode, patterns render at 29% gray; in dark mode, at 59% gray.

## Typography

### Font Families

| Family | Role | CSS Variable | Source |
|---|---|---|---|
| **Work Sans** | Primary UI font (headings, labels, body) | `--font-sans` | Google Fonts via `next/font` |
| **JetBrains Mono** | Monospace accents (card index numbers, theme switcher labels) | `--font-mono` | Google Fonts via `next/font` |

### Typography Patterns

- **Uppercase labels everywhere** — Subtitles, filter labels, tags, and count text all use uppercase with generous letter-spacing (0.08em–0.3em). This creates a technical/engineering document aesthetic.
- **Monospace for data** — Card index numbers (`001`, `002`, etc.) and the specimen count use `font-mono`.
- **No large body text** — The largest readable text is the page title at ~22-36px. Everything else is 12px or smaller. The UI is dense and information-rich.
- **Truncation** — Card names use `truncate` (single-line ellipsis) to handle long names in the constrained card layout.

## Component Tokens

### Border Radius

The base `--radius` is **3px** — extremely tight, almost square. This is a deliberate departure from the shadcn/ui default (0.625rem = 10px) and reinforces the engineering-notebook aesthetic.

| Token | Value | Used By |
|---|---|---|
| `--radius-sm` | 1px (`3px - 2px`) | — |
| `--radius-md` | 3px | Default radius |
| `--radius-lg` | 5px (`3px + 2px`) | — |
| `--radius-xl` | 7px (`3px + 4px`) | — |

### Shadows

No custom shadows are used in the application components.

### Theming Strategy

1. **`next-themes`** manages theme state and applies a `dark` class to `<html>`
2. **CSS custom properties** in `app/globals.css` define all tokens under `:root` (light) and `.dark` (dark)
3. **Tailwind v4** maps these to `--color-*` theme variables via `@theme inline`
4. **The custom variant** `@custom-variant dark (&:is(.dark *))` enables `dark:` prefix in Tailwind

---

## 3.3 Nexora Mono Design (NexoraSIM)

*Source: `nexora-mono-design.md`*

# Architecture & Implementation Design

## Overview

**Notebooks** is a single-page web application that showcases a curated collection of 48 pure-CSS texture patterns. Users browse a filterable, sortable gallery of pattern cards, each rendering a live CSS preview. Clicking "Prompt" on any card copies a ready-to-use AI prompt string describing that texture's CSS to the clipboard.

## Tech Stack

| Role | Technology | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 | Uses React Server Components by default |
| **Language** | TypeScript | 5.7.3 | Strict mode |
| **UI Runtime** | React | 19.2.4 | React 19 |
| **Styling** | Tailwind CSS v4 | 4.2.0 | CSS-first config via `@theme inline` |
| **Animations** | tw-animate-css | 1.3.3 | Tailwind animation utilities |
| **Motion** | Framer Motion | 12.34.3 | Spring-based layout animations |
| **Component Library** | shadcn/ui (New York style) | — | ~50 Radix-based UI primitives installed |
| **Icons** | iconoir-react, lucide-react | 7.11.0 / 0.564.0 | iconoir used in custom components |
| **Theming** | next-themes | 0.4.6 | Class-based dark mode |
| **Fonts** | Work Sans, JetBrains Mono | Google Fonts via `next/font` | |

## Key Patterns

1. **CSS-only texture rendering** — Patterns rendered entirely via CSS `background-image` using gradients. `currentColor` enables theme reactivity.
2. **`"use client"` boundaries** — Only components that need browser APIs are client components.
3. **CVA variant system** — shadcn components use `class-variance-authority` for declarative variant/size props.
4. **Dual CSS files** — `app/globals.css` (active, customized) vs `styles/globals.css` (original shadcn defaults, unused reference).

---

## 3.4 Nexora Mono Architecture

*Source: `nexora-mono-architecture.md`*

# NexoraSIM™ — Architecture & Implementation Design

## Overview

NexoraSIM is a marketing/product landing page for an AI-driven eSIM and IoT connectivity platform targeting Myanmar's telecommunications market. It's a single-page application with five scrollable sections: hero with animated globe, core eSIM features, "OneX™ AI Engine" showcase, Vercel infrastructure details, and a footer with system status. The site is purely presentational with all "live metrics" simulated client-side via `setInterval`.

## Tech Stack

| Layer | Choice | Version | Notes |
|-------|--------|---------|-------|
| Framework | **Next.js** | 15.2.6 | App Router, React Server Components enabled |
| Language | **TypeScript** | ^5 | Strict mode |
| React | **React 19** | ^19 | Enables Server Components |

### Dependencies

**UI Primitives:** shadcn/ui + Radix (25 packages), CVA ^0.7.1, cmdk 1.0.4
**Icons:** lucide-react ^0.454.0
**Styling:** Tailwind CSS ^3.4.17, tailwind-merge, tailwindcss-animate, clsx
**Theming:** next-themes ^0.4.6 (installed but not wired)

## Architecture

Single route (`/`), single `page.tsx` as Server Component composing six client children. All data hardcoded, all metrics simulated via timers.

### Component Hierarchy

```
<html>                                          # layout.tsx (Server)
  <body>
    <main>                                      # page.tsx (Server)
      <Navigation />                            # Client — fixed top nav bar
      <Suspense fallback={<LoadingSpinner />}>
        <Hero />                                # Client — canvas particles + SVG globe
        <Features />                            # Client — 3 feature cards
        <AISection />                           # Client — AI panels + neural net
        <VercelSection />                       # Client — infra cards + deploy diagram
        <Footer />                              # Client — contact + status
      </Suspense>
    </main>
  </body>
</html>
```

### Animation Strategy

Heavy use of animations across three techniques:
1. **CSS animations** — `@keyframes` in globals.css
2. **Tailwind animation utilities** — `animate-pulse`, `animate-bounce`, etc.
3. **JavaScript-driven** — `setInterval` for React state, `requestAnimationFrame` for canvas

---

## 3.5 Nexora Mono Tokens (CSS)

*Source: `nexora-mono-tokens.css`*

```css
/*
 * NEXORA MONO DESIGN SYSTEM — CSS Custom Properties
 * Monochromatic Engineering Blueprint | v1.0 | March 2026
 *
 * Usage: Add this file to your project, then reference tokens as var(--token-name).
 * Default theme is light. Add class "dark" or data-theme="dark" for dark mode.
 *
 * Fonts: Load Inter + JetBrains Mono via Google Fonts CDN:
 * <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
 */

/* ================================================
   LIGHT MODE (default)
   ================================================ */
:root,
[data-theme="light"] {

  /* -- Backgrounds -- */
  --bg-base:        #FFFFFF;
  --bg-raised:      #FAFAFA;
  --bg-surface:     #F5F5F5;
  --bg-overlay:     #FFFFFF;
  --bg-inset:       #F0F0F0;

  /* -- Neutral Gray Scale (10 steps) -- */
  --gray-100:       #FAFAFA;
  --gray-200:       #F5F5F5;
  --gray-300:       #E5E5E5;
  --gray-400:       #D4D4D4;
  --gray-500:       #A3A3A3;
  --gray-600:       #737373;
  --gray-700:       #525252;
  --gray-800:       #404040;
  --gray-900:       #262626;
  --gray-1000:      #0A0A0A;

  /* -- Accent (monochromatic — black) -- */
  --accent-100:     #0A0A0A;
  --accent-200:     #1C1C1C;
  --accent-300:     #262626;
  --accent-400:     #404040;
  --accent-500:     #000000;
  --accent-600:     #171717;
  --accent-700:     #262626;
  --accent-800:     #525252;
  --accent-900:     #A3A3A3;
  --accent-1000:    #E5E5E5;

  /* -- Borders -- */
  --border-subtle:  #F5F5F5;
  --border-default: #E5E5E5;
  --border-strong:  #A3A3A3;
  --border-focus:   #000000;

  /* -- Text -- */
  --text-primary:   #000000;
  --text-secondary: #525252;
  --text-tertiary:  #737373;
  --text-ghost:     #D4D4D4;
  --text-inverse:   #FAFAFA;

  /* -- Semantic Colors -- */
  --success:        #16a34a;
  --error:          #ef4444;
  --warning:        #eab308;
  --info:           #2563eb;

  /* -- No Shadows (hierarchy via borders only) -- */
  --shadow-none:    none;
  --shadow-sm:      none;
  --shadow-md:      none;
  --shadow-overlay: none;

  /* -- Typography -- */
  --font-sans:      'Inter', system-ui, -apple-system, sans-serif;
  --font-mono:      'JetBrains Mono', 'SF Mono', 'Fira Code', monospace;

  /* -- Type Scale (1.25 major third ratio) -- */
  --text-xs:        0.75rem;    /* 12px */
  --text-sm:        0.875rem;   /* 14px */
  --text-base:      1rem;       /* 16px */
  --text-lg:        1.125rem;   /* 18px */
  --text-xl:        1.25rem;    /* 20px */
  --text-2xl:       1.5rem;     /* 24px */
  --text-3xl:       1.875rem;   /* 30px */
  --text-4xl:       2.25rem;    /* 36px */
  --text-5xl:       3rem;       /* 48px */
  --text-8xl:       6rem;       /* 96px */

  /* -- Font Weights -- */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* -- Line Heights -- */
  --leading-tight:   1.1;
  --leading-snug:    1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.65;

  /* -- Letter Spacing -- */
  --tracking-tight:  -0.02em;
  --tracking-normal:  0em;
  --tracking-wide:    0.08em;
  --tracking-wider:   0.12em;

  /* -- Spacing Scale -- */
  --space-0:        0;
  --space-1:        0.25rem;   /*  4px */
  --space-2:        0.5rem;    /*  8px */
  --space-3:        0.75rem;   /* 12px */
  --space-4:        1rem;      /* 16px */
  --space-5:        1.25rem;   /* 20px */
  --space-6:        1.5rem;    /* 24px */
  --space-8:        2rem;      /* 32px */
  --space-10:       2.5rem;    /* 40px */
  --space-12:       3rem;      /* 48px */
  --space-16:       4rem;      /* 64px */
  --space-20:       5rem;      /* 80px */
  --space-24:       6rem;      /* 96px */

  /* -- Border Radius -- */
  --radius-none:    0;
  --radius-sm:      4px;
  --radius-default: 8px;
  --radius-lg:      12px;
  --radius-full:    9999px;

  /* -- Motion -- */
  --duration-instant:  75ms;
  --duration-fast:     150ms;
  --duration-normal:   250ms;
  --duration-slow:     400ms;
  --ease-default:      cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-out:          cubic-bezier(0, 0, 0.25, 1);
  --ease-in-out:       cubic-bezier(0.42, 0, 0.58, 1);
}


/* ================================================
   DARK MODE
   ================================================ */
[data-theme="dark"],
.dark {

  /* -- Backgrounds -- */
  --bg-base:        #000000;
  --bg-raised:      #0A0A0A;
  --bg-surface:     #141414;
  --bg-overlay:     #171717;
  --bg-inset:       #000000;

  /* -- Neutral Gray Scale (inverted) -- */
  --gray-100:       #141414;
  --gray-200:       #1C1C1C;
  --gray-300:       #262626;
  --gray-400:       #404040;
  --gray-500:       #525252;
  --gray-600:       #737373;
  --gray-700:       #A3A3A3;
  --gray-800:       #D4D4D4;
  --gray-900:       #E5E5E5;
  --gray-1000:      #FAFAFA;

  /* -- Borders -- */
  --border-subtle:  #1C1C1C;
  --border-default: #404040;
  --border-strong:  #737373;
  --border-focus:   #FFFFFF;

  /* -- Text -- */
  --text-primary:   #FAFAFA;
  --text-secondary: #A3A3A3;
  --text-tertiary:  #737373;
  --text-ghost:     #404040;
  --text-inverse:   #000000;
}
```

---

## 3.6 Nexora Mono Tokens (JSON)

*Source: `nexora-mono-tokens.json`*

```json
{
  "$schema": "https://tr.designtokens.org/format/",
  "name": "Nexora Mono",
  "version": "1.0.0",
  "color": {
    "background": {
      "base": { "dark": "#000000", "light": "#FFFFFF" },
      "raised": { "dark": "#0A0A0A", "light": "#FAFAFA" },
      "surface": { "dark": "#141414", "light": "#F5F5F5" },
      "overlay": { "dark": "#171717", "light": "#FFFFFF" },
      "inset": { "dark": "#000000", "light": "#F0F0F0" }
    },
    "gray": {
      "100": { "dark": "#141414", "light": "#FAFAFA" },
      "200": { "dark": "#1C1C1C", "light": "#F5F5F5" },
      "300": { "dark": "#262626", "light": "#E5E5E5" },
      "400": { "dark": "#404040", "light": "#D4D4D4" },
      "500": { "dark": "#525252", "light": "#A3A3A3" },
      "600": { "dark": "#737373", "light": "#737373" },
      "700": { "dark": "#A3A3A3", "light": "#525252" },
      "800": { "dark": "#D4D4D4", "light": "#404040" },
      "900": { "dark": "#E5E5E5", "light": "#262626" },
      "1000": { "dark": "#FAFAFA", "light": "#0A0A0A" }
    },
    "accent": {
      "100": { "value": "#0A0A0A" },
      "200": { "value": "#1C1C1C" },
      "300": { "value": "#262626" },
      "400": { "value": "#404040" },
      "500": { "value": "#000000" },
      "600": { "value": "#171717" },
      "700": { "value": "#262626" },
      "800": { "value": "#525252" },
      "900": { "value": "#A3A3A3" },
      "1000": { "value": "#E5E5E5" }
    },
    "border": {
      "subtle": { "dark": "#1C1C1C", "light": "#F5F5F5" },
      "default": { "dark": "#404040", "light": "#E5E5E5" },
      "strong": { "dark": "#737373", "light": "#A3A3A3" },
      "focus": { "value": "#000000" }
    },
    "text": {
      "primary": { "dark": "#FAFAFA", "light": "#000000" },
      "secondary": { "dark": "#A3A3A3", "light": "#525252" },
      "tertiary": { "dark": "#737373", "light": "#737373" },
      "ghost": { "dark": "#404040", "light": "#D4D4D4" },
      "inverse": { "dark": "#000000", "light": "#FAFAFA" }
    },
    "semantic": {
      "success": { "value": "#16a34a" },
      "error": { "value": "#ef4444" },
      "warning": { "value": "#eab308" },
      "info": { "value": "#2563eb" }
    }
  },
  "typography": {
    "fontFamily": {
      "sans": "'Inter', system-ui, sans-serif",
      "mono": "'JetBrains Mono', monospace"
    },
    "fontSize": {
      "xs": { "rem": "0.75", "px": 12 },
      "sm": { "rem": "0.875", "px": 14 },
      "base": { "rem": "1", "px": 16 },
      "lg": { "rem": "1.125", "px": 18 },
      "xl": { "rem": "1.25", "px": 20 },
      "2xl": { "rem": "1.5", "px": 24 },
      "3xl": { "rem": "1.875", "px": 30 },
      "4xl": { "rem": "2.25", "px": 36 },
      "5xl": { "rem": "3", "px": 48 },
      "8xl": { "rem": "6", "px": 96 }
    },
    "fontWeight": {
      "regular": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    }
  },
  "spacing": {
    "0": { "$value": "0px" },
    "1": { "$value": "4px" },
    "2": { "$value": "8px" },
    "3": { "$value": "12px" },
    "4": { "$value": "16px" },
    "6": { "$value": "24px" },
    "8": { "$value": "32px" },
    "12": { "$value": "48px" },
    "16": { "$value": "64px" },
    "32": { "$value": "128px" }
  },
  "radius": {
    "none": { "$value": "0px" },
    "sm": { "$value": "4px" },
    "default": { "$value": "8px" },
    "lg": { "$value": "12px" },
    "full": { "$value": "9999px" }
  }
}
```

---

## 3.7 Nexora Mono App Globals (CSS)

*Source: `nexora-mono-app-globals.css`*

```css
@import 'tailwindcss';
@import 'tw-animate-css';

@custom-variant dark (&:is(.dark *));

:root {
  --background: #f7f7f7;
  --foreground: #1a1a1a;
  --card: #efefef;
  --card-foreground: #1a1a1a;
  --popover: #efefef;
  --popover-foreground: #1a1a1a;
  --primary: #404040;
  --primary-foreground: #fafafa;
  --secondary: #e8e8e8;
  --secondary-foreground: #333333;
  --muted: #e8e8e8;
  --muted-foreground: #555555;
  --accent: #404040;
  --accent-foreground: #fafafa;
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: #fafafa;
  --border: #d4d4d4;
  --input: #e8e8e8;
  --ring: #404040;
  --chart-1: #555555;
  --chart-2: #707070;
  --chart-3: #909090;
  --chart-4: #b8b8b8;
  --chart-5: #d4d4d4;
  --pattern: hsl(0 0% 29%);
  --card-border: #d4d4d4;
  --radius: 3px;
  --sidebar: #f4f4f4;
  --sidebar-foreground: #1a1a1a;
  --sidebar-primary: #404040;
  --sidebar-primary-foreground: #fafafa;
  --sidebar-accent: #e8e8e8;
  --sidebar-accent-foreground: #1a1a1a;
  --sidebar-border: #d4d4d4;
  --sidebar-ring: #404040;
}

.dark {
  --background: #141414;
  --foreground: #fafafa;
  --card: #1a1a1a;
  --card-foreground: #fafafa;
  --popover: #1a1a1a;
  --popover-foreground: #fafafa;
  --primary: #909090;
  --primary-foreground: #0f0f0f;
  --secondary: #1f1f1f;
  --secondary-foreground: #b8b8b8;
  --muted: #1f1f1f;
  --muted-foreground: #707070;
  --accent: #909090;
  --accent-foreground: #0f0f0f;
  --destructive: oklch(0.577 0.245 27.325);
  --destructive-foreground: #fafafa;
  --border: #333333;
  --input: #1f1f1f;
  --ring: #555555;
  --pattern: hsl(0 0% 59%);
  --card-border: #242424;
  --sidebar: #0f0f0f;
  --sidebar-foreground: #fafafa;
  --sidebar-primary: #909090;
  --sidebar-primary-foreground: #0f0f0f;
  --sidebar-accent: #1f1f1f;
  --sidebar-accent-foreground: #fafafa;
  --sidebar-border: #333333;
  --sidebar-ring: #555555;
}

@theme inline {
  --font-sans: 'Work Sans', 'Work Sans Fallback';
  --font-mono: 'JetBrains Mono', 'JetBrains Mono Fallback', ui-monospace, monospace;
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-pattern: var(--pattern);
  --color-card-border: var(--card-border);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);
  --radius-sm: calc(var(--radius) - 2px);
  --radius-md: var(--radius);
  --radius-lg: calc(var(--radius) + 2px);
  --radius-xl: calc(var(--radius) + 4px);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## 3.8 Nexora Mono Badges (CSS)

*Source: `nexora-mono-badges.css`*

```css
/* Nexora Mono — Badges
   Requires: tokens/nexora-mono.css */

.badge {
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  line-height: 1;
  white-space: nowrap;
}

/* ── Status dot ── */
.badge-dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* ── LIVE — green ── */
.badge-live {
  color: #16a34a;
  background: rgba(22, 163, 74, 0.08);
  border: 1px solid rgba(22, 163, 74, 0.2);
}
.badge-live .badge-dot {
  background: #16a34a;
  box-shadow: 0 0 6px rgba(22, 163, 74, 0.5);
}

/* ── READY — blue ── */
.badge-ready {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  border: 1px solid rgba(37, 99, 235, 0.2);
}
.badge-ready .badge-dot {
  background: #2563eb;
  box-shadow: 0 0 6px rgba(37, 99, 235, 0.5);
}

/* ── BUILDING — yellow ── */
.badge-building {
  color: #ca8a04;
  background: rgba(234, 179, 8, 0.08);
  border: 1px solid rgba(234, 179, 8, 0.2);
}
.badge-building .badge-dot {
  background: #eab308;
  box-shadow: 0 0 6px rgba(234, 179, 8, 0.5);
}

/* ── ERROR — red ── */
.badge-error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.badge-error .badge-dot {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

/* ── Neutral — gray (default) ── */
.badge-neutral {
  color: #525252;
  background: #F5F5F5;
  border: 1px solid #E5E5E5;
}
.badge-neutral .badge-dot {
  background: #A3A3A3;
}

/* ── Inverted (for dark backgrounds) ── */
.badge-inverted {
  color: #E5E5E5;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

/* Dark mode overrides */
.dark .badge-live,
[data-theme="dark"] .badge-live {
  background: rgba(22, 163, 74, 0.12);
  border-color: rgba(22, 163, 74, 0.25);
}
.dark .badge-ready,
[data-theme="dark"] .badge-ready {
  background: rgba(37, 99, 235, 0.12);
  border-color: rgba(37, 99, 235, 0.25);
}
.dark .badge-building,
[data-theme="dark"] .badge-building {
  background: rgba(234, 179, 8, 0.12);
  border-color: rgba(234, 179, 8, 0.25);
}
.dark .badge-neutral,
[data-theme="dark"] .badge-neutral {
  color: #A3A3A3;
  background: #1C1C1C;
  border-color: #404040;
}
```

---

## 3.9 Nexora Mono Buttons (CSS)

*Source: `nexora-mono-buttons.css`*

```css
/* Nexora Mono — Buttons
   Requires: tokens/nexora-mono.css */

.btn {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-default);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  text-decoration: none;
  line-height: 1;
  transition: all var(--duration-fast) var(--ease-default);
}

/* Primary — black fill */
.btn-primary {
  color: #FFFFFF;
  background: #000000;
  border: 1px solid #000000;
}
.btn-primary:hover {
  background: #262626;
  border-color: #262626;
}

/* Secondary — outlined */
.btn-secondary {
  color: #000000;
  background: transparent;
  border: 1px solid #E5E5E5;
}
.btn-secondary:hover {
  border-color: #000000;
}

/* Ghost — text only */
.btn-ghost {
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid transparent;
}
.btn-ghost:hover {
  background: #F5F5F5;
  color: var(--text-primary);
}

/* Danger — semantic red */
.btn-danger {
  color: #FFFFFF;
  background: var(--error);
  border: 1px solid var(--error);
}
.btn-danger:hover {
  opacity: 0.85;
}

/* Disabled state */
.btn:disabled,
.btn[disabled] {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── Dark mode inversions ── */
.dark .btn-primary,
[data-theme="dark"] .btn-primary {
  color: #000000;
  background: #FFFFFF;
  border-color: #FFFFFF;
}
.dark .btn-primary:hover,
[data-theme="dark"] .btn-primary:hover {
  background: #E5E5E5;
  border-color: #E5E5E5;
}

.dark .btn-secondary,
[data-theme="dark"] .btn-secondary {
  color: #FAFAFA;
  border-color: #404040;
}
.dark .btn-secondary:hover,
[data-theme="dark"] .btn-secondary:hover {
  border-color: #FAFAFA;
}

.dark .btn-ghost:hover,
[data-theme="dark"] .btn-ghost:hover {
  background: #1C1C1C;
}

/* ── Size variants ── */
.btn-sm {
  font-size: 0.6875rem;
  padding: var(--space-1) var(--space-3);
}

.btn-lg {
  font-size: var(--text-sm);
  padding: var(--space-3) var(--space-6);
}
```

---

## 3.10 Nexora Mono Cards (CSS)

*Source: `nexora-mono-cards.css`*

```css
/* Nexora Mono — Cards
   Requires: tokens/nexora-mono.css */

.card {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-6);
  transition: border-color var(--duration-fast) var(--ease-default);
}
.card:hover {
  border-color: #A3A3A3;
}

/* ── Feature Card ── */
.card-feature {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-6);
}
.card-feature .card-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}
.card-feature .card-description {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* ── Stat Card (large metric number) ── */
.card-stat {
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-6);
  text-align: left;
}
.card-stat .stat-value {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  color: var(--text-primary);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-1);
}
.card-stat .stat-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-tertiary);
}

/* ── Dark Variant ── */
.card-dark,
.dark .card,
[data-theme="dark"] .card {
  background: #171717;
  border-color: #404040;
}
.card-dark:hover,
.dark .card:hover,
[data-theme="dark"] .card:hover {
  border-color: #737373;
}
.card-dark .card-label,
.dark .card .card-label,
[data-theme="dark"] .card .card-label {
  color: #FAFAFA;
}
.card-dark .card-description,
.dark .card .card-description,
[data-theme="dark"] .card .card-description {
  color: #A3A3A3;
}
.card-dark .stat-value,
.dark .card .stat-value,
[data-theme="dark"] .card .stat-value {
  color: #FAFAFA;
}
.card-dark .stat-label,
.dark .card .stat-label,
[data-theme="dark"] .card .stat-label {
  color: #737373;
}

/* ── Card content helpers ── */
.card-title {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.card-description {
  font-family: var(--font-sans);
  font-size: var(--text-base);
  color: var(--text-secondary);
  line-height: var(--leading-normal);
}

/* ── Card Grid ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--space-4);
}
.card-grid-3 {
  grid-template-columns: repeat(3, 1fr);
}
```

---

## 3.11 Nexora Mono Inputs (CSS)

*Source: `nexora-mono-inputs.css`*

```css
/* Nexora Mono — Form Inputs
   Requires: tokens/nexora-mono.css */

.input {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-2) var(--space-3);
  outline: none;
  width: 100%;
  transition: border-color var(--duration-fast) var(--ease-default);
}
.input:focus {
  border-color: #000000;
  border-width: 2px;
  padding: calc(var(--space-2) - 1px) calc(var(--space-3) - 1px);
}
.input::placeholder {
  color: var(--text-ghost);
}
.input:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  background: #F5F5F5;
}

/* ── Label ── */
.input-label {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--text-secondary);
  display: block;
  margin-bottom: var(--space-1);
}

/* ── Input Group (label + input) ── */
.input-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* ── Search Input ── */
.input-search {
  position: relative;
}
.input-search .input {
  padding-left: var(--space-10);
}
.input-search .input:focus {
  padding-left: calc(var(--space-10) - 1px);
}
.input-search-icon {
  position: absolute;
  left: var(--space-3);
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-tertiary);
  pointer-events: none;
}

/* ── Textarea ── */
.textarea {
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  color: var(--text-primary);
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-3);
  outline: none;
  width: 100%;
  min-height: 120px;
  resize: vertical;
  transition: border-color var(--duration-fast) var(--ease-default);
}
.textarea:focus {
  border-color: #000000;
  border-width: 2px;
  padding: calc(var(--space-3) - 1px);
}

/* ── Select ── */
.select {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--text-primary);
  background: #FFFFFF;
  border: 1px solid #E5E5E5;
  border-radius: var(--radius-default);
  padding: var(--space-2) var(--space-8) var(--space-2) var(--space-3);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: border-color var(--duration-fast) var(--ease-default);
}
.select:focus {
  border-color: #000000;
  border-width: 2px;
}

/* ── Dark Mode ── */
.dark .input,
[data-theme="dark"] .input {
  background: #0A0A0A;
  border-color: #404040;
  color: #FAFAFA;
}
.dark .input:focus,
[data-theme="dark"] .input:focus {
  border-color: #FFFFFF;
}
.dark .input-label,
[data-theme="dark"] .input-label {
  color: #A3A3A3;
}
```

---

# 4. Factory Droid Reference

---

## 4.1 Factory Droid Analysis

*Source: `factory-droid-analysis.md`*

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
| `brand-w` | CSS var -- white, with opacity variants |

### Key Color Principles

1. **Semi-monotone base** -- warm grays and blacks, not pure blue-blacks.
2. **Single accent color** -- orange is the ONLY chromatic color.
3. **Three-tier text hierarchy** -- foreground (primary), base-300 (secondary), base-500 (tertiary).
4. **Border-driven separation** -- `border-base-800` replaces shadows for visual hierarchy.
5. **No gradients** -- transitions are functional, not decorative.

---

## 3. Typography

### Font Stack

| Context | Factory.ai | basement.studio |
|---------|------------|-----------------|
| Body / UI | System sans-serif (`font-sans`) | Inter + system fallbacks |
| Code / metadata | `font-mono` (system monospace) | Monospace for technical specs |
| Display / headlines | Sans-serif (14-48px range) | **Basement Grotesque** (custom, weight 800) |

### Typography Treatment

- ALL-CAPS for navigation labels, section identifiers, CTAs, metadata labels
- Monospace for ALL metadata, labels, navigation -- not just code
- Font weight is restrained -- even headings use `font-normal` (weight 400-500)
- Size contrast does the hierarchy work, not weight contrast

---

## 4. Layout & Grid

```
Mobile:  4-column grid, gap-x-4 (16px gaps), px-4 (16px padding)
Desktop: 12-column grid, gap-x-6 (24px gaps), px-8 to px-9 (32-36px padding)
Max:     max-w-[1920px] container constraint
```

### Layout Principles

1. **Border-driven hierarchy** -- full-width horizontal dividers separate sections. No card shadows.
2. **Hard edges** -- basement.studio uses NO rounded corners. Factory.ai uses subtle rounding.
3. **Sticky navigation elements** -- header sticky with border-bottom.
4. **Invert sections** -- sections flip between dark-on-light and light-on-dark.
5. **Background texture** -- Factory uses `bg-[url("/assets/bg-lines.png")]` for subtle line-pattern textures.

---

## 5. Component Patterns

### Section Labels (Orange Dot Prefix)

Pattern: `[orange dot] + [ALL-CAPS MONOSPACE LABEL]`

### Navigation

- Sticky header with logo left, nav center/right, auth buttons far right
- Animated underline on hover
- Text color shifts to orange on hover

### Cards / Feature Blocks

- Dark background with `border-base-800` (1px border)
- `rounded-xl` or `rounded-2xl`
- No shadow -- border-only separation
- SVG icons at `size-10` (40px)

### CTAs and Links

- Text links with animated underline (not button-shaped)
- Arrow-right icon pattern for navigation CTAs
- Pill-shaped tag labels with uppercase text
- Transition timing: `duration-200` to `duration-300`

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

---

## 7. Concrete CSS / Design Token Patterns

### Recommended Token Map for Reimplementation

```css
:root {
  /* Backgrounds */
  --bg-primary: #0a0a0a;
  --bg-secondary: #111111;
  --bg-surface: #1a1a1a;
  --bg-invert: #ffffff;

  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #999999;
  --text-muted: #666666;
  --text-invert: #0a0a0a;

  /* Accent */
  --accent: #f97316;
  --accent-vivid: #ff4d00;
  --accent-muted: rgba(249, 115, 22, 0.15);

  /* Borders */
  --border-subtle: #1f1f1f;
  --border-default: #262626;
  --border-strong: #333333;

  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, 'SF Mono', 'Fira Code', monospace;
  --font-display: 'Basement Grotesque', var(--font-sans);

  /* Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.625rem;
  --text-2xl: 1.875rem;
  --text-3xl: 2.25rem;
  --text-4xl: 3rem;

  /* Spacing */
  --gap-sm: 1rem;
  --gap-md: 1.5rem;
  --space-section: 5rem;
  --space-section-lg: 7.5rem;

  /* Borders */
  --radius-sm: 0.5rem;
  --radius-md: 0.75rem;
  --radius-lg: 1rem;
  --radius-xl: 1.5rem;

  /* Transitions */
  --transition-fast: 200ms;
  --transition-normal: 300ms;
}
```

---

## 8. basement.studio Technical Stack

- **Framework**: Next.js + TypeScript
- **Styling**: Tailwind CSS (2025 site), previously Stitches CSS-in-JS
- **Animation**: GSAP, Locomotive Scroll
- **3D/Visual**: WebGL, OGL, Three.js (React Three Fiber), GLSL shaders
- **Font**: Basement Grotesque (open source, SIL OFL 1.1) -- 413 glyphs, weight 800
- **CMS**: Contentful
- **Deploy**: Vercel

---

## 9. Reference URLs

- Factory.ai main: https://factory.ai
- basement.studio: https://basement.studio
- Basement Grotesque specimen: https://grotesque.basement.studio
- Basement Foundry: https://foundry.basement.studio/fonts/grotesque
- Basement Grotesque GitHub: https://github.com/basementstudio/basement-grotesque

---

## 4.2 Forge Factory Droid Research

*Source: `forge-factory-droid-research.md`*

## Factory — Design Principles & Visual Information Extracted

Here is a comprehensive breakdown of every design principle, visual token, and UI pattern observed across the entire showcase page.

---

### Color Palette

The color palette is clearly displayed in the hero section as vertical swatches:

| Token | Value / Description |
| :-- | :-- |
| **Primary / Brand Orange** | `#E8450A` or similar warm burnt orange — used for accent dots, active states, CTAs, numbered list markers, and the "Showcase" nav highlight |
| **Near-Black / Background** | Deep charcoal/black `#111111` or `#0D0D0D` — primary background for dark UI sections |
| **Pure White** | `#FFFFFF` — used for text on dark backgrounds and the light UI section background |
| **Light Gray** | `#D0D0D0` or similar — used in the color swatch strip |
| **Medium Gray** | `#999999` — secondary text, subtle UI elements |
| **Dark Gray** | `#444444` / `#555555` — used in the color strip transition between black and light |

The palette is deliberately minimal: **black + white + one orange accent**.

---

### Typography

**Typeface Style:** Monospace / terminal-influenced for code/feature blocks; sans-serif for headlines and body text.

| Usage | Style |
| :-- | :-- |
| **Hero Logotype "FACTORY"** | All-caps, wide-tracking, bold geometric sans-serif |
| **Section Headlines** | Large, high-contrast serif or geometric sans |
| **Body Copy** | Small, regular weight sans-serif; tight line height |
| **Code / Terminal Text** | Monospace font; lowercase commands like `droid --task "fix the bug in $1."` |
| **Section Labels** | Small all-caps spaced labels (e.g., "VALUES", "OUR INVESTORS") accompanied by an orange dot |
| **Navigation Items** | Small, regular weight caps or mixed case; active state in orange |

---

### Logo & Iconography

- **Logo:** A stylized **snowflake / asterisk-like geometric mark** — an 8-pointed radial symbol
- **Icon style:** Pixel-friendly, outline-based, very minimal
- **Bullet markers:** Orange filled circles (`●`) as section-label prefixes
- **Arrow CTA:** `→` character used inline in button labels

---

### Layout & Grid

- **Two-column split:** Fixed left sidebar + scrollable right content area
- **Full-bleed content sections** alternate between light and dark backgrounds
- **Masonry / mosaic grid** for product screenshot galleries
- **Card-based layout** for mobile mockups and feature showcases

---

### UI Components Shown

| Component | Design Notes |
| :-- | :-- |
| **Navigation bar** | Top, horizontal, minimal. LOG IN = outlined white; CONTACT SALES = black filled. |
| **CTA Buttons** | Two styles: black-filled + outlined. Arrow `→` appended inline. |
| **Section label chips** | Small pill-shaped tags with colored fill for content categorization |
| **Terminal / CLI mockup** | Dark screen with orange-highlighted syntax, `RUN` button |
| **Bug tracker UI** | Rows with orange for active/in-progress, white check for resolved |
| **Pricing table** | Light background, 4 tiers, feature checklist layout per column |

---

### Design Principles (Brand/Philosophy Layer)

1. **Industrial precision** — monospace type, terminal UIs, geometric marks, grid rigor.
2. **Autonomy-first messaging** — visual hierarchy foregrounds the "autonomous agent" concept.
3. **Developer-native aesthetic** — Dark mode UI, code syntax highlighting, CLI in marketing.
4. **Minimal color = maximum trust** — restrained palette signals enterprise-grade seriousness.
5. **Precision over decoration** — No gradients, no photography, no decorative illustration.
6. **Transparency and control** — UI patterns showing user-confirmable actions.
7. **Scalability signaling** — wide type, large section headings, institutional tone.

---

### Core Design Tokens Summary

| Token | Value |
| :-- | :-- |
| Primary accent | Orange (~`#E8450A`) |
| Background dark | Near-black (`#111`) |
| Background light | Off-white / light gray (`#F4F4F4`) |
| Text primary | White (on dark) / Black (on light) |
| Text secondary | Medium gray |
| Font style | Geometric sans + monospace pairing |
| Corner radius | 8–16px |
| Border style | 1px solid gray or white at low opacity |
| Section label prefix | Orange filled dot `●` |
| CTA style | Filled black or outlined, all-caps, arrow suffix |
| Logo mark | 8-point geometric snowflake/asterisk |

---

# 5. Icon Inventory

*Source: `icon-inventory.md`*

# Complete Icon & Visual Inventory

> Every icon, thumbnail, and visual needed for the Office Agents UI.
> Use this as a generation checklist. Each entry includes: name, where it appears, short visual description.

---

## Style Context Files

When generating icons, provide these files to the image generation model so it understands the theme:

| File | What it provides | Path |
|------|-----------------|------|
| Factory Droid Analysis | Industrial/terminal aesthetic rules, color tokens, typography, comparison table | `docs/ai/factory-droid-reference/design-system-analysis.md` |
| Forge Design System | Warm palette, orange accent, component patterns | `docs/ai/session-1-files/forge-DESIGN_SYSTEM.md` |
| Nexora Mono Design System | Structural discipline, border-only hierarchy, status dot glow | `docs/ai/session-1-files/nexora-mono-DESIGN_SYSTEM.md` |
| Tool Icons Spec | Per-tool icon concepts, animation states, design rules | `docs/ai/session-3-files/forge-tool-icons-SPEC.md` |

**Style summary for prompts:** Geometric, minimal, 1.5px stroke, sharp miter joins, no fill (outline only). 16x16 base grid. Aesthetic: industrial control panel meets futuristic terminal. Not retro, not friendly mobile app. Colors: white/dark-gray strokes on dark bg, accent orange (#D15010) for active states. No rounded soft shapes. No emojis. Think: factory floor instrument panel, engineering schematic, terminal dashboard.

---

## SECTION 1: Navigation & UI Icons (26 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 1 | `send` | Chat input (send button) | Geometric upward arrow. Sharp, angular. Not a paper airplane. |
| 2 | `plus` | Chat input (attachment button) | Simple + crosshair. 1.5px strokes. |
| 3 | `settings-gear` | Header tab, settings | 6-tooth gear. Geometric teeth, not rounded. |
| 4 | `folder-files` | Header tab (FILES) | Simple folder outline. Sharp corners. |
| 5 | `trash-delete` | File list, message actions | Rectangular bin with lid line. |
| 6 | `eye-visible` | Follow mode, password toggle | Open eye. Geometric oval + circle pupil. |
| 7 | `eye-off` | Follow mode off state | Same eye with diagonal strike line. |
| 8 | `sun` | Settings (theme: light) | Circle with 8 radiating lines. |
| 9 | `moon` | Settings (theme: dark) | Crescent. Sharp, geometric arc. |
| 10 | `chevron-up` | Collapsible sections | Simple `^` angle. |
| 11 | `chevron-down` | Collapsible sections | Simple `v` angle. |
| 12 | `chevron-left` | Back navigation | Simple `<` angle. |
| 13 | `chevron-right` | Forward, expand | Simple `>` angle. |
| 14 | `check` | Completed states, toggles | Simple checkmark. |
| 15 | `x-close` | Close buttons, dismiss | Two crossing diagonal strokes. |
| 16 | `square-stop` | Abort/stop streaming | Filled square (one icon that uses fill). |
| 17 | `spinner` | Loading states | Three-quarter circle arc. Animated rotation. |
| 18 | `search` | Search input | Magnifying glass. |
| 19 | `copy` | Code block copy | Two overlapping offset rectangles. |
| 20 | `edit-pencil` | Edit actions | Angled pencil at ~45 degrees. |
| 21 | `refresh` | Retry, reconnect | Two circular arrows forming a loop. |
| 22 | `warning-triangle` | Error states | Equilateral triangle + exclamation mark. |
| 23 | `info-circle` | Tooltips, info | Circle + centered "i" letter. |
| 24 | `plus-sm` | Add MCP, add item | Smaller + at 12px. |
| 25 | `minus` | Remove item | Horizontal line. |
| 26 | `upload` | File drop zone | Upward arrow with horizontal base line. |

---

## SECTION 2: Interaction Icons (6 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 27 | `expand` | Message container expand | Two diagonal arrows pointing outward. |
| 28 | `collapse` | Message container collapse | Two diagonal arrows pointing inward. |
| 29 | `drag-handle` | Reorderable items | 6-dot grid (2x3). |
| 30 | `pin` | Pinned messages | Angled pin/map tack. |
| 31 | `arrow-right` | CTA, navigation | Right-pointing arrow with tail. |
| 32 | `external-link` | Links opening externally | Square with escaping arrow. |

---

## SECTION 3: Header Status Grid Icons (14 icons across 4 categories)

### Phase Icons (7 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 33 | `phase-discuss` | Discuss | Two overlapping speech bubbles. |
| 34 | `phase-plan` | Plan | Clipboard with 3 horizontal lines. |
| 35 | `phase-execute` | Execute | Lightning bolt. Geometric zigzag. |
| 36 | `phase-verify` | Verify | Magnifying glass with checkmark inside. |
| 37 | `phase-waiting` | Waiting | Two vertical pause bars. |
| 38 | `phase-blocked` | Blocked | Circle with diagonal line (prohibition). |
| 39 | `phase-completed` | Completed | Circle with checkmark inside. |

### Permission Icons (4 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 40 | `perm-readonly` | Read-only | Minimal geometric latch in locked position. |
| 41 | `perm-confirm` | Confirm writes | Pencil with dot beside it. |
| 42 | `perm-confirm-risky` | Confirm risky | Pencil with warning triangle. |
| 43 | `perm-auto` | Full auto | Bolt/zap icon. |

### Follow Mode Icons (2 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 44 | `follow-on` | Auto-apply on | Eye icon in accent orange. |
| 45 | `follow-off` | Auto-apply off | Eye icon in muted/ghost color. |

### Diagnostics Icon

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 46 | `diagnostics-pulse` | 2x2 grid, bottom-right | Pulse/waveform (EKG blip). |

---

## SECTION 4: Chat-Specific Icons (8 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 47 | `history-clock` | Header (history button) | Clock face with counterclockwise arrow. |
| 48 | `brain` | Chat input (thinking picker) | Geometric brain outline. Circuit-board style. |
| 49 | `model-chip` | Chat input (model picker) | Processor/chip square with pin lines. |
| 50 | `scroll-to-bottom` | Floating action button | Downward chevron inside circle. |
| 51 | `new-chat-plus` | Header [+ NEW] button | Bolder plus icon (2px stroke). |
| 52 | `message-expand` | Message container | Small diagonal expand arrow (12px). |
| 53 | `cursor-block` | Streaming indicator | Filled rectangle 8x16px. Blinks. |
| 54 | `terminal-prompt` | Tool call headers | `>_` glyph. Factory Droid signature. |

---

## SECTION 5: Tool-Specific Icons (42 unique glyphs)

### Shared Tools (All Apps) — 8 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 55 | `tool-bash` | `bash` | `>_` prompt caret with cursor block. |
| 56 | `tool-read` | `read` | Three stacked lines with downward chevron. |
| 57 | `tool-pdf-to-text` | `pdf-to-text` | Document frame + arrow + text lines. |
| 58 | `tool-pdf-to-images` | `pdf-to-images` | Document frame + arrow + 2x2 grid. |
| 59 | `tool-docx-to-text` | `docx-to-text` | Pilcrow + arrow + text lines. |
| 60 | `tool-xlsx-to-csv` | `xlsx-to-csv` | Cell grid + arrow + comma. |
| 61 | `tool-web-search` | `web-search` | Circle with radar arc segments. |
| 62 | `tool-web-fetch` | `web-fetch` | Downward arrow through horizontal line. |

### Excel-Specific Tools — 16 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 63-73 | Various grid/cell manipulation icons | Excel tools | Grid-based metaphors for cell operations |
| 74-78 | Visual & escape tools | Screenshot, eval, VFS | Viewfinder, code brackets, grid conversions |

### PowerPoint-Specific Tools — 12 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 79-90 | Slide/shape/layer manipulation icons | PPT tools | Slide, text, XML, chart, master editing |

### Word-Specific Tools — 6 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 91-96 | Document structure icons | Word tools | Text lines, tree hierarchy, OOXML, pilcrow |

---

## SECTION 6: Status Dots (4 variants)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 97 | `dot-idle` | Tool idle | Gray circle, 8px. |
| 98 | `dot-running` | Tool running | Accent orange, pulse animation. |
| 99 | `dot-done` | Tool complete | Green, subtle glow. |
| 100 | `dot-error` | Tool error | Red, subtle glow. |

---

## SECTION 7: Session Status Icons (4 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 101 | `session-completed` | History card | Circle + checkmark, green. |
| 102 | `session-paused-plan` | History card | Clipboard + pause overlay. |
| 103 | `session-stopped-execute` | History card | Lightning + stop square. |
| 104 | `session-idle` | History card | Empty circle outline, gray. |

---

## SECTION 8: Settings-Specific Icons (6 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 105 | `key` | API key field | Small geometric key. |
| 106 | `shield-lock` | Permission mode | Hexagonal shield. |
| 107 | `sliders` | Advanced settings | Two horizontal lines with handles. |
| 108 | `palette` | Appearance | Circle divided into 4 quadrants. |
| 109 | `text-cursor` | Custom instructions | Text cursor between text lines. |
| 110 | `puzzle-piece` | MCP/tools section | Geometric puzzle piece. |

---

## TOTALS

| Category | Count |
|----------|-------|
| Navigation & UI | 26 |
| Interaction | 6 |
| Header Status Grid | 14 |
| Chat-Specific | 8 |
| Tool-Specific | 42 |
| Status Dots | 4 |
| Session Status | 4 |
| Settings | 6 |
| **TOTAL** | **110** |

---

## Generation Strategy

**Batch 1 — Navigation + Interaction (32 icons):** Most reusable and generic.
**Batch 2 — Header Status Grid (14 icons):** Dashboard indicators.
**Batch 3 — Chat + Settings (14 icons):** Side panel UI icons.
**Batch 4 — Tool icons, shared (8 icons):** Terminal-native tool glyphs.
**Batch 5 — Tool icons, Excel (16 icons):** Grid-heavy, data-manipulation metaphors.
**Batch 6 — Tool icons, PowerPoint (12 icons):** Slide/shape/layer metaphors.
**Batch 7 — Tool icons, Word (6 icons):** Document/paragraph/structure metaphors.
**Batch 8 — Status dots + Session status (8 items):** Colored circles and composite status indicators.

For each batch: All icons 16x16 base grid, 1.5px stroke, sharp miter joins, no fill. Outline style only (exception: status dots and cursor-block are filled). Export as individual SVGs with clean paths. Colors: single stroke color (white or currentColor), accent elements in #D15010. No rounded caps, no decorative elements, no gradients, no shadows.
