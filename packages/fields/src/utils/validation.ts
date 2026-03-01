import type { FieldSchema, FieldValidation } from "@litecms/core";

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a single value against schema
 */
export function validateValue(
  value: unknown,
  schema: FieldSchema,
  fieldPath: string = ""
): ValidationError[] {
  const errors: ValidationError[] = [];
  const { type, required, validation, fields, items } = schema;

  // Check required
  if (required && (value === undefined || value === null || value === "")) {
    errors.push({
      field: fieldPath,
      message: `${schema.label || fieldPath} is required`,
    });
    return errors;
  }

  // Skip validation if value is empty and not required
  if (value === undefined || value === null || value === "") {
    return errors;
  }

  // Type-specific validation
  switch (type) {
    case "string":
    case "richtext":
      if (typeof value !== "string") {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be a string`,
        });
        break;
      }
      errors.push(...validateString(value, validation, fieldPath, schema.label));
      break;

    case "number":
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (typeof numValue !== "number" || isNaN(numValue)) {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be a number`,
        });
        break;
      }
      errors.push(...validateNumber(numValue, validation, fieldPath, schema.label));
      break;

    case "boolean":
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be a boolean`,
        });
      }
      break;

    case "date":
      const dateValue = value instanceof Date ? value : new Date(value as string);
      if (isNaN(dateValue.getTime())) {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be a valid date`,
        });
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be an object`,
        });
        break;
      }
      // Validate nested fields
      if (fields) {
        for (const [key, fieldSchema] of Object.entries(fields)) {
          const nestedValue = (value as Record<string, unknown>)[key];
          const nestedPath = fieldPath ? `${fieldPath}.${key}` : key;
          errors.push(...validateValue(nestedValue, fieldSchema, nestedPath));
        }
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be an array`,
        });
        break;
      }
      // Validate array items
      if (items) {
        for (let i = 0; i < value.length; i++) {
          const itemPath = `${fieldPath}[${i}]`;
          errors.push(...validateValue(value[i], items, itemPath));
        }
      }
      break;

    case "media":
      // Media is stored as URL string
      if (typeof value !== "string") {
        errors.push({
          field: fieldPath,
          message: `${schema.label || fieldPath} must be a valid media URL`,
        });
      }
      break;
  }

  // Custom validation
  if (validation?.custom && typeof validation.custom === "function") {
    const customError = validation.custom(value);
    if (customError) {
      errors.push({
        field: fieldPath,
        message: customError,
      });
    }
  }

  return errors;
}

/**
 * Validate string value
 */
function validateString(
  value: string,
  validation: FieldValidation | undefined,
  fieldPath: string,
  label?: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = label || fieldPath;

  if (!validation) return errors;

  if (validation.minLength !== undefined && value.length < validation.minLength) {
    errors.push({
      field: fieldPath,
      message: `${name} must be at least ${validation.minLength} characters`,
    });
  }

  if (validation.maxLength !== undefined && value.length > validation.maxLength) {
    errors.push({
      field: fieldPath,
      message: `${name} must be at most ${validation.maxLength} characters`,
    });
  }

  if (validation.pattern) {
    const regex = new RegExp(validation.pattern);
    if (!regex.test(value)) {
      errors.push({
        field: fieldPath,
        message: `${name} format is invalid`,
      });
    }
  }

  return errors;
}

/**
 * Validate number value
 */
function validateNumber(
  value: number,
  validation: FieldValidation | undefined,
  fieldPath: string,
  label?: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  const name = label || fieldPath;

  if (!validation) return errors;

  if (validation.min !== undefined && value < validation.min) {
    errors.push({
      field: fieldPath,
      message: `${name} must be at least ${validation.min}`,
    });
  }

  if (validation.max !== undefined && value > validation.max) {
    errors.push({
      field: fieldPath,
      message: `${name} must be at most ${validation.max}`,
    });
  }

  return errors;
}

/**
 * Validate entire object against schema
 */
export function validateObject(
  data: Record<string, unknown>,
  schema: Record<string, FieldSchema>
): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [key, fieldSchema] of Object.entries(schema)) {
    const value = data[key];
    errors.push(...validateValue(value, fieldSchema, key));
  }

  return errors;
}

/**
 * Check if validation errors exist for a specific field
 */
export function hasFieldError(errors: ValidationError[], fieldPath: string): boolean {
  return errors.some((e) => e.field === fieldPath || e.field.startsWith(`${fieldPath}.`));
}

/**
 * Get error message for a specific field
 */
export function getFieldError(errors: ValidationError[], fieldPath: string): string | null {
  const error = errors.find((e) => e.field === fieldPath);
  return error?.message || null;
}
