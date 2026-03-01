import type { RepeatableItem } from "@litecms/core";
import { generateId, getTimestamp } from "@litecms/core";

/**
 * Reorder items in array (for drag and drop)
 */
export function reorderItems<T>(
  items: RepeatableItem<T>[],
  fromIndex: number,
  toIndex: number
): RepeatableItem<T>[] {
  const result = [...items];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);

  // Update order values
  return result.map((item, index) => ({
    ...item,
    order: index,
    updatedAt: getTimestamp(),
  }));
}

/**
 * Move item up in array
 */
export function moveItemUp<T>(
  items: RepeatableItem<T>[],
  index: number
): RepeatableItem<T>[] {
  if (index <= 0) return items;
  return reorderItems(items, index, index - 1);
}

/**
 * Move item down in array
 */
export function moveItemDown<T>(
  items: RepeatableItem<T>[],
  index: number
): RepeatableItem<T>[] {
  if (index >= items.length - 1) return items;
  return reorderItems(items, index, index + 1);
}

/**
 * Create new repeatable item
 */
export function createItem<T>(
  data: T,
  order: number
): RepeatableItem<T> {
  const now = getTimestamp();
  return {
    id: generateId(),
    order,
    data,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update item data
 */
export function updateItem<T>(
  items: RepeatableItem<T>[],
  id: string,
  data: Partial<T>
): RepeatableItem<T>[] {
  return items.map((item) =>
    item.id === id
      ? {
          ...item,
          data: { ...item.data, ...data },
          updatedAt: getTimestamp(),
        }
      : item
  );
}

/**
 * Remove item from array
 */
export function removeItem<T>(
  items: RepeatableItem<T>[],
  id: string
): RepeatableItem<T>[] {
  const filtered = items.filter((item) => item.id !== id);
  // Re-order remaining items
  return filtered.map((item, index) => ({
    ...item,
    order: index,
  }));
}

/**
 * Duplicate item
 */
export function duplicateItem<T>(
  items: RepeatableItem<T>[],
  id: string
): RepeatableItem<T>[] {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;

  const original = items[index];
  const duplicate = createItem({ ...original.data }, index + 1);

  const result = [...items];
  result.splice(index + 1, 0, duplicate);

  // Re-order all items
  return result.map((item, i) => ({
    ...item,
    order: i,
  }));
}

/**
 * Sort items by order
 */
export function sortByOrder<T>(items: RepeatableItem<T>[]): RepeatableItem<T>[] {
  return [...items].sort((a, b) => a.order - b.order);
}

/**
 * Parse items from JSON value
 */
export function parseItems<T>(value: string | null | undefined): RepeatableItem<T>[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return sortByOrder(parsed);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Stringify items to JSON value
 */
export function stringifyItems<T>(items: RepeatableItem<T>[]): string {
  return JSON.stringify(sortByOrder(items));
}
