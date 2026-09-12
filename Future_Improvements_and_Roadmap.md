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

### Phase 9 — Workflow Intelligence, Shortcuts & Omnisearch

#### 1. Global Omnisearch / Command Palette (`Ctrl+K` / `Cmd+K`)
* **Trigger:** Keyboard shortcut `Ctrl+K` / `Cmd+K`, or clicking the **Search** button in the Header / Floating Tools Menu.
* **Search Scope:** Instant fuzzy search across:
  * Block titles across all tabs (e.g. "Action Surge", "Spell Slots")
  * Inventory items and weapons (e.g. "Longsword +1", "Potion of Healing")
  * Skill names (e.g. "Stealth", "Perception")
  * Tags (e.g. `#short-rest`, `#spell`)
* **Action:** Selecting a result instantly navigates to the corresponding tab, scrolls smoothly to the target block, highlights it with an accent glow, or opens it directly in the Pop-out modal.

#### 2. Universal Keyboard Shortcuts
A unified shortcut listener (disabled inside active text inputs) supporting:
* `Ctrl/Cmd + K`: Open Omnisearch.
* `E` or `Ctrl/Cmd + E`: Toggle Edit Mode / Play Mode.
* `Ctrl/Cmd + B`: Create new Block.
* `Ctrl/Cmd + T`: Add new Tab.
* `Ctrl/Cmd + Z` / `Ctrl/Cmd + Shift + Z`: Undo / Redo (in Edit Mode).
* `Ctrl/Cmd + D`: Duplicate selected/hovered block.
* `?`: Open Shortcut Cheatsheet modal.
* **Point-and-Click Discovery:** All shortcuts displayed as subtle badge hints on menu items (e.g. `New Block [Ctrl+B]`) and listed in a dedicated "Keyboard Shortcuts" dialog in the Floating Tools Menu.

#### 3. Block Duplication
* Context menu action **"Duplicate Block"** in `CardContextMenu.tsx`.
* Deep copies block configuration, styling, tags, and data with a new unique ID (`block_<uuid>`).
* Places the duplicate immediately adjacent or below the parent in the active tab layout.

#### 4. "Suggested Tags" Chip Tray
* Non-intrusive keyword assistant located directly beneath card tag inputs in Edit Mode.
* Scans card text against `src/utils/tagKeywords.ts`.
* Renders suggested chips: `💡 Suggested: [+ #short-rest] [+ #bonus-action]`. Clicking adds the tag immediately.
* Global toggle in Sheet Settings: **Enable Tag Suggestions** (default: On).

---

### Phase 10 — Tabletop Utility, Session State & Printability

#### 1. Dedicated Print / Clean PDF Export
* High-fidelity `@media print` stylesheet.
* Automatically strips dark canvas backgrounds, floating buttons, tab bars, and history indicators.
* Clean black-and-white borders with crisp serif/sans typography optimized for physical paper or PDF archival.
* Option to print active tab or reflow all tabs sequentially into standard page breaks.

#### 2. Floating Session Scratchpad & Combat Log
* Slide-out drawer or floating modal for transient in-session notes:
  * Quick monster HP tallies
  * Initiative tracker order
  * Ephemeral room clues, NPC names, and shopkeeper prices
* Does not clutter character canvas layouts or persist as formal blocks.
* Includes "Clear Session Notes" and "Promote to Permanent Notes Block" options.

#### 3. Visual Tag Management & Color Palette
* Assign custom accent colors or border styles to specific tags (e.g. `#action` = amber, `#bonus-action` = cyan, `#short-rest` = emerald, `#magic` = amethyst).
* Cards and filters reflect these colors across the canvas.
* Tag manager modal to rename or purge tags globally across all blocks in one click.

#### 4. Play Mode Value Revert & Roll Notations
* Ephemeral "Revert" toast after counter changes in Play Mode to catch accidental clicks.
* Click-to-copy roll notations (e.g. clicking `1d8 + 3` copies `/roll 1d8+3` to clipboard for Discord/Foundry/Roll20).
