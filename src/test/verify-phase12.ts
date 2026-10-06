import { CharacterSchema, MAX_CUSTOM_ASSETS_PER_CHARACTER, MAX_CUSTOM_SVG_CHARS } from "../types/schema";
import type { BlockStyle, GlobalTheme } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { resolveBlockStyle } from "../styles/resolveStyle";
import { getFrame, isKnownFrame, listFrames } from "../styles/registry";
import { sanitizeSvg } from "../styles/svgSanitizer";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

function runPhase12Tests() {
  console.log("=== Running Phase 12 (Style Foundation) Verification Suite ===");

  const base = createDefaultCharacter();
  const theme: GlobalTheme = base.theme;

  // ---- Test 1: backward compatibility ----
  console.log("\n--- Test 1: Old saves still validate ---");
  const oldParse = CharacterSchema.safeParse(JSON.parse(JSON.stringify(base)));
  assert(oldParse.success, "Existing character (no style tokens/customAssets) validates");
  assert(base.version === "2.0.0", "Schema version unchanged (additive fields only)");

  // ---- Test 2: tokens survive parsing ----
  console.log("\n--- Test 2: New tokens round-trip ---");
  const withTokens = JSON.parse(JSON.stringify(base));
  withTokens.theme.defaultFrame = "filigree"; // unknown to this build -> still valid
  withTokens.theme.canvasPattern = "hex-mesh";
  withTokens.theme.canvasPatternOpacity = 0.25;
  const firstId = Object.keys(withTokens.blocks)[0];
  withTokens.blocks[firstId].style = { frame: "custom:abc123", glow: true, watermark: "d20" };
  const tokParse = CharacterSchema.safeParse(withTokens);
  assert(tokParse.success, "Character with new tokens and unknown ids validates");
  if (tokParse.success) {
    assert(tokParse.data.theme.defaultFrame === "filigree", "theme.defaultFrame preserved");
    assert(tokParse.data.theme.canvasPatternOpacity === 0.25, "theme.canvasPatternOpacity preserved");
    assert(tokParse.data.blocks[firstId].style?.frame === "custom:abc123", "block.style.frame preserved");
    assert(tokParse.data.blocks[firstId].style?.glow === true, "block.style.glow preserved");
  }
  const badOpacity = JSON.parse(JSON.stringify(base));
  badOpacity.theme.canvasPatternOpacity = 2;
  assert(!CharacterSchema.safeParse(badOpacity).success, "Out-of-range pattern opacity is rejected");

  // ---- Test 3: customAssets caps ----
  console.log("\n--- Test 3: customAssets validation ---");
  const asset = (id: string, svg = "<svg/>") => ({ id, kind: "frame", name: "Test", svg });
  const okAssets = JSON.parse(JSON.stringify(base));
  okAssets.customAssets = { a1: asset("a1") };
  assert(CharacterSchema.safeParse(okAssets).success, "Character with one custom asset validates");

  const bigSvg = JSON.parse(JSON.stringify(base));
  bigSvg.customAssets = { big: asset("big", "x".repeat(MAX_CUSTOM_SVG_CHARS + 1)) };
  assert(!CharacterSchema.safeParse(bigSvg).success, "Oversized SVG is rejected");

  const tooMany = JSON.parse(JSON.stringify(base));
  tooMany.customAssets = {};
  for (let i = 0; i <= MAX_CUSTOM_ASSETS_PER_CHARACTER; i++) tooMany.customAssets[`a${i}`] = asset(`a${i}`);
  assert(!CharacterSchema.safeParse(tooMany).success, "More than the per-character asset cap is rejected");

  const badKind = JSON.parse(JSON.stringify(base));
  badKind.customAssets = { a1: { ...asset("a1"), kind: "script" } };
  assert(!CharacterSchema.safeParse(badKind).success, "Unknown asset kind is rejected");

  // ---- Test 4: legacy frames reproduce previous output ----
  console.log("\n--- Test 4: Legacy border styles resolve identically ---");
  const legacy: Array<[NonNullable<BlockStyle["borderStyle"]>, string, string]> = [
    ["solid", "solid", "1px"],
    ["none", "none", "0px"],
    ["double", "double", "3px"],
    ["dashed", "dashed", "1px"],
    ["groove", "groove", "1px"],
  ];
  for (const [bs, cssStyle, width] of legacy) {
    const r = resolveBlockStyle({ borderStyle: bs }, theme);
    assert(
      r.style.borderStyle === cssStyle && r.style.borderWidth === width && r.className === "",
      `borderStyle "${bs}" -> ${cssStyle} ${width}`
    );
  }
  const ornate = resolveBlockStyle({ borderStyle: "ornate" }, theme);
  assert(
    ornate.style.borderStyle === "double" && ornate.style.borderWidth === "4px" && ornate.className === "border-ornate",
    'borderStyle "ornate" -> double 4px + border-ornate class'
  );
  const plain = resolveBlockStyle(undefined, theme);
  assert(plain.style.borderStyle === "solid" && plain.style.borderColor === "var(--border-color)", "No style -> solid, theme border color");
  assert(plain.style.backgroundColor === "var(--card-bg)", "No style -> theme card background");
  assert(resolveBlockStyle({ borderColor: "#ff0000" }, theme).style.borderColor === "#ff0000", "Card borderColor override applies");

  // ---- Test 5: cascade ----
  console.log("\n--- Test 5: Frame cascade ---");
  const dashedTheme: GlobalTheme = { ...theme, defaultFrame: "dashed" };
  assert(resolveBlockStyle(undefined, dashedTheme).style.borderStyle === "dashed", "Sheet default frame applies to cards with no override");
  assert(resolveBlockStyle({ frame: "double" }, dashedTheme).style.borderStyle === "double", "Card frame overrides sheet default");
  assert(resolveBlockStyle({ borderStyle: "groove" }, dashedTheme).style.borderStyle === "groove", "Legacy borderStyle overrides sheet default");
  assert(
    resolveBlockStyle({ frame: "double", borderStyle: "groove" }, theme).style.borderStyle === "double",
    "frame takes precedence over legacy borderStyle"
  );

  // ---- Test 6: unknown ids fall back safely ----
  console.log("\n--- Test 6: Unknown ids fall back ---");
  assert(!isKnownFrame("custom:zzz") && !isKnownFrame(undefined), "Unknown/undefined ids are not known frames");
  assert(getFrame("nope").id === "solid", "getFrame falls back to solid");
  assert(resolveBlockStyle({ frame: "nope" }, theme).style.borderStyle === "solid", "Unknown card frame -> solid");
  assert(
    resolveBlockStyle({ frame: "nope" }, dashedTheme).style.borderStyle === "dashed",
    "Unknown card frame falls through to a valid sheet default"
  );
  assert(
    resolveBlockStyle({}, { ...theme, defaultFrame: "nope" }).style.borderStyle === "solid",
    "Unknown sheet default -> solid"
  );
  assert(!isKnownFrame("toString") && !isKnownFrame("__proto__"), "Prototype keys are not treated as frames");

  // ---- Test 7: background layer ----
  console.log("\n--- Test 7: Background opacity uses theme color ---");
  assert(resolveBlockStyle({ backgroundOpacity: 0 }, theme).style.backgroundColor === "transparent", "Opacity 0 -> transparent");
  assert(resolveBlockStyle({ backgroundOpacity: 1 }, theme).style.backgroundColor === "var(--card-bg)", "Opacity 1 -> theme card color");
  const half = String(resolveBlockStyle({ backgroundOpacity: 0.5 }, theme).style.backgroundColor);
  assert(half.includes("var(--card-bg)") && half.includes("50%") && !half.includes("28, 30, 36"), "Partial opacity mixes theme card color (no hard-coded rgb)");
  assert(
    resolveBlockStyle({ backgroundUrl: "https://x.test/a.png" }, theme).style.backgroundImage === "url(https://x.test/a.png)",
    "backgroundUrl still applied"
  );

  // ---- Test 8: registry + sanitizer stub ----
  console.log("\n--- Test 8: Registry & sanitizer ---");
  const ids = listFrames().map((f) => f.id);
  assert(["solid", "none", "double", "dashed", "groove", "ornate"].every((id) => ids.includes(id)), "Registry contains all six legacy frames");
  assert(new Set(ids).size === ids.length, "Registry frame ids are unique");
  assert(!sanitizeSvg("<svg xmlns='http://www.w3.org/2000/svg'/>").ok, "Sanitizer stub fails closed (rejects all input)");

  console.log("\n=== All Phase 12 tests passed ===");
}

runPhase12Tests();
