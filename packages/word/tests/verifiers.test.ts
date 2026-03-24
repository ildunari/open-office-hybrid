import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildWordHandoffSummary,
  detectRevisionSensitiveRequest,
  estimateWordScopeRisk,
  getWordVerificationSuites,
  hasPostWriteReread,
} from "../src/lib/verifiers";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const corpusScenarios = JSON.parse(
  readFileSync(
    path.join(
      __dirname,
      "../../sdk/tests/fixtures/docx-corpus/docx-corpus.scenarios.json",
    ),
    "utf8",
  ),
) as {
  scenarios: Array<{
    file: string;
    stressArea: string;
    request: string;
  }>;
};

describe("word verifier helpers", () => {
  it("detects revision-sensitive requests", () => {
    expect(
      detectRevisionSensitiveRequest("Redline this contract and track changes."),
    ).toBe(true);
    expect(detectRevisionSensitiveRequest("Rewrite the intro only.")).toBe(
      false,
    );
  });

  it("escalates destructive or revision-sensitive work to approval", () => {
    const risk = estimateWordScopeRisk("Replace all clauses and redline it.", {
      complexity: "moderate",
      risk: "medium",
      needsPlan: true,
      rationale: "Mutation-heavy",
    });

    expect(risk.requiresApproval).toBe(true);
    expect(risk.level).toBe("high");
  });

  it("builds a useful Word handoff summary", () => {
    const summary = buildWordHandoffSummary({
      id: "task-1",
      userRequest: "Rewrite this section but preserve the 45 day deadline.",
      status: "failed",
      scopeSummary: "section 3",
      toolCallIds: [],
      createdAt: 1,
      updatedAt: 1,
    });

    expect(summary).toContain("section 3");
    expect(summary).toContain("45 day");
  });

  it("returns passing or retryable verification results for formatting/coherence suites", async () => {
    const suites = getWordVerificationSuites();
    const progressSuite = suites.find((suite) => suite.id === "word:write-progress");
    const formatSuite = suites.find((suite) => suite.id === "word:format-preserved");
    const coherenceSuite = suites.find(
      (suite) => suite.id === "word:coherence-reread",
    );

    expect(
      await progressSuite?.verify({
        app: "word",
        mode: "verify",
        request: "Rewrite the section and preserve formatting.",
        plan: null,
        task: {
          id: "task-1",
          userRequest: "Rewrite the section and preserve formatting.",
          status: "failed",
          mode: "execute",
          toolCallIds: [],
          executionDiagnostics: {
            preWriteReadCount: 4,
            preWriteInspectionCount: 4,
            scopeReadCount: 1,
            writeCount: 0,
            failedWriteCount: 0,
            postWriteRereadCount: 0,
            planAdvancedBeyondInspection: false,
            noWriteLoopDetected: true,
            noWriteLoopReason:
              "Inspection budget exhausted before first write.",
          },
          createdAt: 1,
          updatedAt: 1,
        },
        toolExecutions: [
          {
            toolCallId: "tc-read",
            toolName: "get_document_text",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );

    expect(
      await formatSuite?.verify({
        mode: "verify",
        request: "Rewrite the section and preserve formatting.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );

    expect(
      await coherenceSuite?.verify({
        mode: "verify",
        request: "Update the introduction section.",
        plan: null,
        task: null,
        toolExecutions: [],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );
  });

  it("anchors reread checks to the last successful write", () => {
    expect(
      hasPostWriteReread([
        {
          toolCallId: "tc-1",
          toolName: "execute_office_js",
          isError: false,
          resultText: "ok",
          timestamp: 1,
        },
        {
          toolCallId: "tc-2",
          toolName: "get_document_text",
          isError: false,
          resultText: "ok",
          timestamp: 2,
        },
        {
          toolCallId: "tc-3",
          toolName: "execute_office_js",
          isError: false,
          resultText: "ok",
          timestamp: 3,
        },
      ]),
    ).toBe(false);

    expect(
      hasPostWriteReread([
        {
          toolCallId: "tc-1",
          toolName: "execute_office_js",
          isError: false,
          resultText: "ok",
          timestamp: 1,
        },
        {
          toolCallId: "tc-2",
          toolName: "execute_office_js",
          isError: false,
          resultText: "ok",
          timestamp: 3,
        },
        {
          toolCallId: "tc-3",
          toolName: "get_document_text",
          isError: false,
          resultText: "ok",
          timestamp: 4,
        },
      ]),
    ).toBe(true);
  });

  it("fails formatting verification when a reread reports formatting drift", async () => {
    const suites = getWordVerificationSuites();
    const formatSuite = suites.find((suite) => suite.id === "word:format-preserved");

    expect(
      await formatSuite?.verify({
        mode: "verify",
        request: "Rewrite the section and preserve formatting.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
          {
            toolCallId: "tc-2",
            toolName: "get_ooxml",
            isError: false,
            resultText: "ok",
            timestamp: 2,
          },
        ],
        promptNotes: [
          "Formatting fingerprint mismatch detected after rereading the edited scope.",
        ],
      }),
    ).toEqual(expect.objectContaining({ status: "failed", retryable: false }));
  });

  it("exports the paragraph OOXML read tool for Word safety flows", () => {
    const source = readFileSync(
      path.join(__dirname, "../src/lib/tools/index.ts"),
      "utf8",
    );

    expect(source).toContain('from "./get-paragraph-ooxml"');
    expect(source).toContain("getParagraphOoxmlTool");
  });

  it("requires revision-safe evidence instead of passing on the absence of write errors alone", async () => {
    const suites = getWordVerificationSuites();
    const revisionSuite = suites.find((suite) => suite.id === "word:revision-safe");

    expect(
      await revisionSuite?.verify({
        mode: "verify",
        request: "Redline this contract and preserve tracked changes.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-1",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );
  });

  it("flags missing rereads after a successful write as retryable progress gaps", async () => {
    const suites = getWordVerificationSuites();
    const progressSuite = suites.find((suite) => suite.id === "word:write-progress");

    expect(
      await progressSuite?.verify({
        app: "word",
        mode: "verify",
        request: "Rewrite the introduction and preserve formatting.",
        plan: {
          classification: {
            complexity: "moderate",
            risk: "medium",
            needsPlan: true,
            rationale: "Mutation-heavy",
          },
        } as any,
        task: {
          id: "task-2",
          userRequest: "Rewrite the introduction and preserve formatting.",
          status: "completed",
          mode: "execute",
          toolCallIds: [],
          createdAt: 1,
          updatedAt: 1,
        },
        toolExecutions: [
          {
            toolCallId: "tc-write",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 2,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "retryable",
      }),
    );
  });

  it("passes write progress verification only after a successful write is reread", async () => {
    const suites = getWordVerificationSuites();
    const progressSuite = suites.find((suite) => suite.id === "word:write-progress");

    expect(
      await progressSuite?.verify({
        app: "word",
        mode: "verify",
        request: "Rewrite the introduction and preserve formatting.",
        plan: {
          classification: {
            complexity: "moderate",
            risk: "medium",
            needsPlan: true,
            rationale: "Mutation-heavy",
          },
        } as any,
        task: {
          id: "task-3",
          userRequest: "Rewrite the introduction and preserve formatting.",
          status: "completed",
          mode: "execute",
          toolCallIds: [],
          createdAt: 1,
          updatedAt: 1,
        },
        toolExecutions: [
          {
            toolCallId: "tc-write",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 2,
          },
          {
            toolCallId: "tc-reread",
            toolName: "get_document_text",
            isError: false,
            resultText: "updated text",
            timestamp: 3,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(
      expect.objectContaining({
        status: "passed",
        retryable: false,
      }),
    );
  });

  it("binds corpus-derived review and formatting scenarios to the stricter verifier expectations", async () => {
    const suites = getWordVerificationSuites();
    const revisionSuite = suites.find((suite) => suite.id === "word:revision-safe");
    const formatSuite = suites.find((suite) => suite.id === "word:format-preserved");
    const commentsScenario = corpusScenarios.scenarios.find(
      (scenario) => scenario.file === "comments.docx",
    );
    const formatScenario = corpusScenarios.scenarios.find(
      (scenario) => scenario.file === "strict-format.docx",
    );

    expect(
      await revisionSuite?.verify({
        mode: "verify",
        request: commentsScenario?.request ?? "Review comments.docx safely.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-comments",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(expect.objectContaining({ status: "retryable" }));

    expect(
      await formatSuite?.verify({
        mode: "verify",
        request:
          formatScenario?.request ??
          "Rewrite strict-format.docx while preserving formatting exactly.",
        plan: null,
        task: null,
        toolExecutions: [
          {
            toolCallId: "tc-format",
            toolName: "execute_office_js",
            isError: false,
            resultText: "ok",
            timestamp: 1,
          },
        ],
        promptNotes: [],
      }),
    ).toEqual(expect.objectContaining({ status: "retryable" }));
  });
});
