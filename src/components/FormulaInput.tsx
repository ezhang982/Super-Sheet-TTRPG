import React, { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useCharacterVariables, useCharacterVariableDetails } from "../store/useCharacterVariables";
import { isFormula, evaluateFormula } from "../utils/mathEngine";

interface FormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const FormulaInput: React.FC<FormulaInputProps> = ({
  value,
  onChange,
  placeholder = "e.g. +5 or = @DEX.mod + @Prof",
  className = "",
  disabled = false,
  onBlur,
  onKeyDown,
}) => {
  const variables = useCharacterVariables();
  const variableDetails = useCharacterVariableDetails();

  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPos, setDropdownPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
  }>({ left: 0 });

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const updateDropdownPosition = () => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dropdownWidth = 280;
    const dropdownHeight = 260;

    // Clamp horizontal position so it never overflows screen edges
    let left = rect.left;
    if (left + dropdownWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - dropdownWidth - 12);
    }
    if (left < 12) {
      left = 12;
    }

    // Determine vertical position: open upward if near bottom
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      setDropdownPos({
        bottom: window.innerHeight - rect.top + 4,
        left,
      });
    } else {
      setDropdownPos({
        top: rect.bottom + 4,
        left,
      });
    }
  };

  useEffect(() => {
    if (showDropdown) {
      updateDropdownPosition();
      const handleResizeOrScroll = () => updateDropdownPosition();
      window.addEventListener("resize", handleResizeOrScroll);
      window.addEventListener("scroll", handleResizeOrScroll, true);
      return () => {
        window.removeEventListener("resize", handleResizeOrScroll);
        window.removeEventListener("scroll", handleResizeOrScroll, true);
      };
    }
  }, [showDropdown]);

  // Click outside listener
  useEffect(() => {
    if (!showDropdown) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    };
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [showDropdown]);

  // Live evaluation of current value
  const isFormulaValue = isFormula(value);
  const liveEval = useMemo(() => {
    if (!isFormulaValue) return null;
    return evaluateFormula(value, variables);
  }, [value, variables, isFormulaValue]);

  // Filtered variables based on search query or typed @query
  const filteredVariables = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return variableDetails;
    return variableDetails.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q)) ||
        v.category.toLowerCase().includes(q)
    );
  }, [variableDetails, searchQuery]);

  // Group variables by category
  const groupedVariables = useMemo(() => {
    const groups: Record<string, typeof filteredVariables> = {};
    for (const v of filteredVariables) {
      if (!groups[v.category]) groups[v.category] = [];
      groups[v.category].push(v);
    }
    return groups;
  }, [filteredVariables]);

  // Detect typing '@' in input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);

    const cursorPos = e.target.selectionStart ?? newVal.length;
    const textBeforeCursor = newVal.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);

    if (atMatch) {
      setSearchQuery(atMatch[1]);
      setSelectedIndex(0);
      setShowDropdown(true);
    } else {
      // Don't close if opened via fx button
      if (searchQuery) {
        setShowDropdown(false);
      }
    }
  };

  const handleSelectVariable = (varName: string) => {
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const textBeforeCursor = value.slice(0, cursorPos);
    const textAfterCursor = value.slice(cursorPos);

    let finalValue: string;
    if (textBeforeCursor.includes("@")) {
      const replacedBefore = textBeforeCursor.replace(/@([a-zA-Z0-9_.]*)$/, `${varName} `);
      finalValue = replacedBefore + textAfterCursor;
    } else {
      // If opened via fx button and no @ typed yet
      const prefix = value.trim().startsWith("=") ? "" : "= ";
      finalValue = value ? `${value} ${varName} ` : `${prefix}${varName} `;
    }

    onChange(finalValue);
    setShowDropdown(false);
    setSearchQuery("");

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = finalValue.length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 0);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showDropdown && filteredVariables.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredVariables.length) % filteredVariables.length);
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        handleSelectVariable(filteredVariables[selectedIndex].name);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowDropdown(false);
        return;
      }
    }

    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div
      className="formula-input-container"
      ref={containerRef}
      style={{ position: "relative", width: "100%", boxSizing: "border-box" }}
    >
      <div className="formula-input-wrapper" style={{ position: "relative", display: "flex", alignItems: "center", width: "100%" }}>
        <input
          ref={inputRef}
          type="text"
          className={className}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          style={{ width: "100%", paddingRight: "28px", boxSizing: "border-box" }}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={() => {
            setTimeout(() => {
              if (onBlur) onBlur();
            }, 180);
          }}
        />

        {/* Quick fx button to toggle variables list */}
        <button
          type="button"
          className={`formula-fx-toggle-btn ${showDropdown ? "active" : ""}`}
          title="Insert formula variable (@)"
          tabIndex={-1}
          onMouseDown={(e) => {
            e.preventDefault();
            setShowDropdown((prev) => !prev);
          }}
        >
          ƒx
        </button>
      </div>

      {/* Live Formula Evaluation Preview */}
      {isFormulaValue && liveEval && (
        <div className={`formula-live-preview ${liveEval.error ? "has-error" : "is-valid"}`}>
          {liveEval.error ? (
            <span className="preview-error" title={liveEval.explanation}>
              ⚠️ {liveEval.explanation || "Invalid formula"}
            </span>
          ) : (
            <span className="preview-success" title={liveEval.explanation}>
              <strong className="preview-tag">Result:</strong> {liveEval.formatted}
              <span className="preview-math"> ({liveEval.explanation})</span>
            </span>
          )}
        </div>
      )}

      {/* Dropdown Variable Picker via Portal */}
      {showDropdown &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="formula-autocomplete-dropdown formula-portal-dropdown"
            ref={dropdownRef}
            style={{
              position: "fixed",
              left: `${dropdownPos.left}px`,
              top: dropdownPos.top !== undefined ? `${dropdownPos.top}px` : undefined,
              bottom: dropdownPos.bottom !== undefined ? `${dropdownPos.bottom}px` : undefined,
              zIndex: 99999,
            }}
          >
            <div className="formula-autocomplete-header">
              <span>Character Variables</span>
              <span className="dropdown-hint">Click to insert</span>
            </div>

            <div className="formula-search-bar">
              <input
                type="text"
                placeholder="Search variables (e.g. STR, Prof)..."
                value={searchQuery}
                autoFocus
                className="formula-dropdown-search"
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setShowDropdown(false);
                  if (e.key === "Enter" && filteredVariables.length > 0) {
                    e.preventDefault();
                    handleSelectVariable(filteredVariables[selectedIndex].name);
                  }
                  if (e.key === "ArrowDown" && filteredVariables.length > 0) {
                    e.preventDefault();
                    setSelectedIndex((p) => (p + 1) % filteredVariables.length);
                  }
                  if (e.key === "ArrowUp" && filteredVariables.length > 0) {
                    e.preventDefault();
                    setSelectedIndex((p) => (p - 1 + filteredVariables.length) % filteredVariables.length);
                  }
                }}
              />
            </div>

            <div className="formula-autocomplete-scroll">
              {filteredVariables.length === 0 ? (
                <div className="formula-empty-hint">No variables match "{searchQuery}"</div>
              ) : (
                Object.entries(groupedVariables).map(([category, items]) => (
                  <div key={category} className="formula-var-category">
                    <div className="category-title">{category}</div>
                    <ul className="formula-autocomplete-list">
                      {items.map((item) => {
                        const globalIdx = filteredVariables.indexOf(item);
                        const isSelected = globalIdx === selectedIndex;
                        return (
                          <li
                            key={item.name}
                            className={`formula-autocomplete-item ${isSelected ? "selected" : ""}`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectVariable(item.name);
                            }}
                            onMouseEnter={() => setSelectedIndex(globalIdx)}
                          >
                            <div className="var-info-left">
                              <span className="var-name">{item.name}</span>
                              {item.description && <span className="var-desc">{item.description}</span>}
                            </div>
                            <span className="var-val">{item.displayVal}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
