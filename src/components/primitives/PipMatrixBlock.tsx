import React from "react";
import type { Block } from "../../types/schema";

type PipArrayBlockType = Extract<Block, { type: "pip_array" }>;

interface PipMatrixBlockProps {
  block: PipArrayBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<PipArrayBlockType["data"]>) => void;
}

export const PipMatrixBlock: React.FC<PipMatrixBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const rows = block.data.rows;

  const handleTogglePip = (rowIndex: number, pipIndex: number) => {
    const row = rows[rowIndex];
    if (!row) return;

    // A pip at pipIndex is available if pipIndex < (row.total - row.expended)
    const availableCount = row.total - row.expended;
    const isAvailable = pipIndex < availableCount;

    let newExpended: number;
    if (isAvailable) {
      // Expending up to this pip
      newExpended = row.total - pipIndex;
    } else {
      // Restoring up to this pip
      newExpended = row.total - (pipIndex + 1);
    }

    const updatedRows = rows.map((r, idx) =>
      idx === rowIndex ? { ...r, expended: Math.max(0, Math.min(r.total, newExpended)) } : r
    );
    onUpdateData({ rows: updatedRows });
  };

  const handleUpdateRowLabel = (rowIndex: number, label: string) => {
    const updatedRows = rows.map((r, idx) =>
      idx === rowIndex ? { ...r, label } : r
    );
    onUpdateData({ rows: updatedRows });
  };

  const handleUpdateRowTotal = (rowIndex: number, total: number) => {
    const newTotal = Math.max(0, total);
    const updatedRows = rows.map((r, idx) =>
      idx === rowIndex
        ? { ...r, total: newTotal, expended: Math.min(r.expended, newTotal) }
        : r
    );
    onUpdateData({ rows: updatedRows });
  };

  const handleRemoveRow = (rowIndex: number) => {
    const updatedRows = rows.filter((_, idx) => idx !== rowIndex);
    onUpdateData({ rows: updatedRows });
  };

  const handleAddRow = () => {
    const newRow = { label: `Resource ${rows.length + 1}`, total: 4, expended: 0 };
    onUpdateData({ rows: [...rows, newRow] });
  };

  if (mode === "edit") {
    return (
      <div className="pip-matrix-edit">
        <div className="pip-rows-edit-list">
          {rows.map((row, rIdx) => (
            <div key={rIdx} className="pip-row-edit-item">
              <input
                type="text"
                className="row-label-input"
                value={row.label}
                placeholder="Row label"
                onChange={(e) => handleUpdateRowLabel(rIdx, e.target.value)}
              />
              <div className="row-total-group">
                <label>Pips:</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={row.total}
                  onChange={(e) => handleUpdateRowTotal(rIdx, parseInt(e.target.value, 10) || 0)}
                />
              </div>
              <button
                type="button"
                className="remove-row-btn"
                onClick={() => handleRemoveRow(rIdx)}
                title="Remove row"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="add-row-btn" onClick={handleAddRow}>
          + Add Resource Row
        </button>
      </div>
    );
  }

  // Play Mode UX (§5.2)
  return (
    <div className="pip-matrix-play">
      {rows.length === 0 ? (
        <div className="empty-primitive-hint">No resource rows configured.</div>
      ) : (
        rows.map((row, rIdx) => {
          const availableCount = row.total - row.expended;
          return (
            <div key={rIdx} className="pip-matrix-row">
              <div className="pip-row-header">
                <span className="row-label">{row.label}</span>
                <span className="row-counter">
                  {availableCount} / {row.total}
                </span>
              </div>
              <div className="pips-track">
                {Array.from({ length: row.total }).map((_, pIdx) => {
                  const isAvailable = pIdx < availableCount;
                  return (
                    <button
                      key={pIdx}
                      type="button"
                      className={`pip-toggle ${isAvailable ? "available" : "expended"}`}
                      onClick={() => handleTogglePip(rIdx, pIdx)}
                      title={isAvailable ? "Click to expend" : "Click to restore"}
                    />
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
