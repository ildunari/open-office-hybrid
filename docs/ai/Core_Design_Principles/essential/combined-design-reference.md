# Combined Design Reference — Office Agents UI

> Single-file reference combining Forge Design System, Forge CSS tokens, and Factory Droid analysis.
> Use this file to give any AI agent or design tool the full aesthetic context in one shot.

---

## Table of Contents

1. [Forge Design System (Philosophy, Rules, Components)](#forge-design-system)
2. [Forge CSS Tokens (All Variables)](#forge-css-tokens)
3. [Factory Droid Analysis (Industrial/Terminal Aesthetic)](#factory-droid-analysis)

---

## Forge Design System

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

## Forge CSS Tokens

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

## Factory Droid Analysis

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
