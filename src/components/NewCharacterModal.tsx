import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useCharacterStore } from "../store/useCharacterStore";
import { BUILTIN_TEMPLATES, type TemplateDefinition } from "../templates";

interface NewCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const NewCharacterModal: React.FC<NewCharacterModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const newCharacter = useCharacterStore((state) => state.newCharacter);
  const importCharacter = useCharacterStore((state) => state.importCharacter);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("dnd5e");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;
  if (typeof document === "undefined") return null;

  const handleSelectTemplate = (templateDef: TemplateDefinition) => {
    newCharacter(templateDef.template);
    onToast(`Loaded ${templateDef.name}!`);
    onClose();
  };

  const handleConfirmSelected = () => {
    const chosen = BUILTIN_TEMPLATES.find((t) => t.id === selectedTemplateId);
    if (chosen) {
      handleSelectTemplate(chosen);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        const result = importCharacter(json);
        if (!result.success) {
          setImportError(result.error);
        } else {
          setImportError(null);
          onToast("Imported character sheet successfully!");
          onClose();
        }
      } catch (err) {
        setImportError(`Failed to parse file: ${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog new-character-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-character-dialog-title"
        style={{ maxWidth: "600px" }}
      >
        <div className="modal-header">
          <div>
            <h3 id="new-character-dialog-title" style={{ margin: 0, fontSize: "1.25rem" }}>
              ✨ New Character Sheet
            </h3>
            <p
              style={{
                margin: "4px 0 0 0",
                fontSize: "0.825rem",
                color: "var(--text-muted)",
              }}
            >
              Choose a starter template or start from a clean canvas
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {importError && (
            <div
              style={{
                padding: "8px 12px",
                borderRadius: "6px",
                background: "rgba(224, 108, 117, 0.15)",
                border: "1px solid #e06c75",
                color: "#e06c75",
                fontSize: "0.825rem",
              }}
            >
              {importError}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gap: "0.75rem",
            }}
          >
            {BUILTIN_TEMPLATES.map((tmpl) => {
              const isSelected = selectedTemplateId === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplateId(tmpl.id)}
                  onDoubleClick={() => handleSelectTemplate(tmpl)}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    border: `1.5px solid ${
                      isSelected ? "var(--accent-color, #e06c75)" : "var(--border-color, #2f333d)"
                    }`,
                    backgroundColor: isSelected
                      ? "rgba(255, 255, 255, 0.04)"
                      : "rgba(0, 0, 0, 0.2)",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "1.8rem", lineHeight: 1, paddingTop: "2px" }}>
                    {tmpl.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{tmpl.name}</span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: "var(--border-color, #2f333d)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {tmpl.system}
                      </span>
                      {tmpl.badge && (
                        <span
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            background: "rgba(224, 108, 117, 0.2)",
                            color: "var(--accent-color, #e06c75)",
                            fontWeight: 600,
                          }}
                        >
                          {tmpl.badge}
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.825rem",
                        color: "var(--text-muted)",
                        lineHeight: 1.35,
                      }}
                    >
                      {tmpl.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              backgroundColor: "rgba(229, 192, 123, 0.08)",
              border: "1px dashed rgba(229, 192, 123, 0.3)",
              fontSize: "0.8rem",
              color: "#e5c07b",
              lineHeight: 1.4,
            }}
          >
            💡 <strong>Note:</strong> Starting a new sheet will switch your active canvas.
            Be sure you have exported your current sheet if you want to keep an offline JSON backup.
          </div>
        </div>

        <div
          className="modal-footer"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "1px solid var(--border-color, #2f333d)",
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: "transparent",
              border: "1px solid var(--border-color, #2f333d)",
              color: "var(--text-muted)",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            📂 Import JSON File...
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color, #2f333d)",
                color: "var(--text-color, #abb2bf)",
                padding: "6px 14px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85rem",
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleConfirmSelected}
              style={{
                backgroundColor: "var(--accent-color, #e06c75)",
                color: "#fff",
                border: "none",
                padding: "6px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            >
              Create Character
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
