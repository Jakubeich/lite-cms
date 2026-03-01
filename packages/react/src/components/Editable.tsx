"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useCMSContext } from "../context/CMSContext";
import {
  parseSimpleFormatting,
  hasFormatting,
  type FormattingTag,
  type FormattedSegment,
} from "@litecms/core";

/**
 * Editable outline style options
 */
export type EditableOutlineStyle = "solid" | "dashed" | "dotted" | "none";

/**
 * Editable component props
 */
export interface EditableProps {
  /**
   * Unique field identifier (e.g., "hero.title", "footer.copyright")
   */
  field: string;

  /**
   * Default value shown when no content exists
   */
  defaultValue?: string;

  /**
   * HTML tag to render (default: "span")
   */
  as?: "span" | "div" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

  /**
   * Custom className
   */
  className?: string;

  /**
   * Custom styles
   */
  style?: CSSProperties;

  /**
   * Children (used as fallback if no content)
   */
  children?: ReactNode;

  /**
   * Placeholder text shown when empty
   */
  placeholder?: string;

  /**
   * Enable multiline editing (uses div with white-space: pre-wrap)
   */
  multiline?: boolean;

  /**
   * Debounce delay for saving (ms) - NOT USED, kept for API compatibility
   * @deprecated Content is saved on blur to prevent cursor jumping
   */
  saveDelay?: number;

  /**
   * Callback when content changes
   */
  onChange?: (value: string) => void;

  /**
   * Locale suffix for i18n (e.g., "en" for English)
   * If provided, field key becomes "{field}_{locale}"
   */
  locale?: string;

  /**
   * Enable simple text formatting (**bold**, <b>, <strong>)
   * @default true
   */
  enableFormatting?: boolean;

  /**
   * Custom formatting tags (extends default)
   */
  formattingTags?: FormattingTag[];

  /**
   * Outline style when in edit mode
   * @default "dashed"
   */
  outlineStyle?: EditableOutlineStyle;

  /**
   * Outline color when editable (not focused)
   * @default "#8b5cf6" (purple)
   */
  outlineColor?: string;

  /**
   * Outline color when focused/editing
   * @default "#3b82f6" (blue)
   */
  focusColor?: string;

  /**
   * Show loading state
   */
  isLoading?: boolean;
}

/**
 * Render formatted segments as React elements
 */
function renderFormattedContent(
  segments: FormattedSegment[],
  boldClassName?: string
): ReactNode {
  return segments.map((segment, index) => {
    if (segment.type === "text") {
      return segment.content;
    }

    if (segment.type === "strong") {
      return (
        <strong
          key={index}
          className={boldClassName || segment.className}
        >
          {segment.content}
        </strong>
      );
    }

    if (segment.type === "em") {
      return (
        <em key={index} className={segment.className}>
          {segment.content}
        </em>
      );
    }

    if (segment.type === "code") {
      return (
        <code key={index} className={segment.className}>
          {segment.content}
        </code>
      );
    }

    // Fallback for custom tags
    return (
      <span key={index} className={segment.className}>
        {segment.content}
      </span>
    );
  });
}

/**
 * Inline editable text component
 * Supports localization, formatting, and customizable edit indicators
 *
 * IMPORTANT: This component uses an uncontrolled pattern for contentEditable
 * to prevent cursor jumping issues. Content is set via ref, not React children.
 */
export function Editable({
  field,
  defaultValue = "",
  as = "span",
  className = "",
  style,
  children,
  placeholder = "Click to edit...",
  multiline = false,
  onChange,
  locale,
  enableFormatting = true,
  formattingTags,
  outlineStyle = "dashed",
  outlineColor = "#8b5cf6",
  focusColor = "#3b82f6",
  isLoading: externalLoading,
}: EditableProps) {
  const { state, auth, getContent, updateContent } = useCMSContext();
  const ref = useRef<HTMLSpanElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  // Track if we've initialized this specific element instance
  const mountedRef = useRef(false);

  // Build full field key with locale
  const fullField = locale ? `${field}_${locale}` : field;

  const storedValue = getContent(fullField);
  const displayValue =
    storedValue ?? (typeof children === "string" ? children : defaultValue);

  const isAdmin = auth.isAdmin;
  const canEdit = isAdmin && state.isEditMode;
  const isLoading = externalLoading ?? state.isLoading;

  // Handle focus - mark as editing
  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  // Handle blur - save content and stop editing
  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (ref.current) {
      const newValue = ref.current.innerText;
      if (newValue !== displayValue) {
        onChange?.(newValue);
        updateContent(fullField, newValue);
      }
    }
  }, [fullField, displayValue, updateContent, onChange]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      // Save on Enter (for single line) or Escape
      if (e.key === "Escape") {
        ref.current?.blur();
      }
      if (e.key === "Enter" && !multiline) {
        e.preventDefault();
        ref.current?.blur();
      }
    },
    [multiline]
  );

  // Reset mounted state when canEdit changes
  useEffect(() => {
    mountedRef.current = false;
  }, [canEdit]);

  // Initialize content when element mounts or displayValue changes
  // This runs when: entering edit mode, displayValue updates, or after blur
  useEffect(() => {
    if (ref.current && canEdit && !isEditing) {
      const currentContent = ref.current.innerText || "";
      const valueToSet = displayValue || placeholder;
      // Always set content on first mount, or when value differs
      if (!mountedRef.current || currentContent !== valueToSet) {
        ref.current.innerText = valueToSet;
        mountedRef.current = true;
      }
    }
  }, [displayValue, isEditing, canEdit, placeholder]);

  // Parse formatted content for display mode
  const formattedContent = useMemo(() => {
    if (!enableFormatting || !displayValue || typeof displayValue !== "string") {
      return null;
    }
    if (!hasFormatting(displayValue, formattingTags)) {
      return null;
    }
    return parseSimpleFormatting(displayValue, formattingTags);
  }, [displayValue, enableFormatting, formattingTags]);

  // Base styles for editable elements
  const baseStyle: CSSProperties = style || {};

  // Build outline style string
  const getOutlineStyle = (): string => {
    if (outlineStyle === "none") return "none";
    if (isEditing) return `2px solid ${focusColor}`;
    return `2px ${outlineStyle} ${outlineColor}`;
  };

  const editableStyles: CSSProperties = canEdit
    ? {
        cursor: "text",
        outline: getOutlineStyle(),
        outlineOffset: "2px",
        borderRadius: "4px",
        transition: "outline 0.15s ease",
        minWidth: "20px",
        display: "inline-block",
        position: "relative",
        ...(multiline && { whiteSpace: "pre-wrap" as const }),
        ...(isLoading && { opacity: 0.7 }),
        ...baseStyle,
      }
    : baseStyle;

  const content = displayValue || children || defaultValue;

  // If not admin or not in edit mode, render with formatting
  if (!canEdit) {
    const Tag = as;
    return (
      <Tag className={className} style={baseStyle}>
        {formattedContent
          ? renderFormattedContent(formattedContent)
          : content}
      </Tag>
    );
  }

  // For editable mode - use uncontrolled pattern
  // IMPORTANT: Don't pass children to prevent cursor jumping
  // Content is set via ref in useEffect
  return (
    <span
      ref={ref}
      className={`litecms-editable ${className} ${isLoading ? "litecms-loading" : ""}`}
      style={editableStyles}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      data-field={fullField}
      data-locale={locale}
      data-placeholder={placeholder}
      data-editable="true"
    />
  );
}
