import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { StylePack } from "../styles/stylePacks";
import type { GlobalTheme } from "../types/schema";

interface ApplyStylePackModalProps {
  pack: StylePack | null;
  isOpen: boolean;
  currentTheme: GlobalTheme;
  onClose: () => void;
  onApply: (packId: string, options: { keepColors: boolean; resetCardOverrides: boolean }) => void;
}

export const ApplyStylePackModal: React.FC<ApplyStylePackModalProps> = ({
  pack,
  isOpen,
  currentTheme,
  onClose,
  onApply,
}) => {
  const [resetCardOverrides, setResetCardOverrides] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !pack) return null;
  if (typeof document === "undefined") return null;

  const handleApplyFull = () => {
    onApply(pack.id, { keepColors: false, resetCardOverrides });
    onClose();
  };

  const handleKeepColors = () => {
    onApply(pack.id, { keepColors: true, resetCardOverrides });
    onClose();
  };

  return createPortal(
    <div className="modal-overlay apply-pack-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content apply-pack-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apply-pack-dialog-title"
      >
        <div className="apply-pack-header">
          <div className="apply-pack-title-row">
            <span className="apply-pack-icon">📦</span>
            <div>
              <h2 id="apply-pack-dialog-title" className="apply-pack-title">
                {pack.name}
              </h2>
              <span className="apply-pack-category">{pack.category.toUpperCase()} STYLE PACK</span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <p className="apply-pack-description">{pack.description}</p>

        {/* Live Typography Preview */}
        <div className="apply-pack-section">
          <span className="apply-pack-section-title">Typography Preview</span>
          <div
            className="apply-pack-typo-preview"
            style={{
              backgroundColor: pack.colors.cardBackground,
              borderColor: pack.colors.borderColor,
            }}
          >
            <div
              className="apply-pack-heading-sample"
              style={{
                fontFamily: pack.fontHeading,
                color: pack.colors.accentColor,
              }}
            >
              Ancient Relics & Arcane Power
            </div>
            <div
              className="apply-pack-body-sample"
              style={{
                fontFamily: pack.fontBody,
              }}
            >
              The runes illuminate the darkness with ethereal radiance.
            </div>
          </div>
        </div>

        {/* Color Comparison */}
        <div className="apply-pack-section">
          <span className="apply-pack-section-title">Color Palette Comparison</span>
          <div className="apply-pack-palettes">
            <div className="apply-pack-palette-box">
              <span className="palette-box-label">Pack Colors</span>
              <div
                className="palette-swatch-row"
                style={{ backgroundColor: pack.colors.canvasBackground }}
              >
                <span
                  className="palette-swatch"
                  title={`Card: ${pack.colors.cardBackground}`}
                  style={{ backgroundColor: pack.colors.cardBackground }}
                />
                <span
                  className="palette-swatch"
                  title={`Border: ${pack.colors.borderColor}`}
                  style={{ backgroundColor: pack.colors.borderColor }}
                />
                <span
                  className="palette-swatch accent"
                  title={`Accent: ${pack.colors.accentColor}`}
                  style={{ backgroundColor: pack.colors.accentColor }}
                />
              </div>
            </div>

            <div className="apply-pack-palette-box">
              <span className="palette-box-label">Your Current Colors</span>
              <div
                className="palette-swatch-row"
                style={{ backgroundColor: currentTheme.canvasBackground }}
              >
                <span
                  className="palette-swatch"
                  title={`Card: ${currentTheme.cardBackground}`}
                  style={{ backgroundColor: currentTheme.cardBackground }}
                />
                <span
                  className="palette-swatch"
                  title={`Border: ${currentTheme.borderColor}`}
                  style={{ backgroundColor: currentTheme.borderColor }}
                />
                <span
                  className="palette-swatch accent"
                  title={`Accent: ${currentTheme.accentColor}`}
                  style={{ backgroundColor: currentTheme.accentColor }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Token Highlights */}
        <div className="apply-pack-section">
          <span className="apply-pack-section-title">Included Style Tokens</span>
          <div className="apply-pack-token-chips">
            {pack.tokens.defaultFrame && (
              <span className="token-chip">
                🖼️ Frame: <strong>{pack.tokens.defaultFrame}</strong>
              </span>
            )}
            {pack.tokens.defaultCorners && pack.tokens.defaultCorners !== "none" && (
              <span className="token-chip">
                ✨ Corners: <strong>{pack.tokens.defaultCorners}</strong>
              </span>
            )}
            {pack.tokens.defaultShape && (
              <span className="token-chip">
                📐 Shape: <strong>{pack.tokens.defaultShape}</strong>
              </span>
            )}
            {pack.tokens.defaultShading && pack.tokens.defaultShading !== "none" && (
              <span className="token-chip">
                🌑 Shading: <strong>{pack.tokens.defaultShading}</strong>
              </span>
            )}
            {pack.tokens.defaultTexture && pack.tokens.defaultTexture !== "none" && (
              <span className="token-chip">
                🌫️ Texture: <strong>{pack.tokens.defaultTexture}</strong>
              </span>
            )}
            {pack.tokens.defaultPattern && pack.tokens.defaultPattern !== "none" && (
              <span className="token-chip">
                🕸️ Pattern: <strong>{pack.tokens.defaultPattern}</strong>
              </span>
            )}
            {pack.tokens.defaultWatermark && pack.tokens.defaultWatermark !== "none" && (
              <span className="token-chip">
                🛡️ Watermark: <strong>{pack.tokens.defaultWatermark}</strong>
              </span>
            )}
            {pack.tokens.defaultHeaderDivider && (
              <span className="token-chip">
                ⚔️ Divider: <strong>{pack.tokens.defaultHeaderDivider}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Card Overrides Checkbox */}
        <label className="apply-pack-override-toggle">
          <input
            type="checkbox"
            checked={resetCardOverrides}
            onChange={(e) => setResetCardOverrides(e.target.checked)}
          />
          <div className="override-toggle-text">
            <span className="override-toggle-title">Reset individual card overrides</span>
            <span className="override-toggle-hint">
              Remove custom card frames, corners, and textures so all existing cards adopt this pack.
            </span>
          </div>
        </label>

        {/* Actions */}
        <div className="apply-pack-actions">
          <button
            type="button"
            className="btn btn-secondary apply-pack-keep-btn"
            onClick={handleKeepColors}
          >
            🎨 Keep My Custom Colors
          </button>
          <button
            type="button"
            className="btn btn-primary apply-pack-full-btn"
            onClick={handleApplyFull}
          >
            ✨ Apply Full Pack
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
