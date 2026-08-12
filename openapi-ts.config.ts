import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "./api-spec.json",
  output: {
    path: "./src/generated",
    lint: false,
    format: false,
  },
  plugins: ["@hey-api/client-fetch", "@hey-api/sdk"],
});
