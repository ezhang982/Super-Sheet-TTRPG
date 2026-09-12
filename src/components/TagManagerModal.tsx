import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";

interface TagManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_TAG_COLORS = [
  { name: "Crimson", color: "#e06c75" },
  { name: "Amber", color: "#d19a66" },
  { name: "Gold", color: "#e5c07b" },
  { name: "Emerald", color: "#98c379" },
  { name: "Cyan", color: "#56b6c2" },
  { name: "Sky", color: "#61afef" },
  { name: "Amethyst", color: "#c678dd" },
  { name: "Rose", color: "#f7768e" },
];

export const TagManagerModal: React.FC<TagManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const character = useCharacterStore((state) => state.character);
  const setTagColor = useCharacterStore((state) => state.setTagColor);
  const removeTagColor = useCharacterStore((state) => state.removeTagColor);
  const renameTagGlobally = useCharacterStore((state) => state.renameTagGlobally);
  const deleteTagGlobally = useCharacterStore((state) => state.deleteTagGlobally);

  const tagColors = character.theme.tagColors || {};

  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagInput, setNewTagInput] = useState("");
  const [selectedColorForNew, setSelectedColorForNew] = useState("#61afef");
  const [searchQuery, setSearchQuery] = useState("");

  // Aggregate all unique tags across blocks and tagColors dictionary
  const tagList = useMemo(() => {
    const counts = new Map<string, number>();
    for (const block of Object.values(character.blocks)) {
      for (const t of block.tags) {
        const lower = t.toLowerCase();
        counts.set(lower, (counts.get(lower) || 0) + 1);
      }
    }

    // Also include any colored tags that might not be on a block yet
    for (const coloredTag of Object.keys(tagColors)) {
      if (!counts.has(coloredTag.toLowerCase())) {
        counts.set(coloredTag.toLowerCase(), 0);
      }
    }

    return Array.from(counts.entries())
      .map(([tagLower, count]) => ({
        tag: tagLower.startsWith("#") ? tagLower : `#${tagLower}`,
        count,
        color: tagColors[tagLower],
      }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [character.blocks, tagColors]);

  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return tagList;
    const q = searchQuery.toLowerCase().trim();
    return tagList.filter((t) => t.tag.toLowerCase().includes(q));
  }, [tagList, searchQuery]);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleStartRename = (tag: string) => {
    setEditingTag(tag);
    setNewTagName(tag.replace(/^#/, ""));
  };

  const handleCommitRename = (oldTag: string) => {
    if (newTagName.trim() && newTagName.trim() !== oldTag.replace(/^#/, "")) {
      renameTagGlobally(oldTag, newTagName.trim());
    }
    setEditingTag(null);
    setNewTagName("");
  };

  const handleDelete = (tag: string, count: number) => {
    const msg = count > 0
      ? `Delete "${tag}" from all ${count} block(s) across this sheet?`
      : `Remove "${tag}" color customization?`;
    if (window.confirm(msg)) {
      deleteTagGlobally(tag);
    }
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const formatted = newTagInput.trim().startsWith("#")
      ? newTagInput.trim().toLowerCase()
      : `#${newTagInput.trim().toLowerCase()}`;
    setTagColor(formatted, selectedColorForNew);
    setNewTagInput("");
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog tag-manager-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tag-manager-title"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">🏷️</span>
            <h3 id="tag-manager-title">Visual Tag Manager & Color Palette</h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </div>

        <div className="modal-body tag-manager-body">
          <p className="modal-description">
            Assign custom accent colors to tags to color-code your character sheet.
            Renaming or deleting a tag updates every card across all tabs automatically.
          </p>

          {/* Quick Create / Register Tag with Color */}
          <form className="tag-quick-add-form" onSubmit={handleCreateNewTag}>
            <input
              type="text"
              placeholder="Create/Customize Tag (e.g. #reaction, #attuned)..."
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value)}
              className="tag-add-input"
            />
            <div className="tag-color-swatches">
              {PRESET_TAG_COLORS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={`color-swatch-dot ${selectedColorForNew === p.color ? "selected" : ""}`}
                  style={{ backgroundColor: p.color }}
                  onClick={() => setSelectedColorForNew(p.color)}
                  title={p.name}
                />
              ))}
              <input
                type="color"
                value={selectedColorForNew}
                onChange={(e) => setSelectedColorForNew(e.target.value)}
                className="color-picker-input-mini"
                title="Custom color"
              />
            </div>
            <button type="submit" className="btn-primary add-tag-btn-form" disabled={!newTagInput.trim()}>
              + Set Color
            </button>
          </form>

          {/* Search Filter Bar */}
          <div className="tag-search-container">
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="tag-search-input"
            />
            <span className="tag-count-badge">
              {filteredTags.length} tag{filteredTags.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Tag List */}
          <div className="tag-manager-list">
            {filteredTags.length === 0 ? (
              <div className="empty-tags-hint">No tags found.</div>
            ) : (
              filteredTags.map(({ tag, count, color }) => {
                const isEditing = editingTag === tag;

                return (
                  <div key={tag} className="tag-manager-row">
                    <div className="tag-preview-col">
                      <span
                        className="tag-badge-preview"
                        style={{
                          borderColor: color || "var(--border-color)",
                          backgroundColor: color ? `${color}22` : "rgba(0,0,0,0.2)",
                          color: color || "var(--text-main)",
                        }}
                      >
                        {tag}
                      </span>
                      <span className="tag-usage-count">
                        {count} block{count === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="tag-color-palette-col">
                      {PRESET_TAG_COLORS.map((p) => (
                        <button
                          key={p.name}
                          type="button"
                          className={`color-swatch-dot ${color === p.color ? "selected" : ""}`}
                          style={{ backgroundColor: p.color }}
                          onClick={() => setTagColor(tag, p.color)}
                          title={`Set ${tag} to ${p.name}`}
                        />
                      ))}
                      <input
                        type="color"
                        value={color || "#61afef"}
                        onChange={(e) => setTagColor(tag, e.target.value)}
                        className="color-picker-input-mini"
                        title="Pick custom color"
                      />
                      {color && (
                        <button
                          type="button"
                          className="reset-color-btn"
                          onClick={() => removeTagColor(tag)}
                          title="Reset to default tag style"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="tag-actions-col">
                      {isEditing ? (
                        <div className="tag-inline-rename">
                          <input
                            type="text"
                            value={newTagName}
                            autoFocus
                            onChange={(e) => setNewTagName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCommitRename(tag);
                              if (e.key === "Escape") setEditingTag(null);
                            }}
                            className="tag-rename-box"
                          />
                          <button
                            type="button"
                            className="btn-primary mini-btn"
                            onClick={() => handleCommitRename(tag)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="btn-secondary mini-btn"
                            onClick={() => setEditingTag(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="tag-action-icon-btn"
                            onClick={() => handleStartRename(tag)}
                            title={`Rename ${tag} across all blocks`}
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            className="tag-action-icon-btn danger"
                            onClick={() => handleDelete(tag, count)}
                            title={`Delete ${tag} globally`}
                          >
                            🗑️
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
