import { CharacterSchema, type ProfileBlock, type StatGroupBlock, type NotesBlock, type InventoryBlock, type PipArrayBlock, type CardBlock } from "../types/schema";
import { dnd5eTemplate } from "../templates/dnd5e";
import { blankTemplate } from "../templates/blank";
import { BUILTIN_TEMPLATES } from "../templates";
import { useCharacterStore } from "../store/useCharacterStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 5: TEMPLATE ENGINE & STARTER TEMPLATES TEST SUITE ===\n");

// -----------------------------------------------------------------------------
// 1. Built-in Templates Schema Validation
// -----------------------------------------------------------------------------
console.log("--- 1. Schema Validation for Built-in Starter Templates ---");

const dndParseResult = CharacterSchema.safeParse(dnd5eTemplate);
assert(dndParseResult.success, "D&D 5e (2024) Starter Template validates cleanly against CharacterSchema");

const blankParseResult = CharacterSchema.safeParse(blankTemplate);
assert(blankParseResult.success, "Blank Canvas Template validates cleanly against CharacterSchema");

assert(BUILTIN_TEMPLATES.length >= 2, "Template Registry exposes built-in templates");
assert(BUILTIN_TEMPLATES.some((t) => t.id === "dnd5e"), "Template Registry contains dnd5e");
assert(BUILTIN_TEMPLATES.some((t) => t.id === "blank"), "Template Registry contains blank");

// -----------------------------------------------------------------------------
// 2. Store Integration: newCharacter()
// -----------------------------------------------------------------------------
console.log("\n--- 2. Store Integration: newCharacter() ---");

const store = useCharacterStore.getState();

// Create new character from dnd5eTemplate
store.newCharacter(dnd5eTemplate);
let currentChar = useCharacterStore.getState().character;
assert(currentChar.meta.id.startsWith("char_"), "newCharacter generates fresh char_<uuid>");
assert(currentChar.meta.name === "D&D 5e (2024) Starter", "newCharacter sets template name");
assert(currentChar.tabs.length === 4, "D&D 5e starter initialized with 4 tabs");
assert(Object.keys(currentChar.blocks).length > 5, "D&D 5e starter initialized with all core blocks");

// -----------------------------------------------------------------------------
// 3. Template Scrubbing Contract Verification
// -----------------------------------------------------------------------------
console.log("\n--- 3. Template Scrubbing Contract Verification ---");

// Populate personal character data
const profileId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "profile")!;
const statId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "stat_group")!;
const notesId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "notes")!;
const inventoryId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "inventory")!;
const pipId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "pip_array")!;
const cardId = Object.keys(currentChar.blocks).find((id) => currentChar.blocks[id].type === "card")!;

store.updateBlockData(profileId, {
  characterName: "Thorgar Ironbreaker",
  playerName: "Eden",
  level: "5",
  experience: "6500 XP",
  extraInfo: "Dwarven Battlerager",
});

store.updateBlockData(statId, {
  stats: [
    { label: "STR", score: "18", sub: "+4" },
    { label: "DEX", score: "12", sub: "+1" },
  ],
});

store.updateBlockData(notesId, {
  markdown: "Personal backstory: Born in the northern mountains...",
});

store.updateBlockData(pipId, {
  rows: [
    { label: "1st Level", total: 4, expended: 3 },
  ],
});

store.updateBlockData(cardId, {
  description: "Special action description text to preserve.",
  tracker: { enabled: true, current: 0, max: 2 },
});

// Mock window for export
(globalThis as any).window = {};

const scrubbedTemplate = store.exportTemplate();

// Validate template scrubbing
assert(
  scrubbedTemplate.meta.name.includes("(Template)"),
  "Template name has '(Template)' suffix appended"
);

const scrubbedProfile = scrubbedTemplate.blocks[profileId] as ProfileBlock;
assert(scrubbedProfile.data.characterName === "", "Scrubbed profile characterName is empty");
assert(scrubbedProfile.data.playerName === "", "Scrubbed profile playerName is empty");
assert(scrubbedProfile.data.level === "", "Scrubbed profile level is empty");
assert(scrubbedProfile.data.experience === "", "Scrubbed profile experience is empty");
assert(scrubbedProfile.data.extraInfo === "", "Scrubbed profile extraInfo is empty");

const scrubbedStats = scrubbedTemplate.blocks[statId] as StatGroupBlock;
assert(scrubbedStats.data.stats[0].label === "STR", "Stat label 'STR' is retained");
assert(scrubbedStats.data.stats[0].score === "", "Stat score is cleared");
assert(scrubbedStats.data.stats[0].sub === "", "Stat sub/modifier is cleared");

const scrubbedNotes = scrubbedTemplate.blocks[notesId] as NotesBlock;
assert(scrubbedNotes.data.markdown === "", "Notes markdown is cleared");

const scrubbedInventory = scrubbedTemplate.blocks[inventoryId] as InventoryBlock;
assert(scrubbedInventory.data.items.length === 0, "Inventory items are scrubbed to empty array");
assert(scrubbedInventory.data.capacity?.enabled === true, "Inventory capacity configuration is retained");

const scrubbedPips = scrubbedTemplate.blocks[pipId] as PipArrayBlock;
assert(scrubbedPips.data.rows[0].label === "1st Level", "Pip row label is retained");
assert(scrubbedPips.data.rows[0].total === 4, "Pip row total pips (4) is retained");
assert(scrubbedPips.data.rows[0].expended === 0, "Pip row expended is reset to 0");

const scrubbedCard = scrubbedTemplate.blocks[cardId] as CardBlock;
assert(
  scrubbedCard.data.description === "Special action description text to preserve.",
  "Feature card description/rules text is preserved"
);
assert(
  scrubbedCard.data.tracker?.current === 2,
  "Feature card embedded tracker reset to max (2)"
);

// Full validation
const templateParse = CharacterSchema.safeParse(scrubbedTemplate);
assert(templateParse.success, "Scrubbed template document validates cleanly against CharacterSchema");

console.log("\n🎉 ALL PHASE 5 TEMPLATE & NEW CHARACTER TESTS PASSED SUCCESSFULLY!\n");
