export interface TrackedMutation {
  toolName: string;
  scope: string;
  summary: string;
}

export function buildUndoNarrative(mutations: TrackedMutation[]): string {
  if (mutations.length === 0) {
    return "To undo: no explicit mutations were tracked for this task.";
  }

  const steps = mutations.map(
    (mutation, index) =>
      `${index + 1}. ${mutation.summary} (scope: ${mutation.scope})`,
  );
  return `To undo:\n${steps.join("\n")}`;
}
