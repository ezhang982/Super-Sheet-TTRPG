import type { CornerDefinition } from "./types";
import { resolveLiteralColor } from "./svgFrames";

// =============================================================================
// CORNER ACCENTS (Phase 3)
// Modular decorative accents overlaid on the 4 card corners (Layer 8).
// Toggled independently from the card frame.
//
// Each corner SVG template defines the TOP-LEFT corner (viewBox="0 0 32 32").
// The renderer rotates / mirrors this single SVG into the other 3 corners:
// - Top-Right: scaleX(-1)
// - Bottom-Left: scaleY(-1)
// - Bottom-Right: scale(-1, -1)
// =============================================================================

export const FALLBACK_CORNER_ID = "none";

// 1. None
const NONE_SVG = "";

// 2. Filigree (Curled baroque scroll flourish)
const FILIGREE_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <path d="M 3 29 L 3 14 C 3 8 8 3 14 3 L 29 3" stroke="{{COLOR}}" stroke-width="1.75" stroke-linecap="round" />
  <path d="M 8 26 L 8 16 C 8 12 12 8 16 8 L 26 8" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <path d="M 3 14 C 1 10 3 6 7 6 C 10 6 12 8 12 11 C 12 14 9 16 6 14" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <path d="M 14 3 C 10 1 6 3 6 7 C 6 10 8 12 11 12 C 14 12 16 9 14 6" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="10" cy="10" r="2.5" fill="{{ACCENT}}" />
</svg>`;

// 3. Tech (Cyberpunk HUD Corner Bracket & Crosshairs)
const TECH_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <path d="M 4 28 L 4 12 L 12 4 L 28 4" stroke="{{COLOR}}" stroke-width="2.5" stroke-linecap="square" />
  <path d="M 9 24 L 9 15 L 15 9 L 24 9" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="square" />
  <line x1="8" y1="8" x2="16" y2="16" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="12" cy="12" r="2" fill="{{ACCENT}}" />
  <line x1="2" y1="12" x2="6" y2="12" stroke="{{ACCENT}}" stroke-width="1.5" />
  <line x1="12" y1="2" x2="12" y2="6" stroke="{{ACCENT}}" stroke-width="1.5" />
</svg>`;

// 4. Rivets (Heavy Industrial Reinforced Plate & Steel Bolts)
const RIVETS_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <!-- L-bracket plate -->
  <path d="M 2 28 L 2 6 C 2 3.8 3.8 2 6 2 L 28 2 L 28 10 L 10 10 L 10 28 Z" fill="{{COLOR}}" fill-opacity="0.25" stroke="{{COLOR}}" stroke-width="1.5" />
  <!-- Bevel line -->
  <line x1="10" y1="10" x2="2" y2="2" stroke="{{COLOR}}" stroke-width="1" />
  <!-- Rivets -->
  <circle cx="6" cy="6" r="2" fill="{{ACCENT}}" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="20" cy="6" r="2" fill="{{ACCENT}}" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="6" cy="20" r="2" fill="{{ACCENT}}" stroke="{{COLOR}}" stroke-width="0.75" />
</svg>`;

// 5. Flourish (Delicate Botanical Leaf Scroll)
const FLOURISH_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <path d="M 4 28 C 4 16 8 8 20 4 L 28 4" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" />
  <path d="M 4 28 C 16 28 24 24 28 12" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <!-- Leaf finials -->
  <path d="M 12 12 C 9 7 13 4 17 7 C 17 11 13 12 12 12 Z" fill="{{COLOR}}" fill-opacity="0.3" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="9" cy="9" r="2" fill="{{ACCENT}}" />
  <circle cx="22" cy="6" r="1.5" fill="{{ACCENT}}" />
  <circle cx="6" cy="22" r="1.5" fill="{{ACCENT}}" />
</svg>`;

// 6. Runes (Arcane Binding Seal)
const RUNES_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <!-- Arcane circle quadrant -->
  <path d="M 3 28 A 25 25 0 0 1 28 3" stroke="{{COLOR}}" stroke-width="1.5" stroke-dasharray="4 2" />
  <path d="M 3 20 A 17 17 0 0 1 20 3" stroke="{{COLOR}}" stroke-width="1" />
  <!-- Mystic sigil rune -->
  <path d="M 9 9 L 17 17 M 9 17 L 17 9" stroke="{{ACCENT}}" stroke-width="1.5" stroke-linecap="round" />
  <circle cx="13" cy="13" r="6" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="13" cy="13" r="2" fill="{{ACCENT}}" />
</svg>`;

// 7. Spikes (Gothic Barbed Forged Iron Spikes)
const SPIKES_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <!-- Corner bracket -->
  <path d="M 4 28 L 4 12 L 12 4 L 28 4" stroke="{{COLOR}}" stroke-width="2" />
  <!-- 3 sharp outward spikes -->
  <polygon points="4,12 0,6 6,8" fill="{{COLOR}}" />
  <polygon points="12,4 6,0 8,6" fill="{{COLOR}}" />
  <polygon points="7,7 1,1 7,2" fill="{{ACCENT}}" />
  <!-- Central stud -->
  <polygon points="14,10 18,14 14,18 10,14" fill="{{ACCENT}}" stroke="{{COLOR}}" stroke-width="0.75" />
</svg>`;

// 8. Gem (Regal Diamond Setting Mount)
const GEM_CORNER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none">
  <path d="M 3 26 L 3 12 C 3 7 7 3 12 3 L 26 3" stroke="{{COLOR}}" stroke-width="1.5" />
  <!-- Setting prongs -->
  <line x1="6" y1="14" x2="14" y2="6" stroke="{{COLOR}}" stroke-width="1.5" />
  <!-- Radiant faceted gem -->
  <polygon points="14,8 20,14 14,20 8,14" fill="{{ACCENT}}" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="14,10 18,14 14,18 10,14" fill="#ffffff" fill-opacity="0.35" />
  <circle cx="14" cy="14" r="1.5" fill="#ffffff" />
</svg>`;

const CORNER_LIST: CornerDefinition[] = [
  { id: "none", label: "None", category: "classic", svgTemplate: NONE_SVG },
  { id: "filigree", label: "Filigree Curls", category: "fantasy", svgTemplate: FILIGREE_CORNER_SVG, size: 32 },
  { id: "tech", label: "Tech HUD Bracket", category: "scifi", svgTemplate: TECH_CORNER_SVG, size: 32 },
  { id: "rivets", label: "Industrial Rivets", category: "classic", svgTemplate: RIVETS_CORNER_SVG, size: 32 },
  { id: "flourish", label: "Botanical Flourish", category: "fantasy", svgTemplate: FLOURISH_CORNER_SVG, size: 32 },
  { id: "runes", label: "Arcane Runes", category: "fantasy", svgTemplate: RUNES_CORNER_SVG, size: 32 },
  { id: "spikes", label: "Gothic Spikes", category: "gothic", svgTemplate: SPIKES_CORNER_SVG, size: 32 },
  { id: "gem", label: "Diamond Gem Mount", category: "classic", svgTemplate: GEM_CORNER_SVG, size: 32 },
];

const CORNERS: Record<string, CornerDefinition> = Object.fromEntries(
  CORNER_LIST.map((c) => [c.id, c])
);

export function isKnownCorner(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(CORNERS, id);
}

export function getCorner(id: string | undefined): CornerDefinition {
  return isKnownCorner(id) ? CORNERS[id] : CORNERS[FALLBACK_CORNER_ID];
}

export function listCorners(): CornerDefinition[] {
  return CORNER_LIST;
}

/**
 * Renders a corner definition into a data URI.
 * Returns undefined for 'none' or unknown corners.
 */
export function renderCornerSvg(
  id: string | undefined,
  color: string,
  accent: string
): string | undefined {
  if (!id || id === "none") return undefined;
  const def = getCorner(id);
  if (!def.svgTemplate) return undefined;

  const resolvedColor = resolveLiteralColor(color, "#5c6370");
  const resolvedAccent = resolveLiteralColor(accent, "#e5c07b");

  const svg = def.svgTemplate
    .replace(/\{\{COLOR\}\}/g, resolvedColor)
    .replace(/\{\{ACCENT\}\}/g, resolvedAccent)
    .replace(/currentColor/g, resolvedColor);

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
