---
name: openword-best-practices
description: Tool selection and workflow guidance for reading and editing Word documents via Office.js. Use this skill for EVERY document task — it determines which tool to use first, how to verify formatting, and how to avoid silent data loss. Triggers on any Word document interaction including reading, editing, formatting, reviewing comments, checking tracked changes, inspecting tables, or working with styles. Even simple tasks benefit from correct tool ordering.
---

## Tool Selection by Task

Choose the right tool first. Using the wrong tool wastes tokens, misses information, or silently destroys formatting.

| Task | Best Tool | Backup |
|------|-----------|--------|
| Quickly read paragraphs, styles, list markers | `get_document_text` | `execute_office_js` HTML |
| Understand document layout and heading outline | `get_document_structure` | `get_document_text` |
| Read comments, tracked changes, table objects | `execute_office_js` | `screenshot_document` |
| Verify exact formatting and XML truth | `get_ooxml` | `execute_office_js` HTML |
| Verify what the page visually looks like | `screenshot_document` | — |
| Check run formatting (bold, italic, color, highlight) | `get_ooxml` | `execute_office_js` HTML, `screenshot_document` |
| Font family and size changes | `get_ooxml` | `execute_office_js` HTML |
| Superscript / subscript | `get_ooxml` | HTML (`<sup>` etc.) |
| Paragraph alignment / spacing / indent | `get_ooxml` | `get_document_text` (alignment only) |
| Lists | `get_document_text` | `get_document_structure`, `get_ooxml` |
| Tables | `get_ooxml` | `execute_office_js`, `screenshot_document` |
| Hyperlinks | `execute_office_js` HTML or `get_ooxml` | `get_document_text` (visible text only) |
| Footnotes | `get_ooxml` | `get_document_text` (marker only), screenshot |
| Headers and footers | `execute_office_js` | `screenshot_document` |
| Comments | `execute_office_js` | — |
| Tracked changes | `execute_office_js` | `screenshot_document` |
| Check hyperlink destination | HTML or OOXML | — |
| Check table structure and merged cells | OOXML or Office.js table APIs | — |

## Default Read Workflow

Always follow this priority order. Start cheap, escalate when needed.

1. **`get_document_structure`** — orientation only. Gives heading hierarchy, table presence, section count. Does not expose formatting, comments, tracked changes, or hyperlinks.
2. **`get_document_text`** — fast content review. Best default for reading and targeting paragraphs. Returns text, styles, alignment, list levels. Loses run formatting (colors, fonts, super/subscript collapse to plain text). Flattens tables into paragraph stream.
3. **`execute_office_js`** — comments, tracked changes, table APIs, and HTML extraction. HTML is a useful middle ground between plain text and full OOXML — it exposes hyperlink targets, highlights as CSS, bold/italic as HTML tags, and superscript as `<sup>`.
4. **`get_ooxml`** — exact formatting truth. Use when formatting matters or when an API/screenshot discrepancy appears. Scope it to narrow body-child ranges to control token cost.
5. **`screenshot_document`** — visual confirmation. Decisive fallback when property reads miss formatting. Use for highlights, colors, tables, headers/footers, and layout sanity checks.

## Formatting-Sensitive Editing Workflow

1. Read target paragraph(s) with `get_document_text`
2. If run formatting matters, inspect narrow-range `get_ooxml`
3. If a visual discrepancy is suspected, use `screenshot_document`
4. Prefer search/replace when possible — it preserves formatting automatically
5. Use OOXML replacement for mixed-run formatting

## Critical Edge Cases

These are real behaviors observed in testing. Ignoring them causes silent data corruption.

### Direct property reads can under-report formatting
A selected text sample may visibly show red text and green highlight, but a direct Office.js `font.color` / `font.highlightColor` read returns `null`. This is a known limitation. If visual formatting matters, do not trust a single property read. Escalate to `get_ooxml` or `screenshot_document`.

### Formatting inheritance during programmatic insertion
Inserted runs can inherit formatting from prior runs unexpectedly. Explicitly set formatting for each inserted run. Verify visually or via OOXML after formatting-heavy insertions.

### HTML is a useful middle ground
`getHtml()` is often more informative than raw text and much lighter than full OOXML. For moderate-complexity formatting questions, try HTML before OOXML. For exact preservation or editing, prefer OOXML.

### `get_document_text` loses formatting semantics
Excellent for content reading but collapses scientific and formatted text to plain text. Superscript/subscript become baseline (`H2O`, `x2`, `10-6`). Manual line breaks become `\u000b`. Page breaks become `\f`. Footnote markers become control characters without content. Use it as a first-pass reader, not the sole source for formatting-sensitive tasks.

### OOXML should be scoped, not used globally
OOXML is powerful but verbose. Use `get_document_structure` / `get_document_text` first to locate the target, then call `get_ooxml` on a narrow child range. Never dump the entire document's OOXML into context unless absolutely necessary.

## What Each Tool Misses

Understanding tool blindspots prevents false confidence.

**`get_document_structure`** misses: run formatting, paragraph property details, comments, tracked changes, hyperlinks, footnotes, header/footer details.

**`get_document_text`** misses: run formatting (colors, highlights, font names), exact super/subscript, hyperlink targets, table formatting (flattens to paragraphs), header/footer text, comment/tracked-change metadata.

**`execute_office_js`** misses: some direct font/highlight property reads return `null` even when formatting is clearly present. Run-level details can be awkward unless using HTML or OOXML.

**`get_ooxml`** misses: nothing about formatting (it is the truth source), but it is token-expensive if used broadly and hard to read without scoping.

**`screenshot_document`** misses: machine-readable content. It shows what humans see but requires page-by-page inspection and cannot be used for programmatic extraction.
