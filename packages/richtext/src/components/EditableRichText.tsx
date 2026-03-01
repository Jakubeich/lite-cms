"use client";

import React, { CSSProperties, useCallback, useState, useEffect } from "react";
import { debounce } from "@litecms/core";
import { RichTextEditor, RichTextEditorProps } from "./RichTextEditor";
import type { OutputFormat } from "../hooks/useRichText";

/**
 * EditableRichText props
 */
export interface EditableRichTextProps extends Omit<RichTextEditorProps, "onChange" | "value" | "editable"> {
  /** Field key for CMS */
  field: string;
  /** Default content */
  defaultValue?: string;
  /** Current value from CMS */
  value?: string;
  /** Whether editing is enabled (from CMS context) */
  canEdit?: boolean;
  /** Callback when content changes (for CMS update) */
  onSave?: (field: string, value: string) => void;
  /** Save delay (debounce) */
  saveDelay?: number;
  /** Show as read-only HTML when not editing */
  renderHtml?: boolean;
}

/**
 * CMS-integrated rich text editor component
 */
export function EditableRichText({
  field,
  defaultValue = "",
  value,
  canEdit = false,
  onSave,
  saveDelay = 500,
  renderHtml = true,
  placeholder,
  toolbar,
  outputFormat = "html",
  className = "",
  style,
  editorClassName,
  editorStyle,
  minHeight,
  maxHeight,
}: EditableRichTextProps) {
  const [localValue, setLocalValue] = useState(value || defaultValue);

  // Sync with external value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  // Create debounced save handler
  const debouncedSave = useCallback(
    debounce((content: string) => {
      onSave?.(field, content);
    }, saveDelay),
    [field, onSave, saveDelay]
  );

  // Handle content change
  const handleChange = useCallback(
    (content: string) => {
      setLocalValue(content);
      debouncedSave(content);
    },
    [debouncedSave]
  );

  // Read-only view
  if (!canEdit && renderHtml) {
    const readOnlyStyles: CSSProperties = {
      ...style,
    };

    // Render HTML content directly
    if (outputFormat === "html") {
      return (
        <div
          className={`litecms-richtext-content ${className}`}
          style={readOnlyStyles}
          data-field={field}
          dangerouslySetInnerHTML={{ __html: localValue }}
        />
      );
    }

    // For other formats, show as text
    return (
      <div
        className={`litecms-richtext-content ${className}`}
        style={readOnlyStyles}
        data-field={field}
      >
        {localValue}
      </div>
    );
  }

  // Editor view
  return (
    <RichTextEditor
      field={field}
      value={localValue}
      defaultValue={defaultValue}
      placeholder={placeholder}
      toolbar={toolbar}
      outputFormat={outputFormat}
      onChange={handleChange}
      editable={canEdit}
      className={className}
      style={style}
      editorClassName={editorClassName}
      editorStyle={editorStyle}
      minHeight={minHeight}
      maxHeight={maxHeight}
    />
  );
}
