"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useEditor, Editor, Extensions } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { debounce } from "@litecms/core";

/**
 * Rich text output format
 */
export type OutputFormat = "html" | "json" | "text";

/**
 * useRichText options
 */
export interface UseRichTextOptions {
  /** Initial content (HTML string) */
  content?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Output format */
  outputFormat?: OutputFormat;
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Debounce delay for onChange */
  debounceDelay?: number;
  /** Whether editor is editable */
  editable?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Additional Tiptap extensions */
  extensions?: Extensions;
}

/**
 * useRichText return type
 */
export interface UseRichTextReturn {
  /** Tiptap editor instance */
  editor: Editor | null;
  /** Current content in specified format */
  content: string;
  /** Whether editor is focused */
  isFocused: boolean;
  /** Whether content is empty */
  isEmpty: boolean;
  /** Set content */
  setContent: (content: string) => void;
  /** Clear content */
  clearContent: () => void;
  /** Focus editor */
  focus: () => void;
  /** Blur editor */
  blur: () => void;
  /** Get HTML content */
  getHTML: () => string;
  /** Get JSON content */
  getJSON: () => object;
  /** Get plain text */
  getText: () => string;
}

/**
 * Hook for managing rich text editor
 */
export function useRichText(options: UseRichTextOptions = {}): UseRichTextReturn {
  const {
    content: initialContent = "",
    placeholder = "Start writing...",
    outputFormat = "html",
    onChange,
    debounceDelay = 500,
    editable = true,
    autoFocus = false,
    extensions: additionalExtensions = [],
  } = options;

  // Create debounced onChange handler
  const handleContentChange = useCallback(
    (editor: Editor) => {
      if (!onChange) return;
      let output: string;
      switch (outputFormat) {
        case "json":
          output = JSON.stringify(editor.getJSON());
          break;
        case "text":
          output = editor.getText();
          break;
        case "html":
        default:
          output = editor.getHTML();
      }
      onChange(output);
    },
    [onChange, outputFormat]
  );

  const debouncedOnChange = useMemo(
    () => (onChange ? debounce(handleContentChange as (...args: unknown[]) => unknown, debounceDelay) : undefined),
    [handleContentChange, debounceDelay, onChange]
  );

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "litecms-link",
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder,
      }),
      ...additionalExtensions,
    ],
    content: initialContent,
    editable,
    autofocus: autoFocus,
    onUpdate: ({ editor }) => {
      debouncedOnChange?.(editor);
    },
  });

  // Get content in specified format
  const getContent = useCallback((): string => {
    if (!editor) return "";
    switch (outputFormat) {
      case "json":
        return JSON.stringify(editor.getJSON());
      case "text":
        return editor.getText();
      case "html":
      default:
        return editor.getHTML();
    }
  }, [editor, outputFormat]);

  // Set content
  const setContent = useCallback(
    (newContent: string) => {
      if (!editor) return;

      if (outputFormat === "json") {
        try {
          editor.commands.setContent(JSON.parse(newContent));
        } catch {
          editor.commands.setContent(newContent);
        }
      } else {
        editor.commands.setContent(newContent);
      }
    },
    [editor, outputFormat]
  );

  // Clear content
  const clearContent = useCallback(() => {
    editor?.commands.clearContent();
  }, [editor]);

  // Focus editor
  const focus = useCallback(() => {
    editor?.commands.focus();
  }, [editor]);

  // Blur editor
  const blur = useCallback(() => {
    editor?.commands.blur();
  }, [editor]);

  // Get HTML
  const getHTML = useCallback(() => {
    return editor?.getHTML() || "";
  }, [editor]);

  // Get JSON
  const getJSON = useCallback(() => {
    return editor?.getJSON() || {};
  }, [editor]);

  // Get text
  const getText = useCallback(() => {
    return editor?.getText() || "";
  }, [editor]);

  // Update editable state when prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  return {
    editor,
    content: getContent(),
    isFocused: editor?.isFocused || false,
    isEmpty: editor?.isEmpty || true,
    setContent,
    clearContent,
    focus,
    blur,
    getHTML,
    getJSON,
    getText,
  };
}
