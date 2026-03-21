import { describe, expect, it } from "vitest";
import type { BridgeSessionRecord } from "../src/server";
import { pickUniqueWaitSession } from "../src/session-selection";

function makeRecord(
  sessionId: string,
  documentId: string,
): BridgeSessionRecord {
  const now = Date.now();
  return {
    snapshot: {
      sessionId,
      instanceId: `${sessionId}-instance`,
      app: "word",
      appName: "OpenWord Hybrid",
      documentId,
      tools: [],
      host: { href: "https://localhost:3003/taskpane.html" },
      connectedAt: now,
      updatedAt: now,
    },
    connectedAt: now,
    lastSeenAt: now,
    recentEvents: [],
    pendingCount: 0,
  };
}

describe("pickUniqueWaitSession", () => {
  it("returns null when no sessions match", () => {
    expect(pickUniqueWaitSession([])).toBeNull();
  });

  it("returns the single matching session", () => {
    const record = makeRecord("word:one", "doc-1");
    expect(pickUniqueWaitSession([record])).toBe(record);
  });

  it("throws when multiple sessions match the current filters", () => {
    expect(() =>
      pickUniqueWaitSession(
        [makeRecord("word:one", "doc-1"), makeRecord("word:two", "doc-2")],
        "word",
      ),
    ).toThrow(
      'Session selector "word" is ambiguous: word:one, word:two',
    );
  });
});
