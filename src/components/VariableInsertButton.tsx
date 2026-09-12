import React, { useState, useRef, useEffect } from "react";
import { useCharacterVariableDetails } from "../store/useCharacterVariables";
import type { VariableDetail } from "../utils/mathEngine";

interface VariableInsertButtonProps {
  onInsert: (token: string) => void;
  label?: string;
}

export const VariableInsertButton: React.FC<VariableInsertButtonProps> = ({
  onInsert,
  label = "+ ƒx Variable",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const variableDetails = useCharacterVariableDetails();

  const filtered = variableDetails.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return v.name.toLowerCase().includes(q) || (v.description && v.description.toLowerCase().includes(q));
  });

  // Group by category
  const categories: Record<string, VariableDetail[]> = {};
  for (const v of filtered) {
    if (!categories[v.category]) categories[v.category] = [];
    categories[v.category].push(v);
  }

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleSelect = (varName: string) => {
    onInsert(`{${varName}}`);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className="var-insert-btn-container" ref={containerRef}>
      <button
        type="button"
        className="var-insert-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Insert a character variable or formula into text"
      >
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="var-insert-dropdown">
          <div className="var-insert-search-box">
            <input
              type="text"
              className="var-insert-search-input"
              placeholder="Filter variables (@STR, @Prof)..."
              value={search}
              autoFocus
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsOpen(false);
                }
              }}
            />
          </div>
          <div className="var-insert-list">
            {filtered.length === 0 ? (
              <div className="formula-no-match" style={{ padding: "10px", textAlign: "center", color: "var(--text-muted)" }}>
                No matching variables
              </div>
            ) : (
              Object.entries(categories).map(([catName, items]) => (
                <div key={catName} className="formula-category-group">
                  <div className="formula-category-header">{catName}</div>
                  {items.map((v) => (
                    <div
                      key={v.name}
                      className="formula-autocomplete-item"
                      onClick={() => handleSelect(v.name)}
                    >
                      <div className="var-info-left">
                        <span className="var-name">{v.name}</span>
                        <span className="var-desc">{v.description || ""}</span>
                      </div>
                      <span className="var-val">{v.displayVal}</span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          <div className="var-insert-footer-hint">
            Tip: Write math like <code>{"{@DEX.mod + @Prof}"}</code> or <code>{"@Dex.mod"}</code>
          </div>
        </div>
      )}
    </div>
  );
};
