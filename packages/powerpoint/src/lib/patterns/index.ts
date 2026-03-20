import type {
  Disposable,
  HookRegistry,
  ReasoningPattern,
} from "@office-agents/core/sdk";

function asHookRegistry(registry: unknown): HookRegistry {
  return registry as HookRegistry;
}

function composeDisposables(disposables: Disposable[]): Disposable {
  return {
    dispose() {
      for (const disposable of disposables) {
        disposable.dispose();
      }
    },
  };
}

function requestText(plan?: { userRequest?: string }): string {
  return plan?.userRequest?.toLowerCase() ?? "";
}

function notePattern(
  id: string,
  note: string,
  toolNames: string[],
  expectedVerifierIds: string[],
  trigger: (request: string) => boolean,
): ReasoningPattern {
  return {
    id,
    name: id,
    apps: ["powerpoint"],
    defaultState: () => ({}),
    triggers: (classification, plan) =>
      classification.needsPlan && trigger(requestText(plan)),
    describeActivation: () => ({
      id,
      reason: note,
      expectedVerifierIds,
    }),
    activate: (registry) => {
      const hooks = asHookRegistry(registry);
      const disposables = toolNames.map((toolName) =>
        hooks.registerPre({
          name: `${id}:${toolName}`,
          selector: { toolNames: [toolName] },
          speed: "sync",
          source: { patternId: id, hookName: toolName },
          execute: () => ({
            action: "continue",
            promptNotes: [
              {
                level: "info",
                text: note,
                source: { patternId: id, hookName: toolName },
              },
            ],
          }),
        }),
      );
      return composeDisposables(disposables);
    },
  };
}

export function getPowerPointReasoningPatterns(): ReasoningPattern[] {
  return [
    notePattern(
      "powerpoint:layout-verification",
      "Re-run slide layout verification after moving text, resizing shapes, or changing slide structure so overlap and overflow regressions do not slip through.",
      ["edit_slide_text", "edit_slide_xml", "execute_office_js"],
      ["powerpoint:layout-verification"],
      (request) =>
        /\b(layout|reflow|fit|overflow|overlap|spacing|align|position|resize|text fit)\b/i.test(
          request,
        ),
    ),
    notePattern(
      "powerpoint:template-preservation",
      "Preserve the deck's existing template language, theme choices, and master/layout structure unless the user explicitly asked for a deck-wide redesign.",
      ["edit_slide_master", "edit_slide_xml", "execute_office_js"],
      ["powerpoint:template-preservation"],
      (request) =>
        /\b(template|theme|master|layout|brand|preserve|existing deck)\b/i.test(
          request,
        ),
    ),
    notePattern(
      "powerpoint:chart-data-integrity",
      "Keep chart bindings, labels, legends, and source-data intent aligned whenever you change chart or slide data.",
      ["edit_slide_chart", "execute_office_js"],
      ["powerpoint:chart-data-integrity"],
      (request) =>
        /\b(chart|graph|data|series|legend|axis|label)\b/i.test(request),
    ),
  ];
}
