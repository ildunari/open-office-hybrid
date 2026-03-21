<script lang="ts">
  /**
   * Drag handle for resizing a sibling panel.
   * Place between two flex siblings. Drag up/down to resize the target.
   *
   * Usage:
   *   <DiagnosticsPanel bind:this={diagEl} />
   *   <ResizeHandle target={() => diagEl} direction="above" min={48} max={400} />
   *   <MessageList />
   */

  import { emitBridgeUIEvent } from "./bridge-ui-events.js";

  interface Props {
    /** Returns the element to resize */
    target: () => HTMLElement | null | undefined;
    /** Which side of this handle the resizable element is on */
    direction?: "above" | "below";
    /** Minimum height in px */
    min?: number;
    /** Maximum height in px */
    max?: number;
  }

  let { target, direction = "above", min = 48, max = 400 }: Props = $props();
  let dragging = $state(false);
  let startY = 0;
  let startHeight = 0;

  function onPointerDown(e: PointerEvent) {
    const el = target();
    if (!el) return;
    e.preventDefault();
    dragging = true;
    startY = e.clientY;
    startHeight = el.getBoundingClientRect().height;
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }

  function onPointerMove(e: PointerEvent) {
    const el = target();
    if (!el) return;
    const delta = direction === "above" ? e.clientY - startY : startY - e.clientY;
    const newHeight = Math.min(max, Math.max(min, startHeight + delta));
    el.style.height = `${newHeight}px`;
    el.style.maxHeight = `${newHeight}px`;
  }

  function onPointerUp() {
    dragging = false;
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    const el = target();
    if (el) {
      emitBridgeUIEvent("ui:resize", { target: "resize-handle", height: el.getBoundingClientRect().height });
    }
  }
</script>

<div
  role="separator"
  aria-orientation="horizontal"
  class="resize-handle"
  class:resize-handle--active={dragging}
  onpointerdown={onPointerDown}
>
  <div class="resize-handle__bar"></div>
</div>

<style>
  .resize-handle {
    position: relative;
    height: 6px;
    cursor: row-resize;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    z-index: 10;
    transition: background-color 0.15s;
  }

  .resize-handle:hover,
  .resize-handle--active {
    background-color: var(--chat-bg-tertiary);
  }

  .resize-handle__bar {
    width: 32px;
    height: 2px;
    border-radius: 1px;
    background-color: var(--chat-border);
    opacity: 0;
    transition: opacity 0.15s;
  }

  .resize-handle:hover .resize-handle__bar,
  .resize-handle--active .resize-handle__bar {
    opacity: 1;
  }
</style>
