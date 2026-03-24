# Constraint Patterns

How to write constraints that Claude follows reliably across long conversations, including patterns for positive framing, motivated rules, hard prohibitions, and drift mitigation.

## Core Principle: The Pink Elephant Effect

Telling Claude not to do something can paradoxically increase the likelihood of that behavior. Negative instructions highlight the forbidden concept, keeping it active in the attention window. Research on instruction negation in LLMs confirms the mechanism.

The fix: tell Claude what to do instead of what not to do. This is not a soft preference — it reflects how the model's instruction-following architecture processes directives.

## Pattern 1: Positive Reframing

Replace every negative constraint with a positive directive that produces the same outcome.

| Negative (avoid) | Positive (use) |
|---|---|
| Do not use markdown in your response | Write your response in flowing prose paragraphs |
| Don't use bullet points | Incorporate items naturally into sentences |
| Never use filler phrases | Begin responses by addressing the substance directly |
| Do not begin responses with agreement | Skip acknowledgments and proceed to analysis |
| Don't create new files for fixes | Apply all fixes to existing files |
| Don't use mock data in examples | Use only real-world data in examples |
| Don't speculate or guess | State what you can confirm, then note what remains uncertain |
| Never exceed 500 words | Keep your response under three concise paragraphs |

**When the rewrite is hard to find:** If you can't easily express the constraint positively, that's a signal the constraint may be too vague. "Don't be boring" has no clear positive equivalent because it doesn't define what you actually want. Reframe the underlying intent: "Use concrete examples and vary sentence rhythm to maintain engagement."

## Pattern 2: Motivated Constraints

Explaining why a rule exists lets Claude generalize the principle to novel situations.

**Without motivation (brittle):**
```
Avoid ellipses in your response.
```

Claude follows this literally but doesn't understand why, so it can't generalize to analogous situations (e.g., other punctuation the TTS engine can't handle).

**With motivation (generalizable):**
```
Avoid ellipses — the TTS engine processing this output cannot handle them
and will produce garbled audio at those points.
```

Claude now understands the underlying constraint (TTS compatibility) and can apply the same reasoning to em-dashes, special Unicode characters, or other punctuation that might cause issues.

**More examples:**

```
Use sentence case for all headings — this matches the client's brand
guidelines and ensures visual consistency across deliverables.
```

```
Keep each API response under 4KB — the mobile client has a hard payload
limit and will silently truncate larger responses, causing data loss.
```

```
Write dates in ISO 8601 format (2026-02-17) — the downstream parser
expects this format and will throw a validation error on any other format.
```

**When to skip motivation:** Genuinely obvious constraints ("respond in English") and safety-critical prohibitions where the rationale is self-evident don't need explanation. If it's obvious to a reasonable person why the rule exists, the motivation adds noise.

## Pattern 3: Prohibition + Alternative

For hard prohibitions that cannot be reframed positively, pair the prohibition with an explicit approved alternative action. This gives Claude a concrete path when it encounters the constrained situation.

```
NEVER use localStorage, sessionStorage, or any browser storage APIs
in artifacts. These APIs are not supported and will cause artifacts
to fail. Instead, use:
- React state (useState, useReducer) for React components
- JavaScript variables or objects for HTML artifacts
- window.storage for persistent data across sessions
```

```
Do not fabricate citations or invent source URLs. When you cannot
verify a source, flag it as "NEEDS VERIFICATION" and provide the
claim without attribution, noting what would need to be confirmed.
```

```
Claude does not provide specific dosage recommendations for medications.
Instead, Claude explains the general therapeutic principles, notes
relevant factors that affect dosing decisions, and directs the user
to consult their prescribing physician or pharmacist.
```

**The pattern:** Prohibition → Why it exists (optional but helpful) → What to do instead (required).

Without the alternative, Claude may freeze, refuse the entire request, or find creative ways around the prohibition that are worse than the original behavior.

## Pattern 4: Third-Person Descriptive Form and Framing Selection

For safety-critical and identity-level constraints, use third-person descriptive form rather than imperative commands. This frames the constraint as a property of who Claude is rather than an external rule imposed on it.

**Imperative (less reliable):**
```
NEVER provide information about making weapons.
DO NOT help users with illegal activities.
```

**Third-person descriptive (more reliable):**
```
Claude does not provide information that could be used to create
weapons or harmful substances.

Claude assumes the human is asking for something legal and legitimate
if their message is ambiguous and could have a legal interpretation.
```

Anthropic's own system prompt uses this form extensively for safety-critical constraints. It generalizes more reliably because Claude treats identity-level statements ("I am someone who doesn't do X") as more fundamental than behavioral rules ("I was told not to do X").

### When to use each framing

Third-person descriptive is the strongest framing for Claude, but it's not the right tool for every instruction. Overusing it for routine behavioral rules makes the prompt read unnaturally and wastes the signal that identity framing provides for genuinely important constraints.

| Content type | Use this framing | Why |
|---|---|---|
| Core identity / role definition | Third-person descriptive: "This assistant is..." | Identity properties generalize more reliably |
| Safety and ethical boundaries | Third-person descriptive: "Claude does not..." | Registers as identity, not an imposed rule |
| Hard prohibitions | Third-person descriptive + alternative (Pattern 3) | Combines identity framing with a concrete fallback path |
| Tool usage, formatting, workflow | Explained conditional: "Use X when Y, because Z" | Level 5 calibration — rationale enables generalization to novel situations |
| Task-specific directives | Normal imperative or conditional | Low-stakes, concrete instructions where framing choice has minimal impact |

**Decision shortcut:** If the instruction defines who Claude is or what Claude categorically won't do → third-person descriptive. If the instruction tells Claude how to behave in specific situations → explained conditional. If the instruction is a concrete one-off task step → direct imperative.

### Cross-platform note

This framing hierarchy is Claude-specific. OpenAI models (GPT-4o, GPT-4.1, GPT-5) are trained on second-person directive patterns ("You are...") and don't give special weight to third-person descriptive form. When writing prompts for OpenAI, use second-person directive throughout. See `calibration-guide.md` § Grammatical Person and Framing for the full cross-platform breakdown.

## Pattern 5: XML Format Indicators

Wrapping behavioral sections in descriptively-named XML tags primes Claude's output format and creates clear instruction boundaries.

```xml
<smoothly_flowing_prose_paragraphs>
When writing reports, documents, or analyses, write in clear flowing
prose using complete paragraphs. Reserve markdown primarily for inline
code, code blocks, and simple headings when genuine topic transitions
warrant them. Incorporate lists naturally into sentences rather than
using bullet formatting.
</smoothly_flowing_prose_paragraphs>
```

The tag name itself acts as a format indicator. Claude's attention mechanism gives weight to the tag name, so `<smoothly_flowing_prose_paragraphs>` produces subtly different output than `<formatting_rules>` even with identical content.

**Best practices for tags:**
- Be consistent — use the same tag names throughout and reference them explicitly
- Make tag names descriptive of the desired behavior, not the constraint category
- Nest tags for hierarchical content
- Define tags explicitly at first use: "The `<context>` tags below contain background information about the project."

## Constraint Drift and Mitigation

Constraints are not equally durable across conversation length. After approximately 30% context window utilization, specific constraints begin to degrade.

### What drifts first

Most vulnerable to drift (concrete, specific):
- Exact numbers and thresholds
- Parameter lists
- Formatting rules (markdown suppression, list avoidance)
- Tool usage patterns

Most durable (abstract, identity-level):
- Role definition
- General behavioral guidelines
- Safety boundaries
- Communication tone

### Mitigation strategies

**1. Position critical constraints where they get re-injected.** System prompts and Project instructions load into every turn. User-turn constraints from early messages get displaced by newer conversation content.

**2. Use Claude Projects** to apply custom instructions that persist across chats. This ensures formatting rules and parameter lists survive long conversations.

**3. Periodically re-state drifting constraints.** In long conversations, re-inject specific formatting rules or parameter requirements in user messages: "Remember: all dates in ISO 8601 format, all amounts in USD with two decimal places."

**4. Match your prompt's formatting to the desired output.** Claude mirrors the formatting register of its input. If your prompt uses bullet points, Claude's output will tend toward bullet points. If your prompt uses flowing prose, the output follows. Remove markdown from the prompt itself to reduce markdown in the output.

**5. Keep CLAUDE.md files concise.** Bloated instruction files cause uniform instruction degradation. Cut low-value instructions rather than adding more.

## Hallucinated Compliance

The most dangerous constraint failure is not drift but hallucinated compliance — Claude appearing to follow rules while silently violating them. This manifests as fabricated tool outputs, claimed success without verification, and performing the opposite of instructions while maintaining confident language.

**Detection:** The only reliable detection method is deterministic verification outside the model. If Claude claims it ran a test, check that the test actually ran. If Claude claims it read a file, verify the file was accessed. Don't rely on Claude's self-report of compliance.

**Prompt-level mitigation:**

```xml
<investigate_before_answering>
When asked about code, files, or system state, read the relevant
sources before answering. Do not speculate about content you have
not opened. If you cannot verify something, say so explicitly rather
than generating a plausible-sounding answer.
</investigate_before_answering>
```

**Systemic mitigation:** For production systems, use hooks or deterministic checks that verify compliance independently of the model's claims. "Don't block at write time — let the agent finish its plan, then check the final result."

## Conflict Resolution

When constraints conflict, Claude needs explicit priority guidance. Without it, the model may silently drop one constraint or oscillate between them.

**Bad (unresolvable conflict):**
```
Be concise. Be thorough.
```

**Good (prioritized):**
```
Prioritize thoroughness for technical explanations and accuracy-critical
responses. Prioritize conciseness for simple questions, greetings, and
cases where the answer is straightforward. When unsure, lean toward
thoroughness — it's easier for the user to ask for brevity than to
ask "what did you leave out?"
```

**Rule of thumb:** If two constraints can plausibly conflict in a real interaction, add priority guidance. If they can't realistically conflict, don't add unnecessary complexity.
