# Environment

Environment variables, external dependencies, and setup notes.

**What belongs here:** env vars, bridge/auth expectations, host-specific setup notes, session availability constraints.  
**What does NOT belong here:** service ports or commands; use `.factory/services.yaml`.

---

- Mission worktree: `/Users/Kosta/worktrees/office-agents-hybrid/codex-word-system-polish`
- Hybrid validation target:
  - dev server `https://localhost:3003`
  - bridge `https://localhost:4018`
- Do not target the Dev Word add-in on `3002`.
- At mission start, bridge and dev server were listening but `office-bridge --url https://localhost:4018 list --json` returned no connected sessions.
- Live validation may therefore be blocked by pane/session availability rather than repo setup.
