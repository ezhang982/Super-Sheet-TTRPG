import React from "react";
import { getDivider, renderDividerDecalSvg } from "../styles/registry";

interface HeaderDividerProps {
  dividerId: string;
  color: string;
  accent?: string;
  className?: string;
}

/**
 * Header Divider & Decal component.
 * Renders decorative dividing lines and ornamental center decals
 * between card headers and content.
 */
export const HeaderDivider: React.FC<HeaderDividerProps> = React.memo(
  ({ dividerId, color, accent, className = "" }) => {
    const divider = getDivider(dividerId);

    if (divider.type === "none") {
      return null;
    }

    if (divider.type === "line") {
      return (
        <div
          className={`card-header-divider divider-type-line ${className}`}
          style={{ borderColor: color }}
          aria-hidden="true"
        />
      );
    }

    if (divider.type === "fade") {
      return (
        <div
          className={`card-header-divider divider-type-fade ${className}`}
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          }}
          aria-hidden="true"
        />
      );
    }

    // Decal type: Left flank line -> Center decal ornament -> Right flank line
    const decalSvg = renderDividerDecalSvg(divider.id, color, accent);
    const width = divider.decalWidth ?? 28;
    const height = divider.decalHeight ?? 16;

    return (
      <div
        className={`card-header-divider divider-type-decal ${className}`}
        aria-hidden="true"
      >
        <div
          className="divider-flank divider-flank-left"
          style={{
            background: `linear-gradient(90deg, transparent 5%, ${color} 90%)`,
          }}
        />
        {decalSvg && (
          <div
            className="divider-decal-icon"
            style={{ width, height }}
            dangerouslySetInnerHTML={{ __html: decalSvg }}
          />
        )}
        <div
          className="divider-flank divider-flank-right"
          style={{
            background: `linear-gradient(90deg, ${color} 10%, transparent 95%)`,
          }}
        />
      </div>
    );
  }
);

HeaderDivider.displayName = "HeaderDivider";
