import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    env: {
      TZ: "Asia/Shanghai",
    },
    globals: true,
    setupFiles: "./src/test/setup.ts",
  },
});
