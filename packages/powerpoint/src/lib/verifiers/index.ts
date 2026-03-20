import type {
  ScopeRiskEstimate,
  TaskClassification,
  TaskRecord,
  VerificationSuite,
} from "@office-agents/core/sdk";

const PPT_LAYOUT_RE =
  /\b(layout|reflow|fit|overflow|overlap|spacing|align|position|slide)\b/i;
const PPT_TEMPLATE_RE =
  /\b(template|theme|master|layout|brand|preserve|existing deck)\b/i;
const PPT_CHART_RE = /\b(chart|graph|data|series|legend|axis|label)\b/i;
const PPT_WIDE_SCOPE_RE = /\b(master|theme|entire deck|all slides)\b/i;

export function detectLayoutIssues(resultText: string): string[] {
  const issues = resultText.match(
    /\b(overlap|overflow|clipped|collision|out of bounds)\b/gi,
  );
  return issues ? [...new Set(issues.map((issue) => issue.toLowerCase()))] : [];
}

export function estimatePowerPointScopeRisk(
  request: string,
  classification: TaskClassification,
): ScopeRiskEstimate {
  const destructive =
    /\b(delete|remove|clear|replace all|rebuild)\b/i.test(request) ||
    PPT_WIDE_SCOPE_RE.test(request);

  const constraints = [
    "Preserve slide content, ordering, and theme assets outside the requested scope.",
  ];
  if (PPT_LAYOUT_RE.test(request)) {
    constraints.push(
      "Verify slides for overlap and overflow after layout changes.",
    );
  }
  if (PPT_TEMPLATE_RE.test(request)) {
    constraints.push(
      "Preserve the existing template and master/layout language unless replacing it was explicitly requested.",
    );
  }
  if (PPT_CHART_RE.test(request)) {
    constraints.push("Keep chart labels, legends, and data intent aligned.");
  }

  let scopeSummary = "slide scope";
  if (/\bmaster\b/i.test(request)) {
    scopeSummary = "slide master";
  } else if (/\btheme\b/i.test(request)) {
    scopeSummary = "slide deck theme";
  } else if (PPT_CHART_RE.test(request)) {
    scopeSummary = "chart or slide data";
  }

  return {
    level: destructive ? "high" : classification.risk,
    destructive,
    requiresApproval: destructive || classification.risk === "high",
    reasons: destructive
      ? ["Deck-wide or destructive PowerPoint mutation detected."]
      : ["No additional PowerPoint-specific approval gate required."],
    scopeSummary,
    constraints,
    expectedEffects: [
      "Only the intended slides or layouts change.",
      "Slides remain visually valid with no overlap or overflow regressions.",
      ...(PPT_CHART_RE.test(request)
        ? ["Charts stay readable and consistent with the intended data story."]
        : []),
    ],
  };
}

export function buildPowerPointHandoffSummary(task: TaskRecord): string {
  return `Resume PowerPoint task for ${task.scopeSummary ?? "slide scope"}. ${task.userRequest}`;
}

export function getPowerPointVerificationSuites(): VerificationSuite[] {
  return [
    {
      id: "powerpoint:layout-verification",
      label: "Slide layout verification",
      appliesTo: (context) => PPT_LAYOUT_RE.test(context.request),
      verify: (context) => {
        const layoutChecks = context.toolExecutions.filter(
          (entry) => entry.toolName === "verify_slides",
        );
        if (layoutChecks.length === 0) {
          return {
            suiteId: "powerpoint:layout-verification",
            label: "Slide layout verification",
            expectedEffect:
              "Layout-affecting edits are verified for overlap and overflow.",
            observedEffect:
              "No verify_slides evidence was captured after the layout edit.",
            status: "retryable",
            evidence: [],
            retryable: true,
          };
        }

        const issues = layoutChecks.flatMap((entry) =>
          detectLayoutIssues(entry.resultText),
        );
        return {
          suiteId: "powerpoint:layout-verification",
          label: "Slide layout verification",
          expectedEffect:
            "Slides remain free of overlap and overflow after the edit.",
          observedEffect:
            issues.length === 0
              ? "No layout issues detected in verification output."
              : `Layout verification detected issues: ${issues.join(", ")}`,
          status: issues.length === 0 ? "passed" : "failed",
          evidence: layoutChecks.map((entry) => entry.resultText),
          retryable: false,
        };
      },
    },
    {
      id: "powerpoint:template-preservation",
      label: "Template and theme preservation",
      appliesTo: (context) => PPT_TEMPLATE_RE.test(context.request),
      verify: (context) => {
        const relevantExecutions = context.toolExecutions.filter((entry) =>
          ["edit_slide_master", "edit_slide_xml", "execute_office_js"].includes(
            entry.toolName,
          ),
        );
        if (relevantExecutions.length === 0) {
          return {
            suiteId: "powerpoint:template-preservation",
            label: "Template and theme preservation",
            expectedEffect:
              "Template-sensitive edits preserve the deck's existing visual language.",
            observedEffect:
              "No template-sensitive tool evidence was captured for review.",
            status: "retryable",
            evidence: context.promptNotes,
            retryable: true,
          };
        }

        const hadErrors = relevantExecutions.some((entry) => entry.isError);
        return {
          suiteId: "powerpoint:template-preservation",
          label: "Template and theme preservation",
          expectedEffect:
            "Template-sensitive edits preserve the deck's existing visual language.",
          observedEffect: hadErrors
            ? "A template-sensitive write failed during the edit flow."
            : "Template-sensitive writes completed without host errors.",
          status: hadErrors ? "failed" : "passed",
          evidence: [
            ...context.promptNotes,
            ...relevantExecutions.map((entry) => entry.toolName),
          ],
          retryable: false,
        };
      },
    },
    {
      id: "powerpoint:chart-data-integrity",
      label: "Chart and slide-data integrity",
      appliesTo: (context) => PPT_CHART_RE.test(context.request),
      verify: (context) => {
        const chartExecutions = context.toolExecutions.filter((entry) =>
          ["edit_slide_chart", "execute_office_js"].includes(entry.toolName),
        );
        if (chartExecutions.length === 0) {
          return {
            suiteId: "powerpoint:chart-data-integrity",
            label: "Chart and slide-data integrity",
            expectedEffect:
              "Chart and data edits preserve labels, legends, and intended data meaning.",
            observedEffect:
              "No chart or slide-data tool evidence was captured after the edit.",
            status: "retryable",
            evidence: [],
            retryable: true,
          };
        }

        const hadErrors = chartExecutions.some((entry) => entry.isError);
        return {
          suiteId: "powerpoint:chart-data-integrity",
          label: "Chart and slide-data integrity",
          expectedEffect:
            "Chart and data edits preserve labels, legends, and intended data meaning.",
          observedEffect: hadErrors
            ? "A chart or slide-data write failed during the edit flow."
            : "Chart/data write evidence was captured without host errors.",
          status: hadErrors ? "failed" : "passed",
          evidence: chartExecutions.map((entry) => entry.resultText),
          retryable: false,
        };
      },
    },
  ];
}
