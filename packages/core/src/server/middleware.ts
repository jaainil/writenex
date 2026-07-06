/**
 * @fileoverview Generic framework-agnostic middleware for Writenex
 *
 * This module provides middleware that can be adapted to any framework:
 * Express, Vite (Astro), Next.js, Fastify, etc.
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { WritenexError } from "@/core/errors";
import { isWritenexError, WritenexErrorCode, wrapError } from "@/core/errors";
import type { WritenexConfig } from "@/types";
import { serveAsset, serveEditorHtml } from "./assets";
import { createApiRouter } from "./routes";

export interface MiddlewareContext {
  basePath: string;
  projectRoot: string;
  config: Required<WritenexConfig>;
  trailingSlash: "always" | "never" | "ignore";
}

export type MiddlewareHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void | Promise<void>
) => Promise<void> | void;

export function createGenericMiddleware(
  context: MiddlewareContext
): MiddlewareHandler {
  const { basePath } = context;
  const apiRouter = createApiRouter(context);

  return async (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void | Promise<void>
  ) => {
    const url = req.url ?? "";
    const pathname = url.split("?", 1)[0] ?? "";

    if (!pathname.startsWith(basePath)) {
      return next();
    }

    const path = pathname.slice(basePath.length) || "/";

    try {
      if (path.startsWith("/api/")) {
        return await apiRouter(req, res, path.slice(4));
      }

      if (path.startsWith("/assets/")) {
        return await serveAsset(req, res, path.slice(8), context);
      }

      return await serveEditorHtml(req, res, context);
    } catch (error) {
      const writenexError = isWritenexError(error)
        ? error
        : wrapError(error, WritenexErrorCode.API_INTERNAL_ERROR);

      console.error(
        `[writenex] Middleware error [${writenexError.code}]: ${writenexError.message}`
      );

      res.statusCode = writenexError.httpStatus;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(writenexError.toJSON()));
    }
  };
}

export function parseQueryParams(url: string): Record<string, string> {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return {};

  const queryString = url.slice(queryIndex + 1);
  const params: Record<string, string> = {};

  for (const pair of queryString.split("&")) {
    const [key, value] = pair.split("=");
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : "";
    }
  }

  return params;
}

export async function parseJsonBody(
  req: IncomingMessage
): Promise<unknown | null> {
  return new Promise((resolve) => {
    let body = "";

    req.on("data", (chunk: Buffer) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      if (!body) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve(null);
      }
    });

    req.on("error", () => {
      resolve(null);
    });
  });
}

export function sendJson(
  res: ServerResponse,
  data: unknown,
  statusCode: number = 200
): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

export function sendError(
  res: ServerResponse,
  message: string,
  statusCode: number = 400
): void {
  sendJson(res, { error: message }, statusCode);
}

export function sendWritenexError(
  res: ServerResponse,
  error: WritenexError
): void {
  sendJson(res, error.toJSON(), error.httpStatus);
}
