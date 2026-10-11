import { useCharacterStore } from "../store/useCharacterStore";
import { createDefaultCharacter } from "../store/fixtures";
import {
  STYLE_PACKS,
  getStylePack,
  isKnownStylePack,
  listStylePacks,
  buildThemeFromPack,
} from "../styles/stylePacks";
import {
  isKnownFrame,
  isKnownCorner,
  isKnownShape,
  isKnownShading,
  isKnownWatermark,
  isKnownDivider,
} from "../styles/registry";
import { isKnownTexture, isKnownPattern } from "../styles/patterns";
import { THEME_PRESETS } from "../components/ThemeDrawer";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log("=== RUNNING PHASE 17 (STYLE PHASE 4: STYLE PACKS) TESTS ===\n");

// -----------------------------------------------------------------------------
// 1. Registry & Pack Definitions
// -----------------------------------------------------------------------------
console.log("--- 1. Registry & Pack Definitions ---");

const allPacks = listStylePacks();
assert(allPacks.length >= 8, `At least 8 curated style packs registered (found ${allPacks.length})`);
assert(STYLE_PACKS.length === allPacks.length, "STYLE_PACKS array matches listStylePacks()");

for (const pack of allPacks) {
  assert(isKnownStylePack(pack.id), `Pack '${pack.name}' (${pack.id}) recognized by isKnownStylePack`);
  assert(getStylePack(pack.id)?.name === pack.name, `getStylePack('${pack.id}') returns pack`);
  assert(!!pack.description && pack.description.length > 5, `Pack '${pack.id}' has descriptive flavor text`);
  assert(!!pack.fontHeading && !!pack.fontBody, `Pack '${pack.id}' defines heading and body typography`);

  // Verify colors
  assert(/^#[0-9A-Fa-f]{6}$/.test(pack.colors.canvasBackground), `Pack '${pack.id}' canvasBackground is valid hex`);
  assert(/^#[0-9A-Fa-f]{6}$/.test(pack.colors.cardBackground), `Pack '${pack.id}' cardBackground is valid hex`);
  assert(/^#[0-9A-Fa-f]{6}$/.test(pack.colors.borderColor), `Pack '${pack.id}' borderColor is valid hex`);
  assert(/^#[0-9A-Fa-f]{6}$/.test(pack.colors.accentColor), `Pack '${pack.id}' accentColor is valid hex`);

  // Verify all declared tokens match known registries
  if (pack.tokens.defaultFrame) {
    assert(isKnownFrame(pack.tokens.defaultFrame), `Pack '${pack.id}' frame '${pack.tokens.defaultFrame}' exists`);
  }
  if (pack.tokens.defaultCorners && pack.tokens.defaultCorners !== "none") {
    assert(isKnownCorner(pack.tokens.defaultCorners), `Pack '${pack.id}' corners '${pack.tokens.defaultCorners}' exists`);
  }
  if (pack.tokens.defaultShape) {
    assert(isKnownShape(pack.tokens.defaultShape), `Pack '${pack.id}' shape '${pack.tokens.defaultShape}' exists`);
  }
  if (pack.tokens.defaultShading && pack.tokens.defaultShading !== "none") {
    assert(isKnownShading(pack.tokens.defaultShading), `Pack '${pack.id}' shading '${pack.tokens.defaultShading}' exists`);
  }
  if (pack.tokens.defaultTexture && pack.tokens.defaultTexture !== "none") {
    assert(isKnownTexture(pack.tokens.defaultTexture), `Pack '${pack.id}' texture '${pack.tokens.defaultTexture}' exists`);
  }
  if (pack.tokens.defaultPattern && pack.tokens.defaultPattern !== "none") {
    assert(isKnownPattern(pack.tokens.defaultPattern), `Pack '${pack.id}' card pattern '${pack.tokens.defaultPattern}' exists`);
  }
  if (pack.tokens.canvasPattern && pack.tokens.canvasPattern !== "none") {
    assert(isKnownPattern(pack.tokens.canvasPattern), `Pack '${pack.id}' canvas pattern '${pack.tokens.canvasPattern}' exists`);
  }
  if (pack.tokens.defaultWatermark && pack.tokens.defaultWatermark !== "none") {
    assert(isKnownWatermark(pack.tokens.defaultWatermark), `Pack '${pack.id}' watermark '${pack.tokens.defaultWatermark}' exists`);
  }
  if (pack.tokens.canvasWatermark && pack.tokens.canvasWatermark !== "none") {
    assert(isKnownWatermark(pack.tokens.canvasWatermark), `Pack '${pack.id}' canvas watermark '${pack.tokens.canvasWatermark}' exists`);
  }
  if (pack.tokens.defaultHeaderDivider) {
    assert(isKnownDivider(pack.tokens.defaultHeaderDivider), `Pack '${pack.id}' divider '${pack.tokens.defaultHeaderDivider}' exists`);
  }
}

// -----------------------------------------------------------------------------
// 2. buildThemeFromPack: Full vs Color-Preserved
// -----------------------------------------------------------------------------
console.log("\n--- 2. buildThemeFromPack Logic ---");

const fantasyPack = getStylePack("fantasy-parchment")!;
const cyberpunkPack = getStylePack("cyberpunk-neon")!;

// Full apply
const fullFantasyTheme = buildThemeFromPack(fantasyPack);
assert(fullFantasyTheme.canvasBackground === fantasyPack.colors.canvasBackground, "Full theme uses pack canvas color");
assert(fullFantasyTheme.cardBackground === fantasyPack.colors.cardBackground, "Full theme uses pack card color");
assert(fullFantasyTheme.accentColor === fantasyPack.colors.accentColor, "Full theme uses pack accent color");
assert(fullFantasyTheme.fontHeading === fantasyPack.fontHeading, "Full theme uses pack heading font");
assert(fullFantasyTheme.defaultFrame === "filigree", "Full theme has filigree defaultFrame");
assert(fullFantasyTheme.packId === "fantasy-parchment", "Full theme records packId");

// Non-destructive "Keep My Custom Colors"
const customColors = {
  canvasBackground: "#112233",
  cardBackground: "#445566",
  borderColor: "#778899",
  accentColor: "#ff00ff",
  tagColors: { "#magic": "#aa00aa" },
};
const baseTheme = {
  ...fullFantasyTheme,
  ...customColors,
};

const preservedTheme = buildThemeFromPack(cyberpunkPack, baseTheme, { keepColors: true });
assert(preservedTheme.canvasBackground === "#112233", "KeepColors preserves custom canvasBackground");
assert(preservedTheme.cardBackground === "#445566", "KeepColors preserves custom cardBackground");
assert(preservedTheme.borderColor === "#778899", "KeepColors preserves custom borderColor");
assert(preservedTheme.accentColor === "#ff00ff", "KeepColors preserves custom accentColor");
assert(preservedTheme.tagColors?.["#magic"] === "#aa00aa", "KeepColors preserves tagColors");
// But updates tokens and fonts
assert(preservedTheme.fontHeading === cyberpunkPack.fontHeading, "KeepColors updates heading font to Orbitron");
assert(preservedTheme.fontBody === cyberpunkPack.fontBody, "KeepColors updates body font to Share Tech Mono");
assert(preservedTheme.defaultFrame === "circuit-edge", "KeepColors updates defaultFrame to circuit-edge");
assert(preservedTheme.defaultCorners === "tech", "KeepColors updates defaultCorners to tech");
assert(preservedTheme.defaultWatermark === "biohazard", "KeepColors updates defaultWatermark to biohazard");
assert(preservedTheme.packId === "cyberpunk-neon", "KeepColors records packId");

// -----------------------------------------------------------------------------
// 3. Store Integration: applyStylePack
// -----------------------------------------------------------------------------
console.log("\n--- 3. Store applyStylePack Action ---");

const store = useCharacterStore.getState();
const testChar = createDefaultCharacter();
store.importCharacter(testChar);

// Add a test card with style overrides
const activeTab = useCharacterStore.getState().character.activeTabId;
store.addBlock(activeTab, "card", {
  badge: "Overridden Card",
  markdown: "This card has its own custom frame override.",
});

const blocks = useCharacterStore.getState().character.blocks;
const cardId = Object.keys(blocks).find((id) => blocks[id].type === "card" && (blocks[id].data as { badge?: string }).badge === "Overridden Card")!;
assert(!!cardId, "Found test card");

store.updateBlockStyle(cardId, {
  frame: "thorn-vine",
  texture: "scanlines",
});
assert(useCharacterStore.getState().character.blocks[cardId].style?.frame === "thorn-vine", "Card frame overridden to thorn-vine");

// 3a. Apply pack with resetCardOverrides: false
store.applyStylePack("gothic-horror", { keepColors: false, resetCardOverrides: false });
let state = useCharacterStore.getState();
assert(state.character.theme.packId === "gothic-horror", "Theme packId set to gothic-horror");
assert(state.character.theme.defaultFrame === "thorn-vine", "Theme defaultFrame is thorn-vine");
assert(state.character.blocks[cardId].style?.frame === "thorn-vine", "Card override preserved when resetCardOverrides: false");

// 3b. Apply pack with resetCardOverrides: true
store.applyStylePack("celestial-arcane", { keepColors: false, resetCardOverrides: true });
state = useCharacterStore.getState();
assert(state.character.theme.packId === "celestial-arcane", "Theme packId set to celestial-arcane");
assert(state.character.theme.defaultFrame === "celestial", "Theme defaultFrame is celestial");
assert(state.character.blocks[cardId].style?.frame === undefined, "Card override cleared when resetCardOverrides: true");
assert((state.character.blocks[cardId].data as { badge?: string }).badge === "Overridden Card", "Card data and badge intact after reset");

// -----------------------------------------------------------------------------
// 4. Undo / Redo of Style Pack Application
// -----------------------------------------------------------------------------
console.log("\n--- 4. Undo / Redo Integration ---");

const preUndoPackId = useCharacterStore.getState().character.theme.packId;
assert(preUndoPackId === "celestial-arcane", "Before undo, active pack is celestial-arcane");

store.undo();
state = useCharacterStore.getState();
assert(state.character.theme.packId === "gothic-horror", "Undo restores previous pack (gothic-horror)");
assert(state.character.blocks[cardId].style?.frame === "thorn-vine", "Undo restores block-level style overrides");

store.redo();
state = useCharacterStore.getState();
assert(state.character.theme.packId === "celestial-arcane", "Redo restores celestial-arcane");
assert(state.character.blocks[cardId].style?.frame === undefined, "Redo re-clears block-level overrides");

// -----------------------------------------------------------------------------
// 5. Backwards Compatibility with Presets
// -----------------------------------------------------------------------------
console.log("\n--- 5. Backwards Compatibility with THEME_PRESETS ---");

assert(THEME_PRESETS.length >= 5, "THEME_PRESETS still available for basic color presets");
store.setGlobalTheme(THEME_PRESETS[1].theme);
state = useCharacterStore.getState();
assert(state.character.theme.accentColor === THEME_PRESETS[1].theme.accentColor, "setGlobalTheme with preset applies colors cleanly");

console.log("\n🎉 ALL PHASE 17 (STYLE PACKS) TESTS PASSED SUCCESSFULLY! 🎉\n");
