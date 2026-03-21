import { afterEach, describe, expect, it, vi } from "vitest";
import {
  emitBridgeUIEvent,
  setBridgeController,
} from "../src/chat/bridge-ui-events";

afterEach(() => {
  setBridgeController(null);
});

describe("emitBridgeUIEvent", () => {
  it("does nothing when no bridge controller is registered", () => {
    expect(() =>
      emitBridgeUIEvent("ui:tab_changed", { tab: "chat" }),
    ).not.toThrow();
  });

  it("does not emit when the bridge controller is disabled", () => {
    const emitEvent = vi.fn();
    setBridgeController({
      enabled: false,
      emitEvent,
    } as never);

    emitBridgeUIEvent("ui:theme_changed", { theme: "dark" });

    expect(emitEvent).not.toHaveBeenCalled();
  });

  it("forwards typed events to the active bridge controller", () => {
    const emitEvent = vi.fn();
    setBridgeController({
      enabled: true,
      emitEvent,
    } as never);

    emitBridgeUIEvent("ui:session_switched", { toSessionId: "session-2" });

    expect(emitEvent).toHaveBeenCalledWith("ui:session_switched", {
      toSessionId: "session-2",
    });
  });
});
