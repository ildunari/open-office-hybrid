# Figures, images & visual elements

Scope: use this file when inserting, sizing, captioning, or reviewing images, charts, diagrams, screenshots, callouts, and other non-table visual elements in Word documents. The goal is stable placement, readable captions, consistent sizing, and publication-grade clarity.

## Contents

1. Place visuals with intent
2. Caption and numbering rules
3. Image quality and file type
4. Figure sizing and alignment
5. Charts in documents
6. Diagrams, callouts, and sidebars
7. Accessibility for visuals
8. Publication-quality checks

## 1) Place visuals near the sentence that needs them

The best default is simple: place the visual **near its first mention**, keep it visually tied to its caption, and do not force the reader to hunt.

### Inline versus floating

Default to **inline or in-line-with-text placement** for most Word documents. It is more stable during editing, safer for accessibility, and less likely to explode when the file is opened on another machine.

Use floating placement only when:

- the layout genuinely benefits from text wrap
- the document is short and closely controlled
- the figure is decorative or side-supporting rather than the primary evidence
- the positioning will be reviewed carefully after edits

Avoid tight or square text wrap around evidence-heavy figures. It creates ragged reading paths and unstable reflow. For serious reports, manuscripts, proposals, and legal filings, a clean block figure with white space above and below is usually the professional choice.

## 2) Caption every real figure

A professional figure system has numbering, captions, and cross-references.

### Default figure caption pattern

Use Arabic numerals.

**Figure 1. Concise descriptive caption**

Put figure captions **below the figure** unless the house style or publisher says otherwise. Chicago treats figure-caption placement as more flexible than table-title placement, but the below-figure pattern is the most readable default in business, technical, and academic Word work.

Good captions do three things:

- identify the figure
- tell the reader what to look at
- stay short enough to scan

A caption is not the place for a full methods section. Move extended explanation to the body text or a note if necessary.

### Numbering and order

- Number figures in the order they are first cited.
- Cite them in text as “Figure 2” or the journal-required form such as “Fig. 2.”
- Do not let numbering restart accidentally unless the document explicitly uses chapter-based numbering.
- Keep caption styling consistent across the whole file.

For multi-panel figures, label panels consistently as **A, B, C** or **a, b, c** according to the target style, and refer to them the same way in the caption and body text.

## 3) Choose the right image quality and file type

A blurry image makes the whole document look careless.

### Resolution rules

- **Photos for print**: aim for 300 dpi at final placed size.
- **Photos for screen-only documents**: 150–220 dpi is often enough if the document will not be printed.
- **Line art, screenshots with text, and diagrams**: aim for 300–600 dpi, with 600 dpi preferred when there are fine lines or small labels.
- **Journal or standards submission**: follow the publication’s exact instruction even if it differs from your house default.

### File type rules

- **PNG**: best default for screenshots, diagrams, UI captures, and images with sharp edges or text.
- **JPEG**: use for photographs, not for charts or screenshots with text.
- **SVG or EMF**: preferred when the workflow supports vector artwork in Word. Best for logos, line diagrams, and scalable drawings.
- **Avoid screenshots of text** when actual text can be typed. Images of text are fragile, inaccessible, and often blurry in PDF.

Use the image at the size it will appear. Do not place a tiny bitmap and stretch it to full width.

## 4) Size figures as a system

Readers should feel that figure widths were chosen, not improvised.

### Good default widths

- **Full text width**: use for wide charts, process diagrams, and screenshots that need labels legible.
- **Half to two-thirds width**: use for photos, conceptual diagrams, and simpler charts when the page would otherwise feel heavy.
- **Consistent repeated width**: if several figures play the same role, keep them the same width.

Do not make every figure a different size. It creates a “pasteboard” look.

### Alignment

Center standalone figures by default. Align with the main text block, not with random paragraph indents. Keep the caption width tied visually to the figure width.

If several small related figures appear in sequence, consider:

- a multi-panel composite figure
- a figure series with consistent widths
- an appendix gallery

Do not alternate left and right placement for variety. Variety is not hierarchy.

## 5) Charts should obey document logic, not software defaults

Tufte’s core principles from *The Visual Display of Quantitative Information* apply directly:

- **Data-ink ratio**: maximize the share of ink devoted to actual data. Remove gridlines, borders, fills, and decorative elements that do not carry information.
- **Chartjunk**: 3D effects, heavy outlines, gradient fills, moiré patterns, and "ducks" (decorative illustrations masquerading as data graphics) waste the reader’s attention.
- **Graphical integrity**: the visual representation of numbers should be directly proportional to the numerical quantities represented. Truncated axes, inconsistent baselines, and area-distorted pie charts violate this.
- **Small multiples**: when comparing the same measure across many categories or time periods, use identically scaled small charts rather than one overloaded chart with a giant legend.

### Good chart defaults

- clear title or caption stating the takeaway
- direct data labels when possible, eliminating the need for a legend
- restrained gridlines — light gray or omitted entirely when data labels are present
- no 3D effects
- no heavy outlines
- consistent fonts with the document
- units on axes or in labels
- one clear takeaway per chart

### Use embedded editable charts versus static images deliberately

Use an **editable chart** when the document will be updated repeatedly by people who need to change data. Use a **static image** when submission fidelity matters and you cannot risk platform-specific chart reflow.

For final submission documents, especially manuscripts and regulatory packets, static high-resolution figures are usually safer than live charts with hidden linked data.

### Follow IBCS where useful

IBCS urges consistent notation, uncluttered comparison, semantic consistency, and message-first presentation. In Word reports, that means consistent units, consistent sign conventions, direct labeling, and repeating the same visual grammar from chart to chart.

## 6) Use diagrams, callouts, sidebars, and pull quotes only when they help comprehension

### Diagrams and flowcharts

Prefer simple, explicit diagrams over ornamental SmartArt.

Use:

- a small number of shapes
- a single reading direction, usually left-to-right or top-to-bottom
- consistent line weights
- consistent arrow logic
- labels outside the arrows when possible
- enough white space that the diagram does not feel pinned together

If the reader needs to follow a procedure, the diagram should reduce text, not duplicate it badly.

### Callout boxes and sidebars

Use callouts for:

- warnings
- key definitions
- short examples
- compliance notes
- takeaways that deserve emphasis without breaking the main narrative

Keep the visual treatment restrained: light fill, subtle border or accent bar, and body text that remains readable. Sidebars should not contain information so critical that it disappears when the document is skimmed or converted.

### Pull quotes

Use rarely. They work in white papers and polished reports, not in contracts, grants, or manuscripts.

## 7) Make every visual accessible

Every non-decorative visual needs a text equivalent.

### Alt text rules

Write alt text that explains the **purpose or takeaway**, not just the object.

Bad alt text:
- “Image of a bar chart”

Better alt text:
- “Bar chart showing operating margin rising from 12% to 18% over four quarters, with the largest increase in Q3”

If a nearby caption and body text already explain the figure fully, keep alt text concise and complementary. If the image is purely decorative, mark it as decorative when the platform supports that behavior.

### Do not rely on color alone

If a chart uses color to distinguish categories, back it up with labels, patterns, symbols, or direct annotations. A reader should still understand the chart in grayscale or with low color vision.

### Screenshots and UI captures

Crop tightly, remove irrelevant interface chrome, and highlight only what matters. If the screenshot contains critical text, reproduce that text in the body or alt text. Do not expect the image alone to carry required instructions.

## 8) Publication-quality figure checks

Before calling a figure finished, run this checklist:

- Is the figure legible at final size without zooming?
- Are labels large enough? In journal work, the final displayed text often needs to read at roughly 8–10 pt equivalent or the publisher’s minimum.
- Are the caption and numbering correct and cited in the right order?
- Is the figure anchored near its first meaningful reference?
- Does the figure survive grayscale printing or accessibility review?
- Is the file format appropriate for the content?
- Is the resolution appropriate for screen, print, or submission?
- Are there unnecessary backgrounds, shadows, gradients, or border effects?
- If the figure is for journal submission, have you checked the target’s specifics?

Examples of publisher-specific differences matter. Nature’s Extended Data guidance, for example, has historically used RGB rather than CMYK and capped image resolution at 300 ppi — always verify the current submission guide. IEEE commonly expects at least 300 dpi for photos and 600 dpi for line art. PLOS commonly asks for 300–600 dpi depending on figure type. Cell-family journals often want figure legends in the manuscript file while figure image files are submitted separately. Do not generalize one publisher’s rules to another.

Cross-reference: use `domain-constraints.md` for journal- or regulator-specific requirements and `accessibility-compliance.md` for formal alt-text, contrast, and PDF export checks.
