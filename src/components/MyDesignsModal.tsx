import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import type { CustomAsset, CustomAssetKind } from "../types/schema";
import { assetLibrary } from "../styles/assetLibrary";
import { sanitizeSvg } from "../styles/svgSanitizer";
import { useCharacterStore } from "../store/useCharacterStore";

interface MyDesignsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MyDesignsModal: React.FC<MyDesignsModalProps> = ({ isOpen, onClose }) => {
  const theme = useCharacterStore((state) => state.character.theme);
  const setGlobalTheme = useCharacterStore((state) => state.setGlobalTheme);
  const embedCustomAsset = useCharacterStore((state) => state.embedCustomAsset);

  const [designs, setDesigns] = useState<CustomAsset[]>([]);
  const [kind, setKind] = useState<CustomAssetKind>("frame");
  const [name, setName] = useState("");
  const [svgInput, setSvgInput] = useState("");
  const [slice, setSlice] = useState(32);
  const [recolor, setRecolor] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [sanitizedPreview, setSanitizedPreview] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Refresh designs on open
  useEffect(() => {
    if (!isOpen) return;
    assetLibrary.list().then(setDesigns).catch(console.warn);
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Live sanitization preview
  useEffect(() => {
    if (!svgInput.trim()) {
      setSanitizedPreview(null);
      setPreviewId(null);
      setErrorMsg(null);
      return;
    }

    const res = sanitizeSvg(svgInput);
    if (!res.ok) {
      setErrorMsg(res.reason);
      setSanitizedPreview(null);
      setPreviewId(null);
    } else {
      setErrorMsg(null);
      setSanitizedPreview(res.svg);
      setPreviewId(res.id);
    }
  }, [svgInput]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!name.trim()) {
      const baseName = file.name.replace(/\.svg$/i, "");
      setName(baseName);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setSvgInput(content);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Please enter a name for your design.");
      return;
    }
    if (!sanitizedPreview || !previewId) {
      setErrorMsg("Please provide valid SVG code.");
      return;
    }

    try {
      const saved = await assetLibrary.add({
        name: name.trim(),
        kind,
        svg: sanitizedPreview,
        slice: kind === "frame" ? slice : undefined,
        recolor,
      });

      setDesigns((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      setSuccessMsg(`Design "${saved.name}" saved successfully!`);
      setTimeout(() => setSuccessMsg(null), 3500);

      // Reset input form
      setSvgInput("");
      setName("");
      setSanitizedPreview(null);
      setPreviewId(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  const handleDeleteDesign = async (id: string) => {
    await assetLibrary.remove(id);
    setDesigns((prev) => prev.filter((d) => d.id !== id));
  };

  const handleApplyToSheet = (asset: CustomAsset) => {
    // Embed in current character for zero-loss export
    embedCustomAsset(asset);

    const customId = `custom:${asset.id}`;
    if (asset.kind === "frame") {
      setGlobalTheme({ defaultFrame: customId });
    } else if (asset.kind === "corners") {
      setGlobalTheme({ defaultCorners: customId });
    } else if (asset.kind === "watermark") {
      setGlobalTheme({ defaultWatermark: customId });
    } else if (asset.kind === "pattern") {
      setGlobalTheme({ defaultPattern: customId });
    }

    setSuccessMsg(`Applied "${asset.name}" as sheet default ${asset.kind}!`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const getPreviewSvgUrl = (svgMarkup: string, shouldRecolor: boolean) => {
    let svg = svgMarkup;
    if (shouldRecolor) {
      svg = svg
        .replace(/\{\{COLOR\}\}/g, theme.borderColor || "#ffffff")
        .replace(/\{\{ACCENT\}\}/g, theme.accentColor || "#00f0ff")
        .replace(/currentColor/g, theme.borderColor || "#ffffff");
    }
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  };

  return createPortal(
    <div className="modal-overlay my-designs-overlay" onClick={onClose} role="presentation">
      <div
        className="modal-content my-designs-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="my-designs-title"
      >
        <div className="modal-header">
          <div className="my-designs-title-group">
            <span className="my-designs-icon">🎨</span>
            <div>
              <h2 id="my-designs-title">My Designs (Custom SVGs)</h2>
              <span className="my-designs-subtitle">
                Upload or paste sanitized SVG frames, corners, watermarks, and patterns.
              </span>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        {errorMsg && <div className="my-designs-alert error">{errorMsg}</div>}
        {successMsg && <div className="my-designs-alert success">{successMsg}</div>}

        <div className="my-designs-grid-layout">
          {/* Left Column: Creator / Uploader Form */}
          <form className="my-designs-form" onSubmit={handleSaveDesign}>
            <h3 className="my-designs-section-heading">Add New SVG Design</h3>

            <div className="form-group">
              <label>Design Kind</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as CustomAssetKind)}
                className="select-input"
              >
                <option value="frame">🖼️ Frame (9-Slice Border)</option>
                <option value="corners">✨ Corner Accent (Overlay)</option>
                <option value="watermark">🛡️ Watermark / Decal Emblem</option>
                <option value="pattern">🕸️ Tileable Pattern</option>
              </select>
            </div>

            <div className="form-group">
              <label>Design Name</label>
              <input
                type="text"
                placeholder="e.g. Dragon Filigree, Cyber Frame"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                className="text-input"
                required
              />
            </div>

            {kind === "frame" && (
              <div className="form-group">
                <label>
                  9-Slice Inset: <strong>{slice}px</strong>
                </label>
                <input
                  type="range"
                  min={8}
                  max={96}
                  step={2}
                  value={slice}
                  onChange={(e) => setSlice(Number(e.target.value))}
                  className="slider-input"
                />
                <span className="form-hint">Corner slicing boundary (standard: 32).</span>
              </div>
            )}

            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={recolor}
                onChange={(e) => setRecolor(e.target.checked)}
              />
              <span>Recolor dynamically with theme (replaces {"{{COLOR}}"} and {"{{ACCENT}}"})</span>
            </label>

            <div className="form-group">
              <label>Upload SVG File or Paste Markup</label>
              <input
                type="file"
                accept=".svg,image/svg+xml"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="file-input"
              />
            </div>

            <div className="form-group">
              <textarea
                placeholder="<svg viewBox='0 0 96 96' ...> ... </svg>"
                value={svgInput}
                onChange={(e) => setSvgInput(e.target.value)}
                rows={6}
                className="code-textarea"
                aria-label="Paste SVG markup"
              />
            </div>

            {/* Live Sanitization Preview */}
            {sanitizedPreview && previewId && (
              <div className="preview-container">
                <div className="preview-header">
                  <span>Sanitized Preview ({previewId})</span>
                </div>
                <div
                  className="preview-box"
                  style={{ backgroundColor: theme.cardBackground }}
                >
                  <img
                    src={getPreviewSvgUrl(sanitizedPreview, recolor)}
                    alt="Sanitized preview"
                    className="preview-img"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary my-designs-submit-btn"
              disabled={!sanitizedPreview || !name.trim()}
            >
              💾 Save to My Designs
            </button>
          </form>

          {/* Right Column: Library of Saved Designs */}
          <div className="my-designs-library">
            <h3 className="my-designs-section-heading">
              Saved Designs ({designs.length})
            </h3>

            {designs.length === 0 ? (
              <div className="my-designs-empty-state">
                <span className="empty-icon">📁</span>
                <p>No custom SVG designs saved yet.</p>
                <span className="empty-hint">
                  Upload or paste an SVG above to store it in your browser library.
                </span>
              </div>
            ) : (
              <div className="my-designs-cards-list">
                {designs.map((asset) => (
                  <div key={asset.id} className="design-card">
                    <div
                      className="design-card-preview"
                      style={{ backgroundColor: theme.cardBackground }}
                    >
                      <img
                        src={getPreviewSvgUrl(asset.svg, asset.recolor ?? true)}
                        alt={asset.name}
                        className="design-card-img"
                      />
                    </div>

                    <div className="design-card-info">
                      <div className="design-card-header-row">
                        <span className="design-card-name">{asset.name}</span>
                        <span className="design-card-kind-badge">{asset.kind}</span>
                      </div>
                      <span className="design-card-id">{asset.id}</span>
                      <div className="design-card-actions">
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleApplyToSheet(asset)}
                          title="Apply as sheet default"
                        >
                          ✨ Apply to Sheet
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost danger-btn"
                          onClick={() => handleDeleteDesign(asset.id)}
                          title="Delete from My Designs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
