import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  test: { include: ["tests/**/*.test.ts"], testTimeout: 120000 },
} as any);
