import type { CSSProperties } from "react";
import type { FrameDefinition, ShadingDefinition, ShapeDefinition } from "./types";
import { SVG_FRAMES } from "./svgFrames";
export {
  FALLBACK_CORNER_ID,
  getCorner,
  isKnownCorner,
  listCorners,
  renderCornerSvg,
} from "./corners";
export {
  DEFAULT_CANVAS_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_OPACITY,
  FALLBACK_WATERMARK_ID,
  WATERMARK_POSITIONS,
  getWatermark,
  getWatermarkCssPosition,
  isKnownWatermark,
  listWatermarks,
  renderWatermarkLayer,
  renderWatermarkSvg,
} from "./watermarks";
export {
  FALLBACK_DIVIDER_ID,
  getDivider,
  isKnownDivider,
  listDividers,
  renderDividerDecalSvg,
} from "./dividers";

// =============================================================================
// STYLE REGISTRY
// The single list of built-in designs. Pickers loop over this; components never
// hard-code a design. Adding a design = adding one entry here (or one file that
// is imported here).
//
// Registered so far: frames (legacy six + metallic), shapes, inner shading.
// Later phases add corners/patterns/textures/watermarks with the same shape.
// =============================================================================

/** Id used whenever nothing valid is selected, or an id is unknown. */
export const FALLBACK_FRAME_ID = "solid";
export const FALLBACK_SHAPE_ID = "rect";
export const FALLBACK_SHADING_ID = "none";

// ---------- Frames ----------

/**
 * Gradient "metal" frame. Drawn as an overlay ring (`.frame-ring::before` in
 * App.css) so it follows rounded corners and works with translucent cards,
 * which a CSS gradient border-image would not.
 */
function metalFrame(
  id: string,
  label: string,
  gradient: string,
  lineColor: string
): FrameDefinition {
  return {
    id,
    label,
    category: "metallic",
    render: () => ({
      style: {
        borderStyle: "none",
        borderWidth: "0px",
        "--frame-gradient": gradient,
        "--frame-width": "3px",
      } as CSSProperties,
      className: "frame-ring",
      lineColor,
    }),
  };
}

const FRAME_LIST: FrameDefinition[] = [
  {
    id: "solid",
    label: "Solid",
    category: "classic",
    render: () => ({ style: { borderStyle: "solid", borderWidth: "1px" } }),
  },
  {
    id: "none",
    label: "None",
    category: "classic",
    render: () => ({
      style: { borderStyle: "none", borderWidth: "0px" },
      lineColor: "transparent",
    }),
  },
  {
    id: "double",
    label: "Double",
    category: "classic",
    render: () => ({ style: { borderStyle: "double", borderWidth: "3px" } }),
  },
  {
    id: "dashed",
    label: "Dashed",
    category: "classic",
    render: () => ({ style: { borderStyle: "dashed", borderWidth: "1px" } }),
  },
  {
    id: "groove",
    label: "Groove",
    category: "classic",
    render: () => ({ style: { borderStyle: "groove", borderWidth: "1px" } }),
  },
  {
    id: "ornate",
    label: "Ornate Fantasy",
    category: "fantasy",
    // The extra glow/shadow still lives in App.css under `.border-ornate`.
    // It moves into this definition when Phase 3 replaces it with an SVG frame.
    render: () => ({
      style: { borderStyle: "double", borderWidth: "4px" },
      className: "border-ornate",
    }),
  },
  metalFrame(
    "gold",
    "Polished Gold",
    "linear-gradient(135deg, #8a6a1f, #f6e27a 25%, #b8860b 50%, #fff2a8 75%, #8a6a1f)",
    "#c9a227"
  ),
  metalFrame(
    "silver",
    "Brushed Silver",
    "linear-gradient(135deg, #6b7280, #f3f4f6 25%, #9ca3af 50%, #ffffff 75%, #6b7280)",
    "#b8bdc6"
  ),
  metalFrame(
    "bronze",
    "Aged Bronze",
    "linear-gradient(135deg, #6b3f1d, #e0a370 25%, #8c5a2b 50%, #f0c9a0 75%, #6b3f1d)",
    "#a8703c"
  ),
  metalFrame(
    "foil",
    "Accent Foil",
    "linear-gradient(135deg, color-mix(in srgb, var(--accent-color) 55%, black), var(--accent-color) 30%, color-mix(in srgb, var(--accent-color) 55%, white) 55%, var(--accent-color) 80%, color-mix(in srgb, var(--accent-color) 55%, black))",
    "var(--accent-color)"
  ),
  ...SVG_FRAMES,
];

const FRAMES: Record<string, FrameDefinition> = Object.fromEntries(
  FRAME_LIST.map((f) => [f.id, f])
);

export function isKnownFrame(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(FRAMES, id);
}

/** Look up a frame; unknown/undefined ids fall back to the solid frame. */
export function getFrame(id: string | undefined): FrameDefinition {
  return isKnownFrame(id) ? FRAMES[id] : FRAMES[FALLBACK_FRAME_ID];
}

export function listFrames(): FrameDefinition[] {
  return FRAME_LIST;
}

// ---------- Shapes ----------

const SHAPE_LIST: ShapeDefinition[] = [
  { id: "rect", label: "Standard" },
  { id: "rounded", label: "Rounded", style: { borderRadius: "22px" } },
  { id: "sharp", label: "Sharp", style: { borderRadius: "0px" } },
  // Cut corners via clip-path; see `.shape-chamfer` in App.css.
  { id: "chamfer", label: "Chamfer (Sci-Fi)", className: "shape-chamfer" },
];

const SHAPES: Record<string, ShapeDefinition> = Object.fromEntries(
  SHAPE_LIST.map((s) => [s.id, s])
);

export function isKnownShape(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(SHAPES, id);
}

export function getShape(id: string | undefined): ShapeDefinition {
  return isKnownShape(id) ? SHAPES[id] : SHAPES[FALLBACK_SHAPE_ID];
}

export function listShapes(): ShapeDefinition[] {
  return SHAPE_LIST;
}

// ---------- Inner shading ----------

const SHADING_LIST: ShadingDefinition[] = [
  { id: "none", label: "None" },
  { id: "soft", label: "Soft Depth", shadow: "inset 0 0 18px rgba(0, 0, 0, 0.35)" },
  { id: "deep", label: "Deep Recess", shadow: "inset 0 0 36px rgba(0, 0, 0, 0.6)" },
  {
    id: "vignette",
    label: "Vignette",
    shadow: "inset 0 0 60px 10px rgba(0, 0, 0, 0.55)",
  },
];

const SHADINGS: Record<string, ShadingDefinition> = Object.fromEntries(
  SHADING_LIST.map((s) => [s.id, s])
);

export function isKnownShading(id: string | undefined): id is string {
  return !!id && Object.prototype.hasOwnProperty.call(SHADINGS, id);
}

export function getShading(id: string | undefined): ShadingDefinition {
  return isKnownShading(id) ? SHADINGS[id] : SHADINGS[FALLBACK_SHADING_ID];
}

export function listShadings(): ShadingDefinition[] {
  return SHADING_LIST;
}
