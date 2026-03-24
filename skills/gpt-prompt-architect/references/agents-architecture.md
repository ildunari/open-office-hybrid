# AGENTS.md Architecture & Codex Skills

Reference for writing and auditing AGENTS.md files, Codex skills, and compaction-aware prompt design. Load when working on any Codex CLI prompt surface.

---

## AGENTS.md Discovery and Merge Order

Codex builds an instruction chain once per session. Discovery follows strict precedence:

### Scope levels

1. **Global scope** (`~/.codex/` or `$CODEX_HOME`): Codex reads `AGENTS.override.md` if it exists, otherwise `AGENTS.md`. Only the first non-empty file at this level is used.

2. **Project scope** (git root → current working directory): Starting at the project root, Codex walks down to the current working directory. In each directory along the path, it checks: `AGENTS.override.md` → `AGENTS.md` → fallback filenames from `project_doc_fallback_filenames`.

### Merge behavior

- **One file per directory.** Codex uses only the first non-empty file found in each directory (override → standard → fallbacks).
- **Root-to-leaf concatenation.** Files are joined with blank lines. Later files appear later in the combined prompt, so they effectively override earlier guidance.
- **The 32 KiB cap.** Combined size is limited by `project_doc_max_bytes` (default: 32,768 bytes). Codex stops adding files once this limit is reached. This is configurable in `~/.codex/config.toml`.
- **Silent truncation.** If the combined AGENTS.md exceeds the cap, Codex truncates without warning. There is no error message — your instructions just silently stop being included.

### Override files

`AGENTS.override.md` is a temporary behavioral clamp. Use it when you need to change behavior without deleting the base file:

- Temporary global overrides: `~/.codex/AGENTS.override.md` (remove to restore shared guidance)
- Directory-specific overrides: `services/payments/AGENTS.override.md` (different rules for a subdirectory)

Override files take precedence over standard files at the same directory level. They're checked first.

### Fallback filenames

If your project already uses a different filename (e.g., `TEAM_GUIDE.md`), add it to the fallback list:

```toml
# ~/.codex/config.toml
project_doc_fallback_filenames = ["TEAM_GUIDE.md", ".agents.md"]
project_doc_max_bytes = 65536  # raise the cap if needed
```

Codex checks each directory in order: `AGENTS.override.md` → `AGENTS.md` → fallback filenames. Filenames not on this list are ignored for instruction discovery.

---

## Writing Effective AGENTS.md Files

### The 32 KiB budget

Think of 32 KiB as approximately 8,000 words or ~25 pages of instructions. This is the combined budget across *all* AGENTS.md files from global through working directory. Budget accordingly:

- **Global (~/.codex/AGENTS.md):** 2–4 KiB. Working agreements, tool preferences, universal constraints. Keep this lean — it's loaded for every project.
- **Project root (AGENTS.md):** 4–12 KiB. Project setup, testing requirements, architecture decisions, deployment norms.
- **Subdirectories:** 2–4 KiB each. Team-specific or service-specific overrides.

If you're approaching the cap: audit for redundancy, move reference material to skills (which load on-demand, not on startup), and use `project_doc_max_bytes` to raise the limit if justified.

### Structure: CTCO for AGENTS.md

Apply the CTCO pattern, adapted for markdown:

```markdown
# AGENTS.md

## Context
- This is a [language/framework] project using [key tools]
- The codebase follows [architecture pattern]
- [Any domain context that affects coding decisions]

## Working Agreements
- Run `npm test` after modifying JavaScript files
- Prefer `pnpm` when installing dependencies
- Ask for confirmation before adding new production dependencies

## Constraints
- Do not modify files in `vendor/` or `generated/`
- Maximum 3 files per change unless explicitly approved
- Do not refactor code adjacent to the change without asking

## Output Expectations
- Commit messages follow Conventional Commits format
- PR descriptions include a "Why" section
- Code comments explain *why*, not *what*
```

### What belongs in AGENTS.md vs elsewhere

| Content type | Where it goes | Why |
|---|---|---|
| Project norms and conventions | AGENTS.md (project root) | Loaded every session, survives compaction |
| Tool/language preferences | AGENTS.md (global) | Applies across all projects |
| Step-by-step procedures | Skills (SKILL.md) | Loaded on-demand, doesn't consume the 32 KiB budget |
| Dynamic task state | Repo files (WORKLOG.md, TODO.md) | Persists across compaction cycles; Codex reads files, not conversation history |
| Temporary behavioral overrides | AGENTS.override.md | Easy to add and remove without editing the base file |
| Reference documentation | Skills `references/` directory or repo docs | Progressive disclosure; loaded only when needed |

### Compaction-aware design

Codex compacts conversation history when context gets long. After compaction, the model retains AGENTS.md (reloaded from files) but loses conversation context. Design for this:

**The three-layer pattern:**
1. **AGENTS.md** — Invariants. Always loaded, always available. Project norms, constraints, architectural decisions.
2. **Skills** — Procedures. Loaded on-demand when a relevant task is detected. Step-by-step workflows, templates, scripts.
3. **Repo files** — Dynamic state. Codex can read these at any time. Current task status, decisions made during the session, work logs.

**Critical rule:** If you tell Codex something important in conversation ("always use the staging database for this session"), it will forget after compaction. Externalize to a file: add it to AGENTS.md, write it to a WORKLOG.md, or update a config file. Conversation is ephemeral; files are durable.

**State externalization patterns:**

```markdown
## State Management
- Before starting multi-step work, create WORKLOG.md with the plan
- After each significant decision, append to DECISIONS.md with rationale
- Before stopping, update TODO.md with remaining items
- After compaction, re-read WORKLOG.md and TODO.md to restore context
```

### Anti-patterns to avoid

**Personality padding.** "You are a meticulous, detail-oriented senior engineer who takes pride in clean code." GPT-5.x treats this as noise. Replace with: "Follow the project's existing code style. Run the linter before committing."

**Micro-step instructions for native capabilities.** Don't write a 20-step code review checklist. Write: "Review for bugs, security issues, and style violations. Flag anything that violates the constraints in this file."

**Anti-laziness language.** "Be thorough. Don't skip steps. Check everything." On GPT-5.x, this causes tool spam — the model reads every file in the directory, runs every possible test, and searches for edge cases you didn't ask about. Instead, add explicit done-conditions: "Stop after implementing the requested change."

**Contradictory constraints.** "Be fast and lightweight" + "Use only the standard library" + "Use external packages if they make it simpler." If constraints can conflict, state the priority: "Prefer standard library. Use external packages only when the standard library solution would exceed 50 lines."

---

## Codex Skills Architecture

Skills extend Codex with task-specific capabilities. They use progressive disclosure to manage context efficiently.

### Skill structure

A skill is a directory with a SKILL.md file plus optional resources:

```
my-skill/
├── SKILL.md          # Required. YAML frontmatter + instructions
├── scripts/          # Optional. Executable scripts the skill can invoke
├── references/       # Optional. Additional documentation loaded on-demand
└── agents/
    └── openai.yaml   # Optional. UI metadata, invocation policy, tool dependencies
```

### SKILL.md format

```markdown
---
name: my-skill
description: >
  Explain exactly when this skill should and should not trigger.
  The description determines implicit invocation — write it with
  clear scope and boundaries.
---

# My Skill

Instructions for Codex to follow when this skill is active.
```

The YAML frontmatter `name` and `description` are required. The description is the single most important field — it determines whether Codex selects the skill implicitly.

### Skill discovery

Codex reads skills from multiple locations:

1. **Repository skills:** `.agents/skills/` in every directory from current working directory up to repo root
2. **User skills:** `~/.codex/skills/`
3. **System skills:** `~/.codex/skills/.system/` (built-in: `plan`, `skill-creator`)

Skills can also be installed via `$skill-installer`:

```
$skill-installer install the linear skill from the .experimental folder
$skill-installer install https://github.com/org/repo/tree/main/skills/my-skill
```

### Invocation modes

- **Explicit:** `/skills` or type `$` to mention a skill by name
- **Implicit:** Codex matches your task description against skill descriptions and selects automatically

For implicit invocation to work reliably, the description must be specific about *when* the skill should trigger and *when it should not.* Vague descriptions like "helps with coding" will either overtrigger or never trigger.

### Writing good skill descriptions

The description field is effectively a routing rule. Write it like one:

**Good:** "Generate database migration files for PostgreSQL using Alembic. Trigger when the user mentions migrations, schema changes, or database alterations in a Python/SQLAlchemy project. Do NOT trigger for raw SQL queries, ORM model definitions without migration intent, or non-PostgreSQL databases."

**Bad:** "Helps with database stuff."

### Skill-to-AGENTS.md relationship

Skills complement AGENTS.md — they don't replace it.

- AGENTS.md: loaded every session, consumed from the 32 KiB budget, contains project invariants
- Skills: loaded on-demand, don't consume the 32 KiB budget until invoked, contain procedures and workflows

Move procedural content (step-by-step workflows, templates, scripts) from AGENTS.md into skills to free up budget for project norms and constraints.

### Cross-platform compatibility

The skill format is an open standard adopted by multiple platforms: Codex CLI, Claude Code, Google Antigravity, Cursor, and others. A skill created for one platform generally works on another — the core format (folder with SKILL.md + frontmatter) is shared. Platform-specific differences:

- **Codex:** `.agents/skills/` or `~/.codex/skills/`. Supports `agents/openai.yaml` for UI metadata.
- **Claude Code:** `.claude/skills/` or `~/.claude/skills/`. No YAML metadata file equivalent.
- **Antigravity:** `.agent/skills/` or `~/.gemini/antigravity/skills/`.

If you need a skill to work across platforms, keep it to SKILL.md + scripts + references without platform-specific metadata files.

---

## Multi-Agent Roles (Codex)

Codex supports customizable agent roles for multi-agent workflows. Roles are defined in two tiers:

### Built-in roles

- **default:** Standard agent behavior
- **worker:** Execution and production work. Expects explicit task ownership and awareness that other agents may be working in the same codebase.
- **explorer:** Codebase questions and investigation. Configured with lighter models and medium reasoning effort for speed.

### User-defined roles

Add custom roles in `~/.codex/agents_config.toml`:

```toml
version = 1

[agents.planner]
description = "Planning-focused agent."
config_file = "planner.toml"  # optional: model/effort overrides

[agents.reviewer]
description = """
Code review agent.
Focus on: correctness, security, style violations.
Do NOT: suggest refactors, add features, or modify code.
"""
```

Role descriptions function like skill descriptions — they're routing rules that determine when Codex selects that role.

---

## Templates

### Global AGENTS.md (~/.codex/AGENTS.md)

```markdown
# Global Working Agreements

## Preferences
- Prefer pnpm for Node.js projects
- Use conventional commits for all commit messages
- Run the project's test suite before considering work complete

## Constraints
- Ask before adding new production dependencies
- Do not modify CI/CD configuration without explicit approval
- Keep changes focused — one logical change per session
```

### Project root AGENTS.md (monorepo)

```markdown
# Project: [Name]

## Context
- TypeScript monorepo using Turborepo
- Packages: shared-ui, api-server, web-client, mobile-client
- Testing: Vitest for unit tests, Playwright for e2e

## Package Boundaries
- Changes to shared-ui require testing in both web-client and mobile-client
- API changes require updating the OpenAPI spec in docs/api/
- Each package owns its own dependencies — no hoisting

## Constraints
- Do not modify packages you weren't asked to change
- Run `turbo test --filter=[changed-package]` before completing work
- Schema migrations require a separate PR with migration-only changes
```

### Subdirectory override (services/payments/)

```markdown
# Payments Service Rules

## Additional Constraints
- Use `make test-payments` instead of the root test command
- Never rotate API keys without notifying the security channel
- All changes to payment processing logic require two human reviewers
- PCI compliance: do not log request bodies or response bodies containing card data
```
