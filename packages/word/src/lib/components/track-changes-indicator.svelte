<script lang="ts">
  import { Pencil } from "lucide-svelte";
  import { onMount } from "svelte";
  import { bindOfficeDocumentHandler } from "./office-document-events";
  import { WORD_TRACKING_MODE_CHANGED_EVENT } from "../live-context";

  /* global Word, Office */

  type ChangeTrackingMode = "Off" | "TrackAll" | "TrackMineOnly" | "Unknown";

  let mode = $state<ChangeTrackingMode | null>(null);
  let isUpdating = $state(false);
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  async function getChangeTrackingMode(): Promise<ChangeTrackingMode> {
    return Word.run(async (context) => {
      context.document.load("changeTrackingMode");
      await context.sync();
      return context.document.changeTrackingMode as ChangeTrackingMode;
    });
  }

  async function toggleChangeTracking(): Promise<ChangeTrackingMode> {
    return Word.run(async (context) => {
      context.document.load("changeTrackingMode");
      await context.sync();

      const current = context.document.changeTrackingMode as ChangeTrackingMode;
      context.document.changeTrackingMode =
        current === "Off" ? "TrackAll" : "Off";
      await context.sync();

      return context.document.changeTrackingMode as ChangeTrackingMode;
    });
  }

  function getTitle(value: ChangeTrackingMode | null): string {
    switch (value) {
      case "TrackAll":
        return "Track Changes: ON (all edits) - Click to turn off";
      case "TrackMineOnly":
        return "Track Changes: ON (my edits only) - Click to turn off";
      case "Off":
        return "Track Changes: OFF - Click to turn on";
      case "Unknown":
        return "Track Changes: Unknown";
      default:
        return "Track Changes";
    }
  }

  function getTooltip(value: ChangeTrackingMode | null): string {
    switch (value) {
      case "TrackAll":
        return "Track Changes: ON";
      case "TrackMineOnly":
        return "Track Changes: ON (mine)";
      case "Off":
        return "Track Changes: OFF";
      default:
        return "Track Changes";
    }
  }

  async function refresh() {
    try {
      mode = await getChangeTrackingMode();
    } catch {
      mode = "Unknown";
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void refresh();
    }, 300);
  }

  async function handleToggle() {
    if (isUpdating) return;

    if (mode === "Unknown") {
      await refresh();
      if (mode === "Unknown") return;
    }

    isUpdating = true;
    try {
      mode = await toggleChangeTracking();
    } catch {
      await refresh();
    } finally {
      isUpdating = false;
    }
  }

  onMount(() => {
    void refresh();

    const handleFocus = () => {
      scheduleRefresh();
    };
    const handleSelectionChanged = () => {
      scheduleRefresh();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener(WORD_TRACKING_MODE_CHANGED_EVENT, handleFocus);
    const officeDocument =
      typeof Office === "undefined" ? undefined : Office?.context?.document;
    const selectionEventType =
      typeof Office === "undefined"
        ? undefined
        : Office?.EventType?.DocumentSelectionChanged;
    const detachOfficeHandler =
      officeDocument && selectionEventType
        ? bindOfficeDocumentHandler(
            officeDocument,
            selectionEventType,
            handleSelectionChanged,
          )
        : () => undefined;

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
      }
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener(WORD_TRACKING_MODE_CHANGED_EVENT, handleFocus);
      detachOfficeHandler();
    };
  });

  const trackingOn = $derived(mode === "TrackAll" || mode === "TrackMineOnly");
  const buttonClass = $derived(
    trackingOn
      ? "text-(--chat-accent) hover:text-(--chat-text-primary)"
      : "text-(--chat-text-muted) hover:text-(--chat-text-primary)",
  );
</script>

<button
  type="button"
  onclick={handleToggle}
  disabled={isUpdating}
  class={`p-1.5 transition-colors ${buttonClass} ${isUpdating ? "opacity-70" : ""}`}
  data-tooltip={getTooltip(mode)}
  aria-label={getTitle(mode)}
>
  <Pencil size={14} />
</button>
