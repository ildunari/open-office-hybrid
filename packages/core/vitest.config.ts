import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [svelte()],
  test: {
    include: ["tests/**/*.test.ts"],
    server: {
      deps: {
        inline: ["pdfjs-dist"],
      },
    },
  },
  define: {
    DOMMatrix: "Object",
  },
});
