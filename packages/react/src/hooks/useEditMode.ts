"use client";

import { useCallback } from "react";
import { useCMSContext } from "../context/CMSContext";

interface UseEditModeReturn {
  /**
   * Whether edit mode is currently enabled
   */
  isEditMode: boolean;

  /**
   * Whether the current user is an admin
   */
  isAdmin: boolean;

  /**
   * Whether editing is possible (admin + edit mode)
   */
  canEdit: boolean;

  /**
   * Enable edit mode
   */
  enableEditMode: () => void;

  /**
   * Disable edit mode
   */
  disableEditMode: () => void;

  /**
   * Toggle edit mode
   */
  toggleEditMode: () => void;

  /**
   * Set edit mode to a specific value
   */
  setEditMode: (enabled: boolean) => void;
}

/**
 * Hook for controlling edit mode
 */
export function useEditMode(): UseEditModeReturn {
  const { state, auth, setEditMode } = useCMSContext();

  const enableEditMode = useCallback(() => {
    setEditMode(true);
  }, [setEditMode]);

  const disableEditMode = useCallback(() => {
    setEditMode(false);
  }, [setEditMode]);

  const toggleEditMode = useCallback(() => {
    setEditMode(!state.isEditMode);
  }, [setEditMode, state.isEditMode]);

  return {
    isEditMode: state.isEditMode,
    isAdmin: auth.isAdmin,
    canEdit: auth.isAdmin && state.isEditMode,
    enableEditMode,
    disableEditMode,
    toggleEditMode,
    setEditMode,
  };
}
