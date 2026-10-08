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

/** One CSS background layer (comma-separated lists are allowed for multi-image). */
export interface BackgroundLayer {
  image: string;
  size: string;
  repeat?: string;
  position?: string;
}

export interface PatternContext {
  /** A literal color (SVG data URIs cannot read CSS variables). */
  color: string;
  /** 0..1 multiplier on the pattern's designed maximum strength. */
  opacity: number;
  /** Tile size multiplier. */
  scale: number;
}

/** Tileable pattern, usable on the canvas and on cards. */
export interface PatternDefinition {
  id: string;
  label: string;
  /** Returns undefined for the "none" pattern. */
  render: (ctx: PatternContext) => BackgroundLayer | undefined;
}

/** Card surface texture (grain, carbon, glass...). */
export interface TextureDefinition {
  id: string;
  label: string;
  layer?: BackgroundLayer;
  /** Extra class on the card (e.g. for backdrop-filter, which is not an image). */
  className?: string;
  /** Extra box-shadow layer (e.g. a glass highlight). */
  shadow?: string;
  /**
   * Card background opacity to use when the card has no explicit
   * backgroundOpacity, so see-through textures (glass) actually show through.
   */
  translucentBg?: number;
}

/** Corner accent definition (modular decorative overlay on the 4 card corners). */
export interface CornerDefinition {
  id: string;
  label: string;
  category: StyleCategory;
  /** SVG content of the top-left corner, e.g. viewBox="0 0 32 32". */
  svgTemplate: string;
  /** Render size in pixels (default: 32). */
  size?: number;
}

/** Resolved corner accent ready for rendering on the card. */
export interface ResolvedCorner {
  id: string;
  svg: string;
  size: number;
}

/** Watermark definition (thematic emblem on card or canvas background). */
export interface WatermarkDefinition {
  id: string;
  label: string;
  category: StyleCategory;
  /** SVG template string with {{COLOR}} and/or {{ACCENT}} */
  svgTemplate: string;
  viewBox?: string;
}

/** Header divider definition (ornate divider/decal separating card header and body). */
export interface HeaderDividerDefinition {
  id: string;
  label: string;
  category: StyleCategory;
  /** Center decal SVG template with {{COLOR}} / {{ACCENT}}, or undefined for pure lines */
  decalSvg?: string;
  decalWidth?: number;
  decalHeight?: number;
  /** Style type: "line" | "fade" | "decal" | "none" */
  type: "line" | "fade" | "decal" | "none";
}

/** Final result handed to the card container component. */
export interface ResolvedBlockStyle {
  className: string;
  style: CSSProperties;
  corner?: ResolvedCorner;
  dividerId: string;
}
