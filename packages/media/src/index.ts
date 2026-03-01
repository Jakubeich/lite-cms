// Re-export types from core
export type {
  MediaFile,
  MediaUploadOptions,
  MediaPaginationOptions,
  MediaStorageAdapter,
} from "@litecms/core";

// Components
export { MediaUploader } from "./components/MediaUploader";
export type { MediaUploaderProps } from "./components/MediaUploader";

export { MediaGallery } from "./components/MediaGallery";
export type { MediaGalleryProps } from "./components/MediaGallery";

export { MediaPicker } from "./components/MediaPicker";
export type { MediaPickerProps } from "./components/MediaPicker";

export { EditableImage } from "./components/EditableImage";
export type { EditableImageProps } from "./components/EditableImage";

// Hooks
export { useMedia } from "./hooks/useMedia";
export type { UseMediaOptions, UseMediaReturn } from "./hooks/useMedia";

// API Handler
export { createMediaApiHandler, createMediaPagesApiHandler } from "./api-handler";

// Utilities
export {
  validateFile,
  getMimeType,
  generateFilename,
  getImageDimensions,
  DEFAULT_UPLOAD_OPTIONS,
} from "./utils/validation";
export type { ValidationResult } from "./utils/validation";
