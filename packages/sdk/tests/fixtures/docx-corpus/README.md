# DOCX Corpus

Trusted `.docx` fixtures for adversarial Word/runtime testing.

These files are intentionally more realistic than a blank document and are meant
to stress parsing, structure discovery, OOXML inspection, reread verification,
and UI clarity around complex document states.

## Safety rules

- Sources are limited to established open-source repositories.
- Only `.docx` files are included. No `.docm`, macros, or password-protected files.
- Treat every file as untrusted input during execution anyway.

## Sources

- `mwilliamson/mammoth.js` — BSD-2-Clause
- `python-openxml/python-docx` — MIT
- `plutext/docx4j` — established open-source OOXML tooling project

## Fixture intent

- `comments.docx` — comments / annotations
- `footnotes.docx` — footnotes and note references
- `tables.docx` — table-heavy structure
- `text-box.docx` — text boxes / non-body content
- `strict-format.docx` — strict OOXML formatting edge cases
- `simple-list.docx` — list and numbering structure
- `having-images.docx` — image-heavy body content
- `blk-inner-content.docx` — nested block content structure
- `Headers.docx` — headers and header-linked content
- `toc.docx` — table of contents / field-driven structure

The source-of-truth metadata for this corpus lives in
`docx-corpus.manifest.json`.
