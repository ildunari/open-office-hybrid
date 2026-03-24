// ═══════════════════════════════════════════════
// Motion Presets — Reusable variant objects
// ═══════════════════════════════════════════════
// Use these as `variants` or spread into `initial`/`animate`/`exit` props.

import type { Variants } from "motion/react";
import { duration, easing, spring } from "./animation-tokens";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(2px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: duration.normal, ease: easing.out },
  },
  exit: {
    opacity: 0,
    y: -4,
    filter: "blur(2px)",
    transition: { duration: duration.fast },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.normal, ease: easing.out },
  },
  exit: { opacity: 0, transition: { duration: duration.fast } },
};

export const softScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: spring.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: duration.fast },
  },
};

export const terminalReveal: Variants = {
  hidden: { opacity: 0, y: 4, scaleY: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scaleY: 1,
    transition: {
      duration: duration.normal,
      ease: easing.sharp,
    },
  },
  exit: {
    opacity: 0,
    scaleY: 0.98,
    transition: { duration: duration.fast },
  },
};

export const panelExpand: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: duration.normal, ease: easing.inOut },
  },
  expanded: {
    height: "auto",
    opacity: 1,
    transition: {
      height: { duration: duration.medium, ease: easing.out },
      opacity: { duration: duration.normal, delay: 0.05 },
    },
  },
};

export const statusPulse: Variants = {
  idle: { scale: 1, opacity: 0.5 },
  active: {
    scale: [1, 1.15, 1],
    opacity: [0.6, 1, 0.6],
    transition: {
      duration: duration.breathe,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export const toolRunningLoop: Variants = {
  idle: { scaleX: 0, opacity: 0 },
  running: {
    scaleX: [0, 1, 0],
    opacity: [0, 1, 0],
    transition: {
      duration: duration.loop,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
  done: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: duration.fast },
  },
};

// Stagger container preset — use as parent variant
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

// Stagger child preset
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: easing.out },
  },
};
