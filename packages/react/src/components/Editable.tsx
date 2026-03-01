"use client";

import {
  useRef,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useCMSContext } from "../context/CMSContext";

interface EditableProps {
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
   * Debounce delay for saving (ms)
   */
  saveDelay?: number;

  /**
   * Callback when content changes
   */
  onChange?: (value: string) => void;
}

// Simple debounce for this component
function useDebounce<T extends (...args: string[]) => void>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const debouncedFn = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;

  return debouncedFn;
}

export function Editable({
  field,
  defaultValue = "",
  as = "span",
  className = "",
  style,
  children,
  placeholder = "Click to edit...",
  multiline = false,
  saveDelay = 500,
  onChange,
}: EditableProps) {
  const { state, auth, getContent, updateContent } = useCMSContext();
  const ref = useRef<HTMLSpanElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState<string>("");

  const storedValue = getContent(field);
  const displayValue =
    storedValue ?? (typeof children === "string" ? children : defaultValue);

  // Sync local value with stored value
  useEffect(() => {
    setLocalValue(displayValue);
  }, [displayValue]);

  // Debounced save function
  const saveContent = useCallback(
    (value: string) => {
      updateContent(field, value);
    },
    [field, updateContent]
  );

  const debouncedSave = useDebounce(saveContent, saveDelay);

  const handleInput = useCallback(() => {
    if (!ref.current) return;
    const newValue = ref.current.innerText;
    setLocalValue(newValue);
    onChange?.(newValue);
    debouncedSave(newValue);
  }, [onChange, debouncedSave]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (ref.current) {
      const newValue = ref.current.innerText;
      if (newValue !== displayValue) {
        updateContent(field, newValue);
      }
    }
  }, [field, displayValue, updateContent]);

  const handleFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

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

  const isAdmin = auth.isAdmin;
  const canEdit = isAdmin && state.isEditMode;

  // Base styles for editable elements
  const baseStyle: CSSProperties = style || {};

  const editableStyles: CSSProperties = canEdit
    ? {
        cursor: "text",
        outline: isEditing ? "2px solid #3b82f6" : "2px dashed transparent",
        outlineOffset: "2px",
        borderRadius: "2px",
        transition: "outline 0.15s ease",
        minWidth: "20px",
        display: "inline-block",
        ...(multiline && { whiteSpace: "pre-wrap" as const }),
        ...baseStyle,
      }
    : baseStyle;

  const content = localValue || children || defaultValue;

  // If not admin or not in edit mode, just render the content
  if (!canEdit) {
    const Tag = as;
    return (
      <Tag className={className} style={baseStyle}>
        {content}
      </Tag>
    );
  }

  // For editable mode, use span to avoid TypeScript complexity
  return (
    <span
      ref={ref}
      className={`litecms-editable ${className}`}
      style={editableStyles}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onKeyDown={handleKeyDown}
      data-field={field}
      data-placeholder={placeholder}
    >
      {localValue || placeholder}
    </span>
  );
}
