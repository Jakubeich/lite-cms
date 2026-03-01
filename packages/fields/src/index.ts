// Re-export types from core
export type {
  RepeatableItem,
  RepeatableFieldConfig,
  RepeatableItemHelpers,
  FieldSchema,
  FieldValidation,
} from "@litecms/core";

// Components
export { RepeatableField } from "./components/RepeatableField";
export type { RepeatableFieldProps } from "./components/RepeatableField";

export { RepeatableItemWrapper } from "./components/RepeatableItem";
export type { RepeatableItemWrapperProps } from "./components/RepeatableItem";

export { DragHandle } from "./components/DragHandle";
export type { DragHandleProps } from "./components/DragHandle";

// Hooks
export { useRepeatable } from "./hooks/useRepeatable";
export type { UseRepeatableOptions, UseRepeatableReturn } from "./hooks/useRepeatable";

// Utilities
export {
  reorderItems,
  moveItemUp,
  moveItemDown,
  createItem,
  updateItem,
  removeItem,
  duplicateItem,
  sortByOrder,
  parseItems,
  stringifyItems,
} from "./utils/reorder";

export {
  validateValue,
  validateObject,
  hasFieldError,
  getFieldError,
} from "./utils/validation";
export type { ValidationError } from "./utils/validation";
