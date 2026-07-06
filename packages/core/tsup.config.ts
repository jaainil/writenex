import { copyFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { defineConfig } from "tsup";

const srcPath = resolve("src");

function createAliasPlugin() {
  return {
    name: "alias-path",
    setup(build: {
      onResolve: (
        options: { filter: RegExp },
        callback: (args: { path: string; importer: string }) => { path: string } | undefined
      ) => void;
    }) {
      build.onResolve(
        { filter: /^@\// },
        (args: { path: string; importer: string }) => {
          const importPath = args.path;
          const moduleMatch = importPath.match(/^@\/([^/]+)$/);
          if (moduleMatch) {
            const moduleName = moduleMatch[1];
            return { path: resolve(srcPath, moduleName, "index.ts") };
          }
          const subPathMatch = importPath.match(/^@\/(.+)$/);
          if (subPathMatch) {
            const relativePath = subPathMatch[1];
            return { path: resolve(srcPath, `${relativePath}.ts`) };
          }
          return undefined;
        }
      );
    },
  };
}

export default defineConfig([
  // Server-side bundle
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
    target: "node18",
    platform: "node",
    sourcemap: true,
    clean: true,
    dts: true,
    external: [
      "react",
      "react-dom",
      "node:fs",
      "node:fs/promises",
      "node:path",
      "node:url",
    ],
    esbuildPlugins: [createAliasPlugin()],
  },
  // Client bundle (React components)
  {
    entry: {
      "client/index": "src/client/index.tsx",
    },
    outDir: "dist",
    format: ["esm"],
    target: "es2020",
    platform: "browser",
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: true,
    minify: true,
    noExternal: [/.*/],
    esbuildPlugins: [createAliasPlugin()],
    esbuildOptions(options) {
      options.jsx = "automatic";
    },
    onSuccess: async () => {
      const distDir = join("dist", "client");
      mkdirSync(distDir, { recursive: true });
      const cssFiles = ["styles.css", "variables.css"];
      for (const file of cssFiles) {
        const src = join("src", "client", file);
        const dest = join(distDir, file);
        try {
          copyFileSync(src, dest);
          console.log(`CSS copied to dist/client/${file}`);
        } catch {
          // file may not exist
        }
      }
    },
  },
]);
