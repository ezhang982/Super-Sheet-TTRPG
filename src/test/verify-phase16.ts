import { CharacterSchema } from "../types/schema";
import type { GlobalTheme } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { resolveBlockStyle, resolveCanvasWatermark, resolvePreviewStyle } from "../styles/resolveStyle";
import {
  DEFAULT_CANVAS_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_OPACITY,
  getDivider,
  getWatermark,
  isKnownDivider,
  isKnownWatermark,
  listDividers,
  listWatermarks,
  renderDividerDecalSvg,
  renderWatermarkLayer,
  renderWatermarkSvg,
} from "../styles/registry";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

console.log("=== Running Phase 16 (Style Phase 3b: Watermarks & Decals) Verification Suite ===");

const base = createDefaultCharacter();
const theme: GlobalTheme = base.theme;

// ---- Test 1: Watermark Registry & Starter Emblems ----
console.log("\n--- Test 1: Watermark Registry & Starter Emblems ---");
const watermarks = listWatermarks();
assert(watermarks.length >= 8, `Registry contains at least 8 watermarks (actual: ${watermarks.length})`);

// 5 Specified starter emblems
assert(DEFAULT_WATERMARK_OPACITY === 0.1, "DEFAULT_WATERMARK_OPACITY is 0.1");
assert(DEFAULT_CANVAS_WATERMARK_OPACITY === 0.05, "DEFAULT_CANVAS_WATERMARK_OPACITY is 0.05");
assert(isKnownWatermark("d20"), "Watermark 'd20' recognized");
assert(isKnownWatermark("crest"), "Watermark 'crest' recognized");
assert(isKnownWatermark("arcane-circle"), "Watermark 'arcane-circle' recognized");
assert(isKnownWatermark("biohazard"), "Watermark 'biohazard' recognized");
assert(isKnownWatermark("dragon"), "Watermark 'dragon' recognized");

// Alias and additional emblems
assert(isKnownWatermark("rune-circle"), "Watermark alias 'rune-circle' recognized");
assert(getWatermark("rune-circle").svgTemplate === getWatermark("arcane-circle").svgTemplate, "Alias 'rune-circle' maps to arcane-circle template");
assert(isKnownWatermark("skull"), "Watermark 'skull' recognized");
assert(isKnownWatermark("compass"), "Watermark 'compass' recognized");
assert(isKnownWatermark("none"), "Watermark 'none' recognized");

// Fallback behavior
assert(!isKnownWatermark("unknown-wm-xyz"), "Unknown watermark rejected");
assert(getWatermark("unknown-wm-xyz").id === "none", "Unknown watermark falls back to 'none'");

// ---- Test 2: Watermark SVG Generation & Tinting ----
console.log("\n--- Test 2: Watermark SVG Generation & Tinting ---");
const d20SvgUri = renderWatermarkSvg("d20", "#e74c3c", 0.18);
assert(typeof d20SvgUri === "string", "renderWatermarkSvg produces string URI");
assert(d20SvgUri!.startsWith("data:image/svg+xml,"), "URI has data:image/svg+xml header");

const decodedD20 = decodeURIComponent(d20SvgUri!.slice("data:image/svg+xml,".length));
assert(!decodedD20.includes("{{COLOR}}"), "No unreplaced {{COLOR}} placeholder in output SVG");
assert(decodedD20.includes("#e74c3c"), "Injected literal theme color into SVG");
assert(decodedD20.includes('opacity="0.18"'), "Injected opacity attribute into root SVG");

// "none" produces undefined
assert(renderWatermarkSvg("none", "#ffffff") === undefined, "Watermark 'none' returns undefined SVG URI");

// ---- Test 3: Watermark Layer & Position Controls ----
console.log("\n--- Test 3: Watermark Layer & Position Controls ---");
const wmLayerCenter = renderWatermarkLayer("crest", {
  color: "#3498db",
  opacity: 0.12,
  position: "center",
});
assert(!!wmLayerCenter, "Watermark layer generated");
assert(wmLayerCenter!.repeat === "no-repeat", "Watermark repeat set to no-repeat");
assert(wmLayerCenter!.position === "center center", "Center position mapped correctly");

const wmLayerBR = renderWatermarkLayer("dragon", {
  color: "#2ecc71",
  position: "bottom-right",
});
assert(Boolean(wmLayerBR?.position && wmLayerBR.position.includes("calc(100% - 16px)")), "Bottom-right position offset correctly mapped");

const wmLayerNone = renderWatermarkLayer("none", { color: "#ffffff" });
assert(wmLayerNone === undefined, "Layer for 'none' is undefined");

// ---- Test 4: Header Divider & Decals Registry ----
console.log("\n--- Test 4: Header Divider & Decals Registry ---");
const dividers = listDividers();
assert(dividers.length >= 8, `Registry contains at least 8 dividers (actual: ${dividers.length})`);

assert(isKnownDivider("default"), "Divider 'default' recognized");
assert(isKnownDivider("fade"), "Divider 'fade' recognized");
assert(isKnownDivider("none"), "Divider 'none' recognized");
assert(isKnownDivider("flourish"), "Fantasy divider 'flourish' recognized");
assert(isKnownDivider("celtic"), "Classic divider 'celtic' recognized");
assert(isKnownDivider("tech"), "Sci-Fi divider 'tech' recognized");
assert(isKnownDivider("gothic"), "Gothic divider 'gothic' recognized");
assert(isKnownDivider("gem"), "Celestial divider 'gem' recognized");
assert(isKnownDivider("runes"), "Runic divider 'runes' recognized");

// Fallback behavior
assert(!isKnownDivider("mystery-divider-xyz"), "Unknown divider rejected");
assert(getDivider("mystery-divider-xyz").id === "default", "Unknown divider falls back to 'default'");

// Decal SVG rendering with color and accent
const flourishDecal = renderDividerDecalSvg("flourish", "#34495e", "#e67e22");
assert(typeof flourishDecal === "string", "renderDividerDecalSvg produces decal SVG");
assert(!flourishDecal!.includes("{{COLOR}}"), "No unreplaced {{COLOR}} in decal");
assert(!flourishDecal!.includes("{{ACCENT}}"), "No unreplaced {{ACCENT}} in decal");
assert(flourishDecal!.includes("#34495e"), "Color injected into decal SVG");
assert(flourishDecal!.includes("#e67e22"), "Accent injected into decal SVG");

// Line and none types return undefined for decal SVG
assert(renderDividerDecalSvg("default", "#ffffff") === undefined, "Line divider returns undefined decal SVG");
assert(renderDividerDecalSvg("none", "#ffffff") === undefined, "None divider returns undefined decal SVG");

// ---- Test 5: Style Cascade & Layer Stacking Order ----
console.log("\n--- Test 5: Style Cascade & Layer Stacking Order ---");
const themeWithDefaults: GlobalTheme = {
  ...theme,
  defaultWatermark: "d20",
  watermarkOpacity: 0.15,
  defaultWatermarkPosition: "bottom-right",
  defaultHeaderDivider: "flourish",
};

// 5a. Card inherits sheet default watermark and divider
const inheritedCard = resolveBlockStyle(undefined, themeWithDefaults);
assert(inheritedCard.dividerId === "flourish", "Card inherits sheet default divider 'flourish'");
const inheritedBg = String(inheritedCard.style.backgroundImage || "");
assert(inheritedBg.includes("data:image/svg+xml"), "Card background inherits watermark SVG");
assert(String(inheritedCard.style.backgroundPosition || "").includes("calc(100% - 16px)"), "Card background inherits bottom-right position");

// 5b. Card overrides watermark and divider
const overriddenCard = resolveBlockStyle(
  {
    watermark: "biohazard",
    watermarkOpacity: 0.25,
    watermarkPosition: "center",
    headerDivider: "tech",
  },
  themeWithDefaults
);
assert(overriddenCard.dividerId === "tech", "Card overrides divider to 'tech'");
assert(String(overriddenCard.style.backgroundPosition || "").includes("center"), "Card overrides position to center");

// 5c. Card disables watermark with "none"
const noWatermarkCard = resolveBlockStyle({ watermark: "none" }, themeWithDefaults);
assert(!String(noWatermarkCard.style.backgroundImage || "").includes("data:image/svg+xml"), "watermark: 'none' removes watermark from card");

// 5d. Card disables divider with "none"
const noDividerCard = resolveBlockStyle({ headerDivider: "none" }, themeWithDefaults);
assert(noDividerCard.dividerId === "none", "headerDivider: 'none' sets dividerId to 'none'");

// 5e. Layer stacking verification: Watermark (Layer 5) sits above backgroundUrl (Layer 4)
const layeredCard = resolveBlockStyle(
  {
    backgroundUrl: "https://example.com/art.png",
    watermark: "d20",
    scrim: true,
  },
  theme
);
const bgStr = String(layeredCard.style.backgroundImage || "");
const scrimIdx = bgStr.indexOf("rgba(0, 0, 0, 0.45)");
const wmIdx = bgStr.indexOf("data:image/svg+xml");
const urlIdx = bgStr.indexOf("https://example.com/art.png");
assert(scrimIdx !== -1 && wmIdx !== -1 && urlIdx !== -1, "All 3 layers present in backgroundImage");
assert(scrimIdx < wmIdx, "Scrim is rendered above watermark (Layer 5)");
assert(wmIdx < urlIdx, "Watermark is rendered above backgroundUrl (Layer 4)");

// ---- Test 6: Canvas Watermark Resolution ----
console.log("\n--- Test 6: Canvas Watermark Resolution ---");
const canvasTheme: GlobalTheme = {
  ...theme,
  canvasWatermark: "arcane-circle",
  canvasWatermarkOpacity: 0.08,
  canvasWatermarkPosition: "center",
  canvasWatermarkScale: 1.25,
};

const canvasWatermark = resolveCanvasWatermark(canvasTheme);
assert(!!canvasWatermark, "resolveCanvasWatermark returns object when enabled");
assert(canvasWatermark!.image.startsWith('url("data:image/svg+xml,'), "Canvas watermark image is SVG data URI");
assert(canvasWatermark!.attachment === "fixed", "Canvas watermark attachment is fixed");
assert(canvasWatermark!.position === "center center", "Canvas watermark position is center center");
assert(canvasWatermark!.size.includes("px"), "Canvas watermark size computed with scale");

// Canvas watermark disabled
const canvasNone = resolveCanvasWatermark({ ...theme, canvasWatermark: "none" });
assert(canvasNone === undefined, "canvasWatermark: 'none' returns undefined");
const canvasUnset = resolveCanvasWatermark(theme);
assert(canvasUnset === undefined, "unset canvasWatermark returns undefined");

// ---- Test 7: Preview Style Isolation ----
console.log("\n--- Test 7: Preview Style Isolation ---");
const preview = resolvePreviewStyle({ watermark: "dragon", headerDivider: "gem" }, themeWithDefaults);
assert(preview.dividerId === "gem", "Preview resolves specific divider");
const previewBg = String(preview.style.backgroundImage || "");
assert(previewBg.includes("data:image/svg+xml"), "Preview includes watermark");

// ---- Test 8: Schema Validation & Round-Trip ----
console.log("\n--- Test 8: Schema Validation & Round-Trip ---");
const fullPhase3bChar = {
  ...base,
  theme: {
    ...theme,
    defaultWatermark: "d20",
    watermarkOpacity: 0.12,
    defaultWatermarkPosition: "bottom-right",
    canvasWatermark: "crest",
    canvasWatermarkOpacity: 0.06,
    canvasWatermarkPosition: "center",
    canvasWatermarkScale: 1.5,
    defaultHeaderDivider: "flourish",
  },
  blocks: {
    ...base.blocks,
    [Object.keys(base.blocks)[0]]: {
      ...base.blocks[Object.keys(base.blocks)[0]],
      style: {
        ...base.blocks[Object.keys(base.blocks)[0]].style,
        watermark: "dragon",
        watermarkOpacity: 0.2,
        watermarkPosition: "top-right",
        headerDivider: "tech",
      },
    },
  },
};

const parsed = CharacterSchema.parse(fullPhase3bChar);
assert(parsed.theme.defaultWatermark === "d20", "Schema parses theme.defaultWatermark");
assert(parsed.theme.canvasWatermark === "crest", "Schema parses theme.canvasWatermark");
assert(parsed.theme.defaultHeaderDivider === "flourish", "Schema parses theme.defaultHeaderDivider");
const firstBlockId = Object.keys(parsed.blocks)[0];
assert(parsed.blocks[firstBlockId].style?.watermark === "dragon", "Schema parses block.style.watermark");
assert(parsed.blocks[firstBlockId].style?.watermarkPosition === "top-right", "Schema parses block.style.watermarkPosition");
assert(parsed.blocks[firstBlockId].style?.headerDivider === "tech", "Schema parses block.style.headerDivider");

// ---- Test 9: Store Bulk Clear Overrides ----
console.log("\n--- Test 9: Store Bulk Clear Overrides ---");
const store = useCharacterStore.getState();
store.updateBlockStyle(firstBlockId, {
  watermark: "skull",
  watermarkOpacity: 0.3,
  watermarkPosition: "bottom-left",
  headerDivider: "gothic",
});

let testBlock = useCharacterStore.getState().character.blocks[firstBlockId];
assert(testBlock.style?.watermark === "skull", "Block has watermark override initially");
assert(testBlock.style?.headerDivider === "gothic", "Block has headerDivider override initially");

// Bulk clear overrides
store.clearBlockStyleOverrides(["watermark", "watermarkOpacity", "watermarkPosition", "headerDivider"]);
testBlock = useCharacterStore.getState().character.blocks[firstBlockId];
assert(testBlock.style?.watermark === undefined, "Watermark override cleared");
assert(testBlock.style?.watermarkOpacity === undefined, "Watermark opacity override cleared");
assert(testBlock.style?.watermarkPosition === undefined, "Watermark position override cleared");
assert(testBlock.style?.headerDivider === undefined, "Header divider override cleared");

console.log("\n=== All Phase 16 (Style Phase 3b) tests passed! ===");
