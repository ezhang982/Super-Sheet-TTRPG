import type { BackgroundLayer, WatermarkDefinition } from "./types";
import { resolveLiteralColor } from "./svgFrames";

// =============================================================================
// WATERMARK REGISTRY
// Subtle thematic background emblems rendered on cards and canvas (Layer 5).
// Built-in emblems: d20, crest, arcane-circle (rune-circle), biohazard, dragon,
// skull, compass.
// =============================================================================

export const FALLBACK_WATERMARK_ID = "none";
export const DEFAULT_WATERMARK_OPACITY = 0.1;
export const DEFAULT_CANVAS_WATERMARK_OPACITY = 0.05;

export type WatermarkPosition =
  | "center"
  | "bottom-right"
  | "top-right"
  | "bottom-left"
  | "top-left";

export interface WatermarkPositionOption {
  id: WatermarkPosition;
  label: string;
  cssPosition: string;
}

export const WATERMARK_POSITIONS: WatermarkPositionOption[] = [
  { id: "center", label: "Center", cssPosition: "center center" },
  { id: "bottom-right", label: "Bottom Right", cssPosition: "calc(100% - 16px) calc(100% - 16px)" },
  { id: "top-right", label: "Top Right", cssPosition: "calc(100% - 16px) 16px" },
  { id: "bottom-left", label: "Bottom Left", cssPosition: "16px calc(100% - 16px)" },
  { id: "top-left", label: "Top Left", cssPosition: "16px 16px" },
];

export function getWatermarkCssPosition(pos: string | undefined): string {
  const match = WATERMARK_POSITIONS.find((p) => p.id === pos);
  return match ? match.cssPosition : "center center";
}

const WATERMARK_LIST: WatermarkDefinition[] = [
  {
    id: "none",
    label: "None",
    category: "classic",
    svgTemplate: "",
  },
  {
    id: "d20",
    label: "D20 Die",
    category: "fantasy",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,5 90,28 90,72 50,95 10,72 10,28" stroke="{{COLOR}}" stroke-width="2.5" stroke-linejoin="round" /><polygon points="50,32 76,72 24,72" stroke="{{COLOR}}" stroke-width="2" stroke-linejoin="round" fill="{{COLOR}}" fill-opacity="0.12" /><line x1="50" y1="5" x2="50" y2="32" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="90" y1="28" x2="50" y2="32" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="90" y1="28" x2="76" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="90" y1="72" x2="76" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="50" y1="95" x2="76" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="50" y1="95" x2="24" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="10" y1="72" x2="24" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="10" y1="28" x2="24" y2="72" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="10" y1="28" x2="50" y2="32" stroke="{{COLOR}}" stroke-width="1.8" /><text x="50" y="58" font-family="serif" font-size="14" font-weight="900" fill="{{COLOR}}" text-anchor="middle" dominant-baseline="central">20</text></svg>`,
  },
  {
    id: "crest",
    label: "Knightly Crest",
    category: "fantasy",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="30,22 35,12 42,18 50,10 58,18 65,12 70,22" stroke="{{COLOR}}" stroke-width="2" stroke-linejoin="round" fill="{{COLOR}}" fill-opacity="0.15" /><path d="M 22,26 L 78,26 L 78,56 C 78,74 50,92 50,92 C 50,92 22,74 22,56 Z" stroke="{{COLOR}}" stroke-width="2.5" stroke-linejoin="round" fill="{{COLOR}}" fill-opacity="0.08" /><path d="M 28,32 L 72,32 L 72,54 C 72,68 50,82 50,82 C 50,82 28,68 28,54 Z" stroke="{{COLOR}}" stroke-width="1.2" stroke-linejoin="round" stroke-dasharray="3 2" /><line x1="36" y1="38" x2="64" y2="66" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /><line x1="64" y1="38" x2="36" y2="66" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /><circle cx="50" cy="52" r="5" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.25" /></svg>`,
  },
  {
    id: "arcane-circle",
    label: "Arcane Circle",
    category: "fantasy",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" stroke="{{COLOR}}" stroke-width="2" /><circle cx="50" cy="50" r="42" stroke="{{COLOR}}" stroke-width="1" stroke-dasharray="2 3" /><polygon points="50,14 78,63 22,63" stroke="{{COLOR}}" stroke-width="1.5" stroke-linejoin="round" /><polygon points="50,86 78,37 22,37" stroke="{{COLOR}}" stroke-width="1.5" stroke-linejoin="round" /><circle cx="50" cy="50" r="26" stroke="{{COLOR}}" stroke-width="1.5" /><circle cx="50" cy="50" r="12" stroke="{{COLOR}}" stroke-width="1.8" fill="{{COLOR}}" fill-opacity="0.15" /><circle cx="50" cy="50" r="4" fill="{{COLOR}}" /><line x1="50" y1="4" x2="50" y2="14" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /><line x1="50" y1="86" x2="50" y2="96" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /><line x1="4" y1="50" x2="14" y2="50" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /><line x1="86" y1="50" x2="96" y2="50" stroke="{{COLOR}}" stroke-width="2" stroke-linecap="round" /></svg>`,
  },
  {
    id: "biohazard",
    label: "Biohazard",
    category: "scifi",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><g transform="translate(50,50)"><circle cx="0" cy="0" r="8" stroke="{{COLOR}}" stroke-width="2.5" fill="{{COLOR}}" fill-opacity="0.2" /><path d="M -16,-10 A 24,24 0 1,1 16,-10 A 18,18 0 1,0 -16,-10 Z" stroke="{{COLOR}}" stroke-width="2" fill="{{COLOR}}" fill-opacity="0.1" /><path d="M 18,3 A 24,24 0 1,1 2,28 A 18,18 0 1,0 18,3 Z" stroke="{{COLOR}}" stroke-width="2" fill="{{COLOR}}" fill-opacity="0.1" /><path d="M -2,28 A 24,24 0 1,1 -18,3 A 18,18 0 1,0 -2,28 Z" stroke="{{COLOR}}" stroke-width="2" fill="{{COLOR}}" fill-opacity="0.1" /><circle cx="0" cy="0" r="34" stroke="{{COLOR}}" stroke-width="2" stroke-dasharray="52 20" /></g></svg>`,
  },
  {
    id: "dragon",
    label: "Dragon Wyrm",
    category: "fantasy",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M 50,10 C 53,16 57,18 64,18 C 61,22 55,23 52,26 C 58,26 68,22 72,27 C 68,30 61,31 55,34 C 65,36 82,30 88,40 C 78,42 66,42 56,44 C 70,48 86,47 90,56 C 76,57 60,54 48,58 C 48,68 56,76 66,80 C 58,82 46,78 42,70 C 40,78 36,88 28,94 C 30,86 34,78 36,70 C 28,74 20,70 16,62 C 22,63 30,62 34,56 C 26,56 14,48 12,38 C 20,41 28,40 34,36 C 26,32 18,24 22,16 C 26,22 34,24 40,26 C 42,20 44,14 50,10 Z" stroke="{{COLOR}}" stroke-width="2" stroke-linejoin="round" fill="{{COLOR}}" fill-opacity="0.14" /><circle cx="48" cy="22" r="2.5" fill="{{COLOR}}" /></svg>`,
  },
  {
    id: "skull",
    label: "Gothic Skull",
    category: "gothic",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><path d="M 22,46 C 22,24 34,14 50,14 C 66,14 78,24 78,46 C 78,56 74,62 68,66 L 68,78 C 68,82 62,86 58,86 L 42,86 C 38,86 32,82 32,78 L 32,66 C 26,62 22,56 22,46 Z" stroke="{{COLOR}}" stroke-width="2.5" stroke-linejoin="round" fill="{{COLOR}}" fill-opacity="0.1" /><path d="M 32,48 C 32,42 42,42 44,48 C 44,54 34,56 32,48 Z" stroke="{{COLOR}}" stroke-width="2" fill="{{COLOR}}" fill-opacity="0.25" /><path d="M 68,48 C 68,42 58,42 56,48 C 56,54 66,56 68,48 Z" stroke="{{COLOR}}" stroke-width="2" fill="{{COLOR}}" fill-opacity="0.25" /><polygon points="50,56 46,65 54,65" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.3" /><line x1="42" y1="74" x2="42" y2="84" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="50" y1="74" x2="50" y2="84" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="58" y1="74" x2="58" y2="84" stroke="{{COLOR}}" stroke-width="1.8" /><line x1="36" y1="78" x2="64" y2="78" stroke="{{COLOR}}" stroke-width="1.5" /></svg>`,
  },
  {
    id: "compass",
    label: "Star Compass",
    category: "classic",
    svgTemplate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="46" stroke="{{COLOR}}" stroke-width="2" /><circle cx="50" cy="50" r="40" stroke="{{COLOR}}" stroke-width="1" stroke-dasharray="3 3" /><circle cx="50" cy="50" r="16" stroke="{{COLOR}}" stroke-width="1.2" /><polygon points="50,6 54,42 50,50 46,42" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.2" /><polygon points="50,94 54,58 50,50 46,58" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.2" /><polygon points="6,50 42,46 50,50 42,54" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.2" /><polygon points="94,50 58,46 50,50 58,54" stroke="{{COLOR}}" stroke-width="1.5" fill="{{COLOR}}" fill-opacity="0.2" /><polygon points="19,19 46,44 50,50 44,46" stroke="{{COLOR}}" stroke-width="1.2" fill="{{COLOR}}" fill-opacity="0.12" /><polygon points="81,19 54,44 50,50 56,46" stroke="{{COLOR}}" stroke-width="1.2" fill="{{COLOR}}" fill-opacity="0.12" /><polygon points="19,81 44,56 50,50 46,54" stroke="{{COLOR}}" stroke-width="1.2" fill="{{COLOR}}" fill-opacity="0.12" /><polygon points="81,81 56,54 50,50 54,56" stroke="{{COLOR}}" stroke-width="1.2" fill="{{COLOR}}" fill-opacity="0.12" /><circle cx="50" cy="50" r="4" fill="{{COLOR}}" /></svg>`,
  },
];

const WATERMARKS: Record<string, WatermarkDefinition> = Object.fromEntries(
  WATERMARK_LIST.map((w) => [w.id, w])
);

// Map rune-circle as alias to arcane-circle
WATERMARKS["rune-circle"] = {
  ...WATERMARKS["arcane-circle"],
  id: "rune-circle",
};

export function isKnownWatermark(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(WATERMARKS, id);
}

export function getWatermark(id: string | undefined): WatermarkDefinition {
  return isKnownWatermark(id) ? WATERMARKS[id] : WATERMARKS[FALLBACK_WATERMARK_ID];
}

export function listWatermarks(): WatermarkDefinition[] {
  return WATERMARK_LIST;
}

/**
 * Renders watermark SVG to a data URI, with literal color substitution
 * and embedded root opacity.
 */
export function renderWatermarkSvg(
  id: string,
  color: string,
  opacity: number = DEFAULT_WATERMARK_OPACITY
): string | undefined {
  const wm = getWatermark(id);
  if (!wm || wm.id === "none" || !wm.svgTemplate) return undefined;

  const resolved = resolveLiteralColor(color, "#e06c75");
  const clampedOpacity = Math.max(0, Math.min(1, opacity));

  // Replace {{COLOR}} placeholders and inject root opacity
  let svg = wm.svgTemplate.replaceAll("{{COLOR}}", resolved);
  svg = svg.replace("<svg ", `<svg opacity="${clampedOpacity}" `);

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Resolves a watermark as a BackgroundLayer for CSS composition (Layer 5).
 */
export function renderWatermarkLayer(
  id: string | undefined,
  ctx: {
    color: string;
    opacity?: number;
    position?: string;
    size?: string;
  }
): BackgroundLayer | undefined {
  if (!id || id === "none") return undefined;
  const svgUri = renderWatermarkSvg(id, ctx.color, ctx.opacity ?? DEFAULT_WATERMARK_OPACITY);
  if (!svgUri) return undefined;

  return {
    image: `url("${svgUri}")`,
    size: ctx.size ?? "min(220px, 65%) min(220px, 65%)",
    repeat: "no-repeat",
    position: getWatermarkCssPosition(ctx.position),
  };
}
