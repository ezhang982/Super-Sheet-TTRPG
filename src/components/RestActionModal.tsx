import React, { useState } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";

interface RestActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RestActionModal: React.FC<RestActionModalProps> = ({ isOpen, onClose }) => {
  const restActions = useCharacterStore((state) => state.restActions);
  const addRestAction = useCharacterStore((state) => state.addRestAction);
  const removeRestAction = useCharacterStore((state) => state.removeRestAction);

  const [label, setLabel] = useState("");
  const [tag, setTag] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = label.trim();
    let cleanTag = tag.trim();

    if (!cleanLabel) {
      setError("Please enter a name for the rest action.");
      return;
    }
    if (!cleanTag) {
      setError("Please enter a semantic tag.");
      return;
    }

    if (!cleanTag.startsWith("#")) {
      cleanTag = `#${cleanTag}`;
    }

    if (restActions.some((r) => r.tag === cleanTag)) {
      setError(`A rest action using tag ${cleanTag} already exists.`);
      return;
    }

    addRestAction(cleanLabel, cleanTag);
    setLabel("");
    setTag("");
    setError(null);
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog rest-action-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="rest-action-dialog-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">⏳</span>
            <h3 id="rest-action-dialog-title">Configure Rest Actions</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close rest action settings"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p className="modal-description">
            Rest actions reset counters, trackers, and pip matrices that share their semantic tag.
          </p>

          <div className="rest-action-list">
            {restActions.map((action) => {
              const isDefault =
                action.tag === "#short-rest" || action.tag === "#long-rest";
              return (
                <div key={action.id} className="rest-action-item">
                  <div className="rest-action-info">
                    <span className="rest-action-label">{action.label}</span>
                    <span className="rest-action-tag">{action.tag}</span>
                  </div>
                  {!isDefault ? (
                    <button
                      type="button"
                      className="rest-action-delete-btn"
                      onClick={() => removeRestAction(action.id)}
                      title={`Delete ${action.label}`}
                    >
                      ×
                    </button>
                  ) : (
                    <span className="rest-action-badge">Default</span>
                  )}
                </div>
              );
            })}
          </div>

          <form onSubmit={handleAdd} className="rest-action-form">
            <h4>Add New Rest Action</h4>
            {error && <div className="form-error-msg">{error}</div>}

            <div className="form-row-group">
              <div className="form-row">
                <label>Action Label</label>
                <input
                  type="text"
                  placeholder="e.g. Scene, Session, Downtime"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div className="form-row">
                <label>Semantic Tag</label>
                <input
                  type="text"
                  placeholder="e.g. #scene"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary rest-add-btn">
              + Add Rest Action
            </button>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
