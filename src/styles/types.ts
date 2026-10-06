import type { CSSProperties } from "react";
import type { GlobalTheme } from "../types/schema";

// =============================================================================
// STYLE SYSTEM — SHARED TYPES
// Designs (frames, shapes, shading, and later corners/patterns/textures/
// watermarks) are defined in app code and referenced from the character
// document by string id only.
// =============================================================================

/** Colors a design may use when rendering. Resolved from the card + theme. */
export interface FrameRenderContext {
  /** Resolved border color (card override, tint, else `var(--border-color)`). */
  color: string;
  /** Resolved accent color (`var(--accent-color)`). */
  accent: string;
  theme: GlobalTheme;
}

/** What a frame contributes to the card container. */
export interface FrameOutput {
  /** Inline CSS for the card container (border, custom properties, etc.). */
  style: CSSProperties;
  /** Optional extra class on the card container. */
  className?: string;
  /**
   * Color for shape cut-lines (e.g. chamfered corners) so they match this
   * frame. Defaults to the resolved border color. Use "transparent" for none.
   */
  lineColor?: string;
}

export type StyleCategory = "classic" | "fantasy" | "scifi" | "gothic" | "metallic";

export interface FrameDefinition {
  id: string;
  label: string;
  category: StyleCategory;
  render: (ctx: FrameRenderContext) => FrameOutput;
}

/** Card outline shape (corner radius / cut corners). */
export interface ShapeDefinition {
  id: string;
  label: string;
  style?: CSSProperties;
  className?: string;
}

/** Inner shading (vignette / depth). Returns CSS box-shadow layer(s). */
export interface ShadingDefinition {
  id: string;
  label: string;
  /** `inset` box-shadow layer(s), or undefined for none. */
  shadow?: string;
}

/** Final result handed to the card container component. */
export interface ResolvedBlockStyle {
  className: string;
  style: CSSProperties;
}
