"use client";

import React, { useState, useCallback, useEffect, CSSProperties } from "react";
import type { MediaFile } from "@litecms/core";
import { MediaPicker } from "./MediaPicker";

/**
 * EditableImage props
 */
export interface EditableImageProps {
  /** Field key for CMS storage */
  field: string;
  /** Default image source */
  defaultSrc?: string;
  /** Alt text */
  alt?: string;
  /** Image width */
  width?: number | string;
  /** Image height */
  height?: number | string;
  /** Object fit */
  objectFit?: "cover" | "contain" | "fill" | "none" | "scale-down";
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Whether editing is enabled */
  canEdit?: boolean;
  /** API URL for media operations */
  apiUrl?: string;
  /** Current image URL (from CMS) */
  value?: string;
  /** Callback when image changes */
  onChange?: (url: string, mediaFile?: MediaFile) => void;
  /** Placeholder component when no image */
  placeholder?: React.ReactNode;
  /** Aspect ratio (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Border radius */
  borderRadius?: string | number;
}

/**
 * Inline editable image component
 */
export function EditableImage({
  field,
  defaultSrc,
  alt = "",
  width,
  height,
  objectFit = "cover",
  className = "",
  style,
  canEdit = false,
  apiUrl = "/api/media",
  value,
  onChange,
  placeholder,
  aspectRatio,
  borderRadius,
}: EditableImageProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(value || defaultSrc || "");
  const [isHovered, setIsHovered] = useState(false);

  // Sync with external value
  useEffect(() => {
    if (value !== undefined) {
      setCurrentSrc(value);
    }
  }, [value]);

  // Handle media selection
  const handleSelect = useCallback(
    (file: MediaFile) => {
      setCurrentSrc(file.url);
      onChange?.(file.url, file);
      setIsPickerOpen(false);
    },
    [onChange]
  );

  // Handle click to edit
  const handleClick = useCallback(() => {
    if (canEdit) {
      setIsPickerOpen(true);
    }
  }, [canEdit]);

  // Handle remove image
  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentSrc("");
      onChange?.("");
    },
    [onChange]
  );

  const containerStyles: CSSProperties = {
    position: "relative",
    width: width || "100%",
    height: height || (aspectRatio ? "auto" : "200px"),
    aspectRatio: aspectRatio,
    overflow: "hidden",
    borderRadius: borderRadius,
    cursor: canEdit ? "pointer" : "default",
    ...style,
  };

  const imageStyles: CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit,
    display: "block",
  };

  const overlayStyles: CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    opacity: isHovered && canEdit ? 1 : 0,
    transition: "opacity 0.2s ease",
  };

  const buttonStyles: CSSProperties = {
    padding: "8px 16px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
  };

  const placeholderStyles: CSSProperties = {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
    gap: "8px",
  };

  return (
    <>
      <div
        className={className}
        style={containerStyles}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        data-field={field}
        role={canEdit ? "button" : undefined}
        tabIndex={canEdit ? 0 : undefined}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
      >
        {currentSrc ? (
          <img
            src={currentSrc}
            alt={alt}
            style={imageStyles}
            loading="lazy"
          />
        ) : placeholder ? (
          placeholder
        ) : (
          <div style={placeholderStyles}>
            <span style={{ fontSize: "32px" }}>Image</span>
            {canEdit && <span style={{ fontSize: "14px" }}>Click to add image</span>}
          </div>
        )}

        {/* Edit overlay */}
        {canEdit && (
          <div style={overlayStyles}>
            <button
              style={{
                ...buttonStyles,
                backgroundColor: "#3b82f6",
                color: "white",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsPickerOpen(true);
              }}
            >
              {currentSrc ? "Change" : "Select"} Image
            </button>
            {currentSrc && (
              <button
                style={{
                  ...buttonStyles,
                  backgroundColor: "#ef4444",
                  color: "white",
                }}
                onClick={handleRemove}
              >
                Remove
              </button>
            )}
          </div>
        )}

        {/* Edit indicator */}
        {canEdit && !isHovered && currentSrc && (
          <div
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              padding: "4px 8px",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          >
            Click to edit
          </div>
        )}
      </div>

      {/* Media picker modal */}
      <MediaPicker
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleSelect}
        apiUrl={apiUrl}
        filter="image/"
        title="Select Image"
        allowUpload
      />
    </>
  );
}
