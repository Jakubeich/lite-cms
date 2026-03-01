"use client";

import React, { useState, useCallback } from "react";
import type { MediaFile } from "@litecms/core";
import { formatFileSize, isImage, isVideo } from "@litecms/core";

/**
 * MediaGallery props
 */
export interface MediaGalleryProps {
  /** Media files to display */
  files: MediaFile[];
  /** Loading state */
  isLoading?: boolean;
  /** Callback when file is selected */
  onSelect?: (file: MediaFile) => void;
  /** Callback when file is deleted */
  onDelete?: (id: string) => void;
  /** Callback when file metadata is updated */
  onUpdate?: (id: string, data: Partial<Pick<MediaFile, "alt" | "title">>) => void;
  /** Selected file ID */
  selectedId?: string;
  /** Allow multiple selection */
  multiple?: boolean;
  /** Selected file IDs (for multiple selection) */
  selectedIds?: string[];
  /** Custom class name */
  className?: string;
  /** Grid columns */
  columns?: 2 | 3 | 4 | 5 | 6;
  /** Show file info overlay */
  showInfo?: boolean;
  /** Enable editing mode */
  editable?: boolean;
}

/**
 * Media gallery component for displaying and managing files
 */
export function MediaGallery({
  files,
  isLoading = false,
  onSelect,
  onDelete,
  onUpdate,
  selectedId,
  multiple = false,
  selectedIds = [],
  className = "",
  columns = 4,
  showInfo = true,
  editable = false,
}: MediaGalleryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ alt: string; title: string }>({
    alt: "",
    title: "",
  });

  const isSelected = useCallback(
    (id: string) => {
      if (multiple) {
        return selectedIds.includes(id);
      }
      return selectedId === id;
    },
    [multiple, selectedId, selectedIds]
  );

  const handleSelect = useCallback(
    (file: MediaFile) => {
      onSelect?.(file);
    },
    [onSelect]
  );

  const handleEditStart = useCallback((file: MediaFile) => {
    setEditingId(file.id);
    setEditValues({
      alt: file.alt || "",
      title: file.title || "",
    });
  }, []);

  const handleEditSave = useCallback(
    (id: string) => {
      onUpdate?.(id, editValues);
      setEditingId(null);
    },
    [editValues, onUpdate]
  );

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditValues({ alt: "", title: "" });
  }, []);

  const gridStyles: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: "16px",
  };

  const cardStyles: React.CSSProperties = {
    position: "relative",
    aspectRatio: "1",
    borderRadius: "8px",
    overflow: "hidden",
    cursor: "pointer",
    border: "2px solid transparent",
    transition: "all 0.2s ease",
  };

  const selectedCardStyles: React.CSSProperties = {
    ...cardStyles,
    borderColor: "#3b82f6",
    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)",
  };

  if (isLoading) {
    return (
      <div className={className} style={gridStyles}>
        {Array.from({ length: 8 }).map((_, idx) => (
          <div
            key={idx}
            style={{
              ...cardStyles,
              backgroundColor: "#e5e7eb",
              animation: "pulse 2s infinite",
            }}
          />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        className={className}
        style={{
          textAlign: "center",
          padding: "48px",
          color: "#6b7280",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>No files</div>
        <p>Upload some files to get started</p>
      </div>
    );
  }

  return (
    <div className={className} style={gridStyles}>
      {files.map((file) => (
        <div
          key={file.id}
          style={isSelected(file.id) ? selectedCardStyles : cardStyles}
          onClick={() => handleSelect(file)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleSelect(file)}
        >
          {/* Thumbnail */}
          {isImage(file.mimeType) ? (
            <img
              src={file.thumbnailUrl || file.url}
              alt={file.alt || file.originalName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : isVideo(file.mimeType) ? (
            <video
              src={file.url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              muted
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f3f4f6",
                fontSize: "32px",
              }}
            >
              Document
            </div>
          )}

          {/* Info overlay */}
          {showInfo && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "8px",
                background: "linear-gradient(transparent, rgba(0,0,0,0.7))",
                color: "white",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 500,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {file.title || file.originalName}
              </div>
              <div style={{ fontSize: "10px", opacity: 0.8 }}>
                {formatFileSize(file.size)}
              </div>
            </div>
          )}

          {/* Selection indicator */}
          {isSelected(file.id) && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: "#3b82f6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "14px",
              }}
            >
              &#10003;
            </div>
          )}

          {/* Actions */}
          {editable && (
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                display: "flex",
                gap: "4px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleEditStart(file)}
                style={{
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "rgba(255,255,255,0.9)",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(file.id)}
                  style={{
                    padding: "4px 8px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "rgba(239,68,68,0.9)",
                    color: "white",
                    cursor: "pointer",
                    fontSize: "12px",
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {/* Edit modal */}
          {editingId === file.id && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.9)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="text"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Title"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #374151",
                  backgroundColor: "#1f2937",
                  color: "white",
                }}
              />
              <input
                type="text"
                value={editValues.alt}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, alt: e.target.value }))
                }
                placeholder="Alt text"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #374151",
                  backgroundColor: "#1f2937",
                  color: "white",
                }}
              />
              <div style={{ display: "flex", gap: "8px", marginTop: "auto" }}>
                <button
                  onClick={() => handleEditSave(file.id)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "none",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "4px",
                    border: "1px solid #374151",
                    backgroundColor: "transparent",
                    color: "white",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
