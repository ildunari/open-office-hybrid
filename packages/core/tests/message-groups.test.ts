import type { ChatMessage } from "@office-agents/sdk";
import { describe, expect, it } from "vitest";
import { getGroupedMessages } from "../src/chat/message-groups";

function textMessage(
  id: string,
  role: "user" | "assistant",
  text: string,
): ChatMessage {
  return {
    id,
    role,
    timestamp: 1,
    parts: [{ type: "text", text }],
  };
}

describe("getGroupedMessages", () => {
  it("refreshes assistant content when ids stay the same", () => {
    const initialMessages = [
      textMessage("u1", "user", "hello"),
      textMessage("a1", "assistant", ""),
    ];

    const first = getGroupedMessages(initialMessages);
    const updatedMessages = [
      textMessage("u1", "user", "hello"),
      textMessage("a1", "assistant", "Hi there"),
    ];

    const second = getGroupedMessages(updatedMessages, first.cache);

    expect(second.groups).toHaveLength(2);
    expect(second.groups[1]?.type).toBe("assistant");
    if (second.groups[1]?.type !== "assistant") {
      throw new Error("Expected assistant group");
    }
    expect(second.groups[1].messages[0]?.parts[0]).toEqual({
      type: "text",
      text: "Hi there",
    });
  });

  it("rebuilds layout when a new user message is added", () => {
    const first = getGroupedMessages([
      textMessage("u1", "user", "hello"),
      textMessage("a1", "assistant", "Hi there"),
    ]);

    const second = getGroupedMessages(
      [
        textMessage("u1", "user", "hello"),
        textMessage("a1", "assistant", "Hi there"),
        textMessage("u2", "user", "next"),
      ],
      first.cache,
    );

    expect(second.groups).toHaveLength(3);
    expect(second.groups[2]).toEqual({
      type: "user",
      message: textMessage("u2", "user", "next"),
    });
  });
});
