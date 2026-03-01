"use client";

import React, { CSSProperties, useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";

/**
 * Toolbar item types
 */
export type ToolbarItem =
  | "bold"
  | "italic"
  | "underline"
  | "strike"
  | "heading1"
  | "heading2"
  | "heading3"
  | "bulletList"
  | "orderedList"
  | "blockquote"
  | "codeBlock"
  | "link"
  | "horizontalRule"
  | "undo"
  | "redo"
  | "divider";

/**
 * Toolbar props
 */
export interface ToolbarProps {
  /** Tiptap editor instance */
  editor: Editor | null;
  /** Items to show in toolbar */
  items?: ToolbarItem[];
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
}

/**
 * Default toolbar items
 */
export const DEFAULT_TOOLBAR_ITEMS: ToolbarItem[] = [
  "bold",
  "italic",
  "underline",
  "strike",
  "divider",
  "heading1",
  "heading2",
  "heading3",
  "divider",
  "bulletList",
  "orderedList",
  "divider",
  "blockquote",
  "codeBlock",
  "link",
  "divider",
  "undo",
  "redo",
];

/**
 * Toolbar button component
 */
interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolbarButton({
  icon,
  label,
  isActive = false,
  disabled = false,
  onClick,
}: ToolbarButtonProps) {
  const buttonStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: isActive ? "#e5e7eb" : "transparent",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    color: isActive ? "#1f2937" : "#6b7280",
    transition: "all 0.15s ease",
  };

  return (
    <button
      type="button"
      style={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {icon}
    </button>
  );
}

/**
 * Link input modal
 */
interface LinkInputProps {
  onSubmit: (url: string) => void;
  onCancel: () => void;
  initialUrl?: string;
}

function LinkInput({ onSubmit, onCancel, initialUrl = "" }: LinkInputProps) {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  const modalStyles: CSSProperties = {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "4px",
    padding: "8px",
    backgroundColor: "white",
    border: "1px solid #e5e7eb",
    borderRadius: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  };

  return (
    <form style={modalStyles} onSubmit={handleSubmit}>
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://example.com"
        autoFocus
        style={{
          padding: "6px 8px",
          border: "1px solid #d1d5db",
          borderRadius: "4px",
          fontSize: "14px",
          width: "200px",
        }}
      />
      <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
        <button
          type="submit"
          style={{
            flex: 1,
            padding: "4px 8px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            flex: 1,
            padding: "4px 8px",
            backgroundColor: "#f3f4f6",
            color: "#374151",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/**
 * Rich text editor toolbar component
 */
export function Toolbar({
  editor,
  items = DEFAULT_TOOLBAR_ITEMS,
  className = "",
  style,
}: ToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);

  const handleLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes("link").href || "";
    if (previousUrl) {
      // Remove link if already exists
      editor.chain().focus().unsetLink().run();
    } else {
      setShowLinkInput(true);
    }
  }, [editor]);

  const handleLinkSubmit = useCallback(
    (url: string) => {
      if (!editor) return;
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
      setShowLinkInput(false);
    },
    [editor]
  );

  if (!editor) return null;

  const containerStyles: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "4px",
    backgroundColor: "#f9fafb",
    borderBottom: "1px solid #e5e7eb",
    flexWrap: "wrap",
    position: "relative",
    ...style,
  };

  const dividerStyles: CSSProperties = {
    width: "1px",
    height: "24px",
    backgroundColor: "#e5e7eb",
    margin: "0 4px",
  };

  const renderItem = (item: ToolbarItem, index: number) => {
    if (item === "divider") {
      return <div key={`divider-${index}`} style={dividerStyles} />;
    }

    const itemConfig: Record<
      Exclude<ToolbarItem, "divider">,
      {
        icon: string;
        label: string;
        isActive: boolean;
        action: () => void;
        disabled?: boolean;
      }
    > = {
      bold: {
        icon: "B",
        label: "Bold",
        isActive: editor.isActive("bold"),
        action: () => editor.chain().focus().toggleBold().run(),
      },
      italic: {
        icon: "I",
        label: "Italic",
        isActive: editor.isActive("italic"),
        action: () => editor.chain().focus().toggleItalic().run(),
      },
      underline: {
        icon: "U",
        label: "Underline",
        isActive: editor.isActive("underline"),
        action: () => editor.chain().focus().toggleUnderline().run(),
      },
      strike: {
        icon: "S",
        label: "Strikethrough",
        isActive: editor.isActive("strike"),
        action: () => editor.chain().focus().toggleStrike().run(),
      },
      heading1: {
        icon: "H1",
        label: "Heading 1",
        isActive: editor.isActive("heading", { level: 1 }),
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      heading2: {
        icon: "H2",
        label: "Heading 2",
        isActive: editor.isActive("heading", { level: 2 }),
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      heading3: {
        icon: "H3",
        label: "Heading 3",
        isActive: editor.isActive("heading", { level: 3 }),
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      bulletList: {
        icon: "•",
        label: "Bullet List",
        isActive: editor.isActive("bulletList"),
        action: () => editor.chain().focus().toggleBulletList().run(),
      },
      orderedList: {
        icon: "1.",
        label: "Ordered List",
        isActive: editor.isActive("orderedList"),
        action: () => editor.chain().focus().toggleOrderedList().run(),
      },
      blockquote: {
        icon: '"',
        label: "Blockquote",
        isActive: editor.isActive("blockquote"),
        action: () => editor.chain().focus().toggleBlockquote().run(),
      },
      codeBlock: {
        icon: "</>",
        label: "Code Block",
        isActive: editor.isActive("codeBlock"),
        action: () => editor.chain().focus().toggleCodeBlock().run(),
      },
      link: {
        icon: "Link",
        label: "Link",
        isActive: editor.isActive("link"),
        action: handleLink,
      },
      horizontalRule: {
        icon: "—",
        label: "Horizontal Rule",
        isActive: false,
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
      undo: {
        icon: "↩",
        label: "Undo",
        isActive: false,
        action: () => editor.chain().focus().undo().run(),
        disabled: !editor.can().undo(),
      },
      redo: {
        icon: "↪",
        label: "Redo",
        isActive: false,
        action: () => editor.chain().focus().redo().run(),
        disabled: !editor.can().redo(),
      },
    };

    const config = itemConfig[item];
    return (
      <ToolbarButton
        key={item}
        icon={<span style={{ fontWeight: config.isActive ? 700 : 500, fontSize: "12px" }}>{config.icon}</span>}
        label={config.label}
        isActive={config.isActive}
        disabled={config.disabled}
        onClick={config.action}
      />
    );
  };

  return (
    <div className={className} style={containerStyles}>
      {items.map(renderItem)}
      {showLinkInput && (
        <LinkInput
          onSubmit={handleLinkSubmit}
          onCancel={() => setShowLinkInput(false)}
          initialUrl={editor.getAttributes("link").href}
        />
      )}
    </div>
  );
}
