import React from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import type { GlobalTheme } from "../types/schema";

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

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleApplyPreset = (presetTheme: GlobalTheme) => {
    setGlobalTheme(presetTheme);
  };

  const handleReset = () => {
    setGlobalTheme(THEME_PRESETS[0].theme);
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
