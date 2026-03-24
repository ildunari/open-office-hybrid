# Session 3B: Factory Droid Fortification Pass

**Run this AFTER Sessions 1-3 complete, BEFORE Session 4.**
**Agents: 4-6**

Drag the Factory Droid analysis file into the chat alongside this prompt:
- `factory-droid-reference/design-system-analysis.md`

---

## Prompt

```
This is a visual refinement pass on everything built so far — the Design Tokens frame, Component Library frame, and Icon Set frame. The current design leans too modern-web-app and needs to be pulled toward a more utilitarian, terminal-native, Factory Droid / basement.studio aesthetic. Read the attached design system analysis for reference.

Do NOT rebuild anything from scratch. Adjust and fortify the existing work.

Work on these tracks in parallel:

TRACK A — Canvas Cleanup:

Before making any visual changes, scan the entire canvas for overlapping frames. Some frames and containers from the previous sessions may be sitting on top of each other. Reorganize so that:
- No frames overlap
- Related content is grouped with consistent spacing between groups
- The canvas reads left-to-right, top-to-bottom in a logical order
- Adequate padding between all top-level frames (at least 100px)
Take a screenshot after reorganizing to verify nothing overlaps.

TRACK B — Token Adjustments (Design Tokens frame):

Pull the token palette toward Factory Droid's conventions:

1. Border radius: Reduce across the board. Interactive elements (buttons, inputs, tags) should use 2px radius, not 4px. Containers (cards, panels) should use 4px, not 8px. The overall feel should be harder-edged, more rectangular. Only pills and status dots keep 9999px.

2. Typography: Tighten line-heights. Body text should be 130-140%, not the default 150%+. Labels and metadata should be 100-120%. This increases information density. Add tighter letter-spacing on monospace labels: -0.02rem.

3. Borders: Make the default border slightly more visible. The hierarchy should read clearly through border weight alone. Add a 1px full-width horizontal divider between every major section — Factory Droid uses full-bleed dividers as the primary section separator, not whitespace.

4. Add a subtle background line texture token. Factory uses repeating line patterns on dark backgrounds. Include a token for an optional CSS background-image using repeating-linear-gradient to create faint horizontal or grid lines at ~24px intervals, very low opacity (2-3%).

TRACK C — Component Hardening (Component Library frame):

Adjust all components to feel more utilitarian and industrial:

1. Buttons: Reduce radius to 2px. Make the text slightly smaller (11px instead of 12px). The ALL-CAPS monospace treatment is correct — keep it. Add a subtle 1px border to the Primary button even when filled (border matches the fill color but is visible on hover). Ghost buttons should show their border on hover, not a background fill.

2. Cards: Reduce radius to 4px. Ensure ALL cards use 1px border-driven hierarchy with zero shadow. The tool call card header should feel like a terminal log entry — tighter padding (8px 12px), monospace for everything in the header row, not just the tool name.

3. Tags/Badges: Reduce radius to 2px. Make them feel like terminal tags — tighter, denser, slightly smaller text (10px). The status dot glow from Nexora Mono is good — keep it, but make the glow subtle (1-2px spread, low opacity).

4. Inputs: Reduce radius to 2px. The focus state should be a simple 1px border change to accent orange, not a glow/shadow effect. Glows feel too soft — Factory Droid would use a hard 1px border and nothing else.

5. Section labels: Ensure the orange dot is exactly 6px (not 8px). The dot should feel precise, not decorative. The horizontal rule after the label should extend to the full width of the container. This is the Factory Droid signature pattern — tight, functional, industrial.

6. Skeleton loaders: The shimmer animation should be subtle and fast (800ms, not 1500ms). The gradient should use warm grays, not cool ones. It should feel like a scan line, not a loading shimmer.

7. Add a new pattern: Terminal prompt prefix. A small `>` character in accent orange, monospace, used before input placeholders and command-style text. This is a Factory Droid signature element.

TRACK D — Icon Adjustments (Icon Set frame):

1. Review all icons for consistency. They should all share the same 1.5px stroke weight with no variation. Joins should be sharp (miter), not rounded. The overall feel should be geometric, precise, and schematic — like icons on an industrial control panel, not a friendly mobile app.

2. The phase icons (discuss, plan, execute, verify, etc.) should feel like status indicators on a terminal dashboard. Small, precise, dense. Not the friendly rounded style of modern UI kits.

3. Add a "terminal prompt" icon: a simple `>_` character rendered as a geometric SVG with blinking cursor. This is the Factory Droid mascot glyph.

4. Ensure the status dots are clean circles with no anti-aliasing artifacts. 6px for inline use, 8px for standalone. The running-state dot should pulse with a hard step (not smooth ease), matching a terminal cursor blink aesthetic.
```

---

## What This Changes

| Element | Before (too modern) | After (Factory Droid) |
|---------|--------------------|-----------------------|
| Border radius | 4px / 8px | 2px / 4px |
| Line height | 150%+ | 130-140% body, 100-120% labels |
| Input focus | Orange glow shadow | Hard 1px orange border |
| Card hierarchy | Border + occasional shadow | Border only, full-bleed dividers |
| Skeleton shimmer | 1500ms smooth | 800ms, scan-line feel |
| Information density | Spacious | Tight, utilitarian |
| Section dividers | Whitespace | Full-width 1px horizontal rules |
| Ghost button hover | Background fill | Border appears |
| Background | Flat color | Optional faint line texture |
| Orange dot | 8px | 6px (precise, not decorative) |
