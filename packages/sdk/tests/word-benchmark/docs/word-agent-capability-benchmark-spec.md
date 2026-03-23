# Word-Agent Capability Benchmark Spec for Microsoft Word Side-Panel Workflows

This document is the **capability-side specification** of the benchmark suite. It preserves the original benchmark scope covering: document difficulty, human baselines, document archetypes, sample seeds, phased evaluation, task design, failure taxonomy, scoring, and the test-to-document matrix.

The companion file, `word-agent-harness-validation-spec.md`, operationalizes this benchmark: how to run it, validate it, mutate seed documents, capture evidence, score recovery, and turn it into a repeatable regression suite.

## What this benchmark should measure

A serious Word-agent benchmark is **not** a writing benchmark with a few formatting checks bolted on. It has to measure whether an agent can:

1. **Read the document as a Word document**, not just as plain text.
2. **Edit the right place** without touching adjacent or structurally linked content.
3. **Preserve Word-native structure**: styles, sections, numbering, headers/footers, captions, fields, cross-references, comments, tracked changes, footnotes, citations, and protected regions.
4. **Avoid hidden collateral damage** that is easy to miss in a text diff but obvious to an experienced Word user.
5. **Recover** when the starting document is already damaged or inconsistent.
6. **Stay safe under ambiguity**: ask for clarification or refuse risky global edits when scope is unclear.

The benchmark below is designed for a side-panel agent that can inspect, reason about, and edit `.docx` documents inside Word.

---

## 1) Document difficulty framework

### Difficulty dimensions that actually matter

A Word document becomes hard when edits are **nonlocal**. In other words, changing one thing quietly changes other things: page numbering, linked headers, list numbering, captions, TOC entries, figure references, tracked changes state, or layout of anchored objects.

| Dimension | Easy | Medium | Hard | Expert / failure-prone | Why it trips agents |
|---|---|---|---|---|---|
| **Length / scale** | 1–10 pages | 10–40 pages | 40–120 pages | 120+ pages or multi-file assembly | Longer docs amplify hidden dependencies, drift, and navigation errors. |
| **Heading hierarchy depth** | 0–2 levels | 2–3 levels | 3–4 levels | 4+ levels with mixed custom styles | Agents misplace insertions or assign the wrong heading level. |
| **Section topology** | Single section | 2–3 simple sections | Multiple section breaks, mixed orientations | Many sections with different pagination, headers, front matter/body/appendices | Section breaks control page numbering and header/footer behavior. |
| **Headers / footers / page numbering** | Single numbering scheme | Different first page or odd/even pages | Section-specific headers and numbering changes | Roman front matter + Arabic body + appendix-specific variants | Small edits can silently change later sections. |
| **Style discipline** | Clean style use | Mostly styled, some direct formatting | Mixed styles and manual formatting | Template drift, pasted content, renamed styles, local overrides | Agents that “match visually” often break structural styles. |
| **Lists / multilevel numbering** | Single-level bullets | Basic numbered lists | Multilevel lists tied to heading styles | Legal/grant clause trees, appendix numbering, imported numbering definitions | Numbering corruption is common and often subtle. |
| **Dynamic fields** | None | Page numbers only | TOC, captions, cross-references | Complex field graph: TOC + LOF/LOT + chapter-number captions + legal tables + citations | A text-only edit can leave fields stale or broken. |
| **Tables / figures / charts** | Simple inline table/image | Several inline objects | Many tables/figures with captions and references | Landscape tables, floating figures, grouped objects, chart updates | Layout shifts and caption/reference breakage become likely. |
| **Footnotes / endnotes / equations / citations** | None | A few footnotes | Many notes or equations or citations | Dense references with footnotes/endnotes and bibliography dependencies | Agents often rewrite text but fail to preserve note/citation integrity. |
| **Review state** | No comments or revisions | A few comments | Active tracked changes + comments | Multi-reviewer redlines, compare/merge artifacts, partial acceptance rules | Review-mode corruption is easy and high-cost. |
| **Collaboration artifacts** | Clean template | Minor inconsistency | Pasted content, copy/paste drift | Multiple author styles, mixed locales, stale fields, broken links | Real enterprise docs are rarely clean. |
| **Layout fragility** | Plain portrait text | Some tables/images | Orientation changes, narrow margins | Floating objects, text boxes, SmartArt, linked OLE, appendix landscape pages | Looks fine in text diff, broken in rendered pages. |
| **Protection / hidden state** | None | Inspector-clean doc | Metadata, comments, hidden text | Protected regions, linked objects, hidden metadata, partially locked forms | The agent must know what not to touch and what may update elsewhere. |
| **Constraint tightness** | Informal memo | Brand/report template | Thesis or journal template | Legal filing, government grant attachment, accessibility-constrained report | A small cosmetic miss can become a functional failure. |

### Practical difficulty classes

#### Easy
A clean short document with one numbering scheme, no section complexity, no tracked changes, and little or no field usage. Examples: memo, simple report section, one-page letter.

**Typical benchmark focus**: safe local edits, comments, short insertions, typo fixes, paragraph rewrites, heading recognition.

#### Medium
A moderately sized document with styles, a few sections, headers/footers, tables/images, maybe basic TOC/captions, and some formatting inconsistency.

**Typical benchmark focus**: style-aware edits, table insertion, section-aware edits, header/footer changes, local structure repair.

#### Hard
A long document with front matter, appendices, many headings, captions, cross-references, tables of contents/figures/tables, comments or tracked changes, and some prior formatting drift.

**Typical benchmark focus**: coordinated edits, section-aware pagination, numbering repair, caption/reference preservation, review-mode safety, long-document maintenance.

#### Expert / failure-prone
A long, messy, constraint-heavy document with section-specific page numbering, cross-reference networks, active review artifacts, floating objects, linked content, protection, or already-broken structure.

**Typical benchmark focus**: recovery, ambiguity handling, “edit only approved region” behavior, repair after prior damage, legal/grant/thesis compliance, and multi-step context retention.

### Features that should heavily increase difficulty score

A benchmark harness should up-weight documents containing the following because they create **hidden coupling**:

- section breaks that separate headers/footers or page numbering
- front matter/body/appendix pagination differences
- multilevel numbering tied to styles
- captions plus in-text references
- TOC / List of Figures / List of Tables
- active tracked changes and comments
- footnotes/endnotes, citations, bibliography
- floating objects, text boxes, landscape pages
- protected regions, linked objects, or hidden metadata
- messy pasted formatting and inconsistent styles

A useful implementation choice is to assign every seed document a **difficulty vector** rather than a single label:

```text
difficulty = {
  navigation: 1-5,
  structure: 1-5,
  field_dependency: 1-5,
  review_state: 1-5,
  layout_fragility: 1-5,
  compliance_risk: 1-5,
  semantic_dependency: 1-5
}
```

That gives you much better failure analysis than “easy/medium/hard” alone.

---

## 2) Human baseline framework

This ladder is for **practical Word competence**, not abstract computer literacy.

| User level | Usually succeeds at | Common mistakes | What separates them from next level | Too hard for them |
|---|---|---|---|---|
| **Beginner** | Basic text edits, bold/italic, simple lists, comments, basic find/replace, simple table insertion | Manual spacing with repeated Enter/Tab, direct formatting everywhere, accidental list damage, not noticing section context | Starts to understand styles and document structure instead of only visual formatting | Section-aware edits, header/footer logic, TOC/caption workflows, safe long-document work |
| **Intermediate** | Uses styles sometimes, edits tables/images, basic headers/footers, page breaks, simple section-aware edits, comment/reply workflows | Manual TOC fixes, copied formatting drift, broken page-number setup, inconsistent styles across sections | Can think in terms of sections, styles, and reusable formatting | Robust multisection documents, cross-references, captions, field-aware edits, tracked-changes cleanup |
| **Advanced** | Multisection formatting, headings/styles discipline, TOC generation, captions, cross-references, footnotes, citations/bibliography, tracked changes, compare/merge | Recovery is still brittle when doc is already damaged; may not catch hidden cross-section collateral damage | Anticipates dependencies before editing; works safely in complex long docs | Repairing broken numbering/field graphs, legal/grant/thesis edge cases, protected/risky mixed-state documents |
| **Expert** | Template discipline, long-document management, thesis/grant/legal formatting, safe recovery from broken structure, page-number schemes, defined-term consistency, selective review-mode operations | Still fallible, but errors are usually caught by deliberate validation rather than ignorance | Experts validate structure, not just appearance | Very few tasks are “too hard,” but they still seek clarification on ambiguous or high-risk requests |

### What “expert correctness” looks like

A novice often aims for “looks right right now.”  
An expert aims for:

- correct content
- correct location
- correct style
- preserved numbering
- preserved fields/references
- preserved review state
- no collateral damage in later sections
- safe handling of ambiguity

That is exactly the standard the agent should be graded against.

### Recommended human-baseline expectations by level

#### Beginner baseline tasks
- replace one sentence
- add a comment
- insert a paragraph between two paragraphs
- create a simple bulleted list
- fix a typo without changing meaning

#### Intermediate baseline tasks
- apply the correct heading style
- insert a table matching nearby formatting
- change a section header/footer without disturbing others
- add an image and caption in a simple report
- clean up a short style inconsistency

#### Advanced baseline tasks
- insert a new subsection at the right hierarchy level
- repair a broken TOC
- add figure/table references and update labels
- preserve tracked changes while editing
- fix multilevel numbering without manual renumbering

#### Expert baseline tasks
- repair a broken thesis chapter with front matter/body pagination intact
- merge content into a grant section without violating page-limited structure
- insert a legal clause without unintended renumbering or defined-term drift
- recover from deleted section breaks or stale field graphs
- make coordinated edits across a long document while preserving all dependencies

---

## 3) Five document archetypes to benchmark

## 3.1 PhD thesis / dissertation

**Why it matters**  
This is the canonical long-document stress test: front matter, body, appendices, page-number scheme changes, chapter hierarchy, figures/tables, lists of figures/tables, and institution-specific formatting constraints.

**Typical structure**
- title page
- abstract
- acknowledgements / dedication / funding / nomenclature
- table of contents
- list of figures
- list of tables
- chapters
- references / bibliography
- appendices

**Likely Word features**
- multiple sections
- Roman front matter + Arabic body numbering
- heading styles
- captions and cross-references
- table of contents / list of figures / list of tables
- footnotes or endnotes
- equations
- landscape pages
- appendix numbering

**Common agent failures**
- wrong heading level when inserting a section
- front matter/body pagination damage
- stale TOC/LOF/LOT after edits
- caption or reference mismatch after moving/inserting figures
- inconsistent chapter or appendix numbering
- style drift from pasted content
- landscape-page header/footer breakage

**Easy vs difficult within this archetype**
- **Easy thesis task**: rewrite one paragraph in a chapter body.
- **Hard thesis task**: move a section with figures and preserve chapter-number captions, cross-references, LOF/LOT integrity, and section numbering.
- **Expert thesis task**: repair a manuscript already containing mixed styles, broken section breaks, and stale field results.

**Especially risky edits**
- anything touching section breaks
- chapter title/heading changes
- figure/table insertion or movement
- appendix insertion
- page numbering changes
- landscape pages

**High-quality agent performance**
- edits are structurally correct, not just visually similar
- TOC, captions, references, LOF/LOT, and page numbering still work after update
- no damage outside the intended chapter or section

---

## 3.2 Scientific paper or review article

**Why it matters**  
This is a dense semantic-editing environment with tighter journal-style structure and heavy sensitivity to citations, figure/table references, and local precision.

**Typical structure**
- title page
- abstract
- keywords
- introduction
- methods / results / discussion (or review-specific thematic sections)
- acknowledgements
- references
- appendices / supplementary note references

**Likely Word features**
- journal template styles
- references and bibliography
- tables and figures with captions
- equations
- reviewer comments / tracked changes
- short but semantically dense sections

**Common agent failures**
- paraphrasing beyond intended scientific meaning
- citation drift or mismatch between text and reference intent
- changing figure/table numbering without fixing in-text references
- abstract/body inconsistency
- template style drift after inserting new sections or tables

**Easy vs difficult**
- **Easy**: improve clarity in one paragraph while preserving meaning.
- **Hard**: insert a new results subsection with a table and correct references.
- **Expert**: do a citation-safe rewrite plus figure/table integration under tracked changes.

**Especially risky edits**
- conclusion and abstract updates after body edits
- figure/table insertion
- citation-bearing sentences
- equation-adjacent rewrites

**High-quality agent performance**
- preserves scientific meaning
- keeps figure/table/citation references coherent
- matches surrounding manuscript template and section structure

---

## 3.3 NIH or NSF grant writing and editing

**Why it matters**  
Grant documents are short relative to theses, but they are **high-stakes, page-limited, section-bound, and compliance-heavy**. The hardest failures are often scope failures: editing the wrong attachment, adding prohibited fluff, or pushing text beyond a constrained boundary.

**Typical structure**
- cover or assembly documents
- specific aims / project summary
- research strategy / project description
- biosketches
- facilities/resources
- data management plan
- mentoring / broader impacts / supplementary documents depending on sponsor

**Likely Word features**
- strict headings
- page-limited attachments
- repeated investigator/project metadata
- tables for timelines or milestones
- biosketch formatting
- institutional templates with controlled headings and margins

**Common agent failures**
- editing outside the requested section
- violating section boundaries
- producing page-bloating rewrites
- inconsistent PI/project title text across documents
- formatting drift that breaks template compliance
- introducing unsupported elements or unnecessary links

**Easy vs difficult**
- **Easy**: tighten one paragraph in Specific Aims.
- **Hard**: revise only one subsection of Research Strategy while preserving all sponsor headings and staying length-neutral.
- **Expert**: coordinate edits across Specific Aims, Research Strategy, and biosketch consistency without changing the wrong attachment.

**Especially risky edits**
- global find/replace
- heading changes
- page-limit compression
- copying text between attachments
- edits to biosketch sections or NSF summary headings

**High-quality agent performance**
- edits only allowed regions
- preserves sponsor-required section architecture
- improves clarity without growing length or adding compliance risk

---

## 3.4 Complex company report / internal report / technical report

**Why it matters**  
This archetype combines real office-document operations: executive summary revisions, table/chart updates, branded formatting, appendices, accessibility requirements, and medium-to-long report structure.

**Typical structure**
- cover/title page
- executive summary
- table of contents
- body sections
- tables/figures/charts
- conclusions / recommendations
- appendices

**Likely Word features**
- styles and front matter
- corporate or institutional templates
- headers/footers with branding
- many tables and figures
- inline and sometimes floating graphics
- appendices
- accessibility-sensitive formatting

**Common agent failures**
- executive summary drifting out of sync with body edits
- table/chart style mismatch
- broken headers/footers or branded elements
- figures inserted with incorrect wrapping
- bad appendix handling
- cosmetic cleanup that damages accessibility or consistency

**Easy vs difficult**
- **Easy**: revise one executive-summary paragraph.
- **Hard**: add a table and update the TOC and section references.
- **Expert**: repair a report with pasted formatting drift, chart/table inconsistency, and appendix numbering problems.

**Especially risky edits**
- chart/table insertion
- header/footer updates
- template normalization
- appendix moves
- executive-summary/body synchronization

**High-quality agent performance**
- maintains brand/template fidelity
- keeps objects and tables readable and consistently styled
- preserves front matter and appendix structure
- updates summary text to stay aligned with the body

---

## 3.5 Legal document

**Why it matters**  
Legal documents punish scope errors harder than almost any other archetype. Clause numbering, defined terms, cross-references, redlines, and local formatting rules make “small” mistakes dangerous.

**Recommended legal tracks**
1. **Contract-style documents**: clauses, subclauses, defined terms, schedules/exhibits.
2. **Pleading / filing-style documents**: captions, numbered allegations, court-formatting constraints.

**Typical structure**
- title / caption / cover / parties
- numbered clauses or allegations
- defined terms section
- schedules / exhibits / annexes
- signatures / certificates / service pages (depending on type)

**Likely Word features**
- deep multilevel numbering
- strict heading schemes
- defined-term consistency
- cross-references to sections/schedules
- tracked changes / compare documents
- table of contents and sometimes table of authorities

**Common agent failures**
- renumbering the wrong clauses
- altering defined terms inconsistently
- changing obligation or scope while “editing for clarity”
- editing outside approved clauses
- corrupting redlines
- breaking internal cross-references

**Easy vs difficult**
- **Easy**: add a comment on one clause.
- **Hard**: insert a new clause between existing clauses while preserving numbering and references.
- **Expert**: apply a negotiated change under tracked changes in a contract with schedules and defined terms, without unintended collateral edits.

**Especially risky edits**
- clause insertion/deletion
- global term replacement
- heading renumbering
- compare/merge cleanup
- edits under “only modify approved redlines” instructions

**High-quality agent performance**
- touches only intended clauses
- preserves numbering tree and cross-references
- keeps defined terms consistent
- preserves review state and legal meaning

---

## 4) Recommended sample documents

### Worth testing against first

These are the highest-value public seeds for a first serious benchmark build.

| Priority | Document | Exact link | File type | Why it is useful | Primary stressors |
|---|---|---|---|---|---|
| **Worth testing against** | Baylor dissertation/thesis template | `https://baylor.app.box.com/s/f8gv0zwm2mc09k5r0ghyfz05fy6dtdil` | Box-hosted Word template/share | Institution-specific thesis model with long-document structure | structure-heavy, formatting-heavy, semantically heavy |
| **Worth testing against** | Texas A&M basic thesis/dissertation template | `https://grad.tamu.edu/getattachment/39b9903c-57a4-4fb6-8567-f4f22bd4bf4c/Basic-Template-20260317.docx?lang=en-US` | DOCX | Clean thesis seed with page numbering, heading styles, and accessibility-aware formatting | structure-heavy, formatting-heavy |
| **Worth testing against** | Purdue NIH New R01 Application Template | `https://www.purdue.edu/research/oevprp/funding-and-grant-writing/funding/docs/NIH%20New%20R01%20Application%20Template.docx` | DOCX | Sponsor-structured grant section template | structure-heavy, compliance-heavy |
| **Worth testing against** | NIH non-fellowship biosketch sample | `https://grants.nih.gov/grants/forms/non-fellowship-biosketch-sample-2021.docx` | DOCX | Real NIH sample with formatting and consistency requirements | formatting-heavy, semantically heavy |
| **Worth testing against** | TAMU Generic report template | `https://tti.tamu.edu/documents/editing/Generic-report-template.docx` | DOCX | Good technical/internal report seed with front matter and styles | structure-heavy, formatting-heavy |
| **Worth testing against** | FRA Technical Report Template page | `https://railroads.dot.gov/elibrary/technical-report-template-2022` | HTML download page for DOCX | Strong for technical-report formatting and object/table accessibility rules | layout-heavy, formatting-heavy, structure-heavy |
| **Worth testing against** | UK Model Services Contract | `https://assets.publishing.service.gov.uk/media/68af256b969253904d1558e5/MSC_-_Core_Terms_-_E_W_-_Word_v2.2A_2025.DOCX` | DOCX | Excellent contract-style legal seed with clauses and definitions | structure-heavy, semantically heavy, review-heavy |
| **Worth testing against** | US Courts Complaint for a Civil Case | `https://www.uscourts.gov/sites/default/files/complaint_for_a_civil_case.docx` | DOCX | Good pleading-style legal seed with numbered allegations and court-form structure | structure-heavy, semantically heavy |
| **Worth testing against** | Sample tracked changes document | `https://jewelsee.com.au/editing/resources/Sample-MS-Word-Track-Changes.docx` | DOCX | Simple public seed for comments/review-mode tests | review-heavy |

### Additional strong seeds

| Category | Document | Exact link | File type | Why it is useful | Primary stressors |
|---|---|---|---|---|---|
| Thesis/dissertation | Texas A&M sample manuscript | `https://grad.tamu.edu/getattachment/d06d3ed9-2f6b-4d39-9bce-dda2bee03f3d/Sample-Manuscript.pdf?lang=en-US` | PDF | Not DOCX, but excellent for verifying the final target appearance of thesis formatting | structure-heavy, layout-heavy |
| Grant | Purdue NIH R01 Application Template | `https://www.purdue.edu/research/oevprp/funding-and-grant-writing/funding/docs/NIH-R01-Application-Template.docx` | DOCX | Additional NIH R01 structure seed | structure-heavy, compliance-heavy |
| Grant | WSU NSF Project Summary Template | `https://orap.wsu.edu/documents/2024/12/nsf-project-summary-template.docx` | DOCX | Good NSF one-page summary seed with required headings | structure-heavy, compliance-heavy |
| Grant | WSU NSF Project Description Template | `https://orap.wsu.edu/documents/2024/12/nsf-project-description-template.docx/` | DOCX | Good NSF project-description seed | structure-heavy, compliance-heavy |
| Grant / outline | UNL NSF Proposal Outline | `https://research.unl.edu/proposaldevelopment/wp-content/uploads/sites/6/2017/02/NSF-Proposal-Outline-PAPPG-17-1.docx` | DOCX | Useful scaffold for proposal-assembly tests | structure-heavy |
| Scientific paper | Elsevier Research Article template and guidance | `https://legacyfileshare.elsevier.com/promis_misc/Research%20Article%20template%20and%20guidance.docx` | DOCX | Strong manuscript template for IMRAD-style editing | structure-heavy, semantically heavy |
| Scientific review | Elsevier MethodsX Review Template | `https://legacyfileshare.elsevier.com/promis_misc/MethodsX-Review-Template.docx` | DOCX | Good review-article-specific structure seed | structure-heavy, semantically heavy |
| Scientific review | Elsevier Review Article | `https://www.elsevier.com/__data/promis_misc/Review%20Article.docx` | DOCX | Another review-style starting point | semantically heavy, structure-heavy |
| Technical report | Penn State Final Design Report template | `https://writing.engr.psu.edu/samples/Template_Final_Design_Report_2018.docx` | DOCX | Good engineering report seed with formal sectioning | structure-heavy, formatting-heavy |
| Technical report | UIC SE Project Report template | `https://www.cs.uic.edu/~jbell/CourseNotes/OO_SoftwareEngineering/SE_Project_Report_Template.docx` | DOCX | Good medium-complexity technical report seed | structure-heavy |
| Legal contract | UK Short Form Contract | `https://assets.publishing.service.gov.uk/media/68aedca0969253904d155891/Short_Form_Contract_-_Word_v1.5A_2025__1_.docx` | DOCX | Smaller contract seed for clause-insertion and numbering tests | structure-heavy, semantically heavy |

### Gaps you should acknowledge explicitly

Some categories are hard to source as strong public `.docx` seeds:

1. **Real multi-author enterprise docs with messy history**  
   Public docs are usually cleaner than real company documents. You should synthesize review artifacts, copy/paste drift, and stale fields on top of public templates.

2. **Full real funded grant packages as editable Word bundles**  
   Public samples often expose isolated sections or templates rather than whole live proposal sets. Use public NIH/NSF templates plus synthetic assembly docs.

3. **Publisher-authentic scientific manuscripts with dense Word cross-reference behavior**  
   Public journal templates are good seeds, but many real scientific-editing failures only appear after you add figures, citations, tracked changes, and revision cycles.

4. **Heavily negotiated legal redlines**  
   Public legal `.docx` files exist, but truly realistic negotiation histories are scarcer. Add synthetic tracked changes and compare/merge artifacts to contract seeds.

---

## 5) Phased benchmark design

The benchmark should progress from safe understanding to destructive-potential operations.

| Phase | Purpose | Representative tasks | Agent must prove | Common failures | Passable / Strong / Excellent | Best archetypes |
|---|---|---|---|---|---|---|
| **Phase 0 – Read-only inspection** | Can the agent correctly read document structure before editing? | identify heading tree, current section, comments, figures, field-dependent areas | accurate structural awareness | wrong section map, misses hidden dependencies | Passable: mostly correct map; Strong: catches most dependencies; Excellent: flags risk areas proactively | all |
| **Phase 1 – Atomic safe edits** | Can it make tiny local edits without collateral damage? | typo fix, sentence replacement, add comment, insert sentence at anchor | precise localization | wrong-location edits, nearby formatting drift | Passable: local edit correct; Strong: no drift; Excellent: also preserves review state when present | all |
| **Phase 2 – Local rewrites and annotations** | Can it improve text while preserving meaning and local format? | rewrite paragraph, shorten grant paragraph, add reviewer note | semantic preservation + local fidelity | meaning drift, citation/footnote damage | Passable: usable rewrite; Strong: preserves structure; Excellent: preserves citations/notes and style exactly | paper, grant, report, legal |
| **Phase 3 – Anchored structured insertions** | Can it insert new content in the correct hierarchy? | new subsection, table, caption, appendix note | correct placement and style inheritance | wrong heading level, caption mismatch, numbering drift | Passable: right location; Strong: right style; Excellent: all downstream references still valid | thesis, paper, report, legal |
| **Phase 4 – Style and formatting manipulation** | Can it reason about Word-native formatting rather than manual appearance? | normalize headings, fix numbering, header/footer edit, table style matching | style-aware editing | direct-formatting hacks, list corruption, linked-header damage | Passable: visible fix; Strong: structural fix; Excellent: no hidden section or numbering damage | thesis, report, legal |
| **Phase 5 – Section-aware and cross-section edits** | Can it navigate and edit across sections safely? | move section, change pagination scheme, merge subsections | maintain section logic and cross-doc consistency | broken page numbering, wrong header/footer carryover | Passable: mostly right; Strong: sections intact; Excellent: fields and numbering remain coherent after update | thesis, report, legal, grant |
| **Phase 6 – Long-document maintenance** | Can it perform recurring “document engineer” tasks? | update TOC/LOF/LOT, harmonize terms, repair references, template cleanup | maintenance and consistency across document | stale fields, global inconsistency, hidden omissions | Passable: maintenance mostly works; Strong: low collateral damage; Excellent: catches latent problems too | thesis, report, paper |
| **Phase 7 – Advanced Word-native operations** | Can it do the tasks that defeat normal copilots? | field-aware edits, appendix numbering, front matter/body pagination, citation-safe and footnote-safe edits, legal clause insertion | Word-native correctness under dependency | broken fields, clause renumbering, note/citation corruption | Passable: one advanced task works; Strong: several classes work; Excellent: robust across document types | thesis, grant, legal, paper |
| **Phase 8 – Adversarial / recovery / regression / safety** | Can it recover, self-correct, and behave safely under ambiguity? | repair bad edits, operate in tracked changes, edit only approved regions, recover from structure damage | resilience, safety, recovery | confident wrong edits, touching protected content, failure to ask/stop on ambiguity | Passable: recovers some; Strong: catches dangerous ambiguity; Excellent: zero dangerous failures and reliable self-correction | all, especially legal/grant/thesis |

### Recommended benchmark rollout

- **Starter suite**: Phases 0–4, across all archetypes.
- **Serious internal gate**: Phases 0–7.
- **Pre-release or model-comparison gate**: Phases 0–8 plus repeated-run stability.

A good target for a first real harness is:

- **60–80 core single-step tests**
- **20–30 adversarial/recovery tests**
- **10–15 multistep session tests**

That gets you into a serious benchmark without becoming impossible to maintain.

---

## 6) Extensive task suite

Below is a concrete starter bank of **48 tasks**. These should be instantiated across multiple seed docs and mutated variants.

### A. Read-only + local edit tasks

| ID | Task | Key checks | Best docs |
|---|---|---|---|
| T01 | Identify heading structure and section map | section count, heading levels, front matter/body split | thesis, report |
| T02 | Explain current section and its formatting dependencies | section-specific headers/footers/page numbering awareness | thesis, legal |
| T03 | Summarize one paragraph without editing | semantic fidelity | all |
| T04 | List all comments and unresolved review items in selected section | comment coverage | review-heavy docs |
| T05 | Identify all figures/tables with captions in current chapter | caption detection | thesis, paper, report |
| T06 | Identify style inconsistencies in a selected range | style awareness | report, thesis |
| T07 | Insert a sentence between two specified sentences | precise anchoring, no formatting drift | all |
| T08 | Insert a paragraph between two paragraphs | correct location and paragraph style | all |
| T09 | Fix a typo in one clause/paragraph only | strict scope control | legal, grant |
| T10 | Add a comment/note to a specific sentence | correct anchor, preserve body text | all |
| T11 | Rewrite one paragraph while preserving meaning | semantic preservation | paper, grant, report |
| T12 | Edit only body text in a paragraph that contains a footnote or citation | note/citation preservation | thesis, paper |

### B. Structured insertion + formatting tasks

| ID | Task | Key checks | Best docs |
|---|---|---|---|
| T13 | Insert a new subsection at the correct heading level | hierarchy correctness, TOC eligibility | thesis, paper, report |
| T14 | Insert a subsection between two existing subsections in correct order | hierarchy and spacing | thesis, report |
| T15 | Add a table matching surrounding style | table style inheritance, spacing | report, paper, grant |
| T16 | Add a figure caption to an existing image | caption format and numbering | thesis, paper, report |
| T17 | Insert an in-text reference to a newly captioned figure/table | reference correctness | thesis, paper |
| T18 | Fix a broken multilevel numbered list | numbering tree, indentation | legal, report |
| T19 | Normalize heading styles in a selected chapter/section | style structure, no content drift | thesis, report |
| T20 | Convert manually formatted headings to proper heading styles | structural recovery | thesis, report, legal |
| T21 | Create or repair a table of contents | TOC field integrity | thesis, report, legal |
| T22 | Modify a header or footer for one section only | section linkage safety | thesis, report |
| T23 | Apply different first-page or odd/even header/footer behavior correctly | header/footer logic | thesis, report, legal |
| T24 | Insert a landscape page for a wide table and keep numbering intact | section break safety, layout | thesis, report |

### C. Cross-section, maintenance, and long-document tasks

| ID | Task | Key checks | Best docs |
|---|---|---|---|
| T25 | Change front matter to Roman numerals and body to Arabic | section-aware pagination | thesis |
| T26 | Insert a new appendix and preserve appendix numbering | appendix structure | thesis, report, legal |
| T27 | Add chapter-numbered figure captions | chapter-heading linkage | thesis |
| T28 | Update or repair List of Figures / List of Tables | caption-field integrity | thesis |
| T29 | Move one subsection to a new location without breaking numbering or references | cross-reference and numbering safety | thesis, legal, report |
| T30 | Merge content from Section A into Section B and preserve local styles | merge safety | report, grant, legal |
| T31 | Harmonize a repeated term/abbreviation across the document with exclusions | global consistency + scoped exclusions | thesis, paper, grant, legal |
| T32 | Insert a new figure/table reference after adding the object | downstream references | thesis, paper, report |
| T33 | Repair stale or broken cross-references after content movement | field/reference repair | thesis, legal, report |
| T34 | Convert messy formatting into template-compliant structure | template normalization | report, thesis, grant |
| T35 | Update executive summary to reflect a changed body section | cross-section semantic consistency | report |
| T36 | Merge externally pasted content into the document while matching local styles and numbering | paste sanitization | report, thesis, legal |

### D. Advanced Word-native and adversarial tasks

| ID | Task | Key checks | Best docs |
|---|---|---|---|
| T37 | Perform a citation-safe rewrite in a scientific paragraph | meaning + citation preservation | paper |
| T38 | Perform a footnote-safe rewrite in a thesis or legal paragraph | note anchor and text safety | thesis, legal |
| T39 | Edit only approved regions in a grant or legal document | scope control, untouched forbidden regions | grant, legal |
| T40 | Preserve comments and tracked changes while making a local edit | review-state integrity | review-heavy docs |
| T41 | Accept or reject changes from one reviewer only in a selected region | selective review handling | review-heavy docs |
| T42 | Compare a bad revised document with an earlier version and repair the meaningful regressions | compare/merge + repair | all |
| T43 | Insert a legal clause without changing unintended numbering | legal numbering/tree preservation | legal contract |
| T44 | Add or revise a grant subsection while staying length-neutral and preserving sponsor headings | compliance-aware editing | NIH/NSF grant |
| T45 | Recover from a deleted or misplaced section break | structural recovery | thesis, report |
| T46 | Handle a figure inside a floating/text-box-like layout without breaking surrounding pages | layout fragility | report, thesis |
| T47 | Respect protected or locked content and work around it safely | protection awareness | grant, legal, form docs |
| T48 | Maintain consistency across a 10-step session with earlier instructions about allowed regions, terms, or formatting conventions | memory and session stability | all |

### Stress variants that should be layered onto the task bank

Every task above should be mutated along several dimensions:

- **anchor ambiguity**: exact sentence anchor vs fuzzy instruction
- **review state**: clean doc vs tracked changes vs comments
- **formatting state**: clean template vs messy pasted content
- **dependency load**: no fields vs many fields
- **scope constraint**: edit whole section vs one paragraph vs approved region only
- **session length**: one-shot vs 5-step vs 10-step task chain
- **layout fragility**: inline objects vs floating/text-box objects
- **damage state**: clean doc vs partially broken doc

That mutation strategy gives you a much richer benchmark than writing hundreds of unrelated prompts.

---

## 7) Failure mode catalog

Use an explicit failure taxonomy. Otherwise you will end up calling radically different errors “just bad output.”

| Failure class | What it is | How it appears | How to detect it | Severity |
|---|---|---|---|---|
| **Semantic failure** | Edit changes meaning incorrectly | wrong claim, obligation, finding, or interpretation | semantic review against source + task | major to critical |
| **Scope failure** | Agent edits outside the requested region | nearby or distant unintended changes | region-constrained diff | critical in legal/grant, major elsewhere |
| **Wrong-location edit** | Correct kind of edit, wrong place | new text inserted under wrong heading/paragraph | anchor validation | major |
| **Omission failure** | Requested change partly missing | one of several requested edits not completed | task checklist | moderate to major |
| **Hallucinated edit failure** | Agent claims to have changed something it did not | response says “done” but doc unchanged or wrong | diff + action log | major |
| **Formatting failure** | Visible formatting mismatch | spacing, font, indentation, style mismatch | style diff + visual diff | cosmetic to major depending on archetype |
| **Style drift** | Agent uses direct formatting instead of structural style | looks okay now but no longer behaves structurally | style inventory, TOC behavior | moderate to major |
| **Structure failure** | Heading/section hierarchy is broken | wrong heading level, broken section boundary | heading tree + section map diff | major to critical |
| **Broken numbering** | Numbering tree is corrupted | clauses/appendices/lists renumber wrongly | numbering inspection + render diff | major to critical |
| **Broken field/ref integrity** | TOC/caption/cross-reference/page numbering becomes stale or broken | wrong reference numbers or missing entries | field inventory + update-field validation | major to critical |
| **Layout regression** | Rendered pages shift badly | object overlap, page break changes, orphaned caption | page render comparison | moderate to critical |
| **Review-mode corruption** | Comments or tracked changes state damaged | lost revisions, accepted/rejected wrong changes | comment/revision inventory | major to critical |
| **Protected-content failure** | Locked/protected text was altered or attempted unsafely | changes in restricted zones or destructive workaround | protection map + diff | critical |
| **Hidden collateral damage** | Unintended nonlocal changes | later header/footer, numbering, references changed | whole-doc structural diff | major to critical |
| **Consistency drift** | Repeated terms or abbreviations become inconsistent | one section updated, another not | consistency checker | moderate to major |
| **Ambiguity failure** | Agent acts on risky ambiguous request without clarifying or containing scope | confident global edit from vague request | prompt-risk heuristic + result review | critical when high-risk |
| **Recovery failure** | Agent cannot detect or repair prior document damage | compounds existing broken structure | before/after structural validation | major |
| **False confidence** | Agent reports success despite a serious error | polished response, broken document | compare response to validator findings | critical in safety-sensitive docs |
| **Glanceably okay but broken** | Looks fine at first glance, structurally broken underneath | TOC stale, refs broken, styles wrong | update-field, style diff, structure diff | major |

### Suggested severity levels

- **S1 cosmetic**: annoying but low-risk; usually caps task score at 4
- **S2 moderate**: task partly succeeds but notable defect; usually caps at 3
- **S3 major**: functionally compromised; caps at 2
- **S4 critical**: dangerous/destructive/unacceptable; task score = 1 and often automatic fail

---

## 8) Rubric and grading system

## 8.1 Per-task 1–5 scale

| Score | Meaning | Typical example |
|---|---|---|
| **5** | Correct edit, correct location, formatting preserved, no collateral damage, Word-native integrity preserved | New subsection inserted at the correct heading level with matching style and intact numbering/cross-references |
| **4** | Mostly correct, minor cosmetic or low-risk issue | Correct edit but one small spacing mismatch or minor table-style mismatch |
| **3** | Functionally useful but with a noticeable mistake | Right content, but style drift, extra blank line, partial numbering mismatch, or incomplete cleanup |
| **2** | Major issue, partially useful at best | Right general intent but wrong section, broken numbering, or substantial formatting damage |
| **1** | Failed or unacceptable | Wrong edit, destructive change, dangerous collateral damage, or false claim of success |

## 8.2 Recommended scoring dimensions

Use dimension scores internally even if you publish only the final 1–5.

| Dimension | Default weight |
|---|---:|
| Semantic correctness | 25% |
| Scope / localization correctness | 20% |
| Structure / Word-native integrity | 20% |
| Formatting / layout fidelity | 15% |
| Completion / coverage | 10% |
| Safety / ambiguity handling | 10% |

### Archetype-specific weighting modifiers

| Archetype | Increase weight on | Reduce weight on |
|---|---|---|
| Thesis / dissertation | structure, field/reference integrity, pagination | minor cosmetics |
| Scientific paper/review | semantic fidelity, citation/figure/table integrity | low-impact cosmetic spacing |
| NIH/NSF grant | scope control, compliance, length neutrality, section-boundary preservation | minor visual issues |
| Company / technical report | formatting/layout fidelity, template consistency, summary-body consistency | tiny wording imperfections |
| Legal document | scope control, numbering integrity, defined-term consistency, review-state safety | cosmetic deviations unless court-required |

## 8.3 Automatic-fail conditions

These should override the average score.

### Always dangerous
- unintended deletion of content outside allowed region
- modification of protected/locked content
- corrupting tracked changes or comments in a review-preservation task
- claiming success when the requested change was not made

### High-severity in specific archetypes
- **Legal**: clause renumbering drift, changed defined-term meaning, edit outside approved clause
- **Grant**: edit outside specified attachment/section, section heading loss, obvious page-bloating in a constrained task
- **Thesis**: broken pagination scheme, damaged section boundaries, broken TOC/LOF/LOT/caption graph after relevant tasks
- **Scientific**: citation/figure/table mismatch that changes scientific interpretation
- **Technical report**: broken table/figure accessibility or severe layout regression in a template-sensitive doc

## 8.4 Phase-specific tolerance

| Phase | Cosmetic tolerance | Structural tolerance | Safety tolerance |
|---|---|---|---|
| Phases 0–2 | Moderate | Low | Very low |
| Phases 3–5 | Low | Very low | Very low |
| Phases 6–8 | Very low | Near zero | Near zero |

Interpretation: once the benchmark reaches structure-sensitive operations, “it mostly worked” is not good enough.

## 8.5 Overall benchmark labels

| Overall result | Suggested standard |
|---|---|
| **Fail** | weighted mean < 3.0 or any critical auto-fail in protected/legal/grant/high-risk tasks |
| **Passable** | weighted mean 3.0–3.7 with no critical failures in high-risk tasks |
| **Strong** | weighted mean 3.8–4.3, very few major failures, good repeated-run consistency |
| **Excellent** | weighted mean 4.4+, zero critical failures, strong recovery/self-correction, high stability across repeats |

---

## 9) Test-to-document matrix

Do **not** run every test on every doc. Use the matrix below.

Legend: **H** = high priority, **M** = useful, **L** = optional / low signal.

| Capability family | Thesis | Scientific paper/review | NIH/NSF grant | Company/technical report | Legal |
|---|---:|---:|---:|---:|---:|
| Heading hierarchy detection | H | H | H | H | H |
| Safe sentence/paragraph edits | H | H | H | H | H |
| Section-aware pagination | H | L | M | M | M |
| TOC creation/repair | H | L | L | H | H |
| LOF/LOT integrity | H | M | L | M | L |
| Caption and cross-reference handling | H | H | L | H | M |
| Citation/bibliography-safe editing | M | H | L | L | L |
| Footnote/endnote-safe editing | H | M | L | L | M |
| Table insertion/style matching | M | H | M | H | M |
| Header/footer isolation | H | L | M | H | M |
| Multilevel numbering repair | M | L | M | M | H |
| Defined-term consistency | L | L | M | L | H |
| Clause insertion without renumbering | L | L | L | L | H |
| Strict approved-region editing | M | M | H | M | H |
| Tracked changes preservation | M | H | H | H | H |
| Compare/merge + repair | M | M | M | M | H |
| Template normalization | H | M | H | H | H |
| Executive summary/body consistency | L | L | L | H | L |
| Grant section-boundary preservation | L | L | H | L | L |
| Appendix insertion/numbering | H | L | L | H | M |
| Floating object / text box handling | M | M | L | H | M |
| Recovery from prior structural damage | H | M | H | H | H |

---
