// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";
import { startOfficeBridge } from "../src/client";

const adapter = {
  tools: [],
  getDocumentId: async () => "doc-1",
};

class FakeWebSocket {
  static OPEN = 1;
  readyState = FakeWebSocket.OPEN;
  url: string;
  listeners = new Map<string, Set<(event?: unknown) => void>>();

  constructor(url: string) {
    this.url = url;
    queueMicrotask(() => this.emit("open"));
  }

  addEventListener(type: string, listener: (event?: unknown) => void) {
    const listeners = this.listeners.get(type) ?? new Set();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  send() {}

  close() {
    this.emit("close");
  }

  emit(type: string, event?: unknown) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener(event);
    }
  }
}

describe("bridge client", () => {
  afterEach(() => {
    delete (window as typeof window & { __OFFICE_BRIDGE__?: unknown })
      .__OFFICE_BRIDGE__;
    vi.unstubAllGlobals();
  });

  it("removes the exposed global controller on stop", () => {
    vi.stubGlobal("WebSocket", FakeWebSocket);
    const controller = startOfficeBridge({
      app: "word",
      adapter: { ...adapter },
      enabled: true,
    });

    expect(
      (window as typeof window & { __OFFICE_BRIDGE__?: unknown })
        .__OFFICE_BRIDGE__,
    ).toBe(controller);

    controller.stop();

    expect(
      (window as typeof window & { __OFFICE_BRIDGE__?: unknown })
        .__OFFICE_BRIDGE__,
    ).toBeUndefined();
  });
});
