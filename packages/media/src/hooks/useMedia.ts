"use client";

import { useState, useCallback, useEffect } from "react";
import type { MediaFile, MediaPaginationOptions, MediaUploadOptions } from "@litecms/core";

/**
 * useMedia hook options
 */
export interface UseMediaOptions {
  /** API endpoint for media operations */
  apiUrl: string;
  /** Initial fetch on mount */
  fetchOnMount?: boolean;
  /** Default pagination options */
  defaultPagination?: MediaPaginationOptions;
}

/**
 * useMedia hook return type
 */
export interface UseMediaReturn {
  /** All loaded media files */
  files: MediaFile[];
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  /** Total number of files */
  total: number;
  /** Current page */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Upload a file */
  upload: (file: File, options?: MediaUploadOptions) => Promise<MediaFile>;
  /** Upload multiple files */
  uploadMultiple: (files: File[], options?: MediaUploadOptions) => Promise<MediaFile[]>;
  /** Delete a file */
  deleteFile: (id: string) => Promise<void>;
  /** Update file metadata */
  updateFile: (id: string, data: Partial<Pick<MediaFile, "alt" | "title" | "metadata">>) => Promise<MediaFile>;
  /** Refresh files list */
  refresh: (options?: MediaPaginationOptions) => Promise<void>;
  /** Go to page */
  goToPage: (page: number) => Promise<void>;
  /** Search files */
  search: (query: string) => Promise<void>;
  /** Filter by MIME type */
  filterByType: (mimeType: string | null) => Promise<void>;
}

/**
 * Hook for managing media files
 */
export function useMedia(options: UseMediaOptions): UseMediaReturn {
  const { apiUrl, fetchOnMount = true, defaultPagination = {} } = options;

  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<MediaPaginationOptions>(defaultPagination);

  /**
   * Fetch files from API
   */
  const refresh = useCallback(
    async (paginationOptions?: MediaPaginationOptions) => {
      setIsLoading(true);
      setError(null);

      const opts = { ...currentOptions, ...paginationOptions };
      setCurrentOptions(opts);

      try {
        const params = new URLSearchParams();
        if (opts.page) params.set("page", String(opts.page));
        if (opts.limit) params.set("limit", String(opts.limit));
        if (opts.sortBy) params.set("sortBy", opts.sortBy);
        if (opts.sortOrder) params.set("sortOrder", opts.sortOrder);
        if (opts.mimeType) params.set("mimeType", opts.mimeType);
        if (opts.search) params.set("search", opts.search);

        const response = await fetch(`${apiUrl}?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch media files");
        }

        const data = await response.json();
        setFiles(data.files);
        setTotal(data.total);
        setPage(data.page);
        setTotalPages(data.totalPages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl, currentOptions]
  );

  /**
   * Upload a single file
   */
  const upload = useCallback(
    async (file: File, uploadOptions?: MediaUploadOptions): Promise<MediaFile> => {
      setIsLoading(true);
      setError(null);

      try {
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
          throw new Error(errorData.error || "Failed to upload file");
        }

        const mediaFile = await response.json();

        // Add to local state
        setFiles((prev) => [mediaFile, ...prev]);
        setTotal((prev) => prev + 1);

        return mediaFile;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  /**
   * Upload multiple files
   */
  const uploadMultiple = useCallback(
    async (filesToUpload: File[], uploadOptions?: MediaUploadOptions): Promise<MediaFile[]> => {
      const results: MediaFile[] = [];
      for (const file of filesToUpload) {
        const result = await upload(file, uploadOptions);
        results.push(result);
      }
      return results;
    },
    [upload]
  );

  /**
   * Delete a file
   */
  const deleteFile = useCallback(
    async (id: string): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete file");
        }

        // Remove from local state
        setFiles((prev) => prev.filter((f) => f.id !== id));
        setTotal((prev) => prev - 1);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  /**
   * Update file metadata
   */
  const updateFile = useCallback(
    async (
      id: string,
      data: Partial<Pick<MediaFile, "alt" | "title" | "metadata">>
    ): Promise<MediaFile> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(apiUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, ...data }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update file");
        }

        const updated = await response.json();

        // Update local state
        setFiles((prev) => prev.map((f) => (f.id === id ? updated : f)));

        return updated;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [apiUrl]
  );

  /**
   * Go to specific page
   */
  const goToPage = useCallback(
    async (newPage: number) => {
      await refresh({ page: newPage });
    },
    [refresh]
  );

  /**
   * Search files
   */
  const search = useCallback(
    async (query: string) => {
      await refresh({ search: query, page: 1 });
    },
    [refresh]
  );

  /**
   * Filter by MIME type
   */
  const filterByType = useCallback(
    async (mimeType: string | null) => {
      await refresh({ mimeType: mimeType || undefined, page: 1 });
    },
    [refresh]
  );

  // Initial fetch
  useEffect(() => {
    if (fetchOnMount) {
      refresh();
    }
  }, [fetchOnMount]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    files,
    isLoading,
    error,
    total,
    page,
    totalPages,
    upload,
    uploadMultiple,
    deleteFile,
    updateFile,
    refresh,
    goToPage,
    search,
    filterByType,
  };
}
