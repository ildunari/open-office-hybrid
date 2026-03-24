# Office Agents UI/UX Redesign — Design Spec

**Date:** 2026-03-24
**Branch:** `redesign/ui-ux`
**Target:** Office Add-in side panel (Word, Excel, PowerPoint)
**Panel dimensions:** 350px wide, full height (~700-800px typical)

---

## 1. Design Language

### Visual Identity
A hybrid of four influences:
- **Forge** — Warm industrial palette, orange accent (#D15010), Geist fonts, terminal-native patterns, chat components
- **Nexora Mono** — Structural discipline, border-only hierarchy, status badges with glow dots, ALL-CAPS mono headings. Provides supplementary structural/badge tokens where Forge doesn't cover.
- **Vercel Geist** — Modern systematic precision, clean spacing, restrained motion
- **Anthropic** — Conversational interface patterns, input area layout (Claude.ai reference)

The result is a minimal, structured aesthetic with slight brutalist/wireframe character. Not retro 8-bit — futuristic ASCII-inspired if anything. Restrained color usage with orange accent dots for emphasis.

### Theme Priority
- **Light mode is primary.** Dark mode is optional via system auto-switch or manual toggle in Settings.
- Dark mode is intentional — matching color relationships, typography, and shadows. Not a lazy inversion.

### Color Tokens
Forge palette with warm gray undertones:

**Light mode (primary):**
- Base: `#FAFAFA`, Raised: `#FFFFFF`, Surface: `#F4F4F4`, Overlay: `#FFFFFF`, Inset: `#F0EFEE`
- Text primary: `#171717`, secondary: `#737373`, muted: `#A3A3A3`, ghost: `#D4D4D4`

**Dark mode:**
- Base: `#020202`, Raised: `#0A0A0A`, Surface: `#111111`, Overlay: `#1A1A1A`, Inset: `#000000`
- Text primary: `#EEEEEE`, secondary: `#A3A3A3`, muted: `#737373`, ghost: `#404040`

**Accent:** Forge Orange, 10-step scale. Primary: `#D15010` (500). Mode-stable (same in light and dark).

**Semantic:** Success (green), Error (red), Warning (reuses accent orange), Info (blue).

### Typography
- **Sans:** Geist (body text, headings, messages)
- **Mono:** Geist Mono (code, labels, section headers, nav items, stats)
- **Scale ratio:** 1.2 (minor third) — xs 11px, sm 13px, base 14px, lg 19px, xl 23px
- **Section labels:** Geist Mono, ALL-CAPS, wide tracking, secondary color
- **Code blocks:** Forge terminal styling — orange keywords, amber strings, cyan comments

### Spacing & Radius
- 4px base grid. Steps: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px
- Radius: 4px (interactive: buttons, inputs, tags), 8px (containers: cards, panels), 12px (modals), 9999px (pills, dots)
- Shadows: minimal. Borders for hierarchy, shadows only for floating overlays.

### Icons
- All hand-crafted SVGs or from a consistent outline library
- 1.5px stroke, sharp joins, 16x16 base grid
- Sizes: 16px (inline), 20px (cards), 24px (nav/section)
- NO emojis anywhere
- Tool-specific icons with per-tool animations (see Forge tool icon spec)

### Animation
- As much animation as possible, but smart and low-latency
- Restrained and consistent — Forge terminal easing + Vercel precision
- Futuristic ASCII-inspired motion, not retro
- Durations: instant 75ms, fast 150ms, normal 250ms, medium 350ms, slow 500ms, breathe 2000ms
- All animations respect `prefers-reduced-motion`
- Tool call blocks: individual SVG per tool with working/spinning animation while active
- Thinking blocks: animated while thinking, expandable to show thought stream
- Orange accent dot for emphasis in section labels and markdown lists

---

## 2. Panel Layout

### Header (single row, two zones)

```
[+ NEW]  FILES  SETTINGS  [🕐]  │  [◐][⚡]
                                 │  [●][⊞]
                                    2x2 grid
```

**Left zone — Navigation:**
- `[+ NEW]` — Accent orange button. Starts a new chat. Orange underline when in an active chat session (default state). This replaces the old "CHAT" tab and "NEW CHAT" dropdown.
- `FILES` — Tab, replaces the content area with the files panel (full height).
- `SETTINGS` — Tab, replaces the content area with the settings panel (full height).
- `[🕐]` — History icon button. Opens a bento-box-style overlay on top of the chat content area (header and input remain visible). Lists previous sessions with short descriptions. Clicking a session loads it, closes the overlay, and returns to chat view.

**Right zone — 2x2 status icon grid (separated from nav by a soft vertical divider):**

| | Left | Right |
|---|---|---|
| **Top** | Phase (discuss/plan/execute/verify/waiting/blocked/completed) — automatic, not user-selectable | Permission mode (read-only/confirm-writes/confirm-risky/full-auto) — icon variant per mode |
| **Bottom** | Follow mode (auto-apply on/off) — eye icon | Diagnostics — click expands a drawer below the header, pushing task bar and content down. Click again to collapse. |

All four icons show tooltips on hover with concise descriptions. No text labels in the header — icons only.

### Diagnostics Drawer (expandable)
- Expands below the header row, above the task progress bar
- Pushes content down (does not overlay)
- Shading animation on open/close (drawer slide)
- Contains: instruction sources, hooks count, patterns, verifiers, permission mode detail, phase detail
- Click the diagnostics icon again to close

### Task Progress Bar
- Appears below the header (or below the diagnostics drawer if expanded)
- Horizontal segmented bar, full panel width
- Each segment = one task. Gray = pending, accent orange = completed, pulsing orange = in-progress
- Current task name displayed next to the bar (short text, Geist Mono 11px)
- Expandable to show all tasks (click to expand, click to collapse)
- Compact — total height under 40px when collapsed
- Hidden when no tasks active

### Content Area
- flex-1, scrollable
- Holds the message list

### Chat Input Area (single unified container)
One bordered container (surface background, 1px border, 8px radius) containing:

**Top section — textarea:**
- Geist Sans 14px. Placeholder: "Message..."
- Grows vertically with content: min 1 row, max ~6 rows, then scrolls internally
- Padding between text area and bottom toolbar

**File attachment chips** (if any): row between textarea and toolbar. Pill-style tags with file icon + name + X button.

**Bottom toolbar (inside the same container):**
- Left: `[+]` plus icon button (attachments/files)
- Center-right: Model picker (`claude-sonnet ▾`) — clickable dropdown showing available models
- Right of model: Brain SVG icon + thinking level (`[brain-icon] High ▾`) as one clickable unit — dropdown with off/low/medium/high. Uses a custom brain SVG, not an emoji.
- Far right: Send arrow — custom SVG, dimmed gray when no text, accent orange when text is entered. No voice mode.

Layout reference: Claude.ai input area (see screenshots). Everything inside one box.

### Footer (minimal, single row)
- Token in/out: `↑1.2k  ↓2.3k`
- Cost: `$0.02`
- Context pressure bar: thin inline bar with percentage (e.g., `████░░░ 40%`)
- Geist Mono 10px, muted color
- Always visible when a provider is configured

---

## 3. Chat Messages

### Scroll Behavior
- **Smart scroll:** If user scrolls up, stay there. Do not jump back to bottom.
- Auto-scroll only when the user is already at the bottom during streaming.
- "Scroll to bottom" floating button appears when scrolled up (32px circle, chevron-down, overlay shadow).

### Message Containers
- Both user and assistant messages live in simple, elegant containers
- **Max message height: 2/3 of the content area's current rendered height.** Computed dynamically (CSS `max-height: 66cqh` with container query on the content area, or JS-calculated). Content scrolls within the container when exceeding this height.
- Toggle per message between full-height (expanded, scrollable within) and collapsed
- At the bottom of a long message, scrolling continues naturally into the chat scroll

### User Messages
- Right-aligned with left margin (indented from assistant messages)
- Subtle background tint (light: `#EEF2FF`, dark: `#1A1A2E`), 8px radius, 12px padding
- Geist Sans 14px, primary text color

### Assistant Messages
- Full width, no indentation
- Light background container or no background — clean and readable
- Markdown rendering: headings, code blocks (Forge terminal style), inline code, links (accent orange), lists (orange accent dots), blockquotes (2px accent orange left border)

### Thinking Block
- Collapsible with animation
- Accent orange left border (2px)
- Header: "THINKING" label in Geist Mono 11px ALL-CAPS, accent color
- Expandable to show the streaming thought text
- Animated pulse on header during active thinking (opacity breathe, 2s cycle)

### Tool Call Block
- **Smart default:** Collapsed for routine tools, auto-expanded for errors or items needing attention
- Collapsible with expand/collapse animation
- Header: Individual SVG icon per tool (animated while running) + tool name (Geist Mono 13px) + brief explanation + status indicator
- Running state: tool icon animates (spin/pulse/custom per tool), accent orange
- Done state: green indicator, muted text
- Error state: red indicator, auto-expanded, error message visible
- Expanded content: args as code block, result as code block (truncated at 6 lines with "Show more")

### Error Message Block
- Full width, red-tinted background, 1px red border, 8px radius
- Red warning icon + error text. Shake animation on appear.

### Streaming Cursor
- Blinking block cursor in accent orange (8x16px), step-end, 1s cycle
- Appended to last line of assistant text during streaming

---

## 4. Settings Panel

Full-height tab view. Organized into collapsible sections with Forge section-label pattern (orange dot + ALL-CAPS mono title + horizontal rule).

### Sections (in order):

**1. API CONFIGURATION**
- Provider dropdown (OpenAI, Anthropic, Custom)
- API key input (password-masked, show/hide toggle)
- CORS proxy toggle with explanation text

**2. MODEL PICKER**
- Model selection dropdown (same as the one in chat input, but full settings view)
- Thinking level selector (off/low/medium/high)
- Permission mode: segmented control (read-only / confirm-writes / confirm-risky / full-auto) with brief description
- Context window limit (adjustable)
- Token output limit (adjustable)

**3. TOOLS**
- Web search provider dropdown (Brave/Serper/Exa/None) + API key
- Image search toggle
- MCP Tools section: "Add MCP Server" button opens a popup with:
  - JSON configuration input
  - User-friendly command + arguments interface
  - Placeholder UI — actual MCP integration is a later task

**4. CUSTOM INSTRUCTIONS**
- Textarea for instructions preloaded into model context on startup
- Brief description of what this does

**5. APPEARANCE**
- Theme toggle: Light / Dark / System Auto
- Theme toggle is in Settings only — not in the header.

**6. ADVANCED**
- Expand tool calls by default toggle
- Show diagnostics panel toggle
- Future feature toggles

### Settings Behavior
- Sections 1-3 expanded by default, 4-6 collapsed (regardless of content state)
- Chevron rotation animation on expand/collapse
- Tight vertical spacing — scrollable within the panel

---

## 5. Files Panel

Full-height tab view.

### Drop Zone (top)
- Dashed border rectangle, 80px tall
- Center: upload icon + "Drop files here or click to browse"
- Dragover state: accent orange border + tinted background

### File List
- Compact rows (40px height): file type icon + filename (truncated) + size + remove button (appears on hover)
- File type icons: document, spreadsheet, PDF, image, code — geometric outlines
- Alternating subtle row backgrounds for readability

### Empty State
- Centered: folder-plus icon (24px) + "No files attached" + "Upload files to include them as context"

---

## 6. History Panel

Bento-box-style overlay triggered by the history icon in the header.

### Layout
- Overlays the chat content area (does not replace the header or input)
- Grid of session cards, each showing:
  - Session title or first message preview (truncated)
  - Short description or timestamp
  - Message count indicator
- Click a session card: loads that session, closes history overlay, returns to chat view
- Close button or click-outside to dismiss

---

## 7. Approval Drawer & Resume Banner

### Approval Drawer
- Slides down from below the task progress bar (or below the diagnostics drawer if that is also open — they stack, with diagnostics on top and approval below)
- Surface background with accent-orange top border (2px)
- Description of what needs approval + "APPROVE" (accent) and "DENY" (ghost) buttons, stacked vertically
- Pushes content down, does not overlay

### Resume Task Banner
- Appears at top of content area when a previous task can be resumed
- Compact single row: "Resume previous task?" + RESUME button + X close
- Disappears when dismissed or resumed

---

## 8. Component Library Summary

### Must Build (custom Svelte components):
- Chat input area (unified container with textarea + toolbar)
- Message containers (collapsible, max-height scrollable)
- Task progress bar (segmented, expandable)
- Tool call blocks (per-tool SVG icons, animated states)
- Thinking blocks (collapsible, streaming, animated)
- 2x2 status icon grid
- Diagnostics drawer (expandable with animation)
- History overlay (bento-box grid)
- Settings sections (collapsible with Forge pattern)
- MCP configuration popup
- Model picker dropdown
- Thinking level picker

### From Design System (styled with Forge/Nexora tokens):
- Buttons (primary/secondary/ghost/accent/danger/icon)
- Inputs (text/textarea/search/select)
- Toggle switches
- Cards (standard/highlighted/stat/settings-section)
- Tags/badges (status with glow dots)
- Section labels (orange dot pattern)
- Dividers, skeleton loaders, empty states
- Tooltips

### Icons (44+ custom SVGs):
- 26 navigation/UI icons
- 6 interaction icons
- 8+ tool-specific icons with per-tool animations
- 4 status dot variants
- Phase, permission, follow, diagnostics icons for the 2x2 grid

---

## 9. SVG Icon Strategy

Pencil may not be the best tool for hand-crafting all 44+ SVG icons. Recommended approach:
- **Design system icons** (buttons, nav, status): Create in Pencil as part of the design, export as reference
- **Tool-specific animated icons**: Build as Svelte components with inline SVG + CSS animations, referencing the Forge tool icon spec (`/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/SPEC.md`)
- **Alternative**: Use a Claude Code agent to generate SVG paths programmatically based on the Forge spec's design rules (1.5px stroke, 16x16 grid, sharp joins, geometric forms)

---

## 10. Design Token Files

Source files for implementation:

| File | Use |
|------|-----|
| `Design_Library/systems/forge/tokens/forge.css` | Primary color + spacing + typography tokens |
| `Design_Library/systems/forge/tokens/tailwind-preset.js` | Tailwind v4 integration |
| `Design_Library/systems/nexora-mono/tokens/nexora-mono.css` | Structural tokens, badge system |
| `Design_Library/motion/forge-terminal/animation-tokens.ts` | Motion durations, easings, springs |
| `Design_Library/motion/forge-terminal/motion-presets.ts` | Framer Motion / animation presets |
| `Design_Library/motion/forge-terminal/terminal-effects.css` | CSS keyframes, cursor blink, scanlines |
| `Design_Library/palettes/forge-palette/palette.css` | Standalone palette reference |
| `Design_Library/iconography/forge-tool-icons/SPEC.md` | Tool icon design rules |
| `Design_Library/iconography/forge-tool-icons/ToolIcons.tsx` | Tool icon React components (port to Svelte) |
