# Pencil Prompt Sequence: Office Agents UI/UX Design

## How to Use

1. Open `office-agents-ui.pen` in Pencil
2. For each session: drag-and-drop all files from the matching `session-N-files/` folder, then copy-paste the prompt from the code block below
3. Enable SWARM mode, set the recommended agent count, send

| Session | Agents | Drag from | Start when |
|---------|--------|-----------|------------|
| 1 | 3 | `session-1-files/` | Immediately |
| 2 | 5-6 | `session-2-files/` | After Session 1 |
| 3 | 4-6 | `session-3-files/` | After Session 1 (can run parallel with 2) |
| 4 | 4 | `session-4-files/` | After Sessions 2 & 3 |
| 5 | 6 | `session-5-files/` | After Session 4 |
| 6 | 3-4 | `session-6-files/` | After Session 5 |

---

## Session 1: Design Tokens

**Agents: 3** | **Files: `session-1-files/`**

```
Create a "Design Tokens" frame as the foundation for an Office Add-in side panel design system. This is a hybrid of Forge (warm industrial palette, orange accent) and Nexora Mono (structural discipline, border-only hierarchy). Read the attached files. If any file is unreadable, let me know which ones so I can paste the contents.

Light mode is the primary theme. Dark mode is secondary.

Build these sections as parallel workstreams on the canvas:

SECTION A — Color Palette (light left, dark right, side by side):

Backgrounds — Light: base #FAFAFA, raised #FFFFFF, surface #F4F4F4, overlay #FFFFFF, inset #F0EFEE. Dark: base #020202, raised #0A0A0A, surface #111111, overlay #1A1A1A, inset #000000. Label each swatch with token name and hex.

Gray scale: Forge's warm-brown grays, 10 steps (100-1000). Both themes side by side. Warm undertone intentional.

Accent: Forge Orange, 10 steps. Primary #D15010 (500). Mode-stable — same in both themes.

Text — Light: primary #171717, secondary #737373, muted #A3A3A3, ghost #D4D4D4. Dark: primary #EEEEEE, secondary #A3A3A3, muted #737373, ghost #404040.

Borders: subtle, default, strong, focus. Focus = accent orange. Forge warm values for dark, Nexora Mono clean values for light.

Semantic: Success (green), Error (red), Warning (reuses accent orange), Info (blue). Small labeled swatches.

SECTION B — Typography:

Load Geist Sans and Geist Mono from Google Fonts. Scale ratio 1.2 (minor third): xs 11px, sm 13px, base 14px, lg 19px, xl 23px, 2xl 28px, 3xl 34px. Show each in Geist Sans (400) and Geist Mono (400). Mark usage: body (base, Sans), code/terminal (sm, Mono), section labels (xs, Mono, ALL-CAPS, wide tracking), headings (lg-2xl, Sans, 600), nav items (sm, Mono, ALL-CAPS).

Spacing: 4px grid. Labeled samples: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96px.

SECTION C — Radius, Shadows & Motion:

Border radius: 0px (none), 4px (interactive: buttons, inputs, tags), 8px (containers: cards, panels), 12px (modals), 9999px (pills, dots). Show samples.

Shadows: Minimal. sm (subtle drop, floating only), md (popovers), overlay (modals). Default = "no shadow" — borders create hierarchy. Shadows only for floating layers.

Motion tokens: Durations — instant 75ms, fast 150ms, normal 250ms, medium 350ms, slow 500ms, breathe 2000ms. Easing curves — default, out, inOut, sharp. Show as labeled bezier thumbnails.
```

---

## Session 2: Full Component Library

**Agents: 5-6** | **Files: `session-2-files/`**

```
Create a "Component Library" frame using the design tokens from the "Design Tokens" frame. Reference the attached CSS files for visual direction. Adapt everything for a 350px-wide side panel. Show all components in both light (primary) and dark themes. No emojis anywhere. If any file is unreadable, let me know.

Build these component categories as parallel workstreams:

CATEGORY A — Buttons (reusable components, all states):

Variants: Primary (accent orange fill, white text, 36px height, 4px radius, Geist Mono 12px ALL-CAPS wide tracking), Secondary (transparent, 1px gray border), Ghost (no border/fill, subtle bg on hover), Accent (Primary with larger padding), Danger (red border/text, fills red on hover), Icon button (32x32 square, ghost style). Size variants: Default (36px), Small (28px, 11px text). States for each: default, hover, active/pressed, focused (orange focus ring 2px offset), disabled (40% opacity). Labels: "SUBMIT", "CANCEL", "DELETE", "COPY", "REFRESH".

CATEGORY B — Inputs (reusable components):

Text input: 40px height, 4px radius, 1px border, Geist Sans 14px. Focus: accent orange border + subtle glow. Textarea: multi-line, same styling, min 3 rows. Search input: with search icon (16px) left. Command variant with orange > prefix in Mono. Select/Dropdown: text input look with chevron-down. Toggle switch: 40x20px track, 16px thumb, gray off / accent orange on, 150ms transition. States: empty/placeholder, filled, focused, error (red border + message), disabled. Labels above in Geist Mono 11px ALL-CAPS wide tracking secondary color.

CATEGORY C — Cards (reusable components):

Standard: Surface bg, 1px border, 8px radius, 16px padding, no shadow. Title (Sans 16px/600) + description (Sans 14px secondary). Highlighted: 2px accent orange left border. Tool call card: Collapsible — header with status dot (gray/orange/green/red) + tool name (Mono 13px) + expand chevron. Collapsed = header only. Expanded = code block content (inset bg, Mono 12px). Stat card: Large number (Mono 28px/700) + label (Mono 11px ALL-CAPS). Compact for 2-3 across 350px. Settings section card: Full-width flush, Forge orange-dot pattern — small orange dot accent + ALL-CAPS Mono label + horizontal rule.

CATEGORY D — Tags & Badges (reusable components):

Tags: Default (gray bg/text, 4px radius, Mono 11px ALL-CAPS, 4px 8px padding), Accent (orange 10% opacity bg, orange text), Success/Error/Info (tinted bg + matching text). Status badges (Nexora Mono style): colored dot with subtle glow (box-shadow). Variants: live (green glow), ready (blue), building (yellow pulse), error (red), neutral (gray).

CATEGORY E — UI Patterns & Utilities (reusable components):

Section label: Orange dot + ALL-CAPS Mono + optional horizontal rule. Dividers: 1px border-subtle (solid and dotted variants). Skeleton loader: rounded rectangles with shimmer animation (single line, multi-line, card-sized variants). Empty state: centered icon (24px ghost) + title (Sans 16px) + description (Sans 13px secondary). Cursor blink: block in accent orange, step-end 1s.
```

---

## Session 3: Icon Set

**Agents: 4-6** | **Files: `session-3-files/`**
**Can run in parallel with Session 2** (open a second Pencil chat tab)

```
Create an "Icon Set" frame. Every icon is a reusable component. No emojis anywhere. Read the attached icon spec for the tool-specific icons. If any file is unreadable, let me know.

Design rules for all icons: Outline style, 1.5px stroke, sharp joins (miter), no fill. 16x16 base grid. Sizes: 16px (inline), 20px (cards), 24px (nav). Default color: inherits text color. Active: accent orange. Aesthetic: geometric, minimal, modern, futuristic terminal feel — not retro or dated.

Build these icon categories as parallel workstreams:

GROUP A — Navigation & UI (26 icons):
Send (geometric up-arrow), Plus (for attachments), Settings/Gear (6-tooth), Chat/Message (speech bubble), Folder/Files, Trash/Delete, Eye/Visibility, Eye-Off (strike), Sun, Moon, Chevron (up/down/left/right), Check, X/Close, Square/Stop (filled, for abort), Spinner (three-quarter circle for rotation), Plus, Minus, Search (magnifying glass), Copy (overlapping rectangles), Edit/Pencil, Refresh (circular arrows), Warning (triangle + exclamation), Info (circle + "i").

GROUP B — Interaction (6 icons):
Expand (diagonal arrows out), Collapse (diagonal arrows in), Drag handle (6-dot 2x3 grid), Pin, Arrow-right (CTA), External link (box + escaping arrow).

GROUP C — Header Status Grid (4 icon sets that swap per state):

Phase icons (one per state): Discuss = two overlapping speech bubbles. Plan = clipboard with lines. Execute = lightning bolt (geometric). Verify = magnifying glass with checkmark. Waiting = pause bars. Blocked = circle with diagonal line. Completed = circle with checkmark.

Permission icons (one per state): Read-only = minimal geometric lock/latch (modern, not a literal padlock). Confirm writes = pencil with dot. Confirm risky = pencil with warning triangle. Full auto = bolt/zap.

Follow mode: Eye icon (on = accent, off = muted).

Diagnostics: Pulse/waveform line (compact, reads as "system health").

GROUP D — Tool-Specific & Status (12+ icons):

Tool icons (from Forge spec): Bash/Terminal (>_), Read/Scan (horizontal lines), PDF convert, DOCX convert, XLSX convert, Web search (signal arcs), Web fetch (pull arrow), Screenshot (viewfinder brackets).

Status dots: Idle (gray 8px), Running (orange 8px, pulse-ready), Done (green 8px), Error (red 8px).

Special: History (clock with circular arrow), Brain (geometric brain outline for thinking picker), Model (small chip/processor for model picker).

Lay out in a grid grouped by category. Label each. Show 16px default with a row of 20px and 24px for representative samples.
```

---

## Session 4: Chat-Specific Components

**Agents: 4** | **Files: `session-4-files/`**

```
Build chat-specific components in the "Component Library" frame. Width: 320px max (leaving padding in 350px panel). Both light and dark. Read the attached files. If any file is unreadable, let me know.

Build these as parallel workstreams:

TRACK A — Message Containers:

User message: Right-aligned, 32px left margin. Subtle tint (light: #EEF2FF, dark: #1A1A2E), 8px radius, 12px padding. Sans 14px. Small expand/collapse arrow icon top-right. Max height = 2/3 of content area (computed dynamically). When collapsed to max-height, content scrolls within. Toggle to expand full.

Assistant message: Full width, no indent. Light container or no background. Same collapsible behavior. Markdown rendering: headings, code blocks (Forge terminal style — orange keywords, amber strings, cyan comments, inset bg, Mono 13px, 4px radius), inline code (surface bg, Mono), links (accent orange, underline on hover), lists (clean consistent rendering), blockquotes (2px accent orange left border).

TRACK B — Chat Input Area (single unified container):

One bordered container (surface bg, 1px border, 8px radius). Inside: textarea on top (Sans 14px, placeholder "Message...", grows min 1 row to max 6 rows then scrolls, padding between text and toolbar). File attachment chips between textarea and toolbar (pill tags: surface bg, 4px radius, icon + name + X, 3 rows max then "+N more"). Bottom toolbar inside container: [+] plus icon (32x32 ghost) far left, model picker center-right ("claude-sonnet" Mono 13px, clickable dropdown, chip icon), brain SVG + thinking level as one clickable unit ("[brain] High", dropdown: off/low/medium/high) right of model, send arrow far right (custom SVG, dimmed gray no text, accent orange when text). States: empty, typing, focused (orange border+glow), with attachments, streaming (textarea dimmed, stop button replaces send), error (banner above container).

TRACK C — Tool Call & Thinking Blocks:

Tool call block: Collapsible. Smart default — collapsed for routine, auto-expanded for errors. Header: individual SVG per tool (animated while running) + name (Mono 13px) + explanation (Sans 13px secondary) + status. Running = icon animates, accent orange. Done = green, muted. Error = red, expanded. Content: args code block + result code block (truncated 6 lines, "Show more" accent link).

Thinking block: Collapsible with animation. 2px accent orange left border. "THINKING" header (Mono 11px ALL-CAPS accent, expand chevron). Expanded: streaming text (Sans 13px secondary, 120px max-height scroll). Pulse animation during active thinking (opacity breathe 2s).

TRACK D — Progress, Error & Streaming:

Task progress bar: Horizontal segmented, full width. N segments per task, 1px gaps. Pending = gray, completed = accent orange, in-progress = pulsing orange. Current task name beside bar (Mono 11px secondary). Expandable to show all tasks. Under 40px collapsed. Examples: 3, 5, 8 segments.

Error block: Full width, red-tinted bg 10%, 1px red border, 8px radius. Warning icon + text (Sans 14px). Shake animation on appear.

Streaming cursor: Blinking block accent orange (8x16px), step-end 1s. Appended to last assistant line.
```

---

## Session 5: All Screens

**Agents: 6** | **Files: `session-5-files/`**

```
Build all application screens using components from the Component Library and Icon Set frames. Each screen is 350px wide x 700px tall. Read the attached files. If any file is unreadable, let me know.

Build these screens as parallel workstreams:

SCREEN A — Chat Screen (Light, primary):

Header (single row, two zones with soft vertical divider): Left = [+ NEW] accent orange button (plus icon, orange underline = active chat) + FILES text tab + SETTINGS text tab + History icon button (clock). Right = 2x2 status grid: top-left = phase icon (show "execute" state), top-right = permission icon (show "confirm-writes"), bottom-left = follow eye icon, bottom-right = diagnostics pulse icon. All icons tooltip on hover, no text.

Task progress bar below header: 5 segments, 3 completed (orange), 1 in-progress (pulsing), 1 pending (gray). Current task name beside.

Content: 2-3 user messages, 2-3 assistant responses (one with Forge terminal code block, one with collapsed thinking block, one with tool call in running state). Messages in clean containers with expand icon top-right. Scroll-to-bottom fab (32px circle, chevron-down) shown as if scrolled up.

Chat input: unified container, typing state, "claude-sonnet" model picker, brain "High", send arrow accent orange.

Footer: up-arrow 1.2k down-arrow 2.3k $0.02 + context bar (filled bar with 40%). Mono 10px muted.

SCREEN B — Chat Screen (Dark):
Same layout as Screen A but dark theme. Show different message content for variety. Show a thinking block expanded with streaming text. Show the diagnostics drawer expanded (pushing content down, with shade animation indicated).

SCREEN C — Settings Screen (Light + Dark side by side):

SETTINGS tab active (orange underline). Scrollable collapsible sections with Forge section-label pattern (orange dot + ALL-CAPS Mono + rule):

1. API CONFIGURATION (expanded): Provider dropdown, API key (masked + eye toggle), CORS proxy toggle.
2. MODEL PICKER (expanded): Model dropdown, thinking level segmented control (OFF/LOW/MEDIUM/HIGH, active = accent), permission mode segmented control (4 options, description below), context window limit input, token output limit input.
3. TOOLS (expanded): Web search dropdown + API key, image search toggle. MCP section: "ADD MCP SERVER" accent button. Show popup mockup with JSON textarea + friendly form (name/command/args) + ADD/CANCEL. Label "MCP integration coming soon."
4. CUSTOM INSTRUCTIONS (collapsed): textarea + description.
5. APPEARANCE (collapsed): theme segmented control LIGHT/DARK/AUTO. Note: "Theme toggle is in Settings only."
6. ADVANCED (collapsed): expand tool calls toggle, show diagnostics toggle.

Sections 1-3 expanded, 4-6 collapsed. Chevron rotation on expand.

SCREEN D — Files Screen (Light = file list, Dark = empty state):

FILES tab active. Light variant: Drop zone (dashed border, 80px, upload icon + "Drop files here or click to browse", dragover = accent orange). Below: compact file rows (40px: type icon + name + size + hover X). 5-6 files. Dark variant: empty state (folder-plus icon + "No files attached" + "Upload files to include them as context").

SCREEN E — History Overlay:

Show overlaying the chat content area (header and input still visible). One-column list of session cards. Each card: session title (Mono 13px), timestamp (Mono 11px secondary), thin context bar (tokens consumed / total), session status icon (completed checkmark / paused in plan / stopped mid-execute). Close button top-right. Surface bg with overlay shadow. 5-6 realistic entries.

SCREEN F — Approval Drawer & Resume Banner:

Show on the dark chat screen. Approval drawer: slides down below task bar, 2px accent-orange top border, surface bg, description text + "APPROVE" (accent) and "DENY" (ghost) buttons stacked vertically. Pushes content down. Resume banner: top of content, compact row — "Resume previous task?" + RESUME button + X close.
```

---

## Session 6: States, Animations & Interaction Reference

**Agents: 3-4** | **Files: `session-6-files/`**

```
Create a "States & Animations" frame as an implementation reference sheet. Read the attached motion files. If any file is unreadable, let me know.

Build these sections as parallel workstreams:

SECTION A — Component State Matrix (visual examples of each):

Button primary: default = orange fill, hover = darker orange, active = scale 0.98, focused = orange ring 2px, disabled = 40% opacity.
Button ghost: default = transparent, hover = surface bg, active = darker surface, focused = orange ring, disabled = 40% opacity.
Input: default = default border, hover = same, focused = orange border + glow, disabled = dimmed 60%.
Toggle: default = gray track, hover = lighter, focused = orange ring, disabled = 40% opacity.
Card: default = default border, hover = lighter border.
Tab: default = secondary text, hover = primary text.
Icon button: default = ghost color, hover = accent orange, active = scale 0.95, focused = orange ring, disabled = 40% opacity.
2x2 grid icon: default = muted, hover = primary + tooltip.

SECTION B — Transition Strips (annotated, 3-4 keyframes each):

1. Message appear: opacity 0 to 1, y 8 to 0, blur 2 to 0. 250ms ease-out.
2. Tool call expand/collapse: height 0 to auto. 250ms ease-in-out.
3. Tool icon running: per-tool animation (bash cursor blinks, search arcs pulse, screenshot brackets contract). Loops while active.
4. Thinking pulse: opacity 0.7 to 1 to 0.7. 2000ms breathe loop.
5. Task progress fill: width on completion. 350ms ease-out.
6. Tab switch: crossfade 150ms out + 150ms in.
7. Diagnostics drawer: height 0 to auto slide+shade. 250ms ease-out. Collapse: 200ms ease-in.
8. Dropdown open: opacity 0 to 1, scaleY 0.96 to 1, origin top. 150ms. Close: reverse 100ms.
9. Approval drawer slide: height 0 to auto, opacity 0 to 1. 250ms ease-out.
10. Error shake: x 0 to -4 to 4 to -2 to 0. 300ms. Once.
11. History overlay: opacity 0 to 1 + backdrop fade. 200ms.
12. Phase icon swap: crossfade. 150ms.

SECTION C — Looping Animations:

Skeleton shimmer: gradient sweep left to right, infinite 1500ms. Status dot pulse (running): scale 1 to 1.3 to 1, opacity 1 to 0.7 to 1. 2000ms. Streaming cursor: opacity 1 to 0 step-end 1000ms. Scroll-to-bottom fab appear: opacity 0 to 1, y 8 to 0. 150ms.

Reduced motion note: All animations respect prefers-reduced-motion. When active: durations become 0, loops stop, opacity preserved but transforms removed.

Organize strips vertically by category. Label each with timing and easing.
```

---

## After All Sessions

**Review:** I can take screenshots of each frame via the Pencil MCP and check against the design spec.

**SVG refinement:** For tool-specific animated icons needing precise paths, use a Claude Code agent.

**Export to code:** Once approved, the .pen file is the source of truth. Claude Code reads it via Pencil MCP to produce Svelte + Tailwind.
