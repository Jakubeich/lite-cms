"use client";

import React, { CSSProperties } from "react";

/**
 * DragHandle props
 */
export interface DragHandleProps {
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Disabled state */
  disabled?: boolean;
  /** Drag handle props from dnd library */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * Drag handle component for reordering items
 */
export function DragHandle({
  className = "",
  style,
  disabled = false,
  dragHandleProps = {},
}: DragHandleProps) {
  const baseStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    cursor: disabled ? "not-allowed" : "grab",
    opacity: disabled ? 0.3 : 1,
    color: "#9ca3af",
    flexShrink: 0,
    ...style,
  };

  return (
    <div
      className={className}
      style={baseStyles}
      {...dragHandleProps}
      role="button"
      aria-label="Drag to reorder"
      tabIndex={disabled ? -1 : 0}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="5" cy="3" r="1.5" />
        <circle cx="11" cy="3" r="1.5" />
        <circle cx="5" cy="8" r="1.5" />
        <circle cx="11" cy="8" r="1.5" />
        <circle cx="5" cy="13" r="1.5" />
        <circle cx="11" cy="13" r="1.5" />
      </svg>
    </div>
  );
}
