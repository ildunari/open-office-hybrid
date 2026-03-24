# Headers, footers & page layout

Scope: use this file when the task involves page numbering, section-specific headers or footers, landscape pages, print considerations, binding, or pagination control. In Word, most layout problems are really section problems.

## Contents

1. Headers and footers by document type
2. Page numbering systems
3. Section behavior
4. Page breaks and pagination controls
5. Landscape pages
6. Watermarks and background elements
7. Print and binding considerations

## 1) Put useful information in headers and footers, or keep them minimal

Headers and footers should orient the reader, not decorate the page.

### Good header and footer content

- short document title
- current section title
- page number
- confidentiality notice
- document ID or revision
- effective date
- “Page X of Y” in controlled documents

### Weak header and footer content

- repeated full title on every page
- placeholder text that was never updated
- giant logos that waste vertical space
- decorative rules with no informational function
- conflicting version labels across sections

### Recommended patterns by document type

**Memo / letter**
- often no header on page 1
- footer may carry page number only
- keep quiet

**Business report**
- short title or section title in header
- page number in footer or header, consistently placed
- optional confidentiality line for internal documents

**Manuscript**
- follow journal rules first
- page number is usually required
- running head only if the journal or style manual requires it

**Grant application**
- sponsor instructions control
- NIH attachments generally should not carry headers or footers unless specifically required elsewhere

**Legal brief or filing**
- court rules first
- page numbering and footer placement may be prescribed
- do not assume general report conventions apply

**SOP or controlled technical document**
- document number, revision, effective date, approval state, and page number are often expected
- keep the fields stable across sections

If the document has a title page, it usually needs either no header/footer or a different first-page treatment.

## 2) Use page numbering as a navigation system

Page numbers are part of the architecture, not just ornament.

### Default numbering pattern for long formal documents

- **Front matter**: lowercase Roman numerals, i, ii, iii
- **Body**: Arabic numerals, 1, 2, 3
- **Appendices**: continue Arabic numbering unless the domain calls for a different system

This is especially appropriate for books, theses, major reports, and lengthy proposals.

### Business report shortcut

For many reports, use Arabic numbering throughout and suppress numbering on the title page if present. Simplicity is often better than ceremonial front matter.

### Section-based numbering

Use section-based numbering when:

- front matter uses a different numeral system
- a main text restart at page 1 is required
- appendices need special numbering
- court, thesis, or regulatory rules require restarts

Remember that page number format and restart behavior live at the section level. When numbering “mysteriously” changes, inspect the section boundary.

## 3) Respect section behavior — how sections affect layout

This section covers how sections control headers, footers, orientation, and numbering. For deciding **when** to insert section breaks and which type to use, see `document-architecture.md` §5.

A Word section controls:

- margins
- orientation
- columns
- header and footer linkage
- page numbering format and restart
- different first page
- odd/even header behavior

This is why casual section insertion causes so much chaos.

### Working rules

- Use as few sections as possible, but as many as needed.
- Insert a new section only when something truly changes.
- Unlink headers and footers from the prior section only when the content needs to differ.
- Remember that headers and footers unlink separately.
- Keep a map of where sections begin in complex documents.

Different First Page is useful for title pages and chapter openers. Different Odd and Even Pages is useful for duplex or book-like layouts, not for single-sided business documents, memos, or standard reports.

## 4) Control pagination with paragraph settings, not hacks

Professional pagination comes from paragraph rules, not from repeated blank lines and frantic manual fixes.

### Use these paragraph controls

- **Keep with next**: on all headings, captions that must stay with the object that follows, and short lead-in labels
- **Keep lines together**: on short blocks that should not split
- **Widow/orphan control**: on body text
- **Page break before**: on top-level headings when the genre wants each major section to start on a new page

### Use page breaks deliberately

Insert a page break when a new page is semantically correct: new chapter, new appendix, major report section, or a deliberate separation before references or exhibits.

Do not force layout by inserting line breaks until content lands on the next page. That creates fragile spacing that collapses as soon as the text changes.

### Avoid orphaned headings

A heading stranded at the bottom of a page is a release blocker. Fix it by:

- using keep with next
- slightly revising spacing
- moving the preceding paragraph if that helps the narrative
- inserting a page break before the heading if the genre supports it

## 5) Handle landscape pages as isolated layout events

Landscape pages are acceptable for wide tables, complex process diagrams, and some technical figures. They should be rare and controlled.

### Best practice

- end the portrait section
- create a landscape section
- place the wide object there
- create a new portrait section after it

Keep the landscape content self-contained. If the document carries running headers, verify that the header text still makes sense in the rotated context and that page numbers remain readable.

Before choosing landscape, ask whether the problem would be better solved by:

- splitting the table
- moving detail to an appendix
- redesigning the figure
- reducing redundant columns

Landscape is a tool, not a rescue reflex.

## 6) Use watermarks and backgrounds only for status or utility

Good watermark uses:

- Draft
- Confidential
- Sample
- Internal use only

Keep them subtle. A watermark that competes with body text is hostile to reading and printing.

Background fills, page colors, and graphic page furniture belong mainly in controlled branded documents. If the document is headed to court, a journal, a grant system, or accessibility review, decorative background treatments are usually a bad bet.

## 7) Design for the actual output medium

### Screen-first documents

- slightly wider margins can still be appropriate if they improve measure
- running headers may be less important if navigation pane and PDF bookmarks are available
- color can be a little more visible, but contrast still matters

### Print-first documents

- verify gutter and binding margin
- think about duplex printing and inside versus outside margins
- avoid figures or tables placed so tightly that print scaling will hurt legibility
- ensure headers, footers, and page numbers fall inside printable regions
- keep body text off the extreme edges of the page

### Bleed and cover design

Word is not ideal for full-bleed cover design, commercial print layouts, or complex multi-column magazine work. If the content needs true publication design rather than document design, say so and recommend a more suitable format or tool family.

## Common layout defaults

Use these unless the domain overrides them:

- Letter or A4 page, consistent throughout
- top and bottom margins around 1 inch
- side margins around 1 to 1.25 inches
- page numbers on all body pages
- different first page only when there is a title page or formal opener
- no more section breaks than needed

Cross-reference: use `document-architecture.md` for deciding where sections belong, `style-system-typography.md` for margin and measure logic, and `domain-constraints.md` when sponsor, court, or journal rules override general practice.
