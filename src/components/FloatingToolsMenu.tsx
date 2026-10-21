import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import type { BlockType } from "../types/schema";
import { Icon } from "./ui/Icon";
import {
  faGear,
  faXmark,
  faMagnifyingGlass,
  faPlus,
  faUsers,
  faUser,
  faHeartPulse,
  faSliders,
  faBookOpen,
  faCircleDot,
  faPenToSquare,
  faBoxesStacked,
  faCrosshairs,
  faPalette,
  faLayerGroup,
  faHourglassHalf,
  faScroll,
  faTags,
  faPrint,
  faKeyboard,
  faLightbulb,
  faFloppyDisk,
  faFileExport,
  faFileImport,
} from "@fortawesome/free-solid-svg-icons";

export interface FloatingToolsMenuProps {
  onOpenOmnisearch?: () => void;
  onOpenShortcuts?: () => void;
  onOpenScratchpad?: () => void;
  onOpenTagManager?: () => void;
  onOpenMyDesigns?: () => void;
  onOpenTheme?: () => void;
  onOpenRest?: () => void;
  onOpenNewChar?: () => void;
  onOpenSwitcher?: () => void;
}

export const FloatingToolsMenu: React.FC<FloatingToolsMenuProps> = ({
  onOpenOmnisearch,
  onOpenShortcuts,
  onOpenScratchpad,
  onOpenTagManager,
  onOpenMyDesigns,
  onOpenTheme,
  onOpenRest,
  onOpenNewChar,
  onOpenSwitcher,
}) => {
  const mode = useCharacterStore((state) => state.mode);
  const character = useCharacterStore((state) => state.character);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const exportCharacter = useCharacterStore((state) => state.exportCharacter);
  const exportTemplate = useCharacterStore((state) => state.exportTemplate);
  const importCharacter = useCharacterStore((state) => state.importCharacter);
  const enableTagSuggestions = useCharacterStore((state) => state.enableTagSuggestions);
  const setEnableTagSuggestions = useCharacterStore((state) => state.setEnableTagSuggestions);

  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Floating position state (default right: 32px, top: 70px)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(() => {
    if (typeof window !== "undefined") {
      return { x: Math.max(20, window.innerWidth - 76), y: 70 };
    }
    return null;
  });
  const hasDraggedRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initX: number; initY: number }>({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listen for window resize to keep floating menu within viewport boundaries
  useEffect(() => {
    if (typeof window !== "undefined") {
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
        <span className="fab-icon">
          <Icon icon={isOpen ? faXmark : faGear} size="lg" />
        </span>
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
            {onOpenOmnisearch && (
              <button
                type="button"
                className="tools-btn"
                style={{
                  background: "rgba(97, 175, 239, 0.12)",
                  borderColor: "rgba(97, 175, 239, 0.4)",
                  color: "#61afef",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
                onClick={() => {
                  onOpenOmnisearch();
                  setIsOpen(false);
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon={faMagnifyingGlass} /> Omnisearch
                </span>
                <kbd style={{ fontSize: "0.65rem", padding: "1px 5px", background: "rgba(0,0,0,0.3)", borderRadius: "3px" }}>Ctrl+K</kbd>
              </button>
            )}

            <button
              type="button"
              className="tools-btn"
              style={{
                background: "linear-gradient(135deg, rgba(224, 108, 117, 0.18), rgba(97, 175, 239, 0.18))",
                borderColor: "var(--accent-color, #e06c75)",
                fontWeight: 600,
                color: "var(--accent-color, #e06c75)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() => {
                onOpenNewChar?.();
                setIsOpen(false);
              }}
            >
              <Icon icon={faPlus} /> New Sheet
            </button>

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={() => {
                onOpenSwitcher?.();
                setIsOpen(false);
              }}
            >
              <Icon icon={faUsers} /> Switch Character
            </button>

            {mode === "edit" && (
              <div className="tools-menu-item-group">
                <button
                  type="button"
                  className="tools-btn primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                  onClick={() => setShowAddMenu(!showAddMenu)}
                >
                  <Icon icon={faPlus} /> Add Block ▾
                </button>
                {showAddMenu && (
                  <div className="tools-submenu">
                    <button type="button" onClick={() => handleAddBlock("profile")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faUser} /> Character Profile
                    </button>
                    <button type="button" onClick={() => handleAddBlock("tracker")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faHeartPulse} /> Tracker (HP/Counters)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("stat_group")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faSliders} /> Stat Group (Attributes)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("card")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faBookOpen} /> Feature Card (Actions)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("pip_array")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faCircleDot} /> Pip Matrix (Slots/Pips)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("notes")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faPenToSquare} /> Notes Block (Markdown)
                    </button>
                    <button type="button" onClick={() => handleAddBlock("inventory")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faBoxesStacked} /> Container / Inventory
                    </button>
                    <button type="button" onClick={() => handleAddBlock("skill_list")} style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <Icon icon={faCrosshairs} /> Skill List
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={() => {
                onOpenTheme?.();
                setIsOpen(false);
              }}
            >
              <Icon icon={faPalette} /> Theme & Styling
            </button>

            {onOpenMyDesigns && (
              <button
                type="button"
                className="tools-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                onClick={() => {
                  onOpenMyDesigns();
                  setIsOpen(false);
                }}
              >
                <Icon icon={faLayerGroup} /> My Designs (Custom SVGs)
              </button>
            )}

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={() => {
                onOpenRest?.();
                setIsOpen(false);
              }}
            >
              <Icon icon={faHourglassHalf} /> Rest Actions
            </button>

            {onOpenScratchpad && (
              <button
                type="button"
                className="tools-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                onClick={() => {
                  onOpenScratchpad();
                  setIsOpen(false);
                }}
              >
                <Icon icon={faScroll} /> Session Scratchpad
              </button>
            )}

            {onOpenTagManager && (
              <button
                type="button"
                className="tools-btn"
                style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                onClick={() => {
                  onOpenTagManager();
                  setIsOpen(false);
                }}
              >
                <Icon icon={faTags} /> Tag Manager & Colors
              </button>
            )}

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={() => {
                setIsOpen(false);
                setTimeout(() => {
                  window.print();
                }, 150);
              }}
            >
              <Icon icon={faPrint} /> Print Sheet / PDF
            </button>

            {onOpenShortcuts && (
              <button
                type="button"
                className="tools-btn"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                onClick={() => {
                  onOpenShortcuts();
                  setIsOpen(false);
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <Icon icon={faKeyboard} /> Shortcuts
                </span>
                <kbd style={{ fontSize: "0.65rem", padding: "1px 5px", background: "rgba(0,0,0,0.3)", borderRadius: "3px" }}>?</kbd>
              </button>
            )}

            <div className="tools-setting-row" style={{ padding: "4px 8px", background: "rgba(0,0,0,0.2)", borderRadius: "4px", margin: "2px 0" }}>
              <label className="checkbox-label" style={{ fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "var(--text-muted)" }}>
                <input
                  type="checkbox"
                  checked={enableTagSuggestions}
                  onChange={(e) => setEnableTagSuggestions(e.target.checked)}
                />
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Icon icon={faLightbulb} /> Auto Tag Suggestions
                </span>
              </label>
            </div>

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={handleExportCharacter}
            >
              <Icon icon={faFloppyDisk} /> Export Sheet
            </button>

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={handleExportTemplate}
            >
              <Icon icon={faFileExport} /> Export Template
            </button>

            <button
              type="button"
              className="tools-btn"
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Icon icon={faFileImport} /> Import Sheet
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
