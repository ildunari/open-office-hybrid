# User Testing

Validation surface findings, tools, and concurrency guidance.

**What belongs here:** live validation surfaces, evidence expectations, environment blockers, concurrency limits for validators.  
**What does NOT belong here:** implementation plans or feature state.

---

## Validation Surface

### Primary live surface
- Hybrid Word via bridge-first workflow on `https://localhost:4018`
- Preferred evidence:
  - `office-bridge state`
  - `office-bridge summary`
  - `office-bridge diag`
  - `office-bridge events`
  - `office-bridge metadata`
  - targeted tool reads
  - screenshots / screenshot diffs

### Secondary surface
- Taskpane/UI automation only where bridge-first evidence cannot answer the question.

### Constraints
- Never target the Dev add-in.
- Prefer explicit `word:<session-id>` or `--document <document-id>` routing.
- For mutable live Word fixtures, use OneDrive-backed copies under `/Users/Kosta/Library/CloudStorage/OneDrive-BrownUniversity/Brown University/Temp`.
- If a checked-in repo fixture is the source document, copy it into that OneDrive temp directory before live validation instead of mutating the repo copy in place.
- If no Hybrid session is connected, continue code/test validation and defer live assertions until the session is available.

## Validation Concurrency

### Bridge-first Hybrid validation
- Max concurrent validators: 1
- Rationale:
  - live Hybrid Word validation depends on a single real pane/session target
  - concurrent validators risk session collision and false signals
  - current machine has 12 CPU cores and 64 GB RAM, but the limiting factor here is session isolation, not hardware headroom

### Automated test validation
- Max concurrent validators: 2
- Rationale:
  - the machine has enough hardware headroom for more, but this mission touches shared package tests and a monorepo build graph
  - keep concurrency conservative to reduce noisy failures while workers perform targeted Vitest runs
