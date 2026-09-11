import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import type { BlockType } from "../types/schema";
import { ThemeDrawer } from "./ThemeDrawer";
import { RestActionModal } from "./RestActionModal";
import { NewCharacterModal } from "./NewCharacterModal";
import { CharacterSwitcherModal } from "./CharacterSwitcherModal";

export const FloatingToolsMenu: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const character = useCharacterStore((state) => state.character);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const exportCharacter = useCharacterStore((state) => state.exportCharacter);
  const exportTemplate = useCharacterStore((state) => state.exportTemplate);
  const importCharacter = useCharacterStore((state) => state.importCharacter);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isNewCharOpen, setIsNewCharOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Floating position state (default right: 32px, top: 70px)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize position near top right on mount and listen for resize
  useEffect(() => {
    if (typeof window !== "undefined") {
      const defaultX = Math.max(20, window.innerWidth - 76);
      const defaultY = 70;
      setPosition({ x: defaultX, y: defaultY });

      const handleResize = () => {
        setPosition((prev) => {
          if (!prev) return prev;
          const clampedX = Math.max(16, Math.min(window.innerWidth - 60, prev.x));
          const clampedY = Math.max(16, Math.min(window.innerHeight - 60, prev.y));
          return { x: clampedX, y: clampedY };
        });
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on the circular FAB or the menu header
    const target = e.target as HTMLElement;
    const isFab = !!target.closest(".floating-tools-fab");
    const isHeader = !!target.closest(".tools-menu-header");
    if (!isFab && !isHeader) return;

    hasDraggedRef.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const initX = position?.x ?? Math.max(20, window.innerWidth - 76);
    const initY = position?.y ?? 70;

    dragStartRef.current = { startX, startY, initX, initY };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        hasDraggedRef.current = true;
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
    if (!hasDraggedRef.current) {
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
          showToast("Sheet imported successfully!");
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

  const handleExportCharacter = () => {
    exportCharacter();
    setIsOpen(false);
    showToast("Character sheet exported!");
  };

  const handleExportTemplate = () => {
    exportTemplate();
    setIsOpen(false);
    showToast("Clean template exported!");
  };

  // Compute smart positioning for open menu based on screen edge proximity
  const isNearRight = !position || (typeof window !== "undefined" && position.x > window.innerWidth / 2);
  const isNearBottom = !!position && (typeof window !== "undefined" && position.y > window.innerHeight - 340);

  return (
    <div
      ref={menuRef}
      className={`floating-tools-wrapper ${isOpen ? "open" : ""}`}
      style={{
        left: position ? `${position.x}px` : "auto",
        top: position ? `${position.y}px` : "70px",
        right: position ? "auto" : "24px",
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Draggable FAB circular trigger */}
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
        <div
          className="tools-menu-content"
          style={{
            top: isNearBottom ? "auto" : "52px",
            bottom: isNearBottom ? "52px" : "auto",
            right: isNearRight ? 0 : "auto",
            left: isNearRight ? "auto" : 0,
          }}
        >
          <div className="tools-menu-header" title="Drag to move">
            <span className="tools-menu-title">Sheet Tools</span>
            <span className="tools-menu-hint">(Drag to move)</span>
          </div>

          <div className="tools-menu-items">
            <button
              type="button"
              className="tools-btn"
              style={{
                background: "linear-gradient(135deg, rgba(224, 108, 117, 0.18), rgba(97, 175, 239, 0.18))",
                borderColor: "var(--accent-color, #e06c75)",
                fontWeight: 600,
                color: "var(--accent-color, #e06c75)",
              }}
              onClick={() => {
                setIsNewCharOpen(true);
                setIsOpen(false);
              }}
            >
              ✨ + New Sheet
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={() => {
                setIsSwitcherOpen(true);
                setIsOpen(false);
              }}
            >
              👥 Switch Character
            </button>

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
                    <button type="button" onClick={() => handleAddBlock("inventory")}>
                      🎒 Container / Inventory
                    </button>
                    <button type="button" onClick={() => handleAddBlock("skill_list")}>
                      🎯 Skill List
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="tools-btn"
              onClick={() => {
                setIsThemeOpen(true);
                setIsOpen(false);
              }}
            >
              🎨 Theme & Styling
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={() => {
                setIsRestModalOpen(true);
                setIsOpen(false);
              }}
            >
              ⏳ Rest Actions
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={handleExportCharacter}
            >
              💾 Export Sheet
            </button>

            <button
              type="button"
              className="tools-btn"
              onClick={handleExportTemplate}
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

      {/* Temporary Toast feedback */}
      {toastMessage && <div className="floating-toast">{toastMessage}</div>}

      {/* Global Theme Customizer Drawer */}
      <ThemeDrawer isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)} />

      {/* Rest Actions Configuration Modal */}
      <RestActionModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
      />

      {/* New Character Sheet Modal */}
      <NewCharacterModal
        isOpen={isNewCharOpen}
        onClose={() => setIsNewCharOpen(false)}
        onToast={showToast}
      />

      {/* Character Switcher Modal */}
      <CharacterSwitcherModal
        isOpen={isSwitcherOpen}
        onClose={() => setIsSwitcherOpen(false)}
        onToast={showToast}
        onOpenNewModal={() => setIsNewCharOpen(true)}
      />

      {/* Error Modal rendered via createPortal */}
      {importError &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="modal-overlay" onClick={() => setImportError(null)}>
            <div
              className="modal-dialog"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-header">
                <h3 style={{ color: "#e06c75" }}>Import Validation Failed</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setImportError(null)}
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p
                  style={{
                    fontSize: "0.875rem",
                    color: "var(--text-muted)",
                    wordBreak: "break-word",
                  }}
                >
                  {importError}
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setImportError(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
