import { CharacterSchema } from "../types/schema";
import type { GlobalTheme } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { resolveBlockStyle, resolveCanvasPattern, resolvePreviewStyle } from "../styles/resolveStyle";
import {
  getPattern,
  getTexture,
  isKnownPattern,
  isKnownTexture,
  listPatterns,
  listTextures,
  renderPattern,
} from "../styles/patterns";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log("=== Running Phase 14 (Style Phase 2: Patterns & Textures) Verification Suite ===");

const base = createDefaultCharacter();
const theme: GlobalTheme = base.theme;

// ---- Test 1: Pattern Registry ----
console.log("\n--- Test 1: Pattern Registry ---");
const patterns = listPatterns();
assert(patterns.length >= 8, "Registry contains at least 8 patterns (none + 7 designs)");
assert(isKnownPattern("dots") && isKnownPattern("grid") && isKnownPattern("hex-mesh"), "Known patterns recognized");
assert(!isKnownPattern("nonexistent-pattern"), "Unknown pattern correctly rejected");
assert(getPattern("nonexistent").id === "none", "Unknown pattern falls back to 'none'");

const gridLayer = renderPattern("grid", { color: "#00f0ff", opacity: 0.5, scale: 1 });
assert(!!gridLayer && gridLayer.image.includes("linear-gradient"), "Cyber Grid renders linear-gradient image");
assert(Boolean(gridLayer?.size.includes("28px")), "Cyber Grid default scale renders 28px tiles");

const noneLayer = renderPattern("none", { color: "#00f0ff", opacity: 0.5, scale: 1 });
assert(noneLayer === undefined, "Pattern 'none' returns undefined");

// ---- Test 2: Card Texture Registry ----
console.log("\n--- Test 2: Texture Registry ---");
const textures = listTextures();
assert(textures.length >= 5, "Registry contains at least 5 textures (none + 4 designs)");
assert(isKnownTexture("glass") && isKnownTexture("carbon") && isKnownTexture("grain"), "Known textures recognized");

const glassTex = getTexture("glass");
assert(glassTex.className === "texture-glass", "Glass texture assigns .texture-glass class");
assert(glassTex.translucentBg === 0.55, "Glass texture specifies default translucent background");
assert(!!glassTex.shadow && glassTex.shadow.includes("inset"), "Glass texture adds highlight inset shadow");

// ---- Test 3: Card-Level Pattern & Texture Cascade ----
console.log("\n--- Test 3: Card-Level Pattern & Texture Cascade ---");
const themeWithPattern: GlobalTheme = {
  ...theme,
  defaultPattern: "dots",
  defaultTexture: "carbon",
};

// Card with no overrides inherits theme pattern and texture
const cardDefault = resolveBlockStyle(undefined, themeWithPattern);
assert(String(cardDefault.style.backgroundImage).includes("radial-gradient"), "Card inherits default pattern");
assert(String(cardDefault.style.backgroundImage).includes("repeating-linear-gradient"), "Card inherits default texture");

// Card overrides pattern with another pattern
const cardCustom = resolveBlockStyle({ pattern: "grid" }, themeWithPattern);
assert(String(cardCustom.style.backgroundSize).includes("28px"), "Card overrides default pattern with custom pattern");

// Card overrides pattern with 'none'
const cardNone = resolveBlockStyle({ pattern: "none" }, themeWithPattern);
assert(!String(cardNone.style.backgroundImage).includes("radial-gradient"), "Card pattern 'none' disables pattern");
assert(String(cardNone.style.backgroundImage).includes("repeating-linear-gradient"), "Card still keeps texture");

// Card with glass texture receives class and translucent bg
const cardGlass = resolveBlockStyle({ texture: "glass" }, theme);
assert(cardGlass.className.includes("texture-glass"), "Glass card has texture-glass class");
assert(String(cardGlass.style.backgroundColor).includes("color-mix"), "Glass card uses translucent background");
assert(String(cardGlass.style.backgroundColor).includes("55%"), "Glass card defaults to 55% opacity");

// Card with explicit backgroundOpacity overrides texture translucentBg
const cardGlassOpaque = resolveBlockStyle({ texture: "glass", backgroundOpacity: 0.8 }, theme);
assert(String(cardGlassOpaque.style.backgroundColor).includes("80%"), "Card explicit opacity overrides glass default");

// ---- Test 4: Readability Scrim ----
console.log("\n--- Test 4: Readability Scrim ---");
const cardNoScrim = resolveBlockStyle({ backgroundUrl: "https://example.com/bg.png" }, theme);
assert(!String(cardNoScrim.style.backgroundImage).includes("rgba(0, 0, 0, 0.45)"), "Card without scrim has no dark scrim layer");

const cardWithScrim = resolveBlockStyle({ backgroundUrl: "https://example.com/bg.png", scrim: true }, theme);
const bgImgs = String(cardWithScrim.style.backgroundImage);
assert(bgImgs.startsWith("linear-gradient(rgba(0, 0, 0, 0.45)"), "Scrim layer is rendered as the topmost background layer");

const themeWithScrim: GlobalTheme = { ...theme, defaultScrim: true };
const cardInheritScrim = resolveBlockStyle(undefined, themeWithScrim);
assert(String(cardInheritScrim.style.backgroundImage).includes("rgba(0, 0, 0, 0.45)"), "Card inherits sheet default scrim");

const cardDisableScrim = resolveBlockStyle({ scrim: false }, themeWithScrim);
assert(!String(cardDisableScrim.style.backgroundImage).includes("rgba(0, 0, 0, 0.45)"), "Card scrim=false disables inherited scrim");

// ---- Test 5: Canvas Pattern Resolution ----
console.log("\n--- Test 5: Canvas Pattern Resolution ---");
const canvasNone = resolveCanvasPattern(theme);
assert(canvasNone === undefined, "Default theme has no canvas pattern");

const canvasGridTheme: GlobalTheme = {
  ...theme,
  canvasPattern: "grid",
  canvasPatternOpacity: 0.8,
  canvasPatternScale: 1.5,
};
const canvasGrid = resolveCanvasPattern(canvasGridTheme);
assert(!!canvasGrid && canvasGrid.image.includes("linear-gradient"), "Canvas pattern resolves image");
assert(Boolean(canvasGrid?.size.includes("42px")), "Canvas pattern scales tile size with canvasPatternScale (28 * 1.5 = 42px)");

// Unknown canvas pattern returns undefined
const canvasBad = resolveCanvasPattern({ ...theme, canvasPattern: "unknown-pattern" });
assert(canvasBad === undefined, "Unknown canvas pattern returns undefined");

// ---- Test 6: Preview Style Resolution ----
console.log("\n--- Test 6: Preview Style Resolution ---");
const previewPat = resolvePreviewStyle({ pattern: "hex-mesh" }, themeWithPattern);
// Should not inherit carbon texture because preview resets theme defaults
assert(!String(previewPat.style.backgroundImage).includes("repeating-linear-gradient"), "Preview resets default texture");
assert(String(previewPat.style.backgroundImage).includes("data:image/svg+xml"), "Preview renders hex-mesh SVG pattern");

// ---- Test 7: Schema Validation ----
console.log("\n--- Test 7: Schema Validation ---");
const withP2Tokens = JSON.parse(JSON.stringify(base));
withP2Tokens.theme.canvasPattern = "hex-mesh";
withP2Tokens.theme.canvasPatternOpacity = 0.4;
withP2Tokens.theme.canvasPatternScale = 1.25;
withP2Tokens.theme.defaultTexture = "grain";
withP2Tokens.theme.defaultPattern = "dots";
withP2Tokens.theme.cardPatternOpacity = 0.6;
withP2Tokens.theme.defaultScrim = true;

const firstId = Object.keys(withP2Tokens.blocks)[0];
withP2Tokens.blocks[firstId].style = {
  texture: "glass",
  pattern: "blueprint",
  scrim: false,
};

const parseRes = CharacterSchema.safeParse(withP2Tokens);
assert(parseRes.success, "Character with Phase 2 tokens validates successfully");
if (parseRes.success) {
  assert(parseRes.data.theme.canvasPattern === "hex-mesh", "canvasPattern preserved");
  assert(parseRes.data.theme.defaultTexture === "grain", "defaultTexture preserved");
  assert(parseRes.data.theme.defaultScrim === true, "defaultScrim preserved");
  assert(parseRes.data.blocks[firstId].style?.texture === "glass", "block texture preserved");
  assert(parseRes.data.blocks[firstId].style?.pattern === "blueprint", "block pattern preserved");
  assert(parseRes.data.blocks[firstId].style?.scrim === false, "block scrim preserved");
}

// Out of bounds canvasPatternScale
const badScale = JSON.parse(JSON.stringify(withP2Tokens));
badScale.theme.canvasPatternScale = 10;
assert(!CharacterSchema.safeParse(badScale).success, "Out-of-bounds canvasPatternScale is rejected");

// ---- Test 8: Store Bulk Clear ----
console.log("\n--- Test 8: Store Bulk Clear Overrides ---");
const store = useCharacterStore.getState();
store.importCharacter(createDefaultCharacter());
const ids = Object.keys(useCharacterStore.getState().character.blocks);
const [cardA, cardB] = ids;

store.updateBlockStyle(cardA, { texture: "glass", pattern: "grid", scrim: true, frame: "gold" });
store.updateBlockStyle(cardB, { texture: "carbon", pattern: "dots" });

store.clearBlockStyleOverrides(["texture", "pattern", "scrim"]);
const afterClear = useCharacterStore.getState().character.blocks;
assert(!afterClear[cardA].style?.texture && !afterClear[cardA].style?.pattern && afterClear[cardA].style?.scrim === undefined, "Cleared texture, pattern, scrim on card A");
assert(afterClear[cardA].style?.frame === "gold", "Preserved un-cleared frame on card A");
assert(!afterClear[cardB].style?.texture && !afterClear[cardB].style?.pattern, "Cleared texture and pattern on card B");

console.log("\n=== All Phase 14 tests passed ===");
