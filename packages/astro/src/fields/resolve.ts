/**
 * @fileoverview FieldDefinition to SchemaField conversion
 *
 * This module converts FieldDefinition objects (from the builder API)
 * to the internal SchemaField format used by the form system.
 *
 * @module @writenex/astro/fields/resolve
 */

import type { SchemaField } from "@/types";
import type { FieldDefinition } from "./types";

const FIELD_KIND_TO_TYPE: Record<string, string> = {
  text: "string",
  slug: "string",
  url: "string",
  number: "number",
  integer: "number",
  select: "string",
  multiselect: "array",
  checkbox: "boolean",
  date: "date",
  datetime: "date",
  image: "image",
  file: "file",
  object: "object",
  array: "array",
  blocks: "blocks",
  relationship: "relationship",
  "path-reference": "string",
  markdoc: "markdoc",
  mdx: "mdx",
  conditional: "object",
  child: "child",
  "cloud-image": "image",
  empty: "empty",
  "empty-content": "empty-content",
  "empty-document": "empty-document",
  ignored: "ignored",
};

export function resolveFieldDefinition(field: FieldDefinition): SchemaField {
  const type = FIELD_KIND_TO_TYPE[field.fieldKind] ?? "string";
  const base: SchemaField = {
    type: type as SchemaField["type"],
    required: field.validation?.isRequired ?? false,
    label: field.label,
    description: field.description,
    default: field.defaultValue,
  };

  switch (field.fieldKind) {
    case "select":
      return {
        ...base,
        options: field.options,
      };

    case "multiselect":
      return {
        ...base,
        items: "string",
      };

    case "image":
      return {
        ...base,
        directory: field.directory,
        publicPath: field.publicPath,
      };

    case "file":
      return {
        ...base,
        directory: field.directory,
        publicPath: field.publicPath,
      };

    case "object":
      return {
        ...base,
        fields: resolveObjectFields(field.fields),
      };

    case "array":
      return {
        ...base,
        itemField: resolveFieldDefinition(field.itemField),
        itemLabel: field.itemLabel,
      };

    case "blocks":
      return {
        ...base,
        blockTypes: resolveBlockTypes(field.blockTypes),
        itemLabel: field.itemLabel,
      };

    case "relationship":
      return {
        ...base,
        collection: field.collection,
      };

    case "conditional":
      return {
        ...base,
        matchField: field.matchField,
        matchValue: field.matchValue,
        showField: resolveFieldDefinition(field.showField),
      };

    case "text":
      return {
        ...base,
        multiline: field.multiline,
      };

    case "date":
    case "datetime":
      return {
        ...base,
        format: field.fieldKind === "datetime" ? "datetime-local" : "date",
      };

    default:
      return base;
  }
}

function resolveObjectFields(
  fields: Record<string, FieldDefinition>
): Record<string, SchemaField> {
  const result: Record<string, SchemaField> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = resolveFieldDefinition(value);
  }
  return result;
}

function resolveBlockTypes(
  blockTypes: Record<string, FieldDefinition>
): Record<string, SchemaField> {
  const result: Record<string, SchemaField> = {};
  for (const [key, value] of Object.entries(blockTypes)) {
    result[key] = resolveFieldDefinition(value);
  }
  return result;
}
