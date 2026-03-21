# Document architecture & structure

Scope: use this file when you are planning a new document, restructuring an existing one, or deciding what sections, navigation aids, and section breaks the document needs. Think in terms of reader journey first, then formatting.

## Contents

1. Document tree
2. Section hierarchy
3. Navigation decisions
4. Document patterns by type
5. Sections, breaks, and mixed layouts
6. Cross-references and fields
7. Revision and versioning
8. Template architecture

## 1) Build the document tree before formatting

Design the document in three layers: **front matter -> body -> back matter**.

### Front matter: include only what helps orientation

Use front matter when the reader needs framing before the main text.

- **Title page**: use for formal reports, proposals, theses, grant attachments with distinct cover pages, board materials, and documents that will circulate outside the authoring team.
- **Document metadata block**: use for memo-style documents, SOPs, technical reports, and controlled documents. Typical fields: title, author, department, date, version, confidentiality, effective date, approval owner.
- **Executive summary**: include when the reader may decide before reading in full. Default for board papers, strategy reports, business cases, due diligence reports, and long proposals.
- **Abstract**: include for manuscripts, theses, technical reports, and regulated submissions when the genre expects one.
- **Table of contents**: include when the document is long enough or deep enough that navigation will otherwise fail. Default threshold: 6 or more pages, 12 or more headings, or more than two heading levels.
- **List of figures / list of tables**: include at 5 or more figures or 5 or more tables, or when figures and tables are core evidence.
- **Glossary / abbreviations**: include when terminology is dense, regulated, or domain-specific.

Do not bloat short documents with ceremonial front matter. A two-page memo with a TOC looks artificial.

### Body: the argument, procedure, or narrative spine

The body should answer one question cleanly: what job is this document doing?

Common body patterns:

- **Report**: situation -> analysis -> findings -> recommendations -> next steps.
- **Proposal**: problem -> approach -> work plan -> budget/resources -> benefits -> appendices.
- **Manuscript**: abstract -> introduction -> methods -> results -> discussion -> references.
- **Grant**: overview or aims -> significance -> innovation -> approach -> supporting material.
- **Contract**: preamble -> recitals -> definitions -> operative clauses -> boilerplate -> signatures -> schedules.
- **SOP**: purpose -> scope -> responsibilities -> procedure -> records -> revision history.
- **Technical specification**: scope -> references -> requirements -> interfaces -> performance -> test/verification -> appendices.

Choose one dominant pattern. Do not mash together memo, brochure, and manuscript conventions in the same file.

### Back matter: move support material out of the reader’s path

Use back matter to protect the main reading line.

Good candidates:

- Appendices for raw data, long tables, legal schedules, supplementary methods, reference documents, or audit detail.
- Bibliography or references.
- Endnotes, if the domain prefers them over footnotes.
- Revision history for controlled documents.
- Signature pages, exhibits, annexes, and forms.

If a table is too detailed for the main narrative but still needs to exist, move it to an appendix and summarize the takeaway in the body.

## 2) Keep the section hierarchy shallow, balanced, and honest

Word rewards real hierarchy. Readers do too.

Use these rules:

- One **Heading 1** for each major part of the body.
- Default maximum depth is **Heading 3**.
- Use **Heading 4** only as a run-in or rare technical subhead. If you reach Heading 5, restructure.
- Do not skip levels. Never jump from Heading 1 directly to Heading 3.
- Avoid “singleton” subsections. If a section has only one subheading, either add a peer section or fold it back up.
- Keep section lengths proportionate. A heading followed by one sentence usually means the structure is too granular.
- Merge sections when headings are doing the work that paragraph lead-ins should do.
- Split sections when you see walls of text, long mixed-purpose paragraphs, or repeated topic shifts.

A practical test: if a reader opens the Navigation pane and sees a clean outline, the architecture is probably working. If the outline looks like a legal index for a two-page brief, it is overbuilt.

## 3) Add navigation only when it earns its keep

Use navigation components as reader tools, not as badges of seriousness.

### Include a TOC when

- the document crosses the 6-page or 12-heading threshold
- the audience needs to jump between sections
- the file will become a PDF or printed packet
- the document has appendices, many figures, or deep structure

Do not include a TOC in a one- to three-page memo, short letter, or brief business note.

### Include an executive summary when

- the primary reader is an executive, reviewer, or sponsor
- the document contains decisions, recommendations, costs, risks, or tradeoffs
- the full body is likely to be skimmed rather than read in sequence

Keep executive summaries short. One page is often enough. It should not become a second report.

### Include an abstract when

- the genre explicitly expects one
- the document will be indexed, submitted, or archived academically
- methods and findings need a formal synopsis

### Include appendices when

- evidence would interrupt the main story
- compliance requires supporting detail
- large tables, instruments, questionnaires, protocols, or exhibits are necessary
- you need to preserve a clean main narrative for non-specialist readers

## 4) Use document patterns that match the genre

### Memo

Use a simple top block: To, From, Date, Subject. Then a short opening statement, background if needed, recommendation or action, and supporting detail. Usually no TOC. Headers and footers should be minimal.

### Business report

Use title page or title block, executive summary, TOC if length warrants, main sections, recommendations, appendix. Running headers often show short title or section title. Page numbers are expected.

### Proposal

Lead with the client or sponsor problem, then proposed approach, deliverables, timeline, team, budget, and assumptions. Make scope boundaries explicit. Appendices handle CVs, case studies, and detailed budgets.

### Manuscript

Follow the target journal or style manual first. If no template exists, use the journal’s expected sequence and keep the structure conservative. Do not invent branded report styling inside a manuscript.

### Grant application

Use only the sections required by the current announcement, sponsor instructions, and forms package. Grant readers are compliance readers. Architecture errors cost more than decorative weakness.

### Contract or agreement

Use stable numbering, defined terms, recitals, operative clauses, signature blocks, and schedules or exhibits. Cross-references must be field-driven or at least systematically checked. Do not improvise numbering by hand.

### SOP or controlled procedure

Use a control header, document number, revision, effective date, approvals, and a stable section pattern. Put responsibilities before procedure. Use warnings, cautions, and notes consistently.

### White paper

Lead with the problem, stakes, and thesis. Keep the structure explanatory rather than bureaucratic. Use sidebars or callouts only if they genuinely aid scanning.

## 5) Use sections and breaks intentionally — what to create and when

A Word section is not just a page break. It carries page geometry and header or footer state. This section covers **when** to create section breaks and **which type** to use. For how section breaks interact with headers, footers, and page numbering behavior, see `headers-footers-layout.md` §3.

### Use section breaks for changes in

- header or footer content
- page numbering format or restart
- margins
- columns
- page orientation
- first-page behavior
- odd/even page behavior

### Use the right break type

- **Next Page**: start a new section on a new page. Default for major layout changes.
- **Continuous**: change columns, margins, or similar settings without forcing a new page. Use sparingly because it is easy to destabilize layout.
- **Odd Page / Even Page**: use only in book-like or duplex-controlled work where opening position matters.

For a landscape table inside a portrait report, use a section break before the landscape page and another after it. Keep the landscape page self-contained. Do not rotate one page by hacking margins and text boxes.

Each section break owns formatting. When headers, page numbers, or margins behave strangely, inspect the nearest section break first.

## 6) Use cross-references instead of typed numbers

Typed “see Table 4 on page 19” becomes wrong the moment the document changes.

Do this instead:

- Apply real heading styles so section cross-references work.
- Insert figure and table captions before creating references to them.
- Use bookmarks for named anchors that are not headings or captions.
- Cross-reference headings, numbered items, tables, figures, footnotes, and page numbers through fields rather than manual typing.
- Update fields before delivery so TOCs, page numbers, figure references, and list entries are current.

Keep bookmark names stable, short, and semantic. Prefer `method_overview` to `bookmark17`.

## 7) Control revision and versioning inside the document

Use comments and tracked changes as communication tools, not as clutter.

- Use **tracked changes** when another person needs to audit edits.
- Use **comments** for rationale, questions, or localized review requests.
- Group related revisions instead of touching every sentence unnecessarily.
- Save a **clean version** and a **review version** when external readers need both.
- Use a visible version label only when the organization already works that way. Otherwise rely on file naming and document properties.
- For controlled documents, maintain revision history in the document or in the document management system, not both unless required.

When editing an existing file, prefer local corrections over whole-section rewrites. A readable redline is a professional deliverable.

## 8) Separate template content from document content

Put reusable structure in the template. Put case-specific material in the document.

### Put these in the template

- page size, margins, gutters, and section presets
- theme fonts and colors
- named paragraph, character, list, and table styles
- default headers and footers
- building blocks or Quick Parts for recurring boilerplate
- cover-page scaffolds
- caption labels and list behaviors
- standard disclaimers, signature blocks, approval blocks, and revision tables when they recur

If you save reusable blocks, include the paragraph mark with the selection so paragraph formatting is stored with the block.

### Keep these document-specific

- title, subtitle, dates, authors, recipients
- factual content and analysis
- document-specific figures and tables
- current version notes
- references and appendices unique to the matter

Avoid Word’s master-document workflows unless you are in a mature, controlled environment that explicitly depends on them. For most teams, separate files plus careful assembly are more robust than fragile subdocument chains.

Cross-reference: pair this file with `style-system-typography.md` when creating a new document, and with `headers-footers-layout.md` when the task involves sections, page numbering, or mixed portrait/landscape layouts.
