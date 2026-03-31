// @vitest-environment happy-dom

import { describe, expect, it, vi } from "vitest";
import {
  attachWordLiveContextBridge,
  buildWordLiveContext,
} from "../src/lib/live-context";

describe("buildWordLiveContext", () => {
  it("truncates long selections and preserves style/tracking metadata", () => {
    const context = buildWordLiveContext({
      selectedText: "A".repeat(80),
      selectedStyle: "Heading 1",
      trackingMode: "TrackAll",
      focusTarget: "document",
      updatedAt: 123,
      maxSelectionLength: 20,
    });

    expect(context).toEqual({
      selection: {
        hasSelection: true,
        selectedText: `${"A".repeat(20)}…`,
        selectedStyle: "Heading 1",
      },
      trackingMode: "TrackAll",
      focusTarget: "document",
      updatedAt: 123,
    });
  });

  it("reports an empty selection without fabricated text fields", () => {
    expect(
      buildWordLiveContext({
        selectedText: "   ",
        trackingMode: "Off",
        updatedAt: 456,
      }),
    ).toEqual({
      selection: { hasSelection: false },
      trackingMode: "Off",
      updatedAt: 456,
    });
  });
});

describe("attachWordLiveContextBridge", () => {
  it("emits a selection event and refreshes the session when Word selection changes", async () => {
    const emitEvent = vi.fn();
    const refresh = vi.fn().mockResolvedValue(null);
    const addHandlerAsync = vi.fn();
    const removeHandlerAsync = vi.fn();
    let selectionHandler: (() => void) | undefined;

    addHandlerAsync.mockImplementation((_eventType, handler) => {
      selectionHandler = handler;
    });

    const detach = attachWordLiveContextBridge(
      {
        enabled: true,
        emitEvent,
        refresh,
      },
      {
        officeDocument: { addHandlerAsync, removeHandlerAsync },
        readLiveContext: async () => ({
          selection: {
            hasSelection: true,
            selectedText: "Clause 9",
          },
          trackingMode: "TrackMineOnly",
          updatedAt: 111,
        }),
        debounceMs: 0,
      },
    );

    expect(selectionHandler).toBeTypeOf("function");
    selectionHandler?.();
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();

    expect(emitEvent).toHaveBeenCalledWith("word:selection_changed", {
      liveContext: {
        selection: {
          hasSelection: true,
          selectedText: "Clause 9",
        },
        trackingMode: "TrackMineOnly",
        updatedAt: 111,
      },
    });
    expect(refresh).toHaveBeenCalled();

    detach();
    expect(removeHandlerAsync).toHaveBeenCalled();
  });

  it("emits a context change event on window focus", async () => {
    const emitEvent = vi.fn();
    const refresh = vi.fn().mockResolvedValue(null);

    const detach = attachWordLiveContextBridge(
      {
        enabled: true,
        emitEvent,
        refresh,
      },
      {
        officeDocument: {
          addHandlerAsync: vi.fn(),
          removeHandlerAsync: vi.fn(),
        },
        readLiveContext: async () => ({
          selection: { hasSelection: false },
          focusTarget: "document",
          updatedAt: 222,
        }),
        debounceMs: 0,
      },
    );

    window.dispatchEvent(new Event("focus"));
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();

    expect(emitEvent).toHaveBeenCalledWith("word:context_changed", {
      liveContext: {
        selection: { hasSelection: false },
        focusTarget: "document",
        updatedAt: 222,
      },
      reason: "window_focus",
    });
    expect(refresh).toHaveBeenCalled();

    detach();
  });
});
