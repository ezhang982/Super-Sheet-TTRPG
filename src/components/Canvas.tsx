import React, { useMemo } from "react";
import { GridLayout, useContainerWidth, type Layout } from "react-grid-layout";
import { useCharacterStore } from "../store/useCharacterStore";
import { BlockContainer } from "./BlockContainer";
import type { LayoutItem } from "../types/schema";

export const Canvas: React.FC = () => {
  const character = useCharacterStore((state) => state.character);
  const mode = useCharacterStore((state) => state.mode);
  const updateTabLayout = useCharacterStore((state) => state.updateTabLayout);
  const activeTabId = character.activeTabId;

  const { width, containerRef, mounted } = useContainerWidth();

  // Active tab's layout items
  const currentLayout = useMemo(() => {
    return character.layouts[activeTabId] ?? [];
  }, [character.layouts, activeTabId]);

  // Convert schema layout items to RGL Layout format
  const rglLayout: Layout = useMemo(() => {
    return currentLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: 1,
      minH: 1,
    }));
  }, [currentLayout]);

  const handleCommitLayout = (newLayout: Layout) => {
    const sanitized: LayoutItem[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
    }));
    updateTabLayout(activeTabId, sanitized);
  };

  // Check for narrow viewport in Play Mode (Single column reflow per §4.4)
  const isNarrowPlayMode = mode === "play" && width > 0 && width < 720;

  // Sorted items by y, x for mobile stack
  const sortedMobileItems = useMemo(() => {
    return [...currentLayout].sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));
  }, [currentLayout]);

  const activeTab = character.tabs.find((t) => t.id === activeTabId);

  return (
    <main className={`canvas-wrapper ${mode === "play" ? "play-mode" : "edit-mode"}`} ref={containerRef}>
      {/* Printable Sheet Header Banner (visible only in @media print) */}
      <div className="print-sheet-header">
        <div className="print-sheet-title">
          {character.meta.name || "Character Sheet"}
        </div>
        <div className="print-sheet-meta">
          {character.meta.system && <span>{character.meta.system} • </span>}
          <span>Tab: {activeTab?.label || "Sheet"}</span>
        </div>
      </div>
      {currentLayout.length === 0 ? (
        <div className="empty-canvas-state">
          <h3>This tab has no blocks yet.</h3>
          <p>
            {mode === "edit"
              ? "Click \"+ Add Block\" in the top bar to add your first tracker, card, or note."
              : "Switch to Edit Mode to add blocks to this tab."}
          </p>
        </div>
      ) : isNarrowPlayMode ? (
        <div className="mobile-single-column-flow">
          {sortedMobileItems.map((item) => {
            const block = character.blocks[item.i];
            if (!block) return null;
            return <BlockContainer key={item.i} block={block} tabId={activeTabId} />;
          })}
        </div>
      ) : (
        mounted && width > 0 && (
          <GridLayout
            width={width}
            gridConfig={{
              cols: 12,
              rowHeight: 65,
              margin: [16, 16],
              containerPadding: [16, 16],
            }}
            dragConfig={{
              enabled: mode === "edit",
              handle: ".drag-handle",
            }}
            resizeConfig={{
              enabled: mode === "edit",
              handles: ["s", "e", "se"],
            }}
            layout={rglLayout}
            onDragStop={(layout) => handleCommitLayout(layout)}
            onResizeStop={(layout) => handleCommitLayout(layout)}
          >
            {currentLayout.map((item) => {
              const block = character.blocks[item.i];
              if (!block) return null;
              return (
                <div key={item.i} className="canvas-grid-item">
                  <BlockContainer block={block} tabId={activeTabId} />
                </div>
              );
            })}
          </GridLayout>
        )
      )}
    </main>
  );
};
