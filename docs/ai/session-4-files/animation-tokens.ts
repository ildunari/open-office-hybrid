// ═══════════════════════════════════════════════
// Animation Tokens — Factory × Geist Terminal UI
// ═══════════════════════════════════════════════
// Central source of truth for all timing, easing,
// and color values. Tweak here, propagate everywhere.

export const duration = {
  instant: 0.075,
  fast: 0.15,
  normal: 0.25,
  medium: 0.35,
  slow: 0.5,
  slower: 0.8,
  loop: 1.2,
  breathe: 2.0,
} as const;

export const easing = {
  default: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  out: [0, 0, 0.25, 1] as [number, number, number, number],
  inOut: [0.42, 0, 0.58, 1] as [number, number, number, number],
  sharp: [0.4, 0, 0.2, 1] as [number, number, number, number],
} as const;

export const spring = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 30 },
  gentle: { type: "spring" as const, stiffness: 200, damping: 25 },
  layout: { type: "spring" as const, stiffness: 300, damping: 30 },
} as const;

export const stagger = {
  fast: 0.04,
  normal: 0.08,
  slow: 0.12,
} as const;

// Factory × Geist design tokens
export const color = {
  bg: {
    base: "#020202",
    raised: "#0A0A0A",
    surface: "#111111",
    overlay: "#1A1A1A",
    inset: "#000000",
  },
  border: {
    default: "#4D4947",
    subtle: "#2A2827",
    strong: "#8A8380",
  },
  text: {
    primary: "#EEEEEE",
    secondary: "#A49D9A",
    tertiary: "#6B6462",
    ghost: "#3D3A39",
  },
  accent: {
    500: "#D15010",
    600: "#E8650A",
    700: "#F07A1A",
    900: "#FBBF7A",
  },
  semantic: {
    success: "#2D9B4E",
    error: "#C93B3B",
    info: "#2D7DD2",
  },
  // Terminal-specific palette (the prompt asks for cyan/green)
  terminal: {
    cyan: "#5EEAD4",
    cyanDim: "#2DD4BF40",
    green: "#4ADE80",
    greenDim: "#4ADE8040",
    amber: "#FBBF7A",
    amberDim: "#FBBF7A30",
  },
} as const;
