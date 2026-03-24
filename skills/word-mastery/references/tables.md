# Tables

Scope: use this file when deciding whether information belongs in a table, and when designing tables that read cleanly in Word, survive page breaks, and remain accessible. Good tables reduce cognitive load; bad tables turn information into wallpaper.

## Contents

1. Table or not
2. Anatomy of a professional table
3. Typography and borders
4. Alignment and widths
5. Complex and multi-page tables
6. Domain-specific table patterns
7. Numbering and captions
8. Accessibility rules

## 1) First decide whether a table is the right form

Do not build a table just because the toolbar makes it easy.

Use a **table** when:

- readers must compare the same attributes across multiple items
- numeric alignment matters
- values need to be scanned by row and column
- the information has two genuine dimensions

Use a **list** when:

- there is one dimension only
- the content is mostly short phrases
- order matters more than cross-comparison

Use **prose** when:

- relationships, explanation, or argument matter more than field alignment
- each item needs a sentence or more of interpretation
- the data is too sparse to justify a grid

A useful threshold: if you have three or more items and two or more comparable attributes, a table usually earns its place.

## 2) Build the full anatomy, not just a grid

A professional table usually has five parts:

1. **Table number**
2. **Table title**
3. **The table body**
4. **Notes, abbreviations, or source line**
5. **White space around the table**

Following Chicago practice, place **table titles above the table**. This is especially useful because table notes and sources typically live below. In APA style, the table number and italicized title also sit above the table. Treat that as the default unless a publisher or house style says otherwise.

Core rules:

- Every nontrivial table gets a number and title.
- Every table has a real header row.
- Units belong in the header where possible, not repeated noisily in every cell.
- Notes belong below the table, not squeezed into body cells.
- Sources belong below the notes or integrated into them.

Avoid unlabeled tables dropped into the page like anonymous screenshots.

## 3) Table typography: let data dominate, not borders

Tufte’s principle applies directly here: maximize the information carried by the table and minimize non-data ink. In practice, that means fewer rules, quieter fills, and better alignment.

### Default table typography

- table text at the same size as body or 0.5–1 pt smaller
- line spacing around 1.0–1.15
- cell padding around 4–6 pt top and bottom, 4–8 pt left and right
- header text bold or semibold
- notes 1–2 pt smaller than body
- avoid fixed row heights; let rows grow to fit content

### Border philosophy

Default to:

- a top rule
- a header-separator rule
- a bottom rule
- light internal horizontal rules only if needed
- no vertical rules unless the table is dense enough that readers genuinely need them

APA-style statistical tables often use this restrained model: no vertical rules, and only the horizontal rules needed to separate title, headers, and body. That is a strong default outside APA too.

Do not use a full black grid unless the reader truly needs high-density cell separation. Heavy boxes make tables look like spreadsheets pasted into a report.

## 4) Alignment, widths, and cell logic

Most bad tables fail before typography. They fail because the columns were not designed.

### Alignment rules

- **Text**: left align
- **Long labels**: left align
- **Integers and decimals**: right align
- **Currencies**: right align, with the currency stated in the header or clearly repeated
- **Short codes, dates, statuses, checkmarks**: center or right align depending on scan pattern
- **Column headers**: match the logic of the column, not a blanket center-everything rule

Where decimals matter, align numbers visually by decimal place if the system allows it. At minimum, right-align the column and keep the number of decimal places consistent.

### Width rules

Do not make every column the same width.

Use narrow columns for:

- item number
- date
- year
- status
- score
- checkbox
- short code

Use wide columns for:

- descriptions
- methods
- comments
- assumptions
- rationale
- narrative findings

Before reducing font size, try this order:

1. allow text to wrap
2. widen the important column
3. shorten or stack the header
4. move explanatory detail to a note
5. split the table
6. only then reduce font slightly

A table that fits only because the font was crushed is not fixed.

## 5) Handle complex tables deliberately

### Merged cells

Merged cells are acceptable for grouped headers or a small number of label spans. They are not acceptable as a layout crutch.

Avoid merged cells when:

- they create ambiguous reading order
- they are used to center decorative text
- they break screen-reader expectations
- the structure could be expressed more clearly with repeated values or a separate note

### Nested headers

Use stacked header rows when grouping is real and the reader benefits from it. Keep the hierarchy obvious: higher-level group on top, specific columns below.

### Multi-page tables

When a table breaks across pages:

- repeat the header row on each page
- keep column order and widths identical
- if needed, mark continuation in the title or note, such as “Table 4 (continued)”
- avoid splitting a row across pages unless unavoidable
- keep the table visually tied to its title on the first page

### Very wide tables

Try, in this order:

- rewrite as two narrower tables
- transpose rows and columns if it improves scanability
- move lower-value columns to an appendix
- use a landscape page within the document
- redesign as a matrix or figure if that better communicates the comparison

Never use a layout table to fake side-by-side page design. Data tables and layout tables are different species. Use the former only.

## 6) Match the table pattern to the domain

### Financial tables

- right-align all numeric columns
- show units in headers
- use consistent decimals and negative-number style
- subtotal and total rows should be typographically distinct but not theatrical
- avoid giant shaded blocks; a rule above totals is often enough

### Statistical results tables

- follow the target journal or APA/AMA/Vancouver conventions
- column headers should carry statistics and units cleanly
- p-values, confidence intervals, and test statistics need consistent notation
- notes are often essential for abbreviations and significance markers

### Comparison matrices

- use short criteria down the first column
- keep comparisons compact
- avoid wordy cell paragraphs; if cells become mini-essays, use prose or separate profiles instead

### Specifications tables

- two-column and four-column key-value patterns work well
- use a wider value column
- group related attributes with quiet section rows, not giant colored bands

### Schedule and timeline tables

- keep date columns narrow and aligned
- use milestone/status columns sparingly
- if the reader mainly needs chronology, a list or Gantt-style figure may be better than a large table

### SOP and forms tables

- do not confuse the user with spreadsheet-like grids
- make response areas obvious
- use generous row height
- reserve borders for structure, not decoration

IBCS’s SUCCESS framework provides a useful checklist for table quality:

- **SAY**: convey a message — the table title should state the takeaway, not just the topic
- **UNIFY**: apply consistent notation — same units, same number format, same sign convention across all tables in the document
- **CONDENSE**: maximize information density — remove empty rows, redundant labels, and decorative chrome
- **CHECK**: ensure data integrity — numbers in the table must match the narrative and source data
- **EXPRESS**: choose the right visualization — if the comparison is better shown as a chart, use a chart
- **SIMPLIFY**: reduce to the essentials — remove columns the reader does not need for the decision at hand
- **STRUCTURE**: organize logically — group related rows, order by the comparison that matters most, not alphabetically by default

Apply SUCCESS by asking: does this table communicate one clear comparison, using consistent notation, with no visual noise competing for attention?

## 7) Numbering and captioning conventions

Use Arabic numerals unless the house style requires chapter-based numbering.

Default pattern:

**Table 1. Descriptive title in title case or sentence case, depending on the document’s style system**

Then the table.

Then notes.

Keep the numbering sequence continuous throughout the main document. Restart only when the genre explicitly requires per-chapter numbering.

### Caption placement

Default to captions above tables. Per CMOS 17th edition (§3.52–3.54), table titles belong above the table, while figure captions belong below the figure. APA 7 follows the same convention: bold table number on one line, italic title on the next, both above the table body. This keeps the reader oriented before they encounter the data.

### Caption content per CMOS

CMOS guidance (§3.54–3.56) recommends that table titles be brief and descriptive. Column headings should be concise enough that they do not need their own explanatory notes. Units belong in column headers, not repeated in every cell. Source lines and general notes go below the table; specific notes use superscript lowercase letters (a, b, c), not asterisks or numbers that could be confused with data or footnote references.

### Notes below the table

Use notes for:

- abbreviations
- unit explanations
- significance keys
- source citations
- exclusions, caveats, or data definitions

Do not stuff these into header cells or tiny footnote markers if a clean note line will do the job better.

## 8) Accessibility rules for tables

Accessibility starts with a simple structure.

Do this:

- use a real table, not tabs or spaces
- define a true header row
- keep the layout rectangular where possible
- repeat header rows on multi-page tables
- use meaningful row and column labels
- write “N/A” or “None” rather than leaving a meaningful cell blank
- keep notes below the table in nearby text

Avoid this:

- nested tables
- merged and split cells that destroy reading order
- tables used only for layout
- images of tables instead of real text tables
- color-only cues such as green row means approved, red row means denied

Alt text is not a substitute for structure. A real data table should be navigable as a table. Use alt text only when the table is actually an image or when a complex visual table also needs a short summary.

Cross-reference: use `figures-visual-elements.md` when a wide comparison would be clearer as a chart or diagram, and `accessibility-compliance.md` when the table must meet formal accessibility review.
