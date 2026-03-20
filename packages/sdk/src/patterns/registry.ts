import type { ExecutionPlan, TaskClassification } from "../planning";
import type { ActivePatternMetadata } from "../verification/types";
import type { Disposable, ReasoningPattern } from "./types";

interface ActivePattern {
  id: string;
  disposable: Disposable;
  metadata: ActivePatternMetadata;
}

export class PatternRegistry {
  private readonly patterns = new Map<string, ReasoningPattern>();
  private readonly active = new Map<string, ActivePattern>();

  register(pattern: ReasoningPattern): void {
    this.patterns.set(pattern.id, pattern);
  }

  unregister(patternId: string): void {
    this.deactivate(patternId);
    this.patterns.delete(patternId);
  }

  listPatterns(): ReasoningPattern[] {
    return Array.from(this.patterns.values());
  }

  getActivePatternIds(): string[] {
    return Array.from(this.active.keys());
  }

  getActivePatternMetadata(): ActivePatternMetadata[] {
    return Array.from(this.active.values()).map((entry) => entry.metadata);
  }

  activateMatching(
    registry: unknown,
    classification: TaskClassification,
    plan?: ExecutionPlan,
  ): string[] {
    const activated: string[] = [];
    for (const pattern of this.patterns.values()) {
      if (
        !pattern.triggers(classification, plan) ||
        this.active.has(pattern.id)
      ) {
        continue;
      }
      const disposable = pattern.activate(registry, pattern.defaultState());
      this.active.set(pattern.id, {
        id: pattern.id,
        disposable,
        metadata: pattern.describeActivation?.(classification, plan) ?? {
          id: pattern.id,
          reason: "Pattern matched current task classification.",
        },
      });
      activated.push(pattern.id);
    }
    return activated;
  }

  deactivate(patternId: string): void {
    const activePattern = this.active.get(patternId);
    if (!activePattern) return;
    activePattern.disposable.dispose();
    this.active.delete(patternId);
  }

  deactivateAll(): void {
    for (const activePattern of this.active.values()) {
      activePattern.disposable.dispose();
    }
    this.active.clear();
  }
}
