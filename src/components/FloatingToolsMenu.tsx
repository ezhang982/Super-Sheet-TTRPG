import React, { useState, useRef, useEffect } from "react";
import { useCharacterStore } from "../store/useCharacterStore";
import type { BlockType } from "../types/schema";

export const FloatingToolsMenu: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const character = useCharacterStore((state) => state.character);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const exportCharacter = useCharacterStore((state) => state.exportCharacter);
  const exportTemplate = useCharacterStore((state) => state.exportTemplate);
  const importCharacter = useCharacterStore((state) => state.importCharacter);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Floating position state (default right: 32px, top: 80px)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize position near top right on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultX = Math.max(20, window.innerWidth - 80);
      const defaultY = 80;
      setPosition({ x: defaultX, y: defaultY });
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on the FAB button or header drag handle, not inside menu inputs
    if ((e.target as HTMLElement).closest(".tools-menu-content")) return;

    setIsDragging(false);
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position?.x ?? (window.innerWidth - 80);
    const initY = position?.y ?? 80;

    dragStartRef.current = { startX, startY, initX, initY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        setIsDragging(true);
      }
      const newX = Math.max(16, Math.min(window.innerWidth - 60, initX + dx));
      const newY = Math.max(16, Math.min(window.innerHeight - 60, initY + dy));
      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  };

  const handleFabClick = () => {
    if (!isDragging) {
      setIsOpen(!isOpen);
    }
  };

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
          setIsOpen(false);
        }
      } catch (err) {
        setImportError(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddBlock = (type: BlockType) => {
    addBlock(character.activeTabId, type);
    setShowAddMenu(false);
    setIsOpen(false);
  };

  if (!position) return null;

  return (
    <div
      ref={menuRef}
      className={`floating-tools-wrapper ${isOpen ? "open" : ""}`}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      onPointerDown={handlePointerDown}
    >
      {/* Draggable Circular FAB Icon */}
      <button
        type="button"
        className="floating-tools-fab"
        onClick={handleFabClick}
        title="Tools & Settings (Drag to move)"
      >
        <span className="fab-icon">{isOpen ? "×" : "⚙"}</span>
      </button>

      {/* Expanded Tools Menu Panel */}
      {isOpen && (
        <div className="tools-menu-content">
          <div className="tools-menu-header">
            <span className="tools-menu-title">Sheet Tools</span>
            <span className="tools-menu-hint">(Drag icon to move)</span>
          </div>

          <div className="tools-menu-items">
            {mode === "edit" && (
              <div className="tools-menu-item-group">
                <button
                  type="button"
                  className="tools-btn primary"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                >
                  + Add Block ▾
                </button>
                {showAddMenu && (
                  <div className="tools-submenu">
                    <button type="button" onClick={() => handleAddBlock("profile")}>
                      👤 Character Profile
                    </button>
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

            <button
              type="button"
              className="tools-btn"
              onClick={() => {
                exportCharacter();
                setIsOpen(false);
              }}
            >
              💾 Export Sheet
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={() => {
                exportTemplate();
                setIsOpen(false);
              }}
            >
              📋 Export Template
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              📥 Import Sheet
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
      )}

      {/* Error Modal */}
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
    </div>
  );
};
