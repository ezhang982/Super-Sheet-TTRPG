import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./ui/Icon";
import {
  faKeyboard,
  faXmark,
  faCompass,
  faWrench,
  faDiceD20,
  faLightbulb,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  desc: string;
  context?: string;
}

interface ShortcutCategory {
  title: string;
  icon: IconDefinition;
  items: ShortcutItem[];
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const categories: ShortcutCategory[] = [
    {
      title: "Navigation & Modes",
      icon: faCompass,
      items: [
        { keys: ["Ctrl", "K"], desc: "Open Omnisearch & Command Palette" },
        { keys: ["Ctrl", "P"], desc: "Print Character Sheet / Export PDF" },
        { keys: ["E"], desc: "Toggle Edit Mode / Play Mode", context: "when not typing" },
        { keys: ["Ctrl", "E"], desc: "Toggle Edit Mode / Play Mode", context: "universal" },
        { keys: ["?"], desc: "Open Keyboard Shortcuts Cheatsheet", context: "when not typing" },
        { keys: ["Esc"], desc: "Close any modal, popup, or active search" },
      ],
    },
    {
      title: "Authoring & Canvas",
      icon: faWrench,
      items: [
        { keys: ["Ctrl", "B"], desc: "Add new Feature Card to active tab" },
        { keys: ["Ctrl", "T"], desc: "Create a new tab" },
        { keys: ["Drag Tabs"], desc: "Reorder tabs left or right in Edit mode" },
        { keys: ["Resize Edges"], desc: "Drag bottom or right handles for custom width/height" },
        { keys: ["Ctrl", "D"], desc: "Duplicate hovered block in context menu" },
        { keys: ["Ctrl", "Z"], desc: "Undo last layout or block modification" },
        { keys: ["Ctrl", "Shift", "Z"], desc: "Redo last layout modification" },
        { keys: ["Right-Click"], desc: "Open Card Context Menu (duplicate, style, move, delete)" },
        { keys: ["Double-Click"], desc: "Quickly rename block title or tab label" },
      ],
    },
    {
      title: "Tabletop Calculations & Math",
      icon: faDiceD20,
      items: [
        { keys: ["Click Counter"], desc: "Enter rapid math: +10, -5, *2, /2, or exact number" },
        { keys: ["↺ Revert Toast"], desc: "One-click undo for ephemeral counter changes in Play mode" },
        { keys: ["Click Dice (e.g. 2d6)"], desc: "Roll dice notation or copy command to clipboard" },
        { keys: ["↵ Enter"], desc: "Commit quick math or formula edit" },
        { keys: ["@"], desc: "Summon live variable autocomplete popup in formula inputs" },
        { keys: ["{ @var }"], desc: "Interpolate dynamic variables in Markdown descriptions" },
        { keys: ["+ ƒx Variable"], desc: "Insert sheet variables directly into card description text" },
      ],
    },
  ];

  return createPortal(
    <div className="shortcuts-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="shortcuts-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header">
          <div className="shortcuts-header-title">
            <span className="shortcuts-title-icon"><Icon icon={faKeyboard} /></span>
            <h2>Keyboard Shortcuts & Gestures</h2>
          </div>
          <button type="button" className="shortcuts-close-btn" onClick={onClose} title="Close (Esc)">
            <Icon icon={faXmark} />
          </button>
        </div>

        <div className="shortcuts-modal-body">
          {categories.map((cat) => (
            <div key={cat.title} className="shortcuts-category-section">
              <h3 className="shortcuts-category-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="cat-icon"><Icon icon={cat.icon} /></span>
                <span>{cat.title}</span>
              </h3>
              <div className="shortcuts-list">
                {cat.items.map((item, idx) => (
                  <div key={idx} className="shortcut-row">
                    <span className="shortcut-desc">
                      {item.desc}
                      {item.context && <span className="shortcut-context"> ({item.context})</span>}
                    </span>
                    <div className="shortcut-keys">
                      {item.keys.map((k, kIdx) => (
                        <React.Fragment key={kIdx}>
                          {kIdx > 0 && !k.startsWith("Click") && <span className="key-plus">+</span>}
                          <kbd>{k}</kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="shortcuts-modal-footer">
          <span className="footer-tip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Icon icon={faLightbulb} />
            <span>
              <strong>Pro Tip:</strong> Press <kbd>Ctrl</kbd>+<kbd>K</kbd> anytime to jump to any block, skill, or item across all tabs.
            </span>
          </span>
          <button type="button" className="btn-primary" onClick={onClose}>
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
