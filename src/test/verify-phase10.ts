import { useCharacterStore } from "../store/useCharacterStore";
import { rollDice, isDiceNotation } from "../utils/diceRolls";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log("=== Running Phase 10 Verification Suite ===\n");

  const store = useCharacterStore.getState();

  // -------------------------------------------------------------
  // Test 1: Undo/Redo Sheet Isolation (clearHistory on sheet switch)
  // -------------------------------------------------------------
  console.log("--- Test 1: Undo/Redo Sheet Isolation ---");

  // Create initial character
  store.newCharacter();
  const char1Id = useCharacterStore.getState().character.meta.id;
  const initialPastStates = useCharacterStore.temporal.getState().pastStates.length;
  assert(initialPastStates === 0, "pastStates is 0 on newCharacter");

  // Perform an edit on char1 (add a block)
  const tab1 = useCharacterStore.getState().character.activeTabId;
  useCharacterStore.getState().addBlock(tab1, "card");
  const pastAfterAdd = useCharacterStore.temporal.getState().pastStates.length;
  assert(pastAfterAdd > 0, "pastStates records modification on active sheet");

  // Create a second character
  useCharacterStore.getState().newCharacter();
  const char2Id = useCharacterStore.getState().character.meta.id;
  assert(char2Id !== char1Id, "Created distinct second character");
  assert(
    useCharacterStore.temporal.getState().pastStates.length === 0,
    "pastStates is cleared when switching / creating new character"
  );

  // Switch back to char1 via loadCharacterById
  const loaded = await useCharacterStore.getState().loadCharacterById(char1Id);
  assert(loaded, "Successfully loaded character 1");
  assert(
    useCharacterStore.temporal.getState().pastStates.length === 0,
    "pastStates is cleared when loading character by ID"
  );

  // -------------------------------------------------------------
  // Test 2: Tab Movement & Reordering (moveTab & reorderTabs)
  // -------------------------------------------------------------
  console.log("\n--- Test 2: Tab Movement & Reordering ---");
  useCharacterStore.getState().newCharacter();
  const initialTabs = useCharacterStore.getState().character.tabs;
  const t1Id = initialTabs[0].id;

  // Add 2 more tabs
  useCharacterStore.getState().addTab("Tab B");
  useCharacterStore.getState().addTab("Tab C");

  let currentTabs = useCharacterStore.getState().character.tabs;
  assert(currentTabs.length === 3, "Created 3 tabs");
  const t2Id = currentTabs[1].id;
  const t3Id = currentTabs[2].id;

  // Cannot move first tab left (out of bounds)
  useCharacterStore.getState().moveTab(0, -1);
  currentTabs = useCharacterStore.getState().character.tabs;
  assert(currentTabs[0].id === t1Id, "Cannot move first tab left (boundary check)");

  // Move first tab right
  useCharacterStore.getState().moveTab(0, 1);
  currentTabs = useCharacterStore.getState().character.tabs;
  assert(currentTabs[0].id === t2Id && currentTabs[1].id === t1Id, "moveTab right shifted tab to index 1");

  // Move third tab right (cannot move past end)
  useCharacterStore.getState().moveTab(2, 3);
  currentTabs = useCharacterStore.getState().character.tabs;
  assert(currentTabs[2].id === t3Id, "Cannot move last tab right (boundary check)");

  // Reorder tabs with drag-and-drop: move tab 2 to position 0
  useCharacterStore.getState().moveTab(2, 0);
  currentTabs = useCharacterStore.getState().character.tabs;
  assert(currentTabs[0].id === t3Id, "moveTab(2, 0) moved tab at index 2 to index 0");

  // Reorder tabs via reorderTabs
  const reversedTabs = [...currentTabs].reverse();
  useCharacterStore.getState().reorderTabs(reversedTabs);
  assert(
    useCharacterStore.getState().character.tabs[0].id === reversedTabs[0].id,
    "reorderTabs successfully reordered tabs array"
  );

  // -------------------------------------------------------------
  // Test 3: Tag Management (Colors, Global Rename, Global Delete)
  // -------------------------------------------------------------
  console.log("\n--- Test 3: Tag Management ---");
  // Set custom tag color
  useCharacterStore.getState().setTagColor("#fire", "#e06c75");
  let themeTagColors = useCharacterStore.getState().character.theme.tagColors;
  assert(themeTagColors?.["#fire"] === "#e06c75", "setTagColor correctly set #fire to #e06c75");

  // Add blocks with tags
  const activeTab = useCharacterStore.getState().character.activeTabId;
  useCharacterStore.getState().addBlock(activeTab, "card");
  const blocks = useCharacterStore.getState().character.blocks;
  const blockId = Object.keys(blocks)[0];
  useCharacterStore.getState().updateBlockTags(blockId, ["#fire", "#action"]);

  assert(
    useCharacterStore.getState().character.blocks[blockId].tags.includes("#fire"),
    "Block has #fire tag"
  );

  // Global Rename: rename #fire to #flame
  useCharacterStore.getState().renameTagGlobally("#fire", "#flame");
  const updatedBlock = useCharacterStore.getState().character.blocks[blockId];
  assert(
    updatedBlock.tags.includes("#flame") && !updatedBlock.tags.includes("#fire"),
    "renameTagGlobally replaced #fire with #flame in block tags"
  );
  themeTagColors = useCharacterStore.getState().character.theme.tagColors;
  assert(
    themeTagColors?.["#flame"] === "#e06c75" && !themeTagColors?.["#fire"],
    "renameTagGlobally updated theme tagColors dictionary"
  );

  // Global Delete: delete #flame
  useCharacterStore.getState().deleteTagGlobally("#flame");
  const postDeleteBlock = useCharacterStore.getState().character.blocks[blockId];
  assert(!postDeleteBlock.tags.includes("#flame"), "deleteTagGlobally removed #flame from block tags");
  themeTagColors = useCharacterStore.getState().character.theme.tagColors;
  assert(!themeTagColors?.["#flame"], "deleteTagGlobally removed #flame from theme tagColors");

  // -------------------------------------------------------------
  // Test 4: Interactive Dice Notation Parser & Roller
  // -------------------------------------------------------------
  console.log("\n--- Test 4: Interactive Dice Notation Parser & Roller ---");
  // Notation validation
  assert(isDiceNotation("2d6"), "isDiceNotation matches '2d6'");
  assert(isDiceNotation("1d20+5"), "isDiceNotation matches '1d20+5'");
  assert(isDiceNotation("3d8-2"), "isDiceNotation matches '3d8-2'");
  assert(isDiceNotation("d100"), "isDiceNotation matches 'd100'");
  assert(!isDiceNotation("hello"), "isDiceNotation rejects 'hello'");

  // Dice Rolling
  const roll2d6 = rollDice("2d6");
  assert(roll2d6 !== null, "rollDice('2d6') parsed successfully");
  if (roll2d6) {
    assert(roll2d6.diceCount === 2, "diceCount is 2");
    assert(roll2d6.diceSides === 6, "diceSides is 6");
    assert(roll2d6.rolls.length === 2, "2 individual rolls generated");
    assert(roll2d6.rolls.every((r) => r >= 1 && r <= 6), "every roll is between 1 and 6");
    assert(roll2d6.total >= 2 && roll2d6.total <= 12, "total is between 2 and 12");
  }

  const rollWithModifier = rollDice("1d20+5");
  assert(rollWithModifier !== null, "rollDice('1d20+5') parsed successfully");
  if (rollWithModifier) {
    assert(rollWithModifier.modifier === 5, "modifier is 5");
    assert(rollWithModifier.total === rollWithModifier.rolls[0] + 5, "total includes modifier");
    assert(rollWithModifier.total >= 6 && rollWithModifier.total <= 25, "total within valid range");
  }

  const rollShorthand = rollDice("d12");
  assert(rollShorthand !== null && rollShorthand.diceCount === 1 && rollShorthand.diceSides === 12, "d12 defaults count to 1");

  // -------------------------------------------------------------
  // Test 5: MinW Grid Constraints (1-column minimum width)
  // -------------------------------------------------------------
  console.log("\n--- Test 5: MinW 1-Column Layout Flexibility ---");
  const layout = useCharacterStore.getState().character.layouts[activeTab];
  // Verify that an item can be updated to w: 1, h: 2
  useCharacterStore.getState().updateTabLayout(activeTab, [
    { ...layout[0], w: 1, h: 2 }
  ]);
  const updatedLayout = useCharacterStore.getState().character.layouts[activeTab];
  assert(updatedLayout[0].w === 1, "Layout allows width = 1 for fine-grained column placement");

  console.log("\n🎉 ALL PHASE 10 VERIFICATION TESTS PASSED SUCCESSFULLY! 🎉\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  throw err;
});
