# Super Sheet — Future Improvements & Updates Roadmap

This document captures the long-term vision, architectural design, and thematic milestone roadmaps for future phases of **Super Sheet**. It serves as the living reference for upcoming features to ensure alignment with Super Sheet's core philosophy: **manual over automated, system-agnostic sandbox, and local-first portability**.

---

## Core Philosophy & Design Guardrails

When adding automation and advanced features to Super Sheet, the following principles remain paramount:
1. **User-Architected Over Hardcoded:** Super Sheet never hardcodes rules for specific TTRPG editions. Automation must be user-defined (like Excel/Notion formulas), keeping the engine 100% game-agnostic.
2. **Opt-In Power Features:** Advanced features (formulas, keyword suggestions, shortcuts) must never obstruct simple manual usage. If a user simply wants to type `+4` or click a stepper, they never have to touch a formula.
3. **Local-First & Portable:** All data, configurations, and formulas serialize cleanly into the unified Zod character schema and JSON export without external dependencies.
4. **Tabletop UX First:** Speed and clarity during live sessions take precedence over complexity.

---

## Roadmap Milestones

```
================================================================================
Phase 8: Formula Engine & Dynamic Math Calculations (In Planning)
--------------------------------------------------------------------------------
Theme: Bringing flexible math and rapid arithmetic to Super Sheet without rules bloat.
- Dynamic quick math in counters (+10, -5, *2, /2 on click-to-edit).
- Automatic variable publishing from Stat Groups, Trackers, Profile, and custom tags.
- System-agnostic formula evaluation (= 10 + @DEX.mod + @Prof).
- Live autocomplete dropdown when typing @.
- Safe error handling (#REF!, #CIRCULAR!) and non-destructive manual overrides.

================================================================================
Phase 9: Workflow Intelligence, Shortcuts & Omnisearch
--------------------------------------------------------------------------------
Theme: Blazing fast authoring, navigation, and power-user ergonomics.
- Global Omnisearch / Command Palette (Ctrl+K / Cmd+K) across all tabs and blocks.
- Universal keyboard shortcut suite with visual Cheatsheet modal.
- Omnisearch and shortcut discovery in Floating Tools Menu for point-and-click users.
- One-click "Duplicate Block" in the right-click Card Context Menu.
- Non-intrusive "Suggested Tags" chip tray based on card description keywords.
- Configurable Keyword Dictionary (src/utils/tagKeywords.ts) with on/off toggle.

================================================================================
Phase 10: Tabletop Utility, Session State & Printability
--------------------------------------------------------------------------------
Theme: The bridge between digital dashboards and the physical tabletop.
- Dedicated Print / Clean PDF Export (@media print stylesheet, inverted theme).
- Floating Session Scratchpad / Combat Log (ephemeral notes, monster HP, initiative).
- Visual Tag Management & Palette (custom tag colors, badge styling, bulk rename).
- Play Mode quick stat revert ("HP changed 48 -> 38. [Undo misclick]").
- Decoupled roll notation click-to-copy / VTT webhook integration.

================================================================================
Phase 11: Resilience, Storage Hardening & Performance Optimization (Completed)
--------------------------------------------------------------------------------
Theme: Eliminating persistence race conditions, hardening dual-storage consistency, and optimizing reactive render loops.
- [x] Lifecycle save flush (visibilitychange / pagehide / beforeunload) preventing tab-close data loss.
- [x] Storage split-brain reconciliation (timestamp/version checks between IDB and localStorage).
- [x] Granular Zustand selectors and "Pass IDs, Not Objects" pattern in Canvas / BlockContainer.
- [x] Scoped history / command-based undo for Play Mode counters without layout risk.

================================================================================
Phase 12 (Style Phase 0): Style Foundation & Preset Token System (Completed)
--------------------------------------------------------------------------------
Theme: Non-breaking additive schema tokens and central design registry.
- [x] Token model in schema (free strings falling back safely at render time).
- [x] Architecture in src/styles/ (types.ts, registry.ts, resolveStyle.ts).
- [x] Layer model established (bottom to top: bg color -> texture -> pattern -> image -> watermark -> content -> frame -> corners -> glow).
- [x] Stubs for svgSanitizer.ts and assetLibrary.ts.

================================================================================
Phase 13 (Style Phase 1): CSS Effects & Cascade UI (Completed)
--------------------------------------------------------------------------------
Theme: Metallic frames, chamfers, shading, and visual cascade pickers.
- [x] Gradient metallic ring masks (gold, silver, bronze, foil).
- [x] Shapes (rect, rounded, sharp, chamfer with diagonal edge reconstruction).
- [x] Inner shading (soft, deep, vignette) and glow via --card-fx.
- [x] Visual thumbnail picker (StyleOptionGrid.tsx) and bulk clear overrides.

================================================================================
Phase 14 (Style Phase 2): Canvas Patterns & Surface Textures (Completed)
--------------------------------------------------------------------------------
Theme: Rich tileable patterns and material textures without file bloat.
- [x] 8 tileable patterns (dots, grid, blueprint, hatch, hex-mesh, constellation, speckle).
- [x] 5 surface textures (grain, carbon, scanlines, glass with backdrop-filter blur).
- [x] Canvas pattern resolution, opacity & scale sliders.
- [x] Readability scrim layer for busy art.

================================================================================
Phase 15 (Style Phase 3): SVG Frame Engine & Corner Accents (Completed)
--------------------------------------------------------------------------------
Theme: High-fidelity 9-slice SVG borders and modular corner ornaments.
- [x] 9-slice SVG builder with standardized 96x96 geometry and seam alignment at 32/64.
- [x] Dynamic tint pipeline ({{COLOR}}, {{ACCENT}}, resolveLiteralColor).
- [x] 13 starter frames across 4 aesthetic families (Fantasy, Sci-Fi, Gothic, Classic).
- [x] Modular corner accents overlay engine (Layer 8) with 8 corner designs.
- [x] Dynamic content clearance offsets (--frame-pad-x, --frame-pad-y).

================================================================================
Phase 3b: Watermarks & Decals (Next)
--------------------------------------------------------------------------------
Theme: Subtle thematic background emblems and header divider ornaments.
- Card & canvas watermark layer with opacity control.
- Starter watermark emblems (d20, crest, arcane circle, biohazard, dragon).
- Card header decals and ornate dividers.

================================================================================
Phase 4: Style Packs (Planned)
--------------------------------------------------------------------------------
Theme: Curated 1-click aesthetic themes with non-destructive color preservation.

================================================================================
Phase 5: Custom User SVGs, "My Designs" & Motion (Planned)
--------------------------------------------------------------------------------
Theme: User-uploaded/pasted SVGs, IndexedDB design library, and animated effects.
================================================================================

```

---

## Detailed Specifications by Phase

### Phase 8 — Formula Engine & Dynamic Math Calculations

#### 1. Dynamic Quick-Math Counter Inputs
* **Tabletop Problem:** In combat, taking 14 damage or healing 25 HP currently requires clicking stepper buttons dozens of times or mentally calculating the new total before typing it in.
* **Solution:** Clicking/tapping the numerical value in `TrackerBlock`, temporary HP, embedded card trackers, or inventory quantities allows typing relative mathematical operations:
  * `+10` -> Adds 10 to current value.
  * `-14` -> Subtracts 14 from current value.
  * `*2` -> Multiplies current value by 2.
  * `/2` -> Halves current value (rounded/floored).
  * `35` -> Sets current value directly to 35.
  * `20 - 4` -> Evaluates to 16 and sets value.
* **Safeguards:** Clamps to minimum bounds (0 for HP/charges unless negative values are allowed by configuration) and preserves maximum limits where applicable.

#### 2. Variable Publishing Registry
Blocks automatically publish variables to a sheet-wide in-memory symbol table:
* **Stat Groups (`stat_group`):**
  * `@LABEL` (Score, e.g. `@STR` -> `16`)
  * `@LABEL.mod` or `@LABEL_sub` (Modifier/Sub, e.g. `@STR.mod` -> `3`)
* **Trackers (`tracker`):**
  * `@Title.current` and `@Title.max` (e.g. `@HP.current` -> `48`, `@HP.max` -> `52`)
* **Profile (`profile`):**
  * `@Level`, `@XP`
* **Tagged Values:**
  * Any block or item with a value tag (e.g. `#prof:3` or `@Prof: 3`) publishes `@Prof` -> `3`.

#### 3. Formula Syntax & Parser
* **Syntax:** Any numeric field (Skill modifier, passive perception, armor class, DC) can accept either a literal value (`+5`) or a formula starting with `=` (e.g. `= 10 + @DEX.mod + @Prof`).
* **Supported Operators:** `+`, `-`, `*`, `/`, `( )`, `min()`, `max()`, `floor()`, `ceil()`.
* **String Normalization:** Cleanly parses `+3` or `"14"` into standard numeric tokens.
* **Safety:** Zero `eval()` or dangerous JavaScript execution. Evaluated via a tiny, pure recursive-descent parser or lightweight math tokenizer.

#### 4. Presentation & Interaction Modes
* **Edit Mode:** Shows the formula text field with live syntax highlighting and variable pills.
* **Play Mode:** Displays the calculated result (e.g. `+5` or `15`).
  * Hovering or clicking displays a subtle badge: `fx: = @DEX.mod + @Prof (3 + 2)`.
* **Override Support:** Users can toggle or type an override without wiping out the underlying formula (vital for temporary buffs, curses, or magical items).

#### 5. Autocomplete & Error Safeguards
* **Autocomplete Popup:** Typing `@` into any formula field summons a quick filter popup listing all available sheet variables with their live values (`@STR (16)`, `@STR.mod (+3)`).
* **Missing Reference Warning:** If a formula references an unknown variable, renders `⚠️ #REF!` with a tooltip indicating missing variables.
* **Cycle Detection:** A Directed Acyclic Graph (DAG) depth check prevents infinite circular loops (`@A = @B + 1`, `@B = @A + 1`), reporting `#CIRCULAR!`.

---

### Phase 9 — Workflow Intelligence, Shortcuts & Omnisearch *(Completed)*

#### 1. Global Omnisearch / Command Palette (`Ctrl+K` / `Cmd+K`)
* [x] **Trigger:** Keyboard shortcut `Ctrl+K` / `Cmd+K`, or clicking the **Search** button in the TabBar / Floating Tools Menu.
* [x] **Search Scope:** Instant fuzzy search across:
  * Block titles across all tabs (e.g. "Action Surge", "Spell Slots")
  * Inventory items and weapons (e.g. "Longsword +1", "Potion of Healing")
  * Skill names (e.g. "Stealth", "Perception")
  * Tags (e.g. `#short-rest`, `#spell`)
* [x] **Action:** Selecting a result instantly navigates to the corresponding tab, scrolls smoothly to the target block, highlights it with an accent glow (`@keyframes searchGlow`).

#### 2. Universal Keyboard Shortcuts
* [x] Unified shortcut listener (disabled inside active text inputs) supporting:
  * `Ctrl/Cmd + K`: Open Omnisearch.
  * `E` or `Ctrl/Cmd + E`: Toggle Edit Mode / Play Mode.
  * `Ctrl/Cmd + B`: Create new Block.
  * `Ctrl/Cmd + T`: Add new Tab.
  * `Ctrl/Cmd + Z` / `Ctrl/Cmd + Shift + Z`: Undo / Redo (in Edit Mode).
  * `Ctrl/Cmd + D`: Duplicate block (via context menu or action).
  * `?`: Open Shortcut Cheatsheet modal.
* [x] **Point-and-Click Discovery:** All shortcuts displayed as subtle badge hints on menu items (e.g. `New Block [Ctrl+B]`, `Play [E]`, `[🔍 Search Ctrl+K]`) and listed in a dedicated "Keyboard Shortcuts" dialog in the Floating Tools Menu.

#### 3. Block Duplication
* [x] Context menu action **"Duplicate Block"** in `CardContextMenu.tsx`.
* [x] Deep copies block configuration, styling, tags, and data with a new unique ID (`block_<uuid>`).
* [x] Places the duplicate immediately adjacent or below the parent in the active tab layout.

#### 4. "Suggested Tags" Chip Tray
* [x] Non-intrusive keyword assistant located directly beneath card tag inputs in Edit Mode.
* [x] Scans card text against `src/utils/tagKeywords.ts`.
* [x] Renders suggested chips: `💡 Suggested: [+ #short-rest] [+ #bonus-action]`. Clicking adds the tag immediately.
* [x] Global toggle in Floating Tools Menu: **Enable Tag Suggestions** (default: On).

---

### Phase 10 — Tabletop Utility, Session State, UX Polish & Printability *(Completed)*

#### 1. Core Ergonomics & Bug Fixes (User Testing Feedback)
* [x] **Undo/Redo Sheet Isolation:** Clear temporal undo history when changing characters (`loadCharacterById`), creating new characters (`newCharacter`), or importing characters (`importCharacter`). Resolves bug where pressing `Ctrl+Z` to undo edits on a new sheet reverts the user back to the previous character sheet.
* [x] **Move & Reorder Tabs:** Add ability to move/reorder tabs via drag-and-drop and left/right controls in Edit Mode (`reorderTabs` and `moveTab` store actions).
* [x] **Free & Precise Card Sizing:**
  * Multi-directional resize handles: allow resizing from the right edge, bottom edge, and corner (`handles: ['s', 'e', 'se']`).
  * Allow 1-column minimum width (`minW: 1`).
  * Direct dimension controls in `BlockStyleModal.tsx` and `CardContextMenu.tsx` allowing users to type or click exact width (1–12 cols) and height (rows), plus quick width presets (`Full 12`, `Half 6`, `Third 4`, `Quarter 3`) and "Fit Height to Content".
* [x] **Tab Bar Layout Stability & Float Fix:**
  * Prevent tab text from wrapping onto multiple lines (`white-space: nowrap;`).
  * Align tab items to the bottom border (`align-items: flex-end`) with consistent height so single-line tabs never "float" in mid-air when neighboring tabs expand.
  * Maintain clean minimum/maximum sizing during tab rename and enable smooth horizontal scrolling when many tabs exist.
* [x] **Equation Variable Autocomplete Portal & Boundary Safety:**
  * Upgrade `FormulaInput.tsx` dropdown to render via a React Portal with screen-edge boundary detection.
  * Prevent equation/variable popups from clipping or overflowing off the screen/card when opened close to the left or right edges in stat cards, popouts, or modals.

#### 2. Dedicated Print / Clean PDF Export
* [x] High-fidelity `@media print` stylesheet.
* [x] Automatically strips dark canvas backgrounds, floating buttons, tab bars, and history indicators.
* [x] Clean black-and-white borders with crisp serif/sans typography optimized for physical paper or PDF archival.
* [x] Print action accessible via Omnisearch (`Ctrl+K`), Floating Tools Menu, and browser print (`Ctrl+P`).

#### 3. Floating Session Scratchpad & Combat Log
* [x] Slide-out drawer or floating modal for transient in-session notes:
  * Quick monster HP tallies
  * Initiative tracker order
  * Ephemeral room clues, NPC names, and shopkeeper prices
* [x] Does not clutter character canvas layouts or persist as formal blocks.
* [x] Includes "Clear Session Notes" and "Promote to Permanent Notes Block" options.

#### 4. Visual Tag Management & Color Palette
* [x] Assign custom accent colors or border styles to specific tags (e.g. `#action` = amber, `#bonus-action` = cyan, `#short-rest` = emerald, `#magic` = amethyst).
* [x] Cards and filters reflect these colors across the canvas.
* [x] Tag manager modal to view all tags, rename or purge tags globally across all blocks in one click.

#### 5. Play Mode Value Revert & Roll Notations
* [x] Ephemeral "Revert" toast after counter changes in Play Mode to catch accidental clicks.
* [x] Click-to-copy or click-to-roll dice notations (e.g. clicking `1d8 + 3` rolls live or copies `/roll 1d8+3` to clipboard for Discord/Foundry/Roll20).

---

### Phase 11 — Resilience, Storage Hardening & Performance Optimization *(Completed)*

#### 1. Lifecycle Save Flush & Tab-Close Data Loss Prevention
* [x] **Page Lifecycle Listeners:** Registered `visibilitychange` (`document.visibilityState === 'hidden'`), `pagehide`, and `beforeunload` listeners in the root application lifecycle (`setupStorageLifecycleListeners`).
* [x] **Synchronous Flush:** Synchronously flushes pending debounced saves (`flushPendingSave()`) directly to `localStorage` and IndexedDB before tab close or navigation occurs.
* [x] **In-Flight Write Safeguards:** Tracks active in-flight IndexedDB writes and presents a standard `beforeunload` unsaved-state confirmation dialog if writes are currently resolving.

#### 2. Dual-Storage Reconciliation & Split-Brain Cache Prevention
* [x] **Startup Reconciliation:** Implemented timestamp / version reconciliation (`meta.updatedAt`) between `localStorage` and `IndexedDB` on application startup (`initAndReconcileStorage`).
* [x] **Authoritative IDB Hydration:** If `IndexedDB` holds a newer timestamp than `localStorage` (e.g. after ~5MB localStorage `QuotaExceededError`), Zustand is hydrated from the authoritative `IndexedDB` document and the `localStorage` cache is refreshed.
* [x] **Bidirectional Sync & Manifest Merge:** If `localStorage` is newer, catches up IndexedDB. Manifests across both layers are automatically reconciled by highest `updatedAt`.

#### 3. Granular State Subscriptions & Re-render Isolation ("Pass IDs, Not Objects")
* [x] **Canvas Selector Refactoring:** `Canvas.tsx` subscribes strictly to the active tab layout array and individual scalar properties (`charName`, `activeTabLabel`) instead of the root `character` document.
* [x] **Pass IDs, Not Objects:** Passes only `blockId` and `tabId` to `BlockContainer.tsx`.
* [x] **Direct Block Slices:** `BlockContainer.tsx` is wrapped in `React.memo` and subscribes directly to its own block slice (`character.blocks[blockId]`). Block value updates convert from $O(N)$ canvas-wide re-renders to $O(1)$ isolated component re-renders.

#### 4. Scoped Play Mode History / Counter Undo
* [x] **Dedicated Play Mode History Stack:** Implemented a lightweight command log (`playHistory: { past, future }`) tracking counter changes and batch rest resets during tabletop play.
* [x] **Layout-Safe Ergonomics:** Play Mode undo/redo (`undoPlayMode` / `redoPlayMode`) exclusively restores counter data (`block.data`) without touching canvas layouts or unpausing Zundo Edit Mode temporal tracking.
* [x] **Unified Shortcuts & Bottom Bar:** `Ctrl+Z` / `Ctrl+Shift+Z` / `Ctrl+Y` and bottom history buttons dynamically adapt between Edit Mode (canvas layout changes) and Play Mode (gameplay counters) with contextual tooltips.

---

### Phase 12 (Style System Phase 0) — Style Foundation & Preset Token System *(Completed)*

#### 1. Preset Token Model
* [x] Added additive, optional token fields to `GlobalThemeSchema` (`defaultFrame`, `defaultShape`, `defaultShading`, `defaultGlow`, `defaultTexture`, `defaultPattern`, `cardPatternOpacity`, `defaultScrim`, `defaultCorners`, `canvasPattern`, `canvasPatternOpacity`, `canvasPatternScale`).
* [x] Added matching block-level override fields to `BlockStyleSchema` (`frame`, `shape`, `shading`, `glow`, `accentTint`, `texture`, `pattern`, `scrim`, `corners`).
* [x] Token values are free strings (`z.string().max(100)`), never rigid enums, guaranteeing safe runtime fallback rather than schema rejection.
* [x] Preserved legacy `borderStyle` mapping for complete backward compatibility with older saves.

#### 2. Architecture & Registry
* [x] Created `src/styles/types.ts` defining render contexts, output objects, and layer models.
* [x] Created `src/styles/registry.ts` housing the central design definitions.
* [x] Created `src/styles/resolveStyle.ts` implementing the cascade: `card token` -> `legacy field` -> `sheet default token` -> `built-in fallback`.
* [x] Created stubs for `svgSanitizer.ts` (fail-closed security) and `assetLibrary.ts` (IndexedDB hybrid storage interface).
* [x] Full regression test suite: `verify-phase12.ts` passing 100%.

---

### Phase 13 (Style System Phase 1) — CSS Effects & Cascade UI *(Completed)*

#### 1. Metallic Frames & Mask Overlays
* [x] Implemented gradient metallic frames (`gold`, `silver`, `bronze`, `foil`) using a composite `-webkit-mask` / `mask` ring (`.frame-ring`).
* [x] Preserves rounded corners and works cleanly over translucent card backgrounds where standard CSS `border-image` gradients fail.

#### 2. Outline Shapes & Diagonal Reconstruction
* [x] Implemented outline shapes (`rect`, `rounded`, `sharp`, `chamfer`).
* [x] `shape-chamfer`: 8-point polygon `clip-path` with an `::after` overlay reconstructing the cut diagonal corner borders.
* [x] Outer glow and shadows automatically routed to `inset` shadows for chamfers to avoid `clip-path` shadow clipping.

#### 3. Visual Thumbnail Grid Picker & Cascade UI
* [x] Created `StyleOptionGrid.tsx`: thumbnail tiles showing live miniature previews of each style option.
* [x] Integrated sheet defaults vs per-card override pickers in `BlockStyleModal.tsx` and `ThemeDrawer.tsx`.
* [x] Added "Make all cards use these defaults" bulk reset with full single-step undo support.
* [x] Full regression test suite: `verify-phase13.ts` passing 100%.

---

### Phase 14 (Style System Phase 2) — Canvas Patterns & Surface Textures *(Completed)*

#### 1. Tileable Patterns Engine
* [x] Registered 8 tileable SVG patterns in `src/styles/patterns.ts`: `none`, `dots`, `grid`, `blueprint`, `hatch`, `hex-mesh`, `constellation`, `speckle`.
* [x] Dynamic tint pipeline utilizing literal colors and opacity multipliers.
* [x] Canvas pattern resolution injecting `--canvas-pattern-image` and `--canvas-pattern-size` into `:root`.
* [x] Pattern opacity and scale sliders in `ThemeDrawer.tsx`.

#### 2. Card Surface Textures & Scrim Layer
* [x] Registered 5 card textures: `none`, `grain`, `carbon`, `scanlines`, `glass`.
* [x] Frosted glass (`.texture-glass`) utilizing `backdrop-filter: blur(12px)` and automatic translucent background fallback.
* [x] Fixed layer stacking order: Scrim -> Tint Wash -> Custom URL -> Pattern -> Texture.
* [x] Protective Readability Scrim (`scrim: boolean`) darkening behind text over busy art.
* [x] Full regression test suite: `verify-phase14.ts` passing 100%.

---

### Phase 15 (Style System Phase 3) — SVG Frame Engine & Corner Accents *(Completed)*

#### 1. 9-Slice SVG Border Engine
* [x] Created `build9SliceFrame()` in `src/styles/svgFrames.ts` using CSS `border-image` with standardized 96x96 geometry and seam alignment at 32/64.
* [x] Dynamic tint pipeline (`resolveLiteralColor`, `{{COLOR}}`, `{{ACCENT}}`) replacing placeholders with literal theme colors.
* [x] 13 starter SVG frames across 4 aesthetic families:
  * **Fantasy:** `filigree`, `scroll-royal`, `runic`, `celestial` (legacy `ornate` preserved).
  * **Sci-Fi:** `tech-brackets`, `circuit-edge`, `holo-terminal`.
  * **Gothic:** `thorn-vine`, `iron-spikes`, `bone-crypt`.
  * **Classic:** `art-deco`, `victorian`, `celtic`.
* [x] Dynamic content clearance offsets (`--frame-pad-x`, `--frame-pad-y`) preventing frame overlap on card headers and bodies.

#### 2. Modular Corner Accents Engine (Layer 8)
* [x] Registered 8 corner accents in `src/styles/corners.ts`: `none`, `filigree`, `tech`, `rivets`, `flourish`, `runes`, `spikes`, `gem`.
* [x] Created `CornerAccents.tsx` overlay component positioned at Layer 8 with `pointer-events: none` and `border-radius: inherit`.
* [x] Integrated into standard card view, pop-out focus view, `BlockStyleModal.tsx`, and `ThemeDrawer.tsx`.
* [x] Full regression test suite: `verify-phase15.ts` passing 100%.

---

### Phase 3b — Watermarks & Decals *(Next)*
* [ ] Card/canvas watermark layer (built-in emblems: d20, crest, rune circle, biohazard, dragon).
* [ ] Opacity slider and position controls for watermarks.
* [ ] Header decal / decorative divider ornaments between card headers and content.

---

### Phase 4 — Style Packs *(Planned)*
* [ ] Bundles of tokens, colors, and fonts (e.g. "Cyberpunk Neon", "High Fantasy Parchment", "Gothic Horror", "Grimdark Terminal").
* [ ] Non-destructive "Keep my custom colors?" prompt on apply.

---

### Phase 5 — Custom User SVGs, "My Designs" & Motion *(Planned)*
* [ ] Local SVG upload and code paste into browser-stored IndexedDB library ("My Designs").
* [ ] Fail-closed SVG sanitizer stripping scripts and dangerous tags on upload and import.
* [ ] Content-hash asset IDs and embedded copies inside character documents for zero-loss export.
* [ ] Optional animated border effects (neon pulse) strictly honoring `prefers-reduced-motion`.



