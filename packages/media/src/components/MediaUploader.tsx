"use client";

import React, { useCallback, useRef, useState } from "react";
import type { MediaFile, MediaUploadOptions } from "@litecms/core";
import { formatFileSize } from "@litecms/core";

/**
 * MediaUploader props
 */
export interface MediaUploaderProps {
  /** Callback when files are uploaded */
  onUpload: (files: MediaFile[]) => void;
  /** Callback when upload fails */
  onError?: (error: string) => void;
  /** Upload function (from useMedia) */
  uploadFn: (file: File, options?: MediaUploadOptions) => Promise<MediaFile>;
  /** Accepted file types */
  accept?: string;
  /** Allow multiple files */
  multiple?: boolean;
  /** Maximum number of files */
  maxFiles?: number;
  /** Maximum file size in bytes */
  maxFileSize?: number;
  /** Custom class name */
  className?: string;
  /** Custom children (for custom dropzone UI) */
  children?: React.ReactNode;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Upload progress state
 */
interface UploadProgress {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
  error?: string;
  result?: MediaFile;
}

/**
 * Drag and drop file uploader component
 */
export function MediaUploader({
  onUpload,
  onError,
  uploadFn,
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024,
  className = "",
  children,
  disabled = false,
}: MediaUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file validation
   */
  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      for (const file of files) {
        if (file.size > maxFileSize) {
          errors.push(`${file.name}: File too large (max ${formatFileSize(maxFileSize)})`);
          continue;
        }
        valid.push(file);
      }

      if (valid.length > maxFiles) {
        errors.push(`Too many files (max ${maxFiles})`);
        return { valid: valid.slice(0, maxFiles), errors };
      }

      return { valid, errors };
    },
    [maxFiles, maxFileSize]
  );

  /**
   * Process file upload
   */
  const processUpload = useCallback(
    async (files: File[]) => {
      const { valid, errors } = validateFiles(files);

      if (errors.length > 0) {
        errors.forEach((err) => onError?.(err));
      }

      if (valid.length === 0) return;

      // Initialize progress state
      const progressItems: UploadProgress[] = valid.map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));
      setUploads(progressItems);

      const results: MediaFile[] = [];

      // Upload files sequentially
      for (let i = 0; i < valid.length; i++) {
        const file = valid[i];

        setUploads((prev) =>
          prev.map((p, idx) =>
            idx === i ? { ...p, status: "uploading" as const, progress: 50 } : p
          )
        );

        try {
          const result = await uploadFn(file);
          results.push(result);

          setUploads((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: "complete" as const, progress: 100, result }
                : p
            )
          );
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Upload failed";
          setUploads((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? { ...p, status: "error" as const, error: errorMessage }
                : p
            )
          );
          onError?.(errorMessage);
        }
      }

      if (results.length > 0) {
        onUpload(results);
      }

      // Clear progress after delay
      setTimeout(() => {
        setUploads([]);
      }, 2000);
    },
    [validateFiles, uploadFn, onUpload, onError]
  );

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      processUpload(files);
    },
    [disabled, processUpload]
  );

  /**
   * Handle file input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      processUpload(files);
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    },
    [processUpload]
  );

  /**
   * Handle click to open file picker
   */
  const handleClick = useCallback(() => {
    if (!disabled) {
      inputRef.current?.click();
    }
  }, [disabled]);

  const baseStyles: React.CSSProperties = {
    border: "2px dashed",
    borderColor: isDragging ? "#3b82f6" : "#d1d5db",
    borderRadius: "8px",
    padding: "24px",
    textAlign: "center",
    cursor: disabled ? "not-allowed" : "pointer",
    backgroundColor: isDragging ? "#eff6ff" : "#f9fafb",
    transition: "all 0.2s ease",
    opacity: disabled ? 0.5 : 1,
  };

  return (
    <div
      className={className}
      style={baseStyles}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleInputChange}
        style={{ display: "none" }}
        disabled={disabled}
      />

      {children || (
        <div>
          <div style={{ marginBottom: "8px", fontSize: "24px" }}>
            {isDragging ? "Drop files here" : "Drag & drop files"}
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            or click to browse
          </div>
          <div style={{ color: "#9ca3af", fontSize: "12px", marginTop: "8px" }}>
            Max {formatFileSize(maxFileSize)} per file, up to {maxFiles} files
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          {uploads.map((upload, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                backgroundColor: "#fff",
                borderRadius: "4px",
                marginBottom: "4px",
              }}
            >
              <span style={{ flex: 1, textAlign: "left", fontSize: "14px" }}>
                {upload.file.name}
              </span>
              {upload.status === "uploading" && (
                <span style={{ color: "#3b82f6" }}>Uploading...</span>
              )}
              {upload.status === "complete" && (
                <span style={{ color: "#10b981" }}>Done</span>
              )}
              {upload.status === "error" && (
                <span style={{ color: "#ef4444" }}>{upload.error}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
