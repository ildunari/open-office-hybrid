import type { GatewayLiveContext } from "@office-agents/core";
import type { OfficeBridgeController } from "@office-agents/bridge";
import { bindOfficeDocumentHandler } from "./components/office-document-events";

/* global Office, Word */

type ChangeTrackingMode = "Off" | "TrackAll" | "TrackMineOnly" | "Unknown";

interface BuildWordLiveContextOptions {
  selectedText?: string | null;
  selectedStyle?: string | null;
  trackingMode?: string | null;
  documentTitle?: string | null;
  focusTarget?: string | null;
  updatedAt?: number;
  maxSelectionLength?: number;
}

interface OfficeDocumentEventSource {
  addHandlerAsync: (
    eventType: unknown,
    handler: (...args: unknown[]) => void,
    callback?: (...args: unknown[]) => void,
  ) => void;
  removeHandlerAsync?: (
    eventType: unknown,
    options: { handler: (...args: unknown[]) => void },
    callback?: (...args: unknown[]) => void,
  ) => void;
}

interface AttachWordLiveContextBridgeOptions {
  officeDocument?: OfficeDocumentEventSource | null;
  readLiveContext?: () => Promise<GatewayLiveContext | null>;
  debounceMs?: number;
  win?: Window;
  doc?: Document;
}

export const WORD_TRACKING_MODE_CHANGED_EVENT =
  "word-tracking-mode-maybe-changed";

export function buildWordLiveContext(
  options: BuildWordLiveContextOptions,
): GatewayLiveContext {
  const maxSelectionLength = options.maxSelectionLength ?? 500;
  const trimmedSelection = options.selectedText?.trim() ?? "";
  const selection =
    trimmedSelection.length > 0
      ? {
          hasSelection: true,
          selectedText:
            trimmedSelection.length > maxSelectionLength
              ? `${trimmedSelection.slice(0, maxSelectionLength)}…`
              : trimmedSelection,
          ...(options.selectedStyle ? { selectedStyle: options.selectedStyle } : {}),
        }
      : { hasSelection: false };

  return {
    selection,
    ...(options.trackingMode ? { trackingMode: options.trackingMode } : {}),
    ...(options.documentTitle ? { documentTitle: options.documentTitle } : {}),
    ...(options.focusTarget ? { focusTarget: options.focusTarget } : {}),
    updatedAt: options.updatedAt ?? Date.now(),
  };
}

export async function readWordLiveContext(
  maxSelectionLength = 500,
): Promise<GatewayLiveContext> {
  return Word.run(async (context) => {
    const selection = context.document.getSelection();
    selection.load("text,style");

    let trackingMode: ChangeTrackingMode = "Unknown";
    try {
      context.document.load("changeTrackingMode");
    } catch {
      // Ignore unsupported tracking APIs.
    }

    await context.sync();

    try {
      trackingMode = context.document.changeTrackingMode as ChangeTrackingMode;
    } catch {
      trackingMode = "Unknown";
    }

    return buildWordLiveContext({
      selectedText: selection.text,
      selectedStyle: selection.style,
      trackingMode,
      documentTitle: getDocumentTitle(),
      focusTarget: getFocusTarget(),
      updatedAt: Date.now(),
      maxSelectionLength,
    });
  });
}

export async function readWordSelectionPreview(
  maxSelectionLength = 60,
): Promise<{ selectedText: string }> {
  const liveContext = await readWordLiveContext(maxSelectionLength);
  return {
    selectedText: liveContext.selection?.hasSelection
      ? liveContext.selection.selectedText ?? ""
      : "",
  };
}

export function attachWordLiveContextBridge(
  controller:
    | Pick<OfficeBridgeController, "enabled" | "emitEvent" | "refresh">
    | null
    | undefined,
  options: AttachWordLiveContextBridgeOptions = {},
): () => void {
  if (!controller?.enabled) return () => undefined;

  const readLiveContext = options.readLiveContext ?? (() => readWordLiveContext());
  const officeDocument =
    options.officeDocument ??
    (typeof Office === "undefined" ? undefined : Office?.context?.document);
  const win = options.win ?? window;
  const doc = options.doc ?? document;
  const debounceMs = options.debounceMs ?? 300;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;

  const scheduleUpdate = (
    event:
      | "word:selection_changed"
      | "word:context_changed",
    reason?: string,
  ) => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void readLiveContext()
        .then((liveContext) => {
          if (!liveContext) return;
          if (event === "word:selection_changed") {
            controller.emitEvent(event, { liveContext });
          } else {
            controller.emitEvent(event, { liveContext, reason });
          }
          return Promise.resolve(controller.refresh()).catch(() => undefined);
        })
        .catch(() => undefined);
    }, debounceMs);
  };

  const detachOfficeHandler = bindOfficeDocumentHandler(
    officeDocument,
    typeof Office === "undefined"
      ? "DocumentSelectionChanged"
      : (Office?.EventType?.DocumentSelectionChanged ?? "DocumentSelectionChanged"),
    () => scheduleUpdate("word:selection_changed"),
  );
  const handleWindowFocus = () =>
    scheduleUpdate("word:context_changed", "window_focus");
  const handleVisibilityChange = () =>
    scheduleUpdate("word:context_changed", "visibility_change");
  const handleTrackingModeChanged = () =>
    scheduleUpdate("word:context_changed", "tracking_mode_changed");

  win.addEventListener("focus", handleWindowFocus);
  doc.addEventListener("visibilitychange", handleVisibilityChange);
  win.addEventListener(
    WORD_TRACKING_MODE_CHANGED_EVENT,
    handleTrackingModeChanged,
  );

  return () => {
    if (refreshTimer) {
      clearTimeout(refreshTimer);
      refreshTimer = null;
    }
    detachOfficeHandler();
    win.removeEventListener("focus", handleWindowFocus);
    doc.removeEventListener("visibilitychange", handleVisibilityChange);
    win.removeEventListener(
      WORD_TRACKING_MODE_CHANGED_EVENT,
      handleTrackingModeChanged,
    );
  };
}

function getFocusTarget(): string {
  if (typeof document === "undefined" || typeof document.hasFocus !== "function") {
    return "unknown";
  }
  return document.hasFocus() ? "document" : "unknown";
}

function getDocumentTitle(): string | null {
  if (
    typeof Office !== "undefined" &&
    typeof Office?.context?.document?.url === "string"
  ) {
    const url = Office.context.document.url.trim();
    if (url) {
      const basename = url.split("/").pop()?.trim();
      if (basename) return basename;
    }
  }
  if (typeof document !== "undefined" && document.title.trim()) {
    return document.title.trim();
  }
  return null;
}
