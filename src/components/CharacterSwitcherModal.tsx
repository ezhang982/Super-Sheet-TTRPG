import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import {
  loadManifestAsync,
  type CharacterManifestEntry,
  loadCharacterById as loadCharFromStorage,
  exportCharacterAsJson,
} from "../store/storage";

interface CharacterSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenNewModal: () => void;
}

export const CharacterSwitcherModal: React.FC<CharacterSwitcherModalProps> = ({
  isOpen,
  onClose,
  onToast,
  onOpenNewModal,
}) => {
  const activeChar = useCharacterStore((state) => state.character);
  const loadCharacterById = useCharacterStore((state) => state.loadCharacterById);
  const duplicateCharacter = useCharacterStore((state) => state.duplicateCharacter);
  const deleteCharacter = useCharacterStore((state) => state.deleteCharacter);
  const importCharacter = useCharacterStore((state) => state.importCharacter);

  const [manifest, setManifest] = useState<CharacterManifestEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshList = async () => {
    const list = await loadManifestAsync();
    setManifest(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setConfirmDeleteId(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredManifest = useMemo(() => {
    if (!searchTerm.trim()) return manifest;
    const q = searchTerm.toLowerCase().trim();
    return manifest.filter(
      (m) => m.name.toLowerCase().includes(q) || m.system.toLowerCase().includes(q)
    );
  }, [manifest, searchTerm]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleSwitch = async (entry: CharacterManifestEntry) => {
    if (entry.id === activeChar.meta.id) {
      onClose();
      return;
    }
    setLoadingId(entry.id);
    const success = await loadCharacterById(entry.id);
    setLoadingId(null);
    if (success) {
      onToast(`Switched to ${entry.name}`);
      onClose();
    } else {
      onToast(`Failed to load ${entry.name}`);
    }
  };

  const handleDuplicate = async (entry: CharacterManifestEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const newId = await duplicateCharacter(entry.id);
    if (newId) {
      onToast(`Duplicated ${entry.name}`);
      await refreshList();
    }
  };

  const handleExport = async (entry: CharacterManifestEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const char = await loadCharFromStorage(entry.id);
    if (char) {
      await exportCharacterAsJson(char);
      onToast(`Exported ${entry.name}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (manifest.length <= 1) {
      onToast("Cannot delete the only character sheet.");
      return;
    }
    await deleteCharacter(id);
    onToast("Character deleted");
    setConfirmDeleteId(null);
    await refreshList();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const result = importCharacter(json);
        if (result.success) {
          onToast("Imported character sheet successfully!");
          await refreshList();
          onClose();
        } else {
          onToast(`Import error: ${result.error}`);
        }
      } catch (err) {
        onToast(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatDate = (ms: number) => {
    if (!ms) return "";
    const d = new Date(ms);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog character-switcher-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="char-switcher-title"
        style={{ maxWidth: "640px" }}
      >
        <div className="modal-header">
          <div>
            <h3 id="char-switcher-title" style={{ margin: 0, fontSize: "1.25rem" }}>
              👥 Character Sheets
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.825rem", color: "var(--text-muted)" }}>
              Manage and switch between your locally saved characters
            </p>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Search & Actions Toolbar */}
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div className="skill-search-wrapper" style={{ flex: 1 }}>
              <span className="skill-search-icon">🔍</span>
              <input
                type="text"
                className="skill-search-input"
                placeholder="Search characters by name or system..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="skill-search-clear"
                  onClick={() => setSearchTerm("")}
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{
                backgroundColor: "var(--accent-color, #e06c75)",
                color: "#fff",
                border: "none",
                padding: "6px 12px",
                borderRadius: "6px",
                fontSize: "0.825rem",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={() => {
                onClose();
                onOpenNewModal();
              }}
            >
              + New Sheet
            </button>
          </div>

          {/* Character Cards List */}
          <div
            style={{
              maxHeight: "360px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              paddingRight: "2px",
            }}
          >
            {filteredManifest.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                No characters found.
              </div>
            ) : (
              filteredManifest.map((entry) => {
                const isActive = entry.id === activeChar.meta.id;
                const isConfirmingDelete = confirmDeleteId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`char-switcher-item ${isActive ? "active-sheet" : ""}`}
                    onClick={() => handleSwitch(entry)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${isActive ? "var(--accent-color, #e06c75)" : "var(--border-color, #2f333d)"}`,
                      backgroundColor: isActive ? "rgba(224, 108, 117, 0.08)" : "rgba(0, 0, 0, 0.25)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <div style={{ flex: 1, overflow: "hidden", marginRight: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                          {entry.name || "Untitled Character"}
                        </span>
                        {isActive && (
                          <span
                            style={{
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "1px 6px",
                              borderRadius: "4px",
                              backgroundColor: "var(--accent-color, #e06c75)",
                              color: "#fff",
                            }}
                          >
                            Active
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "0.72rem",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            backgroundColor: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-muted)",
                          }}
                        >
                          {entry.system}
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "3px" }}>
                        Last updated {formatDate(entry.updatedAt)}
                      </div>
                    </div>

                    {/* Actions per card */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
                      {!isActive && (
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            border: "1px solid var(--border-color)",
                            background: "rgba(255, 255, 255, 0.06)",
                            color: "var(--text-main)",
                            cursor: "pointer",
                          }}
                          onClick={() => handleSwitch(entry)}
                          disabled={loadingId === entry.id}
                        >
                          {loadingId === entry.id ? "Loading..." : "Open"}
                        </button>
                      )}

                      <button
                        type="button"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          padding: "4px",
                        }}
                        title="Duplicate character"
                        onClick={(e) => handleDuplicate(entry, e)}
                      >
                        📋
                      </button>

                      <button
                        type="button"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          padding: "4px",
                        }}
                        title="Export JSON backup"
                        onClick={(e) => handleExport(entry, e)}
                      >
                        💾
                      </button>

                      {manifest.length > 1 && (
                        <>
                          {isConfirmingDelete ? (
                            <button
                              type="button"
                              style={{
                                backgroundColor: "#e06c75",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                padding: "3px 6px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                cursor: "pointer",
                              }}
                              onClick={(e) => handleDelete(entry.id, e)}
                              title="Confirm deletion"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              type="button"
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-dim)",
                                cursor: "pointer",
                                fontSize: "0.9rem",
                                padding: "4px",
                              }}
                              title="Delete sheet"
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDeleteId(entry.id);
                              }}
                            >
                              🗑️
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color, #2f333d)",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color, #2f333d)",
              color: "var(--text-muted)",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.825rem",
            }}
          >
            📂 Import JSON File...
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color, #2f333d)",
              color: "var(--text-color, #abb2bf)",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
