// Components
export { RichTextEditor } from "./components/RichTextEditor";
export type { RichTextEditorProps, ToolbarConfig } from "./components/RichTextEditor";

export { EditableRichText } from "./components/EditableRichText";
export type { EditableRichTextProps } from "./components/EditableRichText";

export { Toolbar, DEFAULT_TOOLBAR_ITEMS } from "./components/Toolbar";
export type { ToolbarProps, ToolbarItem } from "./components/Toolbar";

// Hooks
export { useRichText } from "./hooks/useRichText";
export type { UseRichTextOptions, UseRichTextReturn, OutputFormat } from "./hooks/useRichText";

// Re-export Tiptap utilities for advanced usage
export { useEditor, EditorContent, BubbleMenu, FloatingMenu } from "@tiptap/react";
export type { Editor } from "@tiptap/react";
