# Live Review

Hybrid live-review harness notes for this mission.

**What belongs here:** runner behavior, artifact expectations, mismatch boundaries, Hybrid-only targeting rules.

---

- The live-review runner is diagnostic infrastructure, not proof by itself that a mutation task succeeded.
- Reviewer-only success must never be treated as mutation success.
- Keep product/runtime failures separate from:
  - no session connected
  - wrong target / ambiguous session
  - harness/schema/reporting issues
- Key artifact expectations:
  - reviewer report
  - batch report
  - clone artifact
  - execution diagnostic when execution starts
- Highest-risk harness gaps identified during planning:
  - session consistency across metadata/state/events
  - Hybrid-only selection enforcement
  - exact reviewer tool-contract enforcement
  - mismatch logic confusing reviewer success with mutation success
