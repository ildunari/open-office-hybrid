# Accessibility & compliance

Scope: use this file when creating, reviewing, or finalizing documents that must work for screen-reader users, keyboard users, low-vision readers, PDF export workflows, or formal accessibility review. Accessibility is not a cleanup pass; it is a structural design requirement.

## Contents

1. Structural accessibility
2. Alt text and non-text content
3. Color and contrast
4. Accessible tables, lists, and links
5. Document properties and language
6. PDF and Section 508 considerations
7. Release checklist

## 1) Structural accessibility starts with real document structure

Screen readers and export tools depend on semantic structure, not on appearance.

### Heading rules

Apply the heading hierarchy from `document-architecture.md` §2. For accessibility, also ensure: heading text is descriptive (“Results” is better than “More”), the Navigation pane mirrors the actual document outline, and no heading is created by formatting alone. A document that looks organized but has no real heading structure is inaccessible and hard to maintain.

### Reading order

Keep the reading path linear where possible.

Good defaults:

- use inline objects rather than free-floating ones
- avoid text boxes for essential content
- keep captions adjacent to the object they describe
- place sidebars and callouts where they still make sense when read in sequence

If the file will become a tagged PDF, poor Word structure usually becomes poor PDF structure.

## 2) Alt text should communicate purpose and takeaway

Every meaningful image, chart, diagram, screenshot, or embedded visual needs an accessible text equivalent.

### Write alt text this way

- explain the purpose or message
- stay concise but specific
- avoid “image of” unless the type itself matters
- do not repeat the caption word for word unless the caption fully serves as the alternative

Examples:

Bad:
- “Picture of workflow”

Better:
- “Workflow showing request intake, manager approval, quality review, and final release”

Bad:
- “Bar chart”

Better:
- “Bar chart showing grant submissions increasing from 14 to 29 over three cycles, with the largest increase in 2025”

### Decorative visuals

If an image is decorative and adds no information, mark it decorative when the platform supports it or remove it. Decorative clutter is not harmless. It creates noise for assistive technology.

### Complex graphics

For complex charts, process maps, or scientific figures:

- use concise alt text for the main takeaway
- provide supporting explanation in nearby body text or a note
- if the data itself matters, include a table or prose summary

Alt text is not the place to narrate 30 data points one by one.

## 3) Meet contrast and non-color requirements

WCAG 2.1 AA remains the practical baseline for most document work.

### Minimum contrast targets

- **4.5:1** for normal text
- **3:1** for large text

Keep body text dark enough against the background. Pale gray body text, colored captions with weak contrast, and pastel hyperlinks all fail real readers even when they “look modern.”

### Do not use color alone

If color signals status, category, or change, add another cue:

- text labels
- patterns
- icons
- underlines
- shapes
- direct annotations

If hyperlinks are distinguished by color alone, that is not enough. They also need another cue such as underlining, and the link color itself must remain distinguishable from surrounding text.

## 4) Make tables, lists, and links genuinely usable

### Tables

See `tables.md` §8 for the full table accessibility specification. Key principles: use real tables with header rows, keep structure simple, repeat headers on multi-page tables, and write explicit values instead of meaningful blanks.

### Lists

- use built-in bulleted and numbered list structures
- do not fake bullets with hyphens and spaces
- keep multilevel lists shallow enough to stay understandable

### Hyperlinks

- use descriptive link text
- avoid “click here,” “more,” or raw pasted URLs in narrative text unless the URL itself is the point
- make sure link text still makes sense out of context

Good:
- “Download the 2026 submission checklist”

Bad:
- “Click here”

## 5) Set document properties and language intentionally

Accessibility includes metadata.

Before release, verify:

- document title is set
- author or organization fields are correct where needed
- default language is correct
- subject and keywords are added if the workflow expects them
- file name is readable and meaningful

A document with the wrong language setting may be pronounced incorrectly by screen readers and processed poorly in export.

### Use built-in checkers, but do not stop there

Run the accessibility checker available in the authoring environment, but treat it as a floor. It catches many structural issues, not all reading problems.

Also inspect:

- heading logic
- link text
- alt text quality
- table complexity
- color meaning
- metadata
- final PDF tags and bookmarks if PDF export is required

### Remove hidden or risky metadata intentionally

Use document-inspection or review tools to remove comments, revision marks, hidden text, personal data, and other internal artifacts when the final deliverable should not expose them.

## 6) PDF, PDF/UA, and Section 508

Many Word documents end life as PDFs. Accessibility must survive that conversion.

### Tagged PDF expectations

When exporting to PDF:

- preserve document structure tags
- preserve headings so bookmarks can be generated
- verify figures carry alt text
- verify reading order
- verify links remain live and descriptive

A visually correct PDF can still be structurally unusable.

### PDF/UA

If the workflow calls for accessible archival or formal compliance, aim for PDF/UA-compatible output and validate the PDF, not just the Word source.

### Section 508 perspective

Section 508 review often expects:

- meaningful headings and navigation
- alt text on non-text content
- sufficient contrast
- descriptive links
- accessible tables
- tagged export
- correct metadata and title
- forms and fields with clear labels, if forms are involved

Also remember the broader guidance: if HTML would serve the audience better than PDF, do not assume a PDF is the most accessible answer just because it is familiar.

## 7) Accessibility release checklist

Do not release until you can answer yes to these:

1. Does the document use real heading styles in a logical order?
2. Is there one clear main title?
3. Are all meaningful images supplied with useful alt text?
4. Is any decorative image marked decorative or removed?
5. Do tables have header rows and simple structure?
6. Are lists real lists?
7. Do hyperlinks make sense on their own?
8. Is contrast strong enough for text and essential graphics?
9. Is no essential meaning carried by color alone?
10. Are document title, language, and metadata set correctly?
11. If exported to PDF, does the PDF keep tags, bookmarks, links, and reading order?
12. Have comments, tracked changes, and hidden metadata been intentionally preserved or removed?

Cross-reference: use `figures-visual-elements.md` for chart and image guidance, `tables.md` for table structure, and `anti-patterns.md` when cleaning accessibility debt from an inherited document.
