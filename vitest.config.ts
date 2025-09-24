import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./src/tests/setup.ts"],
    pool: "forks",
    poolOptions: {
      forks: {
        singleFork: true, // すべてのテストを単一のフォークで実行
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
