---
name: gpt-prompt-architect
description: >
  Write, audit, and optimize prompts for OpenAI's GPT model family across Codex CLI
  and ChatGPT surfaces. Covers: AGENTS.md files for Codex (architecture, merge order,
  compaction-aware design, skills), ChatGPT Custom Instructions (1,500-char optimization),
  and Custom GPT system prompts (knowledge file integration, tool toggling, 8K-char limits).
  Triggers on: "write an AGENTS.md," "Codex instructions," "Custom GPT prompt,"
  "ChatGPT custom instructions," "GPT system prompt," "optimize my GPT," "why isn't
  my GPT following instructions," "Codex skill," "write a skill for Codex," "AGENTS.md,"
  "Custom GPT builder," "GPT prompt," or any task producing instructions that a GPT model
  will follow in Codex or ChatGPT contexts. Does NOT cover API system prompts, Responses
  API architecture, Structured Outputs, or tool/function description engineering — those
  are API-surface concerns outside this skill's scope.
---

# GPT Prompt Architect

Write and optimize prompts for OpenAI's GPT models on two surfaces: **Codex CLI** (AGENTS.md, skills, compaction-aware design) and **ChatGPT** (Custom Instructions, Custom GPTs). Built from verified OpenAI documentation, practitioner reports, and empirical testing — not prompt engineering folklore.

## Three Principles

Everything flows from three meta-principles that define effective GPT-5.x prompting:

**1. Prompting inversion.** Simpler prompts outperform complex ones on GPT-5.x. Models with stronger native reasoning are *harmed* by over-constraining — personality padding ("You are a world-class expert"), micro-step instructions, and redundant emphasis are treated as noise. Give goals, not recipes. The model behaves like a senior coworker: tell it what you need done, not how to do each step.

**2. Context over phrasing.** On GPT-5.x, *what* context you include matters more than *how* you phrase instructions. Choosing the right documents, examples, and constraints to include (and actively excluding irrelevant ones) has more impact than wordsmithing. Token budget management, compaction awareness, and strategic context selection are prompt engineering decisions.

**3. Scope discipline.** GPT-5.2+ will build more structure than you asked for unless explicitly constrained. "ONLY what was requested" is a necessary constraint, not a nice-to-have. Without explicit scope boundaries, expect the model to add abstractions, files, tests, documentation, and architectural decisions you didn't ask for — especially in Codex sessions.

## Feedback Loop

**Read `FEEDBACK.md` before every use** to apply lessons from prior runs.

1. **Detect** — After producing or auditing a prompt, note anything that didn't land.
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
| `references/agents-architecture.md` | Writing or auditing AGENTS.md, Codex skills, compaction-aware design, or any Codex CLI prompt work |
| `references/chatgpt-patterns.md` | Writing or auditing ChatGPT Custom Instructions or Custom GPT system prompts |
| `references/failure-modes.md` | Diagnosing why a GPT prompt isn't working, or proactively hardening against known failures |

## Surface Detection

Before writing anything, identify which surface the user is targeting. The same content needs different treatment on each surface.

| Surface | Key constraints | Primary pattern |
|---|---|---|
| **Codex AGENTS.md** | 32 KiB combined cap (configurable); markdown only; merge order matters; survives compaction | Layered files: global → project root → working directory. Invariants in AGENTS.md, procedures in skills, dynamic state in repo files |
| **Codex Skills** | YAML frontmatter required (name, description); progressive disclosure (metadata loaded first, full SKILL.md on invocation); `.agents/skills/` or `~/.codex/skills/` | Folder with SKILL.md + optional scripts/ and references/. Description quality determines implicit triggering |
| **ChatGPT Custom Instructions** | 1,500 chars per field × 2 fields = 3,000 chars total; applies to all conversations; syncs across devices | Dense, prioritized instructions. Evergreen guidance only — dynamic facts belong in Memory |
| **Custom GPTs** | ~8,000 char instruction limit; knowledge files (chunked RAG, non-deterministic retrieval); tool toggles (Browse, Code Interpreter, DALL-E) | Instructions in the builder + explicit tool-invocation directives. Knowledge files for reference material with reliability caveats |

## Modes

### Mode 1: Create

Write a new prompt from scratch for a specific GPT surface.

#### Step 1: Gather context

Use `ask_user_input` to clarify scope before writing. Gather iteratively.

**First round — establish the basics:**
- Which surface? (Codex AGENTS.md, Codex skill, ChatGPT Custom Instructions, Custom GPT)
- What is the prompt's purpose? (project norms, coding workflow, tool orchestration, personality/style, domain specialization)
- Who or what interacts with the prompted model? (the user in ChatGPT, Codex CLI agent, Custom GPT end users, automated pipeline)

**Second round — surface-specific:**

*For Codex AGENTS.md:*
- Monorepo, multi-service, or single project?
- Any existing AGENTS.md to start from?
- What tools/languages/frameworks does the project use?
- Are there team norms that should survive compaction? (testing requirements, review policies, deployment gates)

*For Codex skills:*
- What task does the skill automate?
- Should it trigger implicitly (via description matching) or only explicitly (`$skill-name`)?
- Does it need scripts, or is it instruction-only?

*For ChatGPT Custom Instructions:*
- What does the user want ChatGPT to always do/know? (profession, communication preferences, output format defaults)
- What should ChatGPT never do? (verbosity, emojis, hedging, specific behaviors)
- Any domain-specific knowledge to embed?

*For Custom GPTs:*
- What's the GPT's purpose and audience?
- Will it use knowledge files? Which tools should be enabled?
- Are there actions (external API calls) involved?

**Stop gathering when** you can identify the sections needed and the character/token budget. Two rounds is typical.

#### Step 2: Design the structure

**Load the relevant reference file** before designing.

Propose the structural outline to the user:
- Which sections the prompt needs
- How content maps to the surface's constraints (character limits, merge order, file boundaries)
- Estimated size vs available budget
- For AGENTS.md: which instructions go at which directory level
- For Custom GPTs: what goes in instructions vs knowledge files vs conversation starters

Get approval before drafting.

#### Step 3: Draft the prompt

Apply the CTCO pattern as the default structural template for GPT-5.x:

```
Context — Who/what is the model, what project/domain context does it need
Task — What it should accomplish (goals, not micro-steps)
Constraints — Boundaries, prohibitions, scope limits
Output — Expected format, length, style of responses
```

**Calibration rules for GPT-5.x:**
- Remove personality padding ("You are a world-class expert," "You are meticulous and thorough"). Replace with functional context: what the model should *do*, not what it should *pretend to be*.
- Remove micro-step instructions for tasks within the model's native capability. "Review this PR for bugs and security issues" beats a 20-step review checklist.
- Add explicit scope boundaries: "Only modify files in src/. Do not create new directories. Do not add dependencies without asking."
- Add explicit done-conditions for agentic contexts: "Stop after implementing the requested change. Do not refactor adjacent code, add tests for unrelated modules, or update documentation unless asked."
- For Codex: add compaction-awareness directives. Critical state belongs in files (WORKLOG.md, TODO.md, DECISIONS.md), not conversation memory.

**Constraint rules:**
- State constraints as specific boundaries, not vague guidance. "Maximum 3 files per change" not "keep changes small."
- When constraints might conflict, state the priority order explicitly. "If test coverage and delivery speed conflict, prioritize test coverage."
- For Custom GPTs: keep critical constraints in the first 2,000 characters of instructions — the model's attention to later instructions degrades with length.

#### Step 4: Review and deliver

Before delivering, verify:
- [ ] No personality padding or micro-step instructions for native capabilities
- [ ] Explicit scope boundaries present
- [ ] Fits within the surface's size constraints
- [ ] For AGENTS.md: instructions at the right directory level (global vs project vs local)
- [ ] For AGENTS.md: critical instructions survive compaction (externalized to files, not just conversation)
- [ ] For Custom Instructions: within 1,500 chars per field
- [ ] For Custom GPTs: critical instructions in the first 2,000 chars; knowledge file integration explicitly instructed if used
- [ ] Done-conditions present for agentic contexts
- [ ] No contradictory constraints

Deliver the complete prompt, ready for use. Note any surface-specific deployment instructions.

---

### Mode 2: Audit

Review an existing GPT prompt and identify issues.

#### Step 1: Identify the surface and model

Determine which surface the prompt targets and which GPT model it's designed for. If unclear, ask.

#### Step 2: Run the audit checklist

**Load `references/failure-modes.md` alongside the relevant surface reference.**

**Structural integrity:**
- Prompt follows CTCO pattern or has clear section organization
- Content is appropriate for the surface (not API patterns in a Custom GPT, not ChatGPT patterns in AGENTS.md)
- Size fits within surface constraints
- No redundant or overlapping instructions

**GPT-5.x calibration:**
- No personality padding ("world-class expert," "meticulous," "thorough")
- No micro-step instructions for tasks within native capability
- Explicit scope boundaries present
- Done-conditions present for agentic contexts
- No anti-laziness language that causes tool spam on GPT-5.x

**Surface-specific checks:**

*Codex AGENTS.md:*
- Instructions at the right directory level
- Override files used correctly (temporary clamps, not permanent instructions)
- Combined size under 32 KiB (or explicitly configured higher)
- Compaction-aware: critical state externalized to files
- Skills referenced correctly if applicable

*ChatGPT Custom Instructions:*
- Within 1,500 chars per field
- Evergreen guidance only (no dynamic facts that belong in Memory)
- "About you" field has context, "Instructions" field has behavior directives
- No conflicting instructions between the two fields

*Custom GPTs:*
- Critical instructions in first 2,000 chars
- Knowledge file usage explicitly instructed (not assumed)
- Tool invocation directives present for enabled tools
- No reliance on knowledge file retrieval for critical behavior (retrieval is non-deterministic)

**Failure mode hardening:**
- Check against known failure modes in `references/failure-modes.md`
- For Codex: tool spam, scope creep, compaction amnesia
- For Custom GPTs: knowledge file retrieval failure, instruction drift in long conversations
- For Custom Instructions: over-truncation from stacking "be concise" on ChatGPT's already-concise defaults

#### Step 3: Produce findings

Structure the audit as:

1. **Summary** — What was reviewed, target surface, target model
2. **Strengths** — What's already well-done
3. **Issues by severity**
   - **Critical** — Will cause incorrect behavior or systematic failures
   - **Important** — Degrades quality but doesn't break functionality
   - **Minor** — Polish items
4. **Rewrite** — The complete corrected prompt, ready for use

---

### Mode 3: Migrate

Convert a prompt written for GPT-4o or earlier to work on GPT-5.x surfaces, or adapt a prompt from one surface to another.

**Model migration (GPT-4o → GPT-5.x):**

1. **Identify era markers** — Personality padding, micro-step instructions, anti-laziness language ("be thorough," "don't skip steps"), redundant JSON format instructions, missing scope boundaries
2. **Apply the prompting inversion** — Simplify. Remove instructions the model can handle natively. Add scope constraints it needs.
3. **Add surface-appropriate structure** — CTCO pattern, compaction awareness, done-conditions
4. **Produce a migration diff** — Show what changed and why, then the complete rewritten prompt

**Surface migration (e.g., API system prompt → AGENTS.md, or Custom Instructions → Custom GPT):**

1. **Map content to the target surface's constraints** — Character limits, file structure, available mechanisms
2. **Adjust patterns** — API XML tags → AGENTS.md markdown sections; API tool descriptions → Custom GPT tool toggle instructions; multi-turn API patterns → single-file AGENTS.md with compaction awareness
3. **Verify fit** — Content fits within target constraints, nothing critical lost in translation

---

## CTCO Pattern Quick Reference

The default structural template for GPT-5.x prompts. Adapt section names and depth to the surface.

```markdown
## Context
[Identity and domain context. Functional, not personality-based.]
[Project/environment specifics relevant to the task.]

## Task
[What the model should accomplish. Goals, not micro-steps.]
[Expected workflow at a high level if multi-step.]

## Constraints
[Scope boundaries — what NOT to do is as important as what to do.]
[Priority order when constraints conflict.]
[Done-conditions for agentic contexts.]

## Output
[Expected format, length, style.]
[Examples of good output if available.]
```

For Codex AGENTS.md, the Context section often lives at the project root level and Task/Constraints at the working-directory level, leveraging the merge order.

## When This Skill Pairs With Others

- After writing an AGENTS.md, the user may want `superpowers-methodology` for the development workflow
- After writing a Custom GPT, the user may want to test it and iterate — suggest structured testing prompts
- When the user reports a prompt "isn't working," start with this skill's Audit mode before assuming the problem is elsewhere
- For prompts targeting Claude instead of GPT, use `prompt-architect` (the Claude-specific skill)
- For cross-model translation (Claude ↔ GPT migration), load both this skill and `prompt-architect` for accurate platform-specific guidance
