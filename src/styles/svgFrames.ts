import type { CSSProperties } from "react";
import type { FrameDefinition, FrameRenderContext, StyleCategory } from "./types";

// =============================================================================
// SVG FRAME ENGINE (Phase 3)
//
// 9-slice SVG border generator.
// Built-in starter frames and future user-supplied SVGs (Phase 5) share the
// exact same template contract and tint pipeline.
//
// TEMPLATE CONTRACT:
// 1. SVGs are specified with viewBox="0 0 96 96" (standardized canvas size).
// 2. 9-slice cut inset is 32 units, dividing into 3x3 regions (corners 32x32,
//    rails 32x32, center 32x32).
// 3. Rails and corners align seamlessly at x=32, x=64 and y=32, y=64.
// 4. Placeholders for dynamic tinting:
//    - {{COLOR}}: Primary border/frame color (resolved from card or theme).
//    - {{ACCENT}}: Highlight/accent color (resolved from card tint or theme).
//    - currentColor: Alias for {{COLOR}}.
// 5. Encoded as data:image/svg+xml with full URI encoding so # and other
//    characters parse correctly in all browser rendering engines.
// =============================================================================

/** Resolves a color string for literal injection into SVG data URIs. */
export function resolveLiteralColor(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  const trimmed = color.trim();
  // SVG data URIs cannot evaluate CSS variables or CSS color-mix expressions.
  if (trimmed.startsWith("var(") || trimmed.startsWith("color-mix(")) {
    return fallback;
  }
  return trimmed;
}

export interface SvgFrameConfig {
  id: string;
  label: string;
  category: StyleCategory;
  /**
   * SVG markup with viewBox (typically 0 0 96 96).
   * Supports {{COLOR}} and {{ACCENT}} placeholders.
   */
  svgTemplate: string;
  /** 9-slice cut inset in SVG viewBox units (unitless, e.g. 32). */
  slice: number;
  /** CSS border-width applied to the card (default: 16). */
  borderWidth?: number | string;
  /** border-image-repeat behavior (default: "repeat"). */
  repeat?: "repeat" | "round" | "stretch";
  /** Optional extra padding for card content to prevent ornate corner occlusion. */
  padX?: number;
  padY?: number;
  /** Optional color for chamfer cut lines fallback. */
  lineColor?: string;
}

/** Builds a FrameDefinition from an SVG template and 9-slice slicing rules. */
export function build9SliceFrame(config: SvgFrameConfig): FrameDefinition {
  const {
    id,
    label,
    category,
    svgTemplate,
    slice,
    borderWidth = 16,
    repeat = "repeat",
    padX = 0,
    padY = 0,
    lineColor,
  } = config;

  const bw = typeof borderWidth === "number" ? `${borderWidth}px` : borderWidth;

  return {
    id,
    label,
    category,
    render: (ctx: FrameRenderContext) => {
      const resolvedColor = resolveLiteralColor(ctx.color, ctx.theme.borderColor);
      const resolvedAccent = resolveLiteralColor(ctx.accent, ctx.theme.accentColor);

      const svg = svgTemplate
        .replace(/\{\{COLOR\}\}/g, resolvedColor)
        .replace(/\{\{ACCENT\}\}/g, resolvedAccent)
        .replace(/currentColor/g, resolvedColor);

      const encoded = `data:image/svg+xml,${encodeURIComponent(svg)}`;

      const style: CSSProperties = {
        borderStyle: "solid",
        borderWidth: bw,
        borderImageSource: `url("${encoded}")`,
        borderImageSlice: `${slice}`,
        borderImageRepeat: repeat,
        borderRadius: "0px",
      };

      if (padX > 0) {
        (style as Record<string, unknown>)["--frame-pad-x"] = `${padX}px`;
      }
      if (padY > 0) {
        (style as Record<string, unknown>)["--frame-pad-y"] = `${padY}px`;
      }

      return {
        style,
        className: `frame-svg frame-${id}`,
        lineColor: lineColor ?? resolvedColor,
      };
    },
  };
}

// -----------------------------------------------------------------------------
// SVG FRAME DEFINITIONS (~10+ starter frames across 4 families)
// -----------------------------------------------------------------------------

// 1. FANTASY: Filigree
const FILIGREE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="10" x2="64" y2="10" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="13" r="1.5" fill="{{ACCENT}}" />

  <line x1="32" y1="86" x2="64" y2="86" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="83" r="1.5" fill="{{ACCENT}}" />

  <line x1="10" y1="32" x2="10" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="13" cy="48" r="1.5" fill="{{ACCENT}}" />

  <line x1="86" y1="32" x2="86" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="83" cy="48" r="1.5" fill="{{ACCENT}}" />

  <!-- Top-Left Corner -->
  <path d="M 10 32 L 10 20 C 10 14 14 10 20 10 L 32 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 32 L 16 22 C 16 18 18 16 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 10 20 C 6 16 7 10 12 10 C 16 10 18 14 18 18 C 18 22 14 24 11 22" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="12" cy="12" r="2" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 86 32 L 86 20 C 86 14 82 10 76 10 L 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 32 L 80 22 C 80 18 78 16 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 86 20 C 90 16 89 10 84 10 C 80 10 78 14 78 18 C 78 22 82 24 85 22" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="84" cy="12" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 10 64 L 10 76 C 10 82 14 86 20 86 L 32 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 64 L 16 74 C 16 78 18 80 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 10 76 C 6 80 7 86 12 86 C 16 86 18 82 18 78 C 18 74 14 72 11 74" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="12" cy="84" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 86 64 L 86 76 C 86 82 82 86 76 86 L 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 64 L 80 74 C 80 78 78 80 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 86 76 C 90 80 89 86 84 86 C 80 86 78 82 78 78 C 78 74 82 72 85 74" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="84" cy="84" r="2" fill="{{ACCENT}}" />
</svg>`;

// 2. FANTASY: Royal Scroll
const SCROLL_ROYAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="48,10 50,12 48,14 46,12" fill="{{ACCENT}}" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="48,82 50,84 48,86 46,84" fill="{{ACCENT}}" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="10,48 12,50 14,48 12,46" fill="{{ACCENT}}" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="82,48 84,50 86,48 84,46" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Royal Fleur & Bracket -->
  <path d="M 8 32 L 8 16 C 8 11 11 8 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 32 L 16 22 C 16 18 18 16 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="14" r="5" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="14" cy="14" r="2.5" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 C 88 11 85 8 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 32 L 80 22 C 80 18 78 16 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="14" r="5" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="82" cy="14" r="2.5" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 C 8 85 11 88 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 64 L 16 74 C 16 78 18 80 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="82" r="5" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="14" cy="82" r="2.5" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 C 88 85 85 88 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 64 L 80 74 C 80 78 78 80 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="82" r="5" stroke="{{COLOR}}" stroke-width="1" fill="none" />
  <circle cx="82" cy="82" r="2.5" fill="{{ACCENT}}" />
</svg>`;

// 3. FANTASY: Ancient Runic
const RUNIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="18" x2="64" y2="18" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 44 10 L 44 16 M 44 11 L 48 13.5 M 44 14 L 48 16" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <path d="M 52 10 L 52 16 M 49 11 L 52 13.5 M 49 16 L 52 13.5" stroke="{{ACCENT}}" stroke-width="1" stroke-linecap="round" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="78" x2="64" y2="78" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 44 80 L 44 86 M 44 81 L 48 83.5" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <path d="M 52 80 L 52 86 M 49 81 L 52 83.5" stroke="{{ACCENT}}" stroke-width="1" stroke-linecap="round" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="18" y1="32" x2="18" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 10 44 L 16 44 M 11 44 L 13.5 48" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <path d="M 10 52 L 16 52 M 11 49 L 13.5 52" stroke="{{ACCENT}}" stroke-width="1" stroke-linecap="round" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="78" y1="32" x2="78" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 44 L 86 44 M 81 44 L 83.5 48" stroke="{{COLOR}}" stroke-width="1" stroke-linecap="round" />
  <path d="M 80 52 L 86 52 M 81 49 L 83.5 52" stroke="{{ACCENT}}" stroke-width="1" stroke-linecap="round" />

  <!-- Top-Left Corner: Arcane Sigil Circle -->
  <path d="M 8 32 L 8 16 L 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 18 32 L 18 20 L 20 18 L 32 18" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="15" cy="15" r="5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="15" cy="15" r="2" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 L 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 78 32 L 78 20 L 76 18 L 64 18" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="81" cy="15" r="5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="81" cy="15" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 L 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 18 64 L 18 76 L 20 78 L 32 78" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="15" cy="81" r="5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="15" cy="81" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 L 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 78 64 L 78 76 L 76 78 L 64 78" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="81" cy="81" r="5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="81" cy="81" r="2" fill="{{ACCENT}}" />
</svg>`;

// 4. FANTASY: Celestial (Star medallions and arched filigree)
const CELESTIAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="14" x2="64" y2="14" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="11" r="1.5" fill="{{ACCENT}}" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="82" x2="64" y2="82" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="85" r="1.5" fill="{{ACCENT}}" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="14" y1="32" x2="14" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="11" cy="48" r="1.5" fill="{{ACCENT}}" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="82" y1="32" x2="82" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="85" cy="48" r="1.5" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Medallion Starburst -->
  <path d="M 8 32 L 8 16 C 8 11 11 8 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 32 L 14 20 C 14 16 16 14 20 14 L 32 14" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="15" cy="15" r="6" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="15,10 16.5,13.5 20,15 16.5,16.5 15,20 13.5,16.5 10,15 13.5,13.5" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 C 88 11 85 8 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 32 L 82 20 C 82 16 80 14 76 14 L 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="81" cy="15" r="6" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="81,10 82.5,13.5 86,15 82.5,16.5 81,20 79.5,16.5 76,15 79.5,13.5" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 C 8 85 11 88 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 64 L 14 76 C 14 80 16 82 20 82 L 32 82" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="15" cy="81" r="6" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="15,76 16.5,79.5 20,81 16.5,82.5 15,86 13.5,82.5 10,81 13.5,79.5" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 C 88 85 85 88 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 64 L 82 76 C 82 80 80 82 76 82 L 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="81" cy="81" r="6" stroke="{{COLOR}}" stroke-width="1" />
  <polygon points="81,76 82.5,79.5 86,81 82.5,82.5 81,86 79.5,82.5 76,81 79.5,79.5" fill="{{ACCENT}}" />
</svg>`;

// 5. SCI-FI: Tech Brackets / HUD
const TECH_BRACKETS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="1.5" stroke-dasharray="8 3" />
  <line x1="32" y1="14" x2="64" y2="14" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="47" y="10" width="2" height="2" fill="{{ACCENT}}" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="1.5" stroke-dasharray="8 3" />
  <line x1="32" y1="82" x2="64" y2="82" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="47" y="84" width="2" height="2" fill="{{ACCENT}}" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="1.5" stroke-dasharray="8 3" />
  <line x1="14" y1="32" x2="14" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="10" y="47" width="2" height="2" fill="{{ACCENT}}" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="1.5" stroke-dasharray="8 3" />
  <line x1="82" y1="32" x2="82" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="84" y="47" width="2" height="2" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: HUD Crosshairs & 45deg Chamfer -->
  <path d="M 8 32 L 8 16 L 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 14 32 L 14 20 L 20 14 L 32 14" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="11" y1="11" x2="21" y2="21" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="16" cy="16" r="2" fill="{{ACCENT}}" />
  <line x1="6" y1="16" x2="10" y2="16" stroke="{{ACCENT}}" stroke-width="1" />
  <line x1="16" y1="6" x2="16" y2="10" stroke="{{ACCENT}}" stroke-width="1" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 L 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 82 32 L 82 20 L 76 14 L 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="85" y1="11" x2="75" y2="21" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="80" cy="16" r="2" fill="{{ACCENT}}" />
  <line x1="90" y1="16" x2="86" y2="16" stroke="{{ACCENT}}" stroke-width="1" />
  <line x1="80" y1="6" x2="80" y2="10" stroke="{{ACCENT}}" stroke-width="1" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 L 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 14 64 L 14 76 L 20 82 L 32 82" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="11" y1="85" x2="21" y2="75" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="16" cy="80" r="2" fill="{{ACCENT}}" />
  <line x1="6" y1="80" x2="10" y2="80" stroke="{{ACCENT}}" stroke-width="1" />
  <line x1="16" y1="90" x2="16" y2="86" stroke="{{ACCENT}}" stroke-width="1" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 L 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 82 64 L 82 76 L 76 82 L 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="85" y1="85" x2="75" y2="75" stroke="{{COLOR}}" stroke-width="0.75" />
  <circle cx="80" cy="80" r="2" fill="{{ACCENT}}" />
  <line x1="90" y1="80" x2="86" y2="80" stroke="{{ACCENT}}" stroke-width="1" />
  <line x1="80" y1="90" x2="80" y2="86" stroke="{{ACCENT}}" stroke-width="1" />
</svg>`;

// 6. SCI-FI: Circuit Edge (PCB Traces)
const CIRCUIT_EDGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="10" x2="64" y2="10" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="10" r="2.5" fill="{{ACCENT}}" />
  <circle cx="48" cy="10" r="1" fill="#14161b" />

  <line x1="32" y1="86" x2="64" y2="86" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="48" cy="86" r="2.5" fill="{{ACCENT}}" />
  <circle cx="48" cy="86" r="1" fill="#14161b" />

  <line x1="10" y1="32" x2="10" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="10" cy="48" r="2.5" fill="{{ACCENT}}" />
  <circle cx="10" cy="48" r="1" fill="#14161b" />

  <line x1="86" y1="32" x2="86" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="86" cy="48" r="2.5" fill="{{ACCENT}}" />
  <circle cx="86" cy="48" r="1" fill="#14161b" />

  <!-- Top-Left Corner: Via pads and 45deg routing -->
  <path d="M 10 32 L 10 18 L 18 10 L 32 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 32 L 16 22 L 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="12" cy="12" r="3" stroke="{{COLOR}}" stroke-width="1.2" />
  <circle cx="12" cy="12" r="1.5" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 86 32 L 86 18 L 78 10 L 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 32 L 80 22 L 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="84" cy="12" r="3" stroke="{{COLOR}}" stroke-width="1.2" />
  <circle cx="84" cy="12" r="1.5" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 10 64 L 10 78 L 18 86 L 32 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 64 L 16 74 L 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="12" cy="84" r="3" stroke="{{COLOR}}" stroke-width="1.2" />
  <circle cx="12" cy="84" r="1.5" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 86 64 L 86 78 L 78 86 L 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 64 L 80 74 L 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="84" cy="84" r="3" stroke="{{COLOR}}" stroke-width="1.2" />
  <circle cx="84" cy="84" r="1.5" fill="{{ACCENT}}" />
</svg>`;

// 7. SCI-FI: Holo Terminal (Clean Futuristic Screen)
const HOLO_TERMINAL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="14" x2="64" y2="14" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="44" y1="11" x2="52" y2="11" stroke="{{ACCENT}}" stroke-width="2" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="82" x2="64" y2="82" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="44" y1="85" x2="52" y2="85" stroke="{{ACCENT}}" stroke-width="2" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="14" y1="32" x2="14" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="11" y1="44" x2="11" y2="52" stroke="{{ACCENT}}" stroke-width="2" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="82" y1="32" x2="82" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="85" y1="44" x2="85" y2="52" stroke="{{ACCENT}}" stroke-width="2" />

  <!-- Top-Left Corner: Telemetry Signal Bars -->
  <path d="M 8 32 L 8 16 L 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 14 32 L 14 20 L 20 14 L 32 14" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="18" y="10" width="3" height="1.5" fill="{{ACCENT}}" />
  <rect x="18" y="12.5" width="5" height="1.5" fill="{{ACCENT}}" />
  <rect x="18" y="15" width="7" height="1.5" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 L 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 82 32 L 82 20 L 76 14 L 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="75" y="10" width="3" height="1.5" fill="{{ACCENT}}" />
  <rect x="73" y="12.5" width="5" height="1.5" fill="{{ACCENT}}" />
  <rect x="71" y="15" width="7" height="1.5" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 L 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 14 64 L 14 76 L 20 82 L 32 82" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="18" y="84.5" width="3" height="1.5" fill="{{ACCENT}}" />
  <rect x="18" y="82" width="5" height="1.5" fill="{{ACCENT}}" />
  <rect x="18" y="79.5" width="7" height="1.5" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 L 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 82 64 L 82 76 L 76 82 L 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <rect x="75" y="84.5" width="3" height="1.5" fill="{{ACCENT}}" />
  <rect x="73" y="82" width="5" height="1.5" fill="{{ACCENT}}" />
  <rect x="71" y="79.5" width="7" height="1.5" fill="{{ACCENT}}" />
</svg>`;

// 8. GOTHIC: Thorn Vine
const THORN_VINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <path d="M 32 10 Q 40 7 48 10 Q 56 13 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 32 14 Q 40 16 48 13 Q 56 11 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 42 8 L 44 5 L 43 9 Z" fill="{{COLOR}}" />
  <path d="M 54 12 L 56 15 L 53 13 Z" fill="{{COLOR}}" />
  <circle cx="48" cy="11.5" r="1.5" fill="{{ACCENT}}" />

  <path d="M 32 86 Q 40 83 48 86 Q 56 89 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 32 82 Q 40 80 48 83 Q 56 85 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 42 88 L 44 91 L 43 87 Z" fill="{{COLOR}}" />
  <circle cx="48" cy="84.5" r="1.5" fill="{{ACCENT}}" />

  <path d="M 10 32 Q 7 40 10 48 Q 13 56 10 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 32 Q 16 40 13 48 Q 11 56 14 64" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 8 42 L 5 44 L 9 43 Z" fill="{{COLOR}}" />
  <circle cx="11.5" cy="48" r="1.5" fill="{{ACCENT}}" />

  <path d="M 86 32 Q 83 40 86 48 Q 89 56 86 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 32 Q 80 40 83 48 Q 85 56 82 64" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 88 42 L 91 44 L 87 43 Z" fill="{{COLOR}}" />
  <circle cx="84.5" cy="48" r="1.5" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Briar Knots -->
  <path d="M 10 32 L 10 20 C 10 14 14 10 20 10 L 32 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 32 L 14 22 C 14 18 18 14 22 14 L 32 14" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 10 18 L 5 15 L 9 16 Z" fill="{{COLOR}}" />
  <path d="M 18 10 L 15 5 L 16 9 Z" fill="{{COLOR}}" />
  <circle cx="14" cy="14" r="2" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 86 32 L 86 20 C 86 14 82 10 76 10 L 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 32 L 82 22 C 82 18 78 14 74 14 L 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 86 18 L 91 15 L 87 16 Z" fill="{{COLOR}}" />
  <path d="M 78 10 L 81 5 L 80 9 Z" fill="{{COLOR}}" />
  <circle cx="82" cy="14" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 10 64 L 10 76 C 10 82 14 86 20 86 L 32 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 64 L 14 74 C 14 78 18 82 22 82 L 32 82" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 10 78 L 5 81 L 9 80 Z" fill="{{COLOR}}" />
  <path d="M 18 86 L 15 91 L 16 87 Z" fill="{{COLOR}}" />
  <circle cx="14" cy="82" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 86 64 L 86 76 C 86 82 82 86 76 86 L 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 64 L 82 74 C 82 78 78 82 74 82 L 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 86 78 L 91 81 L 87 80 Z" fill="{{COLOR}}" />
  <path d="M 78 86 L 81 91 L 80 87 Z" fill="{{COLOR}}" />
  <circle cx="82" cy="82" r="2" fill="{{ACCENT}}" />
</svg>`;

// 9. GOTHIC: Iron Spikes (Cathedral Spikes & Rivets)
const IRON_SPIKES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="48" cy="12" r="2" fill="{{COLOR}}" />
  <circle cx="48" cy="12" r="0.8" fill="{{ACCENT}}" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="48" cy="84" r="2" fill="{{COLOR}}" />
  <circle cx="48" cy="84" r="0.8" fill="{{ACCENT}}" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="12" cy="48" r="2" fill="{{COLOR}}" />
  <circle cx="12" cy="48" r="0.8" fill="{{ACCENT}}" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="84" cy="48" r="2" fill="{{COLOR}}" />
  <circle cx="84" cy="48" r="0.8" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Pointed Finial Spike & Stud -->
  <path d="M 8 32 L 8 16 L 3 10 L 10 3 L 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 16 32 L 16 22 L 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1.5" />
  <polygon points="14,11 17,14 14,17 11,14" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 L 93 10 L 86 3 L 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 80 32 L 80 22 L 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1.5" />
  <polygon points="82,11 85,14 82,17 79,14" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 L 3 86 L 10 93 L 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 16 64 L 16 74 L 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1.5" />
  <polygon points="14,81 17,84 14,87 11,84" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 L 93 86 L 86 93 L 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 80 64 L 80 74 L 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1.5" />
  <polygon points="82,81 85,84 82,87 79,84" fill="{{ACCENT}}" />
</svg>`;

// 10. GOTHIC: Bone Crypt (Ossuary Ribs & Skull Crest)
const BONE_CRYPT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <path d="M 32 10 Q 40 6 48 10 Q 56 6 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="40" cy="11" r="1.5" fill="{{COLOR}}" />
  <circle cx="48" cy="13" r="1.5" fill="{{ACCENT}}" />
  <circle cx="56" cy="11" r="1.5" fill="{{COLOR}}" />

  <path d="M 32 86 Q 40 90 48 86 Q 56 90 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="40" cy="85" r="1.5" fill="{{COLOR}}" />
  <circle cx="48" cy="83" r="1.5" fill="{{ACCENT}}" />
  <circle cx="56" cy="85" r="1.5" fill="{{COLOR}}" />

  <path d="M 10 32 Q 6 40 10 48 Q 6 56 10 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="11" cy="40" r="1.5" fill="{{COLOR}}" />
  <circle cx="13" cy="48" r="1.5" fill="{{ACCENT}}" />
  <circle cx="11" cy="56" r="1.5" fill="{{COLOR}}" />

  <path d="M 86 32 Q 90 40 86 48 Q 90 56 86 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="85" cy="40" r="1.5" fill="{{COLOR}}" />
  <circle cx="83" cy="48" r="1.5" fill="{{ACCENT}}" />
  <circle cx="85" cy="56" r="1.5" fill="{{COLOR}}" />

  <!-- Top-Left Corner: Bone Horns & Crest -->
  <path d="M 10 32 L 10 18 C 10 12 12 10 18 10 L 32 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 32 L 16 22 C 16 18 18 16 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="14" r="4" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="12.5" cy="13.5" r="0.9" fill="{{ACCENT}}" />
  <circle cx="15.5" cy="13.5" r="0.9" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 86 32 L 86 18 C 86 12 84 10 78 10 L 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 32 L 80 22 C 80 18 78 16 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="14" r="4" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="80.5" cy="13.5" r="0.9" fill="{{ACCENT}}" />
  <circle cx="83.5" cy="13.5" r="0.9" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 10 64 L 10 78 C 10 84 12 86 18 86 L 32 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 16 64 L 16 74 C 16 78 18 80 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="82" r="4" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="12.5" cy="81.5" r="0.9" fill="{{ACCENT}}" />
  <circle cx="15.5" cy="81.5" r="0.9" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 86 64 L 86 78 C 86 84 84 86 78 86 L 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 80 64 L 80 74 C 80 78 78 80 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="82" r="4" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="80.5" cy="81.5" r="0.9" fill="{{ACCENT}}" />
  <circle cx="83.5" cy="81.5" r="0.9" fill="{{ACCENT}}" />
</svg>`;

// 11. CLASSIC: Art Deco
const ART_DECO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="7" x2="64" y2="7" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="12" x2="64" y2="12" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="48,9 51,12 48,15 45,12" fill="{{ACCENT}}" />

  <line x1="32" y1="89" x2="64" y2="89" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="32" y1="84" x2="64" y2="84" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="48,81 51,84 48,87 45,84" fill="{{ACCENT}}" />

  <line x1="7" y1="32" x2="7" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="12" y1="32" x2="12" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="9,48 12,51 15,48 12,45" fill="{{ACCENT}}" />

  <line x1="89" y1="32" x2="89" y2="64" stroke="{{COLOR}}" stroke-width="1.5" />
  <line x1="84" y1="32" x2="84" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="81,48 84,51 87,48 84,45" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Stepped Concentric Chevrons -->
  <path d="M 7 32 L 7 14 L 14 7 L 32 7" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 12 32 L 12 18 L 18 12 L 32 12" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 16 32 L 16 22 L 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="14,14 17,14 14,17 11,14" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 89 32 L 89 14 L 82 7 L 64 7" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 84 32 L 84 18 L 78 12 L 64 12" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 80 32 L 80 22 L 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="82,14 85,14 82,17 79,14" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 7 64 L 7 82 L 14 89 L 32 89" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 12 64 L 12 78 L 18 84 L 32 84" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 16 64 L 16 74 L 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="14,82 17,82 14,85 11,82" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 89 64 L 89 82 L 82 89 L 64 89" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 84 64 L 84 78 L 78 84 L 64 84" stroke="{{COLOR}}" stroke-width="1" />
  <path d="M 80 64 L 80 74 L 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="0.75" />
  <polygon points="82,82 85,82 82,85 79,82" fill="{{ACCENT}}" />
</svg>`;

// 12. CLASSIC: Victorian (Parlor Molding with Pearl Fillets)
const VICTORIAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails -->
  <line x1="32" y1="8" x2="64" y2="8" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="16" x2="64" y2="16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="40" cy="12" r="1.5" fill="{{COLOR}}" />
  <circle cx="48" cy="12" r="1.5" fill="{{ACCENT}}" />
  <circle cx="56" cy="12" r="1.5" fill="{{COLOR}}" />

  <line x1="32" y1="88" x2="64" y2="88" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="32" y1="80" x2="64" y2="80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="40" cy="84" r="1.5" fill="{{COLOR}}" />
  <circle cx="48" cy="84" r="1.5" fill="{{ACCENT}}" />
  <circle cx="56" cy="84" r="1.5" fill="{{COLOR}}" />

  <line x1="8" y1="32" x2="8" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="16" y1="32" x2="16" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="12" cy="40" r="1.5" fill="{{COLOR}}" />
  <circle cx="12" cy="48" r="1.5" fill="{{ACCENT}}" />
  <circle cx="12" cy="56" r="1.5" fill="{{COLOR}}" />

  <line x1="88" y1="32" x2="88" y2="64" stroke="{{COLOR}}" stroke-width="2" />
  <line x1="80" y1="32" x2="80" y2="64" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="84" cy="40" r="1.5" fill="{{COLOR}}" />
  <circle cx="84" cy="48" r="1.5" fill="{{ACCENT}}" />
  <circle cx="84" cy="56" r="1.5" fill="{{COLOR}}" />

  <!-- Top-Left Corner: Carved Rosette Medallion -->
  <path d="M 8 32 L 8 16 C 8 11 11 8 16 8 L 32 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 16 32 L 16 22 C 16 18 18 16 22 16 L 32 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="14" r="4.5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="14" r="2" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 88 32 L 88 16 C 88 11 85 8 80 8 L 64 8" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 80 32 L 80 22 C 80 18 78 16 74 16 L 64 16" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="14" r="4.5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="14" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 8 64 L 8 80 C 8 85 11 88 16 88 L 32 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 16 64 L 16 74 C 16 78 18 80 22 80 L 32 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="82" r="4.5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="82" r="2" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 88 64 L 88 80 C 88 85 85 88 80 88 L 64 88" stroke="{{COLOR}}" stroke-width="2" />
  <path d="M 80 64 L 80 74 C 80 78 78 80 74 80 L 64 80" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="82" r="4.5" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="82" r="2" fill="{{ACCENT}}" />
</svg>`;

// 13. CLASSIC: Celtic Knotwork
const CELTIC_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Rails: Interwoven braided knot -->
  <path d="M 32 10 Q 36 14 40 14 Q 44 14 48 10 Q 52 6 56 6 Q 60 6 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 32 10 Q 36 6 40 6 Q 44 6 48 10 Q 52 14 56 14 Q 60 14 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="48" cy="10" r="1.5" fill="{{ACCENT}}" />

  <path d="M 32 86 Q 36 90 40 90 Q 44 90 48 86 Q 52 82 56 82 Q 60 82 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 32 86 Q 36 82 40 82 Q 44 82 48 86 Q 52 90 56 90 Q 60 90 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="48" cy="86" r="1.5" fill="{{ACCENT}}" />

  <path d="M 10 32 Q 14 36 14 40 Q 14 44 10 48 Q 6 52 6 56 Q 6 60 10 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 10 32 Q 6 36 6 40 Q 6 44 10 48 Q 14 52 14 56 Q 14 60 10 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="10" cy="48" r="1.5" fill="{{ACCENT}}" />

  <path d="M 86 32 Q 90 36 90 40 Q 90 44 86 48 Q 82 52 82 56 Q 82 60 86 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 86 32 Q 82 36 82 40 Q 82 44 86 48 Q 90 52 90 56 Q 90 60 86 64" stroke="{{COLOR}}" stroke-width="1.5" />
  <circle cx="86" cy="48" r="1.5" fill="{{ACCENT}}" />

  <!-- Top-Left Corner: Celtic Loop -->
  <path d="M 10 32 C 10 20 6 12 12 6 C 18 6 22 10 32 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 32 C 14 22 10 16 16 10 C 22 10 24 14 32 14" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="14" r="2.5" fill="{{ACCENT}}" />

  <!-- Top-Right Corner -->
  <path d="M 86 32 C 86 20 90 12 84 6 C 78 6 74 10 64 10" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 32 C 82 22 86 16 80 10 C 74 10 72 14 64 14" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="14" r="2.5" fill="{{ACCENT}}" />

  <!-- Bottom-Left Corner -->
  <path d="M 10 64 C 10 76 6 84 12 90 C 18 90 22 86 32 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 14 64 C 14 74 10 80 16 86 C 22 86 24 82 32 82" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="14" cy="82" r="2.5" fill="{{ACCENT}}" />

  <!-- Bottom-Right Corner -->
  <path d="M 86 64 C 86 76 90 84 84 90 C 78 90 74 86 64 86" stroke="{{COLOR}}" stroke-width="1.5" />
  <path d="M 82 64 C 82 74 86 80 80 86 C 74 86 72 82 64 82" stroke="{{COLOR}}" stroke-width="1" />
  <circle cx="82" cy="82" r="2.5" fill="{{ACCENT}}" />
</svg>`;

export const SVG_FRAMES: FrameDefinition[] = [
  // Fantasy family
  build9SliceFrame({
    id: "filigree",
    label: "Filigree",
    category: "fantasy",
    svgTemplate: FILIGREE_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "scroll-royal",
    label: "Royal Scroll",
    category: "fantasy",
    svgTemplate: SCROLL_ROYAL_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "runic",
    label: "Ancient Runic",
    category: "fantasy",
    svgTemplate: RUNIC_SVG,
    slice: 32,
    borderWidth: 18,
    padX: 4,
  }),
  build9SliceFrame({
    id: "celestial",
    label: "Celestial",
    category: "fantasy",
    svgTemplate: CELESTIAL_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),

  // Sci-Fi family
  build9SliceFrame({
    id: "tech-brackets",
    label: "Tech Brackets",
    category: "scifi",
    svgTemplate: TECH_BRACKETS_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "circuit-edge",
    label: "Circuit Edge",
    category: "scifi",
    svgTemplate: CIRCUIT_EDGE_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "holo-terminal",
    label: "Holo Terminal",
    category: "scifi",
    svgTemplate: HOLO_TERMINAL_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),

  // Gothic family
  build9SliceFrame({
    id: "thorn-vine",
    label: "Thorn Vine",
    category: "gothic",
    svgTemplate: THORN_VINE_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "iron-spikes",
    label: "Iron Spikes",
    category: "gothic",
    svgTemplate: IRON_SPIKES_SVG,
    slice: 32,
    borderWidth: 18,
    padX: 4,
  }),
  build9SliceFrame({
    id: "bone-crypt",
    label: "Bone Crypt",
    category: "gothic",
    svgTemplate: BONE_CRYPT_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),

  // Classic family
  build9SliceFrame({
    id: "art-deco",
    label: "Art Deco",
    category: "classic",
    svgTemplate: ART_DECO_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "victorian",
    label: "Victorian",
    category: "classic",
    svgTemplate: VICTORIAN_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
  build9SliceFrame({
    id: "celtic",
    label: "Celtic Knotwork",
    category: "classic",
    svgTemplate: CELTIC_SVG,
    slice: 32,
    borderWidth: 16,
    padX: 2,
  }),
];
