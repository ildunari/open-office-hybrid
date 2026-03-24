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
