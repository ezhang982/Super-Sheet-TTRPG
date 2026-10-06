import React from "react";
import type { ResolvedCorner } from "../styles/types";

interface CornerAccentsProps {
  corner: ResolvedCorner;
  className?: string;
  size?: number;
}

/**
 * Modular corner accents overlay (Layer 8).
 * Renders decorative corner overlays on the 4 card corners.
 * Positioned absolute with pointer-events: none so it never intercepts clicks.
 */
export const CornerAccents: React.FC<CornerAccentsProps> = React.memo(({
  corner,
  className = "",
  size,
}) => {
  const s = size ?? corner.size;
  return (
    <div className={`card-corner-accents ${className}`} aria-hidden="true">
      <img
        src={corner.svg}
        className="card-corner corner-tl"
        style={{ width: s, height: s }}
        alt=""
        draggable={false}
      />
      <img
        src={corner.svg}
        className="card-corner corner-tr"
        style={{ width: s, height: s }}
        alt=""
        draggable={false}
      />
      <img
        src={corner.svg}
        className="card-corner corner-bl"
        style={{ width: s, height: s }}
        alt=""
        draggable={false}
      />
      <img
        src={corner.svg}
        className="card-corner corner-br"
        style={{ width: s, height: s }}
        alt=""
        draggable={false}
      />
    </div>
  );
});

CornerAccents.displayName = "CornerAccents";
