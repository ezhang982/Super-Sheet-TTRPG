# CLAUDE.md — Modular TTRPG Character Sheet Manager

This file is the project primer for every Claude Code session. Read it before
touching code. It exists to stop architectural drift across sessions — the
decisions marked **LOCKED** are not up for silent renegotiation mid-session.
If a locked decision needs to change, that's a conversation with Eden first,
then an edit to this file, then code.

Source of truth: `Architecture_Blueprint_v2.md` (full spec/rationale) +
`schema.ts` + `store-contract.ts` (canonical code, Phase 0 output). This file
summarizes and indexes those; if this file and the blueprint ever disagree,
the blueprint is being renamed and this file should be updated — not the
other way around.

---

## 0. Project Philosophy (read this first)

- **Manual over automated.** No formula engine, no reactive modifier graph,
  no rules parser. Every value is typed in by hand. Don't build derivation
  logic "for convenience" — it's explicitly out of scope.
- **No dice roller.** Numbers are visual only. Don't add roll handlers.
- **Tags are the only automation mechanism.** No `resetTrigger`/`resetTag`
  fields anywhere. If you find yourself wanting a second reset field, the
  answer is "put it in `tags[]`," not "add a field."
- **Local-first.** No backend. No auth. No network calls except loading
  Google Fonts. State lives in `localStorage`; JSON is the portability layer.
- **One schema.** `schema.ts`'s Zod schema is the only place the data shape
  is defined. TS types are inferred, never hand-duplicated. Runtime import
  validation uses the same schema.

---

## 1. Locked Architectural Decisions (Phase 0 output)

| Decision | Choice | Why |
|---|---|---|
| Language & Runtime | React 19 + TypeScript from Phase 1 | Zod-inferred types, latest React 19 capabilities |
| Schema | Zod, single source of truth | types + runtime import validation from one definition |
| Styling | Vanilla CSS + custom properties | no framework dependency; full styling freedom for the theming engine (§7) |
| State | Zustand + `zundo` | avoids re-render cost of Context; scoped temporal undo/redo |
| Grid | `react-grid-layout`, 12-column | de facto standard for drag/resize grids in React; synced via `updateTabLayout` |
| Reset logic | `tags[]` only, no separate reset field | one source of truth (§6.1) |
| Undo/redo | Scoped to Edit Mode structural changes only via `zundo` | Play Mode value changes are frequent + trivially correctable; would just add stack noise |
| Mobile Play Mode | Single-column reflow, not the drag grid | Edit Mode is desktop/tablet-primary in MVP |
| Persistence | Native `IndexedDB` (with `localStorage` fallback) + JSON import/export | zero backend, no 5MB quota limit, multi-character manifest, portable |

Canonical code for the two biggest Phase 0 deliverables:
- **`schema.ts`** — full Zod schema, discriminated union over the 5 block
  primitives (`tracker`, `stat_group`, `card`, `pip_array`, `notes`),
  inferred types, `DEFAULT_REST_TAGS`.
- **`store-contract.ts`** — the full Zustand action surface (§2.2 of the
  blueprint). Nothing mutates `character` state outside these actions.

### Decisions made while assembling Phase 0 (not explicit in v2, resolved here)

These weren't nailed down in the blueprint text. Flagging them here so
they're visible rather than buried in code comments only:

1. **Rest Action vocabulary is user-extensible, not hardcoded.** The store
   holds a `restActions: RestAction[]` array (`{id, label, tag}`) seeded from
   `DEFAULT_REST_TAGS` (`#short-rest`, `#long-rest`), plus `addRestAction` /
   `removeRestAction`. This covers non-D&D systems (a "Scene" or "Session"
   reset button) without a schema change later. The Rest Action Bar UI itself
   still only needs to ship the two defaults in Phase 3 — the "add a custom
   one" UI is a Phase 4 nice-to-have, but the store supports it from day one
   so Phase 3 doesn't need to touch the store contract again.
2. **`react-grid-layout` ↔ Zustand sync point via `updateTabLayout`.** RGL's live
   drag/resize position is local component state. The store is only updated on
   `onDragStop` / `onResizeStop` via `updateTabLayout(tabId, layout)` — never on
   the per-frame `onDrag` / `onResize` callbacks. Because RGL compacts and
   shifts neighboring blocks during collisions, committing the full tab layout
   captures all affected blocks in a single atomic undo step and avoids re-rendering
   the block tree during a drag.
3. **Block ID generation.** `crypto.randomUUID()`, prefixed by type —
   `block_<uuid>`. Matches the `char_<uuid>` convention already used for
   `meta.id` in the blueprint's example JSON.
4. **Block `data` patch validation & deep merging.** `updateBlockData` performs
   a deep patch (safely preserving nested objects like `card.tracker` when updating
   `current`) and does NOT re-run the full Zod schema on every keystroke (too
   expensive for text fields, and partial state is expected mid-edit). Full
   `CharacterSchema.parse()` only runs on `importCharacter`.
5. **Schema versioning/migration is explicitly deferred.** `version` exists
   in the schema now so it's not a breaking change to start using it later,
   but there is no migration layer in the MVP. If `version` on import doesn't
   match the current schema version, `importCharacter` rejects with a clear
   error rather than attempting to migrate.
6. **Tab deletion cascade & guard.** `removeTab` cascades deletion to all
   blocks contained in that tab, reassigns `activeTabId` to an available tab
   if the active tab was deleted, and guards against deleting the last remaining
   tab. In the UI, if a tab contains blocks, a confirmation prompt warns the
   user before deleting.

---

## 2. Tech Stack

Vite + React 19 + TypeScript + Zustand (with `zundo`) + Zod + `react-grid-layout` + `react-markdown` + vanilla CSS
custom properties. No Tailwind, no CSS-in-JS, no backend, no ORM, no auth.

---

## 3. The Primitives

`tracker`, `stat_group` (called "Stat Pill" in UI copy), `card` (Action/
Feature Card), `pip_array` (Pip Matrix), `notes`, `profile` (Character
Profile & Identity Card), `inventory` (Container / Inventory List), and `skill_list` (Skills List Block). Full field specs are in `schema.ts`; UX behavior per
primitive is in the blueprint §5 and wireframes. Rest logic applies to block tags and item-level tags.

---

## 4. Modes

**Edit Mode:** drag/resize enabled, block create/delete enabled, inline
content editing, style drawers, undo/redo active, tag filter bar and rest
bar disabled.

**Play Mode:** layout locked, no create/delete, read-only content except
counters/pips (click-to-toggle, +/- steppers), tag filter bar active, rest
action bar active, undo/redo NOT tracked.

On narrow viewports, Play Mode reflows to a single column in existing
`y`-order with drag handles hidden (already disabled). Edit Mode is not
optimized for narrow viewports in the MVP — don't spend Phase 1-3 effort
making it responsive.

---

## 5. Roadmap & Phase Gates

Each phase is a gate: don't start the next phase's code until the previous
phase's checklist is actually done and Eden has signed off. This is how we
keep multi-session AI-assisted work from drifting.

### ✅ Phase 0 — Foundation Contracts (this document + schema.ts + store-contract.ts)
- [x] Zod character schema defined, TS types inferred
- [x] Full Zustand store action contract defined
- [x] Reset-tag vocabulary decision made (user-extensible, defaults above)
- [x] RGL/Zustand sync point decided (`updateTabLayout`)
- [x] Block ID convention decided
- [x] Deep merge convention for `updateBlockData` decided
- [x] Tab deletion cascade & guard decided
- **Gate:** Eden reviews `schema.ts` + `store-contract.ts` + this file and
  signs off before Phase 1 code starts.

### ✅ Phase 1 — Core Foundation & Grid Canvas
- [x] `npm create vite@latest` — React 19 + TypeScript template
- [x] Install: `zustand`, `zundo`, `zod`, `react-grid-layout`, `@types/react-grid-layout`
- [x] Zustand store implemented from `store-contract.ts`, with `zundo` undo
      middleware wrapping only the structural actions
- [x] 12-column `react-grid-layout` canvas wired to `updateTabLayout`
      via `onDragStop`/`onResizeStop`
- [x] Edit Mode / Play Mode toggle
- [x] `localStorage` persistence (debounced 300ms) + JSON export/import with
      Zod validation on import
- **Gate:** can create a character, drag/resize an empty block, reload the
  page and have it persist, export/import a JSON round-trip.

### ✅ Phase 2 — Core Primitives & Content Display
- [x] Install: `react-markdown`
- [x] Tracker (current/max/temp, +/- steppers, direct numeric input)
- [x] Pip Matrix (click-to-expend rows, add/remove rows)
- [x] Stat Pill (score + modifier display, no click-to-roll)
- [x] Feature Card (title, badge, tags, markdown, embedded tracker)
- [x] Notes Block (markdown view/edit with preview toggle)
- **Gate:** all 5 primitives render and edit correctly in both modes.

### ✅ Phase 3 — Multi-Tab System & Semantic Tag Engine
- [x] Tab bar: add/rename/remove/switch (with last-tab protection & block deletion confirmation)
- [x] `moveBlockToTab`
- [x] Tag manager on Cards/Trackers/Blocks
- [x] Play Mode filter bar (isolate/dim non-matching blocks by tag)
- [x] Rest Action Bar calling `applyRest(tag)`, seeded with `DEFAULT_REST_TAGS`
- [x] Wireframe UI Redesign: eliminated obstructive top control banner; clean TabBar with tiny right-side Edit/Play toggle; floating draggable Tools FAB (Import, Export, Template, Add Block); bottom-left minimal `↩`/`↪` history controls
- [x] Profile / Identity Card primitive (`type: "profile"`) allowing customizable placement of Character Name, System, Level, XP, Player, and Origin on the canvas
- **Gate:** tag filtering and rest resets work end-to-end on a multi-tab sheet; wireframe redesign verified.

### ✅ Phase 4 — Expressive Styling Suite & Polish
- [x] Global Theme Drawer (`ThemeDrawer.tsx`: presets, font pairs, color pickers, live CSS variables injection)
- [x] Block-level style overrides (`BlockStyleModal.tsx`: border style, border color, background opacity slider, background URL, header banner URL)
- [x] "Export as Clean Template" (`exportTemplate` wired with instant toast notifications)
- [x] Mobile Play Mode single-column reflow (`.mobile-single-column-flow` with touch-friendly controls)
- [x] Custom Rest Action add/remove UI (`RestActionModal.tsx` accessible via FAB and Play Mode rest bar)
- [x] Final audit: zero-formula friction, undo/redo scope matches §8.3, mobile Play Mode usability, all test suites green
- **Gate:** full MVP completed, verified, and released.

### ✅ Post-MVP Enhancements (Inventory, Context Menu, Native File System)
- [x] Modern File System Access API (`window.showSaveFilePicker`) for native Save As dialog allowing folder selection on export (with automatic fallback).
- [x] Edit Mode Right-Click Card Context Menu (`CardContextMenu.tsx`) eliminating card header bloat (Customize Style, Rename, Add Tag, Move to Tab, Delete).
- [x] Container / Inventory List Primitive (`InventoryBlock.tsx`, `type: "inventory"`): items with quantity steppers, unit weights, costs, equipped status, markdown notes, currencies, carrying capacity meter, and item charges with rest engine recharge.
- [x] Comprehensive user-facing `README.md` and complete regression verification test suite (`verify-inventory.ts`).

### ✅ Phase 5 — Template Engine Refinement & Starter Templates
- [x] Refactor `exportTemplate` in `useCharacterStore.ts` to follow the **Template Scrubbing Contract**:
      clears personal identity (name, player, level, xp), stat scores/modifiers, notes, and inventory
      items, while preserving layouts, themes, stat labels, pip totals, card ability text, and capacity settings.
- [x] Author bundled built-in starter templates inspired by official D&D 2024 and third-party references
      (`dnd5e.ts` with 4 organized tabs: Combat & Core, Spells & Magic, Features & Traits, Inventory & Lore; and `blank.ts`).
- [x] Template Registry (`src/templates/index.ts`) for modular template indexing and metadata.
- [x] "New Character Sheet" flow: "+ New Sheet" action in `FloatingToolsMenu.tsx` with `NewCharacterModal.tsx`
      enabling 1-click loading of Blank Canvas, D&D 5e Starter, or JSON import.
- [x] Add `newCharacter` action to store contract and implementation.
- [x] Regression verification suite `verify-phase5.ts` passing 100%.
- **Gate:** clean template export confirmed; starter templates validated against Zod schema; full test suite passing.

### ✅ Phase 6 — Skill List Primitive & Card Pop-Out Expansion
- [x] Universal game-agnostic Skills Block (`type: "skill_list"`): custom skill entries with name, associated stat tag, flexible modifier/score
      string (e.g. `+5`, `65%`, `2d6`), and cycleable proficiency states (None `○`, Proficient `●`, Expertise `⨂`).
- [x] Edit Mode: fast inline add/remove, stat linking, and 1-click "Seed 5e Skills" preset.
- [x] Play Mode: live search/filter bar to locate skills quickly during gameplay, click-to-cycle proficiency.
- [x] Card Pop-Out / Expand-on-Focus (`⛶` button and context menu action): smoothly elevates any block into an expanded focus view via portal, allowing full inspection and comfortable editing without resizing cards or disrupting the 12-column grid.
- [x] Backward compatibility with existing sheets and template export scrubbing.
- [x] Regression verification suite `verify-phase6.ts` passing 100%.
- **Gate:** skill list primitive verified with all 18 D&D 2024 skills; card popout functional without grid layout disruption; all test suites green.

### ✅ Phase 7 — Free & Reliable Persistence (IndexedDB & Multi-Character Switcher)
- [x] Migrate local persistence from 5MB `localStorage` to zero-dependency browser-native `IndexedDB` (`super_sheet_db` with `sheets` and `meta` stores).
- [x] Automated seamless migration (`initStorageAndMigrate`) preserving all legacy `localStorage` sheets on first boot.
- [x] Character Switcher modal (`CharacterSwitcherModal.tsx`): manage multiple local character sheets, switch active character, duplicate, delete with safety guards, search, and direct import.
- [x] Autosave indicators (`.autosave-badge` in `BottomHistoryBar.tsx`) reporting "⏳ Saving..." and "✓ Saved locally" states cleanly synchronized with store mutations.
- [x] Full regression verification suite `verify-phase7.ts` passing 100%.
- **Gate:** Multi-character management and robust IndexedDB persistence verified end-to-end.

### ✅ Phase 8 — Formula Engine & Dynamic Math Calculations
- [x] Math Engine (`src/utils/mathEngine.ts`):
      - Dynamic quick-math evaluator (`evaluateQuickMath`) parsing relative arithmetic (`+10`, `-14`, `*2`, `/2`) and direct expressions (`20 - 4`) with clamping.
      - Character variable extractor (`extractCharacterVariables`): harvesting `@STR`, `@STR.mod`, `@HP.current`, `@HP.max`, `@Level`, `@XP`, and custom tagged values (`#prof:3`, `@PB:2`).
      - Safe, zero-dependency formula evaluator (`evaluateFormula`) with recursive descent parser supporting arithmetic, parentheses, functions (`floor`, `ceil`, `round`, `min`, `max`, `abs`), and error states (`#REF!`, `#CIRCULAR!`, `#SYNTAX!`, `#DIV/0!`).
      - 2-pass variable extraction allowing Stat Group modifiers to be derived from scores via formulas (e.g. `sub: "= floor((@STR - 10) / 2)"`).
- [x] Dynamic Quick Math on Counter Elements:
      - `TrackerBlock.tsx`: Hit points and temp counters allow single-click text entry with relative math (`+10`, `-15`, `/2`) and bounds clamping.
      - `FeatureCardBlock.tsx`: Embedded tracker stepper supports click-to-edit quick math.
      - `InventoryBlock.tsx`: Item quantity supports click-to-edit quick math (`+50`, `-5`).
- [x] Formula UI & Autocomplete (`FormulaInput.tsx`):
      - Live `@` autocomplete dropdown popup with keyboard navigation (`↑`/`↓`/`Enter`/`Tab`) showing available variables and current numeric values.
      - Integrated into `SkillListBlock.tsx` and `StatGroupBlock.tsx`.
- [x] Play Mode Formula Presentation:
      - Clean display of evaluated results with subtle hover badge preview (`fx: = @DEX.mod + @Prof [3 + 2 = 5]`) and `ƒx` indicator pill.
      - Graceful error indicator (`⚠️ #REF!`) when referencing undefined variables.
- [x] Full regression test suite (`verify-phase8.ts` and all phases 1-7) passing 100%.
- **Gate:** Quick math and system-agnostic formula evaluation verified with zero regressions.

---

## 5.1 Template Scrubbing Contract

When exporting a character as a reusable template (`exportTemplate`):
- **Preserved (Structural & System Configuration):**
  - All tabs, names, order, and `layouts` grid configurations.
  - Global theme (fonts, canvas/card backgrounds, borders, accent colors) and individual block custom styles.
  - Block titles, tags, and types.
  - `stat_group`: attribute labels (`STR`, `DEX`, etc.) are retained; `score` and `sub` are reset to `""`.
  - `pip_array`: row labels and `total` pips are retained; `expended` is reset to `0`.
  - `tracker`: `current` is reset to `max`; `temp` is reset to `0`.
  - `card`: badge, tags, title, and description (retaining class features, spell rules, action economy reminders); embedded tracker `current = max`.
  - `inventory`: container title, tags, currencies dictionary (zeroed), and capacity configuration (`maxWeight`, `enabled`) are retained; `items` array is scrubbed to `[]`.
  - `skill_list`: skill names, associated stat tags, and sort order are retained; `value` is reset to `""` and `proficiency` is reset to `0`.
- **Scrubbed (Personal Instance Data):**
  - `meta.name` -> `${character.meta.name} (Template)` or custom name.
  - `profile`: `characterName`, `playerName`, `level`, `experience`, `extraInfo` reset to `""`. `system` is retained.
  - `notes`: `markdown` reset to `""`.

---

## 6. Explicitly Out of Scope (don't build these without a conversation first)

- Any formula/derivation engine or automatic modifier math
- Dice rolling of any kind
- A backend, auth, or multiplayer/sync
- A generic rules/ruleset parser
- Schema migration tooling (until it's actually needed)
- Responsive Edit Mode (mobile Edit Mode is not a Phase 1-4 target)

---

## 7. Working Conventions

- All store mutations go through `CharacterStore` actions in
  `store-contract.ts` — no ad hoc `set()` calls scattered through components.
- If a new action is needed, add it to the contract file first, note it in
  this file's Phase log, then implement.
- Block IDs: `block_<uuid>`. Tab IDs: `tab_<uuid>`. Character IDs:
  `char_<uuid>`.
- Reset tags are conventionally prefixed `#` (`#short-rest`) to visually
  distinguish them from freeform categorization tags in the UI, but this is
  a display convention only — the schema treats all tags as plain strings.
