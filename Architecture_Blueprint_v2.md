# Modular TTRPG Character Sheet Manager
## Architectural Blueprint & Technical Specification (MVP)
### Document Version: v2

**Key decisions since v1:**
- Committing to TypeScript from Phase 1, with Zod as the single source of truth for the character schema (types are inferred from it, not hand-duplicated).
- Dropped Tailwind — vanilla CSS with custom properties, to minimize dependencies and leave full styling freedom for AI-assisted implementation.
- State management is Zustand (not raw Context/useReducer), to avoid re-render cost on frequent layout mutations.
- Reset logic has one source of truth: the block's `tags` array. The separate `resetTrigger` / `resetTag` fields from v1 are removed.
- Undo/redo is now an explicit, scoped feature (Edit Mode structural changes only).
- Mobile Play Mode uses a single-column reflow instead of the drag/resize grid.

---

## 1. Executive Summary & Core Philosophy

### 1.1 The Problem
Modern Tabletop Role-Playing Game (TTRPG) character sheet platforms fall into two flawed extremes:
1. **Rigid Automation Engines (e.g., D&D Beyond, Demiplane/Nexus):** These enforce hardcoded rulesets, mathematical dependency graphs, and commercial license boundaries. Introducing third-party content, complex homebrew, or switching systems breaks the underlying engine.
2. **Static Documents (e.g., Form-Fillable PDFs):** These offer layout fidelity and system agnosticism, but provide zero dynamic tracking, poor responsive layout across screen sizes, and lack interactive tabletop state management.
3. **Graph-Calculated Sandboxes (e.g., DiceCloud):** While deeply customizable, their requirement to construct complex programmatic formulas introduces severe setup friction for the average player.

### 1.2 The Solution
A **modular, block-based character dashboard** that bridges the expressive visual freedom of early-web personal sites/Notion with the tactical utility of a tabletop play tracker.

### 1.3 Guiding Design Principles
* **Manual Over Automated:** Values, modifiers, and limits are entered manually by the user. There is no reactive formula graph, no automatic modifier derivation, and no hardcoded rules parser. If a user's Strength increases, they update their Strength and whatever attacks they choose manually.
* **No Built-in Dice Roller:** Dice rolling is decoupled entirely from this MVP. Numbers and notations are purely visual displays. Tabletop rolling is expected to take place via physical dice, Discord bots, or dedicated VTT tools.
* **Semantic Tag Engine, Single Source of Truth:** Tags are the *only* mechanism driving resets, filtering, and categorization. There is no parallel `resetTrigger`/`resetTag` field anywhere in the schema — if a block or its embedded tracker should reset on a given event, that reset tag lives in the block's `tags` array and nowhere else.
* **Separation of Architect and Player:** Distinct **Edit Mode** (freeform canvas manipulation, block resizing, styling configuration) and **Play Mode** (locked layout, tactile counters, state management, fast filtering).
* **Local-First & Portable:** Zero required backend infrastructure. State persists locally in the browser, with human-readable JSON files serving as the primary import/export and backup medium.
* **Typed & Validated:** The character schema is defined once as a Zod schema. TypeScript types are inferred from it, and the same schema validates imported JSON at runtime. There is exactly one place the data shape is defined.

---

## 2. System Architecture & Component Hierarchy

### 2.1 Component Hierarchy

The application follows a unidirectional data flow built around a central, typed JSON state tree held in a Zustand store.

```
+-----------------------------------------------------------------------+
|                           Application Root                            |
|  - Character Store (Zustand, typed via Zod-inferred schema)           |
|  - Mode Controller (Edit Mode vs. Play Mode)                          |
|  - Theme Controller (CSS Custom Property Injection)                   |
+-----------------------------------------------------------------------+
                                    |
          +-------------------------+-------------------------+
          |                                                   |
          v                                                   v
+-----------------------+                           +-------------------+
|  Global Control Bar   |                           |  Tab Navigation   |
|  - Edit / Play Toggle |                           |  - [Main Canvas]  |
|  - Rest Actions       |                           |  - [Grimoire]     |
|  - Tag Filter Bar     |                           |  - [+ Add Tab]    |
|  - Undo / Redo        |                           +-------------------+
|  - JSON Export/Import |                                     |
+-----------------------+                                     v
                                                    +-------------------+
                                                    | Responsive Grid   |
                                                    | (12-Column Canvas)|
                                                    +-------------------+
                                                              |
                  +-------------------------------------------+
                  |
  +---------------+---------------+---------------+---------------+
  |               |               |               |               |
  v               v               v               v               v
[Tracker]    [Pip Array]    [Stat Pill]     [Feature Card]   [Notes Block]
```

### 2.2 State Store & Action Contract

This is the mutation surface every component talks to. Locking this list before Phase 1 implementation begins is what keeps AI-assisted sessions consistent with each other across phases — every mutation goes through one of these, nothing mutates the store shape ad hoc.

**Character / meta**
* `setCharacterMeta(patch)`

**Tabs**
* `addTab(label)`
* `renameTab(tabId, label)`
* `removeTab(tabId)` — cascades deletion to all blocks on this tab, prevents deleting last tab, reassigns active tab.
* `setActiveTab(tabId)`

**Layout & blocks**
* `addBlock(tabId, type, initialData)`
* `deleteBlock(blockId)`
* `updateTabLayout(tabId, layout)` — commits full tab layout snapshot on drag/resize stop to handle collisions and keep undo atomic.
* `moveBlockToTab(blockId, fromTabId, toTabId)`
* `updateBlockData(blockId, patch)` — deep merge patch preserving nested properties (e.g. card trackers).
* `updateBlockStyle(blockId, patch)`
* `updateBlockTags(blockId, tags)`

**Theme**
* `setGlobalTheme(patch)`

**Rest engine**
* `applyRest(tag)` — scans all blocks for `tag` membership in their `tags` array and resets matching trackers/pips (see §6.1).

**Persistence**
* `importCharacter(json)` — validates against the Zod schema before committing.
* `exportCharacter()`
* `exportTemplate()`

**History**
* `undo()`
* `redo()`

---

## 3. Unified Character Data Schema (JSON)

Every character sheet is serialized into a single portable, human-readable JSON document. This is the Zod schema's canonical shape — TypeScript types and runtime import validation both derive from it.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "version": "2.0.0",
  "meta": {
    "id": "char_c9f2a17b-3b8e-4a92-9481-872f091c52d0",
    "name": "Valerius Drake",
    "system": "Custom / D&D 5e",
    "createdAt": 1773091200,
    "updatedAt": 1773094800
  },
  "theme": {
    "fontHeading": "Cinzel, serif",
    "fontBody": "Inter, sans-serif",
    "canvasBackground": "#121316",
    "cardBackground": "#1c1e24",
    "borderColor": "#2f333d",
    "accentColor": "#e06c75"
  },
  "tabs": [
    { "id": "tab_main", "label": "Combat & Core" },
    { "id": "tab_spells", "label": "Grimoire" },
    { "id": "tab_lore", "label": "Inventory & Notes" }
  ],
  "activeTabId": "tab_main",
  "layouts": {
    "tab_main": [
      { "i": "block_hp", "x": 0, "y": 0, "w": 4, "h": 2 },
      { "i": "block_stats", "x": 4, "y": 0, "w": 8, "h": 2 },
      { "i": "block_action_surge", "x": 0, "y": 2, "w": 6, "h": 3 }
    ],
    "tab_spells": [
      { "i": "block_spell_slots", "x": 0, "y": 0, "w": 12, "h": 2 }
    ],
    "tab_lore": [
      { "i": "block_backstory", "x": 0, "y": 0, "w": 12, "h": 6 }
    ]
  },
  "blocks": {
    "block_hp": {
      "id": "block_hp",
      "type": "tracker",
      "title": "Hit Points",
      "tags": ["#core", "#health"],
      "data": {
        "current": 48,
        "max": 52,
        "temp": 5,
        "step": 1
      },
      "style": {
        "borderColor": "#e06c75"
      }
    },
    "block_stats": {
      "id": "block_stats",
      "type": "stat_group",
      "title": "Attributes",
      "tags": ["#core", "#stats"],
      "data": {
        "stats": [
          { "label": "STR", "score": "18", "sub": "+4" },
          { "label": "DEX", "score": "14", "sub": "+2" },
          { "label": "CON", "score": "16", "sub": "+3" },
          { "label": "INT", "score": "10", "sub": "+0" },
          { "label": "WIS", "score": "12", "sub": "+1" },
          { "label": "CHA", "score": "8", "sub": "-1" }
        ]
      },
      "style": {}
    },
    "block_action_surge": {
      "id": "block_action_surge",
      "type": "card",
      "title": "Action Surge",
      "tags": ["#action", "#short-rest", "#fighter"],
      "data": {
        "badge": "Action",
        "description": "On your turn, you can take one additional action on top of your regular action and possible bonus action.",
        "tracker": {
          "enabled": true,
          "current": 1,
          "max": 1
        }
      },
      "style": {
        "borderStyle": "double",
        "borderColor": "#e5c07b"
      }
    },
    "block_spell_slots": {
      "id": "block_spell_slots",
      "type": "pip_array",
      "title": "Spell Slots",
      "tags": ["#magic", "#long-rest"],
      "data": {
        "rows": [
          { "label": "1st Level", "total": 4, "expended": 1 },
          { "label": "2nd Level", "total": 3, "expended": 0 },
          { "label": "3rd Level", "total": 2, "expended": 2 }
        ]
      },
      "style": {}
    },
    "block_backstory": {
      "id": "block_backstory",
      "type": "notes",
      "title": "Character Background",
      "tags": ["#lore", "#roleplay"],
      "data": {
        "markdown": "### Origins\nExiled knight from the northern provinces..."
      },
      "style": {
        "backgroundUrl": ""
      }
    }
  }
}
```

**Note on v1 → v2:** `resetTrigger` (on trackers) and `resetTag` (on pip arrays and embedded card trackers) have been removed. Reset behavior is now derived entirely from the block's `tags` array — see §6.1.

---

## 4. Canvas & Layout Engine

### 4.1 Grid Foundation
* **Engine:** Built on a responsive 12-column grid layout using `react-grid-layout`.
* **Infinite-Scroll Canvas:** The default sheet configuration is a single scrollable canvas. Blocks snap to a 12-column width with variable row heights.
* **Canvas Coordinates:** Every block layout item contains:
  * `i`: Unique block identifier string (`block_xyz`).
  * `x`: Column position (0 to 11).
  * `y`: Row position (0 to $\infty$).
  * `w`: Column width (1 to 12).
  * `h`: Row height (integer units).

### 4.2 Multi-Tab Architecture
* Users who prefer compartmentalized organization can enable tabs.
* **Tab Model:**
  * `tabs`: List of tab objects `[{ id, label }]`.
  * `activeTabId`: Currently viewed tab.
  * `layouts`: A map of tab IDs to their respective grid layout arrays (`{ [tabId]: LayoutItem[] }`).
* **Cross-Tab Block Movement:** When editing, a block's settings panel provides a "Move to Tab" dropdown, calling `moveBlockToTab(blockId, fromTabId, toTabId)`.

### 4.3 Mode Switching

| Capability | Edit Mode (The Architect) | Play Mode (The Tabletop) |
| :--- | :--- | :--- |
| **Block Dragging / Resizing** | Enabled (visual handles visible) | Disabled (locked in place) |
| **Block Creation / Deletion** | Enabled | Disabled |
| **Card Content Editing** | Inline inputs & style drawers | Read-only presentation |
| **Counters & Pips** | Configuration (Min/Max settings) | Click-to-toggle / +/- Steppers |
| **Tag Filter Bar** | Disabled | Active (click tags to isolate UI) |
| **Rest Action Bar** | Disabled | Active (triggers batch resets) |
| **Undo / Redo** | Active (structural edits) | Not tracked (see §8.3) |

### 4.4 Mobile Play Mode
On narrow viewports, Play Mode does not attempt to reproduce the drag/resize grid. Instead it renders a **single-column reflow**: blocks from the active tab stack vertically in their existing `y`-order, at full width, with drag/resize handles hidden entirely (they're already disabled in Play Mode). Edit Mode is desktop/tablet-primary and is not optimized for narrow viewports in the MVP.

---

## 5. Primitive Component Specifications

The application relies on 5 core UI primitives that can be combined and repeated without restriction. None of them own reset logic directly — reset behavior always comes from the parent block's `tags` array (§6.1).

### 5.1 Tracker Block
* **Purpose:** High-frequency, single-metric counters (Hit Points, Sanity, Ki, Sorcery Points, Ammo).
* **Data Fields:**
  * `title`: String (e.g., "Current HP").
  * `current`: Number.
  * `max`: Number.
  * `temp`: Number (optional overlay, e.g., Temporary HP).
  * `step`: Number (increment/decrement amount, default 1).
* **Play UX:**
  * Large numerical display.
  * Dedicated `+` and `-` click targets for rapid adjustment.
  * Direct numeric input on double-click/tap for large adjustments.

### 5.2 Pip Matrix Block
* **Purpose:** Discrete resource arrays (Spell Slots, Death Saves, Bardic Inspiration, Luck Points).
* **Data Fields:**
  * `rows`: Array of `{ label: string, total: number, expended: number }`.
* **Play UX:**
  * Renders a series of circular or diamond pips.
  * Single-click toggles state between filled and expended.
  * Clean visual feedback (filled pips illuminated in accent color; expended pips dimmed/outlined).

### 5.3 Stat Pill / Attribute Block
* **Purpose:** Display core attributes, skills, armor class, speeds, and passive scores.
* **Data Fields:**
  * `title`: Section title (e.g., "Ability Scores").
  * `stats`: Array of `{ label: string, score: string, sub: string }`.
* **Play UX:**
  * Compact badges displaying a primary number (e.g., `18`) and a secondary label/modifier (e.g., `+4`).
  * Pure display mode—no click-to-roll event handlers.

### 5.4 Action / Feature Card
* **Purpose:** Class abilities, feats, spells, racial traits, inventory descriptions, and special actions.
* **Data Fields:**
  * `title`: String (e.g., "Second Wind").
  * `badge`: Optional tag/badge (e.g., "Bonus Action").
  * `tags`: Array of semantic tag strings (`#short-rest`, `#healing`, `#action`) — also drives this card's own reset behavior.
  * `description`: Markdown string.
  * `tracker`: Optional embedded usage counter `{ enabled: bool, current: number, max: number }`.
* **Play UX:**
  * Header with title, badge, and tags.
  * Expand/collapse toggle for long text descriptions.
  * Integrated tracker pips or number stepper directly on the card header.

### 5.5 Freeform Notes Block
* **Purpose:** Backstory, inventory logs, campaign lore, quest trackers.
* **Data Fields:**
  * `title`: String.
  * `markdown`: Raw markdown string.
* **Play UX:**
  * Clean, formatted reading view in Play Mode.
  * Markdown editor (or split preview) in Edit Mode.

---

## 6. The Semantic Tag Engine

Tags are the core mechanism driving automation and interactivity without hardcoded game rules — and, as of v2, the *only* place reset behavior is declared.

```
+-------------------------------------------------------------+
| Feature Card: "Lay on Hands"                                |
| Tags: [#action, #paladin, #healing, #long-rest]              |
+-------------------------------------------------------------+
         |                       |                     |
         v                       v                     v
   [View Filter]        [Semantic Search]       [Rest Trigger]
Isolate on `#action`    Filter list by tag    Reset on `#long-rest`
```

### 6.1 State Triggers (Rest Engine)
The application avoids rules-specific rest systems by evaluating tags on rest events. There is a single source of truth: a block resets on a given rest event if and only if that event's reserved tag (e.g. `#short-rest`, `#long-rest`) appears in the block's `tags` array. No separate `resetTrigger`/`resetTag` field exists anywhere in the schema.

1. The user clicks a global button (e.g., **"Short Rest"** or **"Long Rest"**), calling `applyRest(tag)`.
2. The engine scans every block's `tags` array for that reserved tag.
3. For a `tracker` type (or an embedded tracker inside a `card`), a match sets `current = max`.
4. For a `pip_array` type, a match resets every row's `expended` to `0`.
5. Blocks lacking the relevant tag remain untouched.

### 6.2 Play-Mode View Filtering
* The top navigation bar in Play Mode renders a horizontal scroll list of all unique tags present across all active blocks (e.g., `[#action]`, `[#bonus-action]`, `[#spell]`, `[#inventory]`).
* Clicking a tag enters **Filtered Mode**:
  * Blocks containing the active tag remain full opacity.
  * Blocks lacking the active tag are either dimmed to 15% opacity or hidden entirely (user preference toggle).
* This provides instant clarity during combat or specific gameplay phases.

---

## 7. Expressive Styling Engine (Personal Web Aesthetic)

To replicate the creativity of classic web page customization, styling operates at both global and local levels, implemented with vanilla CSS and CSS custom properties — no CSS framework dependency.

### 7.1 Global Theme (Canvas Level)
Configured via the Theme Drawer in Edit Mode:
* **Background:** Solid color, CSS gradient, or uploaded image/texture URL (e.g., parchment, aged leather, dark slate, isometric grid).
* **Typography:** Selectable Google Font pairs:
  * *Fantasy Classic:* `Cinzel` (Headers) + `EB Garamond` (Body)
  * *Modern / Sci-Fi:* `Orbitron` (Headers) + `Share Tech Mono` (Body)
  * *Minimalist:* `Inter` (Headers) + `Inter` (Body)
* **Default Accent Colors:** Global border colors, card background tones, and active pip colors.
* **Implementation:** Global theme values are written to CSS custom properties on the root element (`--canvas-bg`, `--accent-color`, etc.); components consume them directly in their stylesheets.

### 7.2 Block-Level Overrides
Each block features an **Appearance** panel in Edit Mode:
* **Borders:**
  * Styles: `None`, `Solid`, `Double`, `Dashed`, `Groove`, `Ornate Corner Brackets`.
  * Custom border color and width picker.
* **Background Surface:**
  * Solid fill with opacity slider (enables frosted-glass effects over textured canvas backgrounds).
  * Custom block background image URL (e.g., individual card art) — URL-only, never an upload, to keep character JSON and localStorage lightweight.
* **Header Banner:**
  * Optional URL for a decorative header illustration that clips across the top of the card.
* **Implementation:** Block-level overrides are written as scoped CSS custom properties on that block's container, falling back to the global theme values where unset.

---

## 8. Persistence & Data Portability

### 8.1 Local Storage
* Character state is automatically saved to browser `localStorage` on every mutation with debounce (300ms).
* Key structure: `ttrpg_sheet_<character_id>`.
* An active character manifest `ttrpg_manifest` keeps track of all created character IDs and names.

### 8.2 JSON Import / Export
* **Export Character:** Serializes the full JSON document and triggers a browser download: `<character-name>-sheet.json`.
* **Import Character:** Standard file picker reading `.json` files. Validates against the Zod schema (rejecting malformed/partial files with a clear error rather than partially loading), parses the object, updates `localStorage`, and immediately mounts the imported sheet.
* **Export Template:** Strips all character-specific names and values, preserving layout, block structures, tags, and theme styling for sharing or re-use.

### 8.3 Undo / Redo (Action History)
* Scope: undo/redo covers **structural Edit Mode changes only** — block add/delete/move/resize/move-to-tab, tag edits, style edits, tab add/rename/remove, and theme changes. It intentionally does **not** cover Play Mode tracker/pip value changes (HP ticks, pip toggles, rest actions) — those happen rapidly during play and are trivial to manually correct, so including them would add undo-stack noise without real benefit.
* Implementation: an in-memory history layer wrapping the Zustand store (e.g. a temporal/undo middleware), storing state snapshots on each committed action from §2.2's contract.
* Text-field edits (markdown, descriptions) are debounced/coalesced so one undo step corresponds to a pause in typing, not each keystroke.
* History is session-only — it lives in memory and is cleared on page reload. It never touches the persisted `localStorage` character state, which is unaffected by undo/redo.
* Standard bindings: Ctrl/Cmd+Z to undo, Ctrl/Cmd+Shift+Z (or Ctrl+Y) to redo, active only in Edit Mode.

---

## 9. Personal MVP Implementation Roadmap

```
===================================================================
Phase 0: Foundation Contracts
-------------------------------------------------------------------
- Define the character schema once as a Zod schema; infer TS types from it.
- Define the full Zustand store shape and action contract (§2.2).
- Confirm reset-tag vocabulary (#short-rest, #long-rest, any others) as
  the single source of truth for reset behavior — no per-block reset
  fields anywhere in the schema.
- These are the locked architectural decisions every later phase builds on.

===================================================================
Phase 1: Core Foundation & Grid Canvas
-------------------------------------------------------------------
- Initialize Vite + React 19 + TypeScript project. Vanilla CSS with custom
  properties for theming — no CSS framework dependency.
- Integrate `react-grid-layout` for the 12-column responsive canvas wired to `updateTabLayout`.
- Set up the Zustand store from Phase 0's contract, with `zundo` undo/redo
  middleware wrapping structural mutations (§8.3).
- Implement Edit Mode (freeform layout/resize) vs. Play Mode (locked grid).
- Implement local persistence (`localStorage`) and Export/Import JSON,
  with Zod validation on import.

===================================================================
Phase 2: Core Primitives & Content Display
-------------------------------------------------------------------
- Build Primitive 1: Numeric Tracker (Current, Max, Temp, +/- steppers).
- Build Primitive 2: Pip Matrix (Dynamic rows, click-to-expend).
- Build Primitive 3: Stat Pill (Score + modifier display).
- Build Primitive 4: Feature Card (Title, badge, tags, markdown text).
- Build Primitive 5: Notes Block (Simple markdown viewer/editor).

===================================================================
Phase 3: Multi-Tab System & Semantic Tag Engine
-------------------------------------------------------------------
- Build Tab navigation bar (Add tab, rename, switch active layout).
- Implement block migration between tabs (`moveBlockToTab`).
- Implement tag manager on Feature Cards and Trackers.
- Build Play Mode Filter Bar (Click tags to highlight/isolate blocks).
- Implement Rest Action buttons calling `applyRest(tag)`, scanning the
  `tags` array as the sole reset source (§6.1).

===================================================================
Phase 4: Expressive Styling Suite & Polish
-------------------------------------------------------------------
- Build Global Theme Drawer (Canvas background, font selectors, palette)
  writing to root CSS custom properties.
- Implement block-level style overrides (Borders, custom backgrounds,
  banners) as scoped CSS custom properties.
- Build "Export as Clean Template" utility.
- Implement mobile Play Mode single-column reflow (§4.4).
- Final UX audit: verify zero-formula friction, undo/redo coverage
  matches §8.3's scope, and mobile Play Mode usability.
===================================================================
```
