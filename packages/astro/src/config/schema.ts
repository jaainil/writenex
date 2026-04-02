/**
 * @fileoverview Configuration schema and validation for @writenex/astro
 *
 * This module provides Zod schemas for validating Writenex configuration
 * and a helper function for defining type-safe configurations.
 *
 * @module @writenex/astro/config/schema
 */

import { z } from "zod";
import type { WritenexConfig } from "@/types";

const fieldTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "date",
  "array",
  "image",
  "object",
  "file",
  "blocks",
  "relationship",
  "markdoc",
  "mdx",
  "child",
  "slug",
  "url",
  "integer",
  "select",
  "multiselect",
  "datetime",
  "cloud-image",
  "path-reference",
  "conditional",
  "empty",
  "empty-content",
  "empty-document",
  "ignored",
  "checkbox",
]);

const validationSchema = z
  .object({
    isRequired: z.boolean().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional(),
    patternDescription: z.string().optional(),
  })
  .optional();

type SchemaFieldInput = {
  type: z.infer<typeof fieldTypeSchema>;
  required?: boolean;
  default?: unknown;
  items?: string;
  description?: string;
  label?: string;
  options?: string[];
  directory?: string;
  publicPath?: string;
  validation?: z.infer<typeof validationSchema>;
  fields?: Record<string, SchemaFieldInput>;
  itemField?: SchemaFieldInput;
  blockTypes?: Record<string, SchemaFieldInput>;
  collection?: string;
  multiline?: boolean;
  format?: string;
  itemLabel?: string;
  matchField?: string;
  matchValue?: unknown;
  showField?: SchemaFieldInput;
  accept?: string;
  allowExternal?: boolean;
  inline?: boolean;
};

function createSchemaFieldSchema(): z.ZodType<SchemaFieldInput> {
  let schemaFieldSchema: z.ZodType<SchemaFieldInput>;

  const baseFields = {
    type: fieldTypeSchema,
    required: z.boolean().optional(),
    default: z.unknown().optional(),
    items: z.string().optional(),
    description: z.string().optional(),
    label: z.string().optional(),
    options: z.array(z.string()).optional(),
    directory: z.string().optional(),
    publicPath: z.string().optional(),
    validation: validationSchema,
    collection: z.string().optional(),
    multiline: z.boolean().optional(),
    format: z.string().optional(),
    itemLabel: z.string().optional(),
    matchField: z.string().optional(),
    matchValue: z.unknown().optional(),
    accept: z.string().optional(),
    allowExternal: z.boolean().optional(),
    inline: z.boolean().optional(),
  };

  schemaFieldSchema = z.object({
    ...baseFields,
    fields: z
      .record(
        z.string(),
        z.lazy(() => schemaFieldSchema)
      )
      .optional(),
    itemField: z.lazy(() => schemaFieldSchema).optional(),
    blockTypes: z
      .record(
        z.string(),
        z.lazy(() => schemaFieldSchema)
      )
      .optional(),
    showField: z.lazy(() => schemaFieldSchema).optional(),
  });

  return schemaFieldSchema;
}

const schemaFieldSchema = createSchemaFieldSchema();

const collectionSchemaSchema = z.record(z.string(), schemaFieldSchema);

const imageStrategySchema = z.enum(["colocated", "public", "custom"]);

const imageConfigSchema = z.object({
  strategy: imageStrategySchema,
  publicPath: z.string().optional(),
  storagePath: z.string().optional(),
});

const collectionConfigSchema = z.object({
  name: z.string().min(1, "Collection name is required"),
  path: z.string().min(1, "Collection path is required"),
  filePattern: z.string().optional(),
  previewUrl: z.string().optional(),
  schema: collectionSchemaSchema.optional(),
  images: imageConfigSchema.optional(),
});

const singletonConfigSchema = z.object({
  name: z.string().min(1, "Singleton name is required"),
  path: z.string().min(1, "Singleton path is required"),
  previewUrl: z.string().optional(),
  schema: collectionSchemaSchema.optional(),
  images: imageConfigSchema.optional(),
});

const discoveryConfigSchema = z.object({
  enabled: z.boolean(),
  ignore: z.array(z.string()).optional(),
});

const editorConfigSchema = z.object({
  autosave: z.boolean().optional(),
  autosaveInterval: z.number().positive().optional(),
});

const versionHistoryConfigSchema = z.object({
  enabled: z.boolean().optional(),
  maxVersions: z.number().int().positive().optional(),
  storagePath: z.string().optional(),
});

export const writenexConfigSchema = z.object({
  collections: z.array(collectionConfigSchema).optional(),
  singletons: z.array(singletonConfigSchema).optional(),
  images: imageConfigSchema.optional(),
  editor: editorConfigSchema.optional(),
  discovery: discoveryConfigSchema.optional(),
  versionHistory: versionHistoryConfigSchema.optional(),
});

export const writenexOptionsSchema = z.object({
  allowProduction: z.boolean().optional(),
});

export function defineConfig(config: WritenexConfig): WritenexConfig {
  const result = writenexConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((e: z.ZodIssue) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    console.warn(`[writenex] Invalid configuration:\n${errors}`);
  }

  return config;
}

export function validateConfig(
  config: unknown
):
  | { success: true; data: WritenexConfig }
  | { success: false; error: z.ZodError } {
  return writenexConfigSchema.safeParse(config) as
    | { success: true; data: WritenexConfig }
    | { success: false; error: z.ZodError };
}
