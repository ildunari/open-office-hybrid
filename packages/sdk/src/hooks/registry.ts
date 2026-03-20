import type { AgentTool } from "@mariozechner/pi-agent-core";
import { wrapTool } from "./tool-wrapper";
import type {
  Disposable,
  HookBand,
  HookBudget,
  HookPromptNote,
  HookSelector,
  HookSessionState,
  HookWarning,
  PostHookContext,
  PostHookDefinition,
  PostHookResult,
  PreHookContext,
  PreHookDefinition,
  PreHookResult,
  ToolTag,
} from "./types";

type HookDefinition = PreHookDefinition | PostHookDefinition;

export class HookRegistry {
  private preHooks: PreHookDefinition[] = [];
  private postHooks: PostHookDefinition[] = [];
  private faultCounts = new Map<string, number>();
  private disabledHooks = new Set<string>();
  private pendingPromptNotes: HookPromptNote[] = [];
  private sessionState: HookSessionState = HookRegistry.createSessionState();

  private static readonly FAULT_LIMIT = 3;
  private static readonly PRE_BUDGET_MS = 1000;
  private static readonly POST_BUDGET_MS = 1000;

  registerPre(def: PreHookDefinition): Disposable {
    this.preHooks = this.sortHooks([...this.preHooks, def]);
    return { dispose: () => this.removePre(def.name) };
  }

  registerPost(def: PostHookDefinition): Disposable {
    this.postHooks = this.sortHooks([...this.postHooks, def]);
    return { dispose: () => this.removePost(def.name) };
  }

  private removePre(name: string): void {
    this.preHooks = this.preHooks.filter((hook) => hook.name !== name);
  }

  private removePost(name: string): void {
    this.postHooks = this.postHooks.filter((hook) => hook.name !== name);
  }

  private static createSessionState(): HookSessionState {
    return {
      readScopes: new Set<string>(),
      formatFingerprints: new Map<string, string>(),
      custom: new Map<string, unknown>(),
    };
  }

  private sortHooks<T extends HookDefinition>(hooks: T[]): T[] {
    const withIndex = hooks.map((hook, index) => ({ hook, index }));
    const ordered: typeof withIndex = [];

    for (const band of ["early", "default", "late"] satisfies HookBand[]) {
      const inBand = withIndex
        .filter(({ hook }) => (hook.band ?? "default") === band)
        .sort((a, b) => {
          const priorityDiff = (b.hook.priority ?? 0) - (a.hook.priority ?? 0);
          return priorityDiff !== 0 ? priorityDiff : a.index - b.index;
        });

      const resolved = new Set<string>();
      while (inBand.length > 0) {
        const nextIndex = inBand.findIndex(({ hook }) =>
          (hook.after ?? []).every((dep) => resolved.has(dep)),
        );
        const current = inBand.splice(nextIndex === -1 ? 0 : nextIndex, 1)[0];
        ordered.push(current);
        resolved.add(current.hook.name);
      }
    }

    return ordered.map(({ hook }) => hook);
  }

  private matchesSelector(
    selector: HookSelector | undefined,
    toolName: string,
    tags: ToolTag[],
  ): boolean {
    if (!selector) return true;

    if (selector.toolNames && !selector.toolNames.includes(toolName)) {
      return false;
    }

    if (selector.toolPatterns) {
      const matched = selector.toolPatterns.some((pattern) =>
        this.globMatch(pattern, toolName),
      );
      if (!matched) return false;
    }

    if (selector.tags) {
      const matched = selector.tags.some((tag) => tags.includes(tag));
      if (!matched) return false;
    }

    return true;
  }

  private globMatch(pattern: string, value: string): boolean {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(
      `^${escaped.replace(/\*/g, ".*").replace(/\?/g, ".")}$`,
    );
    return regex.test(value);
  }

  async runPreHooks(ctx: PreHookContext): Promise<PreHookResult> {
    const budget: HookBudget = {
      totalMs: HookRegistry.PRE_BUDGET_MS,
      elapsedMs: 0,
    };
    ctx.budget = budget;

    const notes: HookPromptNote[] = [];
    let finalParams = ctx.params;

    for (const hook of this.preHooks) {
      if (
        this.disabledHooks.has(hook.name) ||
        !this.matchesSelector(hook.selector, ctx.toolName, ctx.tags)
      ) {
        continue;
      }
      if (hook.speed === "slow" && budget.elapsedMs >= budget.totalMs * 0.8) {
        continue;
      }

      const startedAt = performance.now();
      try {
        const result = await hook.execute({
          ...ctx,
          budget,
          params: finalParams,
        });
        budget.elapsedMs += performance.now() - startedAt;
        this.faultCounts.delete(hook.name);

        if (result.promptNotes) notes.push(...result.promptNotes);
        if (result.modifiedParams) {
          finalParams = result.modifiedParams;
        }
        if (result.action === "abort" || result.action === "skip") {
          return {
            ...result,
            promptNotes: notes.length > 0 ? notes : result.promptNotes,
            modifiedParams:
              finalParams !== ctx.params ? finalParams : undefined,
          };
        }
      } catch (error) {
        budget.elapsedMs += performance.now() - startedAt;
        this.recordFault(hook.name);

        const policy = hook.onFailure ?? "warn";
        if (policy === "abort") {
          return {
            action: "abort",
            errorMessage: `Hook "${hook.name}" failed: ${String(error)}`,
            promptNotes: notes,
          };
        }
        if (policy === "warn") {
          notes.push({
            level: "warning",
            text: `Hook "${hook.name}" failed: ${String(error)}`,
            source: hook.source,
          });
        }
      }
    }

    return {
      action: "continue",
      promptNotes: notes.length > 0 ? notes : undefined,
      modifiedParams: finalParams !== ctx.params ? finalParams : undefined,
    };
  }

  async runPostHooks(ctx: PostHookContext): Promise<PostHookResult> {
    const budget: HookBudget = {
      totalMs: HookRegistry.POST_BUDGET_MS,
      elapsedMs: 0,
    };
    ctx.budget = budget;

    const notes: HookPromptNote[] = [];
    const warnings: HookWarning[] = [];
    let currentResult = ctx.result;

    for (const hook of this.postHooks) {
      if (
        this.disabledHooks.has(hook.name) ||
        !this.matchesSelector(hook.selector, ctx.toolName, ctx.tags)
      ) {
        continue;
      }
      if (hook.speed === "slow" && budget.elapsedMs >= budget.totalMs * 0.8) {
        continue;
      }

      const startedAt = performance.now();
      try {
        const result = await hook.execute({
          ...ctx,
          budget,
          result: currentResult,
        });
        budget.elapsedMs += performance.now() - startedAt;
        this.faultCounts.delete(hook.name);

        if (result.warnings) warnings.push(...result.warnings);
        if (result.promptNotes) notes.push(...result.promptNotes);
        if (result.modifiedResult) {
          currentResult = result.modifiedResult;
        }
      } catch (error) {
        budget.elapsedMs += performance.now() - startedAt;
        this.recordFault(hook.name);

        if ((hook.onFailure ?? "warn") === "warn") {
          notes.push({
            level: "warning",
            text: `Post-hook "${hook.name}" failed: ${String(error)}`,
            source: hook.source,
          });
        }
      }
    }

    return {
      warnings: warnings.length > 0 ? warnings : undefined,
      promptNotes: notes.length > 0 ? notes : undefined,
      modifiedResult: currentResult !== ctx.result ? currentResult : undefined,
    };
  }

  private recordFault(hookName: string): void {
    const count = (this.faultCounts.get(hookName) ?? 0) + 1;
    this.faultCounts.set(hookName, count);
    if (count >= HookRegistry.FAULT_LIMIT) {
      this.disabledHooks.add(hookName);
    }
  }

  wrapTools(tools: AgentTool[]): AgentTool[] {
    return tools.map((tool) => wrapTool(tool, this));
  }

  drainPromptNotes(): HookPromptNote[] {
    const notes = [...this.pendingPromptNotes];
    this.pendingPromptNotes = [];
    return notes;
  }

  addPromptNotes(notes: HookPromptNote[]): void {
    this.pendingPromptNotes.push(...notes);
  }

  getSessionState(): HookSessionState {
    return this.sessionState;
  }

  getRegisteredHookNames(): string[] {
    return [
      ...this.preHooks.map((hook) => hook.name),
      ...this.postHooks.map((hook) => hook.name),
    ];
  }

  resetSessionState(): void {
    this.sessionState = HookRegistry.createSessionState();
    this.faultCounts.clear();
    this.disabledHooks.clear();
    this.pendingPromptNotes = [];
  }
}
