"use client";

import React, { CSSProperties, useCallback, useEffect, useRef, useState } from "react";
import { debounce } from "@litecms/core";
import { useI18nContext } from "../context/I18nContext";

/**
 * LocalizedEditable props
 */
export interface LocalizedEditableProps {
  /** Field key (without locale suffix) */
  field: string;
  /** Default value */
  defaultValue?: string;
  /** HTML tag to render */
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Placeholder text */
  placeholder?: string;
  /** Whether editing is enabled */
  canEdit?: boolean;
  /** Get content value */
  getContent: (field: string) => string | null;
  /** Update content value */
  updateContent: (field: string, value: string) => Promise<void>;
  /** Save delay */
  saveDelay?: number;
  /** Show locale indicator */
  showLocaleIndicator?: boolean;
  /** Show missing translation warning */
  showMissingWarning?: boolean;
}

/**
 * Localized inline editable component
 */
export function LocalizedEditable({
  field,
  defaultValue = "",
  as: Tag = "span",
  className = "",
  style,
  placeholder = "Click to edit...",
  canEdit = false,
  getContent,
  updateContent,
  saveDelay = 500,
  showLocaleIndicator = false,
  showMissingWarning = true,
}: LocalizedEditableProps) {
  const { locale, fallbackLocale, getLocalizedField } = useI18nContext();
  const elementRef = useRef<HTMLElement>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Get localized field key
  const localizedField = getLocalizedField(field);

  // Get current value
  const currentValue = getContent(localizedField);

  // Check for fallback
  const fallbackValue = fallbackLocale !== locale
    ? getContent(getLocalizedField(field, fallbackLocale))
    : null;

  const displayValue = currentValue ?? fallbackValue ?? defaultValue;
  const isFallback = currentValue === null && fallbackValue !== null;
  const isMissing = currentValue === null && fallbackValue === null && !defaultValue;

  // Create debounced save
  const debouncedSave = useCallback(
    debounce(async (value: string) => {
      await updateContent(localizedField, value);
    }, saveDelay),
    [localizedField, updateContent, saveDelay]
  );

  // Handle input
  const handleInput = useCallback(() => {
    const element = elementRef.current;
    if (element) {
      debouncedSave(element.textContent || "");
    }
  }, [debouncedSave]);

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const element = elementRef.current;
    if (element) {
      updateContent(localizedField, element.textContent || "");
    }
  }, [localizedField, updateContent]);

  // Sync content when value changes externally
  useEffect(() => {
    const element = elementRef.current;
    if (element && !isEditing && element.textContent !== displayValue) {
      element.textContent = displayValue;
    }
  }, [displayValue, isEditing]);

  const baseStyles: CSSProperties = {
    ...style,
  };

  const editableStyles: CSSProperties = canEdit
    ? {
        cursor: "text",
        outline: isEditing ? "2px solid #3b82f6" : "2px dashed transparent",
        outlineOffset: "2px",
        borderRadius: "2px",
        transition: "outline 0.15s ease",
        minWidth: "20px",
        display: "inline-block",
        position: "relative",
        ...baseStyles,
      }
    : baseStyles;

  // Warning/indicator styles
  const indicatorStyles: CSSProperties = {
    position: "absolute",
    top: "-8px",
    right: "-8px",
    fontSize: "10px",
    padding: "1px 4px",
    borderRadius: "4px",
    backgroundColor: isFallback ? "#fef3c7" : isMissing ? "#fee2e2" : "#e0f2fe",
    color: isFallback ? "#92400e" : isMissing ? "#dc2626" : "#0369a1",
    fontWeight: 500,
  };

  // Non-editable view
  if (!canEdit) {
    return (
      <Tag
        className={className}
        style={baseStyles}
        data-field={field}
        data-locale={locale}
      >
        {displayValue || placeholder}
      </Tag>
    );
  }

  return (
    <Tag
      // @ts-expect-error - ref type varies based on Tag
      ref={elementRef}
      className={className}
      style={editableStyles}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      data-field={field}
      data-locale={locale}
      data-placeholder={placeholder}
    >
      {displayValue || placeholder}

      {/* Locale/status indicator */}
      {canEdit && (showLocaleIndicator || (showMissingWarning && (isFallback || isMissing))) && (
        <span style={indicatorStyles}>
          {isMissing ? "Missing" : isFallback ? `${fallbackLocale}` : locale.toUpperCase()}
        </span>
      )}
    </Tag>
  );
}
