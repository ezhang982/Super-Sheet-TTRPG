import React, { useState } from "react";
import type { Block } from "../../types/schema";
import { evaluateQuickMath, evaluateFormula, isFormula } from "../../utils/mathEngine";
import { FormulaInput } from "../FormulaInput";
import { useCharacterVariables } from "../../store/useCharacterVariables";
import { useRevertToast } from "../../store/useRevertToast";

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
  const variables = useCharacterVariables();
  const showToast = useRevertToast((state) => state.showToast);
  const data = block.data;
  const step = data.step || 1;
  const temp = data.temp || 0;

  const [editCurrentStr, setEditCurrentStr] = useState(data.current.toString());
  const [editMaxStr, setEditMaxStr] = useState(data.max.toString());
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  const [currentInputVal, setCurrentInputVal] = useState(data.current.toString());
  const [isEditingTemp, setIsEditingTemp] = useState(false);
  const [tempInputVal, setTempInputVal] = useState(temp.toString());

  const handleAdjustCurrent = (delta: number) => {
    const prev = data.current;
    const next = Math.max(0, data.current + delta);
    onUpdateData({ current: next });
    if (mode === "play" && prev !== next) {
      showToast(`${block.title}: ${prev} → ${next}`, () => onUpdateData({ current: prev }));
    }
  };

  const handleCommitCurrent = () => {
    const prev = data.current;
    const nextVal = evaluateQuickMath(data.current, currentInputVal, 0, data.max);
    onUpdateData({ current: nextVal });
    setIsEditingCurrent(false);
    if (mode === "play" && prev !== nextVal) {
      showToast(`${block.title}: ${prev} → ${nextVal}`, () => onUpdateData({ current: prev }));
    }
  };

  const handleCommitTemp = () => {
    const prev = temp;
    const nextVal = evaluateQuickMath(temp, tempInputVal, 0);
    onUpdateData({ temp: nextVal });
    setIsEditingTemp(false);
    if (mode === "play" && prev !== nextVal) {
      showToast(`${block.title} Temp: ${prev} → ${nextVal}`, () => onUpdateData({ temp: prev }));
    }
  };

  if (mode === "edit") {
    return (
      <div className="tracker-edit-panel">
        <div className="config-row">
          <label>Current Value:</label>
          <div style={{ flex: 1, maxWidth: "160px" }}>
            <FormulaInput
              value={editCurrentStr}
              placeholder="e.g. 12 or = @HP.max"
              onChange={(val) => {
                setEditCurrentStr(val);
                if (isFormula(val)) {
                  const res = evaluateFormula(val, variables);
                  if (res.value !== null) onUpdateData({ current: res.value });
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) onUpdateData({ current: num });
                }
              }}
            />
          </div>
        </div>
        <div className="config-row">
          <label>Max Value:</label>
          <div style={{ flex: 1, maxWidth: "160px" }}>
            <FormulaInput
              value={editMaxStr}
              placeholder="e.g. 12 or = 10 + (@CON.mod * 2)"
              onChange={(val) => {
                setEditMaxStr(val);
                if (isFormula(val)) {
                  const res = evaluateFormula(val, variables);
                  if (res.value !== null) onUpdateData({ max: Math.max(1, res.value) });
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) onUpdateData({ max: Math.max(1, num) });
                }
              }}
            />
          </div>
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
              type="text"
              className="direct-counter-input"
              value={currentInputVal}
              autoFocus
              placeholder="±N or N"
              onFocus={(e) => e.target.select()}
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
              onClick={() => {
                setCurrentInputVal(data.current.toString());
                setIsEditingCurrent(true);
              }}
              title="Click to input relative math (e.g. -10, +5, /2) or exact number"
            >
              {data.current}
            </span>
          )}

          <span className="counter-divider">/</span>
          <span className="max-number">{data.max}</span>

          {temp > 0 && !isEditingTemp && (
            <span
              className="temp-indicator"
              onClick={() => {
                setTempInputVal(temp.toString());
                setIsEditingTemp(true);
              }}
              title="Temporary value. Click to edit (e.g. +5 or -3)."
            >
              +{temp}
            </span>
          )}

          {isEditingTemp && (
            <input
              type="text"
              className="direct-temp-input"
              value={tempInputVal}
              autoFocus
              placeholder="±N"
              onFocus={(e) => e.target.select()}
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
