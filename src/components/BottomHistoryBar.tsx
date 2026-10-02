import React from "react";
import { useCharacterStore } from "../store/useCharacterStore";

export const BottomHistoryBar: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);
  const undoPlayMode = useCharacterStore((state) => state.undoPlayMode);
  const redoPlayMode = useCharacterStore((state) => state.redoPlayMode);
  const hasPlayPast = useCharacterStore((state) => state.playHistory.past.length > 0);
  const hasPlayFuture = useCharacterStore((state) => state.playHistory.future.length > 0);
  const saveStatus = useCharacterStore((state) => state.saveStatus);

  const canUndo = mode === "edit" ? true : hasPlayPast;
  const canRedo = mode === "edit" ? true : hasPlayFuture;

  const handleUndo = () => {
    if (mode === "edit") {
      undo();
    } else {
      undoPlayMode();
    }
  };

  const handleRedo = () => {
    if (mode === "edit") {
      redo();
    } else {
      redoPlayMode();
    }
  };

  const undoTitle =
    mode === "edit"
      ? "Undo layout change (Ctrl+Z)"
      : hasPlayPast
      ? "Undo counter change (Ctrl+Z)"
      : "No recent counter changes to undo";

  const redoTitle =
    mode === "edit"
      ? "Redo layout change (Ctrl+Shift+Z)"
      : hasPlayFuture
      ? "Redo counter change (Ctrl+Shift+Z)"
      : "No counter changes to redo";

  return (
    <div className="bottom-left-controls">
      <div className={`bottom-history-bar ${!canUndo && !canRedo ? "disabled" : ""}`}>
        <button
          type="button"
          className="history-icon-btn"
          onClick={handleUndo}
          disabled={!canUndo}
          title={undoTitle}
        >
          ↩
        </button>
        <button
          type="button"
          className="history-icon-btn"
          onClick={handleRedo}
          disabled={!canRedo}
          title={redoTitle}
        >
          ↪
        </button>
      </div>


      <div
        className={`autosave-badge ${saveStatus}`}
        title="Continuously auto-saved to IndexedDB and local storage"
      >
        {saveStatus === "saving" ? (
          <>
            <span className="autosave-spinner">⏳</span>
            <span className="autosave-text">Saving...</span>
          </>
        ) : (
          <>
            <span className="autosave-check">✓</span>
            <span className="autosave-text">Saved locally</span>
          </>
        )}
      </div>
    </div>
  );
};
