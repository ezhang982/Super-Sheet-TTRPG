import React, { useState } from "react";
import { useCharacterStore } from "../store/useCharacterStore";

interface TabBarProps {
  onOpenOmnisearch?: () => void;
}

export const TabBar: React.FC<TabBarProps> = ({ onOpenOmnisearch }) => {
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const activeTabId = character.activeTabId;
  const setActiveTab = useCharacterStore((state) => state.setActiveTab);
  const addTab = useCharacterStore((state) => state.addTab);
  const renameTab = useCharacterStore((state) => state.renameTab);
  const removeTab = useCharacterStore((state) => state.removeTab);
  const moveTab = useCharacterStore((state) => state.moveTab);

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState("");
  const [confirmDeleteTabId, setConfirmDeleteTabId] = useState<string | null>(null);
  const [draggedTabIdx, setDraggedTabIdx] = useState<number | null>(null);
  const [dragOverTabIdx, setDragOverTabIdx] = useState<number | null>(null);

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
          {character.tabs.map((tab, idx) => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                className={`tab-item ${isActive ? "active" : ""} ${draggedTabIdx === idx ? "dragging" : ""} ${dragOverTabIdx === idx ? "drag-over" : ""}`}
                onClick={() => setActiveTab(tab.id)}
                draggable={mode === "edit" && !isEditing}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", `${idx}`);
                  setDraggedTabIdx(idx);
                }}
                onDragOver={(e) => {
                  if (mode !== "edit") return;
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (dragOverTabIdx !== idx) setDragOverTabIdx(idx);
                }}
                onDragLeave={() => {
                  if (dragOverTabIdx === idx) setDragOverTabIdx(null);
                }}
                onDragEnd={() => {
                  setDraggedTabIdx(null);
                  setDragOverTabIdx(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTabIdx !== null && draggedTabIdx !== idx) {
                    moveTab(draggedTabIdx, idx);
                  }
                  setDraggedTabIdx(null);
                  setDragOverTabIdx(null);
                }}
              >
                {mode === "edit" && (
                  <span className="tab-drag-handle" title="Drag to reorder tab">
                    ⋮⋮
                  </span>
                )}

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
                    title={mode === "edit" ? "Double-click to rename, or drag to reorder" : ""}
                  >
                    {tab.label}
                  </span>
                )}

                {mode === "edit" && character.tabs.length > 1 && (
                  <div className="tab-action-group" onClick={(e) => e.stopPropagation()}>
                    {idx > 0 && (
                      <button
                        type="button"
                        className="tab-move-btn"
                        title="Move tab left"
                        onClick={() => moveTab(idx, idx - 1)}
                      >
                        ‹
                      </button>
                    )}
                    {idx < character.tabs.length - 1 && (
                      <button
                        type="button"
                        className="tab-move-btn"
                        title="Move tab right"
                        onClick={() => moveTab(idx, idx + 1)}
                      >
                        ›
                      </button>
                    )}
                    <button
                      type="button"
                      className="tab-delete-btn"
                      title="Delete tab"
                      onClick={(e) => handleDeleteClick(e, tab.id)}
                    >
                      ×
                    </button>
                  </div>
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

      {/* Top-Right Tools: Omnisearch & Edit/Play Mode Toggle */}
      <div className="tab-bar-right">
        {onOpenOmnisearch && (
          <button
            type="button"
            className="tab-search-trigger-btn"
            onClick={onOpenOmnisearch}
            title="Search blocks, items, skills, tags, or commands (Ctrl+K)"
          >
            <span className="search-icon">🔍</span>
            <span className="search-text">Search</span>
            <kbd className="search-kbd">Ctrl+K</kbd>
          </button>
        )}

        <div className="tiny-mode-toggle" title="Toggle Edit / Play mode (E)">
          <button
            type="button"
            className={`tiny-mode-btn ${mode === "edit" ? "active edit" : ""}`}
            onClick={() => setMode("edit")}
          >
            Edit <span className="mode-kbd-hint">[E]</span>
          </button>
          <button
            type="button"
            className={`tiny-mode-btn ${mode === "play" ? "active play" : ""}`}
            onClick={() => setMode("play")}
          >
            Play <span className="mode-kbd-hint">[E]</span>
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
