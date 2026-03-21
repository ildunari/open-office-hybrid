# Lists & numbering

Scope: use this file when deciding whether content should be a bullet list, numbered list, multilevel outline, definition list, or prose paragraph. Lists should reduce effort for the reader, not create indentation spaghetti.

## Contents

1. Bullet lists
2. Numbered lists
3. Definition lists
4. Multilevel numbering systems
5. List formatting rules
6. When lists hurt readability

## 1) Bullet lists: use for parallel items without sequence

Bullets work when the reader needs to scan related items quickly and order is not the main point.

Good use cases:

- features
- risks
- criteria
- document inclusions
- summary findings
- short recommendations

Bullets are a bad choice for content that depends on chronology, causality, or legal reference precision. Use numbered items or prose instead.

### Punctuation rules

Follow CMOS 17th edition list punctuation logic (§6.130–6.132):

- If all items are short fragments completing an introductory stem, no terminal punctuation is needed. Optional: use a period after the last item.
- If all items are complete sentences, capitalize and punctuate each one as a sentence.
- If items are long, internally punctuated, or multi-sentence, punctuate them fully.
- Keep one punctuation scheme per list. Do not mix fragments and full sentences casually.
- CMOS permits either run-in lists (items inline with text, separated by commas or semicolons) or vertical lists. Use run-in when items are short and few; use vertical when items need scanning or are numerous.

### Parallel structure

Every item in a list should follow the same grammatical pattern.

Good:
- Reduce cycle time
- Improve data quality
- Clarify approval ownership

Bad:
- Reduce cycle time
- Data quality should improve
- Ownership was unclear

If the list cannot be made parallel, it may not really be a list.

## 2) Numbered lists: use when order, priority, or reference matters

Use a numbered list when the reader needs to know sequence or refer back to item numbers later.

Good use cases:

- procedures
- rankings
- required steps
- decision criteria in order
- contract obligations or deliverables that will be referenced later
- questions in a form or interview guide

### Procedure lists

For procedures, each step should begin with a clear action verb.

Better:
1. Verify the sample ID against the intake log.
2. Record the temperature.
3. Notify quality assurance if the seal is broken.

Worse:
1. Sample ID verification.
2. Temperature.
3. Broken seal.

When a procedure has substeps, keep the main step as the user-visible action and put subordinate detail beneath it rather than creating a five-level outline.

## 3) Definition lists: use when terms need explanations

A definition list or term-description pattern works well for:

- glossaries
- contracts
- SOP definitions
- policy documents
- technical reference sheets

Format the term and definition distinctly:

- term in bold or a dedicated term style
- definition on the same line after a colon for short entries
- definition on the next indented line for longer entries

If there are many definitions, sort them consistently and consider a dedicated glossary section rather than scattering them.

## 4) Multilevel numbering: keep it stable and shallow

Most documents need no more than three numbering levels.

### Recommended general pattern

- Level 1: 1, 2, 3
- Level 2: 1.1, 1.2, 1.3
- Level 3: 1.1.1, 1.1.2

For legal or policy work, the pattern may shift to:

- Article I
- Section 1.1
- subsection (a)
- clause (i)

Use the domain’s expected numbering system, but do not add more levels than the reader can hold in working memory.

### Numbering rules

- Tie numbering to paragraph styles, not to manually typed numbers.
- Restart numbering intentionally, not by accident.
- Keep the same scheme across the entire document.
- Do not switch from 1.1 to A.1 in the middle unless the genre explicitly calls for it.
- When appendices are lettered, keep that logic separate and obvious: Appendix A, Appendix B, Table A-1, Figure B-2, and so on if required.

If numbering breaks during editing, fix the style or list definition. Do not patch the visible numbers by hand.

## 5) List formatting should create a clean scan path

### Indentation

Use a true hanging indent so wrapped lines align under the text, not under the bullet or number.

Good defaults:

- first-level list text starts around 0.25 to 0.5 inch from the left margin
- bullet or number sits slightly to the left of the text
- wrapped lines align with the first text line

### Spacing

- keep list items tighter than full paragraphs but not crushed
- usually 2–4 pt after items for compact lists
- add 3–6 pt before or after the whole list block if needed
- keep the lead-in sentence visually tied to the list that follows

### Lead-ins

If a paragraph introduces a list, make the relationship explicit.

Good:
The proposal will deliver three outputs:
- a validated dataset
- a reproducible analysis notebook
- a final written report

Bad:
The proposal will deliver.
- a validated dataset
- a reproducible analysis notebook
- a final written report

### Bullets and symbols

Use standard bullets, not decorative symbols. Save specialty symbols for checklists or explicit semantic meaning. A document that mixes round bullets, squares, arrows, and stars usually looks improvised.

## 6) When lists hurt readability

Convert the list to prose or a table when any of these are true:

- there are more than about 7–9 items and the list becomes a wall
- items are long enough to need paragraphs
- each item contains multiple subpoints
- the reader needs to compare attributes across items
- nesting goes deeper than two levels
- the list is really a disguised table
- the list exists only because the writer avoided deciding on hierarchy

A useful rule from plain-language practice: if the list does not help the reader find, understand, and use the information faster, it is not helping.

## Special guidance by domain

### Business and technical documents

Use bullets for concise findings, risks, and recommendations. Use numbered lists for procedures, implementation plans, and ranked priorities.

### Academic documents

Bullets should be relatively rare in manuscripts unless the field or journal expects them. Many journals prefer prose except in methods or supplementary material.

### Legal documents

Use multilevel numbering because items are routinely cited later. Stability matters more than visual minimalism. Defined terms and numbering must be maintained rigorously.

### SOPs

Number the main procedure steps. Use subordinate bullets only for options, warnings, materials, or required observations under a step.

Cross-reference: use `style-system-typography.md` for list styles and spacing, and `anti-patterns.md` if the existing document uses hand-typed numbering, mixed bullets, or tab-based fake lists.
