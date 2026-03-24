# Pencil Prompt Sequence: Office Agents UI/UX Design

## Overview

11 sequential prompts for building the complete Office Agents side panel design in Pencil.
Single file: `office-agents-ui.pen`. Run prompts in order — each builds on the previous.

**Design spec:** `docs/superpowers/specs/2026-03-24-ui-ux-redesign-design.md`
**Target:** AI chat agent side panel for Word/Excel/PowerPoint add-ins.
**Panel dimensions:** 350px wide, full height (~700-800px typical).
**Theme:** Light mode primary, dark mode optional with intentional design.
**Visual language:** Forge (warm industrial) + Nexora Mono (structural discipline) + Vercel Geist (precision) + Anthropic (conversational patterns).

---

## Parallelism Guide (Pencil Swarm)

Use Pencil's parallel agent swarm for maximum speed. Dependencies shown below.

```
Phase 1: [Prompt 1 — Tokens]                    1 agent
              │
Phase 2: [Prompt 2] [Prompt 3] [Prompt 4]       3 agents in parallel
          buttons    cards/tags   icons
              │          │          │
Phase 3: [Prompt 5 → Prompt 6]                   1 agent, sequential
          chat messages → chat input
              │
Phase 4: [Prompt 7 — Panel Shell]                1 agent (assembles everything)
              │
Phase 5: [Prompt 8] [Prompt 9] [Prompt 10]      3 agents in parallel
          drawers    settings     files
              │          │          │
Phase 6: [Prompt 11 — States & Animations]       1 agent (final polish)
```

**Total: 6 phases. Max 3 parallel agents at once. Estimated 6-8 rounds.**

---

## File Structure in Pencil

All work in one `.pen` file with clearly separated top-level frames:

| Frame | Contents |
|-------|----------|
| Design Tokens | Color swatches (light+dark), type samples, spacing, radius, motion |
| Component Library | All reusable components |
| Icon Set | All SVG icon components |
| Chat Screen — Light | Full chat view, light theme (primary) |
| Chat Screen — Dark | Dark theme variant |
| Settings Screen — Light/Dark | Settings panel both themes |
| Files Screen — Light/Dark | File management panel both themes |
| History Overlay | Session history bento overlay |
| States & Animations | Interaction specs and motion reference |

---

## Reference Files

Each prompt lists which files to provide. If Pencil cannot read a file path, copy its contents into the prompt directly.

### Core Token & Doc Files
- `/Users/kosta/LocalDev/Design_Library/systems/forge/tokens/forge.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/tokens/forge.json`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/tokens/nexora-mono.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/docs/DESIGN_SYSTEM.md`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/docs/DESIGN_SYSTEM.md`
- `/Users/kosta/LocalDev/Design_Library/palettes/forge-palette/palette.css`
- `/Users/kosta/LocalDev/Design_Library/typography/geist-family/README.md`

### Component Files
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/chat.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/buttons.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/cards.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/inputs.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/tags.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/terminal.css`
- `/Users/kosta/LocalDev/Design_Library/systems/forge/components/patterns.css`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/buttons.css`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/cards.css`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/inputs.css`
- `/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/badges.css`

### Motion & Animation
- `/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/animation-tokens.ts`
- `/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/motion-presets.ts`
- `/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/terminal-effects.css`

### Iconography
- `/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/SPEC.md`
- `/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/ToolIcons.tsx`

---

## Prompt 1: Design Token Canvas

**Swarm:** 1 agent. Foundation — everything else depends on this.

### Provide:
```
forge/tokens/forge.css
nexora-mono/tokens/nexora-mono.css
palettes/forge-palette/palette.css
typography/geist-family/README.md
forge/docs/DESIGN_SYSTEM.md
nexora-mono/docs/DESIGN_SYSTEM.md
```

### Prompt:

> Create a "Design Tokens" frame as the foundation for an Office Add-in side panel design system. This is a hybrid of Forge (warm industrial palette, orange accent) and Nexora Mono (structural discipline, border-only hierarchy, status badges).
>
> Read the attached token files and design system docs. If any file path is unreadable, let me know which ones so I can paste the contents.
>
> **Light mode is the primary theme. Dark mode is secondary.**
>
> **Color palette — build Light (left, primary) and Dark (right) swatches:**
>
> Backgrounds — Light: base `#FAFAFA`, raised `#FFFFFF`, surface `#F4F4F4`, overlay `#FFFFFF`, inset `#F0EFEE`. Dark: base `#020202`, raised `#0A0A0A`, surface `#111111`, overlay `#1A1A1A`, inset `#000000`. Label each swatch with token name and hex.
>
> Gray scale: Forge's warm-brown grays, 10 steps (100-1000). Show light and dark side by side. The warm undertone is intentional — not neutral grays.
>
> Accent: Forge Orange, 10 steps. Primary `#D15010` (500). Mode-stable — same values in both themes.
>
> Text — Light: primary `#171717`, secondary `#737373`, muted `#A3A3A3`, ghost `#D4D4D4`. Dark: primary `#EEEEEE`, secondary `#A3A3A3`, muted `#737373`, ghost `#404040`.
>
> Borders: subtle, default, strong, focus. Focus uses accent orange. Forge warm values for dark, Nexora Mono clean values for light.
>
> Semantic: Success (green), Error (red), Warning (reuses accent orange), Info (blue). Small labeled swatches.
>
> **Typography — Geist fonts from Google Fonts:**
>
> Scale ratio 1.2 (minor third): xs 11px, sm 13px, base 14px, lg 19px, xl 23px, 2xl 28px, 3xl 34px. Show each in Geist Sans (400) and Geist Mono (400). Mark usage: body (base, Sans), code/terminal (sm, Mono), section labels (xs, Mono, ALL-CAPS, wide tracking), headings (lg-2xl, Sans, 600), nav items (sm, Mono, ALL-CAPS).
>
> **Spacing:** 4px grid. Show labeled samples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.
>
> **Border radius:** 0px (none), 4px (interactive: buttons, inputs, tags), 8px (containers: cards, panels), 12px (modals), 9999px (pills, dots).
>
> **Shadows:** Minimal. Show: sm (subtle drop, floating only), md (popovers), overlay (modals). Default is "no shadow" — borders create hierarchy. Shadows only for floating layers.
>
> **Motion tokens:** Durations: instant 75ms, fast 150ms, normal 250ms, medium 350ms, slow 500ms, breathe 2000ms. Easing curves: default, out, inOut, sharp — show as labeled bezier thumbnails.
>
> Light theme on the left, dark theme on the right, shared values (accent, spacing, radius, motion) centered.

---

## Prompt 2: Buttons & Inputs

**Swarm:** Part of Phase 2 — run in parallel with Prompts 3 and 4 (3 agents total).

### Provide:
```
forge/components/buttons.css
forge/components/inputs.css
nexora-mono/components/buttons.css
nexora-mono/components/inputs.css
```

### Prompt:

> Add button and input components to the "Component Library" frame. Use the design tokens already created. Reference the attached CSS for visual direction. Adapt for a 350px-wide side panel. Show all components in both light (primary) and dark themes.
>
> If any file path is unreadable, let me know.
>
> **Buttons — reusable components, all states:**
>
> - Primary: Accent orange fill (`#D15010`), white text. 36px height, 4px radius. Geist Mono 12px, ALL-CAPS, wide tracking.
> - Secondary: Transparent, 1px border (gray), text color. Same dimensions.
> - Ghost: No border, no fill. Subtle background on hover.
> - Accent: Same as Primary with slightly larger padding (emphasis use).
> - Danger: Red border, red text. Fills red on hover.
> - Icon button: 32x32px square, 4px radius, ghost style. Icon centered.
> - Size variants: Default (36px), Small (28px, 11px text).
>
> States for each: default, hover, active/pressed, focused (orange focus ring, 2px offset), disabled (40% opacity). No emojis. Text labels: "SUBMIT", "CANCEL", "DELETE", "COPY", "REFRESH".
>
> **Inputs — reusable components, light and dark:**
>
> - Text input: 40px height, 4px radius, 1px border. Geist Sans 14px. Focus: border → accent orange, subtle glow.
> - Textarea: Multi-line, same styling. Min 3 rows.
> - Search input: Text input with search icon (16px outline) on left. Command variant with orange `>` prefix in Geist Mono.
> - Select/Dropdown: Text input look with chevron-down. Label above in Geist Mono 11px ALL-CAPS wide tracking.
> - Toggle switch: 40x20px track, 16px thumb. Off = gray. On = accent orange track, white thumb. 150ms transition.
>
> States: empty/placeholder, filled, focused, error (red border + message below), disabled. Labels use Forge section-label pattern: Geist Mono, 11px, ALL-CAPS, wide tracking, secondary color.

---

## Prompt 3: Cards, Tags & Patterns

**Swarm:** Part of Phase 2 — runs in parallel with Prompts 2 and 4.

### Provide:
```
forge/components/cards.css
forge/components/tags.css
forge/components/patterns.css
nexora-mono/components/cards.css
nexora-mono/components/badges.css
```

### Prompt:

> Add card, tag/badge, and UI pattern components to the "Component Library" frame. Both light and dark themes.
>
> If any file path is unreadable, let me know.
>
> **Cards:**
> - Standard: Surface bg, 1px border, 8px radius, 16px padding. No shadow. Title (Sans 16px/600), description (Sans 14px, secondary).
> - Highlighted: 2px accent orange left border.
> - Tool call card: Collapsible. Header: status dot (gray/orange/green/red) + tool name (Mono 13px) + expand chevron. Collapsed = header only. Expanded = code block content (inset bg, Mono 12px).
> - Stat card: Large number (Mono 28px/700) + label below (Mono 11px ALL-CAPS). Compact for 2-3 across 350px.
> - Settings section card: Full-width flush. Forge orange-dot pattern: small `●` in accent + ALL-CAPS Mono label + horizontal rule.
>
> **Tags/Badges:**
> - Default: Gray bg, gray text. 4px radius, Mono 11px ALL-CAPS. Compact (4px 8px).
> - Accent: Orange bg (10% opacity), orange text.
> - Success/Error/Info: Tinted bg + matching text.
> - Status badge (Nexora Mono style): Colored dot with subtle glow (box-shadow). Variants: live (green), ready (blue), building (yellow pulse), error (red), neutral (gray).
>
> **UI Patterns:**
> - Section label: Orange dot `●` + ALL-CAPS Mono + optional horizontal rule.
> - Divider: 1px border-subtle. Dotted variant.
> - Skeleton loader: Rounded rectangles, shimmer animation. Variants: single line, multi-line, card-sized.
> - Empty state: Centered icon (24px, ghost) + title (Sans 16px) + description (Sans 13px, secondary).
> - Cursor blink: Block cursor in accent orange, step-end 1s. For streaming.

---

## Prompt 4: Icon Set

**Swarm:** Part of Phase 2 — runs in parallel with Prompts 2 and 3.

### Provide:
```
iconography/forge-tool-icons/SPEC.md
iconography/forge-tool-icons/ToolIcons.tsx
```

### Prompt:

> Create an "Icon Set" frame. Every icon is a reusable component. No emojis anywhere. All icons are sleek, modern, geometric — not dated or literal.
>
> Read the attached icon spec for the tool-specific icons. If any file path is unreadable, let me know.
>
> **Design rules:** Outline style, 1.5px stroke, sharp joins (miter), no fill. 16x16 base grid. Sizes: 16px (inline), 20px (cards), 24px (nav). Default color: inherits text color. Active: accent orange. Aesthetic: geometric, minimal, modern — futuristic terminal feel, not retro.
>
> **Navigation & UI icons (26):**
> Send (geometric up-arrow), Plus (attachments), Settings/Gear (6-tooth), Chat/Message (speech bubble), Folder/Files, Trash/Delete, Eye/Visibility, Eye-Off, Sun, Moon, Chevron (up/down/left/right), Check, X/Close, Square/Stop (filled, for abort), Spinner (three-quarter circle for rotation), Plus, Minus, Search (magnifying glass), Copy (overlapping rectangles), Edit/Pencil, Refresh (circular arrows), Warning (triangle + exclamation), Info (circle + "i").
>
> **Interaction icons (6):**
> Expand (diagonal arrows out), Collapse (diagonal arrows in), Drag handle (6-dot grid 2x3), Pin, Arrow-right (CTA), External link (box + escaping arrow).
>
> **Status indicator icons for 2x2 header grid (4 icon sets):**
>
> Phase icons — one icon per state, all swap in the same position:
> - Discuss: two overlapping speech bubbles
> - Plan: clipboard with horizontal lines
> - Execute: lightning bolt (geometric, angular)
> - Verify: magnifying glass with small checkmark
> - Waiting on user: pause bars (two vertical lines)
> - Blocked: circle with diagonal line
> - Completed: circle with checkmark
>
> Permission mode icons — one icon per state:
> - Read-only: minimal lock/latch (geometric slider, not a literal padlock)
> - Confirm writes: pencil with small dot
> - Confirm risky: pencil with small warning triangle
> - Full auto: bolt/zap (autonomous)
>
> Follow mode: Eye icon (on = accent, off = muted).
>
> Diagnostics: Pulse/waveform line icon (compact, reads as "system health").
>
> **Tool-specific icons (8 shared SDK — from Forge spec):**
> Bash/Terminal (`>_`), Read/Scan (horizontal lines), PDF convert, DOCX convert, XLSX convert, Web search (signal arcs), Web fetch (pull arrow), Screenshot (viewfinder brackets).
>
> **Status dots (4):** Idle (gray 8px), Running (orange 8px, pulse-ready), Done (green 8px), Error (red 8px).
>
> **Special icons:**
> - History: clock with circular arrow (for session history button)
> - Brain: geometric brain outline (for thinking level picker in chat input)
> - Model: a small geometric chip/processor icon (for model picker)
>
> Lay out in a grid grouped by category. Label each. Show 16px default, with a row of 20px and 24px for representative samples.

---

## Prompt 5: Chat Message Components

**Swarm:** Phase 3 — 1 agent, runs sequentially with Prompt 6.

### Provide:
```
forge/components/chat.css
forge/components/terminal.css
motion/forge-terminal/animation-tokens.ts
```

### Prompt:

> Build chat message components in the "Component Library" frame. Width: 320px max (leaving padding within 350px panel). Both light and dark themes.
>
> Read the attached files. If any path is unreadable, let me know.
>
> **User message container:**
> Right-aligned with 32px left margin. Subtle background tint (light: `#EEF2FF`, dark: `#1A1A2E`), 8px radius, 12px padding. Geist Sans 14px. Simple, elegant container. No avatar or name — position and color distinguish it.
>
> Collapsible: each message has a small expand/collapse arrow icon at top-right. Max height = 2/3 of the content area. When collapsed to max-height, content scrolls within. Toggle to expand full height.
>
> **Assistant message container:**
> Full width, no indentation. Light container background or none — clean and readable. Same collapsible behavior with max-height and expand toggle.
>
> Markdown rendering: headings, code blocks (Forge terminal style — orange keywords, amber strings, cyan comments, inset bg, Mono 13px, 4px radius), inline code (surface bg, Mono), links (accent orange, underline on hover), lists (clean consistent rendering matching design system), blockquotes (2px accent orange left border).
>
> **Thinking block:**
> Collapsible with animation. 2px accent orange left border. Header: "THINKING" in Mono 11px ALL-CAPS accent color + expand chevron. Expandable to show streaming thought text (Sans 13px, secondary, max-height 120px with scroll). Pulse animation on header during active thinking (opacity breathe, 2s).
>
> **Tool call block:**
> Collapsible. Smart default: collapsed for routine tools, auto-expanded for errors. Header: individual SVG icon per tool (animated while running — spin/pulse per tool type) + tool name (Mono 13px) + brief explanation (Sans 13px secondary) + status indicator. Running = icon animates, accent orange. Done = green, muted. Error = red, auto-expanded. Expanded: args code block + result code block (truncated 6 lines, "Show more" in accent).
>
> **Task progress bar:**
> Horizontal segmented bar, full content width. N segments (one per task), 1px gaps. Pending = gray. Completed = accent orange. In-progress = pulsing orange. Below: current task name (Mono 11px, secondary). Expandable to show all task names. Compact — under 40px collapsed. Show examples: 3, 5, 8 segments.
>
> **Error message block:**
> Full width, red-tinted bg (10% opacity), 1px red border, 8px radius. Red warning icon + text (Sans 14px). Shake animation on appear (translateX -4/4/-2/0, 300ms).
>
> **Streaming cursor:**
> Blinking block in accent orange (8x16px), step-end 1s. Appended to last assistant line during streaming.

---

## Prompt 6: Chat Input Area

**Swarm:** Phase 3 — same agent as Prompt 5, runs after it completes.

### Provide:
```
forge/components/chat.css
forge/components/inputs.css
```

### Prompt:

> Build the chat input component. This is a single unified container (surface bg, 1px border, 8px radius) holding the textarea and toolbar together inside one box. Width: fills 350px panel with 12px side padding. Both light and dark themes.
>
> If any file path is unreadable, let me know.
>
> **Design reference: Claude.ai's input area.** Everything is inside one bordered box.
>
> **Structure (top to bottom, inside one container):**
>
> 1. Textarea: Geist Sans 14px. Placeholder: "Message..." in ghost color. Grows with content: min 1 row (20px line height), max ~6 rows (~120px), then scrolls internally. Padding between text and the toolbar below.
>
> 2. File attachment chips (if present): Row between textarea and toolbar. Pill-style: surface bg, 4px radius, file icon (16px) + truncated name + X close. Wraps to 3 rows max, then "+N more".
>
> 3. Bottom toolbar (inside the container):
>    - Far left: `[+]` plus icon button (32x32, ghost) for attachments/files.
>    - Center-right: Model picker — model name in Geist Mono 13px (e.g., "claude-sonnet"), clickable, opens dropdown of available models. Small chip/processor icon before the name.
>    - Right of model: Brain SVG icon + thinking level text as one clickable unit (e.g., "[brain] High"). Dropdown: off / low / medium / high. Not an emoji — custom geometric brain SVG.
>    - Far right: Send arrow — custom SVG, dimmed gray when no text, accent orange when text entered. Geometric up-arrow matching the icon set style.
>
> **States to show:**
> - Empty: Placeholder visible. Send arrow dimmed. Model and brain pickers visible.
> - Typing: Text entered, send arrow turns accent orange. Container border stays default.
> - Focused: Container border → accent orange, subtle glow.
> - With attachments: Chips visible between text and toolbar.
> - During streaming: Textarea dimmed, stop button (square icon, red-ish) replaces send arrow.
> - Error: Error banner above the container (red-tinted, full width). Input still functional below.

---

## Prompt 7: Panel Shell & Screens

**Swarm:** Phase 4 — 1 agent. Assembles everything built so far.

### Provide:
```
forge/components/patterns.css
forge/docs/DESIGN_SYSTEM.md
```

### Prompt:

> Build complete panel screens: "Chat Screen — Light" (primary) and "Chat Screen — Dark". Each frame is 350px wide x 700px tall. Use components from the Component Library.
>
> If any file path is unreadable, let me know.
>
> **Header (single row, two zones separated by soft vertical divider):**
>
> Left zone — Navigation tabs:
> - `[+ NEW]` — Accent orange button with plus icon. Orange underline when in active chat (default). Starts a new chat session. This replaces the old "CHAT" tab.
> - `FILES` — Text tab, replaces content with files panel.
> - `SETTINGS` — Text tab, replaces content with settings panel.
> - History icon button (clock with circular arrow) — opens a bento-style overlay on top of chat content.
>
> Right zone — 2x2 status icon grid:
> | | Left | Right |
> |---|---|---|
> | Top | Phase (icon swaps per state) | Permission mode (icon swaps per state) |
> | Bottom | Follow mode (eye icon) | Diagnostics (pulse icon, click to expand drawer) |
>
> All icons: tooltips on hover, no text labels. Compact grid with minimal spacing.
>
> **Below header — Info strip (only when diagnostics expanded):**
> The diagnostics icon click expands a drawer between the header and task bar. Pushes content down with a slide/shade animation. Contains: instruction sources, hooks, patterns, verifiers, phase detail, permission detail. Compact layout. Click diagnostics icon again to close.
>
> **Task progress bar (below header or diagnostics drawer):**
> Segmented horizontal bar, current task name beside it. Expandable. Hidden when no tasks. Show with 5 tasks, 3 completed.
>
> **Content area (flex-1, scrollable):**
> Populate with realistic chat: 2-3 user messages, 2-3 assistant responses (one with code block in Forge terminal style, one with a collapsed thinking block, one with a tool call block in running state). Messages in clean containers with expand icons at top-right.
>
> Smart scroll indicator: "scroll to bottom" floating button (32px circle, chevron-down, overlay shadow) shown when scrolled up.
>
> **Chat input (fixed at bottom):**
> The unified input container. Show in "typing" state with some text, model picker showing "claude-sonnet", brain icon showing "High", send arrow in accent orange.
>
> **Footer (below input):**
> Single row: `↑1.2k  ↓2.3k  $0.02` + context pressure bar (thin inline bar with %). Geist Mono 10px, muted.
>
> Show light theme on the left, dark theme on the right, spaced on canvas.

---

## Prompt 8: Drawers, Banners & History

**Swarm:** Phase 5 — runs in parallel with Prompts 9 and 10 (3 agents total).

### Prompt:

> Add overlay and drawer components to the "Component Library" frame and show them in context on the chat screens.
>
> **Approval drawer:**
> Slides down below the task progress bar (or below diagnostics drawer if both open — they stack). 2px accent-orange top border, surface bg, 12px padding, 8px radius bottom corners. Description text (Sans 14px) + "APPROVE" (accent button) and "DENY" (ghost button), stacked vertically. Pushes content down. Show open and closed states.
>
> **Resume task banner:**
> Top of content area. Surface bg, 1px border, full width, 8px padding. "Resume previous task?" (Sans 13px) + "RESUME" button (small, accent) + X close (ghost). Single compact row.
>
> **History overlay:**
> Triggered by the history icon. Overlays the chat content area (header and input remain visible). One-column list of session cards. Each card:
> - Session title (Mono 13px, primary text, truncated)
> - Timestamp (Mono 11px, secondary)
> - Token usage: thin context bar showing tokens consumed / total
> - Session status indicator: small icon showing where it stopped (completed checkmark, paused in plan, stopped mid-execute, etc.)
> - Click loads that session and closes overlay
>
> Close button at top-right of overlay, or click outside. Surface bg with overlay shadow. Show 5-6 realistic session entries.
>
> Add the approval drawer and resume banner to the dark chat screen to show integration.

---

## Prompt 9: Settings Screen

**Swarm:** Phase 5 — runs in parallel with Prompts 8 and 10.

### Provide:
```
forge/components/patterns.css
```

### Prompt:

> Create "Settings Screen — Light" and "Settings Screen — Dark". 350x700px. Header with "SETTINGS" tab active (orange underline). Same header structure as chat screens.
>
> If file path is unreadable, let me know.
>
> **Scrollable content — collapsible sections using Forge section-label pattern (orange dot + ALL-CAPS title + rule):**
>
> **1. API CONFIGURATION** (expanded by default)
> - Provider dropdown: "OpenAI" / "Anthropic" / "Custom"
> - API key input: password-masked, show/hide toggle (eye icon)
> - CORS proxy toggle + explanation text (12px secondary)
>
> **2. MODEL PICKER** (expanded by default)
> - Model selection dropdown (same models as the chat input picker)
> - Thinking level: segmented control — "OFF" / "LOW" / "MEDIUM" / "HIGH". Active = accent orange bg.
> - Permission mode: segmented control — "READ ONLY" / "CONFIRM WRITES" / "CONFIRM RISKY" / "FULL AUTO". Description below active selection (12px secondary).
> - Context window limit: numeric input with label
> - Token output limit: numeric input with label
>
> **3. TOOLS** (expanded by default)
> - Web search provider dropdown: Brave / Serper / Exa / None. API key input when provider selected.
> - Image search toggle.
> - MCP Tools: "ADD MCP SERVER" accent button. Show a popup mockup with:
>   - JSON configuration textarea
>   - User-friendly form: Server name input, command input, arguments input
>   - "ADD" and "CANCEL" buttons
>   - This is placeholder UI — label it as "MCP integration coming soon" or similar
>
> **4. CUSTOM INSTRUCTIONS** (collapsed by default)
> - Textarea for preloaded instructions
> - Brief description: "Instructions loaded into model context at the start of each session" (12px secondary)
>
> **5. APPEARANCE** (collapsed by default)
> - Theme: segmented control — "LIGHT" / "DARK" / "AUTO". Theme toggle lives here, not in the header.
>
> **6. ADVANCED** (collapsed by default)
> - Expand tool calls by default: toggle
> - Show diagnostics panel: toggle
>
> Sections 1-3 expanded, 4-6 collapsed. Chevron rotation on expand/collapse.

---

## Prompt 10: Files Screen

**Swarm:** Phase 5 — runs in parallel with Prompts 8 and 9.

### Prompt:

> Create "Files Screen — Light" and "Files Screen — Dark". 350x700px. "FILES" tab active.
>
> **Drop zone (top):**
> Dashed border (2px, border-default), 8px radius, 80px tall. Center: upload icon (24px, secondary) + "Drop files here or click to browse" (Sans 13px, secondary). Dragover state: border → accent orange, bg → accent 5% opacity, icon → accent.
>
> **File list (below drop zone):**
> Compact rows (40px): file type icon (16px) + filename (Sans 13px, truncated) + size (Mono 11px, secondary, right-aligned) + remove X (ghost, 16px, hover-only). File type icons: document, spreadsheet, PDF, image, code. Alternating subtle row backgrounds. Show 5-6 files.
>
> **Empty state (show in one theme variant):**
> Centered: folder-plus icon (24px) + "No files attached" (Sans 16px) + "Upload files to include them as context" (Sans 13px, secondary).
>
> Show file list in light frame, empty state in dark frame.

---

## Prompt 11: States, Animations & Interaction Specs

**Swarm:** Phase 6 — 1 agent. Final polish, needs everything completed.

### Provide:
```
motion/forge-terminal/animation-tokens.ts
motion/forge-terminal/motion-presets.ts
motion/forge-terminal/terminal-effects.css
```

### Prompt:

> Create a "States & Animations" frame documenting all interactive states, transitions, and animation behaviors. This is an implementation reference sheet. Read the attached motion files. If any path is unreadable, let me know.
>
> **Component state matrix (show visual examples):**
>
> | Component | Default | Hover | Active | Focused | Disabled |
> |-----------|---------|-------|--------|---------|----------|
> | Button primary | Orange fill | Darker orange | Scale 0.98 | Orange ring 2px offset | 40% opacity |
> | Button ghost | Transparent | Surface bg | Darker surface | Orange ring | 40% opacity |
> | Input | Default border | Same | — | Orange border + glow | Dimmed, 60% opacity |
> | Toggle | Gray track | Lighter | — | Orange ring | 40% opacity |
> | Card | Default border | Lighter border | — | — | — |
> | Tab | Secondary text | Primary text | — | Orange underline | — |
> | Icon button | Ghost color | Accent orange | Scale 0.95 | Orange ring | 40% opacity |
> | 2x2 grid icon | Muted | Primary + tooltip | — | — | — |
>
> **Transitions (annotated motion strips, 3-4 keyframes each):**
>
> 1. Message appear: opacity 0→1, y 8→0, blur 2→0. 250ms ease-out.
> 2. Tool call expand/collapse: height 0→auto. 250ms ease-in-out.
> 3. Tool icon running: per-tool animation — bash cursor blinks, search arcs pulse, screenshot brackets contract. Loops while active.
> 4. Thinking block pulse: opacity 0.7→1→0.7. 2000ms breathe loop.
> 5. Task progress fill: width transition on completion. 350ms ease-out.
> 6. Tab switch: content crossfade. 150ms out + 150ms in = 300ms total.
> 7. Diagnostics drawer expand: height 0→auto, slide down with shading. 250ms ease-out. Pushes content below.
> 8. Diagnostics drawer collapse: reverse. 200ms ease-in.
> 9. Dropdown open: opacity 0→1, scaleY 0.96→1, origin top. 150ms ease-out.
> 10. Dropdown close: reverse. 100ms ease-in.
> 11. Skeleton shimmer: gradient sweep left→right, infinite. 1500ms.
> 12. Status dot pulse (running): scale 1→1.3→1, opacity 1→0.7→1. 2000ms loop.
> 13. Streaming cursor: opacity 1→0 step-end. 1000ms loop.
> 14. Scroll-to-bottom fab: opacity 0→1, y 8→0. 150ms.
> 15. Approval drawer slide-down: height 0→auto, opacity 0→1. 250ms ease-out.
> 16. Error shake: x 0→-4→4→-2→0. 300ms ease-out. Once.
> 17. History overlay appear: opacity 0→1 with backdrop fade. 200ms.
> 18. Phase icon swap: crossfade between icons. 150ms.
>
> **Reduced motion:** Note all animations respect `prefers-reduced-motion`. When active: durations → 0, looping stops, opacity preserved but transforms removed.
>
> Organize strips vertically by category: appear/disappear, expand/collapse, looping, interaction feedback, overlays.

---

## Post-Completion

### Iteration
After all 11 prompts, review the full canvas. Typical follow-ups:
- "Tighten spacing between X and Y"
- "The card border is too strong in light mode — use border-subtle"
- "Add an inline variant of the tool call block (no expand, just status + name)"

### SVG Icon Generation
For tool-specific animated icons that need precise SVG paths:
- Use a Claude Code agent to generate SVG path data programmatically
- Reference `Design_Library/iconography/forge-tool-icons/SPEC.md` for design rules
- Reference `Design_Library/iconography/forge-tool-icons/ToolIcons.tsx` for existing implementations to port

### Exporting to Code
Once design is approved, the Pencil file is the source of truth. Claude Code sessions reference it via Pencil MCP to read component specs and produce Svelte + Tailwind code.
