# UI/UX Upgrade Plan — Office Agents Side Panel

## Current State

The side panel UI is functional but visually basic — engineer-built to make features work, not to feel polished. Typography, spacing, color, and motion were chosen ad-hoc per component without a shared design language. The existing `--chat-*` CSS variable system is a proto-design-token foundation but was added for dark/light theme toggling, not as a deliberate design system.

### What We Have Today

- **Framework:** Svelte 5 with Tailwind CSS v4
- **Theming:** Custom `--chat-*` CSS variables (dark + light mode)
- **Components:** 15+ hand-built Svelte components in `packages/core/src/chat/`
- **Backend:** Custom agent runtime (`packages/sdk/`) — solid, not changing
- **Icons:** Lucide icons (`lucide-svelte`)

### QoL Fixes Already Applied (This Session)

- Text wrapping: `break-words` + `min-w-0` on all diagnostics sections
- `panel-expandable` global CSS class for scrollable, bounded content areas
- Scrollable diagnostics panel, plan panel, approval drawer, resume banner
- Overflow-safe approval drawer (approve button always visible)
- Drag-to-resize handles between diagnostics/messages and messages/input
- Chat input auto-grow increased from 2 to 8 lines
- Added Word Add-in Safety rules to CLAUDE.md and AGENTS.md

---

## Agreed Direction

### Backend

The backend (SDK) is solid for our needs. No migration planned. The Vercel AI SDK was evaluated and rejected because it requires a server backend, which is incompatible with our browser-only BYOK architecture. Worth cherry-picking ideas from (Zod tool schemas, `smoothStream()`, typed stream protocol) but not adopting wholesale.

### Frontend

Adopt **shadcn-svelte** as the design system foundation + selectively cherry-pick **Svelte AI Elements** components for AI-specific UI. This gives us a mature, accessible component library with proven design tokens, replacing our ad-hoc styling with systematic decisions.

---

## Migration Phases

### Phase 1 — Foundation (Not Started)

Install shadcn-svelte and establish the design token bridge.

- [ ] Install shadcn-svelte + bits-ui
- [ ] Create CSS variable bridge mapping shadcn tokens to our existing `--chat-*` values (or migrate naming)
- [ ] Pick a base color theme (shadcn presets: zinc, slate, stone, neutral, gray)
- [ ] Pick an accent color (currently indigo `#6366f1` — keep or change)
- [ ] Establish spacing scale, typography scale, border radius, motion timing
- [ ] Document all token decisions in a single reference file
- [ ] Add `cn()` utility (clsx + tailwind-merge, 3 lines)
- [ ] Install `runed` (lightweight Svelte 5 reactivity helper needed by AI Elements)

### Phase 2 — Primitives (Not Started)

Replace hand-built form controls with shadcn equivalents.

- [ ] Buttons (primary, secondary, ghost, danger states)
- [ ] Text inputs, selects, toggles
- [ ] Tooltips (replace `data-tooltip` CSS hack with proper accessible tooltips)
- [ ] Dropdowns/popovers (session picker, any future menus)
- [ ] Settings panel — biggest beneficiary, full of form controls
- [ ] Consistent hover, focus, disabled states across all interactive elements

### Phase 3 — AI Chat Components (Not Started)

Cherry-pick Svelte AI Elements components and wire to our ChatController.

- [ ] **CodeBlock** — replace our 3-language Shiki setup with full language/theme support
- [ ] **Reasoning/Thinking** — replace 35-line plain-text thinking-block with markdown-capable, streaming-aware component
- [ ] **Tool Call** — add status badges (pending/running/completed/error), slide/fade animations, syntax-highlighted JSON input/output, auto-open on execution
- [ ] **Message** — study their composable Message/Avatar/Content/Actions pattern, refactor our monolithic message rendering
- [ ] **Loader** — more animation variants for different loading states

### Phase 4 — Polish and Motion (Not Started)

- [ ] Define animation language (transition duration, easing, which elements animate)
- [ ] Tool call expand/collapse animations (slide/fade)
- [ ] Message appearance animations
- [ ] Consistent loading states
- [ ] Responsive behavior tuning for narrow Office taskpane

---

## Design Decisions To Make

Before starting Phase 1, browse visual references and decide on:

1. **Overall vibe** — find 2-3 apps whose interface you like (ChatGPT, Claude.ai, Cursor, Linear, Raycast, etc.)
2. **Color** — dark/light/both, accent color, background tone, how colorful status indicators should be
3. **Typography** — monospace everywhere (current) vs proportional for messages + mono for code only; font choice (system, Inter, Geist, etc.); density
4. **Shape** — corner radius (sharp/slight/soft), borders vs shadows vs spacing for separation
5. **Motion** — none/subtle/noticeable; which elements should animate
6. **Information density** — tool calls collapsed vs expanded by default; thinking visible or hidden; diagnostics placement
7. **Chat input** — default height, button style (icon vs labeled)

### Where to Browse for Inspiration

- https://ui.shadcn.com/themes — pick a shadcn theme directly (most relevant)
- https://ui.shadcn.com/blocks — pre-built page layouts
- https://prompt-kit.com — live demos of the AI Elements components (React version)
- https://v0.dev/chat — search "chat interface", "ai sidebar"
- https://dribbble.com/search/ai-chat-interface — polished mockups
- https://mobbin.com — real app screenshots by pattern
- https://ui.aceternity.com — animation inspiration
- https://realtime-colors.com — test color palettes on a live layout
- https://coolors.co — palette generator

---

## Technical Notes

### shadcn-svelte Compatibility

- Svelte 5: compatible
- Tailwind CSS: compatible
- Theming: uses CSS variables (`--primary`, `--secondary`, etc.) mapped via Tailwind utilities — bridgeable to our `--chat-*` system with ~15 lines of CSS
- UI primitives: built on bits-ui (headless accessible components) — new dependency
- Routing: expects SvelteKit by default but we skip routing parts (SPA in iframe)

### Svelte AI Elements Integration

- Components are copied into project source (shadcn pattern), not npm-installed
- Each component is a folder with 2-4 Svelte 5 files + context file
- Stateless primitives — we wire our ChatController data into their props
- Dependencies: `runed` (reactivity), `svelte-streamdown` (streaming markdown), `shiki` (syntax highlighting)
- Adapting to our `--chat-*` variables: either define shadcn variables pointing to ours, or find-and-replace Tailwind classes in copied components

### What Stays Custom (No Library Equivalent)

- Approval drawer (our permission system)
- Settings panel (API config, OAuth, BYOK)
- Diagnostics panel (runtime state inspection)
- Plan panel (execution plan visualization)
- Files panel (VFS browser)
- Status strip (phase/mode/tokens/cost)
- Resume task banner
- Session management (dropdown, new/switch/delete)
- ChatController + chat-runtime-context (state management bridge)

---

## Optional / Under Consideration

_These were discussed but not committed to. Including for future reference._

### Markdown Streaming Optimization

Study `svelte-streamdown`'s block-level memoization technique (splits markdown into semantic blocks, only re-renders changed ones during streaming). Could backport into our existing Marked pipeline for better streaming performance without taking the full dependency.

### Zod for Tool Input Validation

Add Zod schema validation to our existing tool definitions in `@office-agents/sdk`. Zero-dependency library, works in-browser, gives type-safe tool parameters and auto-validation. Inspired by the Vercel AI SDK approach but independent of it.

### Symlink Manifest for Dev Workflow

Replace the static manifest copy in Word's wef directory with a symlink to `packages/word/manifest.xml`. Would auto-propagate manifest edits without re-running the debug script. Low priority since manifest changes are rare — code changes already hot-reload via Vite.

### Dev Version Backport

The QoL fixes from this session (text wrapping, scroll constraints, resize handles) exist only in the hybrid repo (`office-agents-hybrid`). The original Dev version (`office-agents`, port 3002) is a separate codebase and was not updated. Could be backported if needed, but the two repos have diverged.

---

## Side Panel as External Agent Connector

_Concept: turn the running side panel into a bridge that external coding agents can talk to — not just for monitoring, but for two-way task delegation._

### The Idea

External agents (Claude Code, Codex CLI, Claude Desktop) can send prompts and requests to the side panel's LLM and receive structured responses back. This creates a two-way communication channel:

- **Outside → Side Panel**: A coding agent delegates document-heavy tasks to the side panel agent, which has native Office.js access, tool suite (screenshot, OOXML, structure analysis), and live document context. Example: "Read page 3 and summarize the legal terms" — more capable than extracting text via the bridge because the Word agent can use its full tool suite.
- **Side Panel → Outside**: The side panel agent delegates complex reasoning, research, or filesystem tasks to the external agent, which has shell access, web browsing, and multi-file editing capabilities.
- **User monitors**: The user keeps Word open and can see both agents collaborating in the side panel chat interface.

### Why This Matters

A coding agent working on a document-heavy task currently has two options: parse DOCX files directly (lossy, no layout context) or use the bridge to call low-level tools (tedious, requires understanding each tool's API). With this connector, the external agent can make high-level requests in natural language and let the Word agent handle the Office.js complexity.

Token-heavy tasks like "analyze this 50-page contract" are better handled by the side panel agent (which already has the document loaded) than by an external agent (which would need to extract, transfer, and parse the text).

### Three Tiers of Integration

**Tier 1 — HTTP Command API** (1-2 weeks)

Extend the existing bridge with two new endpoints:
- `POST /sessions/{id}/send-message` — external agent sends a prompt to the side panel's runtime
- `GET /sessions/{id}/messages?after=ID` — poll for new messages (agent responses, tool results)

Simple request-response pattern. No streaming. External agent polls for completion. Works today with minimal bridge changes — the runtime already has `sendMessage()`.

**Tier 2 — SSE/WebSocket Streaming** (2-3 weeks)

Add Server-Sent Events for streaming LLM responses back to the caller:
- `GET /sessions/{id}/messages/stream` — SSE endpoint that streams message chunks as they arrive
- External agent watches the response assemble in real-time
- Requires auth layer (Phase 2 of the bridge testing plan) to prevent unauthorized prompt injection

**Tier 3 — Full MCP Server** (3-4 weeks)

Implement the Model Context Protocol so Claude Desktop, VS Code, or any MCP-compatible client can treat the side panel as a tool server:
- Runtime tools exposed as MCP tools
- VFS exposed as MCP filesystem resources
- Sessions exposed as MCP contexts
- Agent streaming as MCP streaming protocol
- Requires `@modelcontextprotocol/sdk` dependency (not currently in project)

### Security Considerations

- **API key isolation**: The side panel uses the user's BYOK API keys. These must never be leaked to external agents. The side panel makes the LLM calls internally — external agents only see responses, never keys.
- **Session tokens**: Required for Tier 2+ to prevent unauthorized prompt injection. A malicious script on localhost could otherwise send prompts to the user's LLM session.
- **Rate limiting**: External agents could burn through the user's API credits. Need per-session rate limits and optional cost caps.
- **Content-based access control**: Some tools (e.g., `execute_office_js`) are powerful escape hatches. External agents should have a permission tier that restricts which tools they can invoke.

### Relationship to Bridge Testing System

The bridge testing/monitoring system (currently being built) provides the infrastructure this connector needs: typed events, auth, rate limiting, output truncation, SSE streaming. Tier 1 can be built on the current bridge; Tiers 2-3 build on the enhanced bridge.

### Example Workflow

```
[Claude Code] → POST /sessions/word/send-message
  { "content": "Read the contract on pages 3-5 and list all liability clauses" }

[Word Side Panel Agent] receives message, runs:
  → get_document_text (pages 3-5)
  → screenshot_document (for layout context)
  → Analyzes with LLM using document context
  → Returns structured response

[Claude Code] ← GET /sessions/word/messages?after=last_id
  { "role": "assistant", "content": "Found 4 liability clauses: ..." }
```
