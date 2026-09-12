import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Block } from "../../types/schema";
import { evaluateQuickMath, interpolateTextFormulas } from "../../utils/mathEngine";
import { useCharacterVariables } from "../../store/useCharacterVariables";
import { VariableInsertButton } from "../VariableInsertButton";

type CardBlockType = Extract<Block, { type: "card" }>;

interface FeatureCardBlockProps {
  block: CardBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<CardBlockType["data"]> | Record<string, unknown>) => void;
}

export const FeatureCardBlock: React.FC<FeatureCardBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const data = block.data;
  const tracker = data.tracker;
  const variables = useCharacterVariables();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [editTab, setEditTab] = useState<"edit" | "preview">("edit");
  const [isEditingTracker, setIsEditingTracker] = useState(false);
  const [trackerInputVal, setTrackerInputVal] = useState(tracker?.current?.toString() ?? "0");

  const handleInsertVariable = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onUpdateData({ description: data.description ? `${data.description} ${token}` : token });
      return;
    }
    const start = textarea.selectionStart ?? data.description.length;
    const end = textarea.selectionEnd ?? data.description.length;
    const before = data.description.substring(0, start);
    const after = data.description.substring(end);
    const nextVal = `${before}${token}${after}`;
    onUpdateData({ description: nextVal });
    setTimeout(() => {
      textarea.focus();
      const newPos = start + token.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleAdjustTracker = (delta: number) => {
    if (!tracker || !tracker.enabled) return;
    const newCurrent = Math.max(0, Math.min(tracker.max, tracker.current + delta));
    onUpdateData({
      tracker: {
        ...tracker,
        current: newCurrent,
      },
    });
  };

  const handleCommitTrackerQuickMath = () => {
    if (!tracker || !tracker.enabled) return;
    const nextVal = evaluateQuickMath(tracker.current, trackerInputVal, 0, tracker.max);
    onUpdateData({
      tracker: {
        ...tracker,
        current: nextVal,
      },
    });
    setIsEditingTracker(false);
  };

  const handleToggleTrackerPip = (index: number) => {
    if (!tracker || !tracker.enabled) return;
    // Pips available count is tracker.current
    const isAvailable = index < tracker.current;
    let newCurrent: number;
    if (isAvailable) {
      newCurrent = index;
    } else {
      newCurrent = index + 1;
    }
    onUpdateData({
      tracker: {
        ...tracker,
        current: Math.max(0, Math.min(tracker.max, newCurrent)),
      },
    });
  };

  if (mode === "edit") {
    return (
      <div className="card-edit-panel">
        <div className="card-config-row">
          <label>Badge / Activation:</label>
          <input
            type="text"
            value={data.badge || ""}
            placeholder="e.g. Action, Bonus Action, Passive"
            onChange={(e) => onUpdateData({ badge: e.target.value })}
          />
        </div>

        {/* Embedded Tracker Configuration */}
        <div className="card-tracker-config">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={!!tracker?.enabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                onUpdateData({
                  tracker: {
                    enabled,
                    current: tracker?.current ?? 1,
                    max: tracker?.max ?? 1,
                  },
                });
              }}
            />
            <span>Enable Usage Counter (e.g. 1/Rest)</span>
          </label>

          {tracker?.enabled && (
            <div className="tracker-inputs-inline">
              <div className="tracker-field">
                <label>Current:</label>
                <input
                  type="number"
                  min="0"
                  value={tracker.current}
                  onChange={(e) =>
                    onUpdateData({
                      tracker: {
                        ...tracker,
                        current: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                />
              </div>
              <div className="tracker-field">
                <label>Max:</label>
                <input
                  type="number"
                  min="1"
                  value={tracker.max}
                  onChange={(e) =>
                    onUpdateData({
                      tracker: {
                        ...tracker,
                        max: Math.max(1, parseInt(e.target.value, 10) || 1),
                      },
                    })
                  }
                />
              </div>
            </div>
          )}
        </div>

        {/* Description Editor with Edit / Preview Toggle */}
        <div className="card-description-editor">
          <div className="editor-tab-bar">
            <div className="editor-tab-group">
              <button
                type="button"
                className={`editor-tab ${editTab === "edit" ? "active" : ""}`}
                onClick={() => setEditTab("edit")}
              >
                Markdown
              </button>
              <button
                type="button"
                className={`editor-tab ${editTab === "preview" ? "active" : ""}`}
                onClick={() => setEditTab("preview")}
              >
                Preview
              </button>
            </div>
            {editTab === "edit" && (
              <VariableInsertButton onInsert={handleInsertVariable} />
            )}
          </div>

          {editTab === "edit" ? (
            <textarea
              ref={textareaRef}
              className="card-textarea"
              rows={5}
              value={data.description}
              placeholder="Card description (supports Markdown & {@formulas})..."
              onChange={(e) => onUpdateData({ description: e.target.value })}
            />
          ) : (
            <div className="card-markdown-preview prose-content">
              {data.description ? (
                <ReactMarkdown>{interpolateTextFormulas(data.description, variables)}</ReactMarkdown>
              ) : (
                <em>No description</em>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Play Mode UX (§5.4)
  const hasLongText = data.description.length > 120 || data.description.includes("\n");

  return (
    <div className="card-play-container">
      <div className="card-sub-header">
        {data.badge && <span className="card-badge-chip">{data.badge}</span>}

        {/* Embedded Tracker in Header */}
        {tracker?.enabled && (
          <div className="card-embedded-tracker">
            {tracker.max <= 5 ? (
              <div className="card-pips-strip">
                {Array.from({ length: tracker.max }).map((_, idx) => {
                  const isAvailable = idx < tracker.current;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`card-pip ${isAvailable ? "available" : "expended"}`}
                      onClick={() => handleToggleTrackerPip(idx)}
                      title={isAvailable ? "Click to use" : "Click to restore"}
                    />
                  );
                })}
              </div>
            ) : (
              <div className="card-counter-stepper">
                <button
                  type="button"
                  className="card-step-btn"
                  onClick={() => handleAdjustTracker(-1)}
                  disabled={tracker.current <= 0}
                >
                  −
                </button>
                {isEditingTracker ? (
                  <input
                    type="text"
                    className="direct-counter-input card-counter-input"
                    value={trackerInputVal}
                    autoFocus
                    placeholder="±N"
                    style={{ width: "45px", textAlign: "center", padding: "2px 4px", fontSize: "0.85rem" }}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => setTrackerInputVal(e.target.value)}
                    onBlur={handleCommitTrackerQuickMath}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommitTrackerQuickMath();
                      if (e.key === "Escape") setIsEditingTracker(false);
                    }}
                  />
                ) : (
                  <span
                    className="card-step-val"
                    onClick={() => {
                      setTrackerInputVal(tracker.current.toString());
                      setIsEditingTracker(true);
                    }}
                    title="Click to input relative math (e.g. -1, +2) or exact number"
                    style={{ cursor: "pointer" }}
                  >
                    {tracker.current} / {tracker.max}
                  </span>
                )}
                <button
                  type="button"
                  className="card-step-btn"
                  onClick={() => handleAdjustTracker(1)}
                  disabled={tracker.current >= tracker.max}
                >
                  +
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Markdown Content */}
      <div className={`card-body-content ${isExpanded ? "expanded" : "collapsed"}`}>
        <div className="prose-content">
          <ReactMarkdown>
            {interpolateTextFormulas(data.description || "_No description provided._", variables)}
          </ReactMarkdown>
        </div>
      </div>

      {hasLongText && (
        <button
          type="button"
          className="card-expand-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "▲ Show Less" : "▼ Show More"}
        </button>
      )}
    </div>
  );
};
