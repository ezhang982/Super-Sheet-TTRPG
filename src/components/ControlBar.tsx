import React, { useRef, useState } from "react";
import { useCharacterStore } from "../store/useCharacterStore";
import type { BlockType } from "../types/schema";

export const ControlBar: React.FC = () => {
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const setCharacterMeta = useCharacterStore((state) => state.setCharacterMeta);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);
  const exportCharacter = useCharacterStore((state) => state.exportCharacter);
  const exportTemplate = useCharacterStore((state) => state.exportTemplate);
  const importCharacter = useCharacterStore((state) => state.importCharacter);

  const [importError, setImportError] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const result = importCharacter(json);
        if (!result.success) {
          setImportError(result.error);
        } else {
          setImportError(null);
        }
      } catch (err) {
        setImportError(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    // Reset file input value so user can import the same file again if edited
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddBlock = (type: BlockType) => {
    addBlock(character.activeTabId, type);
    setShowAddMenu(false);
  };

  return (
    <header className="control-bar">
      <div className="control-bar-left">
        <div className="character-title-area">
          {mode === "edit" ? (
            <input
              type="text"
              className="character-name-input"
              value={character.meta.name}
              onChange={(e) => setCharacterMeta({ name: e.target.value })}
              placeholder="Character Name"
            />
          ) : (
            <h1 className="character-name-display">{character.meta.name || "Unnamed Character"}</h1>
          )}
          <span className="character-system-badge">
            {mode === "edit" ? (
              <input
                type="text"
                className="character-system-input"
                value={character.meta.system}
                onChange={(e) => setCharacterMeta({ system: e.target.value })}
                placeholder="Game System"
              />
            ) : (
              character.meta.system || "Custom System"
            )}
          </span>
        </div>
      </div>

      <div className="control-bar-center">
        {/* Mode Switcher */}
        <div className="mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${mode === "edit" ? "active edit" : ""}`}
            onClick={() => setMode("edit")}
          >
            ✏️ Edit Mode
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === "play" ? "active play" : ""}`}
            onClick={() => setMode("play")}
          >
            🎲 Play Mode
          </button>
        </div>

        {/* Undo / Redo (active in Edit Mode) */}
        <div className="history-group">
          <button
            type="button"
            className="history-btn"
            disabled={mode !== "edit"}
            onClick={undo}
            title="Undo structural change (Ctrl+Z)"
          >
            ↩️ Undo
          </button>
          <button
            type="button"
            className="history-btn"
            disabled={mode !== "edit"}
            onClick={redo}
            title="Redo structural change (Ctrl+Shift+Z)"
          >
            ↪️ Redo
          </button>
        </div>
      </div>

      <div className="control-bar-right">
        {/* Add Block Dropdown (Edit Mode only) */}
        {mode === "edit" && (
          <div className="add-block-container">
            <button
              type="button"
              className="action-btn primary"
              onClick={() => setShowAddMenu(!showAddMenu)}
            >
              + Add Block ▾
            </button>
            {showAddMenu && (
              <div className="add-block-menu">
                <button type="button" onClick={() => handleAddBlock("tracker")}>
                  📊 Tracker (HP/Counters)
                </button>
                <button type="button" onClick={() => handleAddBlock("stat_group")}>
                  🏷️ Stat Group (Attributes)
                </button>
                <button type="button" onClick={() => handleAddBlock("card")}>
                  🃏 Feature Card (Actions)
                </button>
                <button type="button" onClick={() => handleAddBlock("pip_array")}>
                  🔘 Pip Matrix (Slots/Pips)
                </button>
                <button type="button" onClick={() => handleAddBlock("notes")}>
                  📝 Notes Block (Markdown)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Export / Import Menu */}
        <div className="persistence-group">
          <button
            type="button"
            className="action-btn"
            onClick={() => exportCharacter()}
            title="Download character sheet as JSON"
          >
            💾 Export
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => exportTemplate()}
            title="Download template stripped of values"
          >
            📋 Template
          </button>
          <button
            type="button"
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import character JSON file"
          >
            📂 Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Validation / Import Error Modal */}
      {importError && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <h3 style={{ color: "#e06c75", marginBottom: "8px" }}>Import Validation Failed</h3>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "16px", wordBreak: "break-word" }}>
              {importError}
            </p>
            <div className="modal-actions">
              <button type="button" onClick={() => setImportError(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
