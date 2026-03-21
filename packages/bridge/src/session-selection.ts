import type { BridgeSessionRecord } from "./server.js";

export function pickUniqueWaitSession(
  matches: BridgeSessionRecord[],
  selector?: string,
): BridgeSessionRecord | null {
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];

  const label = selector
    ? `Session selector "${selector}" is ambiguous`
    : "Multiple sessions match the current filters";
  throw new Error(
    `${label}: ${matches.map((session) => session.snapshot.sessionId).join(", ")}`,
  );
}
