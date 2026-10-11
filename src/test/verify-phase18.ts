import { useCharacterStore } from "../store/useCharacterStore";
import { createDefaultCharacter } from "../store/fixtures";
import { sanitizeSvg } from "../styles/svgSanitizer";
import {
  assetLibrary,
  getCustomAssetSync,
  listCustomAssetsSync,
} from "../styles/assetLibrary";
import {
  isKnownFrame,
  getFrame,
  listFrames,
  isKnownCorner,
  getCorner,
  listCorners,
  renderCornerSvg,
  isKnownWatermark,
  getWatermark,
  listWatermarks,
  renderWatermarkSvg,
  renderWatermarkLayer,
  ANIMATION_LIST,
  isKnownAnimation,
  getAnimation,
  listAnimations,
} from "../styles/registry";
import {
  isKnownPattern,
  getPattern,
  listPatterns,
  renderPattern,
} from "../styles/patterns";
import { resolvePreviewStyle } from "../styles/resolveStyle";
import type { CustomAsset } from "../types/schema";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("=== RUNNING PHASE 18 (STYLE PHASE 5: CUSTOM USER SVGS, MY DESIGNS & MOTION) TESTS ===\n");
  const defaultChar = createDefaultCharacter();

  // -----------------------------------------------------------------------------
  // 1. SVG Sanitizer Security Engine
  // -----------------------------------------------------------------------------
  console.log("--- 1. SVG Sanitizer Security Engine ---");

  const validFrameSvg = `<svg viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="92" height="92" fill="none" stroke="{{COLOR}}" stroke-width="4" />
    <circle cx="48" cy="48" r="16" fill="{{ACCENT}}" />
  </svg>`;

  const cleanResult = sanitizeSvg(validFrameSvg);
  assert(cleanResult.ok, "Valid clean SVG is accepted by sanitizer");
  if (cleanResult.ok) {
    assert(cleanResult.id.startsWith("svg_"), `Sanitized ID begins with 'svg_' prefix: ${cleanResult.id}`);
    assert(cleanResult.svg.includes('xmlns="http://www.w3.org/2000/svg"'), "Sanitized SVG includes standard XML namespace");
    assert(cleanResult.svg.includes("{{COLOR}}") && cleanResult.svg.includes("{{ACCENT}}"), "Color placeholders preserved in output");
  }

  // Reject <script>
  const scriptSvg = `<svg viewBox="0 0 100 100"><script>alert('xss')</script><circle cx="50" cy="50" r="10"/></svg>`;
  const scriptResult = sanitizeSvg(scriptSvg);
  assert(!scriptResult.ok, "Sanitizer strictly rejects <script> tags");
  if (!scriptResult.ok) {
    assert(scriptResult.reason.includes("script"), `Sanitizer failure message explicitly cites rejected tag: ${scriptResult.reason}`);
  }

  // Reject <foreignObject>
  const foreignObjectSvg = `<svg viewBox="0 0 100 100"><foreignObject width="100" height="100"><body xmlns="http://www.w3.org/1999/xhtml"><iframe src="evil.html"></iframe></body></foreignObject></svg>`;
  const foResult = sanitizeSvg(foreignObjectSvg);
  assert(!foResult.ok, "Sanitizer strictly rejects <foreignObject> tags");

  // Reject inline event handlers (onclick, onload, etc.)
  const onclickSvg = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="10" onclick="alert(1)" /></svg>`;
  const onclickResult = sanitizeSvg(onclickSvg);
  assert(!onclickResult.ok, "Sanitizer rejects inline onclick event handlers");

  const onloadSvg = `<svg viewBox="0 0 100 100" onload="alert('owned')"><rect width="100" height="100"/></svg>`;
  const onloadResult = sanitizeSvg(onloadSvg);
  assert(!onloadResult.ok, "Sanitizer rejects root onload event handlers");

  // Reject external hrefs
  const externalHrefSvg = `<svg viewBox="0 0 100 100"><image href="https://malicious-site.com/exploit.jpg" width="100" height="100"/></svg>`;
  const extResult = sanitizeSvg(externalHrefSvg);
  assert(!extResult.ok, "Sanitizer rejects external href image URLs");

  // Allow internal local fragment IDs (#my-grad)
  const localFragmentSvg = `<svg viewBox="0 0 100 100">
    <defs><linearGradient id="my-grad"><stop offset="0%" stop-color="#fff"/></linearGradient></defs>
    <use href="#my-grad"/>
  </svg>`;
  const localResult = sanitizeSvg(localFragmentSvg);
  assert(localResult.ok, "Sanitizer accepts safe internal local fragment identifiers (#id)");

  // Reject dangerous CSS expressions/urls
  const cssUrlSvg = `<svg viewBox="0 0 100 100"><rect width="100" height="100" style="background: url('javascript:alert(1)')"/></svg>`;
  const cssResult = sanitizeSvg(cssUrlSvg);
  assert(!cssResult.ok, "Sanitizer rejects dangerous javascript: URLs in CSS style attributes");

  // Reject oversized SVGs (>30,000 characters)
  const hugeSvg = `<svg viewBox="0 0 100 100"><path d="${"M 0 0 L 10 10 ".repeat(3000)}"/></svg>`;
  const hugeResult = sanitizeSvg(hugeSvg);
  assert(!hugeResult.ok, `Sanitizer rejects oversized SVG payloads (>30,000 chars, got ${hugeSvg.length})`);

  // -----------------------------------------------------------------------------
  // 2. Asset Library (IndexedDB / LocalStorage / In-Memory Cache)
  // -----------------------------------------------------------------------------
  console.log("\n--- 2. Asset Library (My Designs) ---");

  const testAssetData: Omit<CustomAsset, "id"> = {
    name: "Dragon Scale Frame",
    kind: "frame",
    svg: validFrameSvg,
    slice: 28,
    recolor: true,
  };

  const savedAsset = await assetLibrary.add(testAssetData);
  assert(!!savedAsset.id, `Asset stored successfully with deterministic content hash: ${savedAsset.id}`);
  assert(savedAsset.name === "Dragon Scale Frame", "Asset name matches input");
  assert(savedAsset.slice === 28, "Asset slice matches input");

  // Sync lookup
  const cachedSync = getCustomAssetSync(savedAsset.id);
  assert(cachedSync?.id === savedAsset.id, "getCustomAssetSync returns asset from synchronous cache");

  // Async lookup
  const cachedAsync = await assetLibrary.get(savedAsset.id);
  assert(cachedAsync?.id === savedAsset.id, "assetLibrary.get returns asset asynchronously");

  // List lookup
  const allDesigns = assetLibrary.listSync();
  assert(allDesigns.some((d) => d.id === savedAsset.id), "assetLibrary.listSync contains newly created asset");

  // Kind filtering
  const frameDesigns = listCustomAssetsSync("frame");
  assert(frameDesigns.some((d) => d.id === savedAsset.id), "listCustomAssetsSync('frame') filters by asset kind");
  const patternDesigns = listCustomAssetsSync("pattern");
  assert(!patternDesigns.some((d) => d.id === savedAsset.id), "listCustomAssetsSync('pattern') does not return frames");

  // Add a corner design
  const validCornerSvg = `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M 0 16 L 16 0 L 32 0 L 0 32 Z" fill="{{COLOR}}" />
    <circle cx="12" cy="12" r="3" fill="{{ACCENT}}" />
  </svg>`;
  const savedCorner = await assetLibrary.add({
    name: "Cyber Wedge Corner",
    kind: "corners",
    svg: validCornerSvg,
    recolor: true,
  });
  assert(savedCorner.kind === "corners", "Added custom corner asset successfully");

  // Add a watermark design
  const validWatermarkSvg = `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" stroke="{{COLOR}}" stroke-width="4" fill="none" />
    <line x1="10" y1="50" x2="90" y2="50" stroke="{{COLOR}}" stroke-width="2" />
  </svg>`;
  const savedWatermark = await assetLibrary.add({
    name: "Arcane Crosshair",
    kind: "watermark",
    svg: validWatermarkSvg,
    recolor: true,
  });
  assert(savedWatermark.kind === "watermark", "Added custom watermark asset successfully");

  // Add a pattern design
  const validPatternSvg = `<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="0" x2="40" y2="40" stroke="{{COLOR}}" stroke-width="1"/>
  </svg>`;
  const savedPattern = await assetLibrary.add({
    name: "Hatching Grid",
    kind: "pattern",
    svg: validPatternSvg,
    recolor: true,
  });
  assert(savedPattern.kind === "pattern", "Added custom pattern asset successfully");

  // -----------------------------------------------------------------------------
  // 3. Dynamic Registry Resolution
  // -----------------------------------------------------------------------------
  console.log("\n--- 3. Dynamic Registry Resolution ---");

  // Frame resolution
  const customFrameToken = `custom:${savedAsset.id}`;
  assert(isKnownFrame(customFrameToken), "isKnownFrame returns true for custom token format 'custom:<id>'");
  const resolvedFrame = getFrame(customFrameToken);
  assert(resolvedFrame.id === customFrameToken, "getFrame returns custom frame definition");
  assert(resolvedFrame.label.includes("Dragon Scale Frame"), `Custom frame label includes design name: ${resolvedFrame.label}`);

  const renderedFrame = resolvedFrame.render({
    color: "#e06c75",
    accent: "#61afef",
    theme: defaultChar.theme,
  });
  assert(!!renderedFrame.style.borderImageSource, "Custom 9-slice frame sets borderImageSource data URI");
  assert(renderedFrame.style.borderImageSlice === "28", `Custom 9-slice frame slice matches asset definition (28)`);

  // Corner resolution
  const customCornerToken = `custom:${savedCorner.id}`;
  assert(isKnownCorner(customCornerToken), "isKnownCorner returns true for custom corner token");
  const resolvedCorner = getCorner(customCornerToken);
  assert(resolvedCorner.id === customCornerToken, "getCorner returns custom corner definition");
  const renderedCornerUri = renderCornerSvg(customCornerToken, "#e06c75", "#61afef");
  assert(!!renderedCornerUri && renderedCornerUri.startsWith("data:image/svg+xml"), "renderCornerSvg produces valid data URI");

  // Watermark resolution
  const customWatermarkToken = `custom:${savedWatermark.id}`;
  assert(isKnownWatermark(customWatermarkToken), "isKnownWatermark returns true for custom watermark token");
  const resolvedWatermark = getWatermark(customWatermarkToken);
  assert(resolvedWatermark.id === customWatermarkToken, "getWatermark returns custom watermark definition");
  const renderedWatermarkUri = renderWatermarkSvg(customWatermarkToken, "#e06c75", 0.15);
  assert(!!renderedWatermarkUri && renderedWatermarkUri.startsWith("data:image/svg+xml"), "renderWatermarkSvg produces valid data URI");
  const renderedWmLayer = renderWatermarkLayer(customWatermarkToken, { color: "#e06c75" });
  assert(!!renderedWmLayer?.image, "renderWatermarkLayer produces CSS BackgroundLayer with image URI");

  // Pattern resolution
  const customPatternToken = `custom:${savedPattern.id}`;
  assert(isKnownPattern(customPatternToken), "isKnownPattern returns true for custom pattern token");
  const resolvedPattern = getPattern(customPatternToken);
  assert(resolvedPattern.id === customPatternToken, "getPattern returns custom pattern definition");
  const renderedPatternLayer = renderPattern(customPatternToken, { color: "#e06c75", scale: 1, opacity: 0.1 });
  assert(!!renderedPatternLayer?.image, "renderPattern produces CSS BackgroundLayer");

  // Pickers list integration
  assert(listFrames().some((f) => f.id === customFrameToken), "listFrames() dynamically includes custom frames in UI pickers");
  assert(listCorners().some((c) => c.id === customCornerToken), "listCorners() dynamically includes custom corners in UI pickers");
  assert(listWatermarks().some((w) => w.id === customWatermarkToken), "listWatermarks() dynamically includes custom watermarks in UI pickers");
  assert(listPatterns().some((p) => p.id === customPatternToken), "listPatterns() dynamically includes custom patterns in UI pickers");

  // -----------------------------------------------------------------------------
  // 4. Motion & Animation Effects
  // -----------------------------------------------------------------------------
  console.log("\n--- 4. Motion & Animation Effects ---");

  const animList = listAnimations();
  assert(animList.length >= 4, `Registered animation options (found ${animList.length})`);
  assert(ANIMATION_LIST.length === animList.length, "ANIMATION_LIST matches listAnimations()");
  assert(isKnownAnimation("none"), "'none' is recognized animation token");
  assert(isKnownAnimation("neon-pulse"), "'neon-pulse' is recognized animation token");
  assert(isKnownAnimation("shimmer"), "'shimmer' is recognized animation token");
  assert(isKnownAnimation("arcane-flow"), "'arcane-flow' is recognized animation token");
  assert(!isKnownAnimation("fake-spin"), "Unknown animation token rejected");

  assert(getAnimation("neon-pulse").className === "fx-neon-pulse", "neon-pulse maps to .fx-neon-pulse class");
  assert(getAnimation("shimmer").className === "fx-shimmer", "shimmer maps to .fx-shimmer class");
  assert(getAnimation("arcane-flow").className === "fx-arcane-flow", "arcane-flow maps to .fx-arcane-flow class");
  assert(getAnimation("unknown").id === "none", "Unknown animation safely falls back to 'none'");

  // Test resolvePreviewStyle animation class injection
  const themeWithPulse = { ...defaultChar.theme, animation: "neon-pulse" };
  const previewPulse = resolvePreviewStyle({}, themeWithPulse);
  assert(previewPulse.className.includes("fx-neon-pulse"), "resolvePreviewStyle includes fx-neon-pulse class from theme");

  // Card override animation
  const previewShimmer = resolvePreviewStyle({ animation: "shimmer" }, themeWithPulse);
  assert(previewShimmer.className.includes("fx-shimmer"), "Per-card style override takes precedence over theme animation");
  assert(!previewShimmer.className.includes("fx-neon-pulse"), "Previous theme animation class omitted when overridden");

  // -----------------------------------------------------------------------------
  // 5. Store & Portability: Embedding in Character & Import Merging
  // -----------------------------------------------------------------------------
  console.log("\n--- 5. Store & Portability ---");

  const store = useCharacterStore.getState();

  // Embed asset in character
  store.embedCustomAsset(savedAsset);
  const updatedChar = useCharacterStore.getState().character;
  assert(!!updatedChar.customAssets?.[savedAsset.id], `Custom asset '${savedAsset.id}' embedded directly in character object`);
  assert(updatedChar.customAssets?.[savedAsset.id]?.name === "Dragon Scale Frame", "Embedded asset retains metadata and SVG");

  // Export character and check embedded assets
  const exportedChar = store.exportCharacter();
  assert(!!exportedChar.customAssets?.[savedAsset.id], "Exported character retains customAssets");
  const jsonString = JSON.stringify(exportedChar);
  const parsedExport = JSON.parse(jsonString);
  assert(!!parsedExport.customAssets?.[savedAsset.id], "Exported character JSON embeds customAssets for zero-loss portability");

  // Remove asset from character
  store.removeCustomAsset(savedAsset.id);
  const charAfterRemove = useCharacterStore.getState().character;
  assert(!charAfterRemove.customAssets?.[savedAsset.id], "removeCustomAsset properly deletes embedded asset");

  // Test importCharacter auto-merges embedded assets into assetLibrary
  const foreignSvg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <polygon points="40,5 75,70 5,70" stroke="{{COLOR}}" fill="none" stroke-width="3" />
  </svg>`;
  const foreignSanitized = sanitizeSvg(foreignSvg);
  assert(foreignSanitized.ok, "Foreign SVG is valid");
  const foreignId = foreignSanitized.ok ? foreignSanitized.id : "foreign";

  const foreignAsset: CustomAsset = {
    id: foreignId,
    name: "Foreign Arcane Triangle",
    kind: "watermark",
    svg: foreignSvg,
    recolor: true,
  };
  const foreignCharacter = {
    ...defaultChar,
    id: "char_foreign_1",
    name: "Visiting Sorcerer",
    customAssets: {
      [foreignId]: foreignAsset,
    },
  };

  await store.importCharacter(JSON.stringify(foreignCharacter));
  await new Promise((r) => setTimeout(r, 60));
  const importedAsset = getCustomAssetSync(foreignId);
  assert(importedAsset?.name === "Foreign Arcane Triangle", "importCharacter auto-merges incoming customAssets into library");

  // Clean up test items from library
  await assetLibrary.remove(savedAsset.id);
  await assetLibrary.remove(savedCorner.id);
  await assetLibrary.remove(savedWatermark.id);
  await assetLibrary.remove(savedPattern.id);
  await assetLibrary.remove(foreignId);
  assert(!getCustomAssetSync(savedAsset.id), "assetLibrary.remove deletes asset from cache and IDB");

  console.log("\n🎉 ALL PHASE 18 (STYLE PHASE 5) VERIFICATION TESTS PASSED!");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  throw err;
});
