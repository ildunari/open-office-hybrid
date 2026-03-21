# Style system & typography

Scope: use this file when you are defining styles, restyling a document, choosing fonts and spacing, or deciding what “professional” should look like on the page. This file turns typographic principles into Word-ready defaults.

## Contents

1. Styles before formatting
2. Style hierarchy
3. Heading scales by domain
4. Body text rules
5. Fonts and pairings
6. Vertical rhythm
7. Character formatting
8. Measure, margins, and page proportions
9. Color and emphasis

## 1) The fundamental rule: named styles over direct formatting

Always build the document through **named styles**, not one-off formatting.

Why this matters:

- Word builds TOCs, Navigation pane entries, and many accessibility cues from styles.
- Styles let you restyle the whole document without touching every paragraph.
- Styles reduce corruption and inconsistency during collaboration.
- Styles protect templates and make document families feel related.
- Direct formatting hides structure. A bold paragraph that “looks like” a heading is not a heading.

Use direct formatting only for **true inline meaning**: italics for emphasis, bold for short labels, superscript for notes or exponents, subscript for chemical formulas, or hyperlink treatment. If the same formatting pattern appears more than a few times, it deserves a style.

A practical rule: if you are changing paragraph font, size, spacing, indents, numbering, or borders by hand more than once, stop and create or modify a style.

### The CRAP test for document layout

Robin Williams' four principles from *The Non-Designer's Design Book* apply directly to document design and provide a fast diagnostic for pages that feel “off”:

- **Contrast**: make different elements look distinctly different. If a heading is barely distinguishable from body text, the hierarchy fails. Use size, weight, spacing, or color — not all at once.
- **Repetition**: reuse the same visual treatment for the same role throughout the document. This is exactly what named styles enforce. When the reader sees consistent heading formatting, table styling, and caption treatment, the document reads as a coherent system.
- **Alignment**: every element on the page should share a visual edge with something else. Left-aligned body text, centered figures, and right-aligned captions create three competing alignment systems. Pick one dominant alignment and break it only with intent.
- **Proximity**: group related elements and separate unrelated ones. A caption should be visually closer to its figure than to the next paragraph. A heading should be closer to the content it introduces than to the content above it.

When a page feels disorganized, run these four checks before reaching for more styling.

## 2) Build a shallow style hierarchy

For heading depth and hierarchy rules (how many levels, when to restructure), see `document-architecture.md` §2. This section covers the style tree and style roles.

Create a small, legible system instead of dozens of near-duplicate styles.

Recommended base tree:

- **Normal or Body base**
  - Body
  - Body First
  - Body Compact
  - Block Quote
  - Definition Body
  - Note / Warning / Caution body
- **Heading base**
  - Heading 1
  - Heading 2
  - Heading 3
  - Heading 4 run-in, if needed
- **Caption base**
  - Figure Caption
  - Table Caption
- **List base**
  - Bullet level 1 and 2
  - Number level 1 and 2
  - Procedure step
- **Table base**
  - Table text
  - Table header
  - Table note
- **Front matter**
  - Title
  - Subtitle
  - Metadata
  - Executive summary
  - Abstract
- **Back matter**
  - References
  - Appendix heading

Keep inheritance shallow. Too many based-on layers make troubleshooting painful.

Prefer modifying Word’s built-in Heading 1 through Heading 3 styles rather than inventing fake pseudo-headings. Built-in heading styles work more predictably with TOCs, navigation, hyperlinks, and accessibility tooling.

Use theme fonts and theme colors where possible. They make global restyling safer than local font and color overrides.

### Cover the full set of style roles

A mature document usually needs more than Body and Heading 1 through 3. Make sure your style system can cover these recurring roles without ad hoc formatting:

- Title and subtitle
- Document metadata
- Abstract or executive summary
- Heading 1 through Heading 3, plus an optional run-in Heading 4
- Body, first paragraph after heading, and compact body
- Bulleted list, numbered list, and procedure step
- Definition term and definition body
- Quote or extract
- Note, caution, warning, and callout
- Code block and inline code
- Figure caption and table caption
- Table text, table header, and table note
- Header and footer
- TOC levels
- References or bibliography
- Footnote text
- Appendix headings

If a recurring element lacks a style, the author will almost always compensate with local formatting. That is how style debt starts.

## 3) Use a heading scale that matches the genre

A professional heading ladder shows hierarchy through size, weight, spacing, and sometimes color. Do not rely on bold alone.

### Default business / technical scale

Use this as the default when no stronger domain standard exists.

| Element | Size | Weight | Space before | Space after |
|---|---:|---|---:|---:|
| Title | 24–30 pt | semibold or bold | 0 | 12–18 pt |
| Heading 1 | 16–18 pt | bold | 18–24 pt | 6–10 pt |
| Heading 2 | 13–14 pt | bold | 12–18 pt | 4–8 pt |
| Heading 3 | 11–12 pt | bold or semibold | 10–12 pt | 4–6 pt |
| Body | 10.5–11 pt | regular | 0 | 4–8 pt |

This roughly follows a restrained typographic ratio rather than giant jumps. It looks credible in Word and survives PDF export well.

### Academic / manuscript default

When no journal template overrides it:

- body at 12 pt in a serif face, usually Times New Roman or journal-required equivalent
- heading distinctions driven more by weight, alignment, and spacing than by dramatic size jumps
- APA 7 uses five heading levels with different combinations of bold, italics, alignment, and run-in treatment
- keep the page visually plain; manuscripts are reviewed for content, not brand styling

### Legal default

- body usually 12 pt serif unless court rules say otherwise
- headings may use bold, small caps, numbering, and extra spacing rather than many font sizes
- stability and referential precision matter more than visual flair

### NIH / proposal default

- use the sponsor’s allowed fonts and minimum sizes first
- heading contrast should be visible but conservative
- avoid oversized display titles that waste space

Whatever scale you choose, apply **keep with next** to headings so they do not strand at the bottom of a page.

## 4) Body text: make reading easy before making it “designed”

Bringhurst’s classic range for comfortable line length is about **45 to 75 characters**, with roughly **66 characters** often cited as ideal for single-column text (*Elements of Typographic Style*, §2.1.2). Butterick’s practical range is **45 to 90 characters** (*Practical Typography*, “line length”), with the warning that overly long lines tire the reader. Use margins and font choice to stay in that zone.

### Default body settings

- **Font size**: 10.5 to 12 pt for long reading; 11 pt is the modern general-purpose default. Butterick recommends 10–12 pt for body text as his single most impactful advice for business documents (*Practical Typography*, “body text”).
- **Leading**: 120% to 145% of font size. Bringhurst’s minimum is 120% for text faces (*Elements*, §2.4.2); tighter leading feels cramped. For 11 pt text, 13–15.5 pt leading usually feels right. Butterick recommends 120–145% as the practical range.
- **Alignment**: left aligned by default. Fully justified text can work in print-heavy reports if hyphenation and spacing are handled well, but ragged-right is safer in Word. Bringhurst prefers justified setting with proper hyphenation (*Elements*, §2.1.1), but Word’s justification engine is mediocre — ragged-right avoids the rivers of white space that Word creates.
- **Paragraph spacing**: 4–8 pt after paragraphs for business and technical documents.
- **Indent rule**: choose one system, not both.
  - Block paragraphs with space-after for business, technical, and most on-screen documents.
  - First-line indent of 0.5 inch with no extra space between paragraphs for manuscripts, book-like text, and many legal documents.
- **Widow and orphan control**: enable on body styles.
- **Keep lines together**: use for short items that should not split.
- **Hyphenation**: leave off unless the document is dense, justified, and print-oriented.

Never use blank paragraphs to create space. That is the fastest way to create drift when text edits later.

## 5) Choose fonts like an editor, not a hobbyist

Butterick’s rule is harsh but useful: most documents look amateur because of poor typography, especially poor font choice and spacing (*Practical Typography*, "summary of key rules"). Limit yourself to **one or two font families**.

Butterick’s font tiers for professional documents: system fonts like Calibri and Cambria are acceptable; professional fonts like Equity, Concourse, or Advocate are better; novelty, display, and free web fonts are almost always worse. For Word work where font portability matters, the system tier is the pragmatic choice.

### Safe choices by domain

- **Business / technical**: Aptos, Calibri, Arial, or Helvetica-like sans for body; same family or a compatible display sans for headings.
- **Academic / formal**: Times New Roman, Cambria, Georgia, or journal-required serif.
- **Legal**: court-approved serif faces first. Times New Roman, Century Schoolbook, Georgia, Palatino, or the local-rule list.
- **Monospace**: Consolas, Courier New, or source-specified monospaced face for code and fixed-width data.

### Good cross-platform pairings

- Aptos or Calibri headings + Aptos or Calibri body
- Cambria headings + Calibri body
- Georgia headings + Arial body
- Times New Roman headings + Times New Roman body when conservatism matters

Limit yourself to **two font families maximum** (one for headings, one for body). Using a single family is fine. Three or more families is an anti-pattern. Avoid novelty fonts and fonts that the recipient likely lacks. A document that reflows because the target system substituted fonts is not finished.

## 6) Maintain vertical rhythm

Bringhurst, Tschichold, Lupton, and Robin Williams all point toward the same practical truth: a page looks professional when spacing feels governed rather than improvised. Tschichold's *The New Typography* argues that typographic clarity comes from systematic contrast and consistent spatial logic — not from decoration. Lupton's *Thinking with Type* extends this into grid-based thinking: all vertical spacing should feel like multiples of a base unit.

Use a base spacing unit such as **6 pt** and build the whole document from it.

Recommended set: **0, 3, 6, 12, 18, 24 pt**

Example rhythm:

- body paragraphs: 6 pt after
- Heading 3: 12 pt before, 3–6 pt after
- Heading 2: 18 pt before, 6 pt after
- Heading 1: 24 pt before, 6–8 pt after
- table caption: 12 pt before, 3 pt after
- figure caption: 6 pt before or after the figure, then 12 pt after
- list block: 3–6 pt after
- callout box: 6–12 pt before and after

Random values like 7 pt, 11 pt, then two blank paragraphs are classic AI or novice artifacts.

## 7) Use character-level formatting sparingly and semantically

### Bold

Use for headings, short labels, table headers, and occasional emphasis. If more than a sentence is bold, ask whether the structure is doing its job.

### Italic

Use for titles of works, variables, species names, light emphasis, and figure labels when style requires. Do not lean on italics as a substitute for hierarchy.

### Underline

Reserve for hyperlinks or explicit fill-in blanks. Underline as emphasis is visually noisy and conflicts with link conventions.

### Small caps

Use sparingly for front-matter metadata, legal defined-term systems if the house style expects it, or subtle typographic refinement. Do not create fake small caps by shrinking full caps.

### Letterspacing

Do not manually track body text. Slight tracking can help all-caps short labels, but Word is not a fine-typesetting environment; keep adjustments minimal.

### Superscript and subscript

Use true superscript for note numbers and true subscript for formulas. Do not fake this with smaller, manually raised text.

## 8) Let margins enforce readability

Margins are not wasted space. They create measure, balance, and room for the eye.

Bringhurst discusses classical page proportions at length (*Elements*, §8.3): the traditional book page uses a 2:3 proportion with the text block occupying roughly 50–65% of the page area. Tschichold’s "golden canon of page construction" produces margins where the inner margin is half the outer and the top is half the bottom, creating an asymmetric frame that feels balanced on a spread. These ideals rarely translate directly to Word reports, but the underlying principle holds: margins are not leftover space — they are part of the design.

Default guidance:

- **General business report**: 0.9 to 1.25 inch margins
- **Academic manuscript**: usually 1 inch all around unless template says otherwise
- **Dense proposal or grant**: minimum allowed margins only when space is truly constrained
- **Bound document**: add a gutter, typically 0.25 to 0.5 inch
- **Facing pages**: inside margin should exceed outside margin if the document is printed duplex and bound. Bringhurst’s and Tschichold’s convention is inner:outer of roughly 1:2 for facing pages.

Butterick’s practical advice is to tune margins until line length is comfortable rather than obsess over a single magic margin value (*Practical Typography*, "page margins"). At 12 pt, side margins of 1.5 to 2 inches often produce an elegant measure for bookish documents. In Word reports, 1 to 1.25 inches is usually the better compromise between readability and space.

## 9) Use color as a system, not confetti

Color should clarify hierarchy, status, or interaction.

Good uses:

- one accent color for Heading 1 and maybe Heading 2
- light tint for table headers
- subtle fill for note boxes or controlled callouts
- standard blue plus underline for hyperlinks
- tracked deletions and insertions during review

Bad uses:

- a different color at each heading level
- bright fills behind body text
- red used for normal emphasis in a document that also contains tracked changes
- low-contrast gray text for style

Keep contrast high enough for readability. Never rely on color alone to communicate meaning. Pair color with labels, icons, underlines, patterns, or wording.

Cross-reference: use `tables.md` for table typography and `headers-footers-layout.md` for page geometry decisions that interact with measure and margins.
