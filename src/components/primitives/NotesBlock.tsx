import React, { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { Block } from "../../types/schema";
import { interpolateTextFormulas } from "../../utils/mathEngine";
import { useCharacterVariables } from "../../store/useCharacterVariables";
import { VariableInsertButton } from "../VariableInsertButton";

type NotesBlockType = Extract<Block, { type: "notes" }>;

interface NotesBlockProps {
  block: NotesBlockType;
  mode: "edit" | "play";
  onUpdateData: (patch: Partial<NotesBlockType["data"]>) => void;
}

export const NotesBlock: React.FC<NotesBlockProps> = ({
  block,
  mode,
  onUpdateData,
}) => {
  const data = block.data;
  const variables = useCharacterVariables();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const handleInsertVariable = (token: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onUpdateData({ markdown: data.markdown ? `${data.markdown} ${token}` : token });
      return;
    }
    const start = textarea.selectionStart ?? data.markdown.length;
    const end = textarea.selectionEnd ?? data.markdown.length;
    const before = data.markdown.substring(0, start);
    const after = data.markdown.substring(end);
    const nextVal = `${before}${token}${after}`;
    onUpdateData({ markdown: nextVal });
    setTimeout(() => {
      textarea.focus();
      const newPos = start + token.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  if (mode === "edit") {
    return (
      <div className="notes-edit-panel">
        <div className="editor-tab-bar">
          <div className="editor-tab-group">
            <button
              type="button"
              className={`editor-tab ${activeTab === "edit" ? "active" : ""}`}
              onClick={() => setActiveTab("edit")}
            >
              Edit Markdown
            </button>
            <button
              type="button"
              className={`editor-tab ${activeTab === "preview" ? "active" : ""}`}
              onClick={() => setActiveTab("preview")}
            >
              Preview
            </button>
          </div>
          {activeTab === "edit" && (
            <VariableInsertButton onInsert={handleInsertVariable} />
          )}
        </div>

        {activeTab === "edit" ? (
          <textarea
            ref={textareaRef}
            className="notes-textarea"
            value={data.markdown}
            placeholder="Write notes, campaign lore, quest logs (supports {@formulas} and Markdown)..."
            onChange={(e) => onUpdateData({ markdown: e.target.value })}
          />
        ) : (
          <div className="notes-preview-scroll prose-content">
            {data.markdown ? (
              <ReactMarkdown>{interpolateTextFormulas(data.markdown, variables)}</ReactMarkdown>
            ) : (
              <em>No notes written yet.</em>
            )}
          </div>
        )}
      </div>
    );
  }

  // Play Mode UX (§5.5) - Reading view
  return (
    <div className="notes-play-container">
      <div className="notes-reading-view prose-content">
        {data.markdown ? (
          <ReactMarkdown>{interpolateTextFormulas(data.markdown, variables)}</ReactMarkdown>
        ) : (
          <p className="empty-primitive-hint">No notes written yet.</p>
        )}
      </div>
    </div>
  );
};
