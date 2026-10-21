import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

export interface IconProps {
  icon: IconDefinition;
  className?: string;
  size?: "xs" | "sm" | "lg" | "1x" | "2x";
  spin?: boolean;
  style?: React.CSSProperties;
}

/**
 * Standardized icon component for Super Sheet.
 * Wraps FontAwesome icons with consistent styling, theme inheritance, and accessibility.
 */
export function Icon({ icon, className = "", size, spin = false, style }: IconProps) {
  return (
    <FontAwesomeIcon
      icon={icon}
      size={size}
      spin={spin}
      style={style as any}
      className={`fa-icon ${className}`.trim()}
      aria-hidden="true"
    />
  );
}
