# Tool Call Icons — Office Agents

> Icon language for agentic tool call animations. Industrial, geometric, terminal-native.
> Follows the **Factory × Geist** hybrid design system.

---

## Icon Design Rules

| Principle | Spec |
|-----------|------|
| **Stroke** | 1.5px outline, `var(--text-secondary)` idle → `var(--text-primary)` active |
| **Canvas** | 16×16 base grid (scale to 20/24 for larger contexts) |
| **Fill** | None by default. Accent fill (`var(--accent-500)`) only on active/running state |
| **Shape language** | Straight edges, sharp joins. Radius only where functional (rounded caps on strokes). No organic curves. |
| **Metaphor source** | Terminal glyphs, circuit schematics, engineering diagrams — not office/consumer iconography |
| **Color during animation** | Idle: `--text-tertiary` → Running: stroke animates to `--accent-500` → Complete: flashes `--text-primary`, fades to `--text-secondary` |

---

## Shared Tools (All 3 Apps)

These 8 tool calls appear in **every** Office add-in.

### SDK Agent Tools

| Tool | Icon Concept | Description |
|------|-------------|-------------|
| **`bash`** | **Prompt caret** — A `>_` glyph with a blinking cursor block. Single-weight monospace strokes. The cursor block pulses on execution. | Execute shell commands in a sandboxed VFS (ls, grep, jq, pipes) |
| **`read`** | **Scan lines** — Three stacked horizontal rules of decreasing width, a small downward-pointing chevron at the left edge (like a read head tracking down a page). | Read a file from the virtual filesystem; returns text with line numbers or renders images |

### Shared VFS Commands (bash subcommands)

| Command | Icon Concept | Description |
|---------|-------------|-------------|
| **`pdf-to-text`** | **Document → glyphs** — A rounded-corner rectangle (doc frame) with a right-pointing arrow `→` leading to three small horizontal bars (text lines). A tiny "PDF" stencil mark in the doc frame. | Extract text content from an uploaded PDF file |
| **`pdf-to-images`** | **Document → grid** — Same doc frame with `→` leading to a 2×2 pixel grid (four small squares). Implies rasterization. | Render PDF pages as PNG images into VFS |
| **`docx-to-text`** | **Pilcrow → bars** — A `¶` pilcrow mark with `→` leading to three text-line bars. The pilcrow signals "rich document" without needing a brand logo. | Extract raw text from a .docx Word file |
| **`xlsx-to-csv`** | **Grid → comma** — A small 2×3 cell grid with `→` leading to a comma glyph `,` (or `CSV` in monospace stencil). | Convert an Excel .xlsx file to CSV format |
| **`web-search`** | **Signal ping** — A small circle with two concentric arc segments radiating outward (like a radar ping or broadcast signal). Not a magnifying glass. | Search the web and return structured results |
| **`web-fetch`** | **Pull arrow** — A downward-pointing arrow with a horizontal line at the top (representing a network boundary/horizon). Data being pulled through a threshold. | Fetch a URL and return its content to VFS |

---

## Excel — 16 App-Specific Calls

### Core Data Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 1 | **`get_cell_ranges`** | **Grid + probe** — A 3×3 cell grid with a small crosshair/reticle positioned over one cell. Implies targeted read access. | Read cell values, formulas, and formatting from specified A1-notation ranges |
| 2 | **`get_range_as_csv`** | **Grid + export notch** — A 3×3 cell grid with a small notch/cutout in the bottom-right corner and an outward arrow. Data leaving the grid. | Read a cell range and return it as raw CSV for analysis |
| 3 | **`set_cell_range`** | **Grid + inject** — A 3×3 cell grid with a small downward arrow entering the top edge. Data being written into cells. | Write values, formulas, and formatting to a cell range |
| 4 | **`clear_cell_range`** | **Grid + strike** — A 3×3 cell grid with a diagonal line across it (strikethrough). Clean, geometric deletion. | Clear contents, formatting, or both from a range |
| 5 | **`copy_to`** | **Offset duplicate** — Two overlapping rectangles offset by 3px diagonally, a small directional arrow between them. Not "stacked sheets" — more like a translation vector. | Copy a range to another location with formula translation and pattern fill |
| 6 | **`resize_range`** | **Bracket stretch** — Two vertical bracket lines `| |` with horizontal double-arrows `↔` between them. Implies dimensional adjustment. | Adjust column widths or row heights |
| 7 | **`search_data`** | **Grid + sweep** — A 3×3 cell grid with a horizontal scan line passing through (a single highlighted row). Implies scanning/seeking. | Find text or values across the workbook with regex support |

### Structure Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 8 | **`modify_sheet_structure`** | **Row/column splice** — Three horizontal lines with a `+` insertion point between the second and third. A structural insert/delete operation. | Insert, delete, hide, or freeze rows and columns |
| 9 | **`modify_workbook_structure`** | **Tab stack + action** — Three small rectangles arranged as tabs (offset horizontally like browser tabs), with a small `+` or `×` glyph on the rightmost tab. | Create, delete, rename, or duplicate worksheets |

### Object Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 10 | **`get_all_objects`** | **Inventory manifest** — A vertical list of three small heterogeneous shapes (square, circle, triangle) each with a horizontal line beside them. A parts list / bill of materials. | List all charts, pivot tables, and embedded objects in the workbook |
| 11 | **`modify_object`** | **Shape + wrench** — A single abstract shape (rounded rectangle) with a small angled wrench mark overlapping its corner. Modification, not creation. | Create, update, or delete charts and pivot tables |

### Visual & Escape Hatch

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 12 | **`screenshot_range`** | **Viewfinder frame** — A rectangle with small corner brackets (like a camera viewfinder crop). Four L-shaped corners defining a capture region. | Capture a visual screenshot of a cell range with row/column headers |
| 13 | **`eval_officejs`** | **Angle brackets + bolt** — `</>` code brackets with a small lightning bolt descending through the slash. Raw power. Escape hatch. | Execute arbitrary Office.js code inside Excel.run() — full API access |

### Excel-Only VFS Commands

| # | Command | Icon Concept | Description |
|---|---------|-------------|-------------|
| 14 | **`csv-to-sheet`** | **Comma → grid** — A comma glyph `,` with `→` leading to a 2×3 cell grid. Inverse of xlsx-to-csv. | Import a CSV file from VFS into a worksheet at a target cell |
| 15 | **`sheet-to-csv`** | **Grid → comma** — A 2×3 cell grid with `→` leading to a comma glyph. Mirrors csv-to-sheet but reversed. | Export a worksheet or range to CSV, optionally saving to VFS |
| 16 | **`image-to-sheet`** | **Pixel raster** — A small square with an inner 4×4 pixel grid pattern (alternating filled/empty squares). Pixel art at the atomic level. | Render an image as colored cells — pixel art in the spreadsheet |

**Excel total: 24** (2 SDK + 6 shared VFS + 13 app tools + 3 Excel-only VFS)

---

## PowerPoint — 14 App-Specific Calls

### Read Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 1 | **`list_slide_shapes`** | **Layer stack** — Three offset rectangles of different sizes stacked with slight parallax (like z-index layers). Each layer has a small index number. | List all shapes on a slide with IDs, names, types, positions, and dimensions |
| 2 | **`read_slide_text`** | **Shape + angle bracket** — A rounded rectangle (shape outline) with a small `<` bracket at its left edge. Reading XML content from inside a shape. | Read raw OOXML paragraph XML from a shape's text body |

### Write/Edit Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 3 | **`edit_slide_text`** | **Shape + cursor** — A rounded rectangle with a blinking text cursor `|` inside it. Editing text within a shape boundary. | Replace paragraph content of a shape with raw OOXML `<a:p>` elements |
| 4 | **`edit_slide_xml`** | **Slide + brackets** — A horizontal rectangle (slide frame) with `</>` code brackets centered inside. Direct XML surgery. | Edit raw OOXML of a slide — advanced formatting, diagrams, custom XML |
| 5 | **`edit_slide_chart`** | **Bar segments** — Three vertical bars of ascending height (like a minimal bar chart), but rendered as raw geometric rectangles with sharp edges. Not a "chart icon" — more like data columns. | Add or edit chart data visualizations via OOXML |
| 6 | **`edit_slide_master`** | **Blueprint frame** — A rectangle with dashed-line interior grid (like an architectural blueprint/template). A master layout being defined. | Edit slide master/layouts — backgrounds, fonts, theme colors, placeholders |
| 7 | **`duplicate_slide`** | **Frame + echo** — A slide rectangle with a second identical rectangle offset 3px to the right and down, slightly dimmer. A duplication echo. | Duplicate a slide (inserted after the original) |

### Verification & Visual

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 8 | **`screenshot_slide`** | **Viewfinder frame** — Same as Excel's but wider aspect ratio (16:9 proportions). Four L-shaped corner brackets. | Take a visual screenshot of a slide for verification |
| 9 | **`verify_slides`** | **Shield + check** — A small hexagonal shield outline with a checkmark inside. Quality gate / validation pass. | Check all slides for overlapping shapes, out-of-bounds, unused placeholders |
| 10 | **`execute_office_js`** | **Angle brackets + bolt** — `</>` with lightning bolt. Same concept as Excel's `eval_officejs` — the universal escape hatch glyph. | Execute Office.js JavaScript inside PowerPoint.run() — full API access |

### PowerPoint-Only VFS Commands

| # | Command | Icon Concept | Description |
|---|---------|-------------|-------------|
| 11 | **`insert-image`** | **Frame + inset** — A slide rectangle with a smaller rectangle being pushed inward from the bottom-right corner (an image being placed onto a slide). | Insert an image from VFS into a slide at a specified position and size |
| 12 | **`search-icons`** | **Icon grid + ping** — A 2×2 grid of small distinct shapes (star, circle, square, triangle) with a small radar-arc in one corner. Searching a library. | Search an icon library for vector icons by keyword |
| 13 | **`insert-icon`** | **Shape + inject** — A star/geometric shape with a small downward arrow entering its center. An icon being placed. | Insert a vector icon from the library into a slide |
| 14 | **`image-search`** | **Signal + frame** — The radar-ping signal icon (from `web-search`) with a small rectangle (image frame) overlapping its bottom-right. Web search, but for images. | Search the web for images by keyword |

**PowerPoint total: 22** (2 SDK + 6 shared VFS + 10 app tools + 4 PPT-only VFS)

---

## Word — 7 App-Specific Calls

### Read Tools

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 1 | **`get_document_text`** | **Paragraph indices** — Three horizontal text-line bars, each prefixed by a small index number (`0`, `1`, `2`) in a dimmer weight. Paragraphs as indexed data. | Read document text with paragraph indices, styles, and list info |
| 2 | **`get_document_structure`** | **Outline tree** — A small tree/hierarchy: one node at top, two branches leading to child nodes below. Document structure as a tree. | Get structural overview — heading outline, tables, content controls, section count |
| 3 | **`get_ooxml`** | **Document + `<w:>`** — A document rectangle with a small angle-bracket tag `<w:>` overlaid at its center. The `w:` namespace prefix signals Word OOXML specifically. | Extract the document's full OOXML to VFS and return a body-child summary map |
| 4 | **`get_paragraph_ooxml`** | **Pilcrow + brackets** — A `¶` pilcrow mark flanked by angle brackets `< ¶ >`. Single-paragraph XML inspection. | Read OOXML of specific paragraphs by index for formatting inspection |

### Visual & Escape Hatch

| # | Tool | Icon Concept | Description |
|---|------|-------------|-------------|
| 5 | **`screenshot_document`** | **Viewfinder frame** — Same corner-bracket viewfinder, but portrait aspect ratio (like a document page). | Take a visual screenshot of a single document page (Desktop/Mac only) |
| 6 | **`execute_office_js`** | **Angle brackets + bolt** — `</>` + lightning bolt. Universal escape hatch. | Execute Office.js JavaScript inside Word.run() — full API access |

### Word-Only VFS Command

| # | Command | Icon Concept | Description |
|---|---------|-------------|-------------|
| 7 | **`image-search`** | **Signal + frame** — Same as PowerPoint's. Radar ping + image frame. | Search the web for images by keyword |

**Word total: 17** (2 SDK + 6 shared VFS + 6 app tools + 1 Word-only VFS)

---

## Cross-App Icon Reuse Map

Icons that share the same glyph across apps, reducing the total set:

| Icon Glyph | Used By |
|------------|---------|
| **Prompt caret** `>_` | `bash` (all) |
| **Scan lines** | `read` (all) |
| **Document → glyphs** | `pdf-to-text` (all) |
| **Document → grid** | `pdf-to-images` (all) |
| **Pilcrow → bars** | `docx-to-text` (all) |
| **Grid → comma** | `xlsx-to-csv` (all) |
| **Signal ping** | `web-search` (all) |
| **Pull arrow** | `web-fetch` (all) |
| **Viewfinder frame** | `screenshot_range` / `screenshot_slide` / `screenshot_document` (aspect ratio varies: square, 16:9, portrait) |
| **Angle brackets + bolt** | `eval_officejs` / `execute_office_js` (all) |
| **Signal + frame** | `image-search` (PPT, Word) |

**Unique icons needed: ~28** (11 shared + 10 Excel-only + 7 PPT-only + 0 Word-only)

---

## Animation States

Each tool call icon cycles through three states during agentic execution:

```
┌─────────┐    ┌─────────┐    ┌─────────┐
│  IDLE   │───▶│ RUNNING │───▶│  DONE   │
│ --text- │    │ --accent │    │ --text- │
│ tertiary│    │ -500    │    │ primary │
│ static  │    │ pulse/  │    │ flash → │
│         │    │ spin    │    │ fade    │
└─────────┘    └─────────┘    └─────────┘
```

| State | Stroke Color | Fill | Motion |
|-------|-------------|------|--------|
| **Idle** | `--text-tertiary` | None | Static |
| **Running** | `--accent-500` | None (or subtle accent fill on key element) | Pulse (`opacity 0.6↔1.0`, 1.2s ease-in-out) or element-specific micro-animation |
| **Complete** | `--text-primary` | None | Flash bright → ease to `--text-secondary` over 400ms |
| **Error** | `--error` | None | Single shake (2px horizontal, 200ms) → settle at `--text-tertiary` |

### Per-Icon Micro-Animations (Running State)

| Icon | Running Animation |
|------|-------------------|
| `bash` `>_` | Cursor block blinks (`step-end`, 1s) |
| `read` scan lines | Read-head chevron slides down through the lines |
| `web-search` signal | Arc segments pulse outward sequentially |
| `web-fetch` pull arrow | Arrow translates downward 2px and snaps back (pull gesture) |
| `screenshot` viewfinder | Corner brackets contract inward 1px then release (shutter) |
| `execute_office_js` bolt | Lightning bolt flickers (`opacity 0.4↔1.0`, 150ms, 3 cycles) |
| `search_data` sweep | Scan line sweeps top-to-bottom through the grid |
| `verify_slides` shield | Checkmark draws on (stroke-dashoffset animation) |
| All conversion `→` icons | Arrow pulses (translate-x 1px oscillation) |

---

## Total Icon Inventory

| App | SDK | Shared VFS | App Tools | App VFS | **Total** |
|-----|-----|-----------|-----------|---------|-----------|
| **Excel** | 2 | 6 | 13 | 3 | **24** |
| **PowerPoint** | 2 | 6 | 10 | 4 | **22** |
| **Word** | 2 | 6 | 6 | 1 | **17** |
| **Unique glyphs** | 2 | 6 | ~20 | — | **~28** |

---

*System: Office Agents Tool Icons v1.0 — March 2026*
*Heritage: Factory × Geist hybrid design system*
