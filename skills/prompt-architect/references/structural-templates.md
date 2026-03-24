# Structural Templates

Architecture patterns and templates for the major prompt types: system prompts, CLAUDE.md files, project instructions, and task prompts. Each template encodes the structural principles that produce optimal behavior on Claude 4.5/4.6.

## System Prompt Architecture

### The system parameter

The `system` parameter is for role definition. This is the highest-leverage use of the system prompt. Everything else (task instructions, context, examples) belongs in the user turn.

**Claude framing convention:** Use third-person descriptive form for the role definition in `system`. This matches Anthropic's own convention ("The assistant is Claude, created by Anthropic") and registers as identity rather than instruction.

**Generic role (weaker):**
```
You are a data scientist.
```

**Domain-specific role, second-person (stronger):**
```
You are a seasoned data scientist specializing in customer insight
analysis for Fortune 500 companies, with deep expertise in cohort
analysis, churn prediction, and LTV modeling.
```

**Domain-specific role, third-person descriptive (strongest on Claude):**
```
This assistant is a seasoned data scientist specializing in customer
insight analysis for Fortune 500 companies, with deep expertise in
cohort analysis, churn prediction, and LTV modeling.
```

The more domain-specific the role, the more precisely Claude constrains its reasoning, vocabulary, and output style. On Claude 4.5/4.6, third-person descriptive further strengthens the role by framing it as identity rather than instruction.

**Cross-platform note:** OpenAI models expect "You are..." for role definition. The second-person form is the standard convention for GPT-4o, GPT-4.1, and GPT-5. Third-person descriptive provides no additional benefit on those models. When writing prompts that may run on either platform, the second-person form is the safer default; optimize to third-person only for Claude-specific deployments.

### Section ordering

Optimal order for a complex system prompt or user-turn instruction set:

1. **Long documents and context** (20K+ tokens) — placed first
2. **Role definition** (in system parameter, or at top of user message if API constraints apply)
3. **Background context and motivations** — why this task matters, who consumes the output
4. **Specific instructions** — what to do, in explained conditional form
5. **Constraints and boundaries** — what not to do, with approved alternatives
6. **Few-shot examples** — wrapped in `<examples>` tags
7. **Output format specification** — including XML format indicators if applicable
8. **The actual query/task** — placed last for maximum attention

This ordering follows the long-context principle (documents first, query last) and positions instructions and examples where they receive strong attention — after initial context but before the query that triggers generation.

**Why documents go first:** Anthropic's testing shows that placing long documents at the top with the query below improves response quality by up to 30% compared to query-first ordering.

**Why the query goes last:** The query is what triggers generation. Placing it last means it has the strongest recency effect in the attention window.

### XML section structure

For prompts with 3+ behavioral domains, use XML tags to organize sections. Anthropic's own production system prompts use this pattern.

```xml
<role>
[Domain-specific role definition. 2-3 sentences establishing
expertise, perspective, and communication style.
FRAMING: Third-person descriptive on Claude ("This assistant is...").
Second-person directive on OpenAI ("You are...").]
</role>

<context>
[Project context, audience, constraints. What Claude needs to
know to make good decisions. 2-4 sentences.
FRAMING: Neutral/declarative — this is information, not instruction.]
</context>

<instructions>
[Core behavioral directives. Explained conditional form.
Organized by priority, not by topic.
FRAMING: Explained conditionals ("Use X when Y, because Z").
Direct imperatives for concrete task steps.]
</instructions>

<constraints>
[Boundaries and prohibitions. Positive framing where possible.
Hard stops in third-person descriptive form. Each prohibition
paired with an approved alternative.
FRAMING: Third-person descriptive for safety/identity constraints
("Claude does not..."). Positive directives for formatting/style.]
</constraints>

<output_format>
[How to structure the response. Examples of desired format.
Length expectations in sentence/paragraph counts.
XML format indicators for style priming.
FRAMING: Direct imperatives ("Structure responses as...").
Framing choice has minimal impact here.]
</output_format>

<examples>
[3-5 diverse, relevant examples. Each wrapped in <example> tags.
Cover edge cases and variations, not just the typical case.]

<example>
[Input → Output pair demonstrating desired behavior]
</example>

<example>
[A different case — edge case or variation]
</example>
</examples>
```

**Tag naming:** Use descriptive, behavior-oriented tag names. No canonical "best" tag names exist — Claude responds to any well-named tags. But tag names that appear in Anthropic's own prompts receive natural attention: `<instructions>`, `<example>`, `<examples>`, `<document>`, `<context>`, `<thinking>`, `<answer>`.

**Specialized behavioral tags:** Anthropic's documentation uses several tags that function as both structural delimiters and behavioral anchors: `<default_to_action>`, `<do_not_act_before_instructions>`, `<avoid_excessive_markdown_and_bullet_points>`, `<investigate_before_answering>`. These can be adopted directly.

### Multi-document context

For tasks involving multiple source documents, use metadata-tagged XML:

```xml
<document>
  <source>quarterly_report_2025.pdf</source>
  <document_content>...full text...</document_content>
</document>
<document>
  <source>competitive_analysis.md</source>
  <document_content>...full text...</document_content>
</document>

Using the documents above, analyze the competitive positioning
described in <source>competitive_analysis.md</source> against
the financial results in <source>quarterly_report_2025.pdf</source>.
```

For long-document tasks, use the quote-grounding technique: ask Claude to extract relevant quotes first, then base analysis on those quotes. This cuts through noise in large contexts and reduces hallucination.

### Few-shot example design

Three requirements for effective examples:
- **Relevant** — mirror actual use cases the prompted Claude will encounter
- **Diverse** — cover edge cases and vary enough to prevent rigid anchoring on one pattern
- **Clear** — wrapped in `<example>` tags with unambiguous input/output pairs

3-5 examples for most tasks. With prompt caching, 20+ diverse examples become practical and can significantly improve performance.

**Anti-pattern:** All examples showing the same structure. Claude anchors rigidly on the demonstrated pattern and fails when inputs diverge. Deliberately include examples that cover edge cases and variations.

---

## CLAUDE.md Template

For Claude Code customization. Target 100-200 lines. Structured around WHAT/WHY/HOW.

```markdown
# Project: [Name]

## Stack
[Tech stack, versions, package manager. Brief — one line per technology.]

## What this project does
[2-3 sentences. Purpose, core functionality, who uses it.
This helps Claude make appropriate architectural decisions.]

## Key directories
[Map of the codebase. One line per directory with its purpose.
Especially important in monorepos.]

## Commands
[Exact commands for building, testing, linting, deploying.
Include package-scoped variants for monorepos.]

## Conventions
[Code style rules NOT already enforced by linters.
Architectural decisions and patterns to follow.
Naming conventions, file organization patterns.]

## Workflow
[What to do before/after changes. Test strategy.
Commit format. PR conventions.]

## What to read before complex tasks
[Pointers to detailed docs for specific subsystems.
"For auth changes, read docs/auth-flow.md first."]
```

### CLAUDE.md anti-patterns

- **Over 200 lines.** Claude wraps CLAUDE.md in a system reminder that says contents "may or may not be relevant" — the more content, the more gets ignored.
- **Task-specific instructions.** CLAUDE.md loads into every conversation. Put task-specific guidance in conversation messages, not CLAUDE.md.
- **Duplicating linter rules.** If ESLint enforces semicolons, don't also tell Claude to use semicolons. Wastes instruction budget.
- **Inline documentation dumps.** Use progressive disclosure — point to docs, don't paste them in.

### Progressive disclosure pattern

Instead of cramming everything into CLAUDE.md:

```
agent_docs/
  ├── building_the_project.md
  ├── running_tests.md
  ├── code_conventions.md
  ├── service_architecture.md
  └── database_schema.md
```

CLAUDE.md contains brief descriptions with instructions to read relevant docs:

```markdown
## What to read before complex tasks
Before starting work, review the list of agent docs below and read
any that are relevant to your current task:
- `agent_docs/building_the_project.md` — build and compilation
- `agent_docs/running_tests.md` — test commands and strategies
- `agent_docs/code_conventions.md` — patterns and anti-patterns
- `agent_docs/service_architecture.md` — how services connect
- `agent_docs/database_schema.md` — schema and migration workflow
```

This keeps always-loaded context small (~50 instructions) while making detailed guidance available on demand.

---

## Project Instructions Template

Claude.ai Projects apply custom instructions to every chat in the project. Good for constraints that must survive long conversations.

```xml
<project_context>
[What this project is about. What Claude is helping with.
2-3 sentences of essential context.]
</project_context>

<behavioral_guidelines>
[How Claude should behave in this project. Communication style,
depth of explanation, technical level. Use explained conditionals.]
</behavioral_guidelines>

<constraints>
[Hard boundaries. Positive framing with alternatives.
These re-inject every turn, making them drift-resistant.]
</constraints>

<output_preferences>
[Format, length, style. Positive directives.
Match the formatting of these instructions to the desired output.]
</output_preferences>
```

**Key advantage:** Project instructions re-inject every turn, making them the most drift-resistant instruction location. Put formatting rules and parameter requirements here rather than in early conversation messages.

---

## Task Prompt Template

For single-turn or few-turn interactions where you're prompting Claude directly.

```
[Context: What you're working with and why. 2-3 sentences.]

[Task: What you want Claude to do. Specific, with success criteria.]

[Format: What the output should look like. Example if helpful.]

[Constraints: Any boundaries. Positive framing.]
```

For Claude 4.5/4.6 specifically, task prompts benefit from explicit "above and beyond" language if you want more than the literal minimum:

```
Create an analytics dashboard. Include as many relevant features
and interactions as possible. Go beyond the basics to create a
fully-featured implementation with data visualization, filtering
capabilities, and export functions.
```

Without this language, Claude 4.x will build exactly what you ask — which for "create an analytics dashboard" means a frame with a title and nothing else.

---

## Agent Orchestration Patterns

### Ask vs act decision gates

**Proactive-by-default:**
```xml
<default_to_action>
Implement changes rather than only suggesting them. If the user's
intent is unclear, infer the most useful likely action and proceed,
using tools to discover missing details instead of guessing.
</default_to_action>
```

**Conservative-by-default:**
```xml
<do_not_act_before_instructions>
Default to providing information, research, and recommendations
rather than taking action. Only proceed with edits when the user
explicitly requests them.
</do_not_act_before_instructions>
```

### Destructive operation gates

Regardless of overall autonomy level:

```
Actions that require confirmation before proceeding:
- Destructive operations: deleting files/branches, dropping tables
- Hard to reverse: git push --force, git reset --hard
- Visible to others: pushing code, commenting on PRs/issues

When encountering obstacles, do not use destructive actions
as a shortcut.
```

### Error retry limits

```
If a command fails twice with the same error, stop and try a
different approach. Never retry the same command more than twice
without modification. When encountering persistent errors,
document the error and ask for guidance.
```

### Multi-context-window state management

For long-running tasks that span multiple context windows:

**First context window:** Set up framework — tests, setup scripts, task structure. Write a structured state file (JSON or markdown) defining success criteria.

**Subsequent context windows:** Start with prescriptive initialization:

```
Call pwd. Review progress.txt, tests.json, and the git logs.
Run the integration test before implementing new features.
```

Track state through three complementary mechanisms:
- **Structured formats** (JSON) for task status and test results
- **Unstructured text** (markdown) for progress notes and decision rationale
- **Git** for code state tracking and checkpoints

Prefer starting fresh context windows over compacting degraded context. Claude's latest models are effective at discovering state from the local filesystem.
