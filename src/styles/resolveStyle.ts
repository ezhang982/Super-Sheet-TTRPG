import type { CSSProperties } from "react";
import type { BlockStyle, GlobalTheme } from "../types/schema";
import {
  FALLBACK_FRAME_ID,
  getFrame,
  getShading,
  getShape,
  isKnownFrame,
  isKnownShading,
  isKnownShape,
} from "./registry";
import type { ResolvedBlockStyle } from "./types";

// =============================================================================
// resolveBlockStyle — the ONE function that turns style tokens into CSS.
//
// Token cascade (same for every token):
//   card token  ->  legacy card field  ->  sheet default token  ->  fallback
// An unknown id (newer save, deleted asset) is skipped and the cascade moves to
// the next candidate, so a bad card id falls through to a valid sheet default.
//
// LAYER ORDER (bottom -> top). Later phases add layers; this order is fixed so
// features never fight over paint order:
//   1 background color (+ opacity)   2 texture      3 pattern
//   4 backgroundUrl image            5 watermark    6 content
//   7 frame (border / ring overlay)  8 corner accents
//   9 glow / outer shadow            (+ inner shading, drawn as inset shadow)
// Implemented: 1, 4, 7, 9, inner shading, accent-tint wash (with layer 4).
// =============================================================================

function resolveFrameId(style: BlockStyle | undefined, theme: GlobalTheme): string {
  // `borderStyle` is the legacy field; its values are also valid frame ids.
  // Legacy "solid" was labelled "Theme Default (Solid)" in the old picker, so it
  // means "no override" and must not block the sheet default frame.
  const legacy = style?.borderStyle === "solid" ? undefined : style?.borderStyle;
  const candidates = [style?.frame, legacy, theme.defaultFrame];
  return candidates.find((id) => isKnownFrame(id)) ?? FALLBACK_FRAME_ID;
}

function resolveShapeId(style: BlockStyle | undefined, theme: GlobalTheme): string | undefined {
  return [style?.shape, theme.defaultShape].find((id) => isKnownShape(id));
}

function resolveShadingId(style: BlockStyle | undefined, theme: GlobalTheme): string | undefined {
  return [style?.shading, theme.defaultShading].find((id) => isKnownShading(id));
}

function resolveBackgroundColor(opacity: number | undefined): string {
  if (opacity === undefined || opacity >= 1) return "var(--card-bg)";
  if (opacity <= 0) return "transparent";
  // Mix the THEME card color (not a hard-coded one) with transparency.
  const pct = Math.round(opacity * 1000) / 10;
  return `color-mix(in srgb, var(--card-bg) ${pct}%, transparent)`;
}

export function resolveBlockStyle(
  style: BlockStyle | undefined,
  theme: GlobalTheme
): ResolvedBlockStyle {
  const tint = style?.accentTint || undefined;
  // Border color: explicit card color > accent tint > theme.
  const color = style?.borderColor || tint || "var(--border-color)";

  const frame = getFrame(resolveFrameId(style, theme)).render({
    color,
    accent: "var(--accent-color)",
    theme,
  });
  const shape = getShape(resolveShapeId(style, theme));
  const shading = getShading(resolveShadingId(style, theme));
  const isChamfer = shape.className === "shape-chamfer";

  // Box-shadow effects are composed in CSS from one custom property so the
  // base card shadow and hover elevation keep working (see `.block-container`).
  const fx: string[] = [];
  const glowOn = style?.glow ?? theme.defaultGlow ?? false;
  if (glowOn) {
    const glow = tint || "var(--accent-color)";
    const soft = `color-mix(in srgb, ${glow} 55%, transparent)`;
    const tight = `color-mix(in srgb, ${glow} 80%, transparent)`;
    // clip-path (chamfer) clips anything outside the card, so glow goes inside.
    fx.push(
      isChamfer
        ? `inset 0 0 22px ${soft}, inset 0 0 3px ${tight}`
        : `0 0 16px ${soft}, 0 0 3px ${tight}`
    );
  }
  if (shading.shadow) fx.push(shading.shadow);

  // Background image layers, top to bottom: tint wash, then the user's image.
  const images: string[] = [];
  if (tint) {
    images.push(
      `linear-gradient(180deg, color-mix(in srgb, ${tint} 14%, transparent), transparent 70%)`
    );
  }
  if (style?.backgroundUrl) images.push(`url(${style.backgroundUrl})`);

  const css = {
    borderColor: color,
    ...frame.style,
    ...shape.style,
    backgroundColor: resolveBackgroundColor(style?.backgroundOpacity),
    backgroundImage: images.length ? images.join(", ") : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
    ...(fx.length ? { "--card-fx": fx.join(", ") } : {}),
    ...(isChamfer ? { "--shape-line": frame.lineColor ?? color } : {}),
  } as CSSProperties;

  const className = [frame.className, shape.className].filter(Boolean).join(" ");
  return { className, style: css };
}

/**
 * Resolve a single design in isolation for picker thumbnails: sheet defaults are
 * stripped so the thumbnail shows only the design being previewed.
 */
export function resolvePreviewStyle(
  style: BlockStyle,
  theme: GlobalTheme
): ResolvedBlockStyle {
  return resolveBlockStyle(style, {
    ...theme,
    defaultFrame: undefined,
    defaultShape: undefined,
    defaultShading: undefined,
    defaultGlow: undefined,
  });
}
