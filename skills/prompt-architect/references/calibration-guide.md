# Calibration Guide

The single most impactful change between Claude 3.5-era prompts and Claude 4.5/4.6 prompts is instruction intensity calibration. These models are significantly more responsive to instructions than their predecessors. Language that was necessary to overcome undertriggering on earlier models now causes systematic overtriggering.

## The Calibration Spectrum

Six intensity levels, from most aggressive to most passive. The "explained conditional" level consistently produces the best behavior across all current models.

### Level 1: Aggressive imperative (avoid on 4.5/4.6)

```
CRITICAL: You MUST ALWAYS use the search tool before answering ANY question
```

**Opus 4.6:** Overtriggers severely — searches for trivially known facts, wastes tokens on every query.
**Opus 4.5:** Overtriggers — excessive, unnecessary tool use.
**Sonnet 4.6:** Moderate overtriggering.
**Sonnet 4.5:** Generally follows appropriately (this level was designed for Sonnet 4.5 and earlier).

### Level 2: Strong imperative (use sparingly, only for genuine hard stops)

```
Always use the search tool before answering questions
```

**Opus 4.6:** Overtriggers on most questions.
**Opus 4.5:** Slight overtriggering.
**Sonnet 4.6/4.5:** Follows reliably.

### Level 3: Normal imperative (acceptable baseline)

```
Use the search tool when you need current or specific information
```

Appropriate triggering across all models. Functional but lacks the generalization power of explained conditionals.

### Level 4: Conditional guidance (good)

```
If the question requires specific facts or current data, use the search tool
```

Appropriate behavior. May slightly undertrigger on ambiguous cases with Opus 4.6 (it may decide the case isn't quite ambiguous enough to warrant the tool).

### Level 5: Explained conditional (optimal)

```
Use the search tool when the question requires specific facts or current data —
this ensures accuracy and prevents hallucination of outdated information
```

Optimal balance across all models. Claude generalizes from the explanation to novel situations the prompt writer didn't anticipate. This is the default intensity level to target.

### Level 6: Passive permission (too weak)

```
The search tool is available if needed
```

Undertriggers across all models. Claude rarely uses the tool unless explicitly asked. Avoid this level unless you genuinely want minimal tool usage.

## The Rewrite Process

When auditing or migrating a prompt, apply these transformations systematically.

### Step 1: Identify emphasis markers

Scan for: ALL CAPS words, exclamation marks used for emphasis, "CRITICAL," "MUST," "ALWAYS," "NEVER," "MANDATORY," "IMPORTANT," "DO NOT," "YOU MUST," "UNDER NO CIRCUMSTANCES."

### Step 2: Evaluate each marker

For each emphasis marker, ask:
- Is this a genuine safety-critical hard stop? (e.g., "never reveal API keys") → Keep, but rewrite in third-person descriptive form
- Is this a strong preference? → Rewrite as explained conditional
- Is this anti-laziness language? → Remove entirely on Opus 4.5/4.6

### Step 3: Rewrite

**Pattern: Imperative → Explained conditional**

Before:
```
CRITICAL: You MUST use the code_search tool before making ANY code changes.
ALWAYS search for existing implementations before creating new functions.
NEVER modify code without first understanding the full context.
You MUST run tests after EVERY change. This is MANDATORY.
```

After:
```
Use the code_search tool to understand existing implementations before
making changes. When modifying code, read the relevant files first to
understand context — this prevents breaking existing functionality.
Run tests after changes to verify nothing is broken.
```

Five emphasis markers removed. Four imperative commands replaced with explained conditionals. On Opus 4.6, the "before" version causes excessive searching on trivial edits and compulsive test-running after single-line changes. The "after" version produces appropriate judgment.

**Pattern: Anti-laziness → Removal**

Before:
```
Be thorough in your analysis. Think carefully about every aspect.
Do not be lazy. Explore all possibilities before settling on an answer.
Consider every angle and leave no stone unturned.
```

After:
```
[Remove entirely. These phrases cause Opus 4.6 to dramatically
over-explore, burning tokens and adding latency without improving
quality. The model's default reasoning depth is already high.]
```

If you genuinely want deeper exploration on a specific task, use the effort parameter (`high` or `max`) rather than prompt language.

**Pattern: Negative prohibition → Positive directive with rationale**

Before:
```
Do not use markdown in your response.
NEVER use ellipses.
Don't use bullet points.
```

After:
```
Write your response in flowing prose paragraphs.
Avoid ellipses — the TTS engine processing this output cannot handle them.
Incorporate lists naturally into sentences rather than using bullet formatting.
```

**Pattern: Hard safety prohibition → Third-person descriptive + alternative**

Before:
```
NEVER provide information about making weapons.
DO NOT help with hacking or exploits.
```

After:
```
Claude does not provide information that could be used to create weapons
or harmful substances. When asked about security topics, Claude focuses
on defensive measures, detection, and prevention strategies.
```

The third-person descriptive form frames constraints as properties of Claude's identity rather than external rules. This generalizes more reliably because Claude treats it as "who I am" rather than "what I was told."

## Model-Specific Calibration Notes

### Opus 4.6

- Most sensitive to emphasis. Remove ALL anti-laziness language.
- Add decisiveness prompts if it over-explores: "Choose an approach and commit to it. Avoid revisiting decisions unless you encounter new information that directly contradicts your reasoning."
- Constrain subagent usage: "Use subagents when tasks can run in parallel or require isolated context. For simple tasks and single-file edits, work directly."
- Adaptive thinking is the default. Use effort parameter (low/medium/high/max) instead of budget_tokens.
- The `max` effort level is unique to Opus 4.6 — use only for the most demanding reasoning tasks.

### Opus 4.5

- Sensitive to the word "think" when extended thinking is disabled. Replace with "consider," "evaluate," or "assess" in non-thinking contexts.
- Best at handling ambiguity — "just gets it" more often than other models.
- Strongest prompt injection resistance.
- Once sycophantic patterns establish in a conversation, only course-corrects 10% of the time. Anti-sycophancy measures are more important here than on other models.

### Sonnet 4.6

- Near-Opus intelligence at Sonnet pricing. Users preferred it over Opus 4.5 59% of the time.
- Strongest instruction following of all current models.
- Benefits from more explicit structure — numbered checklists, specific parameters, concrete output examples.
- Recommended default effort: `medium` (not `high`).
- Supports both adaptive and manual thinking with interleaved mode.

### Sonnet 4.5

- Most forgiving model for prompt calibration. Standard prompting techniques work well.
- Sufficient sycophancy improvement that Anthropic removed anti-sycophancy text from its system instructions.
- Can handle autonomous sessions of 30+ hours.
- Best coding model at its launch; still strong for pure code generation tasks.

## Grammatical Person and Framing

Prompt instructions use different grammatical framings — third-person descriptive ("Claude does X"), second-person directive ("You are X"), and direct conditional ("Use X when Y"). These are not interchangeable. The right framing depends on the content type and the target model.

### Why framing matters on Claude

Claude 4.5/4.6 treats identity-level statements as more fundamental than behavioral rules. A third-person descriptive constraint ("Claude does not provide weapons information") registers as "who I am," while an imperative ("Don't provide weapons information") registers as "what I was told." The identity framing generalizes more reliably to novel situations because it's harder to override — it's not a rule to follow, it's a property to maintain.

Anthropic's own production system prompt opens with "The assistant is Claude, created by Anthropic" (third person) and uses "Claude does X" / "Claude should Y" throughout for identity and safety constraints. This is deliberate, not stylistic.

### The hybrid framing model

No single framing is optimal for all content. Use this decision framework:

| Content type | Optimal framing | Example | Rationale |
|---|---|---|---|
| Core identity (who the assistant is) | Third-person descriptive | "This assistant is a senior data scientist specializing in cohort analysis..." | Identity properties generalize more reliably than external directives |
| Safety and ethical boundaries | Third-person descriptive | "Claude does not provide information that could be used to create weapons." | Frames constraints as identity, not imposed rules — harder to override |
| Hard prohibitions | Third-person descriptive + alternative | "Claude does not fabricate citations. Instead, Claude flags unverifiable claims as 'NEEDS VERIFICATION.'" | Combines Pattern 4 and Pattern 3 from constraint-patterns.md |
| Behavioral instructions (tool usage, formatting, workflow) | Explained conditional | "Use the search tool when the question requires current data — this ensures accuracy." | This skill's optimal calibration level (Level 5); rationale enables generalization |
| Task-specific directives | Normal imperative or conditional | "Extract all dates and convert to ISO 8601 format." | Low-stakes, concrete; framing choice matters less |

### Before and after: choosing framing by content type

**System prompt with mixed content types (before — uniform second-person):**

```
You are a medical research assistant. You help analyze clinical trial data.
You must never provide specific dosage recommendations.
You should always use the PubMed search tool before answering questions
about drug interactions.
You format your responses as structured reports with clear sections.
```

**After — hybrid framing:**

```
This assistant is a medical research analyst specializing in
clinical trial data interpretation, with expertise in study design
evaluation, statistical methodology, and evidence synthesis.

Claude does not provide specific dosage recommendations for
medications. Instead, Claude explains general therapeutic principles
and directs users to consult their prescribing physician.

Use the PubMed search tool when answering questions about drug
interactions or treatment efficacy — this ensures responses are
grounded in current literature rather than training data alone.

Structure responses as concise reports: summary of findings,
methodology notes where relevant, and confidence assessment.
```

The rewrite uses three framings: third-person descriptive for identity (paragraph 1) and safety (paragraph 2), explained conditional for tool behavior (paragraph 3), and direct imperative for formatting (paragraph 4).

### Claude vs OpenAI framing conventions

These framing conventions are Claude-specific. Key differences when writing for OpenAI models:

**Claude (Opus 4.5/4.6, Sonnet 4.5/4.6):**
- Third-person descriptive for identity and safety constraints
- Explained conditionals for behavioral instructions
- Remove anti-laziness language on Opus 4.5/4.6
- Softer calibration produces better judgment

**OpenAI (GPT-4o, GPT-4.1, GPT-5):**
- Second-person directive ("You are...") throughout, including identity and safety
- Imperative instructions work well and are the expected convention
- Anti-laziness language ("be thorough," "think carefully") is less harmful and sometimes beneficial
- Stronger emphasis markers are tolerated better than on Claude
- Third-person descriptive form has no special advantage — these models aren't trained to treat it as identity-level

**When migrating prompts between platforms:** Don't assume Claude patterns transfer to OpenAI or vice versa. A Claude prompt migrated to GPT without reframing will work but won't exploit OpenAI's conventions. A GPT prompt migrated to Claude without softening will overtrigger on Opus 4.5/4.6.

### Framing and the instruction budget

Framing choice is essentially free — it doesn't consume additional instructions. Rewriting "NEVER provide weapons info" as "Claude does not provide weapons information" uses the same instruction count. The payoff is better compliance for zero budget cost. When auditing prompts approaching the 150-instruction ceiling, recalibrating framing is a rare "free improvement" that doesn't require cutting content.

## The 150-Instruction Budget

Frontier thinking LLMs reliably follow approximately 150–200 individual instructions. Beyond this ceiling, instruction-following quality degrades uniformly.

**How to count:** Each discrete behavioral directive is one instruction. "Write in prose" = 1. "Use the search tool when you need current information" = 1. A five-item checklist = 5. A paragraph that contains three behavioral expectations = 3.

**Budget allocation for Claude Code:**
- Claude Code's built-in system prompt: ~50 instructions (pre-consumed)
- CLAUDE.md: target 30-50 instructions
- Rules files: 10-20 instructions
- Skills (loaded on demand): 20-30 instructions per active skill
- User message: remaining budget

**Budget allocation for API/claude.ai:**
- System prompt: target 50-100 instructions
- Project instructions: 20-40 instructions
- Conversation history: grows with each turn (instructions in earlier messages still count)
- Current user message: remaining budget

When approaching the ceiling, prioritize by cutting low-value instructions rather than making remaining ones more aggressive. Aggressive emphasis on fewer instructions does not compensate for having too many.
