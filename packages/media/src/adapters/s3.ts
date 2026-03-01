import type {
  MediaFile,
  MediaStorageAdapter,
  MediaUploadOptions,
  MediaPaginationOptions,
} from "@litecms/core";
import { generateId, getTimestamp } from "@litecms/core";
import { generateFilename, validateFile, DEFAULT_UPLOAD_OPTIONS } from "../utils/validation";

/**
 * S3-compatible adapter options
 */
export interface S3AdapterOptions {
  /** S3 bucket name */
  bucket: string;
  /** AWS region */
  region: string;
  /** Access key ID */
  accessKeyId: string;
  /** Secret access key */
  secretAccessKey: string;
  /** Custom endpoint (for S3-compatible services like Cloudflare R2, MinIO) */
  endpoint?: string;
  /** Public URL prefix (for CDN or custom domain) */
  publicUrl?: string;
  /** Path prefix within bucket */
  pathPrefix?: string;
  /** Use path-style URLs (required for some S3-compatible services) */
  forcePathStyle?: boolean;
}

/**
 * S3 client interface (minimal subset we need)
 */
interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}

/**
 * Create an S3-compatible media adapter
 *
 * Note: This adapter requires @aws-sdk/client-s3 to be installed.
 * It supports AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 */
export function createS3MediaAdapter(options: S3AdapterOptions): MediaStorageAdapter {
  const {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint,
    publicUrl,
    pathPrefix = "media",
    forcePathStyle = false,
  } = options;

  // Metadata is stored in a JSON file in the bucket
  const metadataKey = `${pathPrefix}/_metadata.json`;

  // Lazy-loaded S3 client
  let s3Client: S3ClientLike | null = null;

  async function getS3Client(): Promise<S3ClientLike> {
    if (s3Client) return s3Client;

    // Dynamic import - requires @aws-sdk/client-s3 to be installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awsS3 = await import("@aws-sdk/client-s3") as any;
    s3Client = new awsS3.S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      endpoint,
      forcePathStyle,
    }) as S3ClientLike;

    return s3Client;
  }

  async function readMetadata(): Promise<Record<string, MediaFile>> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awsS3 = await import("@aws-sdk/client-s3") as any;
      const client = await getS3Client();
      const response = await client.send(
        new awsS3.GetObjectCommand({ Bucket: bucket, Key: metadataKey })
      ) as { Body?: { transformToString(): Promise<string> } };

      if (response.Body) {
        const content = await response.Body.transformToString();
        return JSON.parse(content);
      }
      return {};
    } catch {
      return {};
    }
  }

  async function writeMetadata(data: Record<string, MediaFile>): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awsS3 = await import("@aws-sdk/client-s3") as any;
    const client = await getS3Client();
    await client.send(
      new awsS3.PutObjectCommand({
        Bucket: bucket,
        Key: metadataKey,
        Body: JSON.stringify(data, null, 2),
        ContentType: "application/json",
      })
    );
  }

  function getPublicUrl(key: string): string {
    if (publicUrl) {
      return `${publicUrl}/${key}`;
    }
    if (endpoint) {
      return `${endpoint}/${bucket}/${key}`;
    }
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  return {
    async upload(
      file: File | ArrayBuffer | Uint8Array,
      filename: string,
      uploadOptions?: MediaUploadOptions
    ): Promise<MediaFile> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awsS3 = await import("@aws-sdk/client-s3") as any;
      const client = await getS3Client();
      const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...uploadOptions };

      // Validate if File object
      if (file instanceof File) {
        const validation = validateFile(file, opts);
        if (!validation.valid) {
          throw new Error(validation.error);
        }
      }

      // Generate unique filename
      const uniqueFilename = generateFilename(filename);
      const folder = opts.folder || "uploads";
      const key = `${pathPrefix}/${folder}/${uniqueFilename}`;

      // Get uint8 array
      let uint8: Uint8Array;
      let mimeType: string;
      let size: number;

      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        uint8 = new Uint8Array(arrayBuffer);
        mimeType = file.type;
        size = file.size;
      } else if (file instanceof ArrayBuffer) {
        uint8 = new Uint8Array(file);
        mimeType = "application/octet-stream";
        size = uint8.length;
      } else {
        uint8 = file;
        mimeType = "application/octet-stream";
        size = uint8.length;
      }

      // Upload to S3
      await client.send(
        new awsS3.PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: uint8,
          ContentType: mimeType,
        })
      );

      // Create media file record
      const mediaFile: MediaFile = {
        id: generateId(),
        filename: uniqueFilename,
        originalName: filename,
        mimeType,
        size,
        url: getPublicUrl(key),
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };

      // Save metadata
      const metadata = await readMetadata();
      metadata[mediaFile.id] = mediaFile;
      await writeMetadata(metadata);

      return mediaFile;
    },

    async get(id: string): Promise<MediaFile | null> {
      const metadata = await readMetadata();
      return metadata[id] || null;
    },

    async getAll(
      paginationOptions?: MediaPaginationOptions
    ): Promise<{ files: MediaFile[]; total: number; page: number; totalPages: number }> {
      const metadata = await readMetadata();
      let files = Object.values(metadata);

      // Filter by mimeType
      if (paginationOptions?.mimeType) {
        files = files.filter((f) => f.mimeType.startsWith(paginationOptions.mimeType!));
      }

      // Search by filename
      if (paginationOptions?.search) {
        const search = paginationOptions.search.toLowerCase();
        files = files.filter(
          (f) =>
            f.filename.toLowerCase().includes(search) ||
            f.originalName.toLowerCase().includes(search)
        );
      }

      // Sort
      const sortBy = paginationOptions?.sortBy || "createdAt";
      const sortOrder = paginationOptions?.sortOrder || "desc";
      files.sort((a, b) => {
        const aVal = a[sortBy] ?? "";
        const bVal = b[sortBy] ?? "";
        if (sortOrder === "asc") {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        }
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      });

      // Paginate
      const total = files.length;
      const page = paginationOptions?.page || 1;
      const limit = paginationOptions?.limit || 20;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      files = files.slice(start, start + limit);

      return { files, total, page, totalPages };
    },

    async delete(id: string): Promise<void> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awsS3 = await import("@aws-sdk/client-s3") as any;
      const client = await getS3Client();
      const metadata = await readMetadata();
      const file = metadata[id];

      if (!file) {
        throw new Error(`Media file not found: ${id}`);
      }

      // Extract key from URL
      const url = new URL(file.url);
      const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

      // Delete from S3
      await client.send(
        new awsS3.DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );

      // Delete metadata
      delete metadata[id];
      await writeMetadata(metadata);
    },

    async update(
      id: string,
      data: Partial<Pick<MediaFile, "alt" | "title" | "metadata">>
    ): Promise<MediaFile> {
      const metadata = await readMetadata();
      const file = metadata[id];

      if (!file) {
        throw new Error(`Media file not found: ${id}`);
      }

      const updated: MediaFile = {
        ...file,
        ...data,
        updatedAt: getTimestamp(),
      };

      metadata[id] = updated;
      await writeMetadata(metadata);

      return updated;
    },

    async getUrl(id: string, expiresIn: number = 3600): Promise<string> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const awsS3 = await import("@aws-sdk/client-s3") as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const presigner = await import("@aws-sdk/s3-request-presigner") as any;
      const client = await getS3Client();
      const metadata = await readMetadata();
      const file = metadata[id];

      if (!file) {
        throw new Error(`Media file not found: ${id}`);
      }

      // Extract key from URL
      const url = new URL(file.url);
      const key = url.pathname.startsWith("/") ? url.pathname.slice(1) : url.pathname;

      const command = new awsS3.GetObjectCommand({
        Bucket: bucket,
        Key: key,
      });

      return presigner.getSignedUrl(client, command, {
        expiresIn,
      });
    },
  };
}
