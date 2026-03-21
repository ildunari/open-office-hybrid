import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildWordHandoffSummary,
  detectRevisionSensitiveRequest,
  estimateWordScopeRisk,
  getWordVerificationSuites,
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
    const formatSuite = suites.find((suite) => suite.id === "word:format-preserved");
    const coherenceSuite = suites.find(
      (suite) => suite.id === "word:coherence-reread",
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
