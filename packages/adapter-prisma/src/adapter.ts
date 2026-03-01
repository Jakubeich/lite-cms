import type {
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
import { generateId, getTimestamp, diffText } from "@litecms/core";

/**
 * Prisma client interface (minimal subset)
 */
export interface PrismaClientLike {
  liteCMSContent: {
    findUnique: (args: { where: { field: string } }) => Promise<PrismaContent | null>;
    findMany: (args?: PrismaFindManyArgs) => Promise<PrismaContent[]>;
    upsert: (args: PrismaUpsertArgs) => Promise<PrismaContent>;
    delete: (args: { where: { field: string } }) => Promise<PrismaContent>;
    update: (args: PrismaUpdateArgs) => Promise<PrismaContent>;
  };
  liteCMSContentVersion: {
    findMany: (args: PrismaFindManyArgs) => Promise<PrismaContentVersion[]>;
    findFirst: (args: PrismaFindFirstArgs) => Promise<PrismaContentVersion | null>;
    create: (args: { data: Partial<PrismaContentVersion> }) => Promise<PrismaContentVersion>;
    count: (args: { where: { contentId: string } }) => Promise<number>;
  };
  liteCMSMedia: {
    findUnique: (args: { where: { id: string } }) => Promise<PrismaMedia | null>;
    findMany: (args?: PrismaFindManyArgs) => Promise<PrismaMedia[]>;
    create: (args: { data: Partial<PrismaMedia> }) => Promise<PrismaMedia>;
    update: (args: { where: { id: string }; data: Partial<PrismaMedia> }) => Promise<PrismaMedia>;
    delete: (args: { where: { id: string } }) => Promise<PrismaMedia>;
    count: (args?: { where?: Record<string, unknown> }) => Promise<number>;
  };
}

interface PrismaContent {
  id: string;
  field: string;
  value: string;
  type: string;
  locale: string | null;
  version: number;
  status: string;
  publishedAt: Date | null;
  scheduledAt: Date | null;
  draftValue: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  updatedBy: string | null;
  publishedBy: string | null;
}

interface PrismaContentVersion {
  id: string;
  contentId: string;
  version: number;
  value: string;
  message: string | null;
  metadata: unknown;
  createdAt: Date;
  createdBy: string | null;
}

interface PrismaMedia {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  width: number | null;
  height: number | null;
  alt: string | null;
  title: string | null;
  caption: string | null;
  metadata: unknown;
  folder: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  uploadedBy: string | null;
}

interface PrismaFindManyArgs {
  where?: Record<string, unknown>;
  orderBy?: Record<string, string> | Array<Record<string, string>>;
  skip?: number;
  take?: number;
}

interface PrismaFindFirstArgs {
  where?: Record<string, unknown>;
  orderBy?: Record<string, string> | Array<Record<string, string>>;
}

interface PrismaUpsertArgs {
  where: { field: string };
  create: Partial<PrismaContent>;
  update: Partial<PrismaContent>;
}

interface PrismaUpdateArgs {
  where: { field: string };
  data: Partial<PrismaContent>;
}

/**
 * Prisma adapter options
 */
export interface PrismaAdapterOptions {
  /** Prisma client instance */
  prisma: PrismaClientLike;
  /** Current user ID for tracking */
  userId?: string;
  /** Default locale */
  defaultLocale?: string;
  /** Enable versioning */
  versioning?: boolean;
  /** Maximum versions to keep per field */
  maxVersions?: number;
}

/**
 * Convert Prisma content to ContentData
 */
function toContentData(content: PrismaContent): ContentData {
  return {
    id: content.id,
    field: content.field,
    value: content.value,
    updatedAt: content.updatedAt.toISOString(),
    updatedBy: content.updatedBy || undefined,
  };
}

/**
 * Convert Prisma content to PublishableContent
 */
function toPublishableContent(content: PrismaContent): PublishableContent {
  return {
    id: content.id,
    field: content.field,
    value: content.value,
    updatedAt: content.updatedAt.toISOString(),
    updatedBy: content.updatedBy || undefined,
    status: content.status as PublishStatus,
    publishedAt: content.publishedAt?.toISOString(),
    scheduledAt: content.scheduledAt?.toISOString(),
    publishedBy: content.publishedBy || undefined,
    draftValue: content.draftValue || undefined,
    publishedValue: content.status === "published" ? content.value : undefined,
  };
}

/**
 * Convert Prisma media to MediaFile
 */
function toMediaFile(media: PrismaMedia): MediaFile {
  return {
    id: media.id,
    filename: media.filename,
    originalName: media.originalName,
    mimeType: media.mimeType,
    size: media.size,
    url: media.url,
    thumbnailUrl: media.thumbnailUrl || undefined,
    width: media.width || undefined,
    height: media.height || undefined,
    alt: media.alt || undefined,
    title: media.title || undefined,
    metadata: media.metadata as Record<string, unknown> | undefined,
    createdAt: media.createdAt.toISOString(),
    updatedAt: media.updatedAt.toISOString(),
    uploadedBy: media.uploadedBy || undefined,
  };
}

/**
 * Convert Prisma version to ContentVersion
 */
function toContentVersion(version: PrismaContentVersion, field: string): ContentVersion {
  return {
    id: version.id,
    contentId: version.contentId,
    field,
    version: version.version,
    value: version.value,
    createdAt: version.createdAt.toISOString(),
    createdBy: version.createdBy || undefined,
    message: version.message || undefined,
    metadata: version.metadata as Record<string, unknown> | undefined,
  };
}

/**
 * Create Prisma storage adapter
 */
export function createPrismaAdapter(
  options: PrismaAdapterOptions
): StorageAdapter & Partial<VersioningAdapter> & Partial<PublishingAdapter> {
  const {
    prisma,
    userId,
    versioning = true,
    maxVersions = 50,
  } = options;

  /**
   * Save a new version
   */
  async function saveVersion(contentId: string, value: string, message?: string): Promise<void> {
    if (!versioning) return;

    const versionCount = await prisma.liteCMSContentVersion.count({
      where: { contentId },
    });

    await prisma.liteCMSContentVersion.create({
      data: {
        id: generateId(),
        contentId,
        version: versionCount + 1,
        value,
        message,
        createdAt: new Date(),
        createdBy: userId,
      },
    });

    // Cleanup old versions if exceeding max
    // Note: In a real implementation, you'd want to delete oldest versions
  }

  const adapter: StorageAdapter & Partial<VersioningAdapter> & Partial<PublishingAdapter> = {
    // ========================================================================
    // StorageAdapter methods
    // ========================================================================

    async get(field: string): Promise<ContentData | null> {
      const content = await prisma.liteCMSContent.findUnique({
        where: { field },
      });
      return content ? toContentData(content) : null;
    },

    async getAll(): Promise<Record<string, ContentData>> {
      const contents = await prisma.liteCMSContent.findMany();
      return Object.fromEntries(
        contents.map((c) => [c.field, toContentData(c)])
      );
    },

    async set(field: string, value: string): Promise<ContentData> {
      const existing = await prisma.liteCMSContent.findUnique({
        where: { field },
      });

      const newVersion = existing ? existing.version + 1 : 1;

      const content = await prisma.liteCMSContent.upsert({
        where: { field },
        create: {
          id: generateId(),
          field,
          value,
          type: "simple",
          version: 1,
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        },
        update: {
          value,
          version: newVersion,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      // Save version if content changed
      if (versioning && (!existing || existing.value !== value)) {
        await saveVersion(content.id, value);
      }

      return toContentData(content);
    },

    async delete(field: string): Promise<void> {
      await prisma.liteCMSContent.delete({
        where: { field },
      });
    },

    // ========================================================================
    // VersioningAdapter methods
    // ========================================================================

    async getVersions(
      field: string,
      options?: { limit?: number; offset?: number }
    ): Promise<ContentVersion[]> {
      const content = await prisma.liteCMSContent.findUnique({
        where: { field },
      });

      if (!content) return [];

      const versions = await prisma.liteCMSContentVersion.findMany({
        where: { contentId: content.id },
        orderBy: { version: "desc" },
        skip: options?.offset,
        take: options?.limit,
      });

      return versions.map((v) => toContentVersion(v, field));
    },

    async getVersion(field: string, version: number): Promise<ContentVersion | null> {
      const content = await prisma.liteCMSContent.findUnique({
        where: { field },
      });

      if (!content) return null;

      const versionRecord = await prisma.liteCMSContentVersion.findFirst({
        where: { contentId: content.id, version },
      });

      return versionRecord ? toContentVersion(versionRecord, field) : null;
    },

    async restore(field: string, version: number): Promise<ContentData> {
      const versionRecord = await adapter.getVersion?.(field, version);
      if (!versionRecord) {
        throw new Error(`Version ${version} not found for field ${field}`);
      }

      return adapter.set(field, versionRecord.value);
    },

    async compare(field: string, v1: number, v2: number): Promise<DiffResult[]> {
      const version1 = await adapter.getVersion?.(field, v1);
      const version2 = await adapter.getVersion?.(field, v2);

      if (!version1 || !version2) {
        throw new Error("One or both versions not found");
      }

      return diffText(version1.value, version2.value);
    },

    async getLatestVersion(field: string): Promise<number> {
      const content = await prisma.liteCMSContent.findUnique({
        where: { field },
      });

      return content?.version || 0;
    },

    // ========================================================================
    // PublishingAdapter methods
    // ========================================================================

    async publish(field: string): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          status: "published",
          publishedAt: new Date(),
          publishedBy: userId,
          draftValue: null,
          scheduledAt: null,
        },
      });

      return toPublishableContent(content);
    },

    async unpublish(field: string): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          status: "draft",
          publishedAt: null,
          publishedBy: null,
        },
      });

      return toPublishableContent(content);
    },

    async schedule(field: string, date: Date): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          status: "scheduled",
          scheduledAt: date,
        },
      });

      return toPublishableContent(content);
    },

    async cancelSchedule(field: string): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          status: "draft",
          scheduledAt: null,
        },
      });

      return toPublishableContent(content);
    },

    async saveDraft(field: string, value: string): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          draftValue: value,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      });

      return toPublishableContent(content);
    },

    async getScheduled(): Promise<PublishableContent[]> {
      const contents = await prisma.liteCMSContent.findMany({
        where: { status: "scheduled" },
        orderBy: { scheduledAt: "asc" },
      });

      return contents.map(toPublishableContent);
    },

    async archive(field: string): Promise<PublishableContent> {
      const content = await prisma.liteCMSContent.update({
        where: { field },
        data: {
          status: "archived",
        },
      });

      return toPublishableContent(content);
    },
  };

  return adapter;
}

/**
 * Create Prisma media adapter
 */
export function createPrismaMediaAdapter(
  options: PrismaAdapterOptions
): MediaStorageAdapter {
  const { prisma, userId } = options;

  return {
    async upload(
      file: File | ArrayBuffer | Uint8Array,
      filename: string,
      uploadOptions?: MediaUploadOptions
    ): Promise<MediaFile> {
      // Note: Actual file upload should be handled by your storage service
      // This adapter only manages the database record
      throw new Error(
        "Direct file upload not supported. Use a storage service (S3, Cloudinary) " +
        "and pass the URL to createMediaRecord instead."
      );
    },

    async get(id: string): Promise<MediaFile | null> {
      const media = await prisma.liteCMSMedia.findUnique({
        where: { id },
      });

      return media ? toMediaFile(media) : null;
    },

    async getAll(
      options?: MediaPaginationOptions
    ): Promise<{ files: MediaFile[]; total: number; page: number; totalPages: number }> {
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};
      if (options?.mimeType) {
        where.mimeType = { startsWith: options.mimeType };
      }
      if (options?.search) {
        where.OR = [
          { filename: { contains: options.search, mode: "insensitive" } },
          { originalName: { contains: options.search, mode: "insensitive" } },
          { title: { contains: options.search, mode: "insensitive" } },
        ];
      }

      // Build orderBy
      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "desc";
      const orderBy = { [sortBy]: sortOrder };

      const [media, total] = await Promise.all([
        prisma.liteCMSMedia.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        prisma.liteCMSMedia.count({ where }),
      ]);

      return {
        files: media.map(toMediaFile),
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    },

    async delete(id: string): Promise<void> {
      // Note: Actual file deletion should be handled by your storage service
      await prisma.liteCMSMedia.delete({
        where: { id },
      });
    },

    async update(
      id: string,
      data: Partial<Pick<MediaFile, "alt" | "title" | "metadata">>
    ): Promise<MediaFile> {
      const media = await prisma.liteCMSMedia.update({
        where: { id },
        data: {
          alt: data.alt,
          title: data.title,
          metadata: data.metadata,
          updatedAt: new Date(),
        },
      });

      return toMediaFile(media);
    },
  };
}

/**
 * Helper to create a media record after file upload
 */
export async function createMediaRecord(
  prisma: PrismaClientLike,
  data: Omit<MediaFile, "createdAt" | "updatedAt"> & { uploadedBy?: string }
): Promise<MediaFile> {
  const media = await prisma.liteCMSMedia.create({
    data: {
      id: data.id || generateId(),
      filename: data.filename,
      originalName: data.originalName,
      mimeType: data.mimeType,
      size: data.size,
      url: data.url,
      thumbnailUrl: data.thumbnailUrl,
      width: data.width,
      height: data.height,
      alt: data.alt,
      title: data.title,
      metadata: data.metadata,
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      uploadedBy: data.uploadedBy,
    },
  });

  return toMediaFile(media);
}
