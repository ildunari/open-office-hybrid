---
name: word-mastery
description: Platform-agnostic document design intelligence for Word-style work. Provides information architecture, typography, style-system, accessibility, and domain-compliance knowledge for producing professional documents. Supersedes generic document guidance. Pair with a toolchain skill (docx-enhanced for Claude Code/Desktop, or equivalent) for mechanical execution. Use whenever the task involves document architecture decisions, style system design, heading hierarchy, table or figure design, accessibility review, domain compliance (NIH grants, legal filings, journal manuscripts, SOPs, technical reports), anti-pattern detection, or editorial standards. Do not trigger for python-docx scripting, OOXML manipulation, pandoc conversion, document rendering, or pure prose writing with no document-formatting deliverable.
---

# Word mastery

Professional Word work is not "making text look nicer." It is information architecture, typography, navigation, revision control, accessibility, and domain compliance working as one system. A good document lets a reader predict where things live, skim without getting lost, trust the numbering and references, and print or export without surprises. A bad one may contain the same words but still feel amateur because its hierarchy, spacing, tables, captions, and page logic were improvised instead of designed.

Use this skill to think like a document editor and information architect, not like a toolbar operator. Start by classifying the document's domain, audience, and constraints. Then build the structure, bind content to named styles, handle tables and figures as reading tools, and finish with accessibility and compliance checks. The goal is not decorative formatting. The goal is a document that survives revision, review, conversion to PDF, and reuse by other people.

Load only the reference files needed for the current task. Do not bulk-load the entire library. The root file gives the operating rules; the reference files provide task-specific depth.

## Routing table

| Task | Load |
|---|---|
| Creating any new document from scratch | `references/document-architecture.md` + `references/style-system-typography.md` |
| Formatting or restyling an existing document | `references/style-system-typography.md` + `references/anti-patterns.md` |
| Building or formatting tables | `references/tables.md` + `references/style-system-typography.md` |
| Inserting or formatting figures/images | `references/figures-visual-elements.md` |
| NIH grant, manuscript, legal doc, SOP | `references/domain-constraints.md` + `references/document-architecture.md` |
| Designing lists or numbering schemes | `references/lists-numbering.md` |
| Headers, footers, page numbering, print layout | `references/headers-footers-layout.md` |
| Writing, editing, or proofreading content | `references/writing-editorial.md` |
| Accessibility audit or compliance check | `references/accessibility-compliance.md` |
| Reviewing/improving an existing document | `references/anti-patterns.md` + whatever domain applies |
| Publication-quality document for submission | `references/domain-constraints.md` + `references/figures-visual-elements.md` + `references/accessibility-compliance.md` |
| Creating or customizing a template | `references/document-architecture.md` (§8) + `references/style-system-typography.md` |
| Merging or assembling multiple documents | `references/document-architecture.md` + `references/headers-footers-layout.md` |
| Converting between formats | `references/style-system-typography.md` + `references/anti-patterns.md` |
| Compliance audit (journal, court, sponsor) | `references/domain-constraints.md` + `references/accessibility-compliance.md` |
| Repairing a corrupted or inconsistent document | `references/anti-patterns.md` + `references/headers-footers-layout.md` |
| Designing a branded template system for a team | `references/style-system-typography.md` + `references/document-architecture.md` (§8) |
| Managing tracked changes and review workflow | `references/document-architecture.md` (§7) + `references/anti-patterns.md` (§6) |
| Reflowing or repaginating after edits | `references/headers-footers-layout.md` + `references/anti-patterns.md` (§2) |

When loading 3 or more reference files, focus on the sections most relevant to the specific task. Read headings and scope statements first, then dive into only the sections that apply.

## Universal rules

1. Classify the document before touching formatting. Identify domain, audience, medium, page or word limits, approval workflow, and whether the document will be printed, redlined, or converted to PDF.
2. Design the document tree before styling paragraphs. Decide what belongs in front matter, body, and back matter, and what navigation aids the reader actually needs.
3. Use named styles for every recurring element. Headings, body, captions, list items, table text, notes, quotations, and headers or footers should all be style-driven. Reserve direct formatting for true inline emphasis only.
4. Keep the heading ladder shallow and logical. Default maximum depth is three levels (Heading 1–3). Use Heading 4 only as a run-in or rare technical subhead. If you reach Heading 5, restructure instead.
5. Control measure, margins, and spacing to support reading. Comfortable line length and consistent vertical rhythm matter more than flashy decoration.
6. Use paragraph spacing, tabs, list styles, and section settings intentionally. Do not simulate layout with empty paragraphs, repeated spaces, or hand-typed numbering.
7. Treat tables and figures as evidence, not ornaments. Each one needs a job, a caption, consistent styling, and placement near its first discussion.
8. Put navigation where length or complexity warrants it. Long documents need page numbers, stable headings, and often a TOC, list of figures, list of tables, or executive summary.
9. Build for revision. Cross-references, caption numbering, reusable building blocks, templates, and themes beat one-off formatting every time.
10. Preserve accessibility from the start. Use real headings, real lists, real tables, descriptive links, meaningful alt text, and sufficient contrast.
11. Edit existing documents surgically unless the user explicitly wants a redesign. Preserve the established architecture when possible, but normalize obvious style debt.
12. Finish with a release check. Update fields, verify numbering and references, remove or retain comments and tracked changes intentionally, inspect metadata, and confirm domain-specific compliance.
13. Treat compliance failures as blockers, not suggestions. A biosketch in the wrong format, a court filing with prohibited fonts, or a manuscript that ignores journal structure rules will be rejected regardless of polish. When domain-constraints.md flags a requirement, enforce it before any design preference.

## Before you start

Run this checklist on every Word task:

- What is the document type: memo, report, proposal, manuscript, grant, contract, thesis, SOP, technical specification, form, or something else?
- Who is the primary reader: executive, reviewer, regulator, judge, collaborator, student, technician, or general audience?
- Is there an existing template, house style, journal guide, court rule, NOFO, institutional manual, or brand system that outranks default guidance?
- What are the hard constraints: page limits, word limits, font restrictions, margin minimums, required sections, required numbering, required citation system, accessibility rules, export target?
- Is this a new document, a redesign, or a surgical edit to an existing file?
- Will the file be reviewed with tracked changes or comments? Will a clean version also be needed?
- Does the document need a TOC, executive summary, abstract, list of figures, list of tables, glossary, appendices, references, or revision history?
- Are there tables, figures, formulas, code samples, warnings, signatures, or forms that need specialized handling?
- Does the document need to survive PDF export, screen-reader use, or print binding?

## Operating pattern

0. Read `FEEDBACK.md` for lessons from prior tasks.
1. Load the minimum relevant references from the routing table.
2. Make domain and architecture decisions first.
3. Bind content to a style system before adjusting details.
4. Apply domain-specific constraints before polish.
5. Review against anti-patterns and accessibility before calling the document finished.
6. After task completion, log any skill gap or lesson learned to `FEEDBACK.md`.

## Output mode

This skill provides design decisions and specifications, not executable code. Adapt your output to the interface you are working through:

- **If you can directly edit the document** (Claude in the Loop in Word, MCP with Word access, or a similar integration): apply the guidance through the available editing commands. Name the styles, settings, and values you are applying.
- **If you are producing a new .docx file programmatically** (python-docx, docx.js, or another library): use whatever tool is available. Apply the guidance through that tool's style, paragraph, table, and section APIs. The reference files tell you what to set; map those values to your tool's API.
- **If you can only advise** (chat-only, no document access): produce a formatting specification the human can follow — list the styles, fonts, sizes, spacing, and structural decisions with enough specificity that the human can apply them without guessing.
- **If the user provides a document for review**: describe what needs to change, where, and why. Cite specific anti-patterns by name when relevant.

In all modes, state the reasoning behind your choices so the human can override intelligently when their context differs from the default.

## Relationship to other document skills

- **word-mastery** (this skill): Design knowledge — architecture, typography, style systems, accessibility, domain compliance. Platform-agnostic. No scripts or templates.
- **docx-enhanced**: Execution toolchain for Claude.ai and Claude Desktop sandbox — python-docx, docx.js, pandoc, OOXML manipulation, rendering. Use word-mastery's design decisions, then execute with docx-enhanced's tools.
- **doc**: Lightweight rendering-focused skill (soffice + pdftoppm). Subset of docx-enhanced.

When both word-mastery and a toolchain skill are loaded, word-mastery provides the "what and why," the toolchain skill provides the "how."

## Default posture for existing documents

When improving or reviewing an existing file, prefer the smallest change that solves the problem. Keep the original hierarchy unless it is broken. Preserve tracked-change readability. Do not replace a stable style system with ad hoc local edits. When the source document is clearly corrupted or inconsistent, stop patching symptoms and rebuild the style and section framework in a clean structure.

## Conflict resolution

When a user's aesthetic or structural preference conflicts with a domain compliance rule (e.g., "make this NIH grant look modern with branded colors and decorative headers"), state the conflict explicitly rather than silently choosing one side. Explain what the compliance rule requires and why violating it matters (rejection, accessibility failure, court sanctions), then offer compliant alternatives that address the user's underlying intent. User aesthetic preferences yield to domain compliance. User structural preferences yield to sponsor, court, or journal rules when submission is involved. Everything else defaults to the user's stated intent.

## Mixed-domain documents

When a document spans multiple domains (e.g., a grant application containing legal subcontracts, or a business report with academic citations), apply the strictest domain's constraints as the floor, then layer additional domain rules where they apply to specific sections. Load all relevant domain references from the routing table. When domain rules conflict, state the conflict explicitly and ask the user which rule set takes priority for the contested element.

## Done condition

Stop when the document is structurally coherent, style-driven, domain-compliant, accessible, and ready for the next human reader without manual cleanup. If anything was surprising or missing during this task, add one entry to FEEDBACK.md before finishing.
