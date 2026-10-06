import { CharacterSchema } from "../types/schema";
import type { GlobalTheme } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { resolveBlockStyle, resolvePreviewStyle } from "../styles/resolveStyle";
import {
  getCorner,
  getFrame,
  isKnownCorner,
  isKnownFrame,
  listCorners,
  listFrames,
  renderCornerSvg,
} from "../styles/registry";
import { resolveLiteralColor } from "../styles/svgFrames";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log("=== Running Phase 15 (Style Phase 3: SVG Frame Engine & Corner Accents) Verification Suite ===");

const base = createDefaultCharacter();
const theme: GlobalTheme = base.theme;

// ---- Test 1: Frame Registry & 4 Families ----
console.log("\n--- Test 1: Frame Registry & Categories ---");
const frames = listFrames();
assert(frames.length >= 20, `Registry contains at least 20 frames (actual: ${frames.length})`);

// Fantasy family
assert(isKnownFrame("filigree"), "Fantasy frame 'filigree' recognized");
assert(isKnownFrame("scroll-royal"), "Fantasy frame 'scroll-royal' recognized");
assert(isKnownFrame("runic"), "Fantasy frame 'runic' recognized");
assert(isKnownFrame("celestial"), "Fantasy frame 'celestial' recognized");

// Sci-Fi family
assert(isKnownFrame("tech-brackets"), "Sci-Fi frame 'tech-brackets' recognized");
assert(isKnownFrame("circuit-edge"), "Sci-Fi frame 'circuit-edge' recognized");
assert(isKnownFrame("holo-terminal"), "Sci-Fi frame 'holo-terminal' recognized");

// Gothic family
assert(isKnownFrame("thorn-vine"), "Gothic frame 'thorn-vine' recognized");
assert(isKnownFrame("iron-spikes"), "Gothic frame 'iron-spikes' recognized");
assert(isKnownFrame("bone-crypt"), "Gothic frame 'bone-crypt' recognized");

// Classic family
assert(isKnownFrame("art-deco"), "Classic frame 'art-deco' recognized");
assert(isKnownFrame("victorian"), "Classic frame 'victorian' recognized");
assert(isKnownFrame("celtic"), "Classic frame 'celtic' recognized");

// Unknown frame
assert(!isKnownFrame("invalid-frame-xyz"), "Unknown frame rejected");
assert(getFrame("invalid-frame-xyz").id === "solid", "Unknown frame falls back to 'solid'");

// ---- Test 2: 9-Slice SVG Border Output & Tint Pipeline ----
console.log("\n--- Test 2: 9-Slice SVG Border Output & Tint Pipeline ---");
const customTheme: GlobalTheme = {
  ...theme,
  borderColor: "#2a75d3",
  accentColor: "#f39c12",
};

const filigree = getFrame("filigree").render({
  color: customTheme.borderColor,
  accent: customTheme.accentColor,
  theme: customTheme,
});

assert(filigree.style.borderStyle === "solid", "9-slice frame sets borderStyle to solid");
assert(filigree.style.borderWidth === "16px", "Filigree frame sets 16px borderWidth");
assert(filigree.style.borderImageSlice === "32", "Filigree frame sets 9-slice slice to 32");
assert(filigree.style.borderImageRepeat === "repeat", "Filigree frame sets repeat behavior");
assert(String(filigree.style.borderImageSource).startsWith('url("data:image/svg+xml,'), "Filigree borderImageSource is SVG data URI");

// Tint verification: placeholders replaced with theme colors
const encodedSvg = String(filigree.style.borderImageSource).slice('url("data:image/svg+xml,'.length, -2);
const decodedSvg = decodeURIComponent(encodedSvg);
assert(!decodedSvg.includes("{{COLOR}}"), "No unreplaced {{COLOR}} placeholder in output SVG");
assert(!decodedSvg.includes("{{ACCENT}}"), "No unreplaced {{ACCENT}} placeholder in output SVG");
assert(decodedSvg.includes("#2a75d3"), "Primary border color injected into SVG");
assert(decodedSvg.includes("#f39c12"), "Accent color injected into SVG");

// resolveLiteralColor behavior
assert(resolveLiteralColor("var(--border-color)", "#333333") === "#333333", "resolveLiteralColor replaces CSS var with fallback");
assert(resolveLiteralColor("#abcdef", "#333333") === "#abcdef", "resolveLiteralColor preserves hex color");
assert(resolveLiteralColor(undefined, "#333333") === "#333333", "resolveLiteralColor handles undefined");

// ---- Test 3: Corner Accents Registry ----
console.log("\n--- Test 3: Corner Accents Registry ---");
const corners = listCorners();
assert(corners.length >= 8, `Registry contains at least 8 corner designs (actual: ${corners.length})`);
assert(isKnownCorner("none"), "Corner 'none' recognized");
assert(isKnownCorner("tech"), "Corner 'tech' recognized");
assert(isKnownCorner("filigree"), "Corner 'filigree' recognized");
assert(isKnownCorner("rivets"), "Corner 'rivets' recognized");
assert(isKnownCorner("flourish"), "Corner 'flourish' recognized");
assert(isKnownCorner("runes"), "Corner 'runes' recognized");
assert(isKnownCorner("spikes"), "Corner 'spikes' recognized");
assert(isKnownCorner("gem"), "Corner 'gem' recognized");

assert(!isKnownCorner("fake-corner"), "Unknown corner rejected");
assert(getCorner("fake-corner").id === "none", "Unknown corner falls back to 'none'");

assert(renderCornerSvg("none", "#fff", "#fff") === undefined, "Corner 'none' returns undefined SVG");
const techCornerSvg = renderCornerSvg("tech", "#2a75d3", "#f39c12");
assert(!!techCornerSvg && techCornerSvg.startsWith("data:image/svg+xml,"), "Corner 'tech' returns data URI");
const decodedCorner = decodeURIComponent(techCornerSvg!.slice("data:image/svg+xml,".length));
assert(decodedCorner.includes("#2a75d3") && decodedCorner.includes("#f39c12"), "Corner SVG tinted with theme colors");

// ---- Test 4: Corner Accent Cascade ----
console.log("\n--- Test 4: Corner Accent Cascade ---");
const themeWithCorners: GlobalTheme = {
  ...theme,
  defaultCorners: "tech",
};

// Card with no override inherits default corners
const cardInherit = resolveBlockStyle(undefined, themeWithCorners);
assert(cardInherit.corner !== undefined, "Card inherits sheet default corner");
assert(cardInherit.corner?.id === "tech", "Card inherits 'tech' corner id");
assert(cardInherit.corner?.size === 32, "Corner has expected default size");

// Card overrides with another corner
const cardOverride = resolveBlockStyle({ corners: "rivets" }, themeWithCorners);
assert(cardOverride.corner?.id === "rivets", "Card overrides default corner with 'rivets'");

// Card explicitly turns off corners with "none"
const cardOff = resolveBlockStyle({ corners: "none" }, themeWithCorners);
assert(cardOff.corner === undefined, "Card corners='none' disables corner accents");

// Default theme (no defaultCorners) produces no corner
const cardNoCorners = resolveBlockStyle(undefined, theme);
assert(cardNoCorners.corner === undefined, "Default theme produces no corners");

// ---- Test 5: Dynamic Frame Padding Adjustment ----
console.log("\n--- Test 5: Dynamic Frame Padding Adjustment ---");
const runicStyle = resolveBlockStyle({ frame: "runic" }, theme);
assert(
  (runicStyle.style as Record<string, unknown>)["--frame-pad-x"] === "4px",
  "Runic frame sets --frame-pad-x: 4px for content clearance"
);

// ---- Test 6: Preview Style Isolation ----
console.log("\n--- Test 6: Preview Style Isolation ---");
const preview = resolvePreviewStyle({ corners: "gem" }, themeWithCorners);
assert(preview.corner?.id === "gem", "Preview resolves specific corner design");

// Preview frame resets corners
const previewFrame = resolvePreviewStyle({ frame: "art-deco" }, themeWithCorners);
assert(previewFrame.corner === undefined, "Preview frame resets sheet default corners");

// ---- Test 7: Schema Validation & Round-Trip ----
console.log("\n--- Test 7: Schema Validation & Round-Trip ---");
const charWithPhase3 = JSON.parse(JSON.stringify(base));
charWithPhase3.theme.defaultFrame = "filigree";
charWithPhase3.theme.defaultCorners = "tech";
charWithPhase3.blocks[Object.keys(charWithPhase3.blocks)[0]].style = {
  frame: "circuit-edge",
  corners: "rivets",
};

const parseResult = CharacterSchema.safeParse(charWithPhase3);
assert(parseResult.success, "Character with Phase 3 tokens validates successfully");
if (parseResult.success) {
  assert(parseResult.data.theme.defaultFrame === "filigree", "theme.defaultFrame preserved");
  assert(parseResult.data.theme.defaultCorners === "tech", "theme.defaultCorners preserved");
  const firstBlock = parseResult.data.blocks[Object.keys(parseResult.data.blocks)[0]];
  assert(firstBlock.style?.frame === "circuit-edge", "block.style.frame preserved");
  assert(firstBlock.style?.corners === "rivets", "block.style.corners preserved");
}

// ---- Test 8: Store Bulk Clear Overrides ----
console.log("\n--- Test 8: Store Bulk Clear Overrides ---");
const store = useCharacterStore.getState();
store.importCharacter(createDefaultCharacter());

const bId = Object.keys(useCharacterStore.getState().character.blocks)[0];
store.updateBlockStyle(bId, { frame: "circuit-edge", corners: "rivets" });
assert(useCharacterStore.getState().character.blocks[bId].style?.corners === "rivets", "Card has corners override initially");

store.clearBlockStyleOverrides(["frame", "borderStyle", "corners"]);
const clearedBlock = useCharacterStore.getState().character.blocks[bId];
assert(clearedBlock.style?.corners === undefined, "corners override cleared");
assert(clearedBlock.style?.frame === undefined, "frame override cleared");

console.log("\n=== All Phase 15 tests passed ===");
