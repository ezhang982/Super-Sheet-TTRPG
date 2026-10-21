import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRevertToast } from "../store/useRevertToast";
import { useCharacterStore } from "../store/useCharacterStore";
import { Icon } from "./ui/Icon";
import { faBolt, faRotateLeft, faXmark } from "@fortawesome/free-solid-svg-icons";

export const PlayModeRevertToast: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const toast = useRevertToast((state) => state.toast);
  const dismissToast = useRevertToast((state) => state.dismissToast);

  // Auto-dismiss after 4.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, dismissToast]);

  if (!toast || mode !== "play") return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="revert-toast-container" role="status" aria-live="polite">
      <div className="revert-toast-card">
        <span className="toast-icon"><Icon icon={faBolt} /></span>
        <span className="toast-message">{toast.message}</span>
        <button
          type="button"
          className="toast-revert-btn"
          onClick={() => {
            toast.onRevert();
            dismissToast();
          }}
          title="Undo this counter change"
          style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
        >
          <Icon icon={faRotateLeft} /> Revert
        </button>
        <button
          type="button"
          className="toast-close-btn"
          onClick={dismissToast}
          aria-label="Dismiss toast"
        >
          <Icon icon={faXmark} />
        </button>
      </div>
    </div>,
    document.body
  );
};
