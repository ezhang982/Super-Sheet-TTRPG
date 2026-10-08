import React from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import type { GlobalTheme } from "../types/schema";
import {
  DEFAULT_CANVAS_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_OPACITY,
  WATERMARK_POSITIONS,
  isKnownCorner,
  isKnownDivider,
  isKnownFrame,
  isKnownShading,
  isKnownShape,
  isKnownWatermark,
  listShadings,
} from "../styles/registry";
import { isKnownPattern, isKnownTexture } from "../styles/patterns";
import { DEFAULT_PATTERN_OPACITY } from "../styles/resolveStyle";
import { StyleOptionGrid } from "./StyleOptionGrid";
import {
  buildCornerOptions,
  buildDividerOptions,
  buildFrameOptions,
  buildPatternOptions,
  buildShapeOptions,
  buildTextureOptions,
  buildWatermarkOptions,
} from "./styleOptions";

export interface ThemePreset {
  id: string;
  name: string;
  theme: GlobalTheme;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "fantasy-default",
    name: "High Fantasy",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'EB Garamond', serif",
      canvasBackground: "#121316",
      cardBackground: "#1c1e24",
      borderColor: "#2f333d",
      accentColor: "#e06c75",
    },
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk / Sci-Fi",
    theme: {
      fontHeading: "'Orbitron', sans-serif",
      fontBody: "'Share Tech Mono', monospace",
      canvasBackground: "#080b10",
      cardBackground: "#0f141c",
      borderColor: "#1e293b",
      accentColor: "#00f0ff",
    },
  },
  {
    id: "parchment",
    name: "Antique Parchment",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'EB Garamond', serif",
      canvasBackground: "#221d17",
      cardBackground: "#2f2820",
      borderColor: "#4a3f32",
      accentColor: "#d4a373",
    },
  },
  {
    id: "eldritch",
    name: "Eldritch Arcane",
    theme: {
      fontHeading: "'Cinzel', serif",
      fontBody: "'Inter', sans-serif",
      canvasBackground: "#0d0b14",
      cardBackground: "#171322",
      borderColor: "#302645",
      accentColor: "#a855f7",
    },
  },
  {
    id: "clean-dark",
    name: "Clean Obsidian",
    theme: {
      fontHeading: "'Inter', sans-serif",
      fontBody: "'Inter', sans-serif",
      canvasBackground: "#18181b",
      cardBackground: "#27272a",
      borderColor: "#3f3f46",
      accentColor: "#38bdf8",
    },
  },
];

const FONT_HEADING_OPTIONS = [
  { label: "Cinzel (Fantasy)", value: "'Cinzel', serif" },
  { label: "Orbitron (Sci-Fi)", value: "'Orbitron', sans-serif" },
  { label: "EB Garamond (Classic)", value: "'EB Garamond', serif" },
  { label: "Inter (Clean)", value: "'Inter', sans-serif" },
];

const FONT_BODY_OPTIONS = [
  { label: "Inter (Modern Sans)", value: "'Inter', sans-serif" },
  { label: "EB Garamond (Classic Serif)", value: "'EB Garamond', serif" },
  { label: "Share Tech Mono (Terminal)", value: "'Share Tech Mono', monospace" },
];

interface ThemeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose }) => {
  const theme = useCharacterStore((state) => state.character.theme);
  const setGlobalTheme = useCharacterStore((state) => state.setGlobalTheme);
  const clearBlockStyleOverrides = useCharacterStore((state) => state.clearBlockStyleOverrides);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleApplyPreset = (presetTheme: GlobalTheme) => {
    setGlobalTheme(presetTheme);
  };

  const handleReset = () => {
    setGlobalTheme({
      ...THEME_PRESETS[0].theme,
      defaultFrame: undefined,
      defaultCorners: undefined,
      defaultShape: undefined,
      defaultShading: undefined,
      defaultGlow: undefined,
      defaultTexture: undefined,
      defaultPattern: undefined,
      cardPatternOpacity: undefined,
      defaultScrim: undefined,
      canvasPattern: undefined,
      canvasPatternOpacity: undefined,
      canvasPatternScale: undefined,
      defaultWatermark: undefined,
      watermarkOpacity: undefined,
      defaultWatermarkPosition: undefined,
      canvasWatermark: undefined,
      canvasWatermarkOpacity: undefined,
      canvasWatermarkPosition: undefined,
      canvasWatermarkScale: undefined,
      defaultHeaderDivider: undefined,
    });
  };

  const handleApplyToAllCards = () => {
    const ok = window.confirm(
      "Remove every card's own frame, corners, shape, shading, texture, pattern, watermark, divider, and glow so all cards follow these defaults?\n\nYou can undo this."
    );
    if (ok)
      clearBlockStyleOverrides([
        "frame",
        "borderStyle",
        "corners",
        "shape",
        "shading",
        "glow",
        "texture",
        "pattern",
        "scrim",
        "watermark",
        "watermarkOpacity",
        "watermarkPosition",
        "headerDivider",
      ]);
  };

  // Helper to ensure valid 6-character hex for native color pickers
  const toValidHex = (val: string, fallback: string): string => {
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) return val;
    return fallback;
  };

  return createPortal(
    <div className="drawer-overlay" onClick={onClose}>
      <div
        className="drawer-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-drawer-title"
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="drawer-icon">🎨</span>
            <h2 id="theme-drawer-title">Theme & Styling</h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close theme settings"
          >
            ×
          </button>
        </div>

        <div className="drawer-body">
          {/* Preset Palettes */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Presets</h3>
            <div className="theme-preset-grid">
              {THEME_PRESETS.map((preset) => {
                const isSelected =
                  theme.accentColor === preset.theme.accentColor &&
                  theme.cardBackground === preset.theme.cardBackground;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`theme-preset-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleApplyPreset(preset.theme)}
                  >
                    <div
                      className="preset-preview-colors"
                      style={{ backgroundColor: preset.theme.canvasBackground }}
                    >
                      <span
                        className="preset-chip"
                        style={{ backgroundColor: preset.theme.cardBackground }}
                      />
                      <span
                        className="preset-chip accent"
                        style={{ backgroundColor: preset.theme.accentColor }}
                      />
                    </div>
                    <span className="preset-name">{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Typography */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Typography</h3>
            <div className="theme-form-group">
              <label>Heading Font</label>
              <select
                value={theme.fontHeading}
                onChange={(e) => setGlobalTheme({ fontHeading: e.target.value })}
              >
                {FONT_HEADING_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="theme-form-group">
              <label>Body Font</label>
              <select
                value={theme.fontBody}
                onChange={(e) => setGlobalTheme({ fontBody: e.target.value })}
              >
                {FONT_BODY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Colors */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Colors</h3>

            <div className="theme-color-row">
              <div className="color-label-group">
                <span className="color-label">Canvas Background</span>
                <span className="color-hint">App base background</span>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toValidHex(theme.canvasBackground, "#121316")}
                  onChange={(e) => setGlobalTheme({ canvasBackground: e.target.value })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={theme.canvasBackground}
                  onChange={(e) => setGlobalTheme({ canvasBackground: e.target.value })}
                />
              </div>
            </div>

            <div className="theme-color-row">
              <div className="color-label-group">
                <span className="color-label">Card Background</span>
                <span className="color-hint">Blocks & containers</span>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toValidHex(theme.cardBackground, "#1c1e24")}
                  onChange={(e) => setGlobalTheme({ cardBackground: e.target.value })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={theme.cardBackground}
                  onChange={(e) => setGlobalTheme({ cardBackground: e.target.value })}
                />
              </div>
            </div>

            <div className="theme-color-row">
              <div className="color-label-group">
                <span className="color-label">Border Color</span>
                <span className="color-hint">Dividers & card outlines</span>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toValidHex(theme.borderColor, "#2f333d")}
                  onChange={(e) => setGlobalTheme({ borderColor: e.target.value })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={theme.borderColor}
                  onChange={(e) => setGlobalTheme({ borderColor: e.target.value })}
                />
              </div>
            </div>

            <div className="theme-color-row">
              <div className="color-label-group">
                <span className="color-label">Accent Color</span>
                <span className="color-hint">Active tabs, highlights, pips</span>
              </div>
              <div className="color-picker-wrapper">
                <input
                  type="color"
                  value={toValidHex(theme.accentColor, "#e06c75")}
                  onChange={(e) => setGlobalTheme({ accentColor: e.target.value })}
                />
                <input
                  type="text"
                  className="color-hex-input"
                  value={theme.accentColor}
                  onChange={(e) => setGlobalTheme({ accentColor: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Canvas Pattern */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Canvas Pattern</h3>
            <p className="drawer-hint">
              Tileable background pattern rendered across the application canvas.
            </p>

            <div className="theme-form-group">
              <label>Pattern Style</label>
              <StyleOptionGrid
                label="Canvas pattern"
                options={buildPatternOptions(theme)}
                value={isKnownPattern(theme.canvasPattern) ? theme.canvasPattern : "none"}
                onChange={(id) => setGlobalTheme({ canvasPattern: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Pattern Opacity ({Math.round((theme.canvasPatternOpacity ?? DEFAULT_PATTERN_OPACITY) * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={theme.canvasPatternOpacity ?? DEFAULT_PATTERN_OPACITY}
                onChange={(e) => setGlobalTheme({ canvasPatternOpacity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Pattern Scale ({Math.round((theme.canvasPatternScale ?? 1) * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.25"
                value={theme.canvasPatternScale ?? 1}
                onChange={(e) => setGlobalTheme({ canvasPatternScale: parseFloat(e.target.value) })}
              />
            </div>
          </section>

          {/* Canvas Watermark */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Canvas Watermark</h3>
            <p className="drawer-hint">
              Subtle atmospheric emblem fixed in the background across the sheet.
            </p>

            <div className="theme-form-group">
              <label>Emblem</label>
              <StyleOptionGrid
                label="Canvas watermark"
                options={buildWatermarkOptions(theme)}
                value={isKnownWatermark(theme.canvasWatermark) ? theme.canvasWatermark : "none"}
                onChange={(id) => setGlobalTheme({ canvasWatermark: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Emblem Opacity ({Math.round((theme.canvasWatermarkOpacity ?? DEFAULT_CANVAS_WATERMARK_OPACITY) * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.4"
                step="0.01"
                value={theme.canvasWatermarkOpacity ?? DEFAULT_CANVAS_WATERMARK_OPACITY}
                onChange={(e) => setGlobalTheme({ canvasWatermarkOpacity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Emblem Scale ({Math.round((theme.canvasWatermarkScale ?? 1) * 100)}%)
              </label>
              <input
                type="range"
                min="0.5"
                max="2.5"
                step="0.1"
                value={theme.canvasWatermarkScale ?? 1}
                onChange={(e) => setGlobalTheme({ canvasWatermarkScale: parseFloat(e.target.value) })}
              />
            </div>

            <div className="theme-form-group">
              <label>Position</label>
              <select
                value={theme.canvasWatermarkPosition ?? "center"}
                onChange={(e) => setGlobalTheme({ canvasWatermarkPosition: e.target.value })}
              >
                {WATERMARK_POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Card Style: sheet-wide defaults (cards can override individually) */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Card Style (Sheet Default)</h3>
            <p className="drawer-hint">
              Applies to every card unless that card has its own override in its style menu.
            </p>

            <div className="theme-form-group">
              <label>Frame</label>
              <StyleOptionGrid
                label="Default frame"
                options={buildFrameOptions(theme)}
                value={isKnownFrame(theme.defaultFrame) ? theme.defaultFrame : "solid"}
                onChange={(id) => setGlobalTheme({ defaultFrame: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>Shape</label>
              <StyleOptionGrid
                label="Default shape"
                options={buildShapeOptions(theme)}
                value={isKnownShape(theme.defaultShape) ? theme.defaultShape : "rect"}
                onChange={(id) => setGlobalTheme({ defaultShape: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>Header Divider</label>
              <StyleOptionGrid
                label="Default header divider"
                options={buildDividerOptions(theme)}
                value={isKnownDivider(theme.defaultHeaderDivider) ? theme.defaultHeaderDivider : "default"}
                onChange={(id) => setGlobalTheme({ defaultHeaderDivider: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>Corner Accents</label>
              <StyleOptionGrid
                label="Default corner accents"
                options={buildCornerOptions(theme)}
                value={isKnownCorner(theme.defaultCorners) ? theme.defaultCorners : "none"}
                onChange={(id) => setGlobalTheme({ defaultCorners: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>Inner Shading</label>
              <select
                value={isKnownShading(theme.defaultShading) ? theme.defaultShading : "none"}
                onChange={(e) => setGlobalTheme({ defaultShading: e.target.value })}
              >
                {listShadings().map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="theme-form-group">
              <label>Surface Texture</label>
              <StyleOptionGrid
                label="Default surface texture"
                options={buildTextureOptions(theme)}
                value={isKnownTexture(theme.defaultTexture) ? theme.defaultTexture : "none"}
                onChange={(id) => setGlobalTheme({ defaultTexture: id })}
              />
              <span className="color-hint">Frosted Glass is the heaviest effect; use it sparingly.</span>
            </div>

            <div className="theme-form-group">
              <label>Pattern</label>
              <StyleOptionGrid
                label="Default card pattern"
                options={buildPatternOptions(theme)}
                value={isKnownPattern(theme.defaultPattern) ? theme.defaultPattern : "none"}
                onChange={(id) => setGlobalTheme({ defaultPattern: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Pattern Strength ({Math.round((theme.cardPatternOpacity ?? DEFAULT_PATTERN_OPACITY) * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={theme.cardPatternOpacity ?? DEFAULT_PATTERN_OPACITY}
                onChange={(e) => setGlobalTheme({ cardPatternOpacity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="theme-form-group">
              <label>Card Watermark</label>
              <StyleOptionGrid
                label="Default card watermark"
                options={buildWatermarkOptions(theme)}
                value={isKnownWatermark(theme.defaultWatermark) ? theme.defaultWatermark : "none"}
                onChange={(id) => setGlobalTheme({ defaultWatermark: id })}
              />
            </div>

            <div className="theme-form-group">
              <label>
                Watermark Strength ({Math.round((theme.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY) * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.02"
                value={theme.watermarkOpacity ?? DEFAULT_WATERMARK_OPACITY}
                onChange={(e) => setGlobalTheme({ watermarkOpacity: parseFloat(e.target.value) })}
              />
            </div>

            <div className="theme-form-group">
              <label>Watermark Position</label>
              <select
                value={theme.defaultWatermarkPosition ?? "center"}
                onChange={(e) => setGlobalTheme({ defaultWatermarkPosition: e.target.value })}
              >
                {WATERMARK_POSITIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <label className="theme-checkbox-row">
              <input
                type="checkbox"
                checked={theme.defaultGlow ?? false}
                onChange={(e) => setGlobalTheme({ defaultGlow: e.target.checked })}
              />
              <span>Glow around cards (uses accent color)</span>
            </label>

            <label className="theme-checkbox-row">
              <input
                type="checkbox"
                checked={theme.defaultScrim ?? false}
                onChange={(e) => setGlobalTheme({ defaultScrim: e.target.checked })}
              />
              <span>Readability scrim (darkens behind text over art and patterns)</span>
            </label>

            <button type="button" className="btn-secondary" onClick={handleApplyToAllCards}>
              Make all cards use these defaults
            </button>
          </section>
        </div>

        <div className="drawer-footer">
          <button type="button" className="drawer-reset-btn" onClick={handleReset}>
            Reset to Default
          </button>
          <button type="button" className="drawer-done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
