import React, { useState, type CSSProperties } from "react";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Block } from "../types/schema";
import { TrackerBlock } from "./primitives/TrackerBlock";
import { PipMatrixBlock } from "./primitives/PipMatrixBlock";
import { StatGroupBlock } from "./primitives/StatGroupBlock";
import { FeatureCardBlock } from "./primitives/FeatureCardBlock";
import { NotesBlock } from "./primitives/NotesBlock";
import { ProfileCardBlock } from "./primitives/ProfileCardBlock";
import { InventoryBlock } from "./primitives/InventoryBlock";
import { BlockStyleModal } from "./BlockStyleModal";
import { CardContextMenu } from "./CardContextMenu";

interface BlockContainerProps {
  block: Block;
  tabId: string;
}

export const BlockContainer: React.FC<BlockContainerProps> = ({ block, tabId }) => {
  const mode = useCharacterStore((state) => state.mode);
  const activeTagFilter = useCharacterStore((state) => state.activeTagFilter);
  const deleteBlock = useCharacterStore((state) => state.deleteBlock);
  const updateBlockData = useCharacterStore((state) => state.updateBlockData);
  const updateBlockTags = useCharacterStore((state) => state.updateBlockTags);
  const updateBlockTitle = useCharacterStore((state) => state.updateBlockTitle);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isStylingOpen, setIsStylingOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (mode !== "edit") return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Compute block-level styles falling back to global theme
  const isOrnate = block.style?.borderStyle === "ornate";
  const borderStyleVal = isOrnate ? "double" : (block.style?.borderStyle || "solid");
  const borderWidthVal = block.style?.borderStyle === "none" ? "0px" : (isOrnate || block.style?.borderStyle === "double") ? "3px" : "1px";

  const blockStyle: CSSProperties = {
    borderColor: block.style?.borderColor || "var(--border-color)",
    borderStyle: borderStyleVal,
    borderWidth: borderWidthVal,
    backgroundColor: block.style?.backgroundOpacity !== undefined
      ? (block.style.backgroundOpacity === 0 ? "transparent" : `rgba(28, 30, 36, ${block.style.backgroundOpacity})`)
      : "var(--card-bg)",
    backgroundImage: block.style?.backgroundUrl ? `url(${block.style.backgroundUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const handleCommitTitle = () => {
    if (titleInput.trim()) {
      updateBlockTitle(block.id, titleInput.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddTag = () => {
    let clean = tagInput.trim();
    if (!clean) {
      setIsAddingTag(false);
      return;
    }
    if (!clean.startsWith("#")) {
      clean = `#${clean}`;
    }
    if (!block.tags.includes(clean)) {
      updateBlockTags(block.id, [...block.tags, clean]);
    }
    setTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateBlockTags(block.id, block.tags.filter((t) => t !== tagToRemove));
  };

  // Render the dedicated primitive component based on block.type
  const renderPrimitive = () => {
    switch (block.type) {
      case "tracker":
        return (
          <TrackerBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "pip_array":
        return (
          <PipMatrixBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "stat_group":
        return (
          <StatGroupBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "card":
        return (
          <FeatureCardBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "notes":
        return (
          <NotesBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "profile":
        return (
          <ProfileCardBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
      case "inventory":
        return (
          <InventoryBlock
            block={block}
            mode={mode}
            onUpdateData={(patch) => updateBlockData(block.id, patch)}
          />
        );
    }
  };

  const isDimmed = mode === "play" && activeTagFilter !== null && !block.tags.includes(activeTagFilter);

  return (
    <div
      className={`block-container ${block.type} ${isOrnate ? "border-ornate" : ""} ${
        isDimmed ? "dimmed-by-filter" : ""
      }`}
      style={blockStyle}
      onContextMenu={handleContextMenu}
    >
      {block.style?.headerBannerUrl && (
        <div
          className="block-header-banner"
          style={{ backgroundImage: `url(${block.style.headerBannerUrl})` }}
        />
      )}

      <div className="block-header">
        <div className="block-header-left">
          {mode === "edit" && (
            <span className="drag-handle" title="Drag to reorder/move">
              ⠿
            </span>
          )}

          {isEditingTitle && mode === "edit" ? (
            <input
              type="text"
              className="block-title-input"
              value={titleInput}
              autoFocus
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleCommitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitTitle();
                if (e.key === "Escape") setIsEditingTitle(false);
              }}
            />
          ) : (
            <h3
              className="block-title"
              onDoubleClick={() => mode === "edit" && setIsEditingTitle(true)}
              title={mode === "edit" ? "Double-click to rename (or right-click)" : undefined}
            >
              {block.title}
            </h3>
          )}
        </div>

        <div className="block-header-right">
          {/* Block Tags Strip */}
          <div className="block-tags">
            {block.tags.map((t) => (
              <span key={t} className="tag-badge">
                {t}
                {mode === "edit" && (
                  <button
                    type="button"
                    className="tag-remove-btn"
                    onClick={() => handleRemoveTag(t)}
                    title={`Remove ${t}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))}

            {mode === "edit" && !isAddingTag && (
              <button
                type="button"
                className="add-tag-btn"
                onClick={() => setIsAddingTag(true)}
                title="Add tag"
              >
                +
              </button>
            )}

            {mode === "edit" && isAddingTag && (
              <input
                type="text"
                className="tag-new-input"
                placeholder="#tag"
                value={tagInput}
                autoFocus
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={handleAddTag}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTag();
                  if (e.key === "Escape") setIsAddingTag(false);
                }}
              />
            )}
          </div>

          {/* Edit Mode Delete Action */}
          {mode === "edit" && (
            <div className="block-actions">
              <button
                type="button"
                className="delete-block-btn"
                onClick={() => deleteBlock(block.id)}
                title="Delete this block (or right-click for options)"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="block-body">{renderPrimitive()}</div>

      {/* Block Style Customization Modal */}
      {isStylingOpen && (
        <BlockStyleModal
          isOpen={isStylingOpen}
          onClose={() => setIsStylingOpen(false)}
          block={block}
        />
      )}

      {/* Right-Click Context Menu in Edit Mode */}
      {contextMenu && (
        <CardContextMenu
          isOpen={!!contextMenu}
          x={contextMenu.x}
          y={contextMenu.y}
          block={block}
          tabId={tabId}
          onClose={() => setContextMenu(null)}
          onOpenStyleModal={() => setIsStylingOpen(true)}
          onStartRename={() => setIsEditingTitle(true)}
          onStartAddTag={() => setIsAddingTag(true)}
        />
      )}
    </div>
  );
};
