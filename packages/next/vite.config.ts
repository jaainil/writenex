import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "vite-plus";

const packageRoot = fileURLToPath(new URL(".", import.meta.url));
const sharedSource = fileURLToPath(new URL("../astro/src", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": sharedSource } },
  test: { name: "next", include: ["tests/**/*.test.ts"], environment: "node" },
  pack: [
    {
      entry: {
        index: "src/index.ts",
        config: "src/config.ts",
        "server/index": "src/server/index.ts",
      },
      outDir: "dist",
      format: ["esm"],
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
      target: "node20",
      platform: "node",
      sourcemap: true,
      clean: true,
      dts: true,
      alias: { "@": sharedSource },
      deps: {
        neverBundle: [
          "next",
          "react",
          "react-dom",
          "gray-matter",
          "jiti",
          "slugify",
          "zod",
          /^node:/,
        ],
      },
    },
    {
      entry: { "client/index": join(sharedSource, "client/index.tsx") },
      outDir: "dist",
      format: ["esm"],
      outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
      target: "es2020",
      platform: "browser",
      sourcemap: true,
      clean: false,
      dts: false,
      minify: true,
      alias: { "@": sharedSource },
      deps: { alwaysBundle: [/.*/] },
      outputOptions: { codeSplitting: false },
      css: { fileName: "client/index.css" },
      inputOptions: { transform: { jsx: "react-jsx" } },
      onSuccess: async () => {
        const destination = join(packageRoot, "dist/client");
        mkdirSync(destination, { recursive: true });
        copyFileSync(
          join(packageRoot, "src/client/platform.css"),
          join(destination, "platform.css")
        );
        for (const file of ["styles.css", "variables.css"])
          copyFileSync(
            join(sharedSource, "client", file),
            join(destination, file)
          );
      },
    },
  ],
});
