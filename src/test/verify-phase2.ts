import { CharacterSchema, type Block } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 2 CORE PRIMITIVES VERIFICATION TESTS ===\n");

const store = useCharacterStore.getState();
const defaultChar = createDefaultCharacter();
store.importCharacter(defaultChar);

const activeTab = useCharacterStore.getState().character.activeTabId;

// -----------------------------------------------------------------------------
// 1. Tracker Primitive Verification
// -----------------------------------------------------------------------------
console.log("--- 1. Tracker Primitive ---");
store.addBlock(activeTab, "tracker", {
  current: 20,
  max: 30,
  temp: 5,
  step: 2,
});

const blocks1 = useCharacterStore.getState().character.blocks;
const trackerId = Object.keys(blocks1).find(
  (id) => blocks1[id].type === "tracker" && blocks1[id].title === "New Tracker"
)!;
assert(!!trackerId, "Tracker block created successfully");

// Test step increment & decrement
const trackerBlock = useCharacterStore.getState().character.blocks[trackerId] as Extract<Block, { type: "tracker" }>;
store.updateBlockData(trackerId, { current: trackerBlock.data.current + trackerBlock.data.step });
let updatedTracker = useCharacterStore.getState().character.blocks[trackerId] as Extract<Block, { type: "tracker" }>;
assert(updatedTracker.data.current === 22, "Tracker stepped up by 2 (20 -> 22)");

store.updateBlockData(trackerId, { current: 15, temp: 10 });
updatedTracker = useCharacterStore.getState().character.blocks[trackerId] as Extract<Block, { type: "tracker" }>;
assert(updatedTracker.data.current === 15 && updatedTracker.data.temp === 10, "Direct current and temp updates applied");

// -----------------------------------------------------------------------------
// 2. Pip Matrix Primitive Verification
// -----------------------------------------------------------------------------
console.log("\n--- 2. Pip Matrix Primitive ---");
store.addBlock(activeTab, "pip_array", {
  rows: [
    { label: "1st Level", total: 4, expended: 1 },
    { label: "2nd Level", total: 3, expended: 0 },
  ],
});

const blocks2 = useCharacterStore.getState().character.blocks;
const pipId = Object.keys(blocks2).find(
  (id) => blocks2[id].type === "pip_array" && blocks2[id].title === "New Pip Array"
)!;
assert(!!pipId, "Pip Matrix block created successfully");

let pipBlock = useCharacterStore.getState().character.blocks[pipId] as Extract<Block, { type: "pip_array" }>;
assert(pipBlock.data.rows.length === 2, "Pip Matrix initialized with 2 rows");

// Add row & modify
const newRows = [
  ...pipBlock.data.rows,
  { label: "3rd Level", total: 2, expended: 2 },
];
store.updateBlockData(pipId, { rows: newRows });
pipBlock = useCharacterStore.getState().character.blocks[pipId] as Extract<Block, { type: "pip_array" }>;
assert(pipBlock.data.rows.length === 3 && pipBlock.data.rows[2].label === "3rd Level", "Added 3rd row to Pip Matrix");

// -----------------------------------------------------------------------------
// 3. Stat Group Primitive Verification
// -----------------------------------------------------------------------------
console.log("\n--- 3. Stat Group Primitive ---");
store.addBlock(activeTab, "stat_group", {
  stats: [
    { label: "STR", score: "18", sub: "+4" },
    { label: "DEX", score: "14", sub: "+2" },
  ],
});

const blocks3 = useCharacterStore.getState().character.blocks;
const statId = Object.keys(blocks3).find(
  (id) => blocks3[id].type === "stat_group" && blocks3[id].title === "New Stat Group"
)!;
assert(!!statId, "Stat Group block created successfully");

let statBlock = useCharacterStore.getState().character.blocks[statId] as Extract<Block, { type: "stat_group" }>;
assert(statBlock.data.stats[0].score === "18", "Stat group score initialized");

// Add stat pill and update
const updatedStats = [
  ...statBlock.data.stats,
  { label: "CON", score: "16", sub: "+3" },
];
store.updateBlockData(statId, { stats: updatedStats });
statBlock = useCharacterStore.getState().character.blocks[statId] as Extract<Block, { type: "stat_group" }>;
assert(statBlock.data.stats.length === 3 && statBlock.data.stats[2].label === "CON", "Added CON stat pill to Stat Group");

// -----------------------------------------------------------------------------
// 4. Feature Card Primitive Verification
// -----------------------------------------------------------------------------
console.log("\n--- 4. Feature Card Primitive ---");
store.addBlock(activeTab, "card", {
  badge: "Bonus Action",
  description: "**Second Wind**: Regain *1d10 + fighter level* HP.",
  tracker: {
    enabled: true,
    current: 1,
    max: 1,
  },
});

const blocks4 = useCharacterStore.getState().character.blocks;
const cardId = Object.keys(blocks4).find(
  (id) => blocks4[id].type === "card" && blocks4[id].title === "New Feature Card"
)!;
assert(!!cardId, "Feature Card block created successfully");

let cardBlock = useCharacterStore.getState().character.blocks[cardId] as Extract<Block, { type: "card" }>;
assert(cardBlock.data.badge === "Bonus Action", "Card badge matches");
assert(cardBlock.data.tracker?.enabled === true, "Card tracker is enabled");

// Expend embedded tracker
store.updateBlockData(cardId, {
  tracker: {
    enabled: true,
    current: 0,
    max: 1,
  },
});
cardBlock = useCharacterStore.getState().character.blocks[cardId] as Extract<Block, { type: "card" }>;
assert(cardBlock.data.tracker?.current === 0, "Card embedded tracker successfully expended to 0");

// -----------------------------------------------------------------------------
// 5. Notes Block Primitive Verification
// -----------------------------------------------------------------------------
console.log("\n--- 5. Notes Block Primitive ---");
store.addBlock(activeTab, "notes", {
  markdown: "## Session 1\nThe party met at the tavern in Neverwinter.",
});

const blocks5 = useCharacterStore.getState().character.blocks;
const notesId = Object.keys(blocks5).find(
  (id) => blocks5[id].type === "notes" && blocks5[id].title === "New Notes"
)!;
assert(!!notesId, "Notes Block created successfully");

let notesBlock = useCharacterStore.getState().character.blocks[notesId] as Extract<Block, { type: "notes" }>;
assert(notesBlock.data.markdown.includes("Session 1"), "Notes markdown content saved");

// -----------------------------------------------------------------------------
// 6. Title and Tag Updates
// -----------------------------------------------------------------------------
console.log("\n--- 6. Block Title & Tag Management ---");
store.updateBlockTitle(cardId, "Second Wind");
store.updateBlockTags(cardId, ["#action", "#short-rest", "#fighter"]);

cardBlock = useCharacterStore.getState().character.blocks[cardId] as Extract<Block, { type: "card" }>;
assert(cardBlock.title === "Second Wind", "Block title updated to 'Second Wind'");
assert(
  cardBlock.tags.includes("#short-rest") && cardBlock.tags.includes("#fighter"),
  "Block tags updated with #short-rest and #fighter"
);

// -----------------------------------------------------------------------------
// 7. Rest Engine Verification across Primitives
// -----------------------------------------------------------------------------
console.log("\n--- 7. Rest Engine Triggering on Primitives ---");
// cardId has tracker current: 0 and tag #short-rest
assert(cardBlock.data.tracker?.current === 0, "Card tracker confirmed at 0 before rest");

store.applyRest("#short-rest");
cardBlock = useCharacterStore.getState().character.blocks[cardId] as Extract<Block, { type: "card" }>;
assert(cardBlock.data.tracker?.current === 1, "applyRest('#short-rest') reset embedded card tracker back to max (1)");

// -----------------------------------------------------------------------------
// 8. Schema Validation of Complete Sheet with all 5 Primitives
// -----------------------------------------------------------------------------
console.log("\n--- 8. Full Schema Validation ---");
const finalChar = useCharacterStore.getState().character;
const validationResult = CharacterSchema.safeParse(finalChar);
assert(validationResult.success, "Complete character with all 5 primitives passes CharacterSchema.parse()");

console.log("\n🎉 ALL PHASE 2 CORE PRIMITIVES TESTS PASSED!\n");
