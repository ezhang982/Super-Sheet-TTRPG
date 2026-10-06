import { CharacterSchema } from "../types/schema";
import type { GlobalTheme } from "../types/schema";
import { createDefaultCharacter } from "../store/fixtures";
import { useCharacterStore } from "../store/useCharacterStore";
import { resolveBlockStyle, resolvePreviewStyle } from "../styles/resolveStyle";
import { getShading, getShape, isKnownShading, isKnownShape, listFrames, listShadings, listShapes } from "../styles/registry";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

const fx = (s: ReturnType<typeof resolveBlockStyle>) =>
  (s.style as Record<string, unknown>)["--card-fx"] as string | undefined;

console.log("=== Running Phase 13 (Style Phase 1: effects & cascade UI) Verification Suite ===");

const base = createDefaultCharacter();
const theme: GlobalTheme = base.theme;

// ---- Test 1: metallic frames ----
console.log("\n--- Test 1: Metallic frames ---");
for (const id of ["gold", "silver", "bronze", "foil"]) {
  const r = resolveBlockStyle({ frame: id }, theme);
  const s = r.style as Record<string, unknown>;
  assert(
    r.className.includes("frame-ring") && typeof s["--frame-gradient"] === "string" && s.borderStyle === "none",
    `Frame "${id}" renders as a gradient ring (no CSS border)`
  );
}
assert(listFrames().length >= 10, "Registry now lists legacy + metallic frames");
assert(new Set(listFrames().map((f) => f.id)).size === listFrames().length, "Frame ids stay unique");

// ---- Test 2: shapes ----
console.log("\n--- Test 2: Shapes ---");
assert(resolveBlockStyle({ shape: "rounded" }, theme).style.borderRadius === "22px", "Rounded shape sets radius");
assert(resolveBlockStyle({ shape: "sharp" }, theme).style.borderRadius === "0px", "Sharp shape sets radius 0");
assert(resolveBlockStyle({ shape: "chamfer" }, theme).className.includes("shape-chamfer"), "Chamfer adds shape class");
assert(resolveBlockStyle({}, theme).style.borderRadius === undefined, "No shape -> theme radius from CSS");
const roundedTheme: GlobalTheme = { ...theme, defaultShape: "rounded" };
assert(resolveBlockStyle({}, roundedTheme).style.borderRadius === "22px", "Sheet default shape applies");
assert(resolveBlockStyle({ shape: "sharp" }, roundedTheme).style.borderRadius === "0px", "Card shape overrides sheet default");
assert(resolveBlockStyle({ shape: "nope" }, roundedTheme).style.borderRadius === "22px", "Unknown card shape falls to sheet default");
assert(!isKnownShape("toString") && getShape("zzz").id === "rect", "Unknown shapes fall back to rect");
assert(listShapes().length === 4, "Four shapes registered");

// ---- Test 3: inner shading ----
console.log("\n--- Test 3: Inner shading ---");
assert(fx(resolveBlockStyle({}, theme)) === undefined, "No effects -> no --card-fx");
for (const s of ["soft", "deep", "vignette"]) {
  const f = fx(resolveBlockStyle({ shading: s }, theme));
  assert(!!f && f.includes("inset"), `Shading "${s}" adds an inset shadow`);
}
assert(fx(resolveBlockStyle({ shading: "none" }, { ...theme, defaultShading: "deep" })) === undefined, "Card shading 'none' overrides sheet default");
assert(!!fx(resolveBlockStyle({}, { ...theme, defaultShading: "deep" })), "Sheet default shading applies");
assert(getShading("zzz").id === "none" && !isKnownShading("__proto__"), "Unknown shading falls back to none");
assert(listShadings().length === 4, "Four shading options registered");

// ---- Test 4: glow ----
console.log("\n--- Test 4: Glow ---");
const glow = fx(resolveBlockStyle({ glow: true }, theme));
assert(!!glow && glow.includes("var(--accent-color)") && !glow.includes("inset"), "Glow uses accent color as an outer shadow");
assert(fx(resolveBlockStyle({ glow: false }, { ...theme, defaultGlow: true })) === undefined, "Card glow=false overrides sheet default true");
assert(!!fx(resolveBlockStyle({}, { ...theme, defaultGlow: true })), "Sheet default glow applies to cards with no override");
const chamferGlow = fx(resolveBlockStyle({ glow: true, shape: "chamfer" }, theme));
assert(!!chamferGlow && chamferGlow.startsWith("inset"), "Chamfer glow is drawn inside (clip-path would clip an outer glow)");
const combined = fx(resolveBlockStyle({ glow: true, shading: "soft" }, theme));
assert(!!combined && combined.includes("var(--accent-color)") && combined.includes("inset 0 0 18px"), "Glow and shading combine");

// ---- Test 5: accent tint ----
console.log("\n--- Test 5: Accent tint ---");
const tinted = resolveBlockStyle({ accentTint: "#ff0000" }, theme);
assert(tinted.style.borderColor === "#ff0000", "Tint colors the border");
assert(String(tinted.style.backgroundImage).includes("linear-gradient") && String(tinted.style.backgroundImage).includes("#ff0000"), "Tint adds a background wash");
assert(resolveBlockStyle({ accentTint: "#ff0000", borderColor: "#00ff00" }, theme).style.borderColor === "#00ff00", "Explicit borderColor beats tint");
assert(String(fx(resolveBlockStyle({ accentTint: "#ff0000", glow: true }, theme))).includes("#ff0000"), "Tint colors the glow");
const both = String(resolveBlockStyle({ accentTint: "#ff0000", backgroundUrl: "https://x.test/a.png" }, theme).style.backgroundImage);
assert(both.includes("linear-gradient") && both.includes("url(https://x.test/a.png)"), "Tint wash and background image stack");

// ---- Test 6: legacy solid & cascade ----
console.log("\n--- Test 6: Cascade details ---");
const goldTheme: GlobalTheme = { ...theme, defaultFrame: "gold" };
assert(resolveBlockStyle({ borderStyle: "solid" }, goldTheme).className.includes("frame-ring"), "Legacy borderStyle 'solid' means 'default' and does not block the sheet frame");
assert(resolveBlockStyle({ borderStyle: "dashed" }, goldTheme).style.borderStyle === "dashed", "Other legacy borderStyles still override");
assert(resolveBlockStyle({ frame: "solid" }, goldTheme).style.borderStyle === "solid", "Explicit frame 'solid' overrides sheet default");
const preview = resolvePreviewStyle({ shape: "sharp" }, { ...goldTheme, defaultGlow: true, defaultShape: "rounded" });
assert(!preview.className.includes("frame-ring") && fx(preview) === undefined && preview.style.borderRadius === "0px", "Preview style ignores sheet defaults");

// ---- Test 7: schema ----
console.log("\n--- Test 7: Schema ---");
const withTokens = JSON.parse(JSON.stringify(base));
withTokens.theme.defaultShape = "chamfer";
withTokens.theme.defaultShading = "vignette";
const firstId = Object.keys(withTokens.blocks)[0];
withTokens.blocks[firstId].style = { shading: "deep", shape: "rounded", glow: false, accentTint: "#abcdef" };
const parsed = CharacterSchema.safeParse(withTokens);
assert(parsed.success, "Characters with Phase 1 tokens validate");
if (parsed.success) {
  assert(parsed.data.theme.defaultShape === "chamfer" && parsed.data.theme.defaultShading === "vignette", "Theme defaults preserved");
  const st = parsed.data.blocks[firstId].style;
  assert(st?.shading === "deep" && st?.shape === "rounded" && st?.glow === false && st?.accentTint === "#abcdef", "Card tokens preserved");
}

// ---- Test 8: bulk clear + undo ----
console.log("\n--- Test 8: clearBlockStyleOverrides ---");
const store = useCharacterStore.getState();
store.importCharacter(createDefaultCharacter());
const ids = Object.keys(useCharacterStore.getState().character.blocks);
assert(ids.length >= 2, "Fixture has at least two blocks");
const [a, b, c] = ids;
store.updateBlockStyle(a, { frame: "gold", shape: "chamfer", glow: true, borderColor: "#123456" });
store.updateBlockStyle(b, { borderStyle: "ornate", shading: "deep", accentTint: "#ff0000" });
useCharacterStore.getState().clearHistory();

const before = useCharacterStore.getState().character;
store.clearBlockStyleOverrides(["frame", "borderStyle", "shape", "shading", "glow"]);
const after = useCharacterStore.getState().character;
assert(!after.blocks[a].style?.frame && !after.blocks[a].style?.shape && after.blocks[a].style?.glow === undefined, "Frame/shape/glow cleared on card A");
assert(after.blocks[a].style?.borderColor === "#123456", "Unlisted keys (borderColor) are kept");
assert(!after.blocks[b].style?.borderStyle && !after.blocks[b].style?.shading, "Legacy borderStyle and shading cleared on card B");
assert(after.blocks[b].style?.accentTint === "#ff0000", "Accent tint kept (not in the cleared list)");
assert(after.blocks[c] === before.blocks[c], "Untouched blocks keep object identity");

useCharacterStore.getState().undo();
const undone = useCharacterStore.getState().character;
assert(undone.blocks[a].style?.frame === "gold" && undone.blocks[b].style?.borderStyle === "ornate", "One undo restores every card");

const noop = useCharacterStore.getState().character;
store.clearBlockStyleOverrides([]);
assert(useCharacterStore.getState().character === noop, "Clearing nothing changes nothing");

console.log("\n=== All Phase 13 tests passed ===");
