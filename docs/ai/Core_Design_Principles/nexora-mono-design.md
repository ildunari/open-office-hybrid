# Architecture & Implementation Design

## Overview

**Notebooks** is a single-page web application that showcases a curated collection of 48 pure-CSS texture patterns (notebook paper, fabric weaves, geometric grids, etc.). Users browse a filterable, sortable gallery of pattern cards, each rendering a live CSS preview. Clicking "Prompt" on any card copies a ready-to-use AI prompt string describing that texture's CSS to the clipboard. The app targets designers, developers, and AI-assisted workflows where someone needs a CSS background pattern and wants to describe or paste it quickly. The core user flow is: land on page → optionally filter/sort → visually scan patterns → copy the prompt for the one you want.

## Tech Stack

| Role | Technology | Version | Notes |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 16.1.6 | Uses React Server Components by default; `"use client"` directives opt specific components into client rendering |
| **Language** | TypeScript | 5.7.3 | Strict mode, `bundler` module resolution |
| **UI Runtime** | React | 19.2.4 | React 19 — enables async server components natively |
| **Styling** | Tailwind CSS v4 | 4.2.0 | PostCSS plugin (`@tailwindcss/postcss`), CSS-first config via `@theme inline` — no `tailwind.config.js` |
| **Animations** | tw-animate-css | 1.3.3 | Tailwind animation utilities |
| **Motion** | Framer Motion | 12.34.3 | Spring-based layout animations in ThemeSwitcher |
| **Component Library** | shadcn/ui (New York style) | — | ~50 Radix-based UI primitives installed; most are scaffolding, only a few are actively used |
| **Variant System** | class-variance-authority (CVA) | 0.7.1 | Used by shadcn components for variant/size prop mapping |
| **Class Merging** | clsx + tailwind-merge | 2.1.1 / 3.3.1 | Wrapped in `cn()` utility |
| **Icons** | iconoir-react, lucide-react | 7.11.0 / 0.564.0 | iconoir used in custom components; lucide configured as shadcn default |
| **Theming** | next-themes | 0.4.6 | Class-based dark mode (`attribute="class"`) |
| **Analytics** | @vercel/analytics | 1.6.1 | Vercel web analytics |
| **Fonts** | Work Sans, JetBrains Mono | Google Fonts via `next/font` | Work Sans = body/UI; JetBrains Mono = monospace accents |
| **Package Manager** | pnpm | — | Lock file present |

**Unused but installed dependencies** — The project scaffolded a full shadcn/ui component library (accordion, dialog, drawer, carousel, chart, form, sidebar, etc.) but only uses a small fraction. These are available for future expansion but add no runtime weight unless imported.

## Architecture

### Directory Tree

```
├── app/
│   ├── globals.css          ← Active CSS: design tokens, Tailwind v4 theme, dark mode
│   ├── layout.tsx           ← Root layout (Server Component): fonts, metadata, ThemeProvider
│   └── page.tsx             ← Home page (Server Component): SiteHeader + TextureGrid
├── components/
│   ├── site-header.tsx      ← Server Component: hero header with watermark
│   ├── texture-card.tsx     ← Client Component: individual pattern card with copy-to-clipboard
│   ├── texture-grid.tsx     ← Client Component: filter controls + responsive grid of cards
│   ├── theme-provider.tsx   ← Client Component: next-themes wrapper
│   ├── theme-switcher.tsx   ← Client Component: animated System/Dark/Light toggle
│   └── ui/                  ← ~50 shadcn/ui primitives (mostly unused scaffold)
├── hooks/
│   ├── use-texture-filter.ts ← Client hook: search, category, sort state + memoized filtering
│   ├── use-mobile.ts         ← Client hook: viewport width < 768px detection
│   └── use-toast.ts          ← Client hook: toast notification state machine (shadcn)
├── lib/
│   ├── textures.ts           ← Static data: Texture type, CATEGORIES const, 48 texture definitions, getPrompt()
│   └── utils.ts              ← cn() class merging utility
├── public/                   ← Static assets: favicons, OG image, placeholder images
├── styles/
│   └── globals.css           ← Default shadcn/ui tokens (NOT imported — shadowed by app/globals.css)
└── config files              ← next.config.mjs, tsconfig.json, postcss.config.mjs, components.json
```

### Rendering Strategy

The app is a **single-route application** with a hybrid rendering approach:

- **`/` (Home)** — The `page.tsx` and `layout.tsx` are **Server Components**. `SiteHeader` is also a Server Component (no interactivity). These render on the server and stream HTML.
- **Client boundary** — `TextureGrid` is the primary client boundary (`"use client"`). It pulls in `useTextureFilter` for interactive state and renders `TextureCard` children (also client components) that handle clipboard interactions.
- **ThemeProvider** and **ThemeSwitcher** are client components for dark/light mode toggling.

There is no SSR data fetching, no ISR, and no dynamic routes. All texture data is statically defined in `lib/textures.ts` and bundled at build time.

### Data Flow

```
lib/textures.ts (static array of 48 Texture objects)
        │
        ▼
useTextureFilter hook (client-side)
  ├── search state (string)
  ├── category state ("All" | category name)
  ├── sort state ("name" | "category")
  └── filtered: useMemo → filter by category + search → sort
        │
        ▼
TextureGrid (renders filtered array)
        │
        ▼
TextureCard × N (receives Texture + index)
  ├── Renders live CSS preview via inline style
  ├── Displays metadata (name, tag, category, index)
  └── Copy button → getPrompt(texture) → navigator.clipboard
```

### State Management

State is minimal and entirely local — no global store, no context (beyond theming), no URL state:

| State | Location | Scope |
|---|---|---|
| Theme (system/dark/light) | `next-themes` context via ThemeProvider | Global |
| Search query | `useState` in `useTextureFilter` | TextureGrid subtree |
| Category filter | `useState` in `useTextureFilter` | TextureGrid subtree |
| Sort key | `useState` in `useTextureFilter` | TextureGrid subtree |
| Copied feedback | `useState` in each `TextureCard` | Per-card |
| Mounted flag | `useState` in `ThemeSwitcher` | ThemeSwitcher |

## Component Hierarchy

```
RootLayout (Server)
├── ThemeProvider (Client) — next-themes wrapper
│   └── Page (Server)
│       └── <main>
│           ├── SiteHeader (Server)
│           │   ├── Watermark div (decorative, aria-hidden)
│           │   ├── Subtitle: "Pure CSS Patterns"
│           │   ├── Title: "Notebooks"
│           │   ├── Description text
│           │   └── ThemeSwitcher (Client)
│           │       └── 3× motion.button (System/Dark/Light)
│           │           └── Animated sliding indicator (motion.div)
│           └── TextureGrid (Client)
│               ├── Search input with icon
│               ├── Category <select>
│               ├── Sort <select>
│               ├── Count display ("{N} specimens")
│               └── Grid container
│                   └── TextureCard × N (Client)
│                       ├── Pattern preview div (CSS background)
│                       ├── Index number (mono)
│                       ├── Name (h3)
│                       ├── Tag label
│                       ├── Category text
│                       └── Copy "Prompt" button
└── Analytics (Vercel)
```

### Component Details

**SiteHeader** — Server component. Renders the hero banner with a large decorative "NOTEBOOK" watermark text using `-webkit-text-stroke` on a transparent element. Contains the page title, subtitle, description, and the ThemeSwitcher in the top-right.

**ThemeSwitcher** — Client component. A custom radio group with three options (System, Dark, Light). Uses Framer Motion springs for a sliding background indicator and expanding/collapsing labels. Each option shows an inline SVG icon; the active option also reveals its text label with a width animation. Handles SSR hydration mismatch by rendering a placeholder skeleton until mounted.

**TextureGrid** — Client component. Orchestrates the filter UI and card grid. Uses native `<input>` and `<select>` elements (not shadcn components) for the search, category, and sort controls. Displays a specimen count. Renders a CSS Grid of TextureCards.

**TextureCard** — Client component. Props: `{ t: Texture, index: number }`. Renders a 4:3 aspect ratio preview div whose CSS `backgroundImage` (and optionally `backgroundSize`, `backgroundPosition`) comes directly from the texture's `css` record. Uses `currentColor` set to `var(--pattern)` for theme-reactive coloring. The "Blueprint" texture is special-cased — it has its own `backgroundColor` and doesn't get the `opacity: 0.5` treatment others do. The copy button invokes `getPrompt(t)` to generate an AI-friendly description string and writes it to the clipboard.

**useTextureFilter** — Custom hook. Manages search/category/sort state and returns a memoized `filtered` array. Filtering checks name and tag against the search query (case-insensitive). Sorting can be alphabetical by name or by the predefined CATEGORIES order.

## Data Model

### Core Types

```typescript
// lib/textures.ts
export type Texture = {
  name: string       // Display name, e.g. "Crosshatch"
  slug: string       // URL-safe identifier, e.g. "crosshatch"
  category: string   // One of CATEGORIES values
  tag: string        // Short descriptor, e.g. "Classic", "Bujo", "PCB"
  css: Record<string, string>  // CSS properties to apply as inline styles
  // Common keys: backgroundImage (always), backgroundSize, backgroundPosition (sometimes)
  // Blueprint also includes backgroundColor
}

export const CATEGORIES = [
  "Geometric",        // 13 textures
  "Woven & Fabric",   // 10 textures
  "Nature & Organic",  // 9 textures
  "Technical",         // 6 textures
  "Decorative",        // 7 textures
  "Experimental",      // 5 textures (total: 48 + 2 = 50... actual count: 48)
] as const
```

### Data Source

All texture data is **statically defined** in `lib/textures.ts` as a hardcoded array of 48 objects. There are no APIs, databases, or external data sources. The `getPrompt()` function transforms a Texture into a copyable string:

```typescript
export function getPrompt(t: Texture): string {
  const entries = Object.entries(t.css)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ")
  return `Pure CSS texture "${t.name}" (${t.category}): ${entries} Use with color: currentColor for theming.`
}
```

### Hook State Types

```typescript
// hooks/use-texture-filter.ts
export type SortKey = "name" | "category"
// Returns: { search, setSearch, category, setCategory, sort, setSort, filtered, categories }
```

## Routing & Navigation

The app has a **single route**:

| Route | File | Rendering | Content |
|---|---|---|---|
| `/` | `app/page.tsx` | Server Component (static) | Full application — header + texture gallery |

There is no multi-page navigation, no dynamic routes, no API routes, and no middleware. The `layout.tsx` wraps all pages with fonts, ThemeProvider, and Vercel Analytics.

## Patterns & Conventions

### Naming Conventions

- **Files**: kebab-case (`texture-card.tsx`, `use-texture-filter.ts`)
- **Components**: PascalCase exports (`TextureCard`, `SiteHeader`)
- **Hooks**: `use-` prefix files, `use` prefix functions (`useTextureFilter`)
- **CSS variables**: kebab-case with semantic names (`--card-foreground`, `--muted-foreground`)
- **shadcn/ui components**: Use `data-slot` attributes for CSS targeting

### Import Aliases

Configured in `tsconfig.json`:
```json
{ "@/*": ["./*"] }
```
Used as `@/components/...`, `@/lib/...`, `@/hooks/...`.

### Key Patterns

1. **CSS-only texture rendering** — Patterns are rendered entirely via CSS `background-image` using `repeating-linear-gradient`, `repeating-radial-gradient`, and `radial-gradient`. No SVGs, no images, no canvas. The `currentColor` value enables theme reactivity.

2. **`"use client"` boundaries** — Only components that need browser APIs (useState, clipboard, framer-motion) are marked as client components. The page shell and header remain server components.

3. **Hydration safety** — ThemeSwitcher renders a placeholder until `useEffect` fires, preventing server/client mismatch for theme-dependent UI.

4. **CVA variant system** — shadcn components use `class-variance-authority` for declarative variant/size props. Custom components (TextureCard, TextureGrid) use plain Tailwind classes instead.

5. **Dual CSS files** — `app/globals.css` contains the active, customized design tokens (hex values, monochromatic palette, `--pattern` token, tight 3px radius). `styles/globals.css` contains the original shadcn/ui defaults (oklch values, 0.625rem radius) but is **not imported** — it exists as a reference/fallback.

6. **No error boundaries or loading states** — The app is entirely static with no data fetching, so there are no Suspense boundaries, loading.tsx, error.tsx, or not-found.tsx files.

### Build Configuration

- **TypeScript errors are ignored** during build (`ignoreBuildErrors: true`) — likely a v0/prototype concession
- **Images are unoptimized** (`unoptimized: true`) — no Next.js Image Optimization, suitable for static export
- **Generator meta tag** indicates this was scaffolded with `v0.app` (Vercel's AI UI generator)
