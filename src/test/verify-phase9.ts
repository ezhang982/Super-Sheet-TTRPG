import { useCharacterStore } from "../store/useCharacterStore";
import { getSuggestedTags, extractBlockCorpus, KEYWORD_TAG_MAP } from "../utils/tagKeywords";
import type { Block, CardBlock } from "../types/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

console.log("=== Phase 9: Workflow Intelligence, Shortcuts & Omnisearch Verification ===");

// 1. Tag Keywords & Suggestion Engine Tests
console.log("1. Testing Tag Keywords & Suggestion Engine...");

assert(KEYWORD_TAG_MAP.length >= 10, "Keyword dictionary should contain comprehensive mappings");

const sampleCard: Block = {
  id: "test_card_1",
  type: "card",
  title: "Second Wind",
  tags: ["#fighter"],
  style: {},
  data: {
    badge: "Bonus Action",
    description: "You regain hit points equal to 1d10 + your fighter level. Once you use this feature, you must finish a short rest or long rest before you can use it again.",
    tracker: { enabled: true, current: 1, max: 1 },
  },
};

const corpus = extractBlockCorpus(sampleCard);
assert(corpus.includes("Second Wind"), "Corpus should include title");
assert(corpus.includes("Bonus Action"), "Corpus should include badge");
assert(corpus.includes("regain hit points"), "Corpus should include description");

const suggestions = getSuggestedTags(sampleCard);
console.log("  Suggested tags for Second Wind:", suggestions);
assert(suggestions.includes("#short-rest"), "Should suggest #short-rest");
assert(suggestions.includes("#long-rest"), "Should suggest #long-rest");
assert(suggestions.includes("#bonus-action"), "Should suggest #bonus-action");
assert(suggestions.includes("#healing"), "Should suggest #healing");

// When a tag is already attached, it should not be suggested
const cardWithTags: Block = {
  ...sampleCard,
  tags: ["#short-rest", "#bonus-action"],
};
const filteredSuggestions = getSuggestedTags(cardWithTags);
assert(!filteredSuggestions.includes("#short-rest"), "Already attached #short-rest should be omitted");
assert(!filteredSuggestions.includes("#bonus-action"), "Already attached #bonus-action should be omitted");
assert(filteredSuggestions.includes("#long-rest"), "Unattached #long-rest should still be suggested");

console.log("✓ Tag keywords and suggestion engine tests passed!");

// 2. Block Duplication Tests
console.log("2. Testing Block Duplication in Store...");
const store = useCharacterStore.getState();

// Add a test block
const activeTabId = store.character.activeTabId;
store.addBlock(activeTabId, "card", {
  badge: "Action",
  description: "Cast Fireball: 8d6 fire damage.",
  tracker: { enabled: true, current: 2, max: 2 },
});

const currentBlocks = useCharacterStore.getState().character.blocks;
const originalBlockId = Object.keys(currentBlocks).find(
  (id) => currentBlocks[id].type === "card" && currentBlocks[id].data.description?.includes("Fireball")
);
assert(Boolean(originalBlockId), "Original test card should exist");

const originalBlock = currentBlocks[originalBlockId!] as CardBlock;
store.updateBlockTags(originalBlockId!, ["#magic", "#spell"]);

// Duplicate the block
const duplicatedBlockId = useCharacterStore.getState().duplicateBlock(originalBlockId!);
assert(Boolean(duplicatedBlockId), "duplicateBlock should return a new block ID");
assert(duplicatedBlockId !== originalBlockId, "Duplicate ID must be unique");

const stateAfterDuplication = useCharacterStore.getState();
const dupBlock = stateAfterDuplication.character.blocks[duplicatedBlockId!] as CardBlock;
assert(Boolean(dupBlock), "Duplicated block should exist in character blocks");
assert(dupBlock.title.includes("(Copy)"), "Duplicated block title should have '(Copy)' appended");
assert(dupBlock.tags.includes("#magic") && dupBlock.tags.includes("#spell"), "Tags should be cloned");
assert(dupBlock.data.description === originalBlock.data.description, "Description should be cloned");

// Verify deep clone isolation (mutating duplicate does not affect original)
useCharacterStore.getState().updateBlockData(duplicatedBlockId!, { description: "Modified duplicate text" });
const stateAfterMutation = useCharacterStore.getState();
const mutatedOriginal = stateAfterMutation.character.blocks[originalBlockId!] as CardBlock;
const mutatedDup = stateAfterMutation.character.blocks[duplicatedBlockId!] as CardBlock;
assert(
  mutatedOriginal.data.description === "Cast Fireball: 8d6 fire damage.",
  "Original block description should not be mutated when duplicate is updated"
);
assert(
  mutatedDup.data.description === "Modified duplicate text",
  "Duplicate block description should be updated"
);

// Verify layout positioning
const tabLayout = stateAfterMutation.character.layouts[activeTabId];
const originalLayoutItem = tabLayout.find((item) => item.i === originalBlockId);
const dupLayoutItem = tabLayout.find((item) => item.i === duplicatedBlockId);
assert(Boolean(originalLayoutItem), "Original layout item must exist");
assert(Boolean(dupLayoutItem), "Duplicate layout item must exist in layout");
assert(dupLayoutItem!.w === originalLayoutItem!.w, "Width should match original");
assert(dupLayoutItem!.h === originalLayoutItem!.h, "Height should match original");

console.log("✓ Block duplication tests passed!");

// 3. Store Tag Suggestions Settings Tests
console.log("3. Testing Tag Suggestions Store Setting...");
assert(useCharacterStore.getState().enableTagSuggestions === true, "enableTagSuggestions should default to true");
useCharacterStore.getState().setEnableTagSuggestions(false);
assert(useCharacterStore.getState().enableTagSuggestions === false, "setEnableTagSuggestions(false) should update state");
useCharacterStore.getState().setEnableTagSuggestions(true);
assert(useCharacterStore.getState().enableTagSuggestions === true, "setEnableTagSuggestions(true) should restore state");
console.log("✓ Store tag suggestions setting tests passed!");

// 4. Omnisearch Data Coverage Simulation
console.log("4. Testing Omnisearch Data Coverage Simulation...");
const char = useCharacterStore.getState().character;

// Check that every block in every layout can be found
let indexedBlockCount = 0;
for (const [tId, layout] of Object.entries(char.layouts)) {
  const tab = char.tabs.find((t) => t.id === tId);
  for (const item of layout) {
    const b = char.blocks[item.i];
    if (b) {
      indexedBlockCount++;
      assert(Boolean(tab?.label), "Tab label should be resolvable for block search result");
      assert(typeof b.title === "string", "Block title should be indexed");
    }
  }
}
assert(indexedBlockCount > 0, "At least one block should be indexed");

// Clean up test blocks
useCharacterStore.getState().deleteBlock(originalBlockId!);
useCharacterStore.getState().deleteBlock(duplicatedBlockId!);

console.log("✓ Omnisearch indexing coverage simulation passed!");
console.log("All Phase 9 verification tests passed successfully!");
