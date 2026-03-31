# Design Systems

Complete, self-contained design system packages. Each system is a full kit: tokens, components, documentation, and a live preview.

## What belongs here

- Full design systems with CSS tokens, component styles, and docs
- Each system in its own subfolder
- Systems that define an entire visual language (colors, type, spacing, components, motion)

## What does NOT belong here

- Standalone color palettes → `../palettes/`
- Individual font pairings → `../typography/`
- Loose animation presets → `../motion/`
- One-off UI patterns → `../patterns/`
- Standalone icon sets → `../iconography/`

## Related Assets

Systems often have companion assets in other categories. Use the family prefix to find them:

```
systems/forge/                     ← Full system
iconography/forge-tool-icons/      ← Icons for this system
motion/forge-terminal/             ← Animations for this system
```

## Required Structure per System

```
{system-name}/
  manifest.json              Metadata (name, version, heritage, targets)
  README.md                  Overview and quick start
  tokens/                    CSS, JSON, Tailwind tokens
  preview/                   Interactive visual reference (index.html)
  components/                Component stylesheets
  docs/                      Specification, usage guide, research
  assets/                    Local fonts/icons (if needed)
  reference-app/             Working implementation (optional)
```

## Systems

| Name | Accent | Heritage | Status |
|------|--------|----------|--------|
| [forge](forge/) | `#D15010` | Geist x Factory Droid | Complete (tokens, components, preview, docs) |
| [forge-mobile](forge-mobile/) | `#FF4F00` | Factory Hybrid | Spec only (design doc) |
| [nexora-mono](nexora-mono/) | None (pure B&W) | Monochromatic blueprint | Spec + reference app |
