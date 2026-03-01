"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { MediaFile, MediaUploadOptions } from "@litecms/core";
import { MediaGallery } from "./MediaGallery";
import { MediaUploader } from "./MediaUploader";

/**
 * MediaPicker props
 */
export interface MediaPickerProps {
  /** Whether the picker is open */
  isOpen: boolean;
  /** Callback when picker is closed */
  onClose: () => void;
  /** Callback when file is selected */
  onSelect: (file: MediaFile) => void;
  /** API endpoint for media operations */
  apiUrl: string;
  /** Filter by MIME type prefix (e.g., "image/", "video/") */
  filter?: string;
  /** Modal title */
  title?: string;
  /** Allow upload */
  allowUpload?: boolean;
  /** Upload options */
  uploadOptions?: MediaUploadOptions;
  /** Custom class name */
  className?: string;
}

/**
 * Modal media picker component
 */
export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  apiUrl,
  filter,
  title = "Select Media",
  allowUpload = true,
  uploadOptions,
  className = "",
}: MediaPickerProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [tab, setTab] = useState<"gallery" | "upload">("gallery");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch files
  const fetchFiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filter) params.set("mimeType", filter);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`${apiUrl}?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch files");

      const data = await response.json();
      setFiles(data.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, filter, searchQuery]);

  // Upload file
  const uploadFile = useCallback(
    async (file: File): Promise<MediaFile> => {
      const formData = new FormData();
      formData.append("file", file);
      if (uploadOptions) {
        formData.append("options", JSON.stringify(uploadOptions));
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      return response.json();
    },
    [apiUrl, uploadOptions]
  );

  // Handle upload complete
  const handleUploadComplete = useCallback(
    (uploadedFiles: MediaFile[]) => {
      setFiles((prev) => [...uploadedFiles, ...prev]);
      if (uploadedFiles.length === 1) {
        setSelectedFile(uploadedFiles[0]);
      }
      setTab("gallery");
    },
    []
  );

  // Handle select
  const handleSelect = useCallback((file: MediaFile) => {
    setSelectedFile(file);
  }, []);

  // Handle confirm
  const handleConfirm = useCallback(() => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  }, [selectedFile, onSelect, onClose]);

  // Fetch on open
  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen, fetchFiles]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "90%",
          maxWidth: "900px",
          maxHeight: "90vh",
          backgroundColor: "white",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: "8px",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "20px",
            }}
          >
            &#10005;
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            padding: "0 24px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            gap: "24px",
          }}
        >
          <button
            onClick={() => setTab("gallery")}
            style={{
              padding: "12px 0",
              border: "none",
              backgroundColor: "transparent",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: tab === "gallery" ? 600 : 400,
              borderBottom: tab === "gallery" ? "2px solid #3b82f6" : "none",
              color: tab === "gallery" ? "#3b82f6" : "#6b7280",
            }}
          >
            Media Library
          </button>
          {allowUpload && (
            <button
              onClick={() => setTab("upload")}
              style={{
                padding: "12px 0",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: tab === "upload" ? 600 : 400,
                borderBottom: tab === "upload" ? "2px solid #3b82f6" : "none",
                color: tab === "upload" ? "#3b82f6" : "#6b7280",
              }}
            >
              Upload New
            </button>
          )}
        </div>

        {/* Search bar (for gallery tab) */}
        {tab === "gallery" && (
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {error && (
            <div
              style={{
                padding: "12px",
                backgroundColor: "#fef2f2",
                color: "#dc2626",
                borderRadius: "6px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          {tab === "gallery" && (
            <MediaGallery
              files={files}
              isLoading={isLoading}
              onSelect={handleSelect}
              selectedId={selectedFile?.id}
              columns={4}
              showInfo
            />
          )}

          {tab === "upload" && (
            <MediaUploader
              onUpload={handleUploadComplete}
              onError={setError}
              uploadFn={uploadFile}
              accept={filter ? `${filter}*` : "image/*"}
              multiple
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #e5e7eb",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            {selectedFile ? (
              <span>Selected: {selectedFile.originalName}</span>
            ) : (
              <span>No file selected</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                backgroundColor: "white",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedFile}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: selectedFile ? "#3b82f6" : "#9ca3af",
                color: "white",
                cursor: selectedFile ? "pointer" : "not-allowed",
                fontSize: "14px",
              }}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
