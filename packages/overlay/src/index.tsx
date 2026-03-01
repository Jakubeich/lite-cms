"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode, CSSProperties } from "react";

/**
 * Selected field info
 */
export interface SelectedField {
  field: string;
  element: HTMLElement;
  rect: DOMRect;
}

/**
 * Overlay context value
 */
export interface OverlayContextValue {
  isEnabled: boolean;
  selectedField: SelectedField | null;
  hoveredField: SelectedField | null;
  showBorders: boolean;
  showBreadcrumb: boolean;
  setEnabled: (enabled: boolean) => void;
  selectField: (field: string | null) => void;
  setHoveredField: (field: SelectedField | null) => void;
  toggleBorders: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

/**
 * OverlayProvider props
 */
export interface OverlayProviderProps {
  children: ReactNode;
  enabled?: boolean;
  showBorders?: boolean;
  showBreadcrumb?: boolean;
}

/**
 * Overlay provider component
 */
export function OverlayProvider({ children, enabled: initialEnabled = false, showBorders: initialShowBorders = true, showBreadcrumb: initialShowBreadcrumb = true }: OverlayProviderProps) {
  const [isEnabled, setEnabled] = useState(initialEnabled);
  const [selectedField, setSelectedField] = useState<SelectedField | null>(null);
  const [hoveredField, setHoveredField] = useState<SelectedField | null>(null);
  const [showBorders, setShowBorders] = useState(initialShowBorders);
  const [showBreadcrumb] = useState(initialShowBreadcrumb);

  const selectField = useCallback((field: string | null) => {
    if (!field) {
      setSelectedField(null);
      return;
    }
    const element = document.querySelector(`[data-field="${field}"]`) as HTMLElement;
    if (element) {
      setSelectedField({ field, element, rect: element.getBoundingClientRect() });
    }
  }, []);

  const toggleBorders = useCallback(() => setShowBorders((prev) => !prev), []);

  const value = useMemo<OverlayContextValue>(() => ({
    isEnabled,
    selectedField,
    hoveredField,
    showBorders,
    showBreadcrumb,
    setEnabled,
    selectField,
    setHoveredField,
    toggleBorders,
  }), [isEnabled, selectedField, hoveredField, showBorders, showBreadcrumb, selectField, toggleBorders]);

  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

/**
 * Hook to access overlay context
 */
export function useOverlay(): OverlayContextValue {
  const context = useContext(OverlayContext);
  if (!context) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return context;
}

/**
 * EditOverlay component props
 */
export interface EditOverlayProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Main edit overlay component
 */
export function EditOverlay({ children, className = "", style }: EditOverlayProps) {
  const { isEnabled, selectedField, showBorders } = useOverlay();

  useEffect(() => {
    if (!isEnabled || !showBorders) return;

    const style = document.createElement("style");
    style.id = "litecms-overlay-styles";
    style.textContent = `
      [data-field] {
        outline: 1px dashed rgba(59, 130, 246, 0.3) !important;
        outline-offset: 2px !important;
        transition: outline 0.15s ease !important;
      }
      [data-field]:hover {
        outline: 2px solid rgba(59, 130, 246, 0.6) !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.getElementById("litecms-overlay-styles")?.remove();
    };
  }, [isEnabled, showBorders]);

  const containerStyles: CSSProperties = { position: "relative", ...style };

  return (
    <div className={className} style={containerStyles}>
      {children}

      {/* Selection highlight */}
      {isEnabled && selectedField && (
        <div
          style={{
            position: "fixed",
            top: selectedField.rect.top - 2,
            left: selectedField.rect.left - 2,
            width: selectedField.rect.width + 4,
            height: selectedField.rect.height + 4,
            border: "2px solid #3b82f6",
            borderRadius: "4px",
            pointerEvents: "none",
            zIndex: 9998,
          }}
        />
      )}

      {/* Floating toolbar */}
      {isEnabled && selectedField && (
        <FloatingToolbar field={selectedField.field} position={{ x: selectedField.rect.left, y: selectedField.rect.top - 40 }} />
      )}
    </div>
  );
}

/**
 * FloatingToolbar component props
 */
export interface FloatingToolbarProps {
  field: string;
  position: { x: number; y: number };
  className?: string;
}

/**
 * Floating toolbar component
 */
export function FloatingToolbar({ field, position, className = "" }: FloatingToolbarProps) {
  const { selectField } = useOverlay();

  const toolbarStyles: CSSProperties = {
    position: "fixed",
    top: Math.max(position.y, 8),
    left: Math.max(position.x, 8),
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "4px 8px",
    backgroundColor: "#1f2937",
    borderRadius: "6px",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 9999,
  };

  const buttonStyles: CSSProperties = {
    padding: "4px 8px",
    border: "none",
    borderRadius: "4px",
    backgroundColor: "transparent",
    color: "white",
    cursor: "pointer",
    fontSize: "12px",
  };

  return (
    <div className={className} style={toolbarStyles}>
      <span style={{ color: "#9ca3af", fontSize: "12px", marginRight: "8px" }}>{field}</span>
      <button style={buttonStyles} onClick={() => selectField(null)}>&#10005;</button>
    </div>
  );
}

/**
 * FieldHighlight component props
 */
export interface FieldHighlightProps {
  field: string;
  children: ReactNode;
  className?: string;
}

/**
 * Field highlight wrapper component
 */
export function FieldHighlight({ field, children, className = "" }: FieldHighlightProps) {
  const { selectField, setHoveredField, isEnabled } = useOverlay();

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!isEnabled) return;
    const element = e.currentTarget as HTMLElement;
    setHoveredField({ field, element, rect: element.getBoundingClientRect() });
  }, [field, isEnabled, setHoveredField]);

  const handleMouseLeave = useCallback(() => {
    setHoveredField(null);
  }, [setHoveredField]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!isEnabled) return;
    e.stopPropagation();
    selectField(field);
  }, [field, isEnabled, selectField]);

  return (
    <div className={className} data-field={field} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} onClick={handleClick}>
      {children}
    </div>
  );
}
