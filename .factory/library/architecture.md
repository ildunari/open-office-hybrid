# Architecture

Architecture facts and decisions relevant to this mission.

**What belongs here:** shared runtime contracts, host-specific architecture notes, important truthfulness constraints.  
**What does NOT belong here:** step-by-step feature status; use mission artifacts.

---

- Primary execution surfaces for this mission:
  - `packages/sdk/src/runtime.ts`
  - `packages/sdk/src/hooks/**`
  - `packages/sdk/src/planning/**`
  - `packages/word/src/lib/**`
  - `packages/bridge/src/**`
  - `packages/core/src/chat/**`
  - `packages/sdk/tests/word-benchmark/**`
- Current validated planning truth:
  - foundational hardening already landed on `main`
  - remaining highest-leverage gaps are execution-contract bugs and truthfulness gaps, not a broad redesign
- Treat `docs/plans/codex-word-agent-loop-hardening.patch` as candidate actions only.
- Prefer contract fixes over symptom patches:
  - bounded read/write coherence
  - same-run steering
  - truthful blocked/resume/verification surfaces
  - Hybrid-only live-review targeting and evidence consistency
- Prompt/framework hardening priorities:
  - provider-aware prompt shaping instead of one generic instruction blob
  - phase-aware injection for mutation, reviewer/live-review, and blocked/resume states
  - active doctrine loading for Word editing (`word-mastery-v3`, `openword-best-practices`) and provider prompting (`prompt-architect`, `gpt-prompt-architect`)
  - prompt provenance that explains which prompt layers actually governed a run
