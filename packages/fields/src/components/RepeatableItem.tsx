"use client";

import React, { CSSProperties, useState, useCallback } from "react";
import type { RepeatableItem as RepeatableItemType, RepeatableItemHelpers } from "@litecms/core";
import { DragHandle } from "./DragHandle";

/**
 * RepeatableItemWrapper props
 */
export interface RepeatableItemWrapperProps<T> {
  /** Item data */
  item: RepeatableItemType<T>;
  /** Item index */
  index: number;
  /** Item helpers */
  helpers: RepeatableItemHelpers<T>;
  /** Whether editing is enabled */
  canEdit?: boolean;
  /** Whether item can be removed */
  canRemove?: boolean;
  /** Whether sorting is enabled */
  sortable?: boolean;
  /** Children render prop */
  children: React.ReactNode;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Show item actions */
  showActions?: boolean;
  /** Collapsed state */
  collapsed?: boolean;
  /** On collapse toggle */
  onCollapseToggle?: (collapsed: boolean) => void;
  /** Item label for collapsed state */
  label?: string;
  /** Drag handle props */
  dragHandleProps?: Record<string, unknown>;
}

/**
 * Wrapper component for repeatable field items
 */
export function RepeatableItemWrapper<T = Record<string, unknown>>({
  item,
  index,
  helpers,
  canEdit = true,
  canRemove = true,
  sortable = true,
  children,
  className = "",
  style,
  showActions = true,
  collapsed: controlledCollapsed,
  onCollapseToggle,
  label,
  dragHandleProps,
}: RepeatableItemWrapperProps<T>) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed ?? internalCollapsed;

  const handleCollapseToggle = useCallback(() => {
    const newState = !collapsed;
    setInternalCollapsed(newState);
    onCollapseToggle?.(newState);
  }, [collapsed, onCollapseToggle]);

  const containerStyles: CSSProperties = {
    position: "relative",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    backgroundColor: "#ffffff",
    transition: "all 0.2s ease",
    ...style,
  };

  const headerStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 16px",
    borderBottom: collapsed ? "none" : "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
    borderRadius: collapsed ? "8px" : "8px 8px 0 0",
    cursor: "pointer",
  };

  const contentStyles: CSSProperties = {
    padding: collapsed ? "0" : "16px",
    overflow: "hidden",
    maxHeight: collapsed ? "0" : "2000px",
    opacity: collapsed ? 0 : 1,
    transition: "all 0.2s ease",
  };

  const actionsStyles: CSSProperties = {
    display: "flex",
    gap: "4px",
    marginLeft: "auto",
  };

  const buttonStyles: CSSProperties = {
    padding: "4px 8px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: "12px",
    color: "#6b7280",
    transition: "background-color 0.15s ease",
  };

  return (
    <div className={className} style={containerStyles} data-item-id={item.id}>
      {/* Header */}
      <div style={headerStyles} onClick={handleCollapseToggle}>
        {/* Drag handle */}
        {sortable && canEdit && (
          <DragHandle
            disabled={!canEdit}
            dragHandleProps={dragHandleProps}
          />
        )}

        {/* Index / Label */}
        <span style={{ fontWeight: 500, fontSize: "14px", color: "#374151" }}>
          {label || `Item ${index + 1}`}
        </span>

        {/* Collapse indicator */}
        <span
          style={{
            marginLeft: "8px",
            transition: "transform 0.2s ease",
            transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          }}
        >
          &#9660;
        </span>

        {/* Actions */}
        {showActions && canEdit && (
          <div style={actionsStyles} onClick={(e) => e.stopPropagation()}>
            {!helpers.isFirst && (
              <button
                style={buttonStyles}
                onClick={helpers.moveUp}
                title="Move up"
              >
                &#9650;
              </button>
            )}
            {!helpers.isLast && (
              <button
                style={buttonStyles}
                onClick={helpers.moveDown}
                title="Move down"
              >
                &#9660;
              </button>
            )}
            <button
              style={buttonStyles}
              onClick={helpers.duplicate}
              title="Duplicate"
            >
              Copy
            </button>
            {canRemove && (
              <button
                style={{ ...buttonStyles, color: "#ef4444" }}
                onClick={helpers.remove}
                title="Remove"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div style={contentStyles}>{children}</div>
    </div>
  );
}
