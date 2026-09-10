import { CharacterSchema } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 1 VERIFICATION TESTS ===\n");

// 1. Zod Schema Verification
console.log("--- 1. Zod Schema Validation ---");
const defaultChar = createDefaultCharacter();
const validResult = CharacterSchema.safeParse(defaultChar);
assert(validResult.success, "Default character fixture passes CharacterSchema.parse()");

const invalidResult = CharacterSchema.safeParse({
  version: "2.0.0",
  meta: { id: "bad" }, // Missing required fields
});
assert(!invalidResult.success, "Corrupt document correctly rejected by CharacterSchema.safeParse()");

// 2. Store & Deep Merge Verification
console.log("\n--- 2. Store & Deep Patching ---");
const store = useCharacterStore.getState();

// Add a card block
store.addBlock("tab_main", "card", {
  badge: "Test Feature",
  description: "Initial description",
  tracker: {
    enabled: true,
    current: 0,
    max: 3,
  },
});

const currentBlocks = useCharacterStore.getState().character.blocks;
const cardId = Object.keys(currentBlocks).find(
  (id) => currentBlocks[id].type === "card" && currentBlocks[id].title === "New Feature Card"
);
assert(!!cardId, "Block successfully created and found in store");

if (cardId) {
  // Test deep merge on nested tracker
  store.updateBlockData(cardId, { tracker: { current: 2 } });
  const updatedBlock = useCharacterStore.getState().character.blocks[cardId];
  assert(
    updatedBlock.type === "card" &&
      updatedBlock.data.tracker?.current === 2 &&
      updatedBlock.data.tracker?.max === 3 &&
      updatedBlock.data.tracker?.enabled === true,
    "Deep patch safely updated tracker.current without wiping max or enabled"
  );
}

// 3. Layout Synchronization (updateTabLayout)
console.log("\n--- 3. Grid Layout Synchronization ---");
const testLayout = [
  { i: "block_hp", x: 0, y: 0, w: 6, h: 2 },
  { i: "block_stats", x: 6, y: 0, w: 6, h: 2 },
];
store.updateTabLayout("tab_main", testLayout);
const storedLayout = useCharacterStore.getState().character.layouts["tab_main"];
assert(
  storedLayout.length === 2 && storedLayout[0].w === 6 && storedLayout[1].x === 6,
  "updateTabLayout committed the complete tab layout snapshot"
);

// 4. Tab Deletion Cascade & Guard
console.log("\n--- 4. Tab Deletion Cascade & Guard ---");
// Add a temporary tab with a block
store.addTab("Temp Tab");
const tempTabId = useCharacterStore.getState().character.activeTabId;
store.addBlock(tempTabId, "notes", { markdown: "Temp note" });

const tempTabBlocks = useCharacterStore.getState().character.layouts[tempTabId];
assert(tempTabBlocks.length === 1, "Temp tab has 1 block before deletion");
const tempBlockId = tempTabBlocks[0].i;

// Delete the tab
store.removeTab(tempTabId);
const afterTabs = useCharacterStore.getState().character.tabs;
const afterBlocks = useCharacterStore.getState().character.blocks;
const afterLayouts = useCharacterStore.getState().character.layouts;

assert(!afterTabs.some((t) => t.id === tempTabId), "Tab removed from tabs list");
assert(!afterBlocks[tempBlockId], "Blocks on deleted tab cascaded and were removed from blocks dictionary");
assert(!afterLayouts[tempTabId], "Tab layout removed from layouts record");
assert(afterTabs.length >= 1, "At least one tab remains");

// Verify guard preventing deleting last tab
while (useCharacterStore.getState().character.tabs.length > 1) {
  const tId = useCharacterStore.getState().character.tabs[1].id;
  useCharacterStore.getState().removeTab(tId);
}
assert(useCharacterStore.getState().character.tabs.length === 1, "Reduced to exactly 1 tab");
const lastTabId = useCharacterStore.getState().character.tabs[0].id;
useCharacterStore.getState().removeTab(lastTabId);
assert(
  useCharacterStore.getState().character.tabs.length === 1,
  "Last-tab guard prevented deleting the final remaining tab"
);

// 5. Rest Engine Verification
console.log("\n--- 5. Rest Engine ---");
// Add an hp tracker with #short-rest tag
store.addBlock(lastTabId, "tracker", {
  current: 12,
  max: 30,
  temp: 5,
  step: 1,
});
const trackerBlockId = Object.keys(useCharacterStore.getState().character.blocks).find(
  (id) => useCharacterStore.getState().character.blocks[id].title === "New Tracker"
)!;
useCharacterStore.getState().updateBlockTags(trackerBlockId, ["#health", "#short-rest"]);

useCharacterStore.getState().applyRest("#short-rest");
const restedBlock = useCharacterStore.getState().character.blocks[trackerBlockId];
assert(
  restedBlock.type === "tracker" &&
    restedBlock.data.current === 30 &&
    restedBlock.data.temp === 0,
  "applyRest('#short-rest') reset matching tracker current to max and temp to 0"
);

// 6. Clean Template Export
console.log("\n--- 6. Clean Template Export ---");
const template = useCharacterStore.getState().exportTemplate();
assert(
  template.meta.id !== useCharacterStore.getState().character.meta.id,
  "Template has a fresh unique meta.id"
);
assert(
  template.meta.name.includes("(Template)"),
  "Template meta.name is cleanly labeled as a Template"
);

console.log("\n🎉 ALL PHASE 1 CORE FOUNDATION TESTS PASSED!\n");
