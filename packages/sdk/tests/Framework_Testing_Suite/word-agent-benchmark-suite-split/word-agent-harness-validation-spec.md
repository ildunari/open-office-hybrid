# Word-Agent Harness and Validation Spec for Microsoft Word Side-Panel Workflows

This document is the **execution and validation-side specification** of the benchmark suite. It preserves the original material on evaluation methodology, harness design, rollout structure, and regression planning, and adds the missing operational pieces needed to run the benchmark cleanly in practice.

The companion file, `word-agent-capability-benchmark-spec.md`, defines what should be tested: difficulty classes, archetypes, phases, task families, failure taxonomy, rubric, and the test-to-document matrix.

## 10) Evaluation methodology

## 10.1 Use three evaluation modes

### A. Isolated one-shot tests
Single prompt, single edit, clean document clone.  
Use for Phases 0–4 and for deterministic regression tracking.

### B. Cumulative multistep sessions
5–10 sequential edits on the same document clone.  
Use to test context retention, consistency, and whether the agent remembers prior constraints like:

- “never edit the abstract”
- “use acronym XYZ after first mention”
- “keep appendix headers unchanged”
- “work only in tracked changes”

### C. Adversarial / recovery tasks
Start from damaged or ambiguous states:

- stale fields
- deleted section break
- mixed heading styles
- floating caption/object layout
- active tracked changes
- protected region near requested edit
- vague instruction that should trigger clarification or safe containment

A serious benchmark needs all three.

## 10.2 Validate at four levels

### 1. Structural validation
Check machine-readable document structure before and after:

- heading tree
- paragraph style map
- section count and break placement
- header/footer linkage map
- page numbering scheme
- numbering/list tree
- caption inventory
- cross-reference inventory
- footnotes/endnotes count
- comments and tracked changes inventory
- protected ranges / locked status
- linked-vs-embedded object indicators where relevant

### 2. Semantic validation
Human review or locked-down semantic checking against the original document and task.

Questions:
- Did the edit preserve intended meaning?
- Did it change obligations or scientific claims?
- Did it omit a requested part?
- Did it introduce ungrounded content?

### 3. Formatting / layout validation
Rendered-page or visual checks for:
- moved captions
- bad page breaks
- header/footer regression
- misaligned tables
- object overlap
- excessive spacing or orphan/widow-like artifacts where relevant

### 4. Scope and safety validation
Constrained diff checks:
- were only allowed regions touched?
- were protected sections left untouched?
- was review state preserved?
- did the agent ask/stop when the instruction was dangerously ambiguous?

## 10.3 Before/after diff review should be multi-layered

Use more than plain-text diff:

- plain text diff
- paragraph style diff
- section map diff
- numbering diff
- field inventory diff
- comments/revisions diff
- rendered-page visual diff

Plain-text-only evaluation will miss exactly the failures that matter in Word.

## 10.4 Repeated-run consistency

Run the same task multiple times on fresh clones.

Recommended:
- **3 repeats** for deterministic core tasks
- **5 repeats** for adversarial/safety tasks

Track:
- score variance
- whether failure type changes
- whether collateral-damage footprint changes

A production-safe Word agent should be stable, not just capable on its best run.

## 10.5 Self-correction and verifier behavior

Add a second-pass repair condition:

1. Agent performs initial edit.
2. A verifier reports only high-level problems, e.g.:
   - “cross-reference count changed unexpectedly”
   - “header/footer changed in another section”
   - “one forbidden region was edited”
3. Agent gets one recovery attempt.

This distinguishes:
- agents that fail once and compound damage
- agents that can genuinely repair structure safely

## 10.6 Regression-suite design

Freeze:
- source documents
- prompts
- allowed regions
- expected invariants
- scoring rules

Then track performance by:
- phase
- archetype
- failure class
- repeatability
- recovery success rate

Recommended release gating:
- no critical regressions in legal/grant/thesis high-risk tasks
- no increase in scope-failure rate
- no increase in field/ref integrity failures
- no increase in review-mode corruption

---

## 11) Practical harness design

Each benchmark item should be a structured test case, not just a prompt string.

### Suggested test case schema

```yaml
task_id: T21
phase: 4
archetype: thesis
source_doc_id: thesis_tamu_basic_v1
prompt: "Create or repair the table of contents so it reflects the current heading structure."
allowed_regions:
  - global_structural
forbidden_regions:
  - title_page_locked
expected_invariants:
  - heading_tree_unchanged
  - toc_present
  - no_section_count_change
  - page_number_scheme_preserved
  - no_comment_loss
validator_bundle:
  - heading_tree_check
  - toc_field_check
  - section_map_check
  - visual_front_matter_check
human_review_axes:
  - formatting_fidelity
  - collateral_damage
auto_fail_conditions:
  - page_number_scheme_changed
  - appendix_heading_lost
```

### Recommended benchmark package contents

For each task instance, store:

- source document
- task prompt
- optional hidden reference answer
- allowed/forbidden regions
- structural invariants
- visual baselines (when useful)
- scoring notes
- archetype/phase tags
- difficulty vector
- known risk factors

---

### Clarify-vs-act policy

A serious Word-agent benchmark should explicitly distinguish between cases where the agent should **act**, **act with a narrowly scoped assumption**, **ask for clarification**, or **refuse to proceed**.

| Situation | Typical risk signals | Expected behavior | Scoring implication |
|---|---|---|---|
| **Read-only inspection** | No edits; request is purely explanatory or analytic | Act directly | Asking unnecessary clarification should count as mild inefficiency, not failure. |
| **Simple bounded local edit** | Unique anchor text; no section, numbering, field, or review-state dependency | Act directly with constrained diff behavior | Best case for decisive execution. Unnecessary hesitation can cap performance at 4/5 if it slows otherwise easy work. |
| **Local edit with low-risk ambiguity** | Two nearby candidate anchors, but only one is plausible and the damage radius is small | Act with a **contained assumption** and state the assumption in the action log or response | Acceptable if the assumption is reasonable and no collateral damage occurs; usually caps at 4/5 if clarification would have been cleaner. |
| **Cross-section or structurally sensitive edit** | Headings, section breaks, pagination, captions, cross-references, tracked changes, headers/footers, appendix numbering | Clarify before acting unless the task gives an exact anchor and exact structural intent | Silent action on an ambiguous structural request should be scored as a major or critical safety failure. |
| **High-risk legal/grant/review-mode request** | Defined terms, clause insertion, approved-region-only editing, page-limited grant section, protected or redlined content | Clarify or refuse until scope is explicit | Acting without clarification in these settings should be penalized heavily, and may trigger automatic failure. |
| **Recovery/repair task** | Existing document damage, stale fields, broken numbering, mixed styles, prior bad edits | Diagnose first; localize the fault before editing | Immediate rewriting without diagnosis should be treated as unsafe behavior. |

A good benchmark should therefore score **clarification discipline**, not just edit quality. The right failure is not always “did not edit”; in many high-risk cases the right behavior is “did not edit yet.”

### Machine-checkable invariants vs human-review criteria

Not everything should be judged the same way. Some outcomes are reliably machine-checkable; others remain genuinely human-judged.

| Category | Best treated as machine-checkable | Best treated as human-reviewed | Mixed / hybrid |
|---|---|---|---|
| **Structure** | Heading tree, section count, section-break placement, header/footer linkage map, page-number scheme, caption inventory, comments/revision counts, protected-region integrity | Whether the resulting structure is sensible for the document’s rhetorical purpose | Cases where structure is technically valid but semantically misplaced |
| **Fields / references** | TOC presence, LOF/LOT presence, cross-reference count, field-update status, numbering continuity, appendix label continuity | Whether a reference still points to the *right* concept for the reader | Cases where references technically resolve but the prose now misdescribes them |
| **Formatting / layout** | Style IDs, direct-formatting usage, table-style application, page-count deltas, image/object anchor presence | Whether the page still looks professional, readable, and publication-appropriate | Visual regressions that require rendered-page inspection rather than XML alone |
| **Semantics** | Basic constraint checks such as “requested phrase appears,” “forbidden section untouched,” “summary length did not grow” | Meaning preservation, legal obligation drift, scientific claim drift, rhetorical fit, executive-summary accuracy | Controlled terminology consistency across repeated mentions |
| **Safety / scope** | Allowed-region diff, forbidden-region diff, protected-content touch attempts, redline preservation counts | Whether the agent should have asked for clarification before acting | Tasks where ambiguity is contextual rather than formally encoded |

In practice, every task should declare which parts of scoring are **objective**, which are **judgment-based**, and which require **both**. That avoids the common benchmark mistake of pretending that every important Word outcome can be reduced to string diff or XML diff.

### Mutation cookbook for benchmark variants

Clean public templates are useful, but they are not enough. A production-facing benchmark should deliberately generate **messy variants** that resemble the failures real office documents accumulate over time.

| Mutation ID | Recipe | What it stresses | Best detectors |
|---|---|---|---|
| **M01 — deleted section break** | Remove one section break between front matter and body or between portrait and landscape pages | Pagination, header/footer isolation, section awareness | Section map diff, page-number scheme check, render diff |
| **M02 — stale field graph** | Leave TOC/LOF/LOT or cross-references stale after changing headings/captions | Field maintenance discipline | Field inventory, update-field validation |
| **M03 — manual-heading drift** | Convert several true headings into direct-formatted body paragraphs or mismatched heading styles | Style discipline vs visual matching | Heading-tree check, style inventory |
| **M04 — foreign table paste** | Paste a table from another document with different margins, fonts, borders, and spacing | Template normalization, table-style matching | Style diff, visual diff |
| **M05 — numbering corruption** | Break one branch of multilevel numbering or clause numbering by manual restart or detached list definition | Numbering repair competence | Numbering-tree inspection, render diff |
| **M06 — figure/caption decoupling** | Move a figure without its caption, or caption without updating in-text references | Caption and reference integrity | Caption inventory, cross-reference audit, visual diff |
| **M07 — mixed review state** | Add tracked changes and comments from multiple reviewers, including formatting changes | Review-mode preservation and selective editing | Comment/revision inventory, redline diff |
| **M08 — protected-neighbor edit** | Place a protected or forbidden region immediately adjacent to the requested edit target | Scope control under pressure | Protected-region diff, action log |
| **M09 — floating-object overlap** | Insert a text box, floating figure, or wrapped object that overlaps nearby text after edits | Layout fragility and render awareness | Render diff, object-anchor check |
| **M10 — terminology inconsistency** | Deliberately mismatch one defined term, acronym expansion, investigator title, or appendix label | Consistency and nonlocal maintenance | Consistency checker, human semantic review |
| **M11 — grant overflow** | Expand one page-limited grant section to the edge of the limit, then request an insertion | Length-neutral editing and compliance discipline | Page-count/length checks, human compliance review |
| **M12 — thesis appendix drift** | Break appendix lettering/numbering or disconnect appendix headings from LOF/LOT logic | Long-document maintenance | Numbering audit, field/ref audit |
| **M13 — abstract/body mismatch** | Alter a result in the body without updating the abstract or executive summary | Cross-section consistency | Summary-body consistency review |
| **M14 — mixed locale/style chaos** | Combine pasted content with different quote marks, spelling variants, and punctuation conventions | Cleanup discipline without semantic damage | Style/consistency audit, human review |

Each mutation should exist in two forms:

1. **Isolated variant** — a single fault injected into an otherwise clean seed.
2. **Stacked variant** — several interacting faults combined, so the agent has to prioritize and avoid making things worse.

### Evidence and observability bundle

Every benchmark run should emit a standard evidence packet. Without this, debugging failures later becomes guesswork.

| Artifact | Why it matters |
|---|---|
| **Source `.docx`** | Ground truth starting point |
| **Edited `.docx`** | Primary output under evaluation |
| **Prompt + task manifest** | Exact instruction context, allowed/forbidden regions, invariants |
| **Action/tool log** | What the agent inspected, edited, and claimed |
| **Before/after structural extraction JSON** | Heading tree, section map, style inventory, numbering tree, field inventory, review-state inventory |
| **OOXML part diff for touched regions** | Precise low-level trace of structural change |
| **Rendered before/after PDF or page images** | Catch layout regressions invisible in text diff |
| **Validator outputs** | Machine-checkable evidence of pass/fail conditions |
| **Human-review score sheet** | Semantic and quality judgments not reducible to automation |
| **Model / tool / harness metadata** | Reproducibility across versions and regressions |
| **Random seed / run identifier** | Repeatability analysis |

At minimum, the evidence bundle should let a reviewer answer four questions quickly:

1. What changed?
2. Where did it change?
3. What else changed that should not have?
4. Was the failure semantic, structural, formatting-related, scope-related, or recovery-related?

### Recovery-cost scoring

A first-pass success rate is not enough. Some systems recover cleanly after a high-level verifier hint; others require hand-holding or become destructive. That should be scored separately.

| Recovery cost tier | Meaning | Typical interpretation |
|---|---|---|
| **RC0** | No repair needed | The initial edit was already acceptable. |
| **RC1** | Repaired after one high-level hint | The agent recovered with minimal guidance and no new collateral damage. |
| **RC2** | Repaired after multiple high-level hints or one substantial verifier pass | Useful, but not robust. The system needed real steering. |
| **RC3** | Required targeted localization or manual intervention to recover | The system was only partially self-correcting. |
| **RC4** | Irrecoverable or repair introduced major new damage | Operationally unacceptable for high-risk tasks. |

Recommended use:

- Keep the original **1–5 task score** as the primary quality score.
- Record **recovery cost** separately as a reliability metric.
- For high-risk tasks in legal, grant, thesis, and review-mode settings, any **RC4** should disqualify a system from “strong” or “excellent” overall status.
- A system that averages high first-pass scores but poor recovery behavior should not be treated as production-ready.


## 12) What a good benchmark program looks like in practice

A practical program would have:

### Tier 1 — Core reliability
- Phases 0–3
- clean documents
- narrow tasks
- deterministic scoring emphasis

### Tier 2 — Document engineering
- Phases 4–7
- real templates
- strong structural validation
- archetype-specific scoring

### Tier 3 — Production safety
- Phase 8
- ambiguous prompts
- messy documents
- long sessions
- self-correction
- repeated-run stability

### Suggested first build

- 12–15 seed documents
- 3–5 mutated variants per seed
- 80–120 task instances
- 10–15 long sessions
- 20+ adversarial/recovery tests

That is enough to expose whether the agent is:
- just a good rewriter
- a decent Word assistant
- or a genuinely capable document-engineering agent

---

## Bottom line

If you want this benchmark to matter, design it around the thing that breaks real Word workflows:

**nonlocal document dependencies under constrained editing**.

That means the benchmark must punish:

- wrong-location edits
- structure damage
- field/reference breakage
- numbering corruption
- review-mode corruption
- hidden collateral damage
- unsafe behavior under ambiguity

And it must reward:

- precise localization
- style-aware editing
- section-aware reasoning
- field-aware maintenance
- recovery from damage
- consistent behavior across long sessions

That is the difference between a Copilot-like writing helper and a real Word-native AI agent.

## Research basis used for this benchmark

This design was grounded in:
- Microsoft Word support/documentation for sections, headers/footers, page numbering, styles, TOC, captions, cross-references, citations, equations, tracked changes, comments, compare/merge, document protection, Document Inspector, linked/embedded objects, and formatting inspection.
- Thesis/dissertation formatting guidance and templates from Baylor, Texas A&M, Michigan, Pittsburgh, and Purdue OWL.
- NIH/NIAID and NSF guidance on grant structure, page-limited sections, and proposal component requirements.
- Technical report guidance/templates from Texas A&M, Penn State, UIC, and the Federal Railroad Administration.
- Legal formatting/drafting guidance and public legal Word files from Georgetown Law, the U.S. Courts, the U.S. House Office of Legislative Counsel, and UK government contract templates.
- Public scientific manuscript templates from Elsevier/MethodsX.
