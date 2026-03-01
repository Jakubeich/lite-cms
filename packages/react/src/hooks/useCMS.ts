"use client";

import { useCallback } from "react";
import { useCMSContext } from "../context/CMSContext";
import type { ContentData } from "@litecms/core";

interface UseCMSReturn {
  /**
   * All content data
   */
  content: Record<string, ContentData>;

  /**
   * Whether content is loading
   */
  isLoading: boolean;

  /**
   * Error message if any
   */
  error: string | null;

  /**
   * Get content value for a field
   */
  getContent: (field: string) => string | null;

  /**
   * Get full content data for a field
   */
  getContentData: (field: string) => ContentData | null;

  /**
   * Update content for a field
   */
  updateContent: (field: string, value: string) => Promise<void>;

  /**
   * Delete content for a field
   */
  deleteContent: (field: string) => Promise<void>;

  /**
   * Refresh content from storage
   */
  refresh: () => void;
}

/**
 * Hook for accessing CMS content and operations
 */
export function useCMS(): UseCMSReturn {
  const { state, getContent, updateContent, deleteContent } = useCMSContext();

  const getContentData = useCallback(
    (field: string): ContentData | null => {
      return state.content[field] ?? null;
    },
    [state.content]
  );

  const refresh = useCallback(() => {
    // Trigger a re-fetch by dispatching a loading state
    // This will be implemented when we add proper refresh logic
    window.location.reload();
  }, []);

  return {
    content: state.content,
    isLoading: state.isLoading,
    error: state.error,
    getContent,
    getContentData,
    updateContent,
    deleteContent,
    refresh,
  };
}
