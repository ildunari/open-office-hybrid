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

These appear throughout the header, footer, input area, and menus.

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 1 | `send` | Chat input (send button) | Geometric upward arrow. Sharp, angular. Not a paper airplane. Dimmed gray when inactive, accent orange when active. |
| 2 | `plus` | Chat input (attachment button) | Simple + crosshair. 1.5px strokes. Used as the attachment/add button in the input toolbar. |
| 3 | `settings-gear` | Header tab, settings | 6-tooth gear. Geometric teeth, not rounded. Clean mechanical feel. |
| 4 | `folder-files` | Header tab (FILES) | Simple folder outline. Sharp corners, 2px radius max on the tab flap. |
| 5 | `trash-delete` | File list, message actions | Rectangular bin with lid line. No curves. |
| 6 | `eye-visible` | Follow mode (2x2 grid), password toggle | Open eye. Geometric oval + circle pupil. Sharp endpoints. |
| 7 | `eye-off` | Follow mode off state | Same eye with a diagonal strike line through it. |
| 8 | `sun` | Settings (theme: light) | Circle with 8 radiating lines. Geometric, not wavy rays. |
| 9 | `moon` | Settings (theme: dark) | Crescent. Sharp, geometric arc. Not a friendly rounded moon. |
| 10 | `chevron-up` | Collapsible sections, dropdowns | Simple `^` angle. 1.5px stroke. |
| 11 | `chevron-down` | Collapsible sections, dropdowns | Simple `v` angle. |
| 12 | `chevron-left` | Back navigation | Simple `<` angle. |
| 13 | `chevron-right` | Forward, expand | Simple `>` angle. |
| 14 | `check` | Completed states, toggles | Simple checkmark. Two strokes at ~45 and ~135 degrees. Sharp. |
| 15 | `x-close` | Close buttons, dismiss, file removal | Two crossing diagonal strokes. |
| 16 | `square-stop` | Abort/stop streaming | Filled square (this is the one icon that uses fill). Small, 10x10 within 16x16 grid. |
| 17 | `spinner` | Loading states | Three-quarter circle arc. Animated: rotates 360deg linear infinite. |
| 18 | `search` | Search input, command palette | Magnifying glass. Circle + diagonal handle. Sharp join. |
| 19 | `copy` | Code block copy, message actions | Two overlapping offset rectangles. Sharp corners. |
| 20 | `edit-pencil` | Edit actions | Angled pencil at ~45 degrees. Geometric tip. |
| 21 | `refresh` | Retry, reconnect | Two circular arrows forming a loop. Sharp endpoints. |
| 22 | `warning-triangle` | Error states, permission confirm-risky | Equilateral triangle + centered exclamation mark. |
| 23 | `info-circle` | Tooltips, info states | Circle + centered lowercase "i" letter. |
| 24 | `plus-sm` | Add MCP, add item | Smaller + at 12px. For inline add buttons. |
| 25 | `minus` | Remove item, decrease | Horizontal line. Simple. |
| 26 | `upload` | File drop zone | Upward arrow with a horizontal base line below it (upload tray). |

---

## SECTION 2: Interaction Icons (6 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 27 | `expand` | Message container expand toggle | Two diagonal arrows pointing outward from center (top-right + bottom-left). |
| 28 | `collapse` | Message container collapse toggle | Two diagonal arrows pointing inward toward center. |
| 29 | `drag-handle` | Reorderable items (future) | 6-dot grid (2 columns x 3 rows of small circles). |
| 30 | `pin` | Pinned messages (future) | Angled pin. Geometric, like a map tack with sharp point. |
| 31 | `arrow-right` | CTA, navigation | Right-pointing arrow with tail. Sharp, not curved. |
| 32 | `external-link` | Links opening externally | Small square with an arrow escaping from the top-right corner. |

---

## SECTION 3: Header Status Grid Icons (4 icon sets)

These live in the 2x2 grid in the header. Each icon position swaps between states. Generate each state variant as a separate SVG.

### 3A. Phase Icons (7 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 33 | `phase-discuss` | Discuss | Two overlapping speech bubbles. Slightly offset. Sharp corners, 2px radius only on bubble tails. |
| 34 | `phase-plan` | Plan | Clipboard with 3 horizontal lines (checklist). Sharp rectangle, small clip at top. |
| 35 | `phase-execute` | Execute | Lightning bolt. Geometric zigzag, not organic. Sharp angles. |
| 36 | `phase-verify` | Verify | Magnifying glass with a small checkmark inside the lens circle. |
| 37 | `phase-waiting` | Waiting on user | Two vertical pause bars. Centered in grid. |
| 38 | `phase-blocked` | Blocked | Circle with diagonal line through it (prohibition sign). 1.5px stroke. |
| 39 | `phase-completed` | Completed | Circle with checkmark inside. Clean. |

### 3B. Permission Icons (4 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 40 | `perm-readonly` | Read-only | Minimal geometric latch/slider in locked position. Modern, not a literal padlock. Think: a horizontal slider bar with a notch locked into place. |
| 41 | `perm-confirm` | Confirm writes | Small pencil with a dot beside it (write + needs approval). |
| 42 | `perm-confirm-risky` | Confirm risky | Small pencil with a warning triangle beside it. |
| 43 | `perm-auto` | Full auto | Bolt/zap icon. Small geometric lightning. Implies autonomous speed. |

### 3C. Follow Mode Icon (2 states)

| # | Name | State | Description |
|---|------|-------|-------------|
| 44 | `follow-on` | Auto-apply on | Eye icon (same as `eye-visible` #6) rendered in accent orange. |
| 45 | `follow-off` | Auto-apply off | Eye icon rendered in muted/ghost color. |

### 3D. Diagnostics Icon (1 icon + drawer trigger)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 46 | `diagnostics-pulse` | 2x2 grid, bottom-right | Pulse/waveform: a short horizontal line that peaks sharply upward in the middle (like an EKG blip). Compact, reads as "system health" at 16px. Click opens diagnostics drawer. |

---

## SECTION 4: Chat-Specific Icons (8 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 47 | `history-clock` | Header (history button) | Clock face circle with a small circular arrow wrapping counterclockwise around it. Combined clock + undo metaphor = session history. |
| 48 | `brain` | Chat input (thinking picker) | Geometric brain outline. Not organic/medical — more like two mirrored hemispheres made of angular segments. Futuristic, schematic. Think: circuit board brain. |
| 49 | `model-chip` | Chat input (model picker) | Small processor/chip: square with tiny pins/lines extending from each side. Reads as "AI model" or "compute." |
| 50 | `scroll-to-bottom` | Floating action button in chat | Downward chevron inside a circle. Appears when scrolled up. |
| 51 | `new-chat-plus` | Header [+ NEW] button | Plus icon variant, slightly bolder (2px stroke), designed specifically to sit inside the accent orange button. White stroke on orange bg. |
| 52 | `message-expand` | Message container top-right | Small up-right diagonal arrow (tiny expand). 12px variant of #27. |
| 53 | `cursor-block` | Streaming indicator | Filled rectangle 8x16px in accent orange. Blinks with step-end animation 1s. Not a traditional cursor — a block cursor. |
| 54 | `terminal-prompt` | Tool call headers, command input | `>_` glyph. The `>` in accent orange, the `_` blinks. Factory Droid signature element. |

---

## SECTION 5: Tool-Specific Icons (28 unique glyphs)

These appear in tool call blocks in the chat. Each has idle/running/done/error animation states. Full specs in `forge-tool-icons-SPEC.md`. Generate as static SVGs; animations will be added in code.

### 5A. Shared Tools (All Apps) — 8 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 55 | `tool-bash` | `bash` | `>_` prompt caret with blinking cursor block. Terminal prompt glyph. |
| 56 | `tool-read` | `read` | Three stacked horizontal lines of decreasing width, small downward chevron at left edge (read head scanning down). |
| 57 | `tool-pdf-to-text` | `pdf-to-text` | Rounded-corner document frame with right-pointing arrow leading to three text-line bars. Tiny "PDF" stencil in doc frame. |
| 58 | `tool-pdf-to-images` | `pdf-to-images` | Same doc frame with arrow leading to 2x2 pixel grid (four small squares). |
| 59 | `tool-docx-to-text` | `docx-to-text` | Pilcrow `paragraph` mark with arrow leading to three text-line bars. |
| 60 | `tool-xlsx-to-csv` | `xlsx-to-csv` | Small 2x3 cell grid with arrow leading to comma glyph. |
| 61 | `tool-web-search` | `web-search` | Small circle with two concentric arc segments radiating outward (radar ping). Not a magnifying glass. |
| 62 | `tool-web-fetch` | `web-fetch` | Downward-pointing arrow with horizontal line at top (network boundary). Data being pulled through. |

### 5B. Excel-Specific Tools — 11 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 63 | `tool-get-cell` | `get_cell_ranges` | 3x3 cell grid with crosshair/reticle over one cell. |
| 64 | `tool-get-csv` | `get_range_as_csv` | 3x3 grid with notch in bottom-right + outward arrow. |
| 65 | `tool-set-cell` | `set_cell_range` | 3x3 grid with downward arrow entering top edge. |
| 66 | `tool-clear-cell` | `clear_cell_range` | 3x3 grid with diagonal strikethrough line. |
| 67 | `tool-copy-to` | `copy_to` | Two overlapping offset rectangles with directional arrow between. |
| 68 | `tool-resize` | `resize_range` | Two vertical bracket lines with horizontal double-arrow between. |
| 69 | `tool-search-data` | `search_data` | 3x3 grid with horizontal scan line passing through one row. |
| 70 | `tool-modify-sheet` | `modify_sheet_structure` | Three horizontal lines with `+` insertion point between second and third. |
| 71 | `tool-modify-workbook` | `modify_workbook_structure` | Three tab rectangles offset horizontally with `+` on rightmost. |
| 72 | `tool-get-objects` | `get_all_objects` | Vertical list of three small shapes (square, circle, triangle) each with horizontal line beside. |
| 73 | `tool-modify-object` | `modify_object` | Rounded rectangle with small angled wrench mark at corner. |

### 5C. Excel Visual & Escape + VFS — 5 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 74 | `tool-screenshot-square` | `screenshot_range` | Rectangle with four L-shaped corner brackets (viewfinder). Square aspect. |
| 75 | `tool-eval-js` | `eval_officejs` / `execute_office_js` | `</>` code brackets with lightning bolt through the slash. |
| 76 | `tool-csv-to-sheet` | `csv-to-sheet` | Comma glyph with arrow leading to 2x3 grid. |
| 77 | `tool-sheet-to-csv` | `sheet-to-csv` | 2x3 grid with arrow leading to comma. |
| 78 | `tool-image-to-sheet` | `image-to-sheet` | Small square with inner 4x4 pixel grid (alternating filled/empty). |

### 5D. PowerPoint-Specific Tools — 10 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 79 | `tool-list-shapes` | `list_slide_shapes` | Three offset rectangles stacked with parallax (z-index layers). |
| 80 | `tool-read-text` | `read_slide_text` | Rounded rectangle with `<` bracket at left edge. |
| 81 | `tool-edit-text` | `edit_slide_text` | Rounded rectangle with blinking text cursor `|` inside. |
| 82 | `tool-edit-xml` | `edit_slide_xml` | Horizontal rectangle (slide) with `</>` brackets inside. |
| 83 | `tool-edit-chart` | `edit_slide_chart` | Three vertical bars of ascending height. Raw geometric rectangles. |
| 84 | `tool-edit-master` | `edit_slide_master` | Rectangle with dashed-line interior grid (blueprint). |
| 85 | `tool-duplicate-slide` | `duplicate_slide` | Slide rectangle with second identical offset 3px, slightly dimmer. |
| 86 | `tool-screenshot-wide` | `screenshot_slide` | Viewfinder brackets in 16:9 aspect ratio. |
| 87 | `tool-verify-slides` | `verify_slides` | Small hexagonal shield with checkmark inside. |
| 88 | `tool-insert-image` | `insert-image` | Slide rectangle with smaller rectangle being pushed in from bottom-right. |

### 5E. PowerPoint VFS + Search — 2 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 89 | `tool-search-icons` | `search-icons` | 2x2 grid of small shapes (star, circle, square, triangle) with radar arc in corner. |
| 90 | `tool-image-search` | `image-search` | Radar ping signal with small image frame rectangle overlapping bottom-right. |

### 5F. Word-Specific Tools — 4 icons

| # | Name | Tool | Description |
|---|------|------|-------------|
| 91 | `tool-get-doc-text` | `get_document_text` | Three horizontal text lines prefixed by small index numbers (0, 1, 2). |
| 92 | `tool-get-doc-structure` | `get_document_structure` | Small tree/hierarchy: one node top, two branches to child nodes below. |
| 93 | `tool-get-ooxml` | `get_ooxml` | Document rectangle with `<w:>` tag overlaid at center. |
| 94 | `tool-get-para-ooxml` | `get_paragraph_ooxml` | Pilcrow `paragraph` flanked by angle brackets `< paragraph >`. |
| 95 | `tool-screenshot-portrait` | `screenshot_document` | Viewfinder brackets in portrait (document page) aspect ratio. |
| 96 | `tool-insert-icon` | `insert-icon` | Star/geometric shape with downward arrow entering center. |

---

## SECTION 6: Status Dots (4 variants)

Small colored circles used inline in tool call headers, task progress, and session status.

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 97 | `dot-idle` | Tool idle, task pending | Gray circle, 8px. Solid fill. No stroke. |
| 98 | `dot-running` | Tool running, task in-progress | Accent orange circle, 8px. Pulse animation (scale 1-1.3, opacity 1-0.7, 2s). |
| 99 | `dot-done` | Tool complete, task done | Green circle, 8px. Subtle glow (1-2px spread, low opacity). |
| 100 | `dot-error` | Tool error, task failed | Red circle, 8px. Subtle glow. |

---

## SECTION 7: Session Status Icons (for History panel cards)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 101 | `session-completed` | History card | Small circle with checkmark. Green tint. |
| 102 | `session-paused-plan` | History card | Clipboard icon (plan) with pause overlay. |
| 103 | `session-stopped-execute` | History card | Lightning bolt (execute) with stop square overlay. |
| 104 | `session-idle` | History card | Empty circle outline. Gray. |

---

## SECTION 8: Settings-Specific Icons (6 icons)

| # | Name | Used In | Description |
|---|------|---------|-------------|
| 105 | `key` | API key field | Small geometric key. Angled, sharp teeth. |
| 106 | `shield-lock` | Permission mode setting | Small hexagonal shield (reuse from verify-slides concept). |
| 107 | `sliders` | Advanced settings | Two horizontal lines with small circle handles at different positions. |
| 108 | `palette` | Appearance settings | Abstract circle divided into 4 quadrants (not a paint palette). |
| 109 | `text-cursor` | Custom instructions | Text cursor `|` between two horizontal text lines. |
| 110 | `puzzle-piece` | MCP/tools section | Single puzzle piece. Geometric, not rounded. Sharp edges on the connector nub. |

---

## TOTALS

| Category | Count |
|----------|-------|
| Navigation & UI | 26 |
| Interaction | 6 |
| Header Status Grid | 14 (7 phase + 4 permission + 2 follow + 1 diagnostics) |
| Chat-Specific | 8 |
| Tool-Specific | 42 (8 shared + 11 Excel + 5 Excel VFS + 10 PowerPoint + 2 PPT VFS + 6 Word) |
| Status Dots | 4 |
| Session Status | 4 |
| Settings | 6 |
| **TOTAL** | **110** |

---

## Generation Strategy

**Batch 1 — Navigation + Interaction (32 icons):** These are the most reusable and generic. Generate as a single coherent set.

**Batch 2 — Header Status Grid (14 icons):** These need to feel like dashboard indicators. Generate together for visual consistency across all states.

**Batch 3 — Chat + Settings (14 icons):** Mixed set but all appear in the side panel UI. Generate together.

**Batch 4 — Tool icons, shared (8 icons):** Terminal-native tool glyphs. Generate together.

**Batch 5 — Tool icons, Excel (16 icons):** Grid-heavy, data-manipulation metaphors. Generate together.

**Batch 6 — Tool icons, PowerPoint (12 icons):** Slide/shape/layer metaphors. Generate together.

**Batch 7 — Tool icons, Word (6 icons):** Document/paragraph/structure metaphors. Generate together.

**Batch 8 — Status dots + Session status (8 items):** Simple colored circles and composite status indicators. Generate together.

For each batch, provide the style context files listed at the top plus these instructions:
- All icons 16x16 base grid, 1.5px stroke, sharp miter joins, no fill
- Outline style only (exception: status dots and cursor-block are filled)
- Export as individual SVGs with clean paths, no embedded styles
- Colors: single stroke color (white or currentColor), accent elements in #D15010
- No rounded caps on stroke endpoints — use butt or square cap
- No decorative elements, gradients, or shadows
- Each icon should be identifiable at 16px and scale cleanly to 20px and 24px
