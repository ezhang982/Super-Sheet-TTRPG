import React from "react";
import type { GlobalTheme } from "../types/schema";
import {
  getCorner,
  getDivider,
  getFrame,
  getShape,
  getWatermark,
  listCorners,
  listDividers,
  listFrames,
  listShapes,
  listWatermarks,
} from "../styles/registry";
import { getPattern, getTexture, listPatterns, listTextures } from "../styles/patterns";
import { resolvePreviewStyle } from "../styles/resolveStyle";
import type { StyleOption } from "./StyleOptionGrid";
import { CornerAccents } from "./CornerAccents";
import { HeaderDivider } from "./HeaderDivider";

// Builds picker tiles (with live previews) from the style registry, so the
// card modal and the theme drawer stay in sync with whatever designs exist.

export function buildFrameOptions(theme: GlobalTheme): StyleOption[] {
  return listFrames().map((f) => {
    const p = resolvePreviewStyle({ frame: f.id }, theme);
    return { id: f.id, label: f.label, previewClassName: p.className, previewStyle: p.style };
  });
}

export function buildShapeOptions(theme: GlobalTheme): StyleOption[] {
  return listShapes().map((s) => {
    const p = resolvePreviewStyle({ shape: s.id }, theme);
    return { id: s.id, label: s.label, previewClassName: p.className, previewStyle: p.style };
  });
}

/** Preview for the "Sheet default" tile in per-card pickers. */
export function frameDefaultPreview(theme: GlobalTheme) {
  const frame = getFrame(theme.defaultFrame);
  const p = resolvePreviewStyle({ frame: frame.id }, theme);
  return { subLabel: frame.label, previewClassName: p.className, previewStyle: p.style };
}

export function shapeDefaultPreview(theme: GlobalTheme) {
  const shape = getShape(theme.defaultShape);
  const p = resolvePreviewStyle({ shape: shape.id }, theme);
  return { subLabel: shape.label, previewClassName: p.className, previewStyle: p.style };
}

export function buildCornerOptions(theme: GlobalTheme): StyleOption[] {
  return listCorners().map((c) => {
    const p = resolvePreviewStyle({ corners: c.id }, theme);
    return {
      id: c.id,
      label: c.label,
      previewClassName: p.className,
      previewStyle: p.style,
      previewContent: p.corner ? React.createElement(CornerAccents, { corner: p.corner, size: 14 }) : undefined,
    };
  });
}

export function cornerDefaultPreview(theme: GlobalTheme) {
  const corner = getCorner(theme.defaultCorners);
  const p = resolvePreviewStyle({ corners: corner.id }, theme);
  return {
    subLabel: corner.label,
    previewClassName: p.className,
    previewStyle: p.style,
    previewContent: p.corner ? React.createElement(CornerAccents, { corner: p.corner, size: 14 }) : undefined,
  };
}

export function buildPatternOptions(theme: GlobalTheme): StyleOption[] {
  return listPatterns().map((pt) => {
    const p = resolvePreviewStyle({ pattern: pt.id }, theme);
    return { id: pt.id, label: pt.label, previewClassName: p.className, previewStyle: p.style };
  });
}

export function buildTextureOptions(theme: GlobalTheme): StyleOption[] {
  return listTextures().map((t) => {
    const p = resolvePreviewStyle({ texture: t.id }, theme);
    return { id: t.id, label: t.label, previewClassName: p.className, previewStyle: p.style };
  });
}

export function patternDefaultPreview(theme: GlobalTheme) {
  const pattern = getPattern(theme.defaultPattern);
  const p = resolvePreviewStyle({ pattern: pattern.id }, theme);
  return { subLabel: pattern.label, previewClassName: p.className, previewStyle: p.style };
}

export function textureDefaultPreview(theme: GlobalTheme) {
  const texture = getTexture(theme.defaultTexture);
  const p = resolvePreviewStyle({ texture: texture.id }, theme);
  return { subLabel: texture.label, previewClassName: p.className, previewStyle: p.style };
}

export function buildWatermarkOptions(theme: GlobalTheme): StyleOption[] {
  return listWatermarks().map((w) => {
    const p = resolvePreviewStyle({ watermark: w.id }, theme);
    return { id: w.id, label: w.label, previewClassName: p.className, previewStyle: p.style };
  });
}

export function watermarkDefaultPreview(theme: GlobalTheme) {
  const wm = getWatermark(theme.defaultWatermark);
  const p = resolvePreviewStyle({ watermark: wm.id }, theme);
  return { subLabel: wm.label, previewClassName: p.className, previewStyle: p.style };
}

export function buildDividerOptions(theme: GlobalTheme): StyleOption[] {
  return listDividers().map((d) => {
    const p = resolvePreviewStyle({ headerDivider: d.id }, theme);
    return {
      id: d.id,
      label: d.label,
      previewClassName: p.className,
      previewStyle: p.style,
      previewContent: React.createElement(HeaderDivider, {
        dividerId: d.id,
        color: theme.borderColor,
        accent: theme.accentColor,
      }),
    };
  });
}

export function dividerDefaultPreview(theme: GlobalTheme) {
  const d = getDivider(theme.defaultHeaderDivider);
  const p = resolvePreviewStyle({ headerDivider: d.id }, theme);
  return {
    subLabel: d.label,
    previewClassName: p.className,
    previewStyle: p.style,
    previewContent: React.createElement(HeaderDivider, {
      dividerId: d.id,
      color: theme.borderColor,
      accent: theme.accentColor,
    }),
  };
}
