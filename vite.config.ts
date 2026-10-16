import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "es5",
    arrowParens: "always",
    endOfLine: "lf",
    ignorePatterns: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/build/**",
      "**/out/**",
      "**/public/**",
      ".agent/**",
      ".agents/**",
      ".codex/**",
      "wiki/**",
      "**/*.md",
      ".kilo/**",
      "test-results/**",
      "playwright-report/**",
      "bun.lock",
      "pnpm-lock.yaml",
      "skills-lock.json",
      "**/next-env.d.ts",
    ],
  },
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": fileURLToPath(new URL("./apps/writenex/", import.meta.url)),
          },
        },
        test: {
          name: "editor",
          include: ["apps/writenex/lib/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        resolve: {
          alias: {
            "@": fileURLToPath(
              new URL("./packages/astro/src/", import.meta.url)
            ),
          },
        },
        test: {
          name: "astro",
          include: ["packages/astro/tests/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
