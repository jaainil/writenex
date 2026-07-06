/**
 * @fileoverview Next.js App Router API route handler for Writenex
 */
import type { NextRequest } from "next/server";
import { Readable } from "node:stream";
import { createApiRouter } from "@imjp/writenex-core/server";
import type { MiddlewareContext } from "@imjp/writenex-core/server";
import { isWritenexError } from "@imjp/writenex-core";
import type { WritenexConfig } from "@imjp/writenex-core";

export interface ApiHandlerOptions {
  projectRoot: string;
  config: Required<WritenexConfig>;
  basePath?: string;
}

export function createWritenexApiHandler(options: ApiHandlerOptions) {
  const { projectRoot, config, basePath = "/_writenex" } = options;

  const context: MiddlewareContext = {
    basePath,
    projectRoot,
    config,
    trailingSlash: "ignore",
  };

  const router = createApiRouter(context);

  async function handle(req: NextRequest, method: string) {
    const url = new URL(req.url);
    let path = url.pathname;

    if (path.startsWith(basePath)) {
      path = path.slice(basePath.length) || "/";
    }

    if (!path.startsWith("/api/") && path !== "/api") {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const bodyStream = req.body
        ? Readable.fromWeb(req.body as any)
        : Readable.from([]);

      const nodeReq: any = {
        url: url.pathname + url.search,
        method,
        headers: Object.fromEntries(req.headers.entries()),
        on: (event: string, cb: (chunk: Buffer) => void) => {
          if (event === "data") {
            bodyStream.on("data", cb);
          }
          if (event === "end") {
            bodyStream.on("end", () => cb(Buffer.from("")));
          }
        },
      };

      let statusCode = 200;
      const headers: Record<string, string> = {};
      let body = "";

      const nodeRes: any = {
        statusCode,
        setHeader: (name: string, value: string) => {
          headers[name] = value;
        },
        end: (data: string) => {
          body = data;
        },
        write: (data: string) => {
          body += data;
        },
      };

      await router(nodeReq, nodeRes, path.slice(4));

      return new Response(body, {
        status: nodeRes.statusCode ?? 200,
        headers,
      });
    } catch (error: any) {
      console.error(`[writenex] API error: ${error.message}`);
      return new Response(
        JSON.stringify({ error: error.message }),
        {
          status: error.httpStatus ?? 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  return {
    GET: (req: NextRequest) => handle(req, "GET"),
    POST: (req: NextRequest) => handle(req, "POST"),
    PUT: (req: NextRequest) => handle(req, "PUT"),
    DELETE: (req: NextRequest) => handle(req, "DELETE"),
  };
}
