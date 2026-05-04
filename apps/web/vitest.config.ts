import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import { resolve } from "path"

export default defineConfig({
  plugins: [react()] as any,
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    environmentMatchGlobs: [
      ["**/*.test.tsx", "happy-dom"],
      ["**/components/**/*.test.ts", "happy-dom"],
    ],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})
