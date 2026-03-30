import { fileExists, readFile, writeFile } from "../vfs";
import type { CompactionLedgerEntry } from "./types";

const MAX_ENTRIES = 5;

function ledgerPath(sessionId: string): string {
  return `/.oa/sessions/${sessionId}/compaction-ledger.json`;
}

export async function loadLedger(
  sessionId: string,
): Promise<CompactionLedgerEntry[]> {
  const path = ledgerPath(sessionId);
  try {
    const exists = await fileExists(path);
    if (!exists) return [];
    const raw = await readFile(path);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as CompactionLedgerEntry[];
  } catch {
    return [];
  }
}

export async function appendLedger(
  sessionId: string,
  entry: CompactionLedgerEntry,
): Promise<void> {
  const existing = await loadLedger(sessionId);
  const updated = [...existing, entry];
  const trimmed =
    updated.length > MAX_ENTRIES ? updated.slice(-MAX_ENTRIES) : updated;
  await writeFile(ledgerPath(sessionId), JSON.stringify(trimmed, null, 2));
}
