/**
 * @fileoverview Main entry point for @imjp/writenex-core
 *
 * This package provides framework-agnostic core modules for Writenex:
 * - Types and configuration
 * - Content discovery and filesystem operations
 * - Fields API for schema definitions
 * - Server-side utilities (cache, generic middleware, API routes)
 * - Shared React components for the editor UI
 */

// Main exports
export { defineConfig, loadConfig, validateConfig } from "@/config";
export { collection, fields, singleton } from "@/fields";

// Types
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
} from "@/types";

// Errors
export { isWritenexError, WritenexError, WritenexErrorCode } from "@/core";
