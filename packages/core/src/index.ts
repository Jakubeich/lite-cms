// ============================================================================
// CORE TYPES
// ============================================================================
export type {
  ContentData,
  ContentType,
  TypedContentData,
  StorageAdapter,
  AuthState,
  CMSConfig,
  CMSState,
  CMSAction,
} from "./types";

// ============================================================================
// MEDIA TYPES
// ============================================================================
export type {
  MediaFile,
  MediaUploadOptions,
  MediaPaginationOptions,
  MediaStorageAdapter,
} from "./types";

// ============================================================================
// REPEATABLE FIELDS TYPES
// ============================================================================
export type {
  RepeatableItem,
  RepeatableFieldConfig,
  FieldSchema,
  FieldValidation,
  RepeatableItemHelpers,
} from "./types";

// ============================================================================
// VERSIONING TYPES
// ============================================================================
export type {
  ContentVersion,
  VersionedContentData,
  DiffResult,
  VersioningAdapter,
} from "./types";

// ============================================================================
// I18N TYPES
// ============================================================================
export type {
  LocalizedContent,
  I18nConfig,
  LocalizedContentData,
} from "./types";

// ============================================================================
// AUTH TYPES
// ============================================================================
export type {
  UserRole,
  User,
  Permissions,
  ExtendedAuthState,
  AuthAdapter,
} from "./types";

// ============================================================================
// PUBLISHING TYPES
// ============================================================================
export type {
  PublishStatus,
  PublishableContent,
  PublishingAdapter,
} from "./types";

// ============================================================================
// SEO TYPES
// ============================================================================
export type {
  SEOData,
  PageSEO,
} from "./types";

// ============================================================================
// COLLABORATION TYPES
// ============================================================================
export type {
  Presence,
  CollabEventType,
  CollabEvent,
  CollaborationAdapter,
} from "./types";

// ============================================================================
// COMPONENT LIBRARY TYPES
// ============================================================================
export type {
  EditableSectionProps,
  EditableHeroProps,
  FeatureItem,
  EditableFeaturesProps,
  TestimonialItem,
  EditableTestimonialsProps,
  GalleryItem,
  EditableGalleryProps,
} from "./types";

// ============================================================================
// UTILS
// ============================================================================
export {
  // ID and time
  generateId,
  getTimestamp,
  // Function utilities
  debounce,
  throttle,
  // Object utilities
  deepMerge,
  getByPath,
  setByPath,
  // Array utilities
  reorderArray,
  moveUp,
  moveDown,
  // String utilities
  slugify,
  createFieldPath,
  parseFieldPath,
  diffText,
  // File utilities
  formatFileSize,
  getFileExtension,
  isImage,
  isVideo,
  isAudio,
  isDocument,
  // Validation utilities
  isValidEmail,
  // Color utilities
  generateColor,
  // Number utilities
  clamp,
} from "./utils";
