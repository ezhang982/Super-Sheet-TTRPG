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
   - Parse all pages of the uploaded PDF (Core stats, Skills, Attacks, Features/Traits, Equipment, Personality/Backstory, Spellcasting/Spell list).
   - Carefully verify checkmarks/bubbles for skill proficiencies, saving throws, and prepared spells.
   - Calculate or extract total equipment weights, currency, spell save DC, and spell attack bonus.

2. **Map to Super Sheet Primitives**:
   - Every block must conform to `schema.ts`'s discriminated union on `type`:
     - `profile`: Character name, system ("D&D 5e (2024)"), level, XP, player name, extra info summary.
     - `tracker`: Numeric pools with current, max, temp, step (`block_hp`, `block_hit_dice`, `block_wild_shape`).
     - `stat_group`: Attributes (`label`, `score`, `sub`) for Ability Scores, Combat Vitals, and Spell Metrics.
     - `card`: Rich markdown cards with activation badges (`Attacks`, `Cantrips`, `Spells`, `Class`, `Species`, `Feats`). Optional embedded `tracker` for limited-use powers.
     - `pip_array`: Clickable resource pips (`Spell Slots`, `Death Saves & Inspiration`, `Innate & Free Uses`).
     - `skill_list`: Universal skills block with `{ id, name, stat, value, proficiency (0/1/2), notes }`.
     - `inventory`: Container list with items array (`id`, `name`, `quantity`, `weight`, `cost`, `equipped`, `tags`, `description`), `currency` map, and `capacity` (`enabled`, `maxWeight`).
     - `notes`: Markdown block for backstory, personality traits, and lore.

3. **Standard 4-Tab Layout Structure**:
   Organize characters across 4 standard tabs on a 12-column grid:
   - **`tab_core` ("Combat & Core")**:
     - `block_profile` (x: 0, y: 0, w: 7, h: 3)
     - `block_hp` (x: 7, y: 0, w: 5, h: 3)
     - `block_vitals` (x: 0, y: 3, w: 7, h: 3)
     - `block_hit_dice` (x: 7, y: 3, w: 5, h: 2)
     - `block_class_resource` (e.g. Wild Shape / Ki / Rage) (x: 7, y: 5, w: 5, h: 2)
     - `block_attributes` (x: 0, y: 6, w: 12, h: 2)
     - `block_saves_insp` (x: 0, y: 8, w: 5, h: 3)
     - `block_attacks` (x: 5, y: 8, w: 7, h: 3)
     - `block_skills` (x: 0, y: 11, w: 12, h: 5)
     - `block_proficiencies` (x: 0, y: 16, w: 12, h: 2)
   - **`tab_spells` ("Spells & Magic")** *(Omit or keep empty if non-caster)*:
     - `block_spell_metrics` (x: 0, y: 0, w: 12, h: 2)
     - `block_spell_slots` (x: 0, y: 2, w: 6, h: 4)
     - `block_free_spells` (x: 6, y: 2, w: 6, h: 4)
     - `block_cantrips` (x: 0, y: 6, w: 12, h: 4)
     - `block_prepared_spells` (x: 0, y: 10, w: 12, h: 6)
   - **`tab_features` ("Features & Traits")**:
     - `block_subclass_features` (x: 0, y: 0, w: 6, h: 6)
     - `block_class_features` (x: 6, y: 0, w: 6, h: 6)
     - `block_species_traits` (x: 0, y: 6, w: 6, h: 4)
     - `block_feats` (x: 6, y: 6, w: 6, h: 4)
   - **`tab_inventory` ("Inventory & Lore")**:
     - `block_equipment` (x: 0, y: 0, w: 12, h: 6)
     - `block_notes_backstory` (x: 0, y: 6, w: 12, h: 6)

4. **Schema Compliance Checklist**:
   - `version`: Always set to `"2.0.0"`.
   - `meta`: Valid `id` (`char_<uuid>`), `name`, `system`, `createdAt`, `updatedAt`.
   - `theme`: Must specify `fontHeading`, `fontBody`, `canvasBackground`, `cardBackground`, `borderColor`, `accentColor`.
   - `tabs`: Array of `{ id, label }`.
   - `activeTabId`: Must match a tab ID in `tabs`.
   - `layouts`: Every layout item `i` must correspond to an existing block in `blocks`, with coordinates `0 <= x <= 11`, `w >= 1`.
   - `blocks`: Discriminated union matching `schema.ts`. Ensure all numeric values are numbers, not strings.

5. **Output Delivery**:
   - Output the valid JSON directly in a fenced code block (` ```json `).
   - Do NOT save files to the workspace filesystem unless the user explicitly requests saving to disk.
