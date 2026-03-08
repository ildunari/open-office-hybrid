# Changelog

## [Unreleased]

## [0.0.4] - 2026-03-08

### Fixes

- **PDF commands** — Fixed `pdf-to-text` and `pdf-to-images` consuming the PDF file data on first use, causing subsequent calls to fail with "The object can not be cloned". Now copies the buffer before passing to pdfjs.

## [0.0.3] - 2026-03-08
