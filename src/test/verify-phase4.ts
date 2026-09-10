import { CharacterSchema, type Block } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { THEME_PRESETS } from "../components/ThemeDrawer";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 4 EXPRESSIVE STYLING & POLISH TESTS ===\n");

const store = useCharacterStore.getState();
const defaultChar = createDefaultCharacter();
store.importCharacter(defaultChar);

const activeTab = useCharacterStore.getState().character.activeTabId;

// -----------------------------------------------------------------------------
// 1. Global Theme Customization & Presets
// -----------------------------------------------------------------------------
console.log("--- 1. Global Theme Customization & Presets ---");

// Test default theme
const initialTheme = useCharacterStore.getState().character.theme;
assert(!!initialTheme.canvasBackground, "Initial theme has canvas background");
assert(!!initialTheme.cardBackground, "Initial theme has card background");
assert(!!initialTheme.borderColor, "Initial theme has border color");
assert(!!initialTheme.accentColor, "Initial theme has accent color");

// Test applying each preset
for (const preset of THEME_PRESETS) {
  store.setGlobalTheme(preset.theme);
  const currentTheme = useCharacterStore.getState().character.theme;
  assert(
    currentTheme.accentColor === preset.theme.accentColor &&
      currentTheme.canvasBackground === preset.theme.canvasBackground,
    `Theme preset '${preset.name}' successfully applied`
  );
}

// Test individual theme patch
store.setGlobalTheme({
  accentColor: "#f39c12",
  borderColor: "#d35400",
});
const patchedTheme = useCharacterStore.getState().character.theme;
assert(patchedTheme.accentColor === "#f39c12", "Accent color patched to #f39c12");
assert(patchedTheme.borderColor === "#d35400", "Border color patched to #d35400");

// -----------------------------------------------------------------------------
// 2. Block-Level Style Overrides
// -----------------------------------------------------------------------------
console.log("\n--- 2. Block-Level Style Overrides ---");

store.addBlock(activeTab, "card", {
  badge: "Custom Styled Card",
  description: "A card with custom borders, opacity, and banners.",
});

const blocks = useCharacterStore.getState().character.blocks;
const cardId = Object.keys(blocks).find(
  (id) => blocks[id].type === "card" && blocks[id].title === "New Feature Card"
)!;
assert(!!cardId, "Created test card for styling overrides");

// Test ornate border style
store.updateBlockStyle(cardId, {
  borderStyle: "ornate",
  borderColor: "#ffd700",
  backgroundOpacity: 0.85,
  headerBannerUrl: "https://example.com/banner.png",
  backgroundUrl: "https://example.com/texture.jpg",
});

let styledBlock = useCharacterStore.getState().character.blocks[cardId];
assert(styledBlock.style?.borderStyle === "ornate", "Block borderStyle is 'ornate'");
assert(styledBlock.style?.borderColor === "#ffd700", "Block borderColor is '#ffd700'");
assert(styledBlock.style?.backgroundOpacity === 0.85, "Block backgroundOpacity is 0.85");
assert(styledBlock.style?.headerBannerUrl === "https://example.com/banner.png", "Block headerBannerUrl matches");
assert(styledBlock.style?.backgroundUrl === "https://example.com/texture.jpg", "Block backgroundUrl matches");

// Test resetting style overrides back to empty
store.updateBlockStyle(cardId, {
  borderStyle: undefined,
  borderColor: undefined,
  backgroundOpacity: undefined,
  headerBannerUrl: undefined,
  backgroundUrl: undefined,
});

styledBlock = useCharacterStore.getState().character.blocks[cardId];
assert(
  !styledBlock.style?.borderStyle &&
    !styledBlock.style?.borderColor &&
    styledBlock.style?.backgroundOpacity === undefined,
  "Block style overrides cleanly reset"
);

// -----------------------------------------------------------------------------
// 3. Custom Rest Action Workflow
// -----------------------------------------------------------------------------
console.log("\n--- 3. Custom Rest Actions Engine ---");

// Add tracker tagged with #scene
store.addBlock(activeTab, "tracker", {
  current: 1,
  max: 5,
  temp: 2,
  step: 1,
});
const trackerId = Object.keys(useCharacterStore.getState().character.blocks).find(
  (id) => {
    const b = useCharacterStore.getState().character.blocks[id];
    return b.type === "tracker" && (b as any).data.max === 5;
  }
)!;
store.updateBlockTags(trackerId, ["#scene"]);

// Add custom rest action
const preRestCount = useCharacterStore.getState().restActions.length;
store.addRestAction("Scene Reset", "#scene");
const postRestActions = useCharacterStore.getState().restActions;
assert(postRestActions.length === preRestCount + 1, "Custom rest action 'Scene Reset' added");
const sceneAction = postRestActions.find((a) => a.tag === "#scene")!;

// Execute custom rest
store.applyRest("#scene");
const postSceneTracker = useCharacterStore.getState().character.blocks[trackerId] as Extract<Block, { type: "tracker" }>;
assert(postSceneTracker.data.current === 5, "Tracker reset to max 5 on '#scene' rest");
assert(postSceneTracker.data.temp === 0, "Tracker temp reset to 0 on '#scene' rest");

// Remove custom rest action
store.removeRestAction(sceneAction.id);
assert(
  useCharacterStore.getState().restActions.length === preRestCount,
  "Custom rest action successfully removed"
);

// -----------------------------------------------------------------------------
// 4. Template Export with Styling
// -----------------------------------------------------------------------------
console.log("\n--- 4. Template Export with Custom Styling ---");

// Re-apply style to block
store.updateBlockStyle(cardId, {
  borderStyle: "double",
  borderColor: "#e06c75",
  backgroundOpacity: 0.9,
});

const template = store.exportTemplate();
assert(template.meta.name.includes("(Template)"), "Template name cleanly appended");
assert(template.theme.accentColor === "#f39c12", "Template preserves custom global theme");
const templateCard = template.blocks[cardId];
assert(templateCard.style?.borderStyle === "double", "Template preserves block-level borderStyle");
assert(templateCard.style?.borderColor === "#e06c75", "Template preserves block-level borderColor");

// -----------------------------------------------------------------------------
// 5. Full Schema Validation
// -----------------------------------------------------------------------------
console.log("\n--- 5. Full Schema Validation ---");
const fullCharacter = useCharacterStore.getState().character;
const parsed = CharacterSchema.safeParse(fullCharacter);
assert(parsed.success, "Full character with custom themes and block styles passes CharacterSchema");

console.log("\n🎉 ALL PHASE 4 VERIFICATION TESTS PASSED SUCCESSFULLY!");
