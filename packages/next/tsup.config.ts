import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
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

function copyDirSync(src: string, dest: string) {
  if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    const stat = statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "api/handler": "src/api/handler.ts",
    "routes/editor": "src/routes/editor.tsx",
    "routes/assets": "src/routes/assets.ts",
    "dev-server": "src/dev-server.ts",
    "config/index": "src/config/index.ts",
    "discovery/index": "src/discovery/index.ts",
    "filesystem/index": "src/filesystem/index.ts",
    "server/index": "src/server/index.ts",
    "fields/index": "src/fields/index.ts",
    "routes/index": "src/routes/index.ts",
  },
  outDir: "dist",
  format: ["esm"],
  target: "node18",
  platform: "node",
  sourcemap: true,
  clean: true,
  dts: true,
  external: [
    "next",
    "@imjp/writenex-core",
    "react",
    "react-dom",
    "node:fs",
    "node:fs/promises",
    "node:path",
    "node:url",
  ],
  esbuildPlugins: [createAliasPlugin()],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  onSuccess: async () => {
    const coreClient = resolve("node_modules/@imjp/writenex-core/dist/client");
    const nextClient = join("dist", "client");
    if (existsSync(coreClient)) {
      copyDirSync(coreClient, nextClient);
      console.log("Copied client assets from @imjp/writenex-core");
    } else {
      console.warn("@imjp/writenex-core client assets not found. Build core first.");
    }
  },
});
