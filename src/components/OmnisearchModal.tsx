import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";

export interface OmnisearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
  onOpenTheme?: () => void;
  onOpenRest?: () => void;
  onOpenNewChar?: () => void;
  onOpenSwitcher?: () => void;
}

interface SearchResultItem {
  id: string;
  category: "Commands" | "Blocks" | "Items" | "Skills" | "Tags";
  title: string;
  subtitle?: string;
  badge?: string;
  hotkey?: string;
  action: () => void;
}

export const OmnisearchModal: React.FC<OmnisearchModalProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
  onOpenTheme,
  onOpenRest,
  onOpenNewChar,
  onOpenSwitcher,
}) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const setActiveTab = useCharacterStore((state) => state.setActiveTab);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const addTab = useCharacterStore((state) => state.addTab);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);
  const exportCharacter = useCharacterStore((state) => state.exportCharacter);
  const setActiveTagFilter = useCharacterStore((state) => state.setActiveTagFilter);

  // Helper to scroll and highlight a block element
  const navigateToBlock = (tabId: string, blockId: string) => {
    setActiveTab(tabId);
    onClose();

    setTimeout(() => {
      // Find block container in DOM
      const element = document.querySelector(`[data-block-id="${blockId}"]`) as HTMLElement;
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.remove("block-search-highlight");
        // Trigger reflow to restart animation if already highlighted
        void element.offsetWidth;
        element.classList.add("block-search-highlight");
        setTimeout(() => {
          element.classList.remove("block-search-highlight");
        }, 3000);
      }
    }, 120);
  };

  // Compile full search index
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Actions & Commands
    const commands: SearchResultItem[] = [
      {
        id: "cmd_mode_toggle",
        category: "Commands",
        title: mode === "edit" ? "Switch to Play Mode" : "Switch to Edit Mode",
        subtitle: "Toggle sheet between editing and live gameplay",
        badge: "Mode",
        hotkey: "E",
        action: () => {
          setMode(mode === "edit" ? "play" : "edit");
          onClose();
        },
      },
      {
        id: "cmd_add_block",
        category: "Commands",
        title: "Add New Feature Card",
        subtitle: `Create a new block in ${character.tabs.find((t) => t.id === character.activeTabId)?.label || "current tab"}`,
        badge: "Canvas",
        hotkey: "Ctrl+B",
        action: () => {
          addBlock(character.activeTabId, "card");
          onClose();
        },
      },
      {
        id: "cmd_add_tab",
        category: "Commands",
        title: "Create New Tab",
        subtitle: `Add Tab ${character.tabs.length + 1} to character sheet`,
        badge: "Canvas",
        hotkey: "Ctrl+T",
        action: () => {
          addTab(`Tab ${character.tabs.length + 1}`);
          onClose();
        },
      },
      {
        id: "cmd_rest",
        category: "Commands",
        title: "Open Rest Actions",
        subtitle: "Trigger short rest, long rest, or custom recovery",
        badge: "Tabletop",
        action: () => {
          onClose();
          onOpenRest?.();
        },
      },
      {
        id: "cmd_theme",
        category: "Commands",
        title: "Theme & Styling Customizer",
        subtitle: "Customize fonts, colors, canvas wallpaper, and presets",
        badge: "Styling",
        action: () => {
          onClose();
          onOpenTheme?.();
        },
      },
      {
        id: "cmd_switcher",
        category: "Commands",
        title: "Switch Character Sheet",
        subtitle: "Open the multi-character library",
        badge: "Library",
        action: () => {
          onClose();
          onOpenSwitcher?.();
        },
      },
      {
        id: "cmd_new_char",
        category: "Commands",
        title: "New Character Sheet",
        subtitle: "Create from blank or official D&D 5e starter",
        badge: "Library",
        action: () => {
          onClose();
          onOpenNewChar?.();
        },
      },
      {
        id: "cmd_export",
        category: "Commands",
        title: "Export Character JSON",
        subtitle: "Save clean JSON file to your device",
        badge: "Persistence",
        action: () => {
          exportCharacter();
          onClose();
        },
      },
      {
        id: "cmd_shortcuts",
        category: "Commands",
        title: "Keyboard Shortcuts Cheatsheet",
        subtitle: "View all hotkeys, navigation, and calculation shortcuts",
        badge: "Help",
        hotkey: "?",
        action: () => {
          onClose();
          onOpenShortcuts?.();
        },
      },
    ];

    if (mode === "edit") {
      commands.push(
        {
          id: "cmd_undo",
          category: "Commands",
          title: "Undo Layout Change",
          subtitle: "Revert last structural action",
          badge: "History",
          hotkey: "Ctrl+Z",
          action: () => {
            undo();
            onClose();
          },
        },
        {
          id: "cmd_redo",
          category: "Commands",
          title: "Redo Layout Change",
          subtitle: "Re-apply reverted structural action",
          badge: "History",
          hotkey: "Ctrl+Shift+Z",
          action: () => {
            redo();
            onClose();
          },
        }
      );
    }

    for (const cmd of commands) {
      if (!q || cmd.title.toLowerCase().includes(q) || (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q))) {
        items.push(cmd);
      }
    }

    // 2. Blocks across ALL tabs
    for (const [tabId, layout] of Object.entries(character.layouts)) {
      const tab = character.tabs.find((t) => t.id === tabId);
      const tabLabel = tab ? tab.label : "Sheet";

      for (const layoutItem of layout) {
        const block = character.blocks[layoutItem.i];
        if (!block) continue;

        const matchesTitle = block.title.toLowerCase().includes(q);
        const matchesType = block.type.toLowerCase().includes(q);
        const matchesTags = block.tags.some((t) => t.toLowerCase().includes(q));

        if (!q || matchesTitle || matchesType || matchesTags) {
          items.push({
            id: `block_${block.id}`,
            category: "Blocks",
            title: block.title,
            subtitle: `Tab: "${tabLabel}" • Type: ${block.type} ${block.tags.length > 0 ? `• Tags: ${block.tags.join(" ")}` : ""}`,
            badge: tabLabel,
            action: () => navigateToBlock(tabId, block.id),
          });
        }
      }
    }

    // 3. Inventory Items across all containers
    for (const [tabId, layout] of Object.entries(character.layouts)) {
      const tab = character.tabs.find((t) => t.id === tabId);
      const tabLabel = tab ? tab.label : "Sheet";

      for (const layoutItem of layout) {
        const block = character.blocks[layoutItem.i];
        if (!block || block.type !== "inventory") continue;

        const inventoryItems = block.data.items || [];
        for (const item of inventoryItems) {
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesTags = item.tags?.some((t) => t.toLowerCase().includes(q));
          const matchesDesc = item.description?.toLowerCase().includes(q);

          if (!q || matchesName || matchesTags || matchesDesc) {
            items.push({
              id: `item_${item.id}`,
              category: "Items",
              title: item.name,
              subtitle: `Qty: x${item.quantity} • Cost: ${item.cost || "—"} • In: "${block.title}" (${tabLabel})`,
              badge: "Item",
              action: () => navigateToBlock(tabId, block.id),
            });
          }
        }
      }
    }

    // 4. Skills
    for (const [tabId, layout] of Object.entries(character.layouts)) {
      const tab = character.tabs.find((t) => t.id === tabId);
      const tabLabel = tab ? tab.label : "Sheet";

      for (const layoutItem of layout) {
        const block = character.blocks[layoutItem.i];
        if (!block || block.type !== "skill_list") continue;

        const skills = block.data.skills || [];
        for (const sk of skills) {
          const matchesSkill = sk.name.toLowerCase().includes(q) || sk.stat.toLowerCase().includes(q);

          if (!q || matchesSkill) {
            items.push({
              id: `skill_${sk.id}`,
              category: "Skills",
              title: sk.name,
              subtitle: `${tabLabel} • Stat: ${sk.stat} • Value: ${sk.value || "+0"} • Proficiency: ${sk.proficiency === 2 ? "Expertise" : sk.proficiency === 1 ? "Proficient" : "None"}`,
              badge: sk.stat,
              action: () => navigateToBlock(tabId, block.id),
            });
          }
        }
      }
    }

    // 5. Unique Tags
    const tagCounts = new Map<string, number>();
    for (const block of Object.values(character.blocks)) {
      for (const t of block.tags) {
        tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
      }
    }

    for (const [tag, count] of tagCounts.entries()) {
      if (!q || tag.toLowerCase().includes(q)) {
        items.push({
          id: `tag_${tag}`,
          category: "Tags",
          title: tag,
          subtitle: `Filter canvas to all ${count} block${count === 1 ? "" : "s"} with this tag`,
          badge: `${count} blocks`,
          action: () => {
            setActiveTagFilter(tag);
            onClose();
          },
        });
      }
    }

    return items;
  }, [query, character, mode, onOpenShortcuts, onOpenTheme, onOpenRest, onOpenNewChar, onOpenSwitcher]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Auto-focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (results.length === 0) {
      if (e.key === "Escape") onClose();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        selected.action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view in the list
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(".omnisearch-item.selected") as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  // Group results by category
  const categories: Record<string, SearchResultItem[]> = {};
  for (const item of results) {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  }

  let flatIndexCounter = 0;

  return createPortal(
    <div className="omnisearch-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="omnisearch-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="omnisearch-search-header">
          <span className="omnisearch-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="omnisearch-input"
            placeholder="Search blocks, items, skills, tags, or commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button type="button" className="omnisearch-close-badge" onClick={onClose} title="Close (Esc)">
            ESC
          </button>
        </div>

        <div className="omnisearch-results-list" ref={listRef}>
          {results.length === 0 ? (
            <div className="omnisearch-empty-state">
              <span className="empty-icon">🍃</span>
              <p>No matching commands, blocks, items, or tags found for "{query}".</p>
            </div>
          ) : (
            Object.entries(categories).map(([catName, itemsInCat]) => (
              <div key={catName} className="omnisearch-category-group">
                <div className="omnisearch-category-title">{catName}</div>
                {itemsInCat.map((item) => {
                  const currentIndex = flatIndexCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={item.id}
                      className={`omnisearch-item ${isSelected ? "selected" : ""}`}
                      onClick={() => item.action()}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <div className="omnisearch-item-main">
                        <div className="omnisearch-item-title-row">
                          <span className="omnisearch-item-title">{item.title}</span>
                          {item.badge && <span className="omnisearch-badge">{item.badge}</span>}
                        </div>
                        {item.subtitle && <div className="omnisearch-item-sub">{item.subtitle}</div>}
                      </div>
                      {item.hotkey && (
                        <div className="omnisearch-hotkey">
                          <kbd>{item.hotkey}</kbd>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="omnisearch-footer-hints">
          <div className="hint-pill">
            <kbd>↑</kbd> <kbd>↓</kbd> Navigate
          </div>
          <div className="hint-pill">
            <kbd>↵</kbd> Select
          </div>
          <div className="hint-pill">
            <kbd>Esc</kbd> Close
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
