import type { MediaStorageAdapter, MediaUploadOptions, MediaPaginationOptions } from "@litecms/core";

/**
 * Create API handler for media operations
 * Works with Next.js App Router
 */
export function createMediaApiHandler(adapter: MediaStorageAdapter) {
  return {
    /**
     * GET - List media files or get single file
     */
    async GET(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (id) {
          // Get single file
          const file = await adapter.get(id);
          if (!file) {
            return Response.json({ error: "File not found" }, { status: 404 });
          }
          return Response.json(file);
        }

        // List files with pagination
        const options: MediaPaginationOptions = {
          page: parseInt(url.searchParams.get("page") || "1"),
          limit: parseInt(url.searchParams.get("limit") || "20"),
          sortBy: (url.searchParams.get("sortBy") as MediaPaginationOptions["sortBy"]) || "createdAt",
          sortOrder: (url.searchParams.get("sortOrder") as MediaPaginationOptions["sortOrder"]) || "desc",
          mimeType: url.searchParams.get("mimeType") || undefined,
          search: url.searchParams.get("search") || undefined,
        };

        const result = await adapter.getAll(options);
        return Response.json(result);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Internal error" },
          { status: 500 }
        );
      }
    },

    /**
     * POST - Upload new file
     */
    async POST(request: Request): Promise<Response> {
      try {
        const contentType = request.headers.get("content-type") || "";

        if (contentType.includes("multipart/form-data")) {
          // Handle file upload
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          const optionsJson = formData.get("options") as string | null;

          if (!file) {
            return Response.json({ error: "No file provided" }, { status: 400 });
          }

          const options: MediaUploadOptions = optionsJson
            ? JSON.parse(optionsJson)
            : {};

          const mediaFile = await adapter.upload(file, file.name, options);
          return Response.json(mediaFile, { status: 201 });
        }

        return Response.json(
          { error: "Invalid content type. Expected multipart/form-data" },
          { status: 400 }
        );
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Upload failed" },
          { status: 500 }
        );
      }
    },

    /**
     * PATCH - Update file metadata
     */
    async PATCH(request: Request): Promise<Response> {
      try {
        const body = await request.json();
        const { id, alt, title, metadata } = body;

        if (!id) {
          return Response.json({ error: "Missing file ID" }, { status: 400 });
        }

        const updated = await adapter.update(id, { alt, title, metadata });
        return Response.json(updated);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Update failed" },
          { status: 500 }
        );
      }
    },

    /**
     * DELETE - Delete a file
     */
    async DELETE(request: Request): Promise<Response> {
      try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
          return Response.json({ error: "Missing file ID" }, { status: 400 });
        }

        await adapter.delete(id);
        return Response.json({ success: true });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Delete failed" },
          { status: 500 }
        );
      }
    },
  };
}

/**
 * Create API handler for Next.js Pages Router
 */
export function createMediaPagesApiHandler(adapter: MediaStorageAdapter) {
  return async function handler(
    req: { method?: string; query: Record<string, string | string[] | undefined>; body: unknown },
    res: {
      status: (code: number) => { json: (data: unknown) => void };
      json: (data: unknown) => void;
    }
  ) {
    const method = req.method || "GET";

    try {
      switch (method) {
        case "GET": {
          const id = req.query.id as string | undefined;

          if (id) {
            const file = await adapter.get(id);
            if (!file) {
              return res.status(404).json({ error: "File not found" });
            }
            return res.json(file);
          }

          const options: MediaPaginationOptions = {
            page: parseInt((req.query.page as string) || "1"),
            limit: parseInt((req.query.limit as string) || "20"),
            sortBy: (req.query.sortBy as MediaPaginationOptions["sortBy"]) || "createdAt",
            sortOrder: (req.query.sortOrder as MediaPaginationOptions["sortOrder"]) || "desc",
            mimeType: (req.query.mimeType as string) || undefined,
            search: (req.query.search as string) || undefined,
          };

          const result = await adapter.getAll(options);
          return res.json(result);
        }

        case "POST": {
          // Note: For file uploads in Pages Router, you'll need to configure
          // a body parser like formidable or multer
          return res.status(501).json({
            error: "File upload requires additional configuration for Pages Router",
          });
        }

        case "PATCH": {
          const body = req.body as { id?: string; alt?: string; title?: string; metadata?: Record<string, unknown> };
          if (!body.id) {
            return res.status(400).json({ error: "Missing file ID" });
          }

          const updated = await adapter.update(body.id, {
            alt: body.alt,
            title: body.title,
            metadata: body.metadata,
          });
          return res.json(updated);
        }

        case "DELETE": {
          const body = req.body as { id?: string };
          if (!body.id) {
            return res.status(400).json({ error: "Missing file ID" });
          }

          await adapter.delete(body.id);
          return res.json({ success: true });
        }

        default:
          return res.status(405).json({ error: "Method not allowed" });
      }
    } catch (error) {
      return res.status(500).json({
        error: error instanceof Error ? error.message : "Internal error",
      });
    }
  };
}
