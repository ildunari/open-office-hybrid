<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

## Factory — Design Principles \& Visual Information Extracted

Here is a comprehensive breakdown of every design principle, visual token, and UI pattern observed across the entire showcase page.[^1]

***

### 🎨 Color Palette

The color palette is clearly displayed in the hero section as vertical swatches:[^1]


| Token | Value / Description |
| :-- | :-- |
| **Primary / Brand Orange** | `#E8450A` or similar warm burnt orange — used for accent dots, active states, CTAs, numbered list markers, and the "Showcase" nav highlight |
| **Near-Black / Background** | Deep charcoal/black `#111111` or `#0D0D0D` — primary background for dark UI sections |
| **Pure White** | `#FFFFFF` — used for text on dark backgrounds and the light UI section background |
| **Light Gray** | `#D0D0D0` or similar — used in the color swatch strip |
| **Medium Gray** | `#999999` — secondary text, subtle UI elements |
| **Dark Gray** | `#444444` / `#555555` — used in the color strip transition between black and light |

The palette is deliberately minimal: **black + white + one orange accent**. This reflects an industrial, engineering-grade aesthetic.

***

### 🔤 Typography

**Typeface Style:** Monospace / terminal-influenced for code/feature blocks; sans-serif for headlines and body text.


| Usage | Style |
| :-- | :-- |
| **Hero Logotype "FACTORY"** | All-caps, wide-tracking, bold geometric sans-serif — suggests infrastructure-scale confidence |
| **Section Headlines** | Large, high-contrast serif or geometric sans (e.g., "At Factory, our mission is to Bring Autonomy to Software Engineering") — editorial weight |
| **Body Copy** | Small, regular weight sans-serif; tight line height |
| **Code / Terminal Text** | Monospace font (resembling VSCode / terminal output); lowercase commands like `droid --task "fix the bug in $1."` |
| **Section Labels** | Small all-caps spaced labels (e.g., "VALUES", "OUR INVESTORS", "FOOTER", "KEY FEATURES") accompanied by an orange dot — used as section eyebrows |
| **Navigation Items** | Small, regular weight caps or mixed case; active state in orange |


***

### 🧩 Logo \& Iconography

- **Logo:** A stylized **snowflake / asterisk-like geometric mark** — an 8-pointed radial symbol with open negative space. It is used consistently: in the top-left nav, on every mobile/desktop mockup screen, and as a standalone mark on cards.[^1]
- **Icon style:** Pixel-friendly, outline-based, very minimal — matching the terminal/IDE aesthetic (e.g., `</>`, `>_`, `[ ]`, shield icons for security).
- **Bullet markers:** Orange filled circles (`●`) are used as section-label prefixes (not standard bullets).
- **Arrow CTA:** `→` character used inline in button labels ("START BUILDING →", "LEARN MORE →").

***

### 🏗️ Layout \& Grid

- **Two-column split:** The showcase page itself uses a persistent **fixed left sidebar** (project meta info) and a **scrollable right content area** — a classic editorial/portfolio layout.
- **Full-bleed content sections** alternate between light (`#F5F5F5`-ish) and dark (`#111`) backgrounds to create visual rhythm.
- **Masonry / mosaic grid** used for product screenshot galleries — varying column widths and heights with tight gutters (~4–8px).
- **Card-based layout** for mobile mockups and feature showcases — rounded rectangle cards with dark backgrounds, consistent padding.
- **Three-panel side-by-side mockup rows** (mobile screens) shown at a slight scale to simulate device context.

***

### 📐 Spacing \& Sizing

- **Section padding:** Generous vertical whitespace between sections (~80–120px conceptually).
- **Card corner radius:** Moderate rounding — approximately `8–12px` on inner cards; larger `16–20px` on outer device frames.
- **Tight internal padding** on code/terminal components — sparse density matching IDE UI conventions.

***

### 🖥️ UI Components Shown

| Component | Design Notes |
| :-- | :-- |
| **Navigation bar** | Top, horizontal, minimal. Items: Product (with dropdown), Enterprise, Pricing, News, Company, Docs, + LOG IN / CONTACT SALES buttons. LOG IN = outlined white; CONTACT SALES = black filled. |
| **Mega-menu / dropdown** | Dark modal-style flyout with two states: (1) collapsed list view, (2) expanded with product icons and sub-descriptions. Items: Terminal/IDE, Slack/Teams, Web, Project Manager, CLI. |
| **CTA Buttons** | Two styles: (1) Black-filled with white all-caps text; (2) Outlined/border-only. Arrow `→` appended inline. |
| **Section label chips** | Small pill-shaped tags (e.g., "COMPANY", "ENGINEERING", "OPERATIONS") with a colored fill — used for content categorization on blog/job cards. |
| **Job listing cards** | Dark card, category tag, role title in large bold text, location + type in small gray. "APPLY →" button. |
| **Feature list** | Icon + headline + short monospace description. Icons: `</>`, `>_`, etc. |
| **Pricing table** | Light background, 4 tiers (BYOK \$0 / Pro \$20/mo / Max \$200/mo / Enterprise). Feature checklist layout per column. |
| **Terminal / CLI mockup** | Dark screen with orange-highlighted syntax, code command lines, `RUN` button. |
| **Bug tracker UI** | Rows of "BUG 1 / BUG 2 / BUG 3" labels — orange for active/in-progress, white check for resolved. |
| **News/blog grid** | Dark background, image thumbnails with orange overlays, card title + summary text. |
| **Security page** | Three-column grid: "Industry-leading compliance", "Never misusing your data", "Securely hosted" — with icon + body. |
| **Values page** | Light background, large mission statement, numbered list with orange number markers. |


***

### ✏️ Design Principles (Brand/Philosophy Layer)

These are explicitly stated on the page or implied by the visual system:[^1]

1. **Industrial precision** — The design language mirrors factory/infrastructure metaphors: monospace type, terminal UIs, geometric marks, grid rigor.
2. **Autonomy-first messaging** — Visual hierarchy always foregrounds the "autonomous agent" concept. Feature labels say things like "Adjust autonomy levels", "AI that will work with you, not replace you."
3. **Developer-native aesthetic** — Dark mode UI, code syntax highlighting, CLI commands in marketing materials. The product meets engineers in their own visual language.
4. **Minimal color = maximum trust** — The restrained palette (black/white/one orange) signals enterprise-grade seriousness.
5. **Precision over decoration** — No gradients, no photography, no decorative illustration. All UI is functional, data-forward.
6. **Transparency and control** — Design explicitly communicates "explicit control, never surprise changes" — reflected in UI patterns showing user-confirmable actions.
7. **Scalability signaling** — Layout and typography choices communicate enterprise scale (wide type, large section headings, institutional tone).

***

### 🔁 Motion / Interaction Hints (inferred from layout)

- The hero section shows **animated connection lines / signal paths** (sinusoidal curves with dot markers in orange and gray) — suggesting real-time agent activity or data flow.
- Section transitions likely use **fade or slide** based on section separation rhythm.
- Dropdown menus have clear **two-state behavior** (collapsed list vs. expanded icon-grid).

***

### 📋 Summary: Core Design Tokens

| Token | Value |
| :-- | :-- |
| Primary accent | Orange (~`#E8450A`) |
| Background dark | Near-black (`#111`) |
| Background light | Off-white / light gray (`#F4F4F4`) |
| Text primary | White (on dark) / Black (on light) |
| Text secondary | Medium gray |
| Font style | Geometric sans + monospace pairing |
| Corner radius | 8–16px |
| Border style | 1px solid gray or white at low opacity |
| Section label prefix | Orange filled dot `●` |
| CTA style | Filled black or outlined, all-caps, arrow suffix |
| Logo mark | 8-point geometric snowflake/asterisk |

<div align="center">⁂</div>

[^1]: https://basement.studio/showcase/factory-precision-in-the-age-of-autonomy

