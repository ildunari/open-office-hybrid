import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

export const BRIDGE_AUTH_HEADER = "X-Office-Bridge-Token";
export const BRIDGE_AUTH_QUERY_KEY = "token";
export const DEFAULT_BRIDGE_TOKEN_PATH = path.join(
  tmpdir(),
  "office-agents-bridge",
  "auth-token",
);

export async function loadOrCreateBridgeAuthToken(
  tokenPath = DEFAULT_BRIDGE_TOKEN_PATH,
): Promise<{ token: string; tokenPath: string; source: "env" | "file" }> {
  const envToken = process.env.OFFICE_BRIDGE_TOKEN?.trim();
  if (envToken) {
    return { token: envToken, tokenPath, source: "env" };
  }

  try {
    const existing = (await readFile(tokenPath, "utf8")).trim();
    if (existing) {
      return { token: existing, tokenPath, source: "file" };
    }
  } catch {
    // Ignore missing token file and create a fresh one below.
  }

  const token = randomBytes(24).toString("hex");
  await mkdir(path.dirname(tokenPath), { recursive: true });
  await writeFile(tokenPath, `${token}\n`, { mode: 0o600 });
  return { token, tokenPath, source: "file" };
}

export async function readBridgeAuthToken(
  tokenPath = DEFAULT_BRIDGE_TOKEN_PATH,
): Promise<string | undefined> {
  const envToken = process.env.OFFICE_BRIDGE_TOKEN?.trim();
  if (envToken) return envToken;

  try {
    const stored = (await readFile(tokenPath, "utf8")).trim();
    return stored || undefined;
  } catch {
    return undefined;
  }
}
