/**
 * @fileoverview Server module exports for @imjp/writenex-core
 *
 * This module provides framework-agnostic server-side functionality:
 * - Generic API route handlers (can be used with any framework)
 * - In-memory caching
 * - Static asset serving utilities
 * - HTML shell generation
 */

export { getCache, resetCache, ServerCache } from "./cache";
export {
  createApiRouter,
} from "./routes";
export type { MiddlewareContext } from "./middleware";
export {
  createGenericMiddleware,
  parseJsonBody,
  parseQueryParams,
  sendError,
  sendJson,
  sendWritenexError,
} from "./middleware";
export {
  generateEditorHtml,
  getClientDistPath,
  hasClientBundle,
  serveAsset,
  serveEditorHtml,
} from "./assets";
