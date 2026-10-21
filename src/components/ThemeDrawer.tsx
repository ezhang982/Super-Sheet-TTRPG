import React from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import type { GlobalTheme } from "../types/schema";
import {
  DEFAULT_CANVAS_WATERMARK_OPACITY,
  DEFAULT_WATERMARK_OPACITY,
  WATERMARK_POSITIONS,
  ANIMATION_LIST,
  isKnownAnimation,
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
import { listStylePacks, type StylePack } from "../styles/stylePacks";
import { ApplyStylePackModal } from "./ApplyStylePackModal";
import { Icon } from "./ui/Icon";
import {
  faPalette,
  faXmark,
  faBoxesStacked,
  faBorderAll,
  faWandMagicSparkles,
  faShieldHalved,
  faCloud,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";
import {
  buildCornerOptions,
  buildDividerOptions,
  buildFrameOptions,
  buildPatternOptions,
  buildShapeOptions,
  buildTextureOptions,
  buildWatermarkOptions,
} from "./styleOptions";
import { THEME_PRESETS, type ThemePreset } from "../styles/themePresets";
export { THEME_PRESETS, type ThemePreset };

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
  onOpenMyDesigns?: () => void;
}

export const ThemeDrawer: React.FC<ThemeDrawerProps> = ({ isOpen, onClose, onOpenMyDesigns }) => {
  const theme = useCharacterStore((state) => state.character.theme);
  const setGlobalTheme = useCharacterStore((state) => state.setGlobalTheme);
  const applyStylePack = useCharacterStore((state) => state.applyStylePack);
  const clearBlockStyleOverrides = useCharacterStore((state) => state.clearBlockStyleOverrides);

  const [selectedPackForModal, setSelectedPackForModal] = React.useState<StylePack | null>(null);
  const stylePacks = React.useMemo(() => listStylePacks(), []);

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
      animation: undefined,
      packId: undefined,
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

  return (
    <>
      {createPortal(
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
            <span className="drawer-icon"><Icon icon={faPalette} /></span>
            <h2 id="theme-drawer-title">Theme & Styling</h2>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close theme settings"
          >
            <Icon icon={faXmark} />
          </button>
        </div>

        <div className="drawer-body">
          {/* Style Packs */}
          <section className="drawer-section">
            <div className="drawer-section-header-row">
              <div>
                <h3 className="drawer-section-title" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon={faBoxesStacked} /> Style Packs
                </h3>
                <p className="drawer-section-subtitle">
                  Curated 1-click themes bundling frames, corners, textures, watermarks, dividers, and typography.
                </p>
              </div>
            </div>

            <div className="style-pack-grid">
              {stylePacks.map((pack) => {
                const isSelected = theme.packId === pack.id;
                return (
                  <button
                    key={pack.id}
                    type="button"
                    className={`style-pack-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedPackForModal(pack)}
                    aria-label={`Apply style pack: ${pack.name}`}
                  >
                    <div className="style-pack-card-header">
                      <span className="style-pack-name">{pack.name}</span>
                      {isSelected ? (
                        <span className="style-pack-active-badge">Active</span>
                      ) : (
                        <span className="style-pack-category-badge">{pack.category}</span>
                      )}
                    </div>

                    <div
                      className="style-pack-preview-bar"
                      style={{ backgroundColor: pack.colors.canvasBackground }}
                    >
                      <span
                        className="style-pack-chip"
                        title={`Card: ${pack.colors.cardBackground}`}
                        style={{ backgroundColor: pack.colors.cardBackground }}
                      />
                      <span
                        className="style-pack-chip"
                        title={`Border: ${pack.colors.borderColor}`}
                        style={{ backgroundColor: pack.colors.borderColor }}
                      />
                      <span
                        className="style-pack-chip accent"
                        title={`Accent: ${pack.colors.accentColor}`}
                        style={{ backgroundColor: pack.colors.accentColor }}
                      />
                    </div>

                    <p className="style-pack-desc">{pack.description}</p>

                    <div className="style-pack-tokens-row">
                      {pack.tokens.defaultFrame && (
                        <span className="style-pack-token-pill">
                          <Icon icon={faBorderAll} /> {pack.tokens.defaultFrame}
                        </span>
                      )}
                      {pack.tokens.defaultCorners && pack.tokens.defaultCorners !== "none" && (
                        <span className="style-pack-token-pill">
                          <Icon icon={faWandMagicSparkles} /> {pack.tokens.defaultCorners}
                        </span>
                      )}
                      {pack.tokens.defaultWatermark && pack.tokens.defaultWatermark !== "none" && (
                        <span className="style-pack-token-pill">
                          <Icon icon={faShieldHalved} /> {pack.tokens.defaultWatermark}
                        </span>
                      )}
                      {pack.tokens.defaultTexture && pack.tokens.defaultTexture !== "none" && (
                        <span className="style-pack-token-pill">
                          <Icon icon={faCloud} /> {pack.tokens.defaultTexture}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Quick Color Presets */}
          <section className="drawer-section">
            <h3 className="drawer-section-title">Quick Color Presets</h3>
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

            <div className="theme-form-group">
              <label>Animated Border Effects</label>
              <select
                value={isKnownAnimation(theme.animation) ? theme.animation : "none"}
                onChange={(e) => setGlobalTheme({ animation: e.target.value })}
              >
                {ANIMATION_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.label}
                  </option>
                ))}
              </select>
              <span className="color-hint">Subtle looping border fx (strictly disabled under prefers-reduced-motion).</span>
            </div>

            <button type="button" className="btn-secondary" onClick={handleApplyToAllCards}>
              Make all cards use these defaults
            </button>
          </section>

          {/* Custom User Designs (SVG Assets) */}
          {onOpenMyDesigns && (
            <section className="drawer-section">
              <h3 className="drawer-section-title">Custom User Designs</h3>
              <p className="drawer-hint">
                Import, sanitize, and manage custom SVG frames, corner accents, watermarks, and patterns.
              </p>
              <button
                type="button"
                className="btn-secondary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontWeight: 600,
                  padding: "10px",
                }}
                onClick={() => {
                  onClose();
                  onOpenMyDesigns();
                }}
              >
                <Icon icon={faLayerGroup} />
                <span>Manage My Designs (Custom SVGs)</span>
              </button>
            </section>
          )}
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
  )}

  <ApplyStylePackModal
    pack={selectedPackForModal}
    isOpen={!!selectedPackForModal}
    currentTheme={theme}
    onClose={() => setSelectedPackForModal(null)}
    onApply={(packId, options) => {
      applyStylePack(packId, options);
      setSelectedPackForModal(null);
    }}
  />
</>
);
};

