import { createJsonAdapter, createApiHandler } from "@litecms/adapter-json";
import path from "path";

const adapter = createJsonAdapter({
  filePath: path.join(process.cwd(), "cms-data.json"),
});

const handler = createApiHandler(adapter);

export const GET = handler.GET;
export const POST = handler.POST;
export const DELETE = handler.DELETE;
