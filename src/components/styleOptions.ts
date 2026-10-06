import type { GlobalTheme } from "../types/schema";
import { getFrame, getShape, listFrames, listShapes } from "../styles/registry";
import { resolvePreviewStyle } from "../styles/resolveStyle";
import type { StyleOption } from "./StyleOptionGrid";

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
