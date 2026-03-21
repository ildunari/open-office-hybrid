import type { ChatMessage } from "@office-agents/sdk";

export type MessageGroup =
  | { type: "user"; message: ChatMessage }
  | { type: "assistant"; messages: ChatMessage[] };

type MessageGroupLayout =
  | { type: "user"; index: number }
  | { type: "assistant"; start: number; end: number };

export interface MessageGroupCache {
  count: number;
  firstId: string;
  lastId: string;
  layout: MessageGroupLayout[];
}

function buildMessageGroupLayout(
  messages: ChatMessage[],
): MessageGroupLayout[] {
  const layout: MessageGroupLayout[] = [];
  let assistantStart: number | null = null;

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    if (message.role === "user") {
      if (assistantStart !== null) {
        layout.push({ type: "assistant", start: assistantStart, end: i });
        assistantStart = null;
      }
      layout.push({ type: "user", index: i });
    } else if (assistantStart === null) {
      assistantStart = i;
    }
  }

  if (assistantStart !== null) {
    layout.push({
      type: "assistant",
      start: assistantStart,
      end: messages.length,
    });
  }

  return layout;
}

function materializeGroups(
  messages: ChatMessage[],
  layout: MessageGroupLayout[],
): MessageGroup[] {
  return layout.map((entry) =>
    entry.type === "user"
      ? { type: "user", message: messages[entry.index] }
      : { type: "assistant", messages: messages.slice(entry.start, entry.end) },
  );
}

export function getGroupedMessages(
  messages: ChatMessage[],
  cache?: MessageGroupCache | null,
): { groups: MessageGroup[]; cache: MessageGroupCache } {
  const count = messages.length;
  const firstId = messages[0]?.id ?? "";
  const lastId = messages[count - 1]?.id ?? "";

  if (
    cache &&
    cache.count === count &&
    cache.firstId === firstId &&
    cache.lastId === lastId
  ) {
    return {
      groups: materializeGroups(messages, cache.layout),
      cache,
    };
  }

  const nextCache: MessageGroupCache = {
    count,
    firstId,
    lastId,
    layout: buildMessageGroupLayout(messages),
  };

  return {
    groups: materializeGroups(messages, nextCache.layout),
    cache: nextCache,
  };
}
