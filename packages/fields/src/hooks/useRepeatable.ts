"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import type { RepeatableItem, RepeatableFieldConfig, RepeatableItemHelpers } from "@litecms/core";
import { debounce } from "@litecms/core";
import {
  createItem,
  updateItem,
  removeItem,
  duplicateItem,
  moveItemUp,
  moveItemDown,
  reorderItems,
  parseItems,
  stringifyItems,
} from "../utils/reorder";

/**
 * useRepeatable hook options
 */
export interface UseRepeatableOptions<T> {
  /** Field configuration */
  config: RepeatableFieldConfig<T>;
  /** Initial items */
  initialItems?: RepeatableItem<T>[];
  /** Initial value as JSON string */
  initialValue?: string;
  /** Callback when items change */
  onChange?: (items: RepeatableItem<T>[], value: string) => void;
  /** Debounce delay for onChange */
  debounceDelay?: number;
}

/**
 * useRepeatable hook return type
 */
export interface UseRepeatableReturn<T> {
  /** Current items */
  items: RepeatableItem<T>[];
  /** Add new item */
  addItem: (data?: Partial<T>) => void;
  /** Remove item by ID */
  removeItem: (id: string) => void;
  /** Update item data */
  updateItem: (id: string, data: Partial<T>) => void;
  /** Duplicate item */
  duplicateItem: (id: string) => void;
  /** Move item up */
  moveUp: (id: string) => void;
  /** Move item down */
  moveDown: (id: string) => void;
  /** Reorder items (for drag and drop) */
  reorder: (fromIndex: number, toIndex: number) => void;
  /** Get helpers for a specific item */
  getHelpers: (id: string) => RepeatableItemHelpers<T>;
  /** Whether can add more items */
  canAdd: boolean;
  /** Whether can remove items */
  canRemove: boolean;
  /** Current value as JSON string */
  value: string;
  /** Set items directly */
  setItems: (items: RepeatableItem<T>[]) => void;
  /** Reset to initial state */
  reset: () => void;
}

/**
 * Hook for managing repeatable field items
 */
export function useRepeatable<T = Record<string, unknown>>(
  options: UseRepeatableOptions<T>
): UseRepeatableReturn<T> {
  const {
    config,
    initialItems,
    initialValue,
    onChange,
    debounceDelay = 500,
  } = options;

  const { minItems = 0, maxItems = Infinity, defaultItem } = config;

  // Parse initial items
  const parsedInitial = useMemo(() => {
    if (initialItems) return initialItems;
    if (initialValue) return parseItems<T>(initialValue);
    return [];
  }, [initialItems, initialValue]);

  const [items, setItemsState] = useState<RepeatableItem<T>[]>(parsedInitial);

  // Debounced onChange
  const debouncedOnChange = useMemo(
    () =>
      debounce((newItems: RepeatableItem<T>[]) => {
        const value = stringifyItems(newItems);
        onChange?.(newItems, value);
      }, debounceDelay),
    [onChange, debounceDelay]
  );

  // Set items with onChange callback
  const setItems = useCallback(
    (newItems: RepeatableItem<T>[]) => {
      setItemsState(newItems);
      debouncedOnChange(newItems);
    },
    [debouncedOnChange]
  );

  // Add new item
  const handleAddItem = useCallback(
    (data?: Partial<T>) => {
      if (items.length >= maxItems) return;

      const itemData = { ...(defaultItem || {}), ...(data || {}) } as T;
      const newItem = createItem(itemData, items.length);
      setItems([...items, newItem]);
    },
    [items, maxItems, defaultItem, setItems]
  );

  // Remove item
  const handleRemoveItem = useCallback(
    (id: string) => {
      if (items.length <= minItems) return;
      setItems(removeItem(items, id));
    },
    [items, minItems, setItems]
  );

  // Update item
  const handleUpdateItem = useCallback(
    (id: string, data: Partial<T>) => {
      setItems(updateItem(items, id, data));
    },
    [items, setItems]
  );

  // Duplicate item
  const handleDuplicateItem = useCallback(
    (id: string) => {
      if (items.length >= maxItems) return;
      setItems(duplicateItem(items, id));
    },
    [items, maxItems, setItems]
  );

  // Move item up
  const handleMoveUp = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index > 0) {
        setItems(moveItemUp(items, index));
      }
    },
    [items, setItems]
  );

  // Move item down
  const handleMoveDown = useCallback(
    (id: string) => {
      const index = items.findIndex((item) => item.id === id);
      if (index < items.length - 1) {
        setItems(moveItemDown(items, index));
      }
    },
    [items, setItems]
  );

  // Reorder items
  const handleReorder = useCallback(
    (fromIndex: number, toIndex: number) => {
      setItems(reorderItems(items, fromIndex, toIndex));
    },
    [items, setItems]
  );

  // Get helpers for item
  const getHelpers = useCallback(
    (id: string): RepeatableItemHelpers<T> => {
      const index = items.findIndex((item) => item.id === id);
      return {
        update: (data: Partial<T>) => handleUpdateItem(id, data),
        remove: () => handleRemoveItem(id),
        moveUp: () => handleMoveUp(id),
        moveDown: () => handleMoveDown(id),
        duplicate: () => handleDuplicateItem(id),
        isFirst: index === 0,
        isLast: index === items.length - 1,
        index,
      };
    },
    [items, handleUpdateItem, handleRemoveItem, handleMoveUp, handleMoveDown, handleDuplicateItem]
  );

  // Reset to initial state
  const reset = useCallback(() => {
    setItemsState(parsedInitial);
  }, [parsedInitial]);

  // Sync with external value changes
  useEffect(() => {
    if (initialValue !== undefined) {
      const newItems = parseItems<T>(initialValue);
      if (JSON.stringify(newItems) !== JSON.stringify(items)) {
        setItemsState(newItems);
      }
    }
  }, [initialValue]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    items,
    addItem: handleAddItem,
    removeItem: handleRemoveItem,
    updateItem: handleUpdateItem,
    duplicateItem: handleDuplicateItem,
    moveUp: handleMoveUp,
    moveDown: handleMoveDown,
    reorder: handleReorder,
    getHelpers,
    canAdd: items.length < maxItems,
    canRemove: items.length > minItems,
    value: stringifyItems(items),
    setItems,
    reset,
  };
}
