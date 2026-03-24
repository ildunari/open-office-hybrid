# GPT-5.x Failure Modes & Fixes

Reference for diagnosing and fixing GPT prompt failures. Load when a prompt isn't working as expected, or proactively when hardening a prompt against known failure patterns.

---

## Failure Mode Index

| # | Failure | Surface | Severity | Quick fix |
|---|---|---|---|---|
| 1 | Tool spam | Codex | High | Add done-conditions and search budgets |
| 2 | Scope creep | Codex | High | Add explicit scope boundaries |
| 3 | Compaction amnesia | Codex | High | Externalize state to files |
| 4 | Personality noise | All | Medium | Remove padding, use functional context |
| 5 | Knowledge file retrieval failure | Custom GPTs | High | Move critical info to instructions |
| 6 | Instruction drift (long conversations) | Custom GPTs, Custom Instructions | Medium | Front-load critical instructions |
| 7 | Over-truncation | Custom Instructions | Medium | Remove "be concise" stacking |
| 8 | Contradictory constraints | All | High | State priority order |
| 9 | Silent AGENTS.md truncation | Codex | High | Monitor combined file size |
| 10 | Skill description mismatch | Codex skills | Medium | Rewrite description as routing rule |
| 11 | Anti-laziness backfire | Codex | Medium | Replace with done-conditions |
| 12 | Router downgrade | ChatGPT | Low | Make prompts substantive |

Caption: Severity indicates impact on prompt reliability. "Quick fix" is the shortest path to resolution; detailed fixes are in the sections below.

---

## 1. Tool Spam

**Surfaces:** Codex CLI
**Symptoms:** The agent reads every file in a directory, runs unnecessary searches, fetches documentation it doesn't need, executes tests you didn't ask for, or performs multiple sequential tool calls before doing any actual work.
**Root cause:** Unclear done-conditions combined with anti-laziness language ("be thorough," "check everything"). GPT-5.x interprets these as directives to exhaustively use available tools.

### Before (causes tool spam)

```markdown
## Instructions
Be thorough in your analysis. Don't skip steps. Check all relevant
files before making changes. Make sure everything is correct.
```

### After (controlled tool usage)

```markdown
## Instructions
Read only the files directly related to the requested change.
Stop after implementing the change and running the project's test suite.
Do not explore unrelated code, search for edge cases, or read
documentation unless the change requires understanding a specific API.
```

### The anti-overthinking pattern

For Codex agents that tend to over-research before acting:

```markdown
## Context Gathering
When you need information to complete a task:
1. Read the most directly relevant file first
2. If that's insufficient, read up to 2 additional related files
3. If still unclear, ask the user rather than searching further
Do not perform exhaustive codebase scans. One targeted read is better
than five exploratory ones.
```

---

## 2. Scope Creep

**Surfaces:** Codex CLI (primarily GPT-5.2+)
**Symptoms:** You ask for a bug fix and get a refactored module with new abstractions, updated tests for unrelated code, documentation changes, and a suggested architecture improvement.
**Root cause:** GPT-5.2+ has strong initiative — it will build more structure than requested unless explicitly constrained.

### Before (invites scope creep)

```markdown
Fix the authentication bug in src/auth/login.ts
```

### After (contained scope)

```markdown
Fix the authentication bug in src/auth/login.ts.
ONLY modify files directly required to fix this specific bug.
Do not:
- Refactor adjacent code
- Add tests for unrelated functionality
- Update documentation
- Create new abstractions or utility functions
- Modify any files outside src/auth/
If you believe related changes are needed, describe them but do not implement.
```

### The "ONLY what was asked" constraint

This is nearly always needed for Codex prompts targeting GPT-5.2+:

```markdown
## Scope
Implement ONLY what the user explicitly requested. If you see opportunities
for improvement beyond the request, mention them in a comment but do not
implement them. When in doubt about scope, ask rather than assuming.
```

---

## 3. Compaction Amnesia

**Surfaces:** Codex CLI (long sessions)
**Symptoms:** After a long session, the agent "forgets" decisions made earlier, re-asks questions that were already answered, or contradicts previous work.
**Root cause:** Codex compacts conversation history when context gets long. AGENTS.md is reloaded from files, but conversation context is lost.

### Fix: State externalization

Add this to your AGENTS.md:

```markdown
## State Management
- Before starting multi-step work, create WORKLOG.md in the project root
  with the plan and current status
- After each significant decision, append to DECISIONS.md with the
  decision and its rationale
- Before stopping or when prompted about compaction, update WORKLOG.md
  with current progress and remaining items
- After any interruption, re-read WORKLOG.md and DECISIONS.md before
  continuing work
```

### Fix: File-based memory for critical state

When something must survive compaction, make the agent write it to a file:

```
Write the agreed schema to docs/schema-decisions.md so it persists
across sessions. Include the rationale for each field choice.
```

---

## 4. Personality Noise

**Surfaces:** All
**Symptoms:** The model ignores substantive instructions while faithfully adopting the persona. Output quality doesn't improve despite elaborate role descriptions.
**Root cause:** GPT-5.x treats personality descriptions as low-priority noise. Token budget spent on personality padding is budget not spent on actionable instructions.

### Before (personality padding)

```
You are a meticulous, detail-oriented senior software engineer who takes
deep pride in writing clean, well-tested, production-ready code. You
approach every problem with careful analysis and thorough consideration
of edge cases. You are passionate about code quality and never cut corners.
```

### After (functional context)

```
Follow the project's existing code style. Run the linter before committing.
Add tests for new logic — target the same coverage level as adjacent modules.
Flag edge cases in code comments rather than silently handling them.
```

The "after" version is shorter, more specific, and more likely to be followed because each directive is a concrete action, not a personality trait.

---

## 5. Knowledge File Retrieval Failure

**Surfaces:** Custom GPTs
**Symptoms:** The GPT doesn't reference uploaded knowledge files, gives answers that contradict the knowledge files, or says "I don't have access to that information" when the information is in the uploaded files.
**Root cause:** Custom GPT knowledge retrieval is chunked RAG with non-deterministic selection. The model only sees fragments of uploaded files at any given time.

### Mitigations

**Move critical information to instructions.** If the GPT absolutely must know something, it goes in the instructions field, not knowledge files.

**Add explicit retrieval instructions:**

```
Before answering any question about [domain], search your knowledge
files first. If the knowledge files contain relevant information,
use it. If they don't, say "I don't have specific information about
that in my reference materials — here's what I know generally: ..."
```

**Use smaller, focused files.** One 5-page document per topic retrieves more reliably than one 100-page omnibus document.

**Accept the limitation.** If your use case requires reliable, complete retrieval of uploaded documents, Custom GPTs are the wrong tool. Consider: API with context window management, RAG pipeline with a proper vector database, or Claude Projects (which load full documents into context).

---

## 6. Instruction Drift (Long Conversations)

**Surfaces:** Custom GPTs, Custom Instructions
**Symptoms:** The GPT follows instructions well in the first few turns, then gradually stops following format rules, tone preferences, or constraints.
**Root cause:** As conversation history grows, the relative weight of system instructions decreases compared to the accumulated conversation context.

### Mitigations

**Front-load critical instructions.** Put the most important constraints in the first 2,000 characters of Custom GPT instructions.

**Use periodic reinforcement for Custom GPTs:**

```
At the start of every 5th response, silently re-read your instructions
to ensure you haven't drifted from the specified format and constraints.
```

**For Custom Instructions:** Keep them focused on high-impact behavioral directives. The more instructions you have, the faster each individual instruction's influence degrades over conversation length.

---

## 7. Over-Truncation

**Surfaces:** ChatGPT Custom Instructions
**Symptoms:** Responses are too short, missing expected detail, or feel clipped.
**Root cause:** ChatGPT has internal system prompts that already include verbosity controls. Adding "be concise" or "keep responses brief" in Custom Instructions stacks on top of these defaults, causing over-truncation.

### Fix

Replace vague conciseness directives with specific length guidance:

**Before:** "Be concise. Keep responses brief."

**After:** "2–4 sentences for simple factual questions. Full paragraphs for explanations or analysis. Match response length to question complexity."

This gives the model a specific calibration rather than stacking "be concise" on an already-concise default.

---

## 8. Contradictory Constraints

**Surfaces:** All
**Symptoms:** The model alternates between conflicting behaviors, or consistently follows one constraint while ignoring another.
**Root cause:** Two or more constraints that cannot be simultaneously satisfied, with no stated priority.

### Before

```
Be fast and lightweight.
Use only the standard library.
Use external packages if they make the implementation simpler.
```

### After

```
Prefer standard library solutions. Use external packages only when
the standard library solution would exceed 50 lines of code or
require reimplementing well-known algorithms. When choosing between
simplicity and standard-library-only, prioritize simplicity.
```

### Diagnostic

When auditing for contradictions, check these common conflict pairs:
- Conciseness vs completeness
- Speed vs thoroughness
- Standard library vs simplicity
- DRY vs readability
- Security vs usability
- Existing patterns vs best practices

---

## 9. Silent AGENTS.md Truncation

**Surfaces:** Codex CLI
**Symptoms:** Instructions at the end of your AGENTS.md chain are ignored, but earlier instructions work fine. No error message.
**Root cause:** Combined AGENTS.md size exceeds the 32 KiB `project_doc_max_bytes` limit. Codex silently stops reading once the cap is hit.

### Diagnostic

```bash
# Check combined size of all AGENTS files in the chain
find . -name "AGENTS.md" -o -name "AGENTS.override.md" | \
  xargs cat | wc -c
# Compare against the configured limit (default: 32768)
```

### Fix

1. Audit for redundancy across files
2. Move procedural content to skills (loaded on-demand, doesn't count toward the cap)
3. Raise the limit in `~/.codex/config.toml` if justified: `project_doc_max_bytes = 65536`
4. Keep the most critical instructions in the root-level AGENTS.md (loaded first, most likely to be within budget)

---

## 10. Skill Description Mismatch

**Surfaces:** Codex skills
**Symptoms:** The skill triggers when it shouldn't, doesn't trigger when it should, or triggers for tasks that are only tangentially related.
**Root cause:** The skill's `description` field doesn't clearly define its trigger boundary.

### Before (overtriggers)

```yaml
description: Helps with database operations
```

### After (precise boundary)

```yaml
description: >
  Generate Alembic migration files for PostgreSQL schema changes in
  Python/SQLAlchemy projects. Trigger when the user mentions migrations,
  schema changes, adding/removing columns, or creating tables. Do NOT
  trigger for raw SQL queries, ORM model definitions without migration
  intent, Django projects (use django-migrations skill), or non-PostgreSQL
  databases.
```

### The description optimization loop

1. Write 10 test prompts: 5 that should trigger the skill, 5 that should not
2. Check if the description correctly routes all 10
3. Adjust boundary language until routing is correct
4. Test with 5 more edge-case prompts

---

## 11. Anti-Laziness Backfire

**Surfaces:** Codex CLI
**Symptoms:** Excessive tool usage, unnecessary file reads, over-engineered solutions, unrequested tests and documentation.
**Root cause:** Anti-laziness language ("be thorough," "don't skip steps," "check everything carefully") that was necessary for GPT-4o is counterproductive on GPT-5.x. The newer models interpret these as directives to maximize tool usage and output volume.

### Fix

Replace anti-laziness language with explicit done-conditions:

**Before:** "Be thorough. Don't skip steps. Make sure to check everything."

**After:** "Stop after: (1) implementing the requested change, (2) running the test suite, (3) confirming tests pass. Do not perform additional investigation, refactoring, or documentation unless explicitly asked."

---

## 12. Router Downgrade

**Surfaces:** ChatGPT (product)
**Symptoms:** Simple questions get notably worse responses than complex questions, even when the topic is the same. Custom Instructions seem to be partially ignored on simple queries.
**Root cause:** ChatGPT routes prompts to different model variants based on perceived complexity. Simple prompts may be handled by faster, less capable variants that don't fully honor nuanced Custom Instructions.

### Mitigations

**Accept the limitation.** This is a product-level optimization you cannot directly control.

**For important queries:** Add enough context to signal complexity: "Analyze the tradeoffs between X and Y considering Z" triggers a more capable model than "X vs Y?"

**For Custom Instructions:** Focus on instructions that work at all capability levels — format rules and simple behavioral directives. Complex judgment-requiring instructions may only be honored by the full model.

---

## Diagnostic Workflow

When a GPT prompt isn't working, run this diagnostic in order:

1. **Identify the surface.** Codex AGENTS.md? Custom GPT? Custom Instructions? The failure mode set is different for each.

2. **Check the obvious constraints first.**
   - AGENTS.md: Is the combined size under 32 KiB? (Failure #9)
   - Custom Instructions: Are you under 1,500 chars per field?
   - Custom GPT: Are critical instructions in the first 2,000 chars? (Failure #6)

3. **Check for contradictions.** Read every constraint pair and ask: can these both be true simultaneously? (Failure #8)

4. **Check for personality noise.** Count characters spent on personality description vs actionable directives. If personality > 20%, it's probably noise. (Failure #4)

5. **Check for anti-laziness language.** Search for: "thorough," "careful," "don't skip," "check everything," "make sure." Replace with done-conditions. (Failure #11, Failure #1)

6. **Check for scope boundaries.** Is there an explicit "do not" list? Are done-conditions stated? (Failure #2)

7. **For Custom GPTs: check knowledge file dependency.** Is critical behavior dependent on knowledge file retrieval? If yes, move it to instructions. (Failure #5)

8. **For Codex: check compaction vulnerability.** Is important state only in conversation, not in files? (Failure #3)

9. **If everything looks correct:** Test with a fresh conversation. Instruction drift (Failure #6) or router behavior (Failure #12) may be the cause.
