import React from "react";
import type { CSSProperties } from "react";

export interface StyleOption {
  id: string;
  label: string;
  /** Classes/inline style to render the thumbnail. Omit for no thumbnail art. */
  previewClassName?: string;
  previewStyle?: CSSProperties;
}

interface StyleOptionGridProps {
  /** Accessible name for the group, e.g. "Frame". */
  label: string;
  options: StyleOption[];
  /** Currently chosen id, or undefined when inheriting the default. */
  value: string | undefined;
  onChange: (id: string | undefined) => void;
  /**
   * When provided, a first "Sheet default" tile is shown; picking it calls
   * onChange(undefined). Used for per-card overrides.
   */
  defaultOption?: { subLabel: string; previewClassName?: string; previewStyle?: CSSProperties };
}

/** A grid of selectable tiles with a live miniature preview of each design. */
export const StyleOptionGrid: React.FC<StyleOptionGridProps> = ({
  label,
  options,
  value,
  onChange,
  defaultOption,
}) => {
  return (
    <div className="style-option-grid" role="radiogroup" aria-label={label}>
      {defaultOption && (
        <button
          type="button"
          role="radio"
          aria-checked={value === undefined}
          className={`style-option ${value === undefined ? "selected" : ""}`}
          onClick={() => onChange(undefined)}
          title="Use the sheet-wide default"
        >
          <div
            className={`style-thumb ${defaultOption.previewClassName ?? ""}`}
            style={defaultOption.previewStyle}
          />
          <span className="style-option-label">Sheet default</span>
          <span className="style-option-sub">{defaultOption.subLabel}</span>
        </button>
      )}
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="radio"
          aria-checked={value === opt.id}
          className={`style-option ${value === opt.id ? "selected" : ""}`}
          onClick={() => onChange(opt.id)}
          title={opt.label}
        >
          <div className={`style-thumb ${opt.previewClassName ?? ""}`} style={opt.previewStyle} />
          <span className="style-option-label">{opt.label}</span>
        </button>
      ))}
    </div>
  );
};
