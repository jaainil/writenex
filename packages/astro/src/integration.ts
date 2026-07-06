/**
 * @fileoverview Astro integration for Writenex visual editor
 *
 * Delegates to @imjp/writenex-core's generic middleware and utilities.
 */

import type { AstroIntegration } from "astro";
import type { Connect } from "vite";
import { fileURLToPath } from "node:url";
import {
  createGenericMiddleware,
  getCache,
} from "@imjp/writenex-core/server";
import { ContentWatcher } from "@imjp/writenex-core/filesystem";
import { loadConfig } from "@imjp/writenex-core";
import type { WritenexConfig, WritenexOptions } from "@imjp/writenex-core";

const DEFAULT_BASE_PATH = "/_writenex";
const PACKAGE_NAME = "@imjp/writenex-astro";

export default function writenex(options?: WritenexOptions): AstroIntegration {
  const { allowProduction = false } = options ?? {};
  const basePath = DEFAULT_BASE_PATH;
  let isActive = true;
  let resolvedConfig: Required<WritenexConfig> | null = null;
  let projectRoot = "";
  let astroTrailingSlash: "always" | "never" | "ignore" = "ignore";
  let watcher: ContentWatcher | null = null;
  let hasLoggedEditorUrl = false;

  return {
    name: PACKAGE_NAME,
    hooks: {
      "astro:config:setup": async ({ command, logger, config }) => {
        if (command === "build" && !allowProduction) {
          logger.warn(
            "Disabled in production build. Use allowProduction: true to override."
          );
          isActive = false;
          return;
        }

        projectRoot = fileURLToPath(config.root);
        astroTrailingSlash = config.trailingSlash ?? "ignore";

        const { config: loadedConfig, warnings } =
          await loadConfig(projectRoot);
        resolvedConfig = loadedConfig;

        for (const warning of warnings) {
          logger.warn(warning);
        }
      },

      "astro:server:setup": ({ server }) => {
        if (!isActive || !resolvedConfig) return;

        const middleware = createGenericMiddleware({
          basePath,
          projectRoot,
          config: resolvedConfig,
          trailingSlash: astroTrailingSlash,
        });

        server.middlewares.use(middleware as Connect.NextHandleFunction);

        const cache = getCache({ hasWatcher: true });

        watcher = new ContentWatcher(projectRoot, "src/content", {
          onChange: (event) => {
            cache.handleFileChange(event.type, event.collection);
          },
        });

        watcher.start();
      },

      "astro:server:start": ({ address, logger }) => {
        if (!isActive || hasLoggedEditorUrl) return;

        const protocol = "http";
        const rawHost = address.address;
        const isLoopback =
          rawHost === "" || rawHost === "::" || rawHost === "127.0.0.1" || rawHost === "::1";
        const host = isLoopback ? "localhost" : rawHost;
        const port = address.port;
        const editorUrl = `${protocol}://${host}:${port}${basePath}`;

        logger.info(`Writenex editor running at: ${editorUrl}`);
        hasLoggedEditorUrl = true;
      },

      "astro:server:done": async () => {
        if (watcher) {
          await watcher.stop();
          watcher = null;
        }
      },

      "astro:build:done": ({ logger }) => {
        if (allowProduction) {
          logger.warn(
            "Production mode enabled. Ensure your deployment is secured."
          );
        }
      },
    },
  };
}
