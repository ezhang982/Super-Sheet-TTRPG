import React, { useState, type CSSProperties } from "react";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Block } from "../types/schema";
import { TrackerBlock } from "./primitives/TrackerBlock";
import { PipMatrixBlock } from "./primitives/PipMatrixBlock";
import { StatGroupBlock } from "./primitives/StatGroupBlock";
import { FeatureCardBlock } from "./primitives/FeatureCardBlock";
import { NotesBlock } from "./primitives/NotesBlock";

interface BlockContainerProps {
  block: Block;
  tabId: string;
}

export const BlockContainer: React.FC<BlockContainerProps> = ({ block, tabId }) => {
  const mode = useCharacterStore((state) => state.mode);
  const character = useCharacterStore((state) => state.character);
  const deleteBlock = useCharacterStore((state) => state.deleteBlock);
  const moveBlockToTab = useCharacterStore((state) => state.moveBlockToTab);
  const updateBlockData = useCharacterStore((state) => state.updateBlockData);
  const updateBlockTags = useCharacterStore((state) => state.updateBlockTags);
  const updateBlockTitle = useCharacterStore((state) => state.updateBlockTitle);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(block.title);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");

  // Compute block-level styles falling back to global theme
  const blockStyle: CSSProperties = {
    borderColor: block.style?.borderColor || "var(--border-color)",
    borderStyle: block.style?.borderStyle || "solid",
    borderWidth: block.style?.borderStyle && block.style.borderStyle !== "none" ? "1px" : "1px",
    backgroundColor: block.style?.backgroundOpacity !== undefined
      ? `rgba(28, 30, 36, ${block.style.backgroundOpacity})`
      : "var(--card-bg)",
    backgroundImage: block.style?.backgroundUrl ? `url(${block.style.backgroundUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  const otherTabs = character.tabs.filter((t) => t.id !== tabId);

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
    }
  };

  return (
    <div className={`block-container ${block.type}`} style={blockStyle}>
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
              onDoubleClick={() => {
                if (mode === "edit") {
                  setTitleInput(block.title);
                  setIsEditingTitle(true);
                }
              }}
              title={mode === "edit" ? "Double-click to edit title" : ""}
            >
              {block.title}
            </h3>
          )}
        </div>

        <div className="block-header-right">
          {/* Tags Section */}
          <div className="block-tags">
            {block.tags.map((t, idx) => (
              <span key={idx} className="tag-badge">
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

          {/* Edit Mode Block Management Actions */}
          {mode === "edit" && (
            <div className="block-actions">
              {otherTabs.length > 0 && (
                <select
                  className="move-tab-select"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      moveBlockToTab(block.id, tabId, e.target.value);
                    }
                  }}
                  title="Move block to another tab"
                >
                  <option value="" disabled>
                    Move to...
                  </option>
                  {otherTabs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="delete-block-btn"
                onClick={() => deleteBlock(block.id)}
                title="Delete this block"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="block-body">{renderPrimitive()}</div>
    </div>
  );
};
