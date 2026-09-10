import React, { useEffect } from "react";
import { useCharacterStore } from "./store/useCharacterStore";
import { TabBar } from "./components/TabBar";
import { TagFilterAndRestBar } from "./components/TagFilterAndRestBar";
import { Canvas } from "./components/Canvas";
import { FloatingToolsMenu } from "./components/FloatingToolsMenu";
import { BottomHistoryBar } from "./components/BottomHistoryBar";
import "./App.css";

export const App: React.FC = () => {
  const theme = useCharacterStore((state) => state.character.theme);
  const mode = useCharacterStore((state) => state.mode);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);

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

  // Global keyboard shortcuts for Edit Mode undo / redo (§8.3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only active in Edit Mode
      if (mode !== "edit") return;

      // Ignore when focused in text inputs or textareas
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea") return;

      const isModifier = e.ctrlKey || e.metaKey;
      if (!isModifier) return;

      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, undo, redo]);

  return (
    <div className="app-root">
      {/* Top Bar with Tabs on left and tiny Edit/Play toggle on right */}
      <TabBar />

      {/* Play Mode Semantic Tag Filter & Rest Actions */}
      <TagFilterAndRestBar />

      {/* Main 12-Column Canvas */}
      <Canvas />

      {/* Draggable Floating Tools Menu (FAB) */}
      <FloatingToolsMenu />

      {/* Minimal Bottom Undo/Redo Bar */}
      <BottomHistoryBar />
    </div>
  );
};

export default App;
