# Pencil Prompt Sequence: Office Agents UI/UX Design

## How to Use This File

**6 prompts. Run them in order. One prompt per Pencil chat session.**

Each prompt is a single message you paste into Pencil. Enable SWARM mode before sending. The orchestrator will automatically split the work across multiple parallel agents. You don't need to manually assign work — just set the agent count and paste the prompt.

| Session | What it builds | Recommended agents | Wait for |
|---------|---------------|-------------------|----------|
| **Session 1** | Design tokens (colors, type, spacing, radius, motion) | 3 agents | Nothing — start here |
| **Session 2** | Full component library (buttons, inputs, cards, tags, patterns) | 5-6 agents | Session 1 complete |
| **Session 3** | Icon set (44+ icons across all categories) | 4-6 agents | Session 1 complete |
| **Session 4** | Chat-specific components (messages, input area, progress bar) | 4 agents | Sessions 2 & 3 complete |
| **Session 5** | All screens (chat, settings, files, history, drawers) | 6 agents | Session 4 complete |
| **Session 6** | States, animations & interaction reference sheet | 3-4 agents | Session 5 complete |

**Sessions 2 and 3 can run at the same time** (different Pencil chat tabs) since they both only depend on Session 1.

**Single file:** All sessions work on the same `office-agents-ui.pen` file.

---

## Context (for all sessions)

**Target:** AI chat agent side panel for Word/Excel/PowerPoint Office Add-ins.
**Panel:** 350px wide, full height (~700-800px).
**Theme:** Light mode primary. Dark mode secondary (intentional, not lazy inversion).
**Visual language:** Forge (warm industrial, orange accent `#D15010`, Geist fonts) + Nexora Mono (structural discipline, border hierarchy, status badges) + Vercel Geist (modern precision) + Anthropic (Claude.ai conversational patterns).
**Design spec:** See `docs/superpowers/specs/2026-03-24-ui-ux-redesign-design.md` for full details.

---

## Session 1: Design Tokens

**Agents:** 3 (one for colors, one for typography/spacing, one for radius/shadows/motion)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/systems/forge/tokens/forge.css
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/tokens/nexora-mono.css
/Users/kosta/LocalDev/Design_Library/palettes/forge-palette/palette.css
/Users/kosta/LocalDev/Design_Library/typography/geist-family/README.md
/Users/kosta/LocalDev/Design_Library/systems/forge/docs/DESIGN_SYSTEM.md
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/docs/DESIGN_SYSTEM.md
```

### Prompt:

> Create a "Design Tokens" frame as the foundation for an Office Add-in side panel design system. This is a hybrid of Forge (warm industrial palette, orange accent) and Nexora Mono (structural discipline, border-only hierarchy). Read the attached files. If any file path is unreadable, let me know which ones so I can paste the contents.
>
> **Light mode is the primary theme. Dark mode is secondary.**
>
> Build these sections as parallel workstreams on the canvas:
>
> **SECTION A — Color Palette (light left, dark right, side by side):**
>
> Backgrounds — Light: base `#FAFAFA`, raised `#FFFFFF`, surface `#F4F4F4`, overlay `#FFFFFF`, inset `#F0EFEE`. Dark: base `#020202`, raised `#0A0A0A`, surface `#111111`, overlay `#1A1A1A`, inset `#000000`. Label each swatch with token name and hex.
>
> Gray scale: Forge's warm-brown grays, 10 steps (100-1000). Both themes side by side. Warm undertone intentional.
>
> Accent: Forge Orange, 10 steps. Primary `#D15010` (500). Mode-stable — same in both themes.
>
> Text — Light: primary `#171717`, secondary `#737373`, muted `#A3A3A3`, ghost `#D4D4D4`. Dark: primary `#EEEEEE`, secondary `#A3A3A3`, muted `#737373`, ghost `#404040`.
>
> Borders: subtle, default, strong, focus. Focus = accent orange. Forge warm values for dark, Nexora Mono clean values for light.
>
> Semantic: Success (green), Error (red), Warning (reuses accent orange), Info (blue). Small labeled swatches.
>
> **SECTION B — Typography:**
>
> Load Geist Sans and Geist Mono from Google Fonts. Scale ratio 1.2 (minor third): xs 11px, sm 13px, base 14px, lg 19px, xl 23px, 2xl 28px, 3xl 34px. Show each in Geist Sans (400) and Geist Mono (400). Mark usage: body (base, Sans), code/terminal (sm, Mono), section labels (xs, Mono, ALL-CAPS, wide tracking), headings (lg-2xl, Sans, 600), nav items (sm, Mono, ALL-CAPS).
>
> Spacing: 4px grid. Labeled samples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.
>
> **SECTION C — Radius, Shadows & Motion:**
>
> Border radius: 0px (none), 4px (interactive: buttons, inputs, tags), 8px (containers: cards, panels), 12px (modals), 9999px (pills, dots). Show samples.
>
> Shadows: Minimal. sm (subtle drop, floating only), md (popovers), overlay (modals). Default = "no shadow" — borders create hierarchy. Shadows only for floating layers.
>
> Motion tokens: Durations — instant 75ms, fast 150ms, normal 250ms, medium 350ms, slow 500ms, breathe 2000ms. Easing curves — default, out, inOut, sharp. Show as labeled bezier thumbnails.

---

## Session 2: Full Component Library

**Agents:** 5-6 (one per component category: buttons, inputs, cards, tags/badges, patterns/utilities)
**Depends on:** Session 1 (tokens must exist)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/systems/forge/components/buttons.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/inputs.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/cards.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/tags.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/patterns.css
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/buttons.css
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/cards.css
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/inputs.css
/Users/kosta/LocalDev/Design_Library/systems/nexora-mono/components/badges.css
```

### Prompt:

> Create a "Component Library" frame using the design tokens from the "Design Tokens" frame. Reference the attached CSS files for visual direction. Adapt everything for a 350px-wide side panel. Show all components in both light (primary) and dark themes. No emojis anywhere. If any file path is unreadable, let me know.
>
> Build these component categories as parallel workstreams:
>
> **CATEGORY A — Buttons (reusable components, all states):**
>
> Variants: Primary (accent orange fill, white text, 36px height, 4px radius, Geist Mono 12px ALL-CAPS wide tracking), Secondary (transparent, 1px gray border), Ghost (no border/fill, subtle bg on hover), Accent (Primary with larger padding), Danger (red border/text, fills red on hover), Icon button (32x32 square, ghost style). Size variants: Default (36px), Small (28px, 11px text). States for each: default, hover, active/pressed, focused (orange focus ring 2px offset), disabled (40% opacity). Labels: "SUBMIT", "CANCEL", "DELETE", "COPY", "REFRESH".
>
> **CATEGORY B — Inputs (reusable components):**
>
> Text input: 40px height, 4px radius, 1px border, Geist Sans 14px. Focus: accent orange border + subtle glow. Textarea: multi-line, same styling, min 3 rows. Search input: with search icon (16px) left. Command variant with orange `>` prefix in Mono. Select/Dropdown: text input look with chevron-down. Toggle switch: 40x20px track, 16px thumb, gray off / accent orange on, 150ms transition. States: empty/placeholder, filled, focused, error (red border + message), disabled. Labels above in Geist Mono 11px ALL-CAPS wide tracking secondary color.
>
> **CATEGORY C — Cards (reusable components):**
>
> Standard: Surface bg, 1px border, 8px radius, 16px padding, no shadow. Title (Sans 16px/600) + description (Sans 14px secondary). Highlighted: 2px accent orange left border. Tool call card: Collapsible — header with status dot (gray/orange/green/red) + tool name (Mono 13px) + expand chevron. Collapsed = header only. Expanded = code block content (inset bg, Mono 12px). Stat card: Large number (Mono 28px/700) + label (Mono 11px ALL-CAPS). Compact for 2-3 across 350px. Settings section card: Full-width flush, Forge orange-dot pattern — small `●` accent + ALL-CAPS Mono label + horizontal rule.
>
> **CATEGORY D — Tags & Badges (reusable components):**
>
> Tags: Default (gray bg/text, 4px radius, Mono 11px ALL-CAPS, 4px 8px padding), Accent (orange 10% opacity bg, orange text), Success/Error/Info (tinted bg + matching text). Status badges (Nexora Mono style): colored dot with subtle glow (box-shadow). Variants: live (green glow), ready (blue), building (yellow pulse), error (red), neutral (gray).
>
> **CATEGORY E — UI Patterns & Utilities (reusable components):**
>
> Section label: Orange dot `●` + ALL-CAPS Mono + optional horizontal rule. Dividers: 1px border-subtle (solid and dotted variants). Skeleton loader: rounded rectangles with shimmer animation (single line, multi-line, card-sized variants). Empty state: centered icon (24px ghost) + title (Sans 16px) + description (Sans 13px secondary). Cursor blink: block in accent orange, step-end 1s.

---

## Session 3: Icon Set

**Agents:** 4-6 (one per icon category)
**Depends on:** Session 1 (tokens must exist)
**Can run in parallel with Session 2** (open a separate Pencil chat tab)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/SPEC.md
/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/ToolIcons.tsx
```

### Prompt:

> Create an "Icon Set" frame. Every icon is a reusable component. No emojis anywhere. Read the attached icon spec for the tool-specific icons. If any file path is unreadable, let me know.
>
> **Design rules for all icons:** Outline style, 1.5px stroke, sharp joins (miter), no fill. 16x16 base grid. Sizes: 16px (inline), 20px (cards), 24px (nav). Default color: inherits text color. Active: accent orange. Aesthetic: geometric, minimal, modern, futuristic terminal feel — not retro or dated.
>
> Build these icon categories as parallel workstreams:
>
> **GROUP A — Navigation & UI (26 icons):**
> Send (geometric up-arrow), Plus (for attachments), Settings/Gear (6-tooth), Chat/Message (speech bubble), Folder/Files, Trash/Delete, Eye/Visibility, Eye-Off (strike), Sun, Moon, Chevron (up/down/left/right), Check, X/Close, Square/Stop (filled, for abort), Spinner (three-quarter circle for rotation), Plus, Minus, Search (magnifying glass), Copy (overlapping rectangles), Edit/Pencil, Refresh (circular arrows), Warning (triangle + exclamation), Info (circle + "i").
>
> **GROUP B — Interaction (6 icons):**
> Expand (diagonal arrows out), Collapse (diagonal arrows in), Drag handle (6-dot 2x3 grid), Pin, Arrow-right (CTA), External link (box + escaping arrow).
>
> **GROUP C — Header Status Grid (4 icon sets that swap per state):**
>
> Phase icons (one per state): Discuss = two overlapping speech bubbles. Plan = clipboard with lines. Execute = lightning bolt (geometric). Verify = magnifying glass with checkmark. Waiting = pause bars. Blocked = circle with diagonal line. Completed = circle with checkmark.
>
> Permission icons (one per state): Read-only = minimal geometric lock/latch (modern, not a literal padlock). Confirm writes = pencil with dot. Confirm risky = pencil with warning triangle. Full auto = bolt/zap.
>
> Follow mode: Eye icon (on = accent, off = muted).
>
> Diagnostics: Pulse/waveform line (compact, reads as "system health").
>
> **GROUP D — Tool-Specific & Status (12+ icons):**
>
> Tool icons (from Forge spec): Bash/Terminal (`>_`), Read/Scan (horizontal lines), PDF convert, DOCX convert, XLSX convert, Web search (signal arcs), Web fetch (pull arrow), Screenshot (viewfinder brackets).
>
> Status dots: Idle (gray 8px), Running (orange 8px, pulse-ready), Done (green 8px), Error (red 8px).
>
> Special: History (clock with circular arrow), Brain (geometric brain outline for thinking picker), Model (small chip/processor for model picker).
>
> Lay out in a grid grouped by category. Label each. Show 16px default with a row of 20px and 24px for representative samples.

---

## Session 4: Chat-Specific Components

**Agents:** 4 (messages, input area, tool/thinking blocks, progress/error/streaming)
**Depends on:** Sessions 2 & 3 (components and icons must exist)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/systems/forge/components/chat.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/terminal.css
/Users/kosta/LocalDev/Design_Library/systems/forge/components/inputs.css
/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/animation-tokens.ts
```

### Prompt:

> Build chat-specific components in the "Component Library" frame. Width: 320px max (leaving padding in 350px panel). Both light and dark. Read the attached files. If any path is unreadable, let me know.
>
> Build these as parallel workstreams:
>
> **TRACK A — Message Containers:**
>
> User message: Right-aligned, 32px left margin. Subtle tint (light: `#EEF2FF`, dark: `#1A1A2E`), 8px radius, 12px padding. Sans 14px. Small expand/collapse arrow icon top-right. Max height = 2/3 of content area (computed dynamically). When collapsed to max-height, content scrolls within. Toggle to expand full.
>
> Assistant message: Full width, no indent. Light container or no background. Same collapsible behavior. Markdown rendering: headings, code blocks (Forge terminal style — orange keywords, amber strings, cyan comments, inset bg, Mono 13px, 4px radius), inline code (surface bg, Mono), links (accent orange, underline on hover), lists (clean consistent rendering), blockquotes (2px accent orange left border).
>
> **TRACK B — Chat Input Area (single unified container):**
>
> One bordered container (surface bg, 1px border, 8px radius). Inside: textarea on top (Sans 14px, placeholder "Message...", grows min 1 row to max 6 rows then scrolls, padding between text and toolbar). File attachment chips between textarea and toolbar (pill tags: surface bg, 4px radius, icon + name + X, 3 rows max then "+N more"). Bottom toolbar inside container: `[+]` plus icon (32x32 ghost) far left, model picker center-right ("claude-sonnet" Mono 13px, clickable dropdown, chip icon), brain SVG + thinking level as one unit ("[brain] High", dropdown: off/low/medium/high) right of model, send arrow far right (custom SVG, dimmed gray no text, accent orange when text). States: empty, typing, focused (orange border+glow), with attachments, streaming (textarea dimmed, stop button replaces send), error (banner above container).
>
> **TRACK C — Tool Call & Thinking Blocks:**
>
> Tool call block: Collapsible. Smart default — collapsed for routine, auto-expanded for errors. Header: individual SVG per tool (animated while running) + name (Mono 13px) + explanation (Sans 13px secondary) + status. Running = icon animates, accent orange. Done = green, muted. Error = red, expanded. Content: args code block + result code block (truncated 6 lines, "Show more" accent link).
>
> Thinking block: Collapsible with animation. 2px accent orange left border. "THINKING" header (Mono 11px ALL-CAPS accent, expand chevron). Expanded: streaming text (Sans 13px secondary, 120px max-height scroll). Pulse animation during active thinking (opacity breathe 2s).
>
> **TRACK D — Progress, Error & Streaming:**
>
> Task progress bar: Horizontal segmented, full width. N segments per task, 1px gaps. Pending = gray, completed = accent orange, in-progress = pulsing orange. Current task name beside bar (Mono 11px secondary). Expandable to show all tasks. Under 40px collapsed. Examples: 3, 5, 8 segments.
>
> Error block: Full width, red-tinted bg 10%, 1px red border, 8px radius. Warning icon + text (Sans 14px). Shake animation on appear.
>
> Streaming cursor: Blinking block accent orange (8x16px), step-end 1s. Appended to last assistant line.

---

## Session 5: All Screens

**Agents:** 6 (one per screen: chat light, chat dark, settings, files, history overlay, drawers/banners)
**Depends on:** Session 4 (chat components must exist)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/systems/forge/components/patterns.css
/Users/kosta/LocalDev/Design_Library/systems/forge/docs/DESIGN_SYSTEM.md
```

### Prompt:

> Build all application screens using components from the Component Library and Icon Set frames. Each screen is 350px wide x 700px tall. Read the attached files. If any path is unreadable, let me know.
>
> Build these screens as parallel workstreams:
>
> **SCREEN A — Chat Screen (Light, primary):**
>
> Header (single row, two zones with soft vertical divider): Left = `[+ NEW]` accent orange button (plus icon, orange underline = active chat) + FILES text tab + SETTINGS text tab + History icon button (clock). Right = 2x2 status grid: top-left = phase icon (show "execute" state), top-right = permission icon (show "confirm-writes"), bottom-left = follow eye icon, bottom-right = diagnostics pulse icon. All icons tooltip on hover, no text.
>
> Task progress bar below header: 5 segments, 3 completed (orange), 1 in-progress (pulsing), 1 pending (gray). Current task name beside.
>
> Content: 2-3 user messages, 2-3 assistant responses (one with Forge terminal code block, one with collapsed thinking block, one with tool call in running state). Messages in clean containers with expand icon top-right. Scroll-to-bottom fab (32px circle, chevron-down) shown as if scrolled up.
>
> Chat input: unified container, typing state, "claude-sonnet" model picker, brain "High", send arrow accent orange.
>
> Footer: `↑1.2k  ↓2.3k  $0.02` + context bar `████░░░ 40%`. Mono 10px muted.
>
> **SCREEN B — Chat Screen (Dark):**
> Same layout as Screen A but dark theme. Show different message content for variety. Show a thinking block expanded with streaming text. Show the diagnostics drawer expanded (pushing content down, with shade animation indicated).
>
> **SCREEN C — Settings Screen (Light + Dark side by side):**
>
> SETTINGS tab active (orange underline). Scrollable collapsible sections with Forge section-label pattern (orange dot + ALL-CAPS Mono + rule):
>
> 1. API CONFIGURATION (expanded): Provider dropdown, API key (masked + eye toggle), CORS proxy toggle.
> 2. MODEL PICKER (expanded): Model dropdown, thinking level segmented control (OFF/LOW/MEDIUM/HIGH, active = accent), permission mode segmented control (4 options, description below), context window limit input, token output limit input.
> 3. TOOLS (expanded): Web search dropdown + API key, image search toggle. MCP section: "ADD MCP SERVER" accent button. Show popup mockup with JSON textarea + friendly form (name/command/args) + ADD/CANCEL. Label "MCP integration coming soon."
> 4. CUSTOM INSTRUCTIONS (collapsed): textarea + description.
> 5. APPEARANCE (collapsed): theme segmented control LIGHT/DARK/AUTO. Note: "Theme toggle is in Settings only."
> 6. ADVANCED (collapsed): expand tool calls toggle, show diagnostics toggle.
>
> Sections 1-3 expanded, 4-6 collapsed. Chevron rotation on expand.
>
> **SCREEN D — Files Screen (Light = file list, Dark = empty state):**
>
> FILES tab active. Light variant: Drop zone (dashed border, 80px, upload icon + "Drop files here or click to browse", dragover = accent orange). Below: compact file rows (40px: type icon + name + size + hover X). 5-6 files. Dark variant: empty state (folder-plus icon + "No files attached" + "Upload files to include them as context").
>
> **SCREEN E — History Overlay:**
>
> Show overlaying the chat content area (header and input still visible). One-column list of session cards. Each card: session title (Mono 13px), timestamp (Mono 11px secondary), thin context bar (tokens consumed / total), session status icon (completed checkmark / paused in plan / stopped mid-execute). Close button top-right. Surface bg with overlay shadow. 5-6 realistic entries.
>
> **SCREEN F — Approval Drawer & Resume Banner:**
>
> Show on the dark chat screen. Approval drawer: slides down below task bar, 2px accent-orange top border, surface bg, description text + "APPROVE" (accent) and "DENY" (ghost) buttons stacked vertically. Pushes content down. Resume banner: top of content, compact row — "Resume previous task?" + RESUME button + X close.

---

## Session 6: States, Animations & Interaction Reference

**Agents:** 3-4 (interaction states, transitions/motion strips, looping animations)
**Depends on:** Session 5 (all screens must exist)

### Provide these files:
```
/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/animation-tokens.ts
/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/motion-presets.ts
/Users/kosta/LocalDev/Design_Library/motion/forge-terminal/terminal-effects.css
```

### Prompt:

> Create a "States & Animations" frame as an implementation reference sheet. Read the attached motion files. If any path is unreadable, let me know.
>
> Build these sections as parallel workstreams:
>
> **SECTION A — Component State Matrix (visual examples of each):**
>
> | Component | Default | Hover | Active | Focused | Disabled |
> |-----------|---------|-------|--------|---------|----------|
> | Button primary | Orange fill | Darker orange | Scale 0.98 | Orange ring 2px | 40% opacity |
> | Button ghost | Transparent | Surface bg | Darker surface | Orange ring | 40% opacity |
> | Input | Default border | Same | — | Orange border+glow | Dimmed 60% |
> | Toggle | Gray track | Lighter | — | Orange ring | 40% opacity |
> | Card | Default border | Lighter border | — | — | — |
> | Tab | Secondary text | Primary text | — | Orange underline | — |
> | Icon button | Ghost color | Accent orange | Scale 0.95 | Orange ring | 40% opacity |
> | 2x2 grid icon | Muted | Primary+tooltip | — | — | — |
>
> **SECTION B — Transition Strips (annotated, 3-4 keyframes each):**
>
> 1. Message appear: opacity 0→1, y 8→0, blur 2→0. 250ms ease-out.
> 2. Tool call expand/collapse: height 0→auto. 250ms ease-in-out.
> 3. Tool icon running: per-tool animation (bash cursor blinks, search arcs pulse, screenshot brackets contract). Loops while active.
> 4. Thinking pulse: opacity 0.7→1→0.7. 2000ms breathe loop.
> 5. Task progress fill: width on completion. 350ms ease-out.
> 6. Tab switch: crossfade 150ms out + 150ms in.
> 7. Diagnostics drawer: height 0→auto slide+shade. 250ms ease-out. Collapse: 200ms ease-in.
> 8. Dropdown open: opacity 0→1, scaleY 0.96→1, origin top. 150ms. Close: reverse 100ms.
> 9. Approval drawer slide: height 0→auto, opacity 0→1. 250ms ease-out.
> 10. Error shake: x 0→-4→4→-2→0. 300ms. Once.
> 11. History overlay: opacity 0→1 + backdrop fade. 200ms.
> 12. Phase icon swap: crossfade. 150ms.
>
> **SECTION C — Looping Animations:**
>
> Skeleton shimmer: gradient sweep left→right, infinite 1500ms. Status dot pulse (running): scale 1→1.3→1, opacity 1→0.7→1. 2000ms. Streaming cursor: opacity 1→0 step-end 1000ms. Scroll-to-bottom fab appear: opacity 0→1, y 8→0. 150ms.
>
> **Reduced motion note:** All animations respect `prefers-reduced-motion`. When active: durations → 0, loops stop, opacity preserved but transforms removed.
>
> Organize strips vertically by category. Label each with timing and easing.

---

## After All Sessions

### Review & Iterate
Review the full canvas. Typical follow-ups:
- "Tighten spacing between X and Y"
- "Card border too strong in light mode — use border-subtle"
- "Add inline variant of tool call (no expand, just status + name)"

### SVG Icon Refinement
For tool-specific animated icons needing precise SVG paths, use a Claude Code agent referencing:
- `/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/SPEC.md`
- `/Users/kosta/LocalDev/Design_Library/iconography/forge-tool-icons/ToolIcons.tsx`

### Export to Code
Once design is approved, the `.pen` file is the source of truth. Claude Code reads it via the Pencil MCP to produce Svelte + Tailwind code.
