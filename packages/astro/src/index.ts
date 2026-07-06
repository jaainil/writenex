/**
 * @fileoverview Main entry point for @imjp/writenex-astro
 *
 * Thin Astro-specific wrapper around @imjp/writenex-core.
 */

export { default, default as writenex } from "./integration";

export { defineConfig, loadConfig, validateConfig } from "@imjp/writenex-core";
export { collection, fields, singleton } from "@imjp/writenex-core";

export type {
  CollectionConfig,
  CollectionSchema,
  ContentItem,
  ContentSummary,
  DiscoveredCollection,
  DiscoveryConfig,
  EditorConfig,
  FieldKind,
  FieldType,
  ImageConfig,
  ImageStrategy,
  SchemaField,
  ValidationOptions,
  VersionHistoryConfig,
  WritenexConfig,
  WritenexOptions,
} from "@imjp/writenex-core";

export { isWritenexError, WritenexError, WritenexErrorCode } from "@imjp/writenex-core";
