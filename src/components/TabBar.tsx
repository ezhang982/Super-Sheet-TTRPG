import React, { useState } from "react";
import { useCharacterStore } from "../store/useCharacterStore";

export const TabBar: React.FC = () => {
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const activeTabId = character.activeTabId;
  const setActiveTab = useCharacterStore((state) => state.setActiveTab);
  const addTab = useCharacterStore((state) => state.addTab);
  const renameTab = useCharacterStore((state) => state.renameTab);
  const removeTab = useCharacterStore((state) => state.removeTab);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [confirmDeleteTabId, setConfirmDeleteTabId] = useState<string | null>(null);

  const handleStartRename = (tabId: string, currentLabel: string) => {
    if (mode !== "edit") return;
    setEditingTabId(tabId);
    setEditingLabel(currentLabel);
  };

  const handleFinishRename = (tabId: string) => {
    if (editingLabel.trim()) {
      renameTab(tabId, editingLabel.trim());
    }
    setEditingTabId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (character.tabs.length <= 1) return;

    const blockCount = character.layouts[tabId]?.length ?? 0;
    if (blockCount > 0) {
      setConfirmDeleteTabId(tabId);
    } else {
      removeTab(tabId);
    }
  };

  const confirmTab = character.tabs.find((t) => t.id === confirmDeleteTabId);
  const confirmBlockCount = confirmDeleteTabId
    ? character.layouts[confirmDeleteTabId]?.length ?? 0
    : 0;

  return (
    <nav className="tab-bar">
      <div className="tab-bar-left">
        <div className="tab-list">
          {character.tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                className={`tab-item ${isActive ? "active" : ""}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {isEditing ? (
                  <input
                    type="text"
                    className="tab-rename-input"
                    value={editingLabel}
                    autoFocus
                    onChange={(e) => setEditingLabel(e.target.value)}
                    onBlur={() => handleFinishRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleFinishRename(tab.id);
                      if (e.key === "Escape") setEditingTabId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="tab-label"
                    onDoubleClick={() => handleStartRename(tab.id, tab.label)}
                    title={mode === "edit" ? "Double-click to rename" : ""}
                  >
                    {tab.label}
                  </span>
                )}

                {mode === "edit" && character.tabs.length > 1 && (
                  <button
                    type="button"
                    className="tab-delete-btn"
                    title="Delete tab"
                    onClick={(e) => handleDeleteClick(e, tab.id)}
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}

          {mode === "edit" && (
            <button
              type="button"
              className="add-tab-btn"
              onClick={() => addTab(`Tab ${character.tabs.length + 1}`)}
              title="Create a new tab"
            >
              + Tab
            </button>
          )}
        </div>
      </div>

      {/* Tiny Unobtrusive Edit/Play Mode Toggle (Matching Wireframe Top-Right) */}
      <div className="tab-bar-right">
        <div className="tiny-mode-toggle" title="Toggle Edit / Play mode">
          <button
            type="button"
            className={`tiny-mode-btn ${mode === "edit" ? "active edit" : ""}`}
            onClick={() => setMode("edit")}
          >
            Edit
          </button>
          <button
            type="button"
            className={`tiny-mode-btn ${mode === "play" ? "active play" : ""}`}
            onClick={() => setMode("play")}
          >
            Play
          </button>
        </div>
      </div>

      {/* Tab Deletion Confirmation Modal */}
      {confirmDeleteTabId && confirmTab && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ marginBottom: "8px" }}>Delete Tab: "{confirmTab.label}"?</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", lineHeight: "1.4" }}>
              This tab contains <strong>{confirmBlockCount}</strong> block{confirmBlockCount === 1 ? "" : "s"}.
              Deleting this tab will permanently delete all blocks residing on it.
            </p>
            <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "8px" }}>
              If you wish to keep them, click Cancel and move them to another tab first.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setConfirmDeleteTabId(null)}>
                Cancel
              </button>
              <button
                type="button"
                style={{ borderColor: "#e06c75", color: "#e06c75" }}
                onClick={() => {
                  removeTab(confirmDeleteTabId);
                  setConfirmDeleteTabId(null);
                }}
              >
                Delete Tab & Blocks
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
