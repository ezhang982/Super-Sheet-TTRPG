import React from "react";
import { useCharacterStore } from "../store/useCharacterStore";

export const BottomHistoryBar: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const undo = useCharacterStore((state) => state.undo);
  const redo = useCharacterStore((state) => state.redo);

  return (
    <div className={`bottom-history-bar ${mode === "play" ? "disabled" : ""}`}>
      <button
        type="button"
        className="history-icon-btn"
        onClick={undo}
        disabled={mode !== "edit"}
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        type="button"
        className="history-icon-btn"
        onClick={redo}
        disabled={mode !== "edit"}
        title="Redo (Ctrl+Shift+Z)"
      >
        ↪
      </button>
    </div>
  );
};
