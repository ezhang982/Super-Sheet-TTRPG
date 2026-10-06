import type { CSSProperties } from "react";
import type { BlockStyle, GlobalTheme } from "../types/schema";
import {
  FALLBACK_CORNER_ID,
  FALLBACK_FRAME_ID,
  getCorner,
  getFrame,
  getShading,
  getShape,
  isKnownCorner,
  isKnownFrame,
  isKnownShading,
  isKnownShape,
  renderCornerSvg,
} from "./registry";
import { getTexture, isKnownPattern, isKnownTexture, renderPattern } from "./patterns";
import type { BackgroundLayer, ResolvedBlockStyle, ResolvedCorner } from "./types";

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
// Layers 2-4 are CSS background images. In CSS the FIRST listed image is on
// top, so the list is built top-down: scrim, tint wash, url image, pattern,
// texture. The scrim sits above all of them (and below content) so it can
// protect text over busy art.
// =============================================================================

const SCRIM_LAYER: BackgroundLayer = {
  image: "linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.45))",
  size: "100% 100%",
  repeat: "no-repeat",
  position: "0 0",
};

/** Default strength of card and canvas patterns (the slider's starting point). */
export const DEFAULT_PATTERN_OPACITY = 0.5;

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

function resolveTextureId(style: BlockStyle | undefined, theme: GlobalTheme): string | undefined {
  return [style?.texture, theme.defaultTexture].find((id) => isKnownTexture(id));
}

function resolvePatternId(style: BlockStyle | undefined, theme: GlobalTheme): string | undefined {
  return [style?.pattern, theme.defaultPattern].find((id) => isKnownPattern(id));
}

function resolveCornerId(style: BlockStyle | undefined, theme: GlobalTheme): string {
  return [style?.corners, theme.defaultCorners].find((id) => isKnownCorner(id)) ?? FALLBACK_CORNER_ID;
}

function mixedCardBackground(opacity: number): string {
  if (opacity >= 1) return "var(--card-bg)";
  if (opacity <= 0) return "transparent";
  // Mix the THEME card color (not a hard-coded one) with transparency.
  const pct = Math.round(opacity * 1000) / 10;
  return `color-mix(in srgb, var(--card-bg) ${pct}%, transparent)`;
}

function layersToCss(layers: BackgroundLayer[]): CSSProperties {
  if (!layers.length) return {};
  return {
    backgroundImage: layers.map((l) => l.image).join(", "),
    backgroundSize: layers.map((l) => l.size).join(", "),
    backgroundRepeat: layers.map((l) => l.repeat ?? "no-repeat").join(", "),
    backgroundPosition: layers.map((l) => l.position ?? "center").join(", "),
  };
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
  const texture = getTexture(resolveTextureId(style, theme));
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
  if (texture.shadow) fx.push(texture.shadow);

  // Background image layers, TOP to BOTTOM.
  const layers: BackgroundLayer[] = [];
  if (style?.scrim ?? theme.defaultScrim ?? false) layers.push(SCRIM_LAYER);
  if (tint) {
    layers.push({
      image: `linear-gradient(180deg, color-mix(in srgb, ${tint} 14%, transparent), transparent 70%)`,
      size: "cover",
      repeat: "no-repeat",
    });
  }
  if (style?.backgroundUrl) {
    layers.push({ image: `url(${style.backgroundUrl})`, size: "cover", repeat: "no-repeat" });
  }
  const pattern = renderPattern(resolvePatternId(style, theme), {
    color: tint || theme.accentColor,
    opacity: theme.cardPatternOpacity ?? DEFAULT_PATTERN_OPACITY,
    scale: 1,
  });
  if (pattern) layers.push({ position: "0 0", ...pattern });
  if (texture.layer) layers.push({ position: "0 0", ...texture.layer });

  // See-through textures (glass) need a translucent card to show anything.
  const opacity = style?.backgroundOpacity ?? texture.translucentBg;

  const css = {
    borderColor: color,
    ...frame.style,
    ...shape.style,
    backgroundColor: opacity === undefined ? "var(--card-bg)" : mixedCardBackground(opacity),
    ...layersToCss(layers),
    ...(fx.length ? { "--card-fx": fx.join(", ") } : {}),
    ...(isChamfer ? { "--shape-line": frame.lineColor ?? color } : {}),
  } as CSSProperties;

  const className = [frame.className, shape.className, texture.className]
    .filter(Boolean)
    .join(" ");

  const cornerId = resolveCornerId(style, theme);
  let corner: ResolvedCorner | undefined;
  if (cornerId !== FALLBACK_CORNER_ID) {
    const cornerSvg = renderCornerSvg(
      cornerId,
      style?.borderColor || tint || theme.borderColor,
      tint || theme.accentColor
    );
    if (cornerSvg) {
      corner = {
        id: cornerId,
        svg: cornerSvg,
        size: getCorner(cornerId).size ?? 32,
      };
    }
  }

  return { className, style: css, corner };
}

/**
 * Resolve a single design in isolation for picker thumbnails: sheet defaults are
 * stripped so the thumbnail shows only the design being previewed, and patterns
 * render at full strength so they are visible at thumbnail size.
 */
export function resolvePreviewStyle(
  style: BlockStyle,
  theme: GlobalTheme
): ResolvedBlockStyle {
  return resolveBlockStyle(style, {
    ...theme,
    defaultFrame: undefined,
    defaultCorners: undefined,
    defaultShape: undefined,
    defaultShading: undefined,
    defaultGlow: undefined,
    defaultTexture: undefined,
    defaultPattern: undefined,
    defaultScrim: undefined,
    cardPatternOpacity: 1,
  });
}

/**
 * The canvas (page background) pattern, as CSS values for the
 * `--canvas-pattern-image` / `--canvas-pattern-size` custom properties.
 * Returns undefined when no pattern is selected.
 */
export function resolveCanvasPattern(
  theme: GlobalTheme
): { image: string; size: string } | undefined {
  const layer = renderPattern(isKnownPattern(theme.canvasPattern) ? theme.canvasPattern : undefined, {
    color: theme.accentColor,
    opacity: theme.canvasPatternOpacity ?? DEFAULT_PATTERN_OPACITY,
    scale: theme.canvasPatternScale ?? 1,
  });
  return layer ? { image: layer.image, size: layer.size } : undefined;
}
