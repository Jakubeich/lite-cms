// Re-export types from core
export type {
  StorageAdapter,
  ContentData,
  MediaStorageAdapter,
  MediaFile,
  MediaUploadOptions,
  MediaPaginationOptions,
  VersioningAdapter,
  ContentVersion,
  DiffResult,
  PublishingAdapter,
  PublishableContent,
  PublishStatus,
} from "@litecms/core";

// Adapters
export {
  createPrismaAdapter,
  createPrismaMediaAdapter,
  createMediaRecord,
} from "./adapter";
export type { PrismaAdapterOptions, PrismaClientLike } from "./adapter";

// API Handler
export { createPrismaApiHandler } from "./api-handler";
