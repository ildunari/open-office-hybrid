# Prompt Framework

Prompt/framework facts and decisions for Hybrid Word hardening.

**What belongs here:** provider-aware prompt shaping, skill/doctrine sources, phase-aware injection rules, prompt provenance expectations.  
**What does NOT belong here:** feature progress or temporary debugging notes.

---

- Current framework baseline:
  - the Word adapter builds a large base system prompt
  - installed skills are listed in the system prompt, but their contents are not proactively loaded
  - runtime appends metadata, plan state, context budget, and flattened hook notes to each prompt
- Required hardening direction:
  - shape prompt composition by provider/model family when behavior differs materially
  - separate prompt phases for mutation, reviewer/live-review, and blocked/resume flows
  - actively apply the relevant local doctrine skills for Word editing and provider prompting
  - expose prompt provenance in diagnostics/runtime artifacts
- Preferred doctrine sources:
  - `skills/prompt-architect`
  - `skills/gpt-prompt-architect`
  - `skills/word-mastery-v3`
  - `skills/openword-best-practices`
- Duplicate `word-mastery` vs `word-mastery-v3` content was compared and found effectively identical; prefer `word-mastery-v3` as the canonical source for this mission unless implementation discovery shows a different path is required.
