# @office-agents/core

`@office-agents/core` is the shared Svelte 5 chat UI layer for Office Agents.

It re-exports the headless SDK plus the generic chat interface used by the Excel, PowerPoint, and Word add-ins:

- `ChatInterface`
- `FilesPanel`
- `ErrorBoundary`
- app adapter types

## Key pieces

- `src/chat/chat-interface.svelte` — main taskpane chat shell
- `src/chat/chat-controller.ts` — runtime/controller wrapper over `AgentRuntime`
- `src/chat/app-adapter.ts` — app integration contract for Office-specific tools and UI
- `src/chat/settings-panel.svelte` — provider, OAuth, web tools, and skill management
- `src/chat/message-list.svelte` — assistant/user message rendering
- `src/sdk.ts` — SDK-only re-export surface for app packages and tests that need runtime helpers without importing the Svelte UI bundle

## AppAdapter

Each Office app passes an `AppAdapter` into `ChatInterface` to provide:

- app-specific tools
- system prompt construction
- document identity and metadata
- optional Office-specific UI extensions like `ToolExtras`, `HeaderExtras`, and `SelectionIndicator`
- optional link interception via `handleLinkClick`

## Validation

Use the repo-level checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

For package boundaries:

- use `@office-agents/core` when you need UI-facing exports like `ChatInterface`, `FilesPanel`, or adapter types
- use `@office-agents/core/sdk` when an app package or a test only needs SDK/runtime helpers
