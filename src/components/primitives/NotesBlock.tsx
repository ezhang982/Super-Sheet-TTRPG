import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { Block } from "../../types/schema";

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
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  if (mode === "edit") {
    return (
      <div className="notes-edit-panel">
        <div className="editor-tab-bar">
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

        {activeTab === "edit" ? (
          <textarea
            className="notes-textarea"
            value={data.markdown}
            placeholder="Write notes, campaign lore, quest logs in Markdown..."
            onChange={(e) => onUpdateData({ markdown: e.target.value })}
          />
        ) : (
          <div className="notes-preview-scroll prose-content">
            {data.markdown ? (
              <ReactMarkdown>{data.markdown}</ReactMarkdown>
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
          <ReactMarkdown>{data.markdown}</ReactMarkdown>
        ) : (
          <p className="empty-primitive-hint">No notes written yet.</p>
        )}
      </div>
    </div>
  );
};
