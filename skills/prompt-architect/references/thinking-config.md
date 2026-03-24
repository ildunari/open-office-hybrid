# Thinking Configuration

How to configure and steer Claude's extended thinking across the 4.5/4.6 model family. The core insight: high-level thinking instructions produce better reasoning than step-by-step prescriptions.

## Thinking Modes by Model

| Model | Thinking mode | Configuration | Default effort |
|---|---|---|---|
| Opus 4.6 | **Adaptive** (`thinking: {type: "adaptive"}`) | Effort parameter: low / medium / high / **max** | high |
| Opus 4.5 | Manual | `budget_tokens` (up to 64K) | high |
| Sonnet 4.6 | Both adaptive and manual (interleaved) | Effort parameter: low / **medium** / high | medium |
| Sonnet 4.5 | Manual | `budget_tokens` | N/A |

### Adaptive thinking (Opus 4.6)

The model dynamically decides when and how much to think based on the effort parameter and query complexity. This replaces the manual `budget_tokens` approach and produces better performance than manually-set budgets.

**Effort levels:**
- **low** — Skip thinking on simple queries. Respond directly for straightforward requests. Use for high-volume, simple-response applications.
- **medium** — Think selectively. Good balance for mixed workloads where some queries need reasoning and some don't.
- **high** (default) — Almost always engages deep thinking. Appropriate for complex reasoning, analysis, and multi-step problems.
- **max** (Opus 4.6 only) — Removes all constraints on token spending. Use only for the most demanding reasoning tasks: novel mathematical proofs, complex multi-file architectural analysis, subtle logical chains.

**Key insight:** Effort is a behavioral signal, not a strict token budget. At lower effort levels, Claude will still think on sufficiently difficult problems — it just thinks less. You don't need to worry about hobbling Claude on hard tasks by using medium effort.

### Manual thinking (Opus 4.5, Sonnet 4.5)

Set `budget_tokens` to control the maximum thinking budget. Claude uses up to this many tokens for internal reasoning before producing a response. Maximum 64K tokens.

### Steering thinking frequency

If Claude is thinking too often (adding latency on simple queries):

```
Extended thinking adds latency and should only be used when it
will meaningfully improve answer quality — typically for problems
requiring multi-step reasoning, complex analysis, or careful
evaluation of multiple factors. When in doubt, respond directly.
```

If you always want deep reasoning:

Increase effort to `high` or `max` and use language that invites reflection:
```
Reflect carefully on this before responding.
Consider this from multiple angles.
```

### Claude Code thinking triggers

In Claude Code, thinking depth is triggered by specific phrases that map to increasing budget levels:

```
"think"        → baseline thinking budget
"think hard"   → elevated budget
"think harder"  → high budget
"ultrathink"   → maximum budget
```

Each phrase allocates progressively more internal reasoning tokens.

## The Counterintuitive Rule

**High-level instructions produce better reasoning than step-by-step prescriptions.**

Claude's creativity in approaching problems often exceeds a human's ability to prescribe the optimal thinking process. Constraining thinking to a specific sequence limits the model's ability to find the best approach.

**Prescriptive (worse results):**
```
Think through this math problem step by step:
1. First, identify the variables
2. Then, set up the equation
3. Next, solve for x
4. Finally, verify your answer
```

**High-level (better results):**
```
Think about this math problem thoroughly and in great detail.
Consider multiple approaches and show your complete reasoning.
Try different methods if your first approach doesn't work.
```

The prescriptive version forces a single approach. The high-level version lets Claude discover the best approach for the specific problem.

**When prescriptive thinking IS appropriate:** When you need Claude to follow a specific methodology (e.g., a regulatory compliance checklist, a specific diagnostic protocol). In these cases, the thinking process is part of the requirements, not just a means to an answer.

## Anti-Patterns

### Never pass thinking output back

Never pass Claude's extended thinking output back in a user text block. This doesn't improve performance and may degrade results. The thinking is for Claude's internal use only.

### Prefilling thinking is prohibited

Attempting to prefill extended thinking (putting content in the assistant turn before the thinking block) is explicitly prohibited and will return errors on Opus 4.6 and Sonnet 4.6.

### Don't use "think step-by-step" with Extended Thinking enabled

When Extended Thinking is enabled, manual Chain-of-Thought prompting ("think step-by-step") wastes tokens. The dedicated thinking mechanism supersedes manual CoT. The tokens spent on generating CoT in the response body are wasted when the model has already reasoned internally.

### Don't modify output text after thinking

Claude's response is conditioned on its thinking. Manually changing the output text after a thinking block (in multi-turn contexts) degrades results because the subsequent response is built on reasoning that no longer matches the visible output.

### Opus 4.5 "think" word sensitivity

When Extended Thinking is disabled on Opus 4.5, the word "think" and its variants can inadvertently trigger internal reasoning that adds latency and cost. Replace with:

| Avoid | Use instead |
|---|---|
| "Think about..." | "Consider..." |
| "Think through..." | "Evaluate..." |
| "I think..." | "I believe..." / "I assess..." |
| "Think carefully" | "Examine carefully" |

This sensitivity does not affect Opus 4.6 (which uses adaptive thinking) or Sonnet models.

## Few-Shot Examples and Thinking

Few-shot examples can shape how Claude uses its thinking budget. Including examples with `<thinking>` or `<scratchpad>` tags demonstrates reasoning patterns that Claude generalizes to its formal extended thinking.

However, this technique should be tested against unconstrained thinking for each use case. In many cases, giving Claude free rein produces better results than constrained thinking patterns.

## Interaction with Over-Refusal

Extended thinking can amplify over-refusal in sensitive domains. More reasoning steps give the model more opportunities to talk itself into refusing a legitimate request. If you observe increased refusals on clearly legitimate requests, reducing the effort parameter is the most direct mitigation.

## Prompt Implications

When configuring prompts that will run with Extended Thinking:

1. **Set the effort parameter, not the thinking instructions.** Let the effort level control thinking depth. Reserve prompt-level thinking instructions for genuinely unusual requirements.
2. **Don't fight the model's thinking style.** If Claude wants to think about a problem differently than you prescribed, that's usually a signal it has found a better approach.
3. **Use the right effort for the task.** Medium is appropriate for most Sonnet tasks and many Opus tasks. Reserve high/max for genuinely complex reasoning.
4. **Monitor for over-refusal.** If the prompted system handles sensitive-adjacent domains, test with representative inputs and adjust effort downward if refusals are excessive.
