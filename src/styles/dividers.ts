import type { HeaderDividerDefinition } from "./types";
import { resolveLiteralColor } from "./svgFrames";

// =============================================================================
// HEADER DIVIDER & DECAL REGISTRY
// Ornate dividers and center decals placed between card headers and content.
// Families: Classic, Fantasy, Sci-Fi, Gothic.
// =============================================================================

export const FALLBACK_DIVIDER_ID = "default";

const DIVIDER_LIST: HeaderDividerDefinition[] = [
  {
    id: "default",
    label: "Subtle Line",
    category: "classic",
    type: "line",
  },
  {
    id: "fade",
    label: "Fade Gradient",
    category: "classic",
    type: "fade",
  },
  {
    id: "none",
    label: "None",
    category: "classic",
    type: "none",
  },
  {
    id: "flourish",
    label: "Royal Flourish",
    category: "fantasy",
    type: "decal",
    decalWidth: 32,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16" fill="none"><polygon points="16,2 22,8 16,14 10,8" stroke="{{COLOR}}" stroke-width="1.5" fill="{{ACCENT}}" fill-opacity="0.35" /><circle cx="16" cy="8" r="2" fill="{{ACCENT}}" /><path d="M 10,8 C 7,8 5,5 3,6 C 1,7 3,10 6,9" stroke="{{COLOR}}" stroke-width="1.2" stroke-linecap="round" fill="none" /><path d="M 22,8 C 25,8 27,5 29,6 C 31,7 29,10 26,9" stroke="{{COLOR}}" stroke-width="1.2" stroke-linecap="round" fill="none" /></svg>`,
  },
  {
    id: "celtic",
    label: "Celtic Knot",
    category: "classic",
    type: "decal",
    decalWidth: 28,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 16" fill="none"><circle cx="14" cy="8" r="5" stroke="{{COLOR}}" stroke-width="1.4" /><path d="M 14,2 C 20,6 20,10 14,14 C 8,10 8,6 14,2 Z" stroke="{{ACCENT}}" stroke-width="1.5" fill="{{ACCENT}}" fill-opacity="0.25" /><circle cx="6" cy="8" r="1.5" fill="{{COLOR}}" /><circle cx="22" cy="8" r="1.5" fill="{{COLOR}}" /></svg>`,
  },
  {
    id: "tech",
    label: "Cyber Notch",
    category: "scifi",
    type: "decal",
    decalWidth: 32,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16" fill="none"><polygon points="16,3 23,8 16,13 9,8" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.2" /><polyline points="4,4 7,8 4,12" stroke="{{ACCENT}}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /><polyline points="28,4 25,8 28,12" stroke="{{ACCENT}}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /><circle cx="16" cy="8" r="2" fill="{{ACCENT}}" /></svg>`,
  },
  {
    id: "gothic",
    label: "Gothic Spikes",
    category: "gothic",
    type: "decal",
    decalWidth: 32,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 16" fill="none"><polygon points="16,1 19,7 16,15 13,7" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.25" /><path d="M 13,6 C 9,4 6,7 4,9" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><path d="M 19,6 C 23,4 26,7 28,9" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><circle cx="16" cy="7" r="1.8" fill="{{ACCENT}}" /></svg>`,
  },
  {
    id: "gem",
    label: "Celestial Star",
    category: "fantasy",
    type: "decal",
    decalWidth: 28,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 16" fill="none"><polygon points="14,1 18,8 14,15 10,8" stroke="{{COLOR}}" stroke-width="1.5" fill="{{ACCENT}}" fill-opacity="0.4" /><line x1="6" y1="8" x2="22" y2="8" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><circle cx="14" cy="8" r="2.2" fill="{{COLOR}}" /><circle cx="4" cy="8" r="1.2" fill="{{ACCENT}}" /><circle cx="24" cy="8" r="1.2" fill="{{ACCENT}}" /></svg>`,
  },
  {
    id: "runes",
    label: "Arcane Glyphs",
    category: "fantasy",
    type: "decal",
    decalWidth: 28,
    decalHeight: 16,
    decalSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 16" fill="none"><line x1="14" y1="2" x2="14" y2="14" stroke="{{ACCENT}}" stroke-width="1.8" stroke-linecap="round" /><line x1="14" y1="4" x2="19" y2="8" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><line x1="14" y1="8" x2="19" y2="12" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><line x1="14" y1="4" x2="9" y2="8" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><line x1="14" y1="8" x2="9" y2="12" stroke="{{COLOR}}" stroke-width="1.5" stroke-linecap="round" /><circle cx="4" cy="8" r="1.5" fill="{{COLOR}}" /><circle cx="24" cy="8" r="1.5" fill="{{COLOR}}" /></svg>`,
  },
];

const DIVIDERS: Record<string, HeaderDividerDefinition> = Object.fromEntries(
  DIVIDER_LIST.map((d) => [d.id, d])
);

export function isKnownDivider(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(DIVIDERS, id);
}

export function getDivider(id: string | undefined): HeaderDividerDefinition {
  return isKnownDivider(id) ? DIVIDERS[id] : DIVIDERS[FALLBACK_DIVIDER_ID];
}

export function listDividers(): HeaderDividerDefinition[] {
  return DIVIDER_LIST;
}

/**
 * Renders a center decal SVG with color and accent substitutions.
 */
export function renderDividerDecalSvg(
  id: string,
  color: string,
  accent?: string
): string | undefined {
  const d = getDivider(id);
  if (!d || !d.decalSvg) return undefined;

  const resolvedColor = resolveLiteralColor(color, "#2f333d");
  const resolvedAccent = resolveLiteralColor(accent || color, "#e06c75");

  return d.decalSvg
    .replaceAll("{{COLOR}}", resolvedColor)
    .replaceAll("{{ACCENT}}", resolvedAccent);
}
