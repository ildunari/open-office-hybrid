---
name: prompt-architect
description: >
  Write, audit, migrate, and optimize prompts specifically calibrated for Anthropic's
  Claude Opus and Sonnet 4.5/4.6 model family. Use this skill whenever the user wants to
  write a system prompt, CLAUDE.md file, project instruction set, custom instructions,
  or task prompt for Claude. Also use when the user wants to review, audit, fix, or
  migrate an existing prompt — especially when moving from Claude 3.5/Opus 4.1 era
  prompts to current models. Triggers on: "write a prompt," "make a system prompt,"
  "audit my prompt," "fix my CLAUDE.md," "optimize this prompt," "migrate this prompt,"
  "why isn't Claude following my instructions," "prompt engineering," "write instructions
  for Claude," "make Claude do X," "prompt for Opus/Sonnet," "calibrate this prompt,"
  or any task where the deliverable is instructions that an AI model will follow.
  Use this skill even when the user doesn't explicitly say "prompt" — if they're
  describing desired AI behavior and the output is an instruction set, this skill applies.
---

# Prompt Architect

Write and optimize prompts for Claude's 4.5/4.6 model family using the behavioral patterns these models actually respond to — not prompt engineering folklore from earlier generations.

## Three Principles

Everything in this skill flows from three meta-principles that define effective prompting on Claude 4.5/4.6:

**1. Literalism is the default.** These models follow instructions as written, not as intended. They will not infer unstated requirements, add features you didn't ask for, or go "above and beyond" unless explicitly told to. Specify what good looks like. If you want thoroughness, say so. If you want creative latitude, grant it.

**2. Softer language produces better results.** The calibration spectrum has shifted. Aggressive emphasis (CRITICAL, MUST, ALWAYS, NEVER) causes overtriggering on Opus 4.5/4.6 — the model obsessively follows the emphasized instruction at the expense of judgment. Conditional guidance with rationale ("Use X when Y, because Z") consistently outperforms imperative commands across all current models.

**3. Context minimalism outperforms context maximalism.** Frontier thinking models reliably follow approximately 150–200 individual instructions. Beyond this, compliance degrades uniformly — the model doesn't ignore new instructions selectively, it starts ignoring all of them with equal probability. Every unnecessary instruction, document, or emphasis marker dilutes attention on what matters.

## Feedback Loop

**Read `FEEDBACK.md` before every use** to apply lessons from prior runs.

1. **Detect** — After producing or auditing a prompt, note anything that didn't land: calibration was off, user had to heavily rework, a pattern didn't hold, a constraint drifted.
2. **Search** — Check `FEEDBACK.md` for existing entries on the same issue.
3. **Scope** — One actionable observation per entry.
4. **Draft-and-ask** — Propose the entry: "I noticed [issue]. Want me to log this?"
5. **Write-on-approval** — Append with date and category tag.
6. **Compact-at-75** — Merge duplicates, promote patterns to reference files, archive resolved. Reset to ~30 entries.

## Progressive Disclosure: What to Load

Load only what you need. Use this routing table.

| Reference | Load when... |
|---|---|
| `FEEDBACK.md` | **Always** — before every use |
| `references/calibration-guide.md` | Writing or auditing any prompt — intensity calibration is the single highest-leverage skill |
| `references/constraint-patterns.md` | Writing constraints, prohibitions, behavioral boundaries, or formatting rules |
| `references/structural-templates.md` | Building a system prompt, CLAUDE.md, or project instruction set from scratch |
| `references/failure-modes.md` | Diagnosing why a prompt isn't working, or proactively hardening a prompt against known failure patterns |
| `references/thinking-config.md` | Configuring extended thinking, effort parameters, or when the user mentions thinking/reasoning depth |

## Modes

### Mode 1: Create

Write a new prompt from scratch, calibrated for a specific Claude model and use case.

#### Step 1: Gather context

Use `ask_user_input` to clarify scope before writing anything. Gather iteratively — start with the most critical questions, then follow up.

**First round — establish the basics:**
- What type of prompt? (system prompt, CLAUDE.md, project instructions, task prompt, custom instructions)
- What is the target model? (Opus 4.6, Opus 4.5, Sonnet 4.6, Sonnet 4.5, or "whatever Claude is using")
- What is the prompt's purpose? (role definition, tool orchestration, output formatting, behavioral constraints, agentic workflow, general assistant customization)
- Who interacts with the prompted Claude? (end users, developers, automated pipelines, the user themselves)

**Second round — based on answers:**
- What does "good output" look like? Ask for an example or description of ideal behavior.
- Are there hard constraints? (things Claude must never do, safety boundaries, compliance requirements)
- Are there tools Claude should use, and when?
- What's the expected conversation length? (single-turn, short multi-turn, long sessions, multi-context-window agents)
- Any existing prompt to start from or migrate?

**Stop gathering when** you can identify the prompt's structural sections and calibration needs. Two rounds is typical. Don't over-interrogate.

#### Step 2: Design the prompt structure

Before writing the prompt itself, propose the structural outline:

- Which sections the prompt needs (role, context, instructions, constraints, output format, examples)
- What goes in the `system` parameter vs user turn
- Whether XML tags are warranted (yes for complex multi-section prompts, no for simple task prompts)
- Tag names that match the content (descriptive, consistent)
- Estimated instruction count (flag if approaching the 150-instruction ceiling)

Present this outline to the user. Get approval before drafting.

#### Step 3: Draft the prompt

**Load `references/calibration-guide.md` and `references/constraint-patterns.md` before drafting.**

Apply these rules during drafting:

**Calibration rules:**
- Default to "explained conditional" intensity: "Use X when Y, because Z"
- Remove any ALL-CAPS emphasis unless it's a genuine safety-critical hard stop
- Replace imperative commands ("ALWAYS do X") with conditional guidance ("When encountering Y, do X")
- Include rationale for non-obvious rules — Claude generalizes from explanations
- For Opus 4.6: actively remove anti-laziness language ("be thorough," "explore all possibilities")
- For Sonnet 4.5/4.6: provide more explicit structure (checklists, numbered steps) since Sonnet benefits from specificity

**Structural rules:**
- Role definition goes in the `system` parameter — make it domain-specific, not generic
- Long documents placed before instructions, query placed last
- Use XML tags for complex prompts with 3+ behavioral sections
- Define XML tags explicitly at first use rather than relying on Claude to infer meaning
- Keep total instruction count under 150 (count each discrete behavioral directive)

**Constraint rules:**
- Frame constraints positively: "write in flowing prose" not "don't use bullet points"
- For hard prohibitions: pair the prohibition with an approved alternative action
- For safety-critical constraints: use third-person descriptive form ("Claude does not...")
- Include motivation for non-obvious constraints ("avoid ellipses because the TTS engine cannot process them")
- Position constraints that must survive long conversations where they'll get re-injected (system prompt, not early user turns)

**Output specification rules:**
- Specify format with examples, not just descriptions
- State length expectations in sentences/paragraphs, not word counts (LLMs count tokens, not words)
- Use positive format directives ("write in prose paragraphs") over negative ones
- For JSON output: recommend structured outputs or `output_config.format` over prompt instructions

#### Step 4: Self-audit

After drafting, run the prompt through the audit checklist (see Audit mode below). Fix any issues before presenting.

#### Step 5: Present

Deliver the prompt as a markdown file. Include a brief note on:
- Which model(s) it's calibrated for
- Any calibration adjustments to make if switching models
- Key constraints that may need periodic reinforcement in long conversations

---

### Mode 2: Audit

Review an existing prompt and produce a calibrated rewrite.

#### Step 1: Ingest

Read the provided prompt. Identify:
- Target model (stated or inferred)
- Prompt type (system prompt, CLAUDE.md, project instructions, task prompt)
- Total instruction count (approximate)
- Current calibration level (aggressive, balanced, passive)

#### Step 2: Analyze

**Load `references/calibration-guide.md` and `references/failure-modes.md`.**

Run through this checklist. For each item, note pass/concern/fail with specific evidence.

**Structural integrity:**
- Role definition uses the `system` parameter, not buried in user messages
- Role is domain-specific, not generic
- Long documents/context placed before instructions and query
- Sections delimited with XML tags or clear structural markers
- Total instruction count under 150 for the full prompt stack
- No redundant or overlapping instructions

**Calibration for 4.5/4.6:**
- All instances of CRITICAL, MUST, ALWAYS, NEVER reviewed — most should be softened
- Anti-laziness prompting removed (causes overtriggering on Opus 4.5/4.6)
- Tool-triggering language uses conditional form, not imperative
- "Above and beyond" behavior explicitly requested if desired
- No use of "think" in non-thinking contexts if targeting Opus 4.5
- Prefilling removed if targeting Opus 4.6 or Sonnet 4.6 (deprecated)

**Constraint quality:**
- Constraints framed positively with approved alternative actions
- Hard prohibitions include explicit alternative action paths
- Constraints include motivation/rationale
- Safety constraints use third-person descriptive form
- No unresolvable conflicts between constraints

**Output specification:**
- Desired output format specified with examples
- Length expectations stated in sentence/paragraph counts
- Formatting preferences use "do this" rather than "don't do that"

**Extended thinking (if applicable):**
- Thinking mode matches model (adaptive for Opus 4.6, manual budget for others)
- Effort parameter set appropriately
- No manual "think step-by-step" that conflicts with extended thinking
- Thinking instructions are high-level, not prescriptive step-by-step

**Multi-turn resilience (if long conversations expected):**
- Critical constraints positioned to survive context compaction
- Constraint drift mitigation for specific numbers, parameters, formatting rules

**Failure mode hardening:**
- Anti-sycophancy measures if the prompt involves evaluation or feedback
- Literalism guard: "above and beyond" behavior requested if desired
- Format drift prevention: positive format directives, style-matching
- Hallucinated compliance prevention: investigation-before-answering patterns where applicable

#### Step 3: Produce findings

Structure the audit as:

1. **Summary** — What was reviewed, target model, prompt type
2. **Strengths** — What's already well-done (important for credibility)
3. **Issues by severity**
   - **Critical** — Will cause incorrect behavior or systematic failures
   - **Important** — Degrades quality but doesn't break functionality
   - **Minor** — Polish items, nice-to-haves
4. **Rewrite** — The complete corrected prompt, ready for use

#### Step 4: Present

Deliver findings and rewrite. Note any model-specific adjustments.

---

### Mode 3: Migrate

Convert a prompt written for an older Claude model (3.5, Opus 4.1, or earlier) to work optimally on 4.5/4.6.

This is a specialized Audit with a focus on the behavioral shifts between generations:

1. **Identify era markers** — ALL-CAPS emphasis, anti-laziness language, aggressive tool triggers, "think step-by-step" instructions, prefill patterns
2. **Map each marker to its 4.5/4.6 replacement** using `references/calibration-guide.md`
3. **Check for missing explicit instructions** — behaviors the old model inferred that 4.5/4.6 requires stated explicitly
4. **Produce a migration diff** — show what changed and why, then the complete rewritten prompt

---

## Model Behavioral Summary

Quick-reference for calibrating prompts to a specific model. Load `references/calibration-guide.md` for the full intensity spectrum and before/after examples.

| Dimension | Opus 4.6 | Opus 4.5 | Sonnet 4.6 | Sonnet 4.5 |
|---|---|---|---|---|
| Instruction sensitivity | Very high — overtriggers on emphasis | High — overtriggers on tool emphasis | High but balanced | Moderate |
| Thinking mode | Adaptive (effort parameter) | Manual (budget_tokens) | Both adaptive and manual | Manual (budget_tokens) |
| Default effort | high | high | **medium** recommended | N/A |
| Max output | 128K tokens | 64K | 64K | 64K |
| Overengineering tendency | High — unnecessary abstractions, excessive subagents | Moderate — extra files, abstractions | Low | Balanced |
| Ambiguity handling | Infers and proceeds (sometimes too aggressively) | Handles ambiguity exceptionally well | Requests clarification more often | Needs more explicit specification |
| Prefill support | **Deprecated** | Supported | **Deprecated** | Deprecated |
| Prompting strategy | Remove anti-laziness language; use explained conditionals; constrain exploration | Soften emphasis; avoid "think" without thinking enabled | Provide explicit structure; checklists work well | Most forgiving; standard prompting works |
| Framing convention | Third-person descriptive for identity/safety; explained conditionals for behavior | Same as Opus 4.6 | Same as Opus 4.6; benefits from slightly more explicit role framing | Standard "You are..." works fine; less sensitive to framing choice |

**Cross-platform note:** These framing conventions are Claude-specific. OpenAI models (GPT-4o, GPT-4.1, GPT-5) use second-person directive ("You are...") throughout, including for identity and safety. Third-person descriptive form has no special advantage on OpenAI models. See `references/calibration-guide.md` § Grammatical Person and Framing for the full decision framework.

## Prompt Type Quick Reference

| Prompt type | Key considerations | Framing | Primary references to load |
|---|---|---|---|
| **System prompt** (claude.ai, API) | Role in `system` param; XML sections for 3+ domains; long docs first, query last; under 150 instructions total | Role: third-person descriptive ("This assistant is..."); Safety: third-person descriptive; Behavior: explained conditionals | `structural-templates.md`, `calibration-guide.md` |
| **CLAUDE.md** (Claude Code) | 100-200 lines max; WHAT/WHY/HOW structure; progressive disclosure to agent_docs/; ~50 built-in instructions consume budget | Direct conditionals throughout ("Use X when Y, because Z"); third-person descriptive unnecessary (CLAUDE.md is behavioral, not identity) | `structural-templates.md`, `calibration-guide.md` |
| **Project instructions** (claude.ai Projects) | Re-injected every turn (good for constraint durability); complement system prompt, don't duplicate | Explained conditionals for behavior; third-person descriptive for any safety constraints | `constraint-patterns.md`, `calibration-guide.md` |
| **Task prompt** (single-turn or few-turn) | Specify what "good" looks like; include examples; output format explicit; less constraint drift concern | Direct imperatives and conditionals; framing choice matters less in single-turn | `calibration-guide.md`, `constraint-patterns.md` |
| **Agent orchestration** | Ask vs act decision gates; error retry limits; state management for multi-context-window; subagent scoping | Explained conditionals for decision logic; third-person descriptive for safety gates | `failure-modes.md`, `thinking-config.md` |

## Application Guidelines

### Calibrate, don't prescribe

The goal is not to produce prompts that follow a rigid template. It's to internalize the calibration principles well enough to make good judgment calls for each specific use case. A prompt for a safety-critical medical system needs different calibration than a prompt for a creative writing assistant. The principles are constant; the application varies.

### Test, then trust

No prompt is correct until tested against representative inputs on the target model. When delivering a prompt, always recommend the user test it and report back. Prompt engineering on Claude 4.5/4.6 rewards iterative refinement over first-draft perfection.

### When this skill pairs with others

- After writing a CLAUDE.md, the user may want `superpowers-methodology` for the development workflow it supports
- After writing a system prompt with tool descriptions, the user may need `mcp-server-builder` for the tools themselves
- When the user reports a prompt "isn't working," start with this skill's Audit mode before assuming the problem is elsewhere
