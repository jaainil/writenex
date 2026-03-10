/**
 * @fileoverview Server module exports for @writenex/astro
 *
 * This module provides the public API for server-side functionality,
 * including middleware, API routes, static assets, and caching.
 *
 * @module @writenex/astro/server
 */

// Assets
export {
  getClientDistPath,
  hasClientBundle,
  serveAsset,
  serveEditorHtml,
} from "./assets";
// Cache
export { getCache, resetCache, ServerCache } from "./cache";
export type { MiddlewareContext } from "./middleware";
// Middleware functions and types
export {
  createMiddleware,
  parseJsonBody,
  parseQueryParams,
  sendError,
  sendJson,
  sendWritenexError,
} from "./middleware";
// Routes
export { createApiRouter } from "./routes";
