import { DEFAULT_REQUEST_TIMEOUT_MS } from "./protocol.js";

const WORD_SCREENSHOT_TIMEOUT_MS = 120_000;

export function getScreenshotTimeoutMs(
  app: string,
  explicitTimeoutMs?: number,
): number {
  if (explicitTimeoutMs && explicitTimeoutMs > 0) {
    return explicitTimeoutMs;
  }

  if (app === "word") {
    return WORD_SCREENSHOT_TIMEOUT_MS;
  }

  return DEFAULT_REQUEST_TIMEOUT_MS;
}
