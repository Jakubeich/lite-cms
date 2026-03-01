import type {
  MediaFile,
  MediaStorageAdapter,
  MediaUploadOptions,
  MediaPaginationOptions,
} from "@litecms/core";
import { generateId, getTimestamp } from "@litecms/core";
import { generateFilename, validateFile, DEFAULT_UPLOAD_OPTIONS } from "../utils/validation";

/**
 * Local filesystem adapter options
 */
export interface LocalAdapterOptions {
  /** Base directory for uploads (relative to project root) */
  uploadDir: string;
  /** Public URL prefix */
  publicPath: string;
  /** Metadata storage file path */
  metadataFile?: string;
}

/**
 * Create a local filesystem media adapter
 *
 * Note: This adapter is designed for Next.js API routes.
 * File operations use dynamic imports for server-side only.
 */
export function createLocalMediaAdapter(
  options: LocalAdapterOptions
): MediaStorageAdapter {
  const { uploadDir, publicPath, metadataFile } = options;
  const metaPath = metadataFile || `${uploadDir}/media-metadata.json`;

  // Helper to read metadata
  async function readMetadata(): Promise<Record<string, MediaFile>> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const fullPath = path.join(process.cwd(), metaPath);
      const content = await fs.readFile(fullPath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  // Helper to write metadata
  async function writeMetadata(data: Record<string, MediaFile>): Promise<void> {
    const fs = await import("fs/promises");
    const path = await import("path");
    const fullPath = path.join(process.cwd(), metaPath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, JSON.stringify(data, null, 2), "utf-8");
  }

  return {
    async upload(
      file: File | ArrayBuffer | Uint8Array,
      filename: string,
      uploadOptions?: MediaUploadOptions
    ): Promise<MediaFile> {
      const fs = await import("fs/promises");
      const path = await import("path");
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
      const relativePath = `${folder}/${uniqueFilename}`;
      const fullPath = path.join(process.cwd(), uploadDir, relativePath);

      // Ensure directory exists
      await fs.mkdir(path.dirname(fullPath), { recursive: true });

      // Write file
      let uint8: Uint8Array;
      if (file instanceof File) {
        const arrayBuffer = await file.arrayBuffer();
        uint8 = new Uint8Array(arrayBuffer);
      } else if (file instanceof ArrayBuffer) {
        uint8 = new Uint8Array(file);
      } else {
        uint8 = file;
      }

      await fs.writeFile(fullPath, uint8);

      // Get file stats
      const stats = await fs.stat(fullPath);

      // Create media file record
      const mediaFile: MediaFile = {
        id: generateId(),
        filename: uniqueFilename,
        originalName: filename,
        mimeType: file instanceof File ? file.type : "application/octet-stream",
        size: stats.size,
        url: `${publicPath}/${relativePath}`,
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
      options?: MediaPaginationOptions
    ): Promise<{ files: MediaFile[]; total: number; page: number; totalPages: number }> {
      const metadata = await readMetadata();
      let files = Object.values(metadata);

      // Filter by mimeType
      if (options?.mimeType) {
        files = files.filter((f) => f.mimeType.startsWith(options.mimeType!));
      }

      // Search by filename
      if (options?.search) {
        const search = options.search.toLowerCase();
        files = files.filter(
          (f) =>
            f.filename.toLowerCase().includes(search) ||
            f.originalName.toLowerCase().includes(search)
        );
      }

      // Sort
      const sortBy = options?.sortBy || "createdAt";
      const sortOrder = options?.sortOrder || "desc";
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
      const page = options?.page || 1;
      const limit = options?.limit || 20;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      files = files.slice(start, start + limit);

      return { files, total, page, totalPages };
    },

    async delete(id: string): Promise<void> {
      const fs = await import("fs/promises");
      const path = await import("path");
      const metadata = await readMetadata();
      const file = metadata[id];

      if (!file) {
        throw new Error(`Media file not found: ${id}`);
      }

      // Delete physical file
      const relativePath = file.url.replace(publicPath, "");
      const fullPath = path.join(process.cwd(), uploadDir, relativePath);

      try {
        await fs.unlink(fullPath);
      } catch {
        // File might not exist, continue with metadata deletion
      }

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
  };
}
