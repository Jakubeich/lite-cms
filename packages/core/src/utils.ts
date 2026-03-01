/**
 * Generate a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Debounce function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key in source) {
    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      ) as T[typeof key];
    } else {
      result[key] = source[key] as T[typeof key];
    }
  }
  return result;
}

/**
 * Throttle function - limits execution to once per interval
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  interval: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = interval - (now - lastTime);

    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      fn(...args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        fn(...args);
      }, remaining);
    }
  };
}

/**
 * Reorder array items (for drag and drop)
 */
export function reorderArray<T>(
  array: T[],
  fromIndex: number,
  toIndex: number
): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Move item up in array
 */
export function moveUp<T>(array: T[], index: number): T[] {
  if (index <= 0) return array;
  return reorderArray(array, index, index - 1);
}

/**
 * Move item down in array
 */
export function moveDown<T>(array: T[], index: number): T[] {
  if (index >= array.length - 1) return array;
  return reorderArray(array, index, index + 1);
}

/**
 * Generate a random color for collaboration cursors
 */
export function generateColor(): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#eab308",
    "#84cc16", "#22c55e", "#10b981", "#14b8a6",
    "#06b6d4", "#0ea5e9", "#3b82f6", "#6366f1",
    "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

/**
 * Check if MIME type is image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/**
 * Check if MIME type is video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

/**
 * Check if MIME type is audio
 */
export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

/**
 * Check if MIME type is document
 */
export function isDocument(mimeType: string): boolean {
  const documentTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "text/plain",
    "text/csv",
  ];
  return documentTypes.includes(mimeType);
}

/**
 * Simple text diff (word-based)
 */
export function diffText(oldText: string, newText: string): Array<{ type: "added" | "removed" | "unchanged"; value: string }> {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const result: Array<{ type: "added" | "removed" | "unchanged"; value: string }> = [];

  let i = 0;
  let j = 0;

  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      result.push({ type: "added", value: newWords[j] });
      j++;
    } else if (j >= newWords.length) {
      result.push({ type: "removed", value: oldWords[i] });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      result.push({ type: "unchanged", value: oldWords[i] });
      i++;
      j++;
    } else {
      // Simple approach: mark old as removed, new as added
      result.push({ type: "removed", value: oldWords[i] });
      result.push({ type: "added", value: newWords[j] });
      i++;
      j++;
    }
  }

  return result;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create a field path from parts
 */
export function createFieldPath(...parts: (string | number)[]): string {
  return parts.filter(p => p !== undefined && p !== null && p !== "").join(".");
}

/**
 * Parse a field path into parts
 */
export function parseFieldPath(path: string): string[] {
  return path.split(".").filter(Boolean);
}

/**
 * Get nested value from object by path
 */
export function getByPath<T = unknown>(obj: Record<string, unknown>, path: string): T | undefined {
  const parts = parseFieldPath(path);
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current as T;
}

/**
 * Set nested value in object by path
 */
export function setByPath<T extends Record<string, unknown>>(
  obj: T,
  path: string,
  value: unknown
): T {
  const parts = parseFieldPath(path);
  const result = { ...obj } as Record<string, unknown>;
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== "object") {
      current[part] = {};
    } else {
      current[part] = { ...(current[part] as Record<string, unknown>) };
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result as T;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Simple formatting tag definition
 */
export interface FormattingTag {
  /** Opening tag pattern (regex) */
  pattern: RegExp;
  /** HTML tag to use for replacement */
  tag: string;
  /** CSS class to apply */
  className?: string;
}

/**
 * Default formatting tags for simple text formatting
 * Supports: **bold**, <bold>, <b>, <strong>
 */
export const DEFAULT_FORMATTING_TAGS: FormattingTag[] = [
  // Markdown **bold**
  { pattern: /\*\*([^*]+)\*\*/g, tag: "strong", className: "litecms-bold" },
  // HTML <bold> (normalize to strong)
  { pattern: /<bold>(.*?)<\/bold>/gi, tag: "strong", className: "litecms-bold" },
  // HTML <b> (normalize to strong)
  { pattern: /<b>(.*?)<\/b>/gi, tag: "strong", className: "litecms-bold" },
];

/**
 * Parse simple formatting tags in text
 * Returns an array of segments with type and content
 *
 * @example
 * parseSimpleFormatting("Hello **world**!")
 * // Returns: [
 * //   { type: "text", content: "Hello " },
 * //   { type: "strong", content: "world", className: "litecms-bold" },
 * //   { type: "text", content: "!" }
 * // ]
 */
export interface FormattedSegment {
  type: "text" | "strong" | "em" | "code" | string;
  content: string;
  className?: string;
}

export function parseSimpleFormatting(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tags?: FormattingTag[]
): FormattedSegment[] {
  if (!text) return [];

  // Use a simple marker-based approach to avoid regex position issues
  // First, normalize all bold variants to a unique marker
  const MARKER_START = "\u0000BOLD_START\u0000";
  const MARKER_END = "\u0000BOLD_END\u0000";

  let processed = text;

  // Replace all bold variants with markers (order matters - check longer patterns first)
  // **text** markdown
  processed = processed.replace(/\*\*([^*]+)\*\*/g, `${MARKER_START}$1${MARKER_END}`);
  // <bold>text</bold>
  processed = processed.replace(/<bold>(.*?)<\/bold>/gi, `${MARKER_START}$1${MARKER_END}`);
  // <b>text</b>
  processed = processed.replace(/<b>(.*?)<\/b>/gi, `${MARKER_START}$1${MARKER_END}`);
  // <strong>text</strong>
  processed = processed.replace(/<strong>(.*?)<\/strong>/gi, `${MARKER_START}$1${MARKER_END}`);

  // If no markers were added, return as single text segment
  if (!processed.includes(MARKER_START)) {
    return [{ type: "text", content: text }];
  }

  // Split by markers and build segments
  const segments: FormattedSegment[] = [];
  const parts = processed.split(MARKER_START);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (i === 0) {
      // First part is always plain text (before any marker)
      if (part) {
        segments.push({ type: "text", content: part });
      }
    } else {
      // This part starts after a MARKER_START, so it contains bold content + maybe text after
      const endIndex = part.indexOf(MARKER_END);
      if (endIndex !== -1) {
        const boldContent = part.slice(0, endIndex);
        const afterContent = part.slice(endIndex + MARKER_END.length);

        if (boldContent) {
          segments.push({ type: "strong", content: boldContent, className: "litecms-bold" });
        }
        if (afterContent) {
          segments.push({ type: "text", content: afterContent });
        }
      } else {
        // No end marker found (shouldn't happen with valid input)
        if (part) {
          segments.push({ type: "text", content: part });
        }
      }
    }
  }

  return segments;
}

/**
 * Check if text contains any formatting tags
 */
export function hasFormatting(
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _tags?: FormattingTag[]
): boolean {
  if (!text) return false;

  // Check for any bold formatting variants
  return (
    /\*\*[^*]+\*\*/.test(text) ||
    /<bold>.*?<\/bold>/i.test(text) ||
    /<b>.*?<\/b>/i.test(text) ||
    /<strong>.*?<\/strong>/i.test(text)
  );
}
