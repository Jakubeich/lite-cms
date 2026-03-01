// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Content data stored in the CMS
 */
export interface ContentData {
  id: string;
  field: string;
  value: string;
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Content types for different field structures
 */
export type ContentType = "simple" | "repeatable" | "structured" | "richtext" | "media";

/**
 * Extended content data with type information
 */
export interface TypedContentData extends ContentData {
  type: ContentType;
  metadata?: Record<string, unknown>;
}

/**
 * Storage adapter interface - implement this to create custom storage backends
 */
export interface StorageAdapter {
  /**
   * Get content by field key
   */
  get(field: string): Promise<ContentData | null>;

  /**
   * Get all content
   */
  getAll(): Promise<Record<string, ContentData>>;

  /**
   * Set content for a field
   */
  set(field: string, value: string): Promise<ContentData>;

  /**
   * Delete content by field key
   */
  delete(field: string): Promise<void>;
}

/**
 * Authentication state
 */
export interface AuthState {
  isAdmin: boolean;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

/**
 * CMS configuration
 */
export interface CMSConfig {
  /**
   * API URL for content operations (if using remote storage)
   */
  apiUrl?: string;

  /**
   * Storage adapter instance
   */
  adapter?: StorageAdapter;

  /**
   * Enable debug mode
   */
  debug?: boolean;
}

/**
 * CMS context state
 */
export interface CMSState {
  content: Record<string, ContentData>;
  isLoading: boolean;
  error: string | null;
  isEditMode: boolean;
}

/**
 * CMS context actions
 */
export type CMSAction =
  | { type: "SET_CONTENT"; payload: Record<string, ContentData> }
  | { type: "UPDATE_CONTENT"; payload: ContentData }
  | { type: "DELETE_CONTENT"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_EDIT_MODE"; payload: boolean }
  | { type: "SET_MEDIA"; payload: Record<string, MediaFile> }
  | { type: "ADD_MEDIA"; payload: MediaFile }
  | { type: "REMOVE_MEDIA"; payload: string }
  | { type: "SET_LOCALE"; payload: string }
  | { type: "SET_VERSIONS"; payload: { field: string; versions: ContentVersion[] } };

// ============================================================================
// MEDIA TYPES
// ============================================================================

/**
 * Media file metadata
 */
export interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  alt?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Media upload options
 */
export interface MediaUploadOptions {
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize?: number;
  /** Allowed MIME types (default: images only) */
  allowedMimeTypes?: string[];
  /** Generate thumbnails (default: true) */
  generateThumbnails?: boolean;
  /** Thumbnail sizes to generate */
  thumbnailSizes?: Array<{ width: number; height: number; name?: string }>;
  /** Custom upload path/folder */
  folder?: string;
  /** Optimize images (default: true) */
  optimize?: boolean;
}

/**
 * Media pagination options
 */
export interface MediaPaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "filename" | "size";
  sortOrder?: "asc" | "desc";
  mimeType?: string;
  search?: string;
}

/**
 * Media storage adapter interface
 */
export interface MediaStorageAdapter {
  /** Upload a file */
  upload(file: File | ArrayBuffer | Uint8Array, filename: string, options?: MediaUploadOptions): Promise<MediaFile>;
  /** Get a single media file by ID */
  get(id: string): Promise<MediaFile | null>;
  /** Get all media files with pagination */
  getAll(options?: MediaPaginationOptions): Promise<{ files: MediaFile[]; total: number; page: number; totalPages: number }>;
  /** Delete a media file */
  delete(id: string): Promise<void>;
  /** Update media metadata */
  update(id: string, data: Partial<Pick<MediaFile, "alt" | "title" | "metadata">>): Promise<MediaFile>;
  /** Get media URL (for signed URLs) */
  getUrl?(id: string, expiresIn?: number): Promise<string>;
}

// ============================================================================
// REPEATABLE FIELDS TYPES
// ============================================================================

/**
 * Repeatable field item
 */
export interface RepeatableItem<T = Record<string, unknown>> {
  id: string;
  order: number;
  data: T;
  createdAt: string;
  updatedAt: string;
}

/**
 * Repeatable field configuration
 */
export interface RepeatableFieldConfig<T = Record<string, unknown>> {
  /** Field key */
  field: string;
  /** Minimum number of items */
  minItems?: number;
  /** Maximum number of items */
  maxItems?: number;
  /** Default item template */
  defaultItem?: Partial<T>;
  /** Field schema for validation */
  schema?: FieldSchema;
  /** Allow reordering */
  sortable?: boolean;
  /** Collapsed by default */
  collapsed?: boolean;
}

/**
 * Field schema for validation
 */
export interface FieldSchema {
  type: "string" | "number" | "boolean" | "object" | "array" | "richtext" | "media" | "date";
  required?: boolean;
  label?: string;
  placeholder?: string;
  defaultValue?: unknown;
  validation?: FieldValidation;
  fields?: Record<string, FieldSchema>; // For nested objects
  items?: FieldSchema; // For arrays
}

/**
 * Field validation rules
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: unknown) => string | null; // Return error message or null
}

/**
 * Item helpers for repeatable fields
 */
export interface RepeatableItemHelpers<T = Record<string, unknown>> {
  /** Update item data */
  update: (data: Partial<T>) => void;
  /** Remove this item */
  remove: () => void;
  /** Move item up */
  moveUp: () => void;
  /** Move item down */
  moveDown: () => void;
  /** Duplicate this item */
  duplicate: () => void;
  /** Is first item */
  isFirst: boolean;
  /** Is last item */
  isLast: boolean;
  /** Current index */
  index: number;
}

// ============================================================================
// VERSIONING TYPES
// ============================================================================

/**
 * Content version history entry
 */
export interface ContentVersion {
  id: string;
  contentId: string;
  field: string;
  version: number;
  value: string;
  createdAt: string;
  createdBy?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Versioned content data
 */
export interface VersionedContentData extends ContentData {
  version: number;
  currentVersion: number;
}

/**
 * Diff result between two versions
 */
export interface DiffResult {
  type: "added" | "removed" | "changed" | "unchanged";
  value: string;
  oldValue?: string;
}

/**
 * Versioning adapter interface
 */
export interface VersioningAdapter {
  /** Get all versions for a field */
  getVersions(field: string, options?: { limit?: number; offset?: number }): Promise<ContentVersion[]>;
  /** Get a specific version */
  getVersion(field: string, version: number): Promise<ContentVersion | null>;
  /** Restore a previous version */
  restore(field: string, version: number): Promise<ContentData>;
  /** Compare two versions */
  compare(field: string, v1: number, v2: number): Promise<DiffResult[]>;
  /** Get latest version number */
  getLatestVersion(field: string): Promise<number>;
}

// ============================================================================
// I18N TYPES
// ============================================================================

/**
 * Localized content map
 */
export interface LocalizedContent {
  [locale: string]: string;
}

/**
 * I18n configuration
 */
export interface I18nConfig {
  /** Default locale */
  defaultLocale: string;
  /** Supported locales */
  locales: string[];
  /** Fallback locale when translation is missing */
  fallbackLocale?: string;
  /** Locale detection strategy */
  detection?: "path" | "subdomain" | "cookie" | "header" | "query";
}

/**
 * Localized content data
 */
export interface LocalizedContentData extends Omit<ContentData, "value"> {
  value: LocalizedContent;
  currentLocale: string;
}

// ============================================================================
// AUTH TYPES
// ============================================================================

/**
 * User roles
 */
export type UserRole = "admin" | "editor" | "viewer";

/**
 * User information
 */
export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Detailed permissions
 */
export interface Permissions {
  /** Can edit content */
  canEdit: boolean;
  /** Can delete content */
  canDelete: boolean;
  /** Can publish content */
  canPublish: boolean;
  /** Can manage users */
  canManageUsers: boolean;
  /** Can access version history */
  canAccessVersions: boolean;
  /** Can manage media */
  canManageMedia: boolean;
  /** Can manage settings */
  canManageSettings: boolean;
  /** Field-level permissions */
  fieldPermissions?: Record<string, { read: boolean; write: boolean }>;
}

/**
 * Extended auth state with user and permissions
 */
export interface ExtendedAuthState extends AuthState {
  user?: User;
  permissions?: Permissions;
  token?: string;
}

/**
 * Auth adapter interface
 */
export interface AuthAdapter {
  /** Get current user */
  getCurrentUser(): Promise<User | null>;
  /** Login with credentials */
  login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }>;
  /** Logout */
  logout(): Promise<void>;
  /** Refresh token */
  refreshToken?(): Promise<string>;
  /** Get permissions for a user */
  getPermissions(user: User): Permissions;
  /** Check if user has permission */
  hasPermission(user: User, permission: keyof Permissions): boolean;
}

// ============================================================================
// PUBLISHING TYPES
// ============================================================================

/**
 * Publish status
 */
export type PublishStatus = "draft" | "published" | "scheduled" | "archived";

/**
 * Publishable content data
 */
export interface PublishableContent extends ContentData {
  status: PublishStatus;
  publishedAt?: string;
  scheduledAt?: string;
  publishedBy?: string;
  draftValue?: string;
  publishedValue?: string;
}

/**
 * Publishing adapter interface
 */
export interface PublishingAdapter {
  /** Publish content immediately */
  publish(field: string): Promise<PublishableContent>;
  /** Unpublish content */
  unpublish(field: string): Promise<PublishableContent>;
  /** Schedule content for future publication */
  schedule(field: string, date: Date): Promise<PublishableContent>;
  /** Cancel scheduled publication */
  cancelSchedule(field: string): Promise<PublishableContent>;
  /** Save as draft */
  saveDraft(field: string, value: string): Promise<PublishableContent>;
  /** Get all scheduled content */
  getScheduled(): Promise<PublishableContent[]>;
  /** Archive content */
  archive(field: string): Promise<PublishableContent>;
}

// ============================================================================
// SEO TYPES
// ============================================================================

/**
 * SEO data for a page
 */
export interface SEOData {
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Keywords */
  keywords?: string[];
  /** Canonical URL */
  canonical?: string;
  /** Robots directives */
  robots?: {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
  };
  /** Open Graph tags */
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    type?: "website" | "article" | "profile" | "product";
    locale?: string;
    siteName?: string;
  };
  /** Twitter Card tags */
  twitter?: {
    card?: "summary" | "summary_large_image" | "player" | "app";
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  /** JSON-LD structured data */
  structuredData?: Record<string, unknown>;
}

/**
 * Page SEO data with page info
 */
export interface PageSEO extends SEOData {
  pageId: string;
  path: string;
  updatedAt: string;
  updatedBy?: string;
}

// ============================================================================
// COLLABORATION TYPES
// ============================================================================

/**
 * User presence information
 */
export interface Presence {
  id: string;
  user: User;
  cursor?: {
    field: string;
    position: number;
  };
  selection?: {
    field: string;
    start: number;
    end: number;
  };
  color: string;
  lastSeen: number;
  isActive: boolean;
}

/**
 * Collaboration event types
 */
export type CollabEventType =
  | "presence:join"
  | "presence:leave"
  | "presence:update"
  | "content:update"
  | "content:lock"
  | "content:unlock";

/**
 * Collaboration event
 */
export interface CollabEvent {
  type: CollabEventType;
  userId: string;
  field?: string;
  data?: unknown;
  timestamp: number;
}

/**
 * Collaboration adapter interface
 */
export interface CollaborationAdapter {
  /** Connect to collaboration server */
  connect(): Promise<void>;
  /** Disconnect from collaboration server */
  disconnect(): Promise<void>;
  /** Subscribe to field changes */
  subscribe(field: string, callback: (value: string, userId: string) => void): () => void;
  /** Broadcast field change */
  broadcast(field: string, value: string): Promise<void>;
  /** Get current presence list */
  getPresence(): Promise<Presence[]>;
  /** Update own presence */
  updatePresence(presence: Partial<Omit<Presence, "id" | "user">>): Promise<void>;
  /** Lock a field for editing */
  lockField?(field: string): Promise<boolean>;
  /** Unlock a field */
  unlockField?(field: string): Promise<void>;
  /** Subscribe to events */
  onEvent?(callback: (event: CollabEvent) => void): () => void;
}

// ============================================================================
// COMPONENT LIBRARY TYPES
// ============================================================================

/**
 * Base props for editable section components
 */
export interface EditableSectionProps {
  /** Field prefix for namespacing */
  prefix?: string;
  /** Additional CSS classes */
  className?: string;
  /** Section ID for navigation */
  id?: string;
}

/**
 * Hero section props
 */
export interface EditableHeroProps extends EditableSectionProps {
  defaultTitle?: string;
  defaultSubtitle?: string;
  defaultCTA?: string;
  defaultCTALink?: string;
  showBackground?: boolean;
  layout?: "centered" | "left" | "right" | "split";
}

/**
 * Feature item type
 */
export interface FeatureItem {
  icon?: string;
  title: string;
  description: string;
}

/**
 * Features section props
 */
export interface EditableFeaturesProps extends EditableSectionProps {
  defaultFeatures?: FeatureItem[];
  columns?: 2 | 3 | 4;
  layout?: "grid" | "list" | "cards";
}

/**
 * Testimonial item type
 */
export interface TestimonialItem {
  quote: string;
  author: string;
  role?: string;
  company?: string;
  avatar?: string;
}

/**
 * Testimonials section props
 */
export interface EditableTestimonialsProps extends EditableSectionProps {
  defaultTestimonials?: TestimonialItem[];
  layout?: "grid" | "carousel" | "stack";
}

/**
 * Gallery item type
 */
export interface GalleryItem {
  src: string;
  alt?: string;
  title?: string;
  description?: string;
}

/**
 * Gallery section props
 */
export interface EditableGalleryProps extends EditableSectionProps {
  defaultItems?: GalleryItem[];
  columns?: 2 | 3 | 4 | 5;
  layout?: "grid" | "masonry" | "carousel";
  lightbox?: boolean;
}
