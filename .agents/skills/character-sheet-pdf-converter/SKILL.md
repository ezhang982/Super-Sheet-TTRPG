---
name: character-sheet-pdf-converter
description: >-
  Converts uploaded TTRPG character sheet PDFs (such as D&D 5e / D&D Beyond exports) into
  a fully validated JSON document formatted for direct import into Super Sheet. Use whenever
  the user uploads or references a character sheet PDF and asks to convert, import, or produce
  a JSON character sheet for Super Sheet.
---

# TTRPG Character Sheet PDF to Super Sheet JSON Converter

This skill defines the canonical workflow for extracting character sheet data from an uploaded PDF (e.g. D&D Beyond, official D&D 2024 sheets, or homebrew PDFs) and transforming it into an importable JSON document matching Super Sheet's `CharacterSchema` (`schema.ts`).

## Workflow Overview

1. **Extract & Inspect PDF Information**:
   - Parse all pages of the uploaded PDF (Core stats, Skills, Attacks, Defenses, Features/Traits, Equipment, Personality/Backstory, Spellcasting/Spell list).
   - Carefully verify checkmarks/bubbles for skill proficiencies, saving throws, and prepared spells.
   - Extract total equipment weights, currency, spell save DC, spell attack bonus, and attunement status.
   - Note rest recharge mechanics: distinguish abilities that reset on a Short Rest (`#short-rest`) vs Long Rest (`#long-rest`), paying special attention to class-specific rules (e.g. Warlock Pact Magic slots reset on a Short Rest, while Mystic Arcanum resets on a Long Rest).

2. **Map to Super Sheet Primitives**:
   - Every block must conform to `schema.ts`'s discriminated union on `type`:
     - `profile`: Character name, system ("D&D 5e (2024)"), level, XP, player name, extra info summary.
     - `tracker`: Numeric pools with current, max, temp, step (`block_hp`, `block_hit_dice`, `block_class_resource`). Supports dynamic quick-math (`+10`, `-14`, `/2`) in Play Mode.
     - `stat_group`: Attributes (`label`, `score`, `sub`) for Ability Scores, Combat Vitals, Saving Throws, and Spell Metrics. `sub` can be a static string (e.g. `+4`) or a dynamic formula (e.g. `= floor((@STR - 10) / 2)`).
     - `card`: Rich markdown cards with activation badges (`Action`, `Bonus Action`, `Reaction`, `Passive`, `At Will`, `Patron`, `Feat`). Can contain embedded `tracker` (`{ enabled: true, current: N, max: N }`) for limited-use resources like Healing Light or class features.
     - `pip_array`: Clickable resource pips (`Spell Slots`, `Death Saves & Inspiration`, `Luck Points`, `Innate & Free Uses`).
     - `skill_list`: Universal skills block with `{ id, name, stat, value, proficiency (0/1/2), notes }` and `sortMode: "alpha" | "stat" | "custom"`.
     - `inventory`: Container list with items array (`id`, `name`, `quantity`, `weight`, `cost`, `equipped`, `tags`, `description`, and optional `charges: { enabled, current, max }`), `currency` map (`CP`, `SP`, `EP`, `GP`, `PP`), and `capacity` (`enabled: true`, `maxWeight: STR * 15`).
     - `notes`: Markdown block for backstory, personality traits, ideals, bonds, flaws, and session lore.

3. **Interactive Dice Rolling & Markdown Conventions (Phase 10)**:
   - Super Sheet automatically parses dice notation (e.g. `1d20+8`, `2d12+4`, `1d10+5`, `12d6`, `3d10`) in card descriptions and notes, converting them into clickable dice chips in Play Mode.
   - Always format attack damages, healing pools, and saving throw damage in clean dice notation:
     - Example: `| **Eldritch Blast** | +11 | 1d10+5 Force | 3 Beams, 120 ft., V/S |`
     - Example: `You have a pool of **12d6** healing dice that resets on a Long Rest.`

4. **Semantic Tagging & Rest Engine Vocabulary**:
   - Tags are the sole mechanism driving the Rest Action Bar, Tag Filter Bar, and Omnisearch (`Ctrl+K`).
   - Assign semantic tags across blocks, cards, and items:
     - **Rest Triggers:** `#short-rest`, `#long-rest`
     - **Action Economy:** `#action`, `#bonus-action`, `#reaction`, `#passive`
     - **Magic & Casting:** `#magic`, `#spell`, `#cantrip`, `#concentration`, `#ritual`, `#attunement`
     - **Combat & Items:** `#combat`, `#weapon`, `#armor`, `#defense`, `#save`, `#healing`, `#equipment`, `#consumable`, `#resource`
     - **Structure & Lore:** `#core`, `#stats`, `#skills`, `#feature`, `#class`, `#species`, `#feat`, `#identity`, `#lore`
   - **Crucial Rule:** Warlock Pact Magic slots MUST be tagged `["#magic", "#short-rest", "#long-rest"]` because Warlocks regain slots on Short Rests, unlike standard spellcasters who only regain slots on `#long-rest`.

5. **Standard 4-Tab Layout Structure (12-Column Grid)**:
   - **`tab_core` ("Combat & Core")**:
     - `block_profile` (x: 0, y: 0, w: 7, h: 3)
     - `block_hp` (x: 7, y: 0, w: 5, h: 3) — include starting temp HP if granted by resting features (e.g. Celestial Resilience)
     - `block_vitals` (x: 0, y: 3, w: 7, h: 2) — AC, Initiative, Speed, Proficiency Bonus
     - `block_hit_dice` (x: 7, y: 3, w: 5, h: 2)
     - `block_attributes` (x: 0, y: 5, w: 12, h: 2) — STR, DEX, CON, INT, WIS, CHA
     - `block_saves_insp` (x: 0, y: 7, w: 5, h: 3) — Death saves, Inspiration, Luck points
     - `block_attacks` (x: 5, y: 7, w: 7, h: 3) — Attack table with interactive dice notation
     - `block_defenses` (x: 0, y: 10, w: 5, h: 3) — Resistances, immunities, passive senses
     - `block_saving_throws` (x: 5, y: 10, w: 7, h: 2) — Saving throws with proficiencies and advantage notes
     - `block_skills` (x: 0, y: 12, w: 12, h: 5) — All skills with proficiency badges and stat links
     - `block_proficiencies` (x: 0, y: 17, w: 12, h: 2) — Armor, weapons, tools, languages
   - **`tab_spells` ("Spells & Magic")** *(Omit or keep minimal if non-caster)*:
     - `block_spell_metrics` (x: 0, y: 0, w: 12, h: 2) — DC, Attack Bonus, Ability, Slot level
     - `block_spell_slots` / `block_pact_slots` (x: 0, y: 2, w: 6, h: 3) — Warlock pact slots or standard slots
     - `block_free_spells` (x: 6, y: 2, w: 6, h: 3) — Feat / innate free spells (e.g. Fey Touched, Ghostly Gaze)
     - `block_healing_light` / class magic resource (x: 0, y: 5, w: 12, h: 2) — Embedded tracker cards
     - `block_cantrips` (x: 0, y: 7, w: 12, h: 4) — At-will cantrips
     - `block_prepared_spells` / `block_spells_known` (x: 0, y: 11, w: 12, h: 8) — Leveled spells with casting times and components
   - **`tab_features` ("Features & Traits")**:
     - `block_subclass_features` (x: 0, y: 0, w: 6, h: 6) — Celestial patron, radiant soul, etc.
     - `block_class_features` / `block_invocations` (x: 6, y: 0, w: 6, h: 6) — Invocations, pact boons
     - `block_species_traits` (x: 0, y: 6, w: 6, h: 5) — Warforged resilience, integrated protection
     - `block_feats` (x: 6, y: 6, w: 6, h: 5) — War Caster, Lucky, Resilient, Tough, Fey Touched, Skilled
   - **`tab_inventory` ("Inventory & Lore")**:
     - `block_equipment` (x: 0, y: 0, w: 12, h: 6) — Items with equipped state, weight, attunement, currency, capacity
     - `block_notes_backstory` (x: 0, y: 6, w: 12, h: 5) — Personality traits, ideals, bonds, flaws, alignment, deity

6. **Schema Compliance Checklist**:
   - `version`: Always set to `"2.0.0"`.
   - `meta`: Valid `id` (`char_<uuid>`), `name`, `system`, `createdAt`, `updatedAt`.
   - `theme`: Must specify `fontHeading`, `fontBody`, `canvasBackground`, `cardBackground`, `borderColor`, `accentColor`, and `tagColors` dictionary.
   - `tabs`: Array of `{ id, label }`.
   - `activeTabId`: Must match a tab ID in `tabs`.
   - `layouts`: Every layout item `i` must correspond to an existing block in `blocks`, with coordinates `0 <= x <= 11`, `w >= 1`.
   - `blocks`: Discriminated union matching `schema.ts`. Ensure all numeric values are numbers, not strings.

7. **Output Delivery**:
   - Output the valid JSON directly in a fenced code block (` ```json `).
   - Do NOT save files to the workspace filesystem unless the user explicitly requests saving to disk.
   - Accompany the JSON with a concise, structured summary highlighting key stats, unique features, attuned items, and rest automation tags.
