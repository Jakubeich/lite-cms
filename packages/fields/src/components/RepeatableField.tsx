"use client";

import React, { CSSProperties, useCallback, useMemo } from "react";
import type {
  RepeatableItem as RepeatableItemType,
  RepeatableFieldConfig,
  RepeatableItemHelpers,
} from "@litecms/core";
import { useRepeatable } from "../hooks/useRepeatable";
import { RepeatableItemWrapper } from "./RepeatableItem";

/**
 * RepeatableField props
 */
export interface RepeatableFieldProps<T> {
  /** Field key */
  field: string;
  /** Field configuration */
  config: RepeatableFieldConfig<T>;
  /** Render function for each item */
  renderItem: (
    item: RepeatableItemType<T>,
    index: number,
    helpers: RepeatableItemHelpers<T>
  ) => React.ReactNode;
  /** Initial value as JSON string */
  value?: string;
  /** Callback when value changes */
  onChange?: (value: string) => void;
  /** Whether editing is enabled */
  canEdit?: boolean;
  /** Empty state component */
  emptyState?: React.ReactNode;
  /** Add button label */
  addButtonLabel?: string;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Use item wrapper */
  useWrapper?: boolean;
  /** Get item label for wrapper */
  getItemLabel?: (item: RepeatableItemType<T>, index: number) => string;
  /** Show add button */
  showAddButton?: boolean;
  /** Header component */
  header?: React.ReactNode;
  /** Footer component */
  footer?: React.ReactNode;
}

/**
 * Repeatable field component for managing arrays of items
 */
export function RepeatableField<T = Record<string, unknown>>({
  field,
  config,
  renderItem,
  value,
  onChange,
  canEdit = true,
  emptyState,
  addButtonLabel = "Add Item",
  className = "",
  style,
  useWrapper = true,
  getItemLabel,
  showAddButton = true,
  header,
  footer,
}: RepeatableFieldProps<T>) {
  const {
    items,
    addItem,
    getHelpers,
    canAdd,
    canRemove,
  } = useRepeatable({
    config,
    initialValue: value,
    onChange: useCallback(
      (_items: RepeatableItemType<T>[], newValue: string) => {
        onChange?.(newValue);
      },
      [onChange]
    ),
  });

  const { sortable = true, minItems = 0, maxItems = Infinity } = config;

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    ...style,
  };

  const addButtonStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    border: "2px dashed #d1d5db",
    borderRadius: "8px",
    backgroundColor: "transparent",
    cursor: canAdd && canEdit ? "pointer" : "not-allowed",
    color: canAdd && canEdit ? "#6b7280" : "#d1d5db",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.15s ease",
    opacity: canAdd && canEdit ? 1 : 0.5,
  };

  const infoStyles: CSSProperties = {
    fontSize: "12px",
    color: "#9ca3af",
    textAlign: "right",
  };

  // Default empty state
  const defaultEmptyState = useMemo(
    () => (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          color: "#6b7280",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
          border: "1px dashed #d1d5db",
        }}
      >
        <p style={{ margin: 0, marginBottom: "8px" }}>No items yet</p>
        {canEdit && canAdd && (
          <p style={{ margin: 0, fontSize: "14px" }}>
            Click &quot;{addButtonLabel}&quot; to add one
          </p>
        )}
      </div>
    ),
    [addButtonLabel, canEdit, canAdd]
  );

  return (
    <div className={className} style={containerStyles} data-field={field}>
      {/* Header */}
      {header && <div>{header}</div>}

      {/* Info bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={infoStyles}>
          {items.length} item{items.length !== 1 ? "s" : ""}
          {maxItems < Infinity && ` (max ${maxItems})`}
        </span>
        {minItems > 0 && (
          <span style={infoStyles}>
            Minimum: {minItems}
          </span>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        emptyState || defaultEmptyState
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {items.map((item, index) => {
            const helpers = getHelpers(item.id);

            if (useWrapper) {
              return (
                <RepeatableItemWrapper
                  key={item.id}
                  item={item}
                  index={index}
                  helpers={helpers}
                  canEdit={canEdit}
                  canRemove={canRemove}
                  sortable={sortable}
                  label={getItemLabel?.(item, index)}
                >
                  {renderItem(item, index, helpers)}
                </RepeatableItemWrapper>
              );
            }

            return (
              <div key={item.id} data-item-id={item.id}>
                {renderItem(item, index, helpers)}
              </div>
            );
          })}
        </div>
      )}

      {/* Add button */}
      {showAddButton && canEdit && (
        <button
          style={addButtonStyles}
          onClick={() => addItem()}
          disabled={!canAdd}
          type="button"
        >
          <span style={{ fontSize: "18px" }}>+</span>
          {addButtonLabel}
        </button>
      )}

      {/* Footer */}
      {footer && <div>{footer}</div>}
    </div>
  );
}
