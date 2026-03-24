"use client";

// ═══════════════════════════════════════════════
// Tool Icons — Complete SVG icon set
// ═══════════════════════════════════════════════
// Each icon is a pure function returning JSX SVG.
// State class is applied to root <svg> for CSS animations.

import type { ComponentType } from "react";

export type ToolIconState = "idle" | "running" | "done" | "error";

interface ToolIconProps {
  state?: ToolIconState;
  size?: number;
  className?: string;
}

const stateVars: Record<ToolIconState, React.CSSProperties> = {
  idle: { "--icon-stroke": "#6B6462", "--icon-accent": "#3D3A39" } as React.CSSProperties,
  running: { "--icon-stroke": "#D15010", "--icon-accent": "#F07A1A" } as React.CSSProperties,
  done: { "--icon-stroke": "#EEEEEE", "--icon-accent": "#A49D9A" } as React.CSSProperties,
  error: { "--icon-stroke": "#C93B3B", "--icon-accent": "#C93B3B" } as React.CSSProperties,
};

function IconShell({ state = "idle", size = 16, className = "", children }: ToolIconProps & { children: React.ReactNode }) {
  return (
    <svg
      className={`${state} ${className}`}
      style={stateVars[state]}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {children}
    </svg>
  );
}

// ── Shorthand for repeated SVG attrs ──
const sk = "var(--icon-stroke)";
const ak = "var(--icon-accent)";

// ═══════════════════════════════════════════════
// SHARED ICONS
// ═══════════════════════════════════════════════

export function BashIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <path d="M2.5 8L5.5 5" stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path d="M2.5 8L5.5 11" stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <rect className="bash-cursor" x={7.5} y={10} width={5} height={1.5} rx={0.25} fill={sk} />
    </IconShell>
  );
}

export function ReadIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <g className="read-head">
        <path d="M2 3L3.5 4.5L2 6" stroke={sk} strokeWidth={1.2} strokeLinecap="square" />
      </g>
      <line x1={5} y1={4} x2={14} y2={4} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <line x1={5} y1={8} x2={12} y2={8} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <line x1={5} y1={12} x2={10} y2={12} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
    </IconShell>
  );
}

export function WebSearchIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <circle cx={5} cy={10} r={2} fill={sk} />
      <path className="sig-1" d="M8 7.5C9.2 8.5 9.2 10.5 8 11.5" stroke={sk} strokeWidth={1.5} strokeLinecap="round" />
      <path className="sig-2" d="M10.5 5C12.8 7 12.8 11 10.5 13" stroke={sk} strokeWidth={1.5} strokeLinecap="round" />
    </IconShell>
  );
}

export function WebFetchIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <line x1={3} y1={3} x2={13} y2={3} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <g className="fetch-arrow">
        <line x1={8} y1={5} x2={8} y2={12} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
        <path d="M5.5 9.5L8 12L10.5 9.5" stroke={sk} strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
      </g>
    </IconShell>
  );
}

export function ScreenshotIcon(p: ToolIconProps & { aspect?: "square" | "wide" | "portrait" }) {
  const { aspect = "square", ...rest } = p;
  const corners = {
    square: { tl: "M1 5V1.5H5", tr: "M15 5V1.5H11", bl: "M1 11V14.5H5", br: "M15 11V14.5H11" },
    wide: { tl: "M1 5.5V3H4.5", tr: "M15 5.5V3H11.5", bl: "M1 10.5V13H4.5", br: "M15 10.5V13H11.5" },
    portrait: { tl: "M3 5V1H6", tr: "M13 5V1H10", bl: "M3 11V15H6", br: "M13 11V15H10" },
  }[aspect];

  return (
    <IconShell {...rest}>
      <path className="c-tl" d={corners.tl} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path className="c-tr" d={corners.tr} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path className="c-bl" d={corners.bl} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path className="c-br" d={corners.br} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
    </IconShell>
  );
}

export function ExecuteJsIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <path d="M1.5 4L4.5 8L1.5 12" stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path d="M14.5 4L11.5 8L14.5 12" stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
      <path className="bolt" d="M9 2.5L7 7.5H9.5L7 13.5" stroke={sk} strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
    </IconShell>
  );
}

// ═══════════════════════════════════════════════
// EXCEL ICONS
// ═══════════════════════════════════════════════

function ExcelGrid({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <rect x={1.5} y={1.5} width={13} height={13} rx={0.5} stroke={sk} strokeWidth={1.2} fill="none" />
      <line x1={6} y1={1.5} x2={6} y2={14.5} stroke={sk} strokeWidth={0.7} />
      <line x1={10.5} y1={1.5} x2={10.5} y2={14.5} stroke={sk} strokeWidth={0.7} />
      <line x1={1.5} y1={5.5} x2={14.5} y2={5.5} stroke={sk} strokeWidth={0.7} />
      <line x1={1.5} y1={10} x2={14.5} y2={10} stroke={sk} strokeWidth={0.7} />
      {children}
    </>
  );
}

export function GetCellRangesIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <ExcelGrid>
        <g className="crosshair">
          <circle cx={8.25} cy={7.75} r={1.8} stroke={sk} strokeWidth={1.2} fill="none" />
          <line x1={8.25} y1={5.5} x2={8.25} y2={4.5} stroke={sk} strokeWidth={1} />
          <line x1={8.25} y1={10} x2={8.25} y2={11} stroke={sk} strokeWidth={1} />
          <line x1={6} y1={7.75} x2={5} y2={7.75} stroke={sk} strokeWidth={1} />
          <line x1={10.5} y1={7.75} x2={11.5} y2={7.75} stroke={sk} strokeWidth={1} />
        </g>
      </ExcelGrid>
    </IconShell>
  );
}

export function SetCellRangeIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <rect x={1.5} y={5.5} width={13} height={9} rx={0.5} stroke={sk} strokeWidth={1.2} fill="none" />
      <line x1={6} y1={5.5} x2={6} y2={14.5} stroke={sk} strokeWidth={0.7} />
      <line x1={10.5} y1={5.5} x2={10.5} y2={14.5} stroke={sk} strokeWidth={0.7} />
      <line x1={1.5} y1={10} x2={14.5} y2={10} stroke={sk} strokeWidth={0.7} />
      <g className="inject-arrow">
        <line x1={8} y1={1} x2={8} y2={5} stroke={sk} strokeWidth={1.5} strokeLinecap="square" />
        <path d="M6 3.5L8 5.5L10 3.5" stroke={sk} strokeWidth={1.2} strokeLinecap="square" />
      </g>
    </IconShell>
  );
}

export function SearchDataIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <ExcelGrid>
        <line className="sweep-line" x1={2} y1={8} x2={14} y2={8} stroke="#D15010" strokeWidth={1.5} strokeLinecap="square" opacity={0.8} />
      </ExcelGrid>
    </IconShell>
  );
}

export function ClearCellRangeIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <ExcelGrid>
        <line className="strike-line" x1={2} y1={2} x2={14} y2={14} stroke={ak} strokeWidth={1.5} strokeLinecap="square" />
      </ExcelGrid>
    </IconShell>
  );
}

export function VerifySlidesIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <path d="M8 1L2 4V8C2 11.3 4.7 14.3 8 15C11.3 14.3 14 11.3 14 8V4L8 1Z" stroke={sk} strokeWidth={1.2} fill="none" strokeLinejoin="miter" />
      <path className="check-mark" d="M5.5 8L7.5 10L11 6" stroke={sk} strokeWidth={1.5} strokeLinecap="square" strokeLinejoin="miter" />
    </IconShell>
  );
}

export function EditSlideXmlIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <rect x={1} y={2.5} width={14} height={11} rx={1} stroke={sk} strokeWidth={1.2} fill="none" />
      <g className="xml-bracket">
        <path d="M4 6L2.5 8L4 10" stroke={sk} strokeWidth={1.3} strokeLinecap="square" />
        <path d="M12 6L13.5 8L12 10" stroke={sk} strokeWidth={1.3} strokeLinecap="square" />
        <line x1={9} y1={5.5} x2={7} y2={10.5} stroke={sk} strokeWidth={1.2} strokeLinecap="square" />
      </g>
    </IconShell>
  );
}

export function EditSlideChartIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <line x1={2} y1={14} x2={14} y2={14} stroke={sk} strokeWidth={1.2} />
      <rect className="bar-1" x={3} y={8} width={2.5} height={6} rx={0.3} fill={sk} opacity={0.7} />
      <rect className="bar-2" x={6.75} y={4} width={2.5} height={10} rx={0.3} fill={sk} opacity={0.85} />
      <rect className="bar-3" x={10.5} y={1.5} width={2.5} height={12.5} rx={0.3} fill={sk} />
    </IconShell>
  );
}

export function DocStructureIcon(p: ToolIconProps) {
  return (
    <IconShell {...p}>
      <circle cx={8} cy={2.5} r={1.5} stroke={sk} strokeWidth={1.2} fill="none" />
      <g className="tree-branch">
        <line x1={8} y1={4} x2={4} y2={8} stroke={sk} strokeWidth={1} />
        <circle cx={4} cy={9} r={1.2} stroke={sk} strokeWidth={1.2} fill="none" />
      </g>
      <g className="tree-branch-2">
        <line x1={8} y1={4} x2={12} y2={8} stroke={sk} strokeWidth={1} />
        <circle cx={12} cy={9} r={1.2} stroke={sk} strokeWidth={1.2} fill="none" />
      </g>
      <line x1={4} y1={10.2} x2={4} y2={12.5} stroke={sk} strokeWidth={0.8} />
      <circle cx={4} cy={13.5} r={0.8} fill={sk} />
      <line x1={12} y1={10.2} x2={12} y2={12.5} stroke={sk} strokeWidth={0.8} />
      <circle cx={12} cy={13.5} r={0.8} fill={sk} />
    </IconShell>
  );
}

// ── Registry ──
export const ICON_REGISTRY: Record<string, ComponentType<ToolIconProps>> = {
  bash: BashIcon,
  read: ReadIcon,
  web_search: WebSearchIcon,
  web_fetch: WebFetchIcon,
  screenshot_range: ScreenshotIcon,
  screenshot_slide: (p) => <ScreenshotIcon {...p} aspect="wide" />,
  screenshot_document: (p) => <ScreenshotIcon {...p} aspect="portrait" />,
  eval_officejs: ExecuteJsIcon,
  execute_office_js: ExecuteJsIcon,
  get_cell_ranges: GetCellRangesIcon,
  set_cell_range: SetCellRangeIcon,
  search_data: SearchDataIcon,
  clear_cell_range: ClearCellRangeIcon,
  verify_slides: VerifySlidesIcon,
  edit_slide_xml: EditSlideXmlIcon,
  edit_slide_chart: EditSlideChartIcon,
  get_document_structure: DocStructureIcon,
  _fallback: ExecuteJsIcon,
};

export function ToolIcon({ toolName, ...rest }: ToolIconProps & { toolName: string }) {
  const Icon = ICON_REGISTRY[toolName] ?? ICON_REGISTRY._fallback;
  return <Icon {...rest} />;
}
