import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { Block } from "../types/schema";
import { useCharacterStore } from "../store/useCharacterStore";

export interface CardContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  block: Block;
  tabId: string;
  onClose: () => void;
  onOpenStyleModal: () => void;
  onStartRename: () => void;
  onStartAddTag: () => void;
  onPopout: () => void;
}

export const CardContextMenu: React.FC<CardContextMenuProps> = ({
  isOpen,
  x,
  y,
  block,
  tabId,
  onClose,
  onOpenStyleModal,
  onStartRename,
  onStartAddTag,
  onPopout,
}) => {
  const character = useCharacterStore((state) => state.character);
  const deleteBlock = useCharacterStore((state) => state.deleteBlock);
  const moveBlockToTab = useCharacterStore((state) => state.moveBlockToTab);

  const menuRef = useRef<HTMLDivElement>(null);

  // Close on Escape or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("pointerdown", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("pointerdown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const otherTabs = character.tabs.filter((t) => t.id !== tabId);

  // Clamp coordinates within screen bounds
  const menuWidth = 210;
  const menuHeight = 240;
  const posX = typeof window !== "undefined" ? Math.min(x, window.innerWidth - menuWidth - 8) : x;
  const posY = typeof window !== "undefined" ? Math.min(y, window.innerHeight - menuHeight - 8) : y;

  return createPortal(
    <div
      ref={menuRef}
      className="card-context-menu"
      style={{ left: `${Math.max(8, posX)}px`, top: `${Math.max(8, posY)}px` }}
      role="menu"
      aria-label={`Options for ${block.title}`}
    >
      <div className="context-menu-header">
        <span className="context-card-title">{block.title}</span>
        <span className="context-card-type">{block.type}</span>
      </div>

      <div className="context-menu-items">
        <button
          type="button"
          className="context-menu-item"
          onClick={() => {
            onPopout();
            onClose();
          }}
        >
          <span className="context-item-icon">⛶</span>
          <span>Expand / Focus View</span>
        </button>

        <button
          type="button"
          className="context-menu-item"
          onClick={() => {
            onOpenStyleModal();
            onClose();
          }}
        >
          <span className="context-item-icon">🎨</span>
          <span>Customize Style & Borders</span>
        </button>

        <button
          type="button"
          className="context-menu-item"
          onClick={() => {
            onStartRename();
            onClose();
          }}
        >
          <span className="context-item-icon">✏️</span>
          <span>Rename Block</span>
        </button>

        <button
          type="button"
          className="context-menu-item"
          onClick={() => {
            onStartAddTag();
            onClose();
          }}
        >
          <span className="context-item-icon">🏷️</span>
          <span>Add Tag</span>
        </button>

        {/* Move to Tab with Submenu */}
        {otherTabs.length > 0 && (
          <div className="context-submenu-group">
            <div className="context-menu-label">
              <span className="context-item-icon">📑</span>
              <span>Move to Tab</span>
            </div>
            <div className="context-tab-options">
              {otherTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="context-tab-btn"
                  onClick={() => {
                    moveBlockToTab(block.id, tabId, t.id);
                    onClose();
                  }}
                >
                  ↳ {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="context-menu-divider" />

        <button
          type="button"
          className="context-menu-item danger"
          onClick={() => {
            deleteBlock(block.id);
            onClose();
          }}
        >
          <span className="context-item-icon">🗑️</span>
          <span>Delete Block</span>
        </button>
      </div>
    </div>,
    document.body
  );
};
