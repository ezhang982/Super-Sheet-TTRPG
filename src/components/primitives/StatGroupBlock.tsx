import React from "react";
import type { Block } from "../../types/schema";

type StatGroupBlockType = Extract<Block, { type: "stat_group" }>;

interface StatGroupBlockProps {
  block: StatGroupBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<StatGroupBlockType["data"]>) => void;
}

export const StatGroupBlock: React.FC<StatGroupBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const stats = block.data.stats;

  const handleUpdateStat = (
    index: number,
    field: "label" | "score" | "sub",
    value: string
  ) => {
    const updated = stats.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    onUpdateData({ stats: updated });
  };

  const handleRemoveStat = (index: number) => {
    const updated = stats.filter((_, idx) => idx !== index);
    onUpdateData({ stats: updated });
  };

  const handleAddStat = () => {
    const newStat = { label: "STAT", score: "10", sub: "+0" };
    onUpdateData({ stats: [...stats, newStat] });
  };

  if (mode === "edit") {
    return (
      <div className="stat-group-edit">
        <div className="stat-pills-edit-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-pill-edit-card">
              <button
                type="button"
                className="stat-remove-btn"
                onClick={() => handleRemoveStat(idx)}
                title="Remove stat"
              >
                ×
              </button>
              <div className="stat-edit-field">
                <label>Label</label>
                <input
                  type="text"
                  value={stat.label}
                  placeholder="STR"
                  onChange={(e) => handleUpdateStat(idx, "label", e.target.value)}
                />
              </div>
              <div className="stat-edit-field">
                <label>Score</label>
                <input
                  type="text"
                  value={stat.score}
                  placeholder="10"
                  onChange={(e) => handleUpdateStat(idx, "score", e.target.value)}
                />
              </div>
              <div className="stat-edit-field">
                <label>Sub / Mod</label>
                <input
                  type="text"
                  value={stat.sub}
                  placeholder="+0"
                  onChange={(e) => handleUpdateStat(idx, "sub", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
        <button type="button" className="add-stat-btn" onClick={handleAddStat}>
          + Add Stat Pill
        </button>
      </div>
    );
  }

  // Play Mode UX (§5.3) - Pure visual display, no roll handlers
  return (
    <div className="stat-group-play">
      {stats.length === 0 ? (
        <div className="empty-primitive-hint">No attributes added yet.</div>
      ) : (
        <div className="stat-pills-grid">
          {stats.map((stat, idx) => (
            <div key={idx} className="stat-pill-badge">
              <div className="stat-badge-label">{stat.label}</div>
              <div className="stat-badge-score">{stat.score}</div>
              {stat.sub && <div className="stat-badge-sub">{stat.sub}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
