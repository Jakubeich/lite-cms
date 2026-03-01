import type { MediaUploadOptions } from "@litecms/core";

/**
 * Default upload options
 */
export const DEFAULT_UPLOAD_OPTIONS: Required<MediaUploadOptions> = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
  ],
  generateThumbnails: true,
  thumbnailSizes: [
    { width: 150, height: 150, name: "thumb" },
    { width: 300, height: 300, name: "small" },
    { width: 800, height: 600, name: "medium" },
  ],
  folder: "uploads",
  optimize: true,
};

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file for upload
 */
export function validateFile(
  file: File | { size: number; type: string; name: string },
  options: MediaUploadOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

  // Check file size
  if (file.size > opts.maxFileSize) {
    const maxMB = (opts.maxFileSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxMB}MB`,
    };
  }

  // Check MIME type
  if (!opts.allowedMimeTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed types: ${opts.allowedMimeTypes.join(", ")}`,
    };
  }

  return { valid: true };
}

/**
 * Get MIME type from filename
 */
export function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
    avif: "image/avif",
    pdf: "application/pdf",
    mp4: "video/mp4",
    webm: "video/webm",
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };
  return mimeTypes[ext || ""] || "application/octet-stream";
}

/**
 * Generate unique filename
 */
export function generateFilename(originalName: string): string {
  const ext = originalName.split(".").pop() || "";
  const name = originalName.replace(/\.[^/.]+$/, "");
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${slug}-${timestamp}-${random}.${ext}`;
}

/**
 * Get image dimensions from file (browser only)
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (typeof window === "undefined") return null;
  if (!file.type.startsWith("image/")) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}
