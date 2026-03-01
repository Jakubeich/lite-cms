import type { StorageAdapter, VersioningAdapter, PublishingAdapter } from "@litecms/core";

type CombinedAdapter = StorageAdapter & Partial<VersioningAdapter> & Partial<PublishingAdapter>;

/**
 * Create API handler for Prisma adapter
 * Works with Next.js App Router
 */
export function createPrismaApiHandler(adapter: CombinedAdapter) {
  return {
    /**
     * GET - Get content or list versions
     */
    async GET(request: Request): Promise<Response> {
      try {
        const url = new URL(request.url);
        const field = url.searchParams.get("field");
        const action = url.searchParams.get("action");

        // Get versions for a field
        if (action === "versions" && field) {
          if (!adapter.getVersions) {
            return Response.json({ error: "Versioning not supported" }, { status: 501 });
          }
          const limit = parseInt(url.searchParams.get("limit") || "20");
          const offset = parseInt(url.searchParams.get("offset") || "0");
          const versions = await adapter.getVersions(field, { limit, offset });
          return Response.json({ versions });
        }

        // Get specific version
        if (action === "version" && field) {
          if (!adapter.getVersion) {
            return Response.json({ error: "Versioning not supported" }, { status: 501 });
          }
          const version = parseInt(url.searchParams.get("version") || "0");
          const versionData = await adapter.getVersion(field, version);
          if (!versionData) {
            return Response.json({ error: "Version not found" }, { status: 404 });
          }
          return Response.json(versionData);
        }

        // Get scheduled content
        if (action === "scheduled") {
          if (!adapter.getScheduled) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const scheduled = await adapter.getScheduled();
          return Response.json({ scheduled });
        }

        // Get single field
        if (field) {
          const data = await adapter.get(field);
          if (!data) {
            return Response.json({ error: "Not found" }, { status: 404 });
          }
          return Response.json(data);
        }

        // Get all content
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
     * POST - Create/update content or perform actions
     */
    async POST(request: Request): Promise<Response> {
      try {
        const body = await request.json();
        const { action, field, value } = body;

        // Publish content
        if (action === "publish" && field) {
          if (!adapter.publish) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.publish(field);
          return Response.json(result);
        }

        // Unpublish content
        if (action === "unpublish" && field) {
          if (!adapter.unpublish) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.unpublish(field);
          return Response.json(result);
        }

        // Schedule content
        if (action === "schedule" && field && body.date) {
          if (!adapter.schedule) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.schedule(field, new Date(body.date));
          return Response.json(result);
        }

        // Cancel schedule
        if (action === "cancelSchedule" && field) {
          if (!adapter.cancelSchedule) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.cancelSchedule(field);
          return Response.json(result);
        }

        // Save draft
        if (action === "saveDraft" && field && value !== undefined) {
          if (!adapter.saveDraft) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.saveDraft(field, value);
          return Response.json(result);
        }

        // Archive content
        if (action === "archive" && field) {
          if (!adapter.archive) {
            return Response.json({ error: "Publishing not supported" }, { status: 501 });
          }
          const result = await adapter.archive(field);
          return Response.json(result);
        }

        // Restore version
        if (action === "restore" && field && body.version) {
          if (!adapter.restore) {
            return Response.json({ error: "Versioning not supported" }, { status: 501 });
          }
          const result = await adapter.restore(field, body.version);
          return Response.json(result);
        }

        // Compare versions
        if (action === "compare" && field && body.v1 && body.v2) {
          if (!adapter.compare) {
            return Response.json({ error: "Versioning not supported" }, { status: 501 });
          }
          const diff = await adapter.compare(field, body.v1, body.v2);
          return Response.json({ diff });
        }

        // Standard set content
        if (!field || value === undefined) {
          return Response.json(
            { error: "Missing field or value" },
            { status: 400 }
          );
        }

        const data = await adapter.set(field, value);
        return Response.json(data);
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Internal error" },
          { status: 500 }
        );
      }
    },

    /**
     * DELETE - Delete content
     */
    async DELETE(request: Request): Promise<Response> {
      try {
        const body = await request.json();
        const { field } = body;

        if (!field) {
          return Response.json({ error: "Missing field" }, { status: 400 });
        }

        await adapter.delete(field);
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
