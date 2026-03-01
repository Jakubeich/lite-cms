import { readFileSync, writeFileSync, existsSync } from "fs";
import type { StorageAdapter, ContentData } from "@litecms/core";
import { generateId, getTimestamp } from "@litecms/core";

interface JsonAdapterOptions {
  /**
   * Path to the JSON file
   */
  filePath: string;

  /**
   * Pretty print JSON (default: true in development)
   */
  pretty?: boolean;
}

/**
 * JSON file storage adapter for development and simple deployments
 * Note: This adapter is meant for server-side use only (API routes)
 */
export function createJsonAdapter(options: JsonAdapterOptions): StorageAdapter {
  const { filePath, pretty = process.env.NODE_ENV !== "production" } = options;

  function readData(): Record<string, ContentData> {
    if (!existsSync(filePath)) {
      return {};
    }
    try {
      const content = readFileSync(filePath, "utf-8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  function writeData(data: Record<string, ContentData>): void {
    const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    writeFileSync(filePath, content, "utf-8");
  }

  return {
    async get(field: string): Promise<ContentData | null> {
      const data = readData();
      return data[field] ?? null;
    },

    async getAll(): Promise<Record<string, ContentData>> {
      return readData();
    },

    async set(field: string, value: string): Promise<ContentData> {
      const data = readData();
      const existing = data[field];

      const contentData: ContentData = {
        id: existing?.id ?? generateId(),
        field,
        value,
        updatedAt: getTimestamp(),
      };

      data[field] = contentData;
      writeData(data);

      return contentData;
    },

    async delete(field: string): Promise<void> {
      const data = readData();
      delete data[field];
      writeData(data);
    },
  };
}
