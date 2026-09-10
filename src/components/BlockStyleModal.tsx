import React from "react";
import { createPortal } from "react-dom";
import type { Block, BlockStyle } from "../types/schema";
import { useCharacterStore } from "../store/useCharacterStore";

interface BlockStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  block: Block;
}

const BORDER_STYLES: Array<{ label: string; value: NonNullable<BlockStyle["borderStyle"]> }> = [
  { label: "Theme Default (Solid)", value: "solid" },
  { label: "None", value: "none" },
  { label: "Double", value: "double" },
  { label: "Dashed", value: "dashed" },
  { label: "Groove", value: "groove" },
  { label: "Ornate Fantasy", value: "ornate" },
];

export const BlockStyleModal: React.FC<BlockStyleModalProps> = ({
  isOpen,
  onClose,
  block,
}) => {
  const updateBlockStyle = useCharacterStore((state) => state.updateBlockStyle);
  const theme = useCharacterStore((state) => state.character.theme);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const currentStyle = block.style || {};
  const currentOpacity =
    currentStyle.backgroundOpacity !== undefined ? currentStyle.backgroundOpacity : 1;

  const handleUpdate = (patch: Partial<BlockStyle>) => {
    updateBlockStyle(block.id, patch);
  };

  const handleReset = () => {
    updateBlockStyle(block.id, {
      borderStyle: undefined,
      borderColor: undefined,
      backgroundOpacity: undefined,
      backgroundUrl: undefined,
      headerBannerUrl: undefined,
    });
  };

  const toValidHex = (val?: string): string => {
    if (val && /^#[0-9A-Fa-f]{6}$/.test(val)) return val;
    return theme.borderColor;
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog block-style-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="block-style-dialog-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">🎨</span>
            <h3 id="block-style-dialog-title">Style Card: {block.title}</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close styling dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Border Style */}
          <div className="form-row">
            <label>Border Style</label>
            <select
              value={currentStyle.borderStyle || "solid"}
              onChange={(e) =>
                handleUpdate({
                  borderStyle: e.target.value as NonNullable<BlockStyle["borderStyle"]>,
                })
              }
            >
              {BORDER_STYLES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Border Color Override */}
          <div className="form-row">
            <div className="label-with-hint">
              <label>Border Color</label>
              <span className="field-hint">Overrides global border</span>
            </div>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={toValidHex(currentStyle.borderColor)}
                onChange={(e) => handleUpdate({ borderColor: e.target.value })}
              />
              <input
                type="text"
                className="color-hex-input"
                placeholder={theme.borderColor}
                value={currentStyle.borderColor || ""}
                onChange={(e) => handleUpdate({ borderColor: e.target.value || undefined })}
              />
              {currentStyle.borderColor && (
                <button
                  type="button"
                  className="clear-field-btn"
                  onClick={() => handleUpdate({ borderColor: undefined })}
                  title="Revert to theme border color"
                >
                  Revert
                </button>
              )}
            </div>
          </div>

          {/* Background Opacity */}
          <div className="form-row">
            <div className="label-with-hint">
              <label>Background Opacity</label>
              <span className="field-hint">
                {Math.round(currentOpacity * 100)}% {currentOpacity < 1 ? "(Glass effect)" : ""}
              </span>
            </div>
            <div className="slider-wrapper">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={currentOpacity}
                onChange={(e) =>
                  handleUpdate({ backgroundOpacity: parseFloat(e.target.value) })
                }
              />
              {currentStyle.backgroundOpacity !== undefined && (
                <button
                  type="button"
                  className="clear-field-btn"
                  onClick={() => handleUpdate({ backgroundOpacity: undefined })}
                  title="Revert to theme opacity"
                >
                  Revert
                </button>
              )}
            </div>
          </div>

          {/* Header Banner URL */}
          <div className="form-row">
            <div className="label-with-hint">
              <label>Header Banner Image URL</label>
              <span className="field-hint">Top visual art banner</span>
            </div>
            <div className="text-input-wrapper">
              <input
                type="url"
                placeholder="https://example.com/banner.jpg"
                value={currentStyle.headerBannerUrl || ""}
                onChange={(e) =>
                  handleUpdate({ headerBannerUrl: e.target.value || undefined })
                }
              />
              {currentStyle.headerBannerUrl && (
                <button
                  type="button"
                  className="clear-field-btn"
                  onClick={() => handleUpdate({ headerBannerUrl: undefined })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Background Texture/Image URL */}
          <div className="form-row">
            <div className="label-with-hint">
              <label>Card Background Texture URL</label>
              <span className="field-hint">Full card background illustration/texture</span>
            </div>
            <div className="text-input-wrapper">
              <input
                type="url"
                placeholder="https://example.com/texture.jpg"
                value={currentStyle.backgroundUrl || ""}
                onChange={(e) =>
                  handleUpdate({ backgroundUrl: e.target.value || undefined })
                }
              />
              {currentStyle.backgroundUrl && (
                <button
                  type="button"
                  className="clear-field-btn"
                  onClick={() => handleUpdate({ backgroundUrl: undefined })}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-secondary" onClick={handleReset}>
            Reset to Theme Default
          </button>
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
