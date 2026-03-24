# Common mistakes & anti-patterns

Scope: use this file when reviewing or repairing an existing document, or when you need a fast checklist of what makes Word files look amateur, brittle, inaccessible, or obviously AI-generated. These are the recurring failures to eliminate before release.

## Contents

1. Style-system failures
2. Layout and spacing failures
3. Table and figure failures
4. Font, color, and emphasis failures
5. Navigation and metadata failures
6. Revision and review failures
7. Domain mismatches
8. When Word is the wrong tool
9. AI-generated document pitfalls
10. Fast review checklist

## 1) Style-system failures

### Direct formatting instead of styles

Symptom:
- headings created by bolding Normal paragraphs
- captions manually shrunk and italicized one by one
- body text with random local font overrides

Why it is bad:
- destroys TOC generation, navigation, and consistency
- makes global restyling expensive
- causes drift under collaborative editing

Better move:
- convert recurring patterns into named styles
- reapply built-in heading styles to real headings
- strip unnecessary local overrides

### Inconsistent heading hierarchy

Symptom:
- Heading 1 followed by Heading 3
- too many heading levels
- one-off micro-headings used as decoration

Why it is bad:
- confuses navigation and screen readers
- signals that the document was structured visually rather than logically

Better move:
- collapse or merge weak sublevels
- keep the ladder shallow
- use bold lead-ins inside paragraphs instead of creating fake subheads

### Hand-typed numbering

Symptom:
- “1.”, “2.”, “3.” typed manually
- headings numbered by text rather than list logic
- broken renumbering after edits

Why it is bad:
- becomes wrong after insertion or deletion
- impossible to maintain in long documents

Better move:
- tie numbering to paragraph styles and list definitions

## 2) Layout and spacing failures

### Blank paragraphs used as spacers

Symptom:
- extra paragraph returns between sections
- mysterious white space after edits

Why it is bad:
- layout shifts unpredictably as content changes
- creates inconsistent rhythm

Better move:
- use Space Before and Space After in styles

### Tab-based alignment instead of tab stops or tables

Symptom:
- signatures, metadata, or form fields aligned with repeated tab presses
- columns drift when text length changes

Why it is bad:
- fragile and hard to maintain
- collapses under font substitution or PDF export

Better move:
- use real tab stops for simple alignments
- use tables for genuine tabular structures
- use dedicated form or signature layouts when appropriate

### Manual line breaks and manual pagination hacks

Symptom:
- Shift+Enter used repeatedly to “make it fit”
- line breaks forced inside headings
- content shoved to the next page with repeated returns

Why it is bad:
- produces reflow failures later
- breaks with small edits and printer differences

Better move:
- adjust paragraph settings, spacing, keep-with-next, or section behavior

### Orphaned headings at the bottom of the page

Symptom:
- heading appears as the last line on a page
- caption separated from its figure or table

Why it is bad:
- looks careless
- damages scanability and comprehension

Better move:
- use keep-with-next
- keep captions attached to the relevant object
- revise page breaks intentionally

## 3) Table and figure failures

### Layout tables used as page design

Symptom:
- invisible tables used to fake two-column layout, place logos, or align page regions

Why it is bad:
- brittle and inaccessible
- often breaks under editing and screen readers

Better move:
- use real page settings, tab stops, paragraph alignment, or controlled section layout

### Merged cells for layout rather than data logic

Symptom:
- decorative spans and empty merged blocks in ordinary tables

Why it is bad:
- confuses reading order
- complicates updates and accessibility

Better move:
- restructure the table
- use grouped headers only when they express real hierarchy

### Tables that look like raw spreadsheet dumps

Symptom:
- equal-width columns for unlike data
- gridlines everywhere
- cramped rows
- center alignment on every column

Why it is bad:
- low information density despite high visual noise
- difficult to scan

Better move:
- redesign widths by content type
- minimize borders
- right-align numbers, left-align text
- add padding and notes

### Figures without captions or references

Symptom:
- image pasted into the page with no number or explanatory text
- body text says “the image below” instead of a stable figure reference

Why it is bad:
- impossible to cite or move reliably
- weakens professional and academic credibility

Better move:
- add a numbered caption
- cross-reference the figure in text

### Images of text, tables, or equations when real text is possible

Symptom:
- screenshot of a table instead of a real table
- paragraph embedded in an image

Why it is bad:
- inaccessible
- blurry in print and PDF
- impossible to edit or search

Better move:
- recreate as real text, table, or equation object when possible

## 4) Font, color, and emphasis failures

### Fonts that do not exist on the recipient’s system

Symptom:
- exotic or licensed fonts used in ordinary office documents
- document reflows on another machine

Why it is bad:
- layout instability
- immediate credibility loss

Better move:
- use widely available fonts or a controlled template with known deployment

### Too many fonts, sizes, and colors

Symptom:
- three typefaces, five heading colors, random accent words, heavy fills

Why it is bad:
- looks generated or novice-made
- obscures hierarchy instead of clarifying it

Better move:
- limit to one or two families
- one accent color system
- one heading scale

### Underline and color as generic emphasis

Symptom:
- random underlined sentences
- red text used for ordinary emphasis in a file that also uses tracked changes

Why it is bad:
- conflicts with hyperlink and review semantics
- creates visual shouting

Better move:
- use structure, spacing, and sparing bold instead of decorative emphasis

### Color-only meaning

Symptom:
- approved rows are green and rejected rows are red with no labels
- comments signaled only by highlight color

Why it is bad:
- inaccessible
- fails grayscale printing

Better move:
- pair color with text labels, icons, patterns, or status words

## 5) Navigation and metadata failures

### Missing TOC in a long document

Symptom:
- 15-page report with many headings but no contents page or bookmarks

Why it is bad:
- reader gets lost
- exported PDF lacks usable navigation

Better move:
- use a TOC when the document is long, deep, or appendix-heavy

### Wrong or useless headers and footers

Symptom:
- old document title in the header
- version mismatch across sections
- giant logo on every page

Why it is bad:
- misleads the reader
- wastes space

Better move:
- keep only helpful orientation fields
- unlink and repair sections intentionally

### Stale fields and cross-references

Symptom:
- TOC shows the wrong pages
- “see Table 2” points to the wrong object
- list of figures missing entries

Why it is bad:
- signals lack of final QA

Better move:
- update all fields before release
- recheck section numbering and captions after edits

### Missing document properties

Symptom:
- file has no meaningful title, language, subject, or author information

Why it is bad:
- weakens accessibility and document control
- looks unfinished

Better move:
- set metadata intentionally during finalization

## 6) Revision and review failures

### Comment and track-change clutter left in final output

Symptom:
- review bubbles, hidden markup, internal questions, or old comments still embedded

Why it is bad:
- leaks process
- confuses external readers
- may expose sensitive information

Better move:
- decide intentionally whether the deliverable is clean, marked, or both
- inspect hidden metadata before release

### “Cross out everything and rewrite” editing

Symptom:
- heavy redline that rewrites stable text instead of changing what matters

Why it is bad:
- obscures the real issue
- irritates reviewers
- increases error risk

Better move:
- edit surgically
- group related changes
- comment at the point of concern

### Corrupted numbering or section behavior patched by hand

Symptom:
- manually typed page numbers after section chaos
- visible numbering fixed while underlying logic remains broken

Why it is bad:
- fails on the next edit

Better move:
- fix the section or list system
- if corruption is severe, rebuild in a clean document rather than stacking hacks


### No version, change, or access control in business-critical documents

Symptom:
- multiple circulating “final” files
- no visible owner or approval state
- uncontrolled edits to regulated or financial documents

Why it is bad:
- EuSpRIG’s governance mindset for spreadsheet risk applies here too: uncontrolled versions, changes, and access are how high-stakes document errors survive review
- readers cannot tell which copy is authoritative

Better move:
- define the system of record
- label controlled versions clearly when the workflow requires it
- separate draft, review, and released copies
- limit editing rights where the environment supports it
- log revision history for controlled documents

### Team style drift

Symptom:
- coauthors apply local formatting freely
- multiple templates or theme versions collide

Why it is bad:
- document family stops looking like a family
- numbering and styles become unstable

Better move:
- centralize the template
- protect the style system socially or technically where possible
- normalize before final review

## 7) Domain mismatches

### Manuscript dressed like a marketing report

Symptom:
- heavy color, branded boxes, executive-summary styling in a journal manuscript

Why it is bad:
- violates genre expectations
- can hurt submission credibility

Better move:
- switch to the journal or academic template and strip decorative styling

### Grant or court filing with wrong headers, footers, or font sizes

Symptom:
- sponsor or court rules ignored in favor of house style

Why it is bad:
- creates compliance risk

Better move:
- let the external rule set override local design preferences

### SOP written as an essay

Symptom:
- long paragraphs, no step numbering, no control metadata

Why it is bad:
- hard to execute under real conditions

Better move:
- convert to procedure structure with control fields and numbered steps

## 8) Know when Word is the wrong tool

Word is excellent for structured documents. It is not ideal for every design problem.

Use another format or tool family when the job is really:

- a full-bleed brochure or magazine layout
- a complex marketing one-pager with precise graphic composition
- a data dashboard that should be interactive
- a poster with advanced vector illustration demands
- a giant book workflow relying on fragile master documents
- a structured dataset that belongs in a spreadsheet or database

A professional document maker knows when not to force Word into being InDesign, Excel, or a BI tool.

## 9) AI-generated document pitfalls

AI agents produce a recognizable class of document failures. Watch for these:

### Over-formatting

Symptom:
- too many styles, colors, borders, and decorative elements applied at once
- every heading gets a different color; every section gets a box or rule
- the document looks "designed" but not coherent

Better move:
- use one heading scale, one accent color, one border philosophy
- let white space and hierarchy do the work instead of visual noise

### Over-listing

Symptom:
- prose converted to bullet lists when sentences or paragraphs would read better
- every paragraph broken into bullets regardless of whether the content is parallel

Better move:
- use lists only when items are genuinely parallel, scannable, and benefit from visual separation
- default to prose for explanation, argument, and narrative

### Generic structure

Symptom:
- the same heading pattern applied to every document regardless of type
- a memo that looks like a report; a grant that looks like a business case

Better move:
- classify the document type first and follow its expected structure pattern
- see `document-architecture.md` §4 for genre-specific patterns

### Placeholder and template language

Symptom:
- "Insert X here," "As applicable," or generic descriptions left in the output
- boilerplate that was never customized to the actual content

Better move:
- fill or remove every placeholder before delivery
- if information is missing, ask for it rather than leaving a template stub

### Excessive front matter

Symptom:
- TOC, executive summary, glossary, and list of figures added to a two-page memo
- ceremonial structure that overwhelms a short document

Better move:
- match front matter to document length and complexity
- see `document-architecture.md` §3 for when each navigation component earns its place

### Style-name invention

Symptom:
- custom style names created instead of using Word's built-in heading styles
- "MyHeading1" or "Custom Title" instead of "Heading 1" and "Title"

Better move:
- prefer modifying Word's built-in styles over creating new ones
- built-in styles work more predictably with TOCs, navigation, hyperlinks, and accessibility

## 10) Fast review checklist

Before release, ask:

- Are real styles doing the work?
- Is the heading ladder logical?
- Is spacing governed by styles rather than blank lines?
- Are tables and figures captioned, referenced, and aligned?
- Are fonts and colors restrained?
- Are headers, footers, numbering, and metadata correct?
- Are comments, revisions, and hidden artifacts intentionally handled?
- Does the document still fit its domain?

Cross-reference: use `style-system-typography.md` to repair style debt, `accessibility-compliance.md` to fix structural access problems, and `domain-constraints.md` when a “clean-looking” change may still violate external rules.
