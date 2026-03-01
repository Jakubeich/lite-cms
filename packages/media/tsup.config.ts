import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/adapters/local.ts",
    "src/adapters/s3.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["react", "@aws-sdk/client-s3", "@aws-sdk/s3-request-presigner", "fs/promises", "path"],
});
