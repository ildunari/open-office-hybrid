import type {
  HookPromptNote,
  PostHookDefinition,
  PreHookDefinition,
} from "../types";

const CAPTURE_KEY = "format-fingerprint:before-hash";

function hashFormattingBlocks(ooxml: string): string {
  const runBlocks = ooxml.match(/<w:rPr[^>]*>[\s\S]*?<\/w:rPr>/g) ?? [];
  const paragraphBlocks = ooxml.match(/<w:pPr[^>]*>[\s\S]*?<\/w:pPr>/g) ?? [];
  const source = [...runBlocks, ...paragraphBlocks].join("|");

  let hash = 5381;
  for (let index = 0; index < source.length; index += 1) {
    hash = ((hash << 5) + hash + source.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function containsWriteOps(code: string): boolean {
  const writePatterns = [
    /\.insertText\s*\(/,
    /\.insertOoxml\s*\(/,
    /\.insertParagraph\s*\(/,
    /\.insertHtml\s*\(/,
    /\.clear\s*\(/,
    /\.delete\s*\(/,
    /\.insertInlinePictureFromBase64\s*\(/,
    /\.insertTable\s*\(/,
    /\.insertBreak\s*\(/,
    /\.insertContentControl\s*\(/,
    /\.insertField\s*\(/,
    /\.insertFootnote\s*\(/,
    /\.insertBookmark\s*\(/,
    /\.font\.\w+\s*=/,
    /\.style\s*=/,
    /\.alignment\s*=/,
    /\.insertFileFromBase64\s*\(/,
  ];

  return writePatterns.some((pattern) => pattern.test(code));
}

export const formatFingerprintPreHook: PreHookDefinition = {
  name: "builtin:format-fingerprint:capture",
  selector: { toolNames: ["execute_office_js"] },
  band: "default",
  after: ["builtin:read-before-write:check"],
  speed: "sync",
  onFailure: "ignore",
  source: { hookName: "format-fingerprint:capture" },
  execute: (ctx) => {
    const code = (ctx.params.code ?? ctx.params.jsCode ?? "") as string;
    if (!containsWriteOps(code)) {
      return { action: "continue" };
    }

    ctx.captures.set(
      CAPTURE_KEY,
      Object.fromEntries(ctx.sessionState.formatFingerprints),
    );
    return { action: "continue" };
  },
};

export const formatFingerprintRecordHook: PostHookDefinition = {
  name: "builtin:format-fingerprint:record",
  selector: { toolNames: ["get_ooxml"] },
  band: "default",
  speed: "fast",
  onFailure: "ignore",
  source: { hookName: "format-fingerprint:record" },
  execute: (ctx) => {
    if (ctx.isError) return {};

    const text = ctx.result.content
      .filter(
        (content): content is { type: "text"; text: string } =>
          content.type === "text",
      )
      .map((content) => content.text)
      .join("\n");
    const key = `word:child:${ctx.params.startChild ?? 0}-${ctx.params.endChild ?? "end"}`;
    ctx.sessionState.formatFingerprints.set(key, hashFormattingBlocks(text));
    return {};
  },
};

export const formatFingerprintCheckHook: PostHookDefinition = {
  name: "builtin:format-fingerprint:check",
  selector: { toolNames: ["execute_office_js"] },
  band: "default",
  speed: "sync",
  onFailure: "ignore",
  source: { hookName: "format-fingerprint:check" },
  execute: (ctx) => {
    const beforeHashes = ctx.captures.get(CAPTURE_KEY) as
      | Record<string, string>
      | undefined;
    if (!beforeHashes || Object.keys(beforeHashes).length === 0) {
      return {};
    }

    const notes: HookPromptNote[] = [
      {
        level: "info",
        text:
          "You just modified document content via execute_office_js. " +
          "Verify that formatting was preserved by rereading the edited scope " +
          "with get_ooxml or get_document_text before continuing.",
        source: { hookName: "format-fingerprint:check" },
      },
    ];

    return { promptNotes: notes };
  },
};
