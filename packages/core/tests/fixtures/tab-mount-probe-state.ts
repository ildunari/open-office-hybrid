export type ProbeName = "chat" | "files" | "settings";

type ProbeCounts = Record<ProbeName, { mounted: number; unmounted: number }>;

const emptyCounts = (): ProbeCounts => ({
  chat: { mounted: 0, unmounted: 0 },
  files: { mounted: 0, unmounted: 0 },
  settings: { mounted: 0, unmounted: 0 },
});

let counts = emptyCounts();

export function recordMount(name: ProbeName) {
  counts[name].mounted += 1;
}

export function recordUnmount(name: ProbeName) {
  counts[name].unmounted += 1;
}

export function resetProbeCounts() {
  counts = emptyCounts();
}

export function getProbeCounts() {
  return counts;
}
