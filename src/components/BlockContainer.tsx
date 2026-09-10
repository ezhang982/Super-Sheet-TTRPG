import React, { type CSSProperties } from "react";
import { useCharacterStore } from "../store/useCharacterStore";
import type { Block } from "../types/schema";

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

  // Quick interactive preview for Phase 1 testing
  const renderPrimitivePreview = () => {
    switch (block.type) {
      case "tracker": {
        const data = block.data;
        return (
          <div className="preview-tracker">
            <div className="tracker-values">
              <span className="current-val">{data.current}</span>
              <span className="divider">/</span>
              <span className="max-val">{data.max}</span>
              {data.temp ? <span className="temp-val">(+{data.temp})</span> : null}
            </div>
            {mode === "play" && (
              <div className="tracker-quick-steppers">
                <button
                  type="button"
                  onClick={() => updateBlockData(block.id, { current: data.current - data.step })}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => updateBlockData(block.id, { current: data.current + data.step })}
                >
                  +
                </button>
              </div>
            )}
          </div>
        );
      }
      case "stat_group": {
        const data = block.data;
        return (
          <div className="preview-stats">
            {data.stats.map((stat, idx) => (
              <div key={idx} className="stat-pill">
                <div className="stat-label">{stat.label}</div>
                <div className="stat-score">{stat.score}</div>
                <div className="stat-sub">{stat.sub}</div>
              </div>
            ))}
          </div>
        );
      }
      case "card": {
        const data = block.data;
        return (
          <div className="preview-card">
            {data.badge && <span className="card-badge">{data.badge}</span>}
            <p className="card-description">{data.description}</p>
            {data.tracker?.enabled && (
              <div className="card-tracker-badge">
                Usage: {data.tracker.current} / {data.tracker.max}
              </div>
            )}
          </div>
        );
      }
      case "pip_array": {
        const data = block.data;
        return (
          <div className="preview-pips">
            {data.rows.map((row, rIdx) => (
              <div key={rIdx} className="pip-row">
                <span className="pip-row-label">{row.label}:</span>
                <div className="pip-list">
                  {Array.from({ length: row.total }).map((_, pIdx) => {
                    const isExpended = pIdx < row.expended;
                    return (
                      <span
                        key={pIdx}
                        className={`pip ${isExpended ? "expended" : "filled"}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        );
      }
      case "notes": {
        const data = block.data;
        return (
          <div className="preview-notes">
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.85rem" }}>
              {data.markdown}
            </pre>
          </div>
        );
      }
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
          <h3 className="block-title">{block.title}</h3>
        </div>

        <div className="block-header-right">
          {block.tags.length > 0 && (
            <div className="block-tags">
              {block.tags.map((t, idx) => (
                <span key={idx} className="tag-badge">
                  {t}
                </span>
              ))}
            </div>
          )}

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

      <div className="block-body">{renderPrimitivePreview()}</div>
    </div>
  );
};
