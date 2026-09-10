import React, { useState } from "react";
import type { Block } from "../../types/schema";

type TrackerBlockType = Extract<Block, { type: "tracker" }>;

interface TrackerBlockProps {
  block: TrackerBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<TrackerBlockType["data"]>) => void;
}

export const TrackerBlock: React.FC<TrackerBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const data = block.data;
  const step = data.step || 1;
  const temp = data.temp || 0;

  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [currentInputVal, setCurrentInputVal] = useState(data.current.toString());
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempInputVal, setTempInputVal] = useState(temp.toString());

  const handleAdjustCurrent = (delta: number) => {
    onUpdateData({ current: data.current + delta });
  };

  const handleCommitCurrent = () => {
    const num = parseInt(currentInputVal, 10);
    if (!isNaN(num)) {
      onUpdateData({ current: num });
    }
    setIsEditingCurrent(false);
  };

  const handleCommitTemp = () => {
    const num = parseInt(tempInputVal, 10);
    if (!isNaN(num)) {
      onUpdateData({ temp: Math.max(0, num) });
    }
    setIsEditingTemp(false);
  };

  if (mode === "edit") {
    return (
      <div className="tracker-edit-panel">
        <div className="config-row">
          <label>Current Value:</label>
          <input
            type="number"
            value={data.current}
            onChange={(e) => onUpdateData({ current: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="config-row">
          <label>Max Value:</label>
          <input
            type="number"
            value={data.max}
            onChange={(e) => onUpdateData({ max: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div className="config-row">
          <label>Step Size:</label>
          <input
            type="number"
            min="1"
            value={step}
            onChange={(e) => onUpdateData({ step: Math.max(1, parseInt(e.target.value, 10) || 1) })}
          />
        </div>
        <div className="config-row">
          <label>Temporary Bonus:</label>
          <input
            type="number"
            min="0"
            value={temp}
            onChange={(e) => onUpdateData({ temp: Math.max(0, parseInt(e.target.value, 10) || 0) })}
          />
        </div>
      </div>
    );
  }

  // Play Mode UX (§5.1)
  return (
    <div className="tracker-play-container">
      <div className="tracker-main-counter">
        <button
          type="button"
          className="stepper-btn dec"
          onClick={() => handleAdjustCurrent(-step)}
          title={`Decrease by ${step}`}
        >
          −
        </button>

        <div className="tracker-numeric-group">
          {isEditingCurrent ? (
            <input
              type="number"
              className="direct-counter-input"
              value={currentInputVal}
              autoFocus
              onChange={(e) => setCurrentInputVal(e.target.value)}
              onBlur={handleCommitCurrent}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitCurrent();
                if (e.key === "Escape") setIsEditingCurrent(false);
              }}
            />
          ) : (
            <span
              className="current-number"
              onDoubleClick={() => {
                setCurrentInputVal(data.current.toString());
                setIsEditingCurrent(true);
              }}
              title="Double-click to enter exact number"
            >
              {data.current}
            </span>
          )}

          <span className="counter-divider">/</span>
          <span className="max-number">{data.max}</span>

          {temp > 0 && !isEditingTemp && (
            <span
              className="temp-indicator"
              onDoubleClick={() => {
                setTempInputVal(temp.toString());
                setIsEditingTemp(true);
              }}
              title="Temporary value. Double-click to edit."
            >
              +{temp}
            </span>
          )}

          {isEditingTemp && (
            <input
              type="number"
              className="direct-temp-input"
              value={tempInputVal}
              autoFocus
              onChange={(e) => setTempInputVal(e.target.value)}
              onBlur={handleCommitTemp}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitTemp();
                if (e.key === "Escape") setIsEditingTemp(false);
              }}
            />
          )}
        </div>

        <button
          type="button"
          className="stepper-btn inc"
          onClick={() => handleAdjustCurrent(step)}
          title={`Increase by ${step}`}
        >
          +
        </button>
      </div>

      <div className="tracker-footer-actions">
        {temp === 0 && (
          <button
            type="button"
            className="add-temp-btn"
            onClick={() => {
              setTempInputVal("5");
              setIsEditingTemp(true);
            }}
          >
            + Temp
          </button>
        )}
        {temp > 0 && (
          <button
            type="button"
            className="clear-temp-btn"
            onClick={() => onUpdateData({ temp: 0 })}
            title="Clear temporary bonus"
          >
            Clear Temp
          </button>
        )}
      </div>
    </div>
  );
};
