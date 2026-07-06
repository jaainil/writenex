/**
 * @fileoverview Main entry point for @imjp/writenex-next
 */

export { withWritenex, type WritenexNextOptions } from "./withWritenex";
export { createWritenexApiHandler } from "./api/handler";
export { createWritenexPageHandler } from "./routes/editor";
export { createWritenexAssetHandler } from "./routes/assets";
export { createWritenexDevServer, type WritenexDevServerOptions } from "./dev-server";

// Re-export core utilities commonly used by consumers
export {
  defineConfig,
  loadConfig,
  validateConfig,
} from "@imjp/writenex-core";

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

export {
  isWritenexError,
  WritenexError,
  WritenexErrorCode,
} from "@imjp/writenex-core";
