import type { StorageAdapter, ContentData } from "@litecms/core";

interface ApiRequest {
  method: string;
  url: string;
  body?: unknown;
  json?: () => Promise<unknown>;
}

interface ApiResponse {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
}

/**
 * Create an API handler for Next.js App Router (route.ts)
 */
export function createApiHandler(adapter: StorageAdapter) {
  return {
    /**
     * Handle GET request - get all content or specific field
     */
    async GET(request: Request): Promise<Response> {
      const url = new URL(request.url);
      const field = url.searchParams.get("field");

      try {
        if (field) {
          const data = await adapter.get(field);
          if (!data) {
            return Response.json({ error: "Not found" }, { status: 404 });
          }
          return Response.json(data);
        }

        const allData = await adapter.getAll();
        return Response.json(allData);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Internal error" },
          { status: 500 }
        );
      }
    },

    /**
     * Handle POST request - create or update content
     */
    async POST(request: Request): Promise<Response> {
      try {
        const body = (await request.json()) as { field?: string; value?: string };

        if (!body.field || typeof body.value !== "string") {
          return Response.json(
            { error: "Missing field or value" },
            { status: 400 }
          );
        }

        const data = await adapter.set(body.field, body.value);
        return Response.json(data);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Internal error" },
          { status: 500 }
        );
      }
    },

    /**
     * Handle DELETE request - delete content
     */
    async DELETE(request: Request): Promise<Response> {
      try {
        const body = (await request.json()) as { field?: string };

        if (!body.field) {
          return Response.json({ error: "Missing field" }, { status: 400 });
        }

        await adapter.delete(body.field);
        return Response.json({ success: true });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Internal error" },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create an API handler for Next.js Pages Router (api/cms.ts)
 * Compatible with { req, res } pattern
 */
export function createPagesApiHandler(adapter: StorageAdapter) {
  return async function handler(
    req: { method?: string; query?: Record<string, unknown>; body?: unknown },
    res: {
      status: (code: number) => { json: (data: unknown) => void };
      json: (data: unknown) => void;
    }
  ) {
    try {
      switch (req.method) {
        case "GET": {
          const field = req.query?.field as string | undefined;
          if (field) {
            const data = await adapter.get(field);
            if (!data) {
              return res.status(404).json({ error: "Not found" });
            }
            return res.json(data);
          }
          const allData = await adapter.getAll();
          return res.json(allData);
        }

        case "POST": {
          const body = req.body as { field?: string; value?: string };
          if (!body.field || typeof body.value !== "string") {
            return res.status(400).json({ error: "Missing field or value" });
          }
          const data = await adapter.set(body.field, body.value);
          return res.json(data);
        }

        case "DELETE": {
          const body = req.body as { field?: string };
          if (!body.field) {
            return res.status(400).json({ error: "Missing field" });
          }
          await adapter.delete(body.field);
          return res.json({ success: true });
        }

        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ error: error instanceof Error ? error.message : "Internal error" });
    }
  };
}
