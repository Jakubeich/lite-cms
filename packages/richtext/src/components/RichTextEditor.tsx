"use client";

import React, { CSSProperties, useCallback, useEffect } from "react";
import { EditorContent } from "@tiptap/react";
import { useRichText, OutputFormat } from "../hooks/useRichText";
import { Toolbar, ToolbarItem, DEFAULT_TOOLBAR_ITEMS } from "./Toolbar";

/**
 * Toolbar configuration
 */
export interface ToolbarConfig {
  /** Items to show */
  items?: ToolbarItem[];
  /** Position */
  position?: "top" | "bottom" | "floating";
  /** Show toolbar */
  show?: boolean;
}

/**
 * RichTextEditor props
 */
export interface RichTextEditorProps {
  /** Field key for CMS */
  field?: string;
  /** Initial content */
  defaultValue?: string;
  /** Controlled value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Toolbar configuration */
  toolbar?: ToolbarConfig;
  /** Output format */
  outputFormat?: OutputFormat;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Whether editing is enabled */
  editable?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Custom class name */
  className?: string;
  /** Custom styles for container */
  style?: CSSProperties;
  /** Custom styles for editor */
  editorClassName?: string;
  /** Custom styles for editor */
  editorStyle?: CSSProperties;
  /** Min height */
  minHeight?: string | number;
  /** Max height */
  maxHeight?: string | number;
}

/**
 * Rich text editor component
 */
export function RichTextEditor({
  field,
  defaultValue = "",
  value,
  placeholder = "Start writing...",
  toolbar = {},
  outputFormat = "html",
  onChange,
  editable = true,
  autoFocus = false,
  className = "",
  style,
  editorClassName = "",
  editorStyle,
  minHeight = "150px",
  maxHeight,
}: RichTextEditorProps) {
  const {
    items: toolbarItems = DEFAULT_TOOLBAR_ITEMS,
    position: toolbarPosition = "top",
    show: showToolbar = true,
  } = toolbar;

  const { editor, setContent } = useRichText({
    content: value || defaultValue,
    placeholder,
    outputFormat,
    onChange,
    editable,
    autoFocus,
  });

  // Sync with external value changes
  useEffect(() => {
    if (value !== undefined && editor && !editor.isFocused) {
      const currentContent = editor.getHTML();
      if (currentContent !== value) {
        setContent(value);
      }
    }
  }, [value, editor, setContent]);

  const containerStyles: CSSProperties = {
    display: "flex",
    flexDirection: toolbarPosition === "bottom" ? "column-reverse" : "column",
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    overflow: "hidden",
    backgroundColor: "#ffffff",
    ...style,
  };

  const editorContainerStyles: CSSProperties = {
    minHeight,
    maxHeight,
    overflow: maxHeight ? "auto" : undefined,
    padding: "12px 16px",
    ...editorStyle,
  };

  // Editor CSS classes for styling prose content
  const editorCSSRules = `
    .litecms-richtext-editor .ProseMirror {
      outline: none;
      min-height: 100%;
    }
    .litecms-richtext-editor .ProseMirror p {
      margin: 0 0 0.75em 0;
    }
    .litecms-richtext-editor .ProseMirror p:last-child {
      margin-bottom: 0;
    }
    .litecms-richtext-editor .ProseMirror h1 {
      font-size: 2em;
      font-weight: 700;
      margin: 0 0 0.5em 0;
    }
    .litecms-richtext-editor .ProseMirror h2 {
      font-size: 1.5em;
      font-weight: 600;
      margin: 0 0 0.5em 0;
    }
    .litecms-richtext-editor .ProseMirror h3 {
      font-size: 1.25em;
      font-weight: 600;
      margin: 0 0 0.5em 0;
    }
    .litecms-richtext-editor .ProseMirror ul,
    .litecms-richtext-editor .ProseMirror ol {
      padding-left: 1.5em;
      margin: 0 0 0.75em 0;
    }
    .litecms-richtext-editor .ProseMirror li {
      margin-bottom: 0.25em;
    }
    .litecms-richtext-editor .ProseMirror blockquote {
      border-left: 3px solid #e5e7eb;
      padding-left: 1em;
      margin: 0 0 0.75em 0;
      color: #6b7280;
    }
    .litecms-richtext-editor .ProseMirror pre {
      background-color: #1f2937;
      color: #e5e7eb;
      padding: 0.75em 1em;
      border-radius: 4px;
      margin: 0 0 0.75em 0;
      overflow-x: auto;
    }
    .litecms-richtext-editor .ProseMirror code {
      background-color: #f3f4f6;
      padding: 0.125em 0.25em;
      border-radius: 2px;
      font-size: 0.9em;
    }
    .litecms-richtext-editor .ProseMirror pre code {
      background: none;
      padding: 0;
    }
    .litecms-richtext-editor .ProseMirror a {
      color: #3b82f6;
      text-decoration: underline;
    }
    .litecms-richtext-editor .ProseMirror hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 1em 0;
    }
    .litecms-richtext-editor .ProseMirror p.is-editor-empty:first-child::before {
      content: attr(data-placeholder);
      color: #9ca3af;
      pointer-events: none;
      float: left;
      height: 0;
    }
  `;

  return (
    <div
      className={`litecms-richtext-editor ${className}`}
      style={containerStyles}
      data-field={field}
    >
      <style>{editorCSSRules}</style>

      {showToolbar && editable && toolbarPosition === "top" && (
        <Toolbar editor={editor} items={toolbarItems} />
      )}

      <div className={editorClassName} style={editorContainerStyles}>
        <EditorContent editor={editor} />
      </div>

      {showToolbar && editable && toolbarPosition === "bottom" && (
        <Toolbar editor={editor} items={toolbarItems} />
      )}
    </div>
  );
}
