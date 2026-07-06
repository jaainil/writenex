/**
 * @fileoverview Next.js integration for Writenex
 *
 * Provides Next.js App Router handlers and a config wrapper.
 */

import type { NextConfig } from "next";

/**
 * Writenex options for Next.js integration
 */
export interface WritenexNextOptions {
  /** Allow in production (default: false) */
  allowProduction?: boolean;
  /** Base path for the editor (default: /_writenex) */
  basePath?: string;
  /** Content source directory relative to project root */
  contentPath?: string;
}

/**
 * Wrap your Next.js config with Writenex.
 *
 * @example
 * ```js
 * // next.config.js
 * const { withWritenex } = require("@imjp/writenex-next");
 *
 * module.exports = withWritenex({
 *   // your existing Next.js config
 * });
 * ```
 */
export function withWritenex(
  nextConfig: NextConfig = {},
  _options?: WritenexNextOptions
): NextConfig {
  return {
    ...nextConfig,
    // Future: rewrites, headers, webpack plugins for asset serving
  };
}
