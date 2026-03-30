<script lang="ts">
  import type { ChatMessage, MessagePart } from "@office-agents/sdk";
  import { Loader2 } from "lucide-svelte";
  import { tick } from "svelte";
  import { getChatContext } from "./chat-runtime-context";
  import {
    getGroupedMessages,
    type MessageGroup,
    type MessageGroupCache,
  } from "./message-groups";
  import MarkdownContent from "./markdown-content.svelte";
  import ThinkingBlock from "./thinking-block.svelte";
  import ToolCallBlock from "./tool-call-block.svelte";
  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  type ToolCallPart = Extract<MessagePart, { type: "toolCall" }>;
  type ThinkingPart = Extract<MessagePart, { type: "thinking" }>;

  const chat = getChatContext();
  const messagesState = chat.messagesState;
  const adapter = chat.adapter;

  // ── scroll container ────────────────────────────────────────────────────────
  let container = $state<HTMLDivElement | null>(null);
  let shouldAutoScroll = true;

  // ── virtual scroll state ────────────────────────────────────────────────────
  /** Current scroll offset of the container, updated on every scroll event */
  let scrollTop = $state(0);
  /** Visible height of the container, updated by ResizeObserver */
  let viewportHeight = $state(0);
  /** Measured pixel heights keyed by group stable key */
  let measuredHeights = $state(new Map<string, number>());
  /** Trigger re-derivation of layout when heights change */
  let heightRevision = $state(0);

  const DEFAULT_HEIGHT = 80;
  const BUFFER = 3;
  /** Gap between items from space-y-3 (0.75rem = 12px at default font size) */
  const ITEM_GAP = 12;

  // ── grouping (unchanged logic) ───────────────────────────────────────────────
  function flattenAssistantParts(messages: ChatMessage[]) {
    const allParts: { part: MessagePart; messageId: string; isLast: boolean }[] =
      [];

    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const isLastMessage = i === messages.length - 1;
      for (let j = 0; j < message.parts.length; j++) {
        allParts.push({
          part: message.parts[j],
          messageId: message.id,
          isLast: isLastMessage && j === message.parts.length - 1,
        });
      }
    }

    return allParts;
  }

  let groupCache: MessageGroupCache | null = null;

  const groups = $derived.by(() => {
    const result = getGroupedMessages($messagesState.messages, groupCache);
    groupCache = result.cache;
    return result.groups;
  });

  /** Stable key for a group — used as Map key for height measurement */
  function groupKey(group: MessageGroup): string {
    return group.type === "user" ? group.message.id : group.messages[0].id;
  }

  /** Flattened assistant parts for ALL groups, indexed by original group index */
  const flattenedAssistantParts = $derived.by(() =>
    groups.map((group) =>
      group.type === "assistant" ? flattenAssistantParts(group.messages) : [],
    ),
  );

  const lastMessage = $derived(
    $messagesState.messages[$messagesState.messages.length - 1],
  );
  const showLoading = $derived(
    $messagesState.isStreaming && lastMessage?.role === "user",
  );
  const lastGroup = $derived(groups[groups.length - 1]);
  const isStreamingAssistant = $derived(
    $messagesState.isStreaming && lastGroup?.type === "assistant",
  );

  // ── virtual scroll layout ───────────────────────────────────────────────────

  /**
   * Cumulative heights array: cumulativeHeights[i] is the pixel offset at
   * which group i starts. cumulativeHeights[groups.length] is total content
   * height.  Re-derived whenever heightRevision bumps or groups change.
   */
  const cumulativeHeights = $derived.by(() => {
    // Touch heightRevision so this re-runs when heights are measured
    void heightRevision;
    const offsets = new Array<number>(groups.length + 1);
    offsets[0] = 0;
    for (let i = 0; i < groups.length; i++) {
      const key = groupKey(groups[i]);
      const h = measuredHeights.get(key) ?? DEFAULT_HEIGHT;
      // Add inter-item gap (space-y-3 = 12px) for all items after the first
      const gap = i > 0 ? ITEM_GAP : 0;
      offsets[i + 1] = offsets[i] + h + gap;
    }
    return offsets;
  });

  /** Total estimated scroll height of all content */
  const totalContentHeight = $derived(
    cumulativeHeights[groups.length] ?? 0,
  );

  /**
   * The visible window: startIndex..endIndex (exclusive) with BUFFER padding.
   * When the list is tiny enough to fit in viewport, we render everything.
   */
  const visibleRange = $derived.by(() => {
    const total = groups.length;
    if (total === 0) return { start: 0, end: 0 };

    const top = scrollTop;
    const bottom = top + viewportHeight;
    const offsets = cumulativeHeights;

    // Binary search for the first group whose bottom edge is at/after scrollTop
    let lo = 0;
    let hi = total - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (offsets[mid + 1] < top) lo = mid + 1;
      else hi = mid;
    }
    const firstVisible = lo;

    // Linear scan forward for last visible group
    let lastVisible = firstVisible;
    while (lastVisible < total - 1 && offsets[lastVisible] < bottom) {
      lastVisible++;
    }

    const start = Math.max(0, firstVisible - BUFFER);
    const end = Math.min(total, lastVisible + 1 + BUFFER);
    return { start, end };
  });

  /** Groups actually rendered to the DOM */
  const visibleItems = $derived(
    groups.slice(visibleRange.start, visibleRange.end).map((group, i) => ({
      group,
      originalIndex: visibleRange.start + i,
    })),
  );

  /** Height of the spacer above visible items */
  const topSpacerHeight = $derived(
    cumulativeHeights[visibleRange.start] ?? 0,
  );

  /** Height of the spacer below visible items */
  const bottomSpacerHeight = $derived(
    totalContentHeight - (cumulativeHeights[visibleRange.end] ?? totalContentHeight),
  );

  // ── ResizeObserver for viewport height ──────────────────────────────────────
  $effect(() => {
    const el = container;
    if (!el) return () => {};

    viewportHeight = el.clientHeight;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        viewportHeight = entry.contentRect.height;
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  });

  // ── height measurement for rendered items ───────────────────────────────────
  /**
   * Element refs for currently rendered item wrappers.
   * Indexed by position in visibleItems array.
   */
  let itemRefs = $state<Array<HTMLDivElement | null>>([]);

  $effect(() => {
    // Re-run whenever visibleItems changes (new slice rendered)
    const items = visibleItems;
    // Schedule measurement after DOM settles
    void tick().then(() => {
      let changed = false;
      let scrollDelta = 0;
      const currentScrollTop = container?.scrollTop ?? 0;

      for (let i = 0; i < items.length; i++) {
        const el = itemRefs[i];
        if (!el) continue;
        const key = groupKey(items[i].group);
        const measured = el.offsetHeight;
        if (measured > 0) {
          const prev = measuredHeights.get(key) ?? DEFAULT_HEIGHT;
          if (Math.abs(prev - measured) > 4) {
            // If this item is above the viewport, compensate scroll position
            const itemOffset = cumulativeHeights[items[i].originalIndex] ?? 0;
            if (itemOffset < currentScrollTop) {
              scrollDelta += measured - prev;
            }
            measuredHeights.set(key, measured);
            changed = true;
          }
        }
      }
      if (changed) {
        // Reassign the map to trigger $state reactivity, then bump revision
        measuredHeights = new Map(measuredHeights);
        heightRevision += 1;
        // Compensate scroll position to prevent visible jump
        if (scrollDelta !== 0 && container) {
          container.scrollTop = currentScrollTop + scrollDelta;
        }
      }
    });
  });

  // ── scroll event ────────────────────────────────────────────────────────────
  let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  function handleScroll() {
    if (!container) return;
    const { scrollTop: st, scrollHeight, clientHeight } = container;
    scrollTop = st;
    const distanceFromBottom = scrollHeight - st - clientHeight;
    shouldAutoScroll = distanceFromBottom < 100;

    if (scrollDebounceTimer) clearTimeout(scrollDebounceTimer);
    scrollDebounceTimer = setTimeout(() => {
      if (!container) return;
      const pct =
        container.scrollHeight > 0
          ? Math.round(
              (container.scrollTop / container.scrollHeight) * 100,
            )
          : 0;
      emitBridgeUIEvent("ui:scroll_position", {
        atBottom: shouldAutoScroll,
        scrollPct: pct,
      });
    }, 500);
  }

  // ── auto-scroll on new messages / streaming ─────────────────────────────────
  let scrollRaf: number | null = null;
  let prevMessageCount = 0;

  $effect(() => {
    const msgs = $messagesState.messages;
    const streaming = $messagesState.isStreaming;
    const count = msgs.length;
    const isNewMessage = count !== prevMessageCount;
    prevMessageCount = count;

    if (!container || !shouldAutoScroll) return;

    if (isNewMessage || !streaming) {
      void tick().then(() => {
        if (container && shouldAutoScroll) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "instant",
          });
        }
      });
    } else if (scrollRaf === null) {
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = null;
        if (container && shouldAutoScroll) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: "instant",
          });
        }
      });
    }
  });
</script>

{#snippet renderPart(part: MessagePart, streaming: boolean)}
  {#if part.type === "thinking"}
    <ThinkingBlock thinking={(part as ThinkingPart).thinking} isStreaming={streaming} />
  {:else if part.type === "toolCall"}
    <ToolCallBlock part={part as ToolCallPart} />
  {:else}
    <MarkdownContent
      text={part.text}
      isStreaming={streaming}
      onLinkClick={adapter.handleLinkClick}
    />
  {/if}
{/snippet}

{#if $messagesState.messages.length === 0}
  <div
    role="status"
    class="flex-1 flex flex-col items-center justify-center p-6 text-center"
    style="font-family: var(--chat-font-mono)"
  >
    <div class="text-(--chat-text-muted) text-xs uppercase tracking-widest mb-2">
      no messages
    </div>
    <div class="text-(--chat-text-secondary) text-sm max-w-[200px]">
      {adapter.emptyStateMessage || "Start a conversation to get started"}
    </div>
  </div>
{:else}
  <div
    bind:this={container}
    onscroll={handleScroll}
    role="log"
    aria-label="Chat messages"
    class="flex-1 overflow-y-auto p-3 space-y-3"
    style="scrollbar-width: thin; scrollbar-color: var(--chat-scrollbar) transparent; scrollbar-gutter: stable;"
  >
    <!-- top spacer — holds scroll position for items above the visible window -->
    {#if topSpacerHeight > 0}
      <div style="height: {topSpacerHeight}px; flex-shrink: 0;"></div>
    {/if}

    {#each visibleItems as { group, originalIndex }, slotIndex (groupKey(group))}
      <div bind:this={itemRefs[slotIndex]}>
        {#if group.type === "user"}
          <div
            class="ml-8 px-3 py-2 text-sm leading-relaxed bg-(--chat-user-bg) border border-(--chat-border)"
            style="border-radius: var(--chat-radius); font-family: var(--chat-font-mono)"
          >
            {#each group.message.parts as part, partIndex (`${group.message.id}-${part.type}-${partIndex}`)}
              {@render renderPart(part, false)}
            {/each}
          </div>
        {:else}
          {@const allParts = flattenedAssistantParts[originalIndex] ?? []}
          <div class="text-sm leading-relaxed" style="font-family: var(--chat-font-mono)">
            {#each allParts as entry, partIndex (entry.part.type === "toolCall" ? entry.part.id : `${entry.messageId}-${entry.part.type}-${partIndex}`)}
              {@render renderPart(entry.part, isStreamingAssistant && originalIndex === groups.length - 1 && entry.isLast)}
            {/each}

            {#if isStreamingAssistant && allParts.length === 0 && originalIndex === groups.length - 1}
              <span class="animate-pulse" style="will-change: opacity;">▊</span>
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    {#if showLoading}
      <div
        class="flex items-center gap-2 text-(--chat-text-muted) text-sm"
        style="font-family: var(--chat-font-mono)"
      >
        <Loader2 size={14} class="animate-spin" style="will-change: transform;" />
        <span>thinking...</span>
      </div>
    {/if}

    <!-- bottom spacer — maintains total scroll height for items below visible window -->
    {#if bottomSpacerHeight > 0}
      <div style="height: {bottomSpacerHeight}px; flex-shrink: 0;"></div>
    {/if}
  </div>
{/if}
