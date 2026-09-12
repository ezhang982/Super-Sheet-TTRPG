import React, { useEffect, useState } from "react";
import { useCharacterStore } from "./store/useCharacterStore";
import { TabBar } from "./components/TabBar";
import { TagFilterAndRestBar } from "./components/TagFilterAndRestBar";
import { Canvas } from "./components/Canvas";
import { FloatingToolsMenu } from "./components/FloatingToolsMenu";
import { BottomHistoryBar } from "./components/BottomHistoryBar";
import { OmnisearchModal } from "./components/OmnisearchModal";
import { ShortcutsModal } from "./components/ShortcutsModal";
import "./App.css";

export const App: React.FC = () => {
  const theme = useCharacterStore((state) => state.character.theme);
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const addTab = useCharacterStore((state) => state.addTab);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);

  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Dynamically inject theme properties into CSS custom variables on root element
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--canvas-bg", theme.canvasBackground);
    root.style.setProperty("--card-bg", theme.cardBackground);
    root.style.setProperty("--border-color", theme.borderColor);
    root.style.setProperty("--accent-color", theme.accentColor);
    root.style.setProperty("--font-heading", theme.fontHeading);
    root.style.setProperty("--font-body", theme.fontBody);
  }, [theme]);

  // Unified Universal Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const activeTag = target?.tagName.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || target?.isContentEditable;

      const isModifier = e.ctrlKey || e.metaKey;

      // 1. Ctrl+K or Cmd+K: Open / Toggle Omnisearch (universal)
      if (isModifier && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOmnisearchOpen((prev) => !prev);
        return;
      }

      // 2. Escape: Close modals
      if (e.key === "Escape") {
        setIsOmnisearchOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      // Stop here if focused inside an active text input or textarea
      if (isInput) return;

      // 3. E or Ctrl+E: Toggle Edit Mode / Play Mode
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setMode(mode === "edit" ? "play" : "edit");
        return;
      }

      // 4. ?: Open Keyboard Shortcuts Cheatsheet
      if (e.key === "?") {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      // 5. Ctrl+B: Add New Feature Card (Edit Mode only)
      if (isModifier && (e.key === "b" || e.key === "B")) {
        e.preventDefault();
        if (mode === "edit") {
          addBlock(character.activeTabId, "card");
        }
        return;
      }

      // 6. Ctrl+T: Add New Tab (Edit Mode only)
      if (isModifier && (e.key === "t" || e.key === "T")) {
        e.preventDefault();
        if (mode === "edit") {
          addTab(`Tab ${character.tabs.length + 1}`);
        }
        return;
      }

      // 7. Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y: Undo & Redo (Edit Mode only)
      if (mode === "edit" && isModifier) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, setMode, addBlock, addTab, character.activeTabId, character.tabs.length, undo, redo]);

  return (
    <div className="app-root">
      {/* Top Bar with Tabs on left, Omnisearch trigger, and Edit/Play toggle on right */}
      <TabBar onOpenOmnisearch={() => setIsOmnisearchOpen(true)} />

      {/* Play Mode Semantic Tag Filter & Rest Actions */}
      <TagFilterAndRestBar />

      {/* Main 12-Column Canvas */}
      <Canvas />

      {/* Draggable Floating Tools Menu (FAB) */}
      <FloatingToolsMenu
        onOpenOmnisearch={() => setIsOmnisearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Minimal Bottom Undo/Redo Bar */}
      <BottomHistoryBar />

      {/* Global Omnisearch & Command Palette Modal (Ctrl+K) */}
      <OmnisearchModal
        isOpen={isOmnisearchOpen}
        onClose={() => setIsOmnisearchOpen(false)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Keyboard Shortcuts Cheatsheet Modal (?) */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
