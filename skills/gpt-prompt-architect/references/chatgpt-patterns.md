# ChatGPT Custom Instructions & Custom GPTs

Reference for writing and optimizing prompts on ChatGPT's consumer surfaces. Load when working on Custom Instructions or Custom GPT system prompts.

---

## ChatGPT Custom Instructions

### Architecture

Custom Instructions consist of two text fields, each capped at **1,500 characters**:

1. **"What would you like ChatGPT to know about you?"** — Context about the user: profession, background, preferences, domain knowledge. This is the *identity* field.
2. **"How would you like ChatGPT to respond?"** — Behavioral directives: tone, format, verbosity, output style. This is the *behavior* field.

Combined budget: **3,000 characters** (~500 words, ~750 tokens). This is tight. Every character matters.

Custom Instructions apply to **all conversations** and sync across web, desktop, and mobile. They cannot be toggled per-conversation (use Temporary Chat to bypass them entirely).

### Relationship with Memory

Custom Instructions and Memory serve different purposes:

| Feature | Custom Instructions | Memory |
|---|---|---|
| Scope | All conversations | All conversations |
| Content type | Evergreen guidance (tone, format, conventions) | Dynamic facts (current project, recent decisions, personal details) |
| Persistence | Until manually changed | Until manually deleted or auto-expired |
| Character limit | 1,500 per field | No fixed limit per memory, but total memories are bounded |
| User control | Direct editing in settings | "Remember X" / "Forget X" in conversation |

**Rule of thumb:** If the information changes more than once a month, it belongs in Memory, not Custom Instructions. Custom Instructions are for *stable behavioral preferences*.

### Writing effective Custom Instructions

#### The identity field ("What would you like ChatGPT to know about you?")

This field establishes context that helps ChatGPT calibrate response depth, terminology, and assumptions.

**Prioritize information that changes how the model should respond:**

```
BME PhD student at Brown. Research: drug delivery systems, nanoparticle
synthesis, polymer chemistry. Comfortable with advanced biomedical
terminology — don't simplify scientific concepts. Also do hobby coding
(React, Python) but not a professional developer — explain software
architecture decisions.
```

**Anti-patterns:**
- Generic descriptions that don't change behavior: "I'm a curious person who likes learning." (This tells the model nothing actionable.)
- Overly specific personal details that aren't relevant to output quality: "I live at 123 Main St and my birthday is June 5th."
- Redundant context: "I'm a software engineer who writes code." (The model infers this from your questions.)

#### The behavior field ("How would you like ChatGPT to respond?")

This field sets behavioral constraints and output preferences.

**Prioritize high-impact directives:**

```
Direct and concise. No fluff or filler phrases ("Great question!",
"I'd be happy to help"). Skip warm-ups — start with the substance.
Short answers for simple questions, exhaustive with sources for
research. No emojis. Use sentence case. When presenting options,
mark recommended ones. Code blocks: close ``` on own line, blank
lines between blocks and prose.
```

**Character budget strategy:** You have 1,500 characters. Typical allocation:

- Core tone/style (40%): Communication preferences that apply everywhere
- Output format (30%): Default formatting, code conventions, structure preferences
- Prohibitions (20%): Things to never do — these are high-value because they prevent recurring annoyances
- Domain-specific (10%): Any field-specific calibration not covered in the identity field

**Anti-patterns:**
- Vague directives: "Be helpful and informative." (This is the default — you're wasting characters.)
- Contradictions with ChatGPT's defaults: "Be concise" stacked on top of ChatGPT's already-concise internal defaults can cause over-truncation. Be specific: "2–4 sentences for simple questions, full detail for complex topics" instead of just "be concise."
- Role-playing instructions: "You are a sarcastic pirate." (This belongs in a Custom GPT, not in instructions that apply to all conversations.)

### The model router caveat

ChatGPT routes prompts to different model variants based on complexity. Simple prompts may be handled by faster, less capable variants. This has implications for Custom Instructions:

- Instructions that require deep reasoning or nuanced judgment may not be fully honored on simpler prompts routed to lighter models
- Format-level instructions (output structure, code conventions) are generally respected regardless of routing
- If you notice inconsistent behavior between simple and complex questions, the router is likely the cause — not your instructions

You cannot directly control the router from Custom Instructions. The workaround: make your prompts substantive enough to trigger the full model when it matters.

---

## Custom GPTs

### Architecture

Custom GPTs have three configuration surfaces:

1. **Instructions** (~8,000 character limit): The system prompt. This is the primary prompt engineering surface.
2. **Knowledge files** (up to 20 files): Uploaded documents that the GPT can reference via chunked RAG retrieval. **Non-deterministic** — the model may not retrieve relevant chunks, or may retrieve irrelevant ones.
3. **Tool toggles**: Browse, Code Interpreter, DALL-E, and custom Actions (external API calls).

### The knowledge file reliability problem

This is the single most important caveat for Custom GPT builders: **knowledge file retrieval is unreliable and non-deterministic.**

What this means in practice:
- The model chunks and indexes uploaded files using internal RAG. At any given time, it only sees a fraction of the uploaded content.
- Retrieval is context-dependent — the same question asked differently may retrieve different chunks, or no chunks at all.
- The model may fall back to its general knowledge rather than retrieving from your files, even when instructed otherwise.
- Large knowledge bases (multiple files, hundreds of pages) are particularly unreliable.
- This behavior is inconsistent across conversation turns and across sessions.

**Practitioner-confirmed patterns (from OpenAI forums and Reddit):**
- Uploaded files sometimes stop being accessible with no change to the GPT configuration
- CSV and structured data files are less reliably retrieved than prose documents
- The model can read files that are manually attached to a message more reliably than files in the knowledge base
- No version control — changes to knowledge files take effect immediately with no rollback

### Designing around knowledge file unreliability

**Strategy 1: Instructions-first.** Put critical information directly in the instructions field, not in knowledge files. The instructions field is always loaded — knowledge files are probabilistically loaded.

**Strategy 2: Explicit retrieval instructions.** Tell the model when to check knowledge files:

```
Before answering any product question, search your knowledge files for
relevant information. If the knowledge files don't contain the answer,
say "I don't have that information in my reference materials" rather
than guessing.
```

**Strategy 3: Meta-instruction for long instruction sets.** If your instructions exceed ~4,000 characters and you need the rest available:

```
Your complete instructions are in full-instructions.md in your knowledge
base. Before each response, reference that file to ensure you follow all
guidelines. The instructions below are the critical subset — the knowledge
file contains the complete version.
```

**Caveat:** This pattern depends on knowledge file retrieval working, which is the exact problem. Use it as a supplement to instructions, not a replacement.

**Strategy 4: Keep knowledge files focused.** Fewer, smaller, well-structured files retrieve more reliably than many large files. One 10-page focused document beats ten 50-page reference manuals.

### Writing Custom GPT instructions

#### Structure

The ~8,000 character budget is generous compared to Custom Instructions but still requires discipline. Use CTCO:

```markdown
## Context
[What this GPT is and who it's for]
[Domain context that shapes every response]

## Task
[Primary function — what the GPT does]
[Secondary functions if applicable]

## Tool Usage
[When to use Browse — explicit triggers]
[When to use Code Interpreter — explicit triggers]
[When to reference knowledge files — explicit triggers]

## Constraints
[What the GPT should never do]
[Scope boundaries]
[Tone and style requirements]

## Output Format
[Default response format]
[Variations for different query types]
```

#### Tool invocation directives

Enabled tools are not automatically used — you need to instruct the GPT when to invoke them:

```
Use Browse when:
- The user asks about current events or recent information
- The user asks about pricing, availability, or status that may have changed
- You are unsure whether your knowledge is current

Use Code Interpreter when:
- The user provides data to analyze (CSV, numbers, datasets)
- The user asks for calculations, charts, or data visualizations
- You need to process or transform file contents

Reference knowledge files when:
- The user asks about [specific domain covered by your files]
- Before giving any recommendation about [topic] — check the files first
- When you're about to give advice, verify it against the reference materials
```

Without these directives, the model may not invoke tools that are enabled but not prompted for. This is a common Custom GPT bug — the builder enables Browse but the GPT never uses it because the instructions don't mention it.

#### Instruction attention degradation

The model's adherence to instructions degrades with length. Critical instructions should appear in the first ~2,000 characters. Structure accordingly:

1. **First 2,000 chars:** Identity, primary function, critical constraints, tool directives
2. **Middle:** Secondary behaviors, format preferences, domain-specific guidance
3. **Last 2,000 chars:** Examples, edge cases, fallback behaviors

If the GPT is "forgetting" instructions in long conversations, the instructions may be too long or the critical directives may be buried too deep.

#### Conversation starters

Custom GPTs support pre-defined conversation starters (the buttons users see when opening the GPT). Use these strategically:

- Make starters demonstrate the GPT's primary capabilities
- Include starters that trigger different tool usage patterns
- Use starters to set user expectations for what the GPT can and cannot do

### Anti-patterns for Custom GPTs

**Over-reliance on knowledge files for critical behavior.** If the GPT *must* know something to function correctly, put it in the instructions, not (only) in knowledge files.

**No tool invocation directives.** Enabling Browse/Code Interpreter/DALL-E without telling the GPT when to use them.

**Personality-heavy instructions.** "You are a warm, enthusiastic, deeply knowledgeable expert who loves helping people learn." This consumes characters and the model ignores most of it on GPT-5.x. Replace with: "Explain concepts clearly. Use analogies when introducing new topics. Ask what the user already knows before diving deep."

**Instruction-knowledge file conflicts.** Instructions say one thing, knowledge files contain contradictory information. The model may follow either. Keep them consistent, and when they might conflict, add: "When instructions and knowledge files conflict, follow the instructions."

**Missing scope boundaries.** Without explicit constraints, the GPT will attempt to answer questions outside its intended domain. Add: "If the user asks about [out-of-scope topic], explain that this GPT focuses on [in-scope topic] and suggest where they might find help."

---

## Character Limit Optimization Techniques

When you're fighting the 1,500-char limit (Custom Instructions) or need to pack more into 8,000 chars (Custom GPTs):

**Use shorthand consistently.** "No emojis. No filler. Start with substance." beats "Please do not use emojis in your responses. Avoid filler phrases. Begin each response by addressing the substance of the question."

**Combine related directives.** "Code: close ``` on own line, blank lines between blocks and prose, default to ```text unless syntax highlighting is needed" — one line covers three formatting rules.

**Prioritize prohibitions.** "Never" directives are higher-value per character than "always" directives because they prevent specific recurring problems. The model's default behavior handles most positive cases; prohibitions handle the exceptions.

**Remove directives that match the default.** If ChatGPT already does something by default, don't waste characters instructing it to do that thing. Test with a fresh conversation (no Custom Instructions) to see what the default behavior is, then only add instructions for things you want changed.

**Use Memory for context, Instructions for behavior.** "I work at Acme Corp on the marketing team" — this is context that Memory handles better. Save your instruction characters for behavioral directives.
