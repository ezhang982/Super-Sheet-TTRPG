import React, { useMemo, useState } from "react";
import { useCharacterStore } from "../store/useCharacterStore";

import { RestActionModal } from "./RestActionModal";

export const TagFilterAndRestBar: React.FC = () => {
  const mode = useCharacterStore((state) => state.mode);
  const character = useCharacterStore((state) => state.character);
  const restActions = useCharacterStore((state) => state.restActions);
  const applyRest = useCharacterStore((state) => state.applyRest);
  const activeTagFilter = useCharacterStore((state) => state.activeTagFilter);
  const setActiveTagFilter = useCharacterStore((state) => state.setActiveTagFilter);

  const [restToast, setRestToast] = useState<string | null>(null);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);

  // Collect unique tags from blocks currently in active tab
  const uniqueTags = useMemo(() => {
    const activeLayout = character.layouts[character.activeTabId] ?? [];
    const tagsSet = new Set<string>();
    for (const item of activeLayout) {
      const block = character.blocks[item.i];
      if (block) {
        for (const tag of block.tags) {
          tagsSet.add(tag);
        }
      }
    }
    return Array.from(tagsSet).sort();
  }, [character.layouts, character.activeTabId, character.blocks]);

  const handleRestClick = (label: string, tag: string) => {
    applyRest(tag);
    setRestToast(`${label} applied!`);
    setTimeout(() => {
      setRestToast(null);
    }, 2000);
  };

  // Only displayed in Play Mode (§4.3)
  if (mode !== "play") return null;

  return (
    <div className="tag-and-rest-bar">
      {/* Semantic Tag Filter Bar (§6.2) */}
      <div className="tag-filter-scroll">
        <span className="tag-filter-label">Filter:</span>
        <button
          type="button"
          className={`filter-chip ${activeTagFilter === null ? "active" : ""}`}
          onClick={() => setActiveTagFilter(null)}
        >
          All
        </button>

        {uniqueTags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`filter-chip ${activeTagFilter === tag ? "active" : ""}`}
            onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Rest Action Bar (§6.1) */}
      <div className="rest-action-group">
        {restActions.map((action) => (
          <button
            key={action.id}
            type="button"
            className="rest-action-btn"
            onClick={() => handleRestClick(action.label, action.tag)}
            title={`Reset counters and pips tagged with ${action.tag}`}
          >
            🌙 {action.label}
          </button>
        ))}

        <button
          type="button"
          className="rest-config-btn"
          onClick={() => setIsRestModalOpen(true)}
          title="Configure rest actions"
        >
          ⚙
        </button>

        {restToast && <span className="rest-toast-badge">{restToast}</span>}
      </div>

      {/* Rest Action Settings Modal */}
      <RestActionModal
        isOpen={isRestModalOpen}
        onClose={() => setIsRestModalOpen(false)}
      />
    </div>
  );
};
