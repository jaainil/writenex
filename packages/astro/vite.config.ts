import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "vite-plus";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));
const srcPath = join(packageRoot, "src");

export default defineConfig({
  test: {
    name: "astro",
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
  resolve: { alias: { "@": srcPath } },
  pack: [
    {
      entry: {
        index: "src/index.ts",
        "config/index": "src/config/index.ts",
        "discovery/index": "src/discovery/index.ts",
        "filesystem/index": "src/filesystem/index.ts",
        "server/index": "src/server/index.ts",
        "fields/index": "src/fields/index.ts",
      },
      outDir: "dist",
      format: ["esm"],
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
      target: "node18",
      platform: "node",
      sourcemap: true,
      clean: true,
      dts: true,
      alias: { "@": srcPath },
      deps: {
        neverBundle: ["astro", "vite", "react", "react-dom", /^node:/],
      },
    },
    {
      entry: { "client/index": "src/client/index.tsx" },
      outDir: "dist",
      format: ["esm"],
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
      target: "es2020",
      platform: "browser",
      sourcemap: true,
      clean: false,
      dts: true,
      minify: true,
      alias: { "@": srcPath },
      deps: {
        // The standalone browser client must not require an import map.
        alwaysBundle: [/.*/],
      },
      // Preserve tsup's single-file browser entry and the served CSS URL.
      outputOptions: { codeSplitting: false },
      css: { fileName: "client/index.css" },
      inputOptions: { transform: { jsx: "react-jsx" } },
      onSuccess: async () => {
        const distDir = join(packageRoot, "dist", "client");
        mkdirSync(distDir, { recursive: true });
        for (const file of ["styles.css", "variables.css"]) {
          copyFileSync(join(srcPath, "client", file), join(distDir, file));
        }
      },
    },
  ],
});
