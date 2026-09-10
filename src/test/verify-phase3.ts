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

console.log("=== RUNNING PHASE 3 REST ENGINE, PROFILE BLOCK & PLAY MODE TESTS ===\n");

const store = useCharacterStore.getState();
const defaultChar = createDefaultCharacter();
store.importCharacter(defaultChar);

const activeTab = useCharacterStore.getState().character.activeTabId;

// -----------------------------------------------------------------------------
// 1. Profile Block Primitive Verification
// -----------------------------------------------------------------------------
console.log("--- 1. Profile Block Primitive ---");
store.addBlock(activeTab, "profile", {
  characterName: "Aethelgard",
  system: "D&D 5e",
  level: "5",
  experience: "6,500 XP",
  playerName: "Silver",
  extraInfo: "Paladin (Oath of Devotion)",
});

const blocks1 = useCharacterStore.getState().character.blocks;
const profileId = Object.keys(blocks1).find(
  (id) => blocks1[id].type === "profile" && (blocks1[id] as any).data.characterName === "Aethelgard"
)!;
assert(!!profileId, "Profile block created successfully");

const profileBlock = useCharacterStore.getState().character.blocks[profileId] as Extract<Block, { type: "profile" }>;
assert(profileBlock.data.system === "D&D 5e", "Profile block system matches 'D&D 5e'");
assert(profileBlock.data.level === "5", "Profile block level matches '5'");
assert(profileBlock.data.extraInfo === "Paladin (Oath of Devotion)", "Profile block extraInfo matches");

// Test updating profile fields
store.updateBlockData(profileId, {
  level: "6",
  experience: "14,000 XP",
});
const updatedProfile = useCharacterStore.getState().character.blocks[profileId] as Extract<Block, { type: "profile" }>;
assert(updatedProfile.data.level === "6", "Profile level updated to '6'");
assert(updatedProfile.data.experience === "14,000 XP", "Profile experience updated to '14,000 XP'");

// Test synchronization with meta
store.setCharacterMeta({ name: "Aethelgard Ironheart", system: "D&D 5e (2024)" });
assert(useCharacterStore.getState().character.meta.name === "Aethelgard Ironheart", "Character meta name synced");
assert(useCharacterStore.getState().character.meta.system === "D&D 5e (2024)", "Character meta system synced");

// Validate full character schema with profile block
const schemaValidation = CharacterSchema.safeParse(useCharacterStore.getState().character);
assert(schemaValidation.success, "Character with Profile block conforms to CharacterSchema");

// -----------------------------------------------------------------------------
// 2. Play Mode Semantic Tag Filtering
// -----------------------------------------------------------------------------
console.log("\n--- 2. Play Mode Semantic Tag Filtering ---");

// Check initial activeTagFilter state
assert(useCharacterStore.getState().activeTagFilter === null, "Initial activeTagFilter is null");

// Set active filter
store.setActiveTagFilter("#short-rest");
assert(useCharacterStore.getState().activeTagFilter === "#short-rest", "activeTagFilter set to '#short-rest'");

// Clear active filter
store.setActiveTagFilter(null);
assert(useCharacterStore.getState().activeTagFilter === null, "activeTagFilter reset to null");

// Extract unique tags across all blocks
const allBlocks = Object.values(useCharacterStore.getState().character.blocks);
const uniqueTags = Array.from(new Set(allBlocks.flatMap((b) => b.tags)));
assert(uniqueTags.length > 0, `Extracted ${uniqueTags.length} unique tags across character blocks`);
assert(uniqueTags.includes("#short-rest") || uniqueTags.includes("#long-rest"), "Unique tags include rest tags");

// Test block filtering logic (simulate dimming check)
const testTag = "#short-rest";
const matchingBlocks = allBlocks.filter((b) => b.tags.includes(testTag));
const nonMatchingBlocks = allBlocks.filter((b) => !b.tags.includes(testTag));
assert(matchingBlocks.length > 0, `Found ${matchingBlocks.length} blocks matching '${testTag}'`);
assert(nonMatchingBlocks.length > 0, `Found ${nonMatchingBlocks.length} blocks not matching '${testTag}'`);

// -----------------------------------------------------------------------------
// 3. Rest Engine Verification
// -----------------------------------------------------------------------------
console.log("\n--- 3. Rest Engine Execution ---");

// Add a tracker tagged with #short-rest
store.addBlock(activeTab, "tracker", {
  current: 3,
  max: 10,
  temp: 5,
  step: 1,
});
const blocksAfterTracker = useCharacterStore.getState().character.blocks;
const shortRestTrackerId = Object.keys(blocksAfterTracker).find(
  (id) => blocksAfterTracker[id].type === "tracker" && blocksAfterTracker[id].title === "New Tracker"
)!;
store.updateBlockTags(shortRestTrackerId, ["#short-rest", "#resource"]);

// Add a pip_array tagged with #short-rest
store.addBlock(activeTab, "pip_array", {
  rows: [
    { label: "Ki Points", total: 5, expended: 4 },
    { label: "Superiority Dice", total: 4, expended: 2 },
  ],
});
const blocksAfterPip = useCharacterStore.getState().character.blocks;
const shortRestPipId = Object.keys(blocksAfterPip).find(
  (id) => blocksAfterPip[id].type === "pip_array" && blocksAfterPip[id].title === "New Pip Array"
)!;
store.updateBlockTags(shortRestPipId, ["#short-rest", "#combat"]);

// Add a card with embedded tracker tagged with #short-rest
store.addBlock(activeTab, "card", {
  badge: "Feature",
  description: "Action Surge",
  tracker: { enabled: true, current: 0, max: 1 },
});
const blocksAfterCard = useCharacterStore.getState().character.blocks;
const shortRestCardId = Object.keys(blocksAfterCard).find(
  (id) => blocksAfterCard[id].type === "card" && blocksAfterCard[id].title === "New Feature Card"
)!;
store.updateBlockTags(shortRestCardId, ["#short-rest"]);

// Add an un-tagged tracker that should NOT reset on short rest
store.addBlock(activeTab, "tracker", {
  current: 12,
  max: 50,
  temp: 0,
  step: 1,
});
const blocksAfterUntagged = useCharacterStore.getState().character.blocks;
const longRestOnlyTrackerId = Object.keys(blocksAfterUntagged).find(
  (id) =>
    blocksAfterUntagged[id].type === "tracker" &&
    (blocksAfterUntagged[id] as any).data.max === 50
)!;
store.updateBlockTags(longRestOnlyTrackerId, ["#long-rest"]);

// Verify initial damaged/expended states before rest
const preRestTracker = useCharacterStore.getState().character.blocks[shortRestTrackerId] as Extract<Block, { type: "tracker" }>;
assert(preRestTracker.data.current === 3 && preRestTracker.data.temp === 5, "Tracker current is 3/10 with 5 temp before rest");

const preRestPip = useCharacterStore.getState().character.blocks[shortRestPipId] as Extract<Block, { type: "pip_array" }>;
assert(preRestPip.data.rows[0].expended === 4, "Ki Points has 4 expended pips before rest");

const preRestCard = useCharacterStore.getState().character.blocks[shortRestCardId] as Extract<Block, { type: "card" }>;
assert(preRestCard.data.tracker?.current === 0, "Action Surge card tracker is 0/1 before rest");

// TRIGGER SHORT REST
console.log("\n-> Executing applyRest('#short-rest')...");
store.applyRest("#short-rest");

// Verify short-rest tagged tracker reset
const postRestTracker = useCharacterStore.getState().character.blocks[shortRestTrackerId] as Extract<Block, { type: "tracker" }>;
assert(postRestTracker.data.current === 10, "Tracker current reset to max (10)");
assert(postRestTracker.data.temp === 0, "Tracker temp reset to 0");

// Verify short-rest tagged pip array reset
const postRestPip = useCharacterStore.getState().character.blocks[shortRestPipId] as Extract<Block, { type: "pip_array" }>;
assert(postRestPip.data.rows[0].expended === 0, "Ki Points expended pips reset to 0");
assert(postRestPip.data.rows[1].expended === 0, "Superiority Dice expended pips reset to 0");

// Verify short-rest tagged card tracker reset
const postRestCard = useCharacterStore.getState().character.blocks[shortRestCardId] as Extract<Block, { type: "card" }>;
assert(postRestCard.data.tracker?.current === 1, "Action Surge card tracker reset to max (1)");

// Verify #long-rest tagged tracker did NOT reset
const untouchedTracker = useCharacterStore.getState().character.blocks[longRestOnlyTrackerId] as Extract<Block, { type: "tracker" }>;
assert(untouchedTracker.data.current === 12, "Long-rest tracker was NOT modified by #short-rest (still 12)");

// TRIGGER LONG REST
console.log("\n-> Executing applyRest('#long-rest')...");
store.applyRest("#long-rest");

const postLongRestTracker = useCharacterStore.getState().character.blocks[longRestOnlyTrackerId] as Extract<Block, { type: "tracker" }>;
assert(postLongRestTracker.data.current === 50, "Long-rest tracker reset to max (50) on #long-rest");

// -----------------------------------------------------------------------------
// 4. Custom Rest Actions Configuration
// -----------------------------------------------------------------------------
console.log("\n--- 4. Rest Action Configuration ---");
const initialRestCount = useCharacterStore.getState().restActions.length;
store.addRestAction("Downtime Week", "#downtime");
const updatedRestActions = useCharacterStore.getState().restActions;
assert(updatedRestActions.length === initialRestCount + 1, "New rest action added");
const addedAction = updatedRestActions.find((a) => a.tag === "#downtime")!;
assert(addedAction.label === "Downtime Week", "Rest action label matches 'Downtime Week'");

store.removeRestAction(addedAction.id);
assert(useCharacterStore.getState().restActions.length === initialRestCount, "Rest action successfully removed");

// -----------------------------------------------------------------------------
// 5. Template Export Verification (Profile & Rest Data Cleaned)
// -----------------------------------------------------------------------------
console.log("\n--- 5. Template Export ---");
const template = store.exportTemplate();
assert(template.meta.name.includes("(Template)"), "Template name appended with '(Template)'");
const templateTracker = template.blocks[shortRestTrackerId] as Extract<Block, { type: "tracker" }>;
assert(templateTracker.data.temp === 0, "Template tracker temp cleared to 0");
const templatePip = template.blocks[shortRestPipId] as Extract<Block, { type: "pip_array" }>;
assert(templatePip.data.rows[0].expended === 0, "Template pip expended cleared to 0");
assert(!!template.blocks[profileId], "Template preserves Profile block");

console.log("\n🎉 ALL PHASE 3 VERIFICATION TESTS PASSED SUCCESSFULLY!");
