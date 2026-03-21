import { describe, expect, it } from "vitest";
import { ChatController } from "../src/chat/chat-controller";
import type { AppAdapter } from "../src/chat/app-adapter";

function makeAdapter(): AppAdapter {
  return {
    tools: [],
    buildSystemPrompt: () => "",
    getDocumentId: async () => "doc-1",
  };
}

describe("ChatController bridge runtime state wiring", () => {
  it("attaches a bridge-safe runtime state getter to the shared adapter", () => {
    const adapter = makeAdapter();
    const controller = new ChatController(adapter);

    expect(typeof adapter.getRuntimeState).toBe("function");
    expect(adapter.getRuntimeState?.()).toEqual(controller.getRuntimeStateSlice());

    controller.dispose();
  });

  it("removes the runtime state getter on dispose", () => {
    const adapter = makeAdapter();
    const controller = new ChatController(adapter);

    controller.dispose();

    expect(adapter.getRuntimeState).toBeUndefined();
  });
});
