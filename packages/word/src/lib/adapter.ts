import type { AppAdapter } from "@office-agents/core";
import {
  formatFingerprintCheckHook,
  formatFingerprintPreHook,
  formatFingerprintRecordHook,
  getOrCreateDocumentId,
} from "@office-agents/core/sdk";
import SelectionIndicator from "./components/selection-indicator.svelte";
import TrackChangesIndicator from "./components/track-changes-indicator.svelte";
import wordApiFullDts from "./docs/word-officejs-api.d.ts?raw";
import wordApiOnlineDts from "./docs/word-officejs-api-online.d.ts?raw";
import {
  buildRunFormattingSample,
  buildStyleInfoFromLoadedStyles,
} from "./metadata-helpers";
import { getWordReasoningPatterns } from "./patterns";
import { buildWordSystemPrompt } from "./system-prompt";
import { WORD_TOOLS } from "./tools";
import {
  buildWordHandoffSummary,
  estimateWordScopeRisk,
  getWordVerificationSuites,
} from "./verifiers";
import { getCustomCommands } from "./vfs/custom-commands";

/* global Word */

const TRACKING_MODE_CHANGED_EVENT = "word-tracking-mode-maybe-changed";

export function createWordAdapter(): AppAdapter {
  return {
    hostApp: "word",
    tools: WORD_TOOLS,
    customCommands: getCustomCommands,
    hasImageSearch: true,
    showFollowModeToggle: false,
    staticFiles: {
      "/home/user/docs/word-officejs-api-online.d.ts": wordApiOnlineDts,
      "/home/user/docs/word-officejs-api.d.ts": wordApiFullDts,
    },

    appName: "OpenWord Hybrid",
    metadataTag: "doc_context",
    storageNamespace: {
      dbName: "OpenWordHybridDB_v1",
      dbVersion: 1,
      localStoragePrefix: "openword-hybrid",
      documentSettingsPrefix: "openword-hybrid",
      documentIdSettingsKey: "openword-hybrid-document-id",
    },
    appVersion: __APP_VERSION__,
    emptyStateMessage: "Start a conversation to create or edit your document",
    HeaderExtras: TrackChangesIndicator,
    SelectionIndicator,
    buildSystemPrompt: buildWordSystemPrompt,
    getReasoningPatterns: getWordReasoningPatterns,
    getVerificationSuites: getWordVerificationSuites,
    buildHandoffSummary: buildWordHandoffSummary,
    estimateScopeRisk: estimateWordScopeRisk,
    registerHooks: (registry) => [
      registry.registerPre(formatFingerprintPreHook),
      registry.registerPost(formatFingerprintRecordHook),
      registry.registerPost(formatFingerprintCheckHook),
    ],

    getDocumentId: async () => {
      return getOrCreateDocumentId();
    },

    getDocumentMetadata: async () => {
      try {
        const metadata = await getDocumentMetadata();
        return { metadata };
      } catch {
        return null;
      }
    },

    onToolResult: () => {
      window.dispatchEvent(new Event(TRACKING_MODE_CHANGED_EVENT));
    },
  };
}

export { buildRunFormattingSample, buildStyleInfoFromLoadedStyles };

async function getDocumentMetadata(): Promise<object> {
  return Word.run(async (context) => {
    const body = context.document.body;
    const tables = body.tables;
    const contentControls = body.contentControls;
    const sections = context.document.sections;
    body.load("text");
    tables.load("items");
    contentControls.load("items");
    sections.load("items");
    await context.sync();

    const hasContent = body.text.trim().length > 0;

    let changeTrackingMode = "Unknown";
    try {
      context.document.load("changeTrackingMode");
      await context.sync();
      changeTrackingMode = context.document.changeTrackingMode;
    } catch {
      // changeTrackingMode may not be available
    }

    // Try to get page count (desktop only — WordApiDesktop 1.2+)
    let pageCount: number | null = null;
    try {
      const bodyRange = body.getRange();
      const pages = bodyRange.pages;
      pages.load("items");
      await context.sync();
      pageCount = pages.items.length;
    } catch {
      // pages API not available (Word Online)
    }

    // Detect style fonts — what font/size/color the key built-in styles resolve to
    let styleInfo: Record<
      string,
      { font?: string; size?: number; color?: string }
    > | null = null;
    try {
      const styles = context.document.getStyles();
      styles.load("items");
      await context.sync();
      for (const style of styles.items) {
        style.load("nameLocal,builtIn,inUse");
        style.font.load("name,size,color");
      }
      await context.sync();
      styleInfo = buildStyleInfoFromLoadedStyles(styles.items);
    } catch {
      // getStyles/font API may not be available (requires WordApi 1.5)
    }

    // Sample first N non-empty paragraphs to detect run-level formatting overrides
    let runFormattingSample: Array<{
      index: number;
      style: string;
      font?: string;
      size?: number;
      color?: string;
    }> | null = null;
    try {
      const paragraphs = body.paragraphs;
      paragraphs.load("items");
      await context.sync();
      const sampleSize = Math.min(paragraphs.items.length, 20);
      const sampled = [];
      for (let i = 0; i < sampleSize; i++) {
        const p = paragraphs.items[i];
        p.load("text,style");
        p.font.load("name,size,color");
        sampled.push({ paragraph: p, index: i });
      }
      await context.sync();
      runFormattingSample = buildRunFormattingSample(
        sampled.map(({ paragraph, index }) => ({
          index,
          text: paragraph.text,
          style: paragraph.style,
          font: {
            name: paragraph.font.name,
            size: paragraph.font.size,
            color: paragraph.font.color,
          },
        })),
      );
    } catch {
      // paragraph font loading may fail
    }

    // Determine if run-level overrides are prevalent
    let hasRunLevelOverrides = false;
    if (runFormattingSample && styleInfo) {
      for (const sample of runFormattingSample) {
        const styleDef = styleInfo[sample.style];
        if (!styleDef) {
          // Style not in our key list, but paragraph has explicit font — likely override
          if (sample.font || sample.size || sample.color) {
            hasRunLevelOverrides = true;
            break;
          }
        } else {
          // Compare against style definition
          if (
            (sample.font && styleDef.font && sample.font !== styleDef.font) ||
            (sample.size && styleDef.size && sample.size !== styleDef.size) ||
            (sample.color && styleDef.color && sample.color !== styleDef.color)
          ) {
            hasRunLevelOverrides = true;
            break;
          }
        }
      }
    }

    // Build selection info
    let selectionInfo: {
      hasSelection: boolean;
      selectedText?: string;
      selectedStyle?: string;
    } = { hasSelection: false };
    try {
      const selection = context.document.getSelection();
      selection.load("text,style");
      await context.sync();
      const selectedText = selection.text?.trim() ?? "";
      if (selectedText.length > 0) {
        selectionInfo = {
          hasSelection: true,
          selectedText:
            selectedText.length > 500
              ? `${selectedText.substring(0, 500)}…`
              : selectedText,
        };
        if (selection.style) {
          selectionInfo.selectedStyle = selection.style;
        }
      }
    } catch {
      // selection API may fail in some contexts
    }

    return {
      sectionCount: sections.items.length,
      tableCount: tables.items.length,
      contentControlCount: contentControls.items.length,
      changeTrackingMode,
      hasContent,
      pageCount,
      styleInfo,
      runFormattingSample,
      hasRunLevelOverrides,
      selection: selectionInfo,
    };
  });
}
