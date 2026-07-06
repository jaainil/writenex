/**
 * @fileoverview Next.js development server integration for Writenex
 *
 * Provides a lightweight HTTP server that mounts Writenex alongside your Next.js dev server
 * when App Router-based API routes are not available (e.g., during `next dev` but before routes are compiled).
 */

import { createServer, type Server } from "node:http";
import { createGenericMiddleware, type MiddlewareContext } from "@imjp/writenex-core/server";
import type { WritenexConfig } from "@imjp/writenex-core";

export interface WritenexDevServerOptions {
  projectRoot: string;
  config: Required<WritenexConfig>;
  port?: number;
  basePath?: string;
}

/**
 * Start a standalone Writenex development server.
 *
 * @returns The server instance and a close function.
 */
export function createWritenexDevServer(
  options: WritenexDevServerOptions
): { server: Server; close: () => Promise<void> } {
  const { projectRoot, config, port = 3456, basePath = "/_writenex" } = options;

  const context: MiddlewareContext = {
    basePath,
    projectRoot,
    config,
    trailingSlash: "ignore",
  };

  const middleware = createGenericMiddleware(context);

  const server = createServer((req, res) => {
    middleware(req, res, () => {
      res.statusCode = 404;
      res.end("Not found");
    });
  });

  server.listen(port);

  console.log(`Writenex dev server running at http://localhost:${port}${basePath}`);

  return {
    server,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      }),
  };
}
