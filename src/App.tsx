import React, { useEffect, useState, Suspense, lazy } from "react";
import { useCharacterStore } from "./store/useCharacterStore";
import { setupStorageLifecycleListeners } from "./store/storage";
import { TabBar } from "./components/TabBar";
import { TagFilterAndRestBar } from "./components/TagFilterAndRestBar";
import { Canvas } from "./components/Canvas";
import { FloatingToolsMenu } from "./components/FloatingToolsMenu";
import { BottomHistoryBar } from "./components/BottomHistoryBar";
import { PlayModeRevertToast } from "./components/PlayModeRevertToast";
import { resolveCanvasPattern, resolveCanvasWatermark } from "./styles/resolveStyle";
import "./App.css";

// Lazy-load secondary and overlay modals to optimize initial bundle size & load performance
const OmnisearchModal = lazy(() =>
  import("./components/OmnisearchModal").then((m) => ({ default: m.OmnisearchModal }))
);
const ShortcutsModal = lazy(() =>
  import("./components/ShortcutsModal").then((m) => ({ default: m.ShortcutsModal }))
);
const SessionScratchpadModal = lazy(() =>
  import("./components/SessionScratchpadModal").then((m) => ({ default: m.SessionScratchpadModal }))
);
const TagManagerModal = lazy(() =>
  import("./components/TagManagerModal").then((m) => ({ default: m.TagManagerModal }))
);
const MyDesignsModal = lazy(() =>
  import("./components/MyDesignsModal").then((m) => ({ default: m.MyDesignsModal }))
);
const ThemeDrawer = lazy(() =>
  import("./components/ThemeDrawer").then((m) => ({ default: m.ThemeDrawer }))
);
const RestActionModal = lazy(() =>
  import("./components/RestActionModal").then((m) => ({ default: m.RestActionModal }))
);
const NewCharacterModal = lazy(() =>
  import("./components/NewCharacterModal").then((m) => ({ default: m.NewCharacterModal }))
);
const CharacterSwitcherModal = lazy(() =>
  import("./components/CharacterSwitcherModal").then((m) => ({ default: m.CharacterSwitcherModal }))
);

export const App: React.FC = () => {
  const theme = useCharacterStore((state) => state.character.theme);
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const setMode = useCharacterStore((state) => state.setMode);
  const addBlock = useCharacterStore((state) => state.addBlock);
  const addTab = useCharacterStore((state) => state.addTab);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);
  const undoPlayMode = useCharacterStore((state) => state.undoPlayMode);
  const redoPlayMode = useCharacterStore((state) => state.redoPlayMode);

  const [isOmnisearchOpen, setIsOmnisearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isMyDesignsOpen, setIsMyDesignsOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isNewCharOpen, setIsNewCharOpen] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const [appToast, setAppToast] = useState<string | null>(null);

  const showAppToast = (msg: string) => {
    setAppToast(msg);
    setTimeout(() => setAppToast(null), 2500);
  };

  // Setup storage lifecycle listeners (visibilitychange, pagehide, beforeunload)
  useEffect(() => {
    setupStorageLifecycleListeners();
  }, []);

  // Dynamically inject theme properties into CSS custom variables on root element
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--canvas-bg", theme.canvasBackground);
    root.style.setProperty("--card-bg", theme.cardBackground);
    root.style.setProperty("--border-color", theme.borderColor);
    root.style.setProperty("--accent-color", theme.accentColor);
    root.style.setProperty("--font-heading", theme.fontHeading);
    root.style.setProperty("--font-body", theme.fontBody);

    const canvasPattern = resolveCanvasPattern(theme);
    if (canvasPattern) {
      root.style.setProperty("--canvas-pattern-image", canvasPattern.image);
      root.style.setProperty("--canvas-pattern-size", canvasPattern.size);
    } else {
      root.style.removeProperty("--canvas-pattern-image");
      root.style.removeProperty("--canvas-pattern-size");
    }

    const canvasWatermark = resolveCanvasWatermark(theme);
    if (canvasWatermark) {
      root.style.setProperty("--canvas-watermark-image", canvasWatermark.image);
      root.style.setProperty("--canvas-watermark-size", canvasWatermark.size);
      root.style.setProperty("--canvas-watermark-position", canvasWatermark.position);
      root.style.setProperty("--canvas-watermark-attachment", canvasWatermark.attachment);
    } else {
      root.style.removeProperty("--canvas-watermark-image");
      root.style.removeProperty("--canvas-watermark-size");
      root.style.removeProperty("--canvas-watermark-position");
      root.style.removeProperty("--canvas-watermark-attachment");
    }
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

      // 7. Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y: Undo & Redo (Edit Mode: Layout, Play Mode: Counters)
      if (isModifier) {
        if (e.key === "z" && !e.shiftKey) {
          e.preventDefault();
          if (mode === "edit") {
            undo();
          } else {
            undoPlayMode();
          }
        } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
          e.preventDefault();
          if (mode === "edit") {
            redo();
          } else {
            redoPlayMode();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, setMode, addBlock, addTab, character.activeTabId, character.tabs.length, undo, redo, undoPlayMode, redoPlayMode]);


  return (
    <div className="app-root">
      {/* Top Bar with Tabs on left, Omnisearch trigger, and Edit/Play toggle on right */}
      <TabBar onOpenOmnisearch={() => setIsOmnisearchOpen(true)} />

      {/* Play Mode Semantic Tag Filter & Rest Actions */}
      <TagFilterAndRestBar onOpenRest={() => setIsRestModalOpen(true)} />

      {/* Main 12-Column Canvas */}
      <Canvas />

      {/* Draggable Floating Tools Menu (FAB) */}
      <FloatingToolsMenu
        onOpenOmnisearch={() => setIsOmnisearchOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenScratchpad={() => setIsScratchpadOpen(true)}
        onOpenTagManager={() => setIsTagManagerOpen(true)}
        onOpenMyDesigns={() => setIsMyDesignsOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenRest={() => setIsRestModalOpen(true)}
        onOpenNewChar={() => setIsNewCharOpen(true)}
        onOpenSwitcher={() => setIsSwitcherOpen(true)}
      />

      {/* Minimal Bottom Undo/Redo Bar */}
      <BottomHistoryBar />

      {/* Secondary & Overlay Modals (Code-Split & Rendered on Demand) */}
      <Suspense fallback={null}>
        {isOmnisearchOpen && (
          <OmnisearchModal
            isOpen={isOmnisearchOpen}
            onClose={() => setIsOmnisearchOpen(false)}
            onOpenShortcuts={() => setIsShortcutsOpen(true)}
            onOpenScratchpad={() => setIsScratchpadOpen(true)}
            onOpenTagManager={() => setIsTagManagerOpen(true)}
            onOpenMyDesigns={() => setIsMyDesignsOpen(true)}
            onOpenTheme={() => setIsThemeOpen(true)}
            onOpenRest={() => setIsRestModalOpen(true)}
            onOpenNewChar={() => setIsNewCharOpen(true)}
            onOpenSwitcher={() => setIsSwitcherOpen(true)}
          />
        )}

        {isShortcutsOpen && (
          <ShortcutsModal
            isOpen={isShortcutsOpen}
            onClose={() => setIsShortcutsOpen(false)}
          />
        )}

        {isScratchpadOpen && (
          <SessionScratchpadModal
            isOpen={isScratchpadOpen}
            onClose={() => setIsScratchpadOpen(false)}
          />
        )}

        {isTagManagerOpen && (
          <TagManagerModal
            isOpen={isTagManagerOpen}
            onClose={() => setIsTagManagerOpen(false)}
          />
        )}

        {isMyDesignsOpen && (
          <MyDesignsModal
            isOpen={isMyDesignsOpen}
            onClose={() => setIsMyDesignsOpen(false)}
          />
        )}

        {isThemeOpen && (
          <ThemeDrawer
            isOpen={isThemeOpen}
            onClose={() => setIsThemeOpen(false)}
            onOpenMyDesigns={() => setIsMyDesignsOpen(true)}
          />
        )}

        {isRestModalOpen && (
          <RestActionModal
            isOpen={isRestModalOpen}
            onClose={() => setIsRestModalOpen(false)}
          />
        )}

        {isNewCharOpen && (
          <NewCharacterModal
            isOpen={isNewCharOpen}
            onClose={() => setIsNewCharOpen(false)}
            onToast={showAppToast}
          />
        )}

        {isSwitcherOpen && (
          <CharacterSwitcherModal
            isOpen={isSwitcherOpen}
            onClose={() => setIsSwitcherOpen(false)}
            onToast={showAppToast}
            onOpenNewModal={() => setIsNewCharOpen(true)}
          />
        )}
      </Suspense>

      {/* Temporary Toast feedback */}
      {appToast && <div className="floating-toast">{appToast}</div>}

      {/* Play Mode Counter Revert Toast */}
      <PlayModeRevertToast />
    </div>
  );
};

export default App;
