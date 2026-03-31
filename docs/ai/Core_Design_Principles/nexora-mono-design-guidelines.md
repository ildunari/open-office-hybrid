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
| `--pattern` | `hsl(0 0% 29%)` | `hsl(0 0% 59%)` | **Texture rendering color** — the CSS patterns use this via `currentColor` |
| `--card-border` | `#d4d4d4` | `#242424` | Card-specific border (slightly different from `--border` in dark) |

### Chart Colors (Monochromatic Scale)

| Token | Light | Dark |
|---|---|---|
| `--chart-1` | `#555555` | `#555555` |
| `--chart-2` | `#707070` | `#707070` |
| `--chart-3` | `#909090` | `#909090` |
| `--chart-4` | `#b8b8b8` | `#b8b8b8` |
| `--chart-5` | `#d4d4d4` | `#d4d4d4` |

### Special Colors

- **Blueprint texture** overrides the system with its own `backgroundColor: #1a2a4a` and `rgba(120,160,255,0.4)` blue grid lines — the only non-monochromatic element in the entire app.

### Key Design Decision

The `--pattern` token is separate from `--foreground` to allow independent control over texture rendering density/contrast. In light mode, patterns render at 29% gray; in dark mode, at 59% gray. Combined with `opacity: 0.5` on most cards, this keeps patterns visible but subtle.

## Typography

### Font Families

| Family | Role | CSS Variable | Source |
|---|---|---|---|
| **Work Sans** | Primary UI font (headings, labels, body) | `--font-sans` | Google Fonts via `next/font` |
| **JetBrains Mono** | Monospace accents (card index numbers, theme switcher labels) | `--font-mono` | Google Fonts via `next/font` |

### Type Scale (All Sizes Used)

| Size | Context | Weight | Additional Styles |
|---|---|---|---|
| `clamp(72px, 12vw, 140px)` | Header watermark "NOTEBOOK" | 700 (bold) | `tracking-[0.3em]`, uppercase, `-webkit-text-stroke: 1px`, transparent fill |
| `clamp(22px, 3vw, 36px)` | Page title "Notebooks" | 600 (semibold) | `tracking-[0.18em]`, uppercase, `leading-none` |
| `text-sm` (14px) | shadcn button base | 500 (medium) | — |
| `text-xs` (12px) | Card name (h3), input text, select text | 500 (medium) | `truncate` on card name |
| `11px` | Header description | 400 (normal) | `tracking-[0.08em]` |
| `10px` | Card index number, card category, filter labels, specimen count, copy button text, theme switcher labels | 400/500 | Various tracking values; labels are uppercase with `tracking-[0.2em]` |
| `9px` | Header subtitle "Pure CSS Patterns", card tag | 400 (normal) | `tracking-[0.22em]` / `tracking-widest`, uppercase |

### Typography Patterns

- **Uppercase labels everywhere** — Subtitles, filter labels, tags, and count text all use uppercase with generous letter-spacing (0.08em–0.3em). This creates a technical/engineering document aesthetic.
- **Monospace for data** — Card index numbers (`001`, `002`, etc.) and the specimen count use `font-mono`.
- **No large body text** — The largest readable text is the page title at ~22-36px. Everything else is 12px or smaller. The UI is dense and information-rich.
- **Truncation** — Card names use `truncate` (single-line ellipsis) to handle long names in the constrained card layout.

## Spacing & Layout

### Grid System

The primary content grid uses CSS Grid with responsive column counts:

```
grid-cols-1          → mobile (< 640px)
sm:grid-cols-2       → ≥ 640px
lg:grid-cols-3       → ≥ 1024px
xl:grid-cols-4       → ≥ 1280px
```

Cards have `gap-0` — they share borders and tile edge-to-edge with no gutters, creating a dense specimen-catalog feel.

### Page Padding

- Page content: `px-4 py-10 sm:px-6` (16px → 24px horizontal, 40px vertical)
- Header: `px-6 py-10 sm:px-10 sm:py-12` (24px/40px → 40px/48px)

### Card Internal Spacing

- Preview area: 4:3 aspect ratio (`aspect-[4/3]`)
- Card body padding: `p-3` (12px)
- Vertical gaps between metadata: `gap-2` (8px)
- Copy button area: `pt-1` (4px) with `border-t`

### Filter Bar Layout

- Mobile: stacked vertically (`flex-col`)
- Desktop (≥640px): horizontal row with items baseline-aligned (`sm:flex-row sm:items-end sm:justify-between`)
- Gap between filter sections: `gap-4` (16px)
- Search input: `max-w-xs` (320px max width)
- Label-to-input gap: `mb-1.5` (6px)

### Responsive Breakpoints

| Breakpoint | Value | Usage |
|---|---|---|
| `sm` | 640px | 2-column grid, horizontal filter layout, increased page padding |
| `lg` | 1024px | 3-column grid |
| `xl` | 1280px | 4-column grid |
| 768px | Custom (in hook) | `useIsMobile` threshold |

## Component Tokens

### Border Radius

The base `--radius` is **3px** — extremely tight, almost square. This is a deliberate departure from the shadcn/ui default (0.625rem = 10px) and reinforces the engineering-notebook aesthetic.

| Token | Value | Used By |
|---|---|---|
| `--radius-sm` | 1px (`3px - 2px`) | — |
| `--radius-md` | 3px | Default radius |
| `--radius-lg` | 5px (`3px + 2px`) | — |
| `--radius-xl` | 7px (`3px + 4px`) | — |

However, the custom components (TextureCard, TextureGrid) use **no border radius at all** — cards and inputs are sharp rectangles. The theme switcher uses `rounded` (4px) and `rounded-sm` (2px).

### Border Styles

- **Cards**: `border border-card-border` — uses the dedicated card border token
- **Header**: `border-b border-border` — bottom border only
- **Inputs/Selects**: `border border-border` — standard borders
- **Card internal divider**: `border-t border-border/50` — 50% opacity border
- **Hover effect on cards**: `hover:border-primary/40` — primary color at 40% opacity

### Shadows

No custom shadows are used in the application components. shadcn's `shadow-sm` and `shadow-xs` exist in the UI primitives but aren't applied in the visible UI.

### Transitions

| Element | Property | Value |
|---|---|---|
| Cards | `transition-colors` | Border color on hover |
| Inputs/Selects | `transition-colors` | Border color on focus |
| Copy button | `transition-colors` | Text color on hover |
| Theme switcher | Framer Motion spring | `stiffness: 400, damping: 30` |
| Copy feedback | `setTimeout` | 1500ms before reverting "Copied" → "Prompt" |

### Opacity Values

| Value | Usage |
|---|---|
| `0.5` | Texture pattern preview (all cards except Blueprint) |
| `0.5` | `border-border/50` card internal divider |
| `0.4` | `hover:border-primary/40` card hover border |
| `0.5` | `placeholder:text-muted-foreground/50` input placeholder |
| `0.7` | `text-muted-foreground/70` card category text |

## Interactive States

### Hover

```css
/* Card hover — border lightens toward primary */
.group:hover { border-color: var(--primary) / 40%; }

/* Copy button hover — text brightens */
.hover\:text-foreground:hover { color: var(--foreground); }

/* shadcn button (unused in custom UI) */
.hover\:bg-primary\/90:hover { background: var(--primary) / 90%; }
```

### Focus

```css
/* Inputs and selects — border changes to primary, no ring */
:focus { outline: none; border-color: var(--primary); }

/* shadcn components — 3px ring with 50% opacity */
:focus-visible { border-color: var(--ring); box-shadow: 0 0 0 3px var(--ring) / 50%; }
```

### Active/Pressed

No explicit active/pressed states in custom components. Theme switcher buttons have no distinct pressed state — the sliding indicator provides feedback.

### Disabled

shadcn components define `disabled:pointer-events-none disabled:opacity-50` but no custom components use disabled states.

### Cursor

No custom cursor behaviors defined. All interactive elements use the browser default pointer for buttons.

## Component Inventory

### Custom Components (Application-Specific)

| Component | Type | Description |
|---|---|---|
| `SiteHeader` | Server | Hero banner with watermark, title, subtitle, and theme toggle |
| `TextureGrid` | Client | Filter controls + responsive card grid |
| `TextureCard` | Client | Individual texture preview card with copy-to-clipboard |
| `ThemeProvider` | Client | Thin wrapper around `next-themes` ThemeProvider |
| `ThemeSwitcher` | Client | Animated 3-option theme toggle (System/Dark/Light) |

### shadcn/ui Components (Installed)

All use the **New York** style variant with CVA for variant management. Installed but **not imported** in the application — available for future use:

Accordion, AlertDialog, Alert, AspectRatio, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Empty, Field, Form, HoverCard, InputGroup, InputOTP, Input, Item, Kbd, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toast, Toaster, ToggleGroup, Toggle, Tooltip

### Variant System (CVA)

shadcn components use `class-variance-authority` for declarative variant props. Example from Button:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-white ...',
        outline: 'border bg-background shadow-xs ...',
        secondary: 'bg-secondary text-secondary-foreground ...',
        ghost: 'hover:bg-accent hover:text-accent-foreground ...',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)
```

Custom components **do not use CVA** — they apply Tailwind classes directly, consistent with their single-variant nature.

## Iconography

### Icon Libraries

| Library | Package | Usage |
|---|---|---|
| **iconoir-react** | `iconoir-react` v7.11.0 | Custom components: `Search` (filter bar), `Check` (copy confirmation) |
| **lucide-react** | `lucide-react` v0.564.0 | Configured as shadcn default but not visibly used |

### Inline SVGs

The ThemeSwitcher and TextureCard use **hand-crafted inline SVGs** rather than library icons:

- **System icon** — monitor with stand (14×14, strokeWidth 1.6)
- **Dark icon** — crescent moon (14×14, strokeWidth 1.6)
- **Light icon** — sun with rays (14×14, strokeWidth 1.6)
- **Copy/clipboard icon** — clipboard with document (14×14, strokeWidth 1.6)

All inline SVGs use `currentColor` for stroke, enabling them to adapt to the theme.

### Sizing Conventions

- Icon size in filter bar: `size-3.5` (14px)
- Icon size in copy button: 14×14 (inline SVG)
- Icon size in theme switcher: 14×14 (inline SVG)
- shadcn default: `[&_svg:not([class*='size-'])]:size-4` (16px)

## Theming Strategy

### How It Works

1. **`next-themes`** manages theme state and applies a `dark` class to `<html>`
2. **CSS custom properties** in `app/globals.css` define all tokens under `:root` (light) and `.dark` (dark)
3. **Tailwind v4** maps these to `--color-*` theme variables via `@theme inline`, making them available as utility classes (`bg-background`, `text-foreground`, etc.)
4. **The custom variant** `@custom-variant dark (&:is(.dark *))` enables `dark:` prefix in Tailwind

### Configuration

```tsx
// layout.tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
```

- **Default theme**: Dark (the app ships in dark mode)
- **System detection**: Enabled — the "System" option respects OS preference
- **Hydration**: `suppressHydrationWarning` on `<html>` prevents flash

### Properties That Change Between Modes

Every token in the design system changes between light and dark. The key inversions:

| Property | Light → Dark |
|---|---|
| Background | Near-white (#f7f7f7) → Near-black (#141414) |
| Foreground | Near-black (#1a1a1a) → Near-white (#fafafa) |
| Primary | Dark gray (#404040) → Mid gray (#909090) |
| Borders | Light gray (#d4d4d4) → Dark gray (#333333) |
| Pattern color | 29% brightness → 59% brightness |

### CSS Architecture

The theming relies on the **CSS custom properties + class toggling** pattern:

1. `:root` declares light-mode values
2. `.dark` class overrides with dark-mode values
3. `@theme inline` in Tailwind v4 registers these as theme tokens
4. Components use semantic class names (`bg-background`, `text-muted-foreground`) that resolve to the current theme's values

### Dual globals.css

There are two `globals.css` files:
- **`app/globals.css`** — The active stylesheet. Custom monochromatic palette with hex values, 3px radius, Work Sans + JetBrains Mono fonts, and the `--pattern`/`--card-border` custom tokens.
- **`styles/globals.css`** — The original shadcn/ui defaults. Uses oklch colors, Geist fonts, 0.625rem radius, and chromatic chart colors. **Not imported anywhere** — serves as a reference for the original shadcn values before customization.
