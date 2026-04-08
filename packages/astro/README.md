# @imjp/writenex-astro

Visual editor for Astro content collections - WYSIWYG editing for your Astro site.

## Overview

**@imjp/writenex-astro** is an Astro integration that provides a WYSIWYG editor interface for managing your content collections. It runs alongside your Astro dev server and provides direct filesystem access to your content.

### Key Features

- **Fields API** - TypeScript-first builder pattern with 25+ field types
- **Zero Config** - Auto-discovers your content collections from `src/content/`
- **WYSIWYG Editor** - MDXEditor-powered markdown editing with live preview
- **Smart Schema Detection** - Automatically infers frontmatter schema from existing content
- **Dynamic Forms** - Auto-generated forms based on detected or configured schema
- **Image Upload** - Drag-and-drop image upload with colocated or public storage
- **Version History** - Creates automatic shadow copies on save
- **Autosave** - Automatic saving with configurable interval
- **Keyboard Shortcuts** - Familiar shortcuts for common actions
- **Draft Management** - Toggle draft/published status with visual indicators
- **Search & Filter** - Find content quickly with search and draft filters
- **Preview Links** - Quick access to preview your content in the browser
- **Production Safe** - Disabled by default in production builds

## Quick Start

### 1. Install the integration

```bash
npx astro add @imjp/writenex-astro
```

This will install the package and automatically configure your `astro.config.mjs`.

### 2. Start your dev server

```bash
astro dev
```

### 3. Open the editor

Visit `http://localhost:4321/_writenex` in your browser.

That's it! Writenex will auto-discover your content collections and you can start editing.

### Manual Installation

If you prefer to install manually:

```bash
# npm
npm install @imjp/writenex-astro

# pnpm
pnpm add @imjp/writenex-astro

# yarn
yarn add @imjp/writenex-astro
```

Then add the integration to your config:

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import writenex from "@imjp/writenex-astro";

export default defineConfig({
  integrations: [writenex()],
});
```

## Configuration

### Zero Config (Recommended)

By default, Writenex auto-discovers your content collections from `src/content/` and infers the frontmatter schema from existing files. No configuration needed for most projects.

### Custom Configuration with Fields API

Create `writenex.config.ts` in your project root for full control:

```typescript
// writenex.config.ts
import { defineConfig, collection, fields } from "@imjp/writenex-astro";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description", multiline: true }),
        pubDate: fields.date({ label: "Published Date", validation: { isRequired: true } }),
        updatedDate: fields.datetime({ label: "Last Updated" }),
        heroImage: fields.image({ label: "Hero Image" }),
        tags: fields.multiselect({ label: "Tags", options: ["javascript", "typescript", "react", "astro"] }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.mdx({ label: "Content", validation: { isRequired: true } }),
      },
    }),
    collection({
      name: "docs",
      path: "src/content/docs",
      filePattern: "{slug}.md",
      previewUrl: "/docs/{slug}",
    }),
  ],

  images: {
    strategy: "colocated",
    publicPath: "/images",
    storagePath: "public/images",
  },

  editor: {
    autosave: true,
    autosaveInterval: 3000,
  },

  versionHistory: {
    enabled: true,
    maxVersions: 20,
  },
});
```

## Integration Options

| Option            | Type      | Default | Description                                    |
| ----------------- | --------- | ------- | ---------------------------------------------- |
| `allowProduction` | `boolean` | `false` | Enable in production builds (use with caution) |

```typescript
// astro.config.mjs
writenex({
  allowProduction: false,
});
```

The editor is always available at `/_writenex` during development.

## Fields API

The Fields API provides a TypeScript-first builder pattern for defining content schema fields.

### Imports

```typescript
import { defineConfig, collection, singleton, fields } from "@imjp/writenex-astro/config";
// or
import { defineConfig, collection, singleton, fields } from "@imjp/writenex-astro/config";
```

### collection() vs singleton()

- **`collection()`** - For multi-item content (blog posts, docs, products)
- **`singleton()`** - For single-item content (site settings, about page)

```typescript
// Multi-item collection
collection({
  name: "blog",
  path: "src/content/blog",
  schema: { /* field definitions */ }
})

// Single-item singleton
singleton({
  name: "settings",
  path: "src/content/settings.json",
  schema: { /* field definitions */ }
})
```

## Field Types

### Text Fields

#### `fields.text()`

Single or multi-line text input.

```typescript
fields.text({ label: "Title" })
fields.text({ label: "Description", multiline: true })
fields.text({ 
  label: "Bio",
  multiline: true,
  placeholder: "Tell us about yourself...",
  validation: { 
    isRequired: true,
    minLength: 10,
    maxLength: 500 
  }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `description` | `string` | Help text |
| `multiline` | `boolean` | Multi-line textarea (default: false) |
| `placeholder` | `string` | Placeholder text |
| `defaultValue` | `string` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.minLength` | `number` | Minimum character count |
| `validation.maxLength` | `number` | Maximum character count |
| `validation.pattern` | `string` | Regex pattern |
| `validation.patternDescription` | `string` | Pattern error message |

---

#### `fields.slug()`

URL-friendly slug field with auto-generation support.

```typescript
fields.slug({ label: "URL Slug" })
fields.slug({ 
  name: { label: "Name Slug", placeholder: "my-page" },
  pathname: { label: "URL Path", placeholder: "/pages/" }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `name.label` | `string` | Name field label |
| `name.placeholder` | `string` | Name placeholder |
| `pathname.label` | `string` | Path field label |
| `pathname.placeholder` | `string` | Path placeholder |

---

#### `fields.url()`

URL input with validation.

```typescript
fields.url({ label: "Website" })
fields.url({ 
  label: "GitHub Profile",
  placeholder: "https://github.com/username",
  validation: { isRequired: true }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `string` | Placeholder URL |
| `validation.isRequired` | `boolean` | Field is required |

---

### Number Fields

#### `fields.number()`

Numeric input for decimals.

```typescript
fields.number({ label: "Price" })
fields.number({ 
  label: "Rating",
  placeholder: 4.5,
  validation: { min: 0, max: 5 }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `number` | Placeholder value |
| `defaultValue` | `number` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.min` | `number` | Minimum value |
| `validation.max` | `number` | Maximum value |

---

#### `fields.integer()`

Whole number input.

```typescript
fields.integer({ label: "Quantity" })
fields.integer({ 
  label: "Year",
  validation: { min: 1900, max: 2100 }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `placeholder` | `number` | Placeholder value |
| `defaultValue` | `number` | Default value |
| `validation.isRequired` | `boolean` | Field is required |
| `validation.min` | `number` | Minimum value |
| `validation.max` | `number` | Maximum value |

---

### Selection Fields

#### `fields.select()`

Dropdown selection from options.

```typescript
fields.select({ 
  label: "Status",
  options: ["draft", "published", "archived"],
  defaultValue: "draft"
})

fields.select({
  label: "Category",
  options: ["technology", "lifestyle", "travel"],
  validation: { isRequired: true }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `options` | `string[]` | Selectable options (required) |
| `defaultValue` | `string` | Default option |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.multiselect()`

Multi-select with checkboxes or multi-select UI.

```typescript
fields.multiselect({ 
  label: "Tags",
  options: ["javascript", "typescript", "react", "node"],
  defaultValue: ["javascript"]
})

fields.multiselect({
  label: "Topics",
  options: ["frontend", "backend", "devops", "mobile"],
  validation: { isRequired: true }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `options` | `string[]` | Selectable options (required) |
| `defaultValue` | `string[]` | Default selections |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.checkbox()`

Boolean toggle.

```typescript
fields.checkbox({ label: "Published" })
fields.checkbox({ 
  label: "Featured",
  defaultValue: false
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `boolean` | Default state (default: false) |

---

### Date & Time Fields

#### `fields.date()`

Date picker.

```typescript
fields.date({ label: "Published Date" })
fields.date({ 
  label: "Event Date",
  defaultValue: "2024-01-15"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `string` | Default date (YYYY-MM-DD) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.datetime()`

Date and time picker.

```typescript
fields.datetime({ label: "Publish At" })
fields.datetime({ 
  label: "Event Date & Time",
  defaultValue: "2024-01-15T09:00"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `defaultValue` | `string` | Default datetime (ISO format) |
| `validation.isRequired` | `boolean` | Field is required |

---

### File & Media Fields

#### `fields.image()`

Image upload with preview.

```typescript
fields.image({ label: "Hero Image" })
fields.image({ 
  label: "Thumbnail",
  directory: "public/images/blog",
  publicPath: "/images/blog"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `directory` | `string` | Storage directory |
| `publicPath` | `string` | Public URL path |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.file()`

File upload for documents.

```typescript
fields.file({ label: "Attachment" })
fields.file({ 
  label: "PDF Document",
  directory: "public/files",
  publicPath: "/files"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `directory` | `string` | Storage directory |
| `publicPath` | `string` | Public URL path |
| `validation.isRequired` | `boolean` | Field is required |

---

### Structured Fields

#### `fields.object()`

Nested group of fields.

```typescript
fields.object({
  label: "Author",
  fields: {
    name: fields.text({ label: "Name" }),
    email: fields.url({ label: "Email" }),
    bio: fields.text({ label: "Bio", multiline: true }),
  }
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `fields` | `Record<string, FieldDefinition>` | Nested fields (required) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.array()`

List of items with the same schema.

```typescript
fields.array({
  label: "Tags",
  itemField: fields.text({ label: "Tag" }),
  itemLabel: "Tag"
})

fields.array({
  label: "Links",
  itemField: fields.object({
    fields: {
      title: fields.text({ label: "Title" }),
      url: fields.url({ label: "URL" }),
    }
  }),
  itemLabel: "Link"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `itemField` | `FieldDefinition` | Schema for each item (required) |
| `itemLabel` | `string` | Label for items in editor |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.blocks()`

List of items with different block types.

```typescript
fields.blocks({
  label: "Content Blocks",
  blockTypes: {
    paragraph: {
      label: "Paragraph",
      fields: {
        text: fields.text({ label: "Text", multiline: true })
      }
    },
    quote: {
      label: "Quote",
      fields: {
        text: fields.text({ label: "Quote" }),
        attribution: fields.text({ label: "Attribution" })
      }
    },
    image: {
      label: "Image",
      fields: {
        src: fields.image({ label: "Image" }),
        caption: fields.text({ label: "Caption" })
      }
    }
  },
  itemLabel: "Block"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `blockTypes` | `Record<string, BlockDefinition>` | Block type definitions (required) |
| `itemLabel` | `string` | Label for blocks in editor |

---

### Reference Fields

#### `fields.relationship()`

Reference to another collection item.

```typescript
fields.relationship({
  label: "Author",
  collection: "authors"
})

fields.relationship({
  label: "Related Posts",
  collection: "blog"
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `collection` | `string` | Target collection name (required) |
| `validation.isRequired` | `boolean` | Field is required |

---

#### `fields.pathReference()`

Reference to a file path.

```typescript
fields.pathReference({ label: "Template" })
fields.pathReference({ 
  label: "Layout",
  contentTypes: [".astro", ".mdx"]
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `contentTypes` | `string[]` | Allowed file extensions |

---

### Content Fields

#### `fields.markdoc()`

Markdoc rich content.

```typescript
fields.markdoc({ label: "Content" })
fields.markdoc({ 
  label: "Article Body",
  validation: { isRequired: true }
})
```

---

#### `fields.mdx()`

MDX content with component support.

```typescript
fields.mdx({ label: "Content" })
fields.mdx({ 
  label: "Documentation",
  validation: { isRequired: true }
})
```

---

### Conditional Fields

#### `fields.conditional()`

Show a field based on another field's value.

```typescript
fields.conditional({
  label: "CTA Button",
  matchField: "hasCTA",
  matchValue: true,
  showField: fields.object({
    fields: {
      text: fields.text({ label: "Button Text" }),
      url: fields.url({ label: "Link URL" }),
    }
  })
})

fields.conditional({
  label: "External Link",
  matchField: "linkType",
  matchValue: "external",
  showField: fields.url({ label: "URL" })
})
```

| Option | Type | Description |
|--------|------|-------------|
| `label` | `string` | Display label |
| `matchField` | `string` | Field name to check (required) |
| `matchValue` | `unknown` | Value to match (required) |
| `showField` | `FieldDefinition` | Field to show when matched (required) |

---

### Child & Nested Fields

#### `fields.child()`

Child document content.

```typescript
fields.child({ label: "Page Content" })
```

---

### Cloud & Placeholder Fields

#### `fields.cloudImage()`

Cloud-hosted image (future support).

```typescript
fields.cloudImage({ label: "Profile Picture" })
fields.cloudImage({ 
  label: "Avatar",
  provider: "cloudinary"
})
```

---

#### `fields.empty()`

Placeholder field (renders nothing).

```typescript
fields.empty({ label: "Reserved" })
```

---

#### `fields.emptyContent()`

Placeholder for empty content area.

```typescript
fields.emptyContent()
```

---

#### `fields.emptyDocument()`

Placeholder for empty document section.

```typescript
fields.emptyDocument()
```

---

#### `fields.ignored()`

Field is skipped in forms (useful for computed fields).

```typescript
fields.ignored({ label: "Internal ID" })
fields.ignored()
```

---

## Validation

All fields support validation options:

```typescript
fields.text({
  label: "Title",
  validation: {
    isRequired: true,
    minLength: 3,
    maxLength: 100,
    pattern: "^[A-Za-z]",
    patternDescription: "Must start with a letter"
  }
})

fields.number({
  label: "Price",
  validation: {
    isRequired: true,
    min: 0,
    max: 10000
  }
})
```

| Validation Option | Type | Applies To |
|-------------------|------|------------|
| `isRequired` | `boolean` | All fields |
| `min` | `number` | `number`, `integer` |
| `max` | `number` | `number`, `integer` |
| `minLength` | `number` | `text`, `url` |
| `maxLength` | `number` | `text`, `url` |
| `pattern` | `string` | `text`, `slug` |
| `patternDescription` | `string` | `text`, `slug` |

---

## Real-World Examples

### Blog Post Schema

```typescript
collection({
  name: "blog",
  path: "src/content/blog",
  filePattern: "{slug}.md",
  previewUrl: "/blog/{slug}",
  schema: {
    title: fields.text({ 
      label: "Title",
      validation: { isRequired: true, maxLength: 100 }
    }),
    slug: fields.slug({ 
      name: { label: "Slug" },
      pathname: { label: "Path", placeholder: "/blog/" }
    }),
    description: fields.text({ 
      label: "Description",
      multiline: true,
      validation: { maxLength: 300 }
    }),
    publishedAt: fields.date({ label: "Published Date" }),
    updatedAt: fields.datetime({ label: "Last Updated" }),
    author: fields.relationship({ label: "Author", collection: "authors" }),
    heroImage: fields.image({ label: "Hero Image" }),
    tags: fields.multiselect({ 
      label: "Tags",
      options: ["javascript", "typescript", "react", "astro", "node"]
    }),
    draft: fields.checkbox({ label: "Draft", defaultValue: true }),
    body: fields.mdx({ label: "Content", validation: { isRequired: true } }),
  }
})
```

### Documentation Schema

```typescript
collection({
  name: "docs",
  path: "src/content/docs",
  filePattern: "{slug}/index.md",
  previewUrl: "/docs/{slug}",
  schema: {
    title: fields.text({ label: "Title", validation: { isRequired: true } }),
    description: fields.text({ label: "Description" }),
    order: fields.integer({ label: "Sort Order" }),
    category: fields.select({
      label: "Category",
      options: ["getting-started", "guides", "api-reference", "tutorials"]
    }),
    children: fields.child({ label: "Child Pages" }),
    body: fields.markdoc({ label: "Content" }),
  }
})
```

### Product Catalog Schema

```typescript
collection({
  name: "products",
  path: "src/content/products",
  filePattern: "{slug}.md",
  previewUrl: "/products/{slug}",
  schema: {
    name: fields.text({ label: "Product Name", validation: { isRequired: true } }),
    slug: fields.slug({ name: { label: "URL Slug" } }),
    price: fields.number({ label: "Price" }),
    compareAtPrice: fields.number({ label: "Compare At Price" }),
    sku: fields.text({ label: "SKU" }),
    description: fields.text({ label: "Description", multiline: true }),
    images: fields.array({
      label: "Product Images",
      itemField: fields.image({ label: "Image" }),
      itemLabel: "Image"
    }),
    category: fields.relationship({ label: "Category", collection: "categories" }),
    tags: fields.multiselect({ 
      label: "Tags",
      options: ["new", "sale", "featured", "bestseller"]
    }),
    inStock: fields.checkbox({ label: "In Stock", defaultValue: true }),
    featured: fields.checkbox({ label: "Featured Product" }),
    specs: fields.object({
      label: "Specifications",
      fields: {
        weight: fields.text({ label: "Weight" }),
        dimensions: fields.text({ label: "Dimensions" }),
        material: fields.text({ label: "Material" }),
      }
    }),
  }
})
```

### Author Profile Schema

```typescript
collection({
  name: "authors",
  path: "src/content/authors",
  filePattern: "{slug}.md",
  previewUrl: "/authors/{slug}",
  schema: {
    name: fields.text({ label: "Name", validation: { isRequired: true } }),
    slug: fields.slug({ name: { label: "Slug" } }),
    avatar: fields.image({ label: "Avatar" }),
    role: fields.select({
      label: "Role",
      options: ["author", "editor", "contributor", "admin"],
      defaultValue: "author"
    }),
    bio: fields.text({ label: "Bio", multiline: true }),
    social: fields.object({
      label: "Social Links",
      fields: {
        twitter: fields.url({ label: "Twitter" }),
        github: fields.url({ label: "GitHub" }),
        linkedin: fields.url({ label: "LinkedIn" }),
        website: fields.url({ label: "Website" }),
      }
    }),
    email: fields.url({ label: "Email" }),
    featured: fields.checkbox({ label: "Featured Author", defaultValue: false }),
  }
})
```

---

## Migration from Plain Schema

If you have an existing plain schema config, here's how to migrate:

### Before (Plain Schema)

```typescript
export default defineConfig({
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: { type: "string", required: true },
        description: { type: "string" },
        pubDate: { type: "date", required: true },
        draft: { type: "boolean", default: false },
        tags: { type: "array", items: "string" },
        heroImage: { type: "image" },
      },
    },
  ],
});
```

### After (Fields API)

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-astro/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description" }),
        pubDate: fields.date({ label: "Published Date", validation: { isRequired: true } }),
        draft: fields.checkbox({ label: "Draft", defaultValue: false }),
        tags: fields.array({ label: "Tags", itemField: fields.text({ label: "Tag" }) }),
        heroImage: fields.image({ label: "Hero Image" }),
      },
    }),
  ],
});
```

### Type Mapping

| Plain Schema | Fields API |
|--------------|------------|
| `type: "string"` | `fields.text()` |
| `type: "number"` | `fields.number()` |
| `type: "boolean"` | `fields.checkbox()` |
| `type: "date"` | `fields.date()` |
| `type: "array"` | `fields.array({ itemField: ... })` |
| `type: "object"` | `fields.object({ fields: ... })` |
| `type: "image"` | `fields.image()` |

---

## Collection Configuration

| Option        | Type     | Description                                 |
| ------------- | -------- | ------------------------------------------- |
| `name`        | `string` | Collection identifier (matches folder name) |
| `path`        | `string` | Path to collection directory                |
| `filePattern` | `string` | File naming pattern (e.g., `{slug}.md`)     |
| `previewUrl`  | `string` | URL pattern for preview links               |
| `schema`      | `object` | Frontmatter schema definition (Fields API)  |
| `images`      | `object` | Override image settings for this collection |

## Image Strategies

### Colocated (Default)

Images are stored alongside content files in a folder with the same name:

```
src/content/blog/
├── my-post.md
└── my-post/
    ├── hero.jpg
    └── diagram.png
```

Reference in markdown: `![Alt](./my-post/hero.jpg)`

### Public

Images are stored in the `public/` directory:

```
public/
└── images/
    └── blog/
        └── my-post-hero.jpg
```

Reference in markdown: `![Alt](/images/blog/my-post-hero.jpg)`

Configure in `writenex.config.ts`:

```typescript
images: {
  strategy: "public",
  publicPath: "/images",
  storagePath: "public/images",
}
```

## Version History

Writenex automatically creates shadow copies of your content before each save, providing a safety net for content editors.

### How It Works

1. Before saving content, Writenex creates a snapshot of the current file
2. Snapshots are stored in `.writenex/versions/` (excluded from Git by default)
3. Old versions are automatically pruned to maintain the configured limit
4. Labeled versions (manual snapshots) are preserved during pruning

### Storage Structure

```
.writenex/versions/
├── .gitignore              # Excludes version files from Git
└── blog/
    └── my-post/
        ├── manifest.json   # Version metadata
        ├── 2024-12-11T10-30-00-000Z.md
        └── 2024-12-11T11-45-00-000Z.md
```

### Configuration

```typescript
// writenex.config.ts
import { defineConfig } from "@imjp/writenex-astro";

export default defineConfig({
  versionHistory: {
    enabled: true,
    maxVersions: 20,
    storagePath: ".writenex/versions",
  },
});
```

| Option        | Type      | Default              | Description                           |
| ------------- | --------- | -------------------- | ------------------------------------- |
| `enabled`     | `boolean` | `true`               | Enable/disable version history        |
| `maxVersions` | `number`  | `20`                 | Maximum unlabeled versions to keep    |
| `storagePath` | `string`  | `.writenex/versions` | Storage path relative to project root |

### Version History API

| Method | Endpoint                                               | Description           |
| ------ | ------------------------------------------------------ | --------------------- |
| GET    | `/_writenex/api/versions/:collection/:id`              | List all versions     |
| GET    | `/_writenex/api/versions/:collection/:id/:versionId`   | Get specific version  |
| POST   | `/_writenex/api/versions/:collection/:id`              | Create manual version |
| POST   | `/_writenex/api/versions/:collection/:id/:vid/restore` | Restore version       |
| GET    | `/_writenex/api/versions/:collection/:id/:vid/diff`    | Get diff data         |
| DELETE | `/_writenex/api/versions/:collection/:id/:versionId`   | Delete version        |
| DELETE | `/_writenex/api/versions/:collection/:id`              | Clear all versions    |

### Example: List Versions

```bash
curl http://localhost:4321/_writenex/api/versions/blog/my-post
```

```json
{
  "versions": [
    {
      "id": "2024-12-11T12-00-00-000Z",
      "timestamp": "2024-12-11T12:00:00.000Z",
      "preview": "# My Post\n\nThis is the introduction...",
      "size": 2048
    },
    {
      "id": "2024-12-11T11-45-00-000Z",
      "timestamp": "2024-12-11T11:45:00.000Z",
      "preview": "# My Post\n\nEarlier version...",
      "size": 1856,
      "label": "Before major rewrite"
    }
  ]
}
```

### Example: Restore Version

```bash
curl -X POST http://localhost:4321/_writenex/api/versions/blog/my-post/2024-12-11T11-45-00-000Z/restore
```

```json
{
  "success": true,
  "version": {
    "id": "2024-12-11T11-45-00-000Z",
    "timestamp": "2024-12-11T11:45:00.000Z",
    "preview": "# My Post\n\nEarlier version...",
    "size": 1856
  },
  "safetySnapshot": {
    "id": "2024-12-11T12-05-00-000Z",
    "timestamp": "2024-12-11T12:05:00.000Z",
    "preview": "# My Post\n\nThis is the introduction...",
    "size": 2048,
    "label": "Before restore"
  }
}
```

### Programmatic Usage

```typescript
import {
  saveVersionWithConfig,
  getVersionsWithConfig,
  restoreVersionWithConfig,
} from "@imjp/writenex-astro";

// Save a version with label
await saveVersionWithConfig(
  "/project",
  "blog",
  "my-post",
  "---\ntitle: My Post\n---\n\nContent...",
  { maxVersions: 50 },
  { label: "Before major changes" }
);

// List versions
const versions = await getVersionsWithConfig("/project", "blog", "my-post");

// Restore a version
const result = await restoreVersionWithConfig(
  "/project",
  "blog",
  "my-post",
  "2024-12-11T10-30-00-000Z",
  "/project/src/content/blog/my-post.md"
);
```

## File Patterns

Writenex supports various file naming patterns with automatic token resolution:

| Pattern                          | Example Output               | Use Case               |
| -------------------------------- | ---------------------------- | ---------------------- |
| `{slug}.md`                      | `my-post.md`                 | Simple (default)       |
| `{slug}/index.md`                | `my-post/index.md`           | Folder-based           |
| `{date}-{slug}.md`               | `2024-01-15-my-post.md`      | Date-prefixed          |
| `{year}/{slug}.md`               | `2024/my-post.md`            | Year folders           |
| `{year}/{month}/{slug}.md`       | `2024/06/my-post.md`         | Year/month folders     |
| `{year}/{month}/{day}/{slug}.md` | `2024/06/15/my-post.md`      | Full date folders      |
| `{lang}/{slug}.md`               | `en/my-post.md`              | i18n/multi-language    |
| `{lang}/{slug}/index.md`         | `id/my-post/index.md`        | i18n with folder-based |
| `{category}/{slug}.md`           | `tutorials/my-post.md`       | Category folders       |
| `{category}/{slug}/index.md`     | `tutorials/my-post/index.md` | Category folder-based  |

Patterns are auto-detected from existing content or can be configured explicitly.

### Supported Tokens

| Token        | Source                                      | Default Value   |
| ------------ | ------------------------------------------- | --------------- |
| `{slug}`     | Generated from title                        | Required        |
| `{date}`     | `pubDate` from frontmatter                  | Current date    |
| `{year}`     | Year from `pubDate`                         | Current year    |
| `{month}`    | Month from `pubDate` (zero-padded)          | Current month   |
| `{day}`      | Day from `pubDate` (zero-padded)            | Current day     |
| `{lang}`     | `lang`/`language`/`locale` from frontmatter | `en`            |
| `{category}` | `category`/`categories[0]` from frontmatter | `uncategorized` |
| `{author}`   | `author` from frontmatter                   | `anonymous`     |
| `{type}`     | `type`/`contentType` from frontmatter       | `post`          |
| `{status}`   | `status`/`draft` from frontmatter           | `published`     |
| `{series}`   | `series` from frontmatter                   | Empty string    |

### Custom Tokens

Any token in your pattern that is not in the supported list will be resolved from frontmatter. For example, if you use `{project}/{slug}.md`, the `{project}` value will be taken from `frontmatter.project`.

```typescript
// writenex.config.ts
collections: [
  collection({
    name: "docs",
    path: "src/content/docs",
    filePattern: "{project}/{slug}.md",
  }),
];
```

## Keyboard Shortcuts

| Shortcut               | Action              |
| ---------------------- | ------------------- |
| `Alt + N`              | New Content         |
| `Ctrl/Cmd + S`         | Save                |
| `Ctrl/Cmd + P`         | Open preview        |
| `Ctrl/Cmd + /`         | Show shortcuts help |
| `Ctrl/Cmd + Shift + R` | Refresh content     |
| `Escape`               | Close modal         |

Press `Ctrl/Cmd + /` in the editor to see all available shortcuts.

## API Endpoints

The integration provides REST API endpoints for programmatic access:

| Method | Endpoint                                 | Description                |
| ------ | ---------------------------------------- | -------------------------- |
| GET    | `/_writenex/api/collections`             | List all collections       |
| GET    | `/_writenex/api/config`                  | Get current configuration  |
| GET    | `/_writenex/api/content/:collection`     | List content in collection |
| GET    | `/_writenex/api/content/:collection/:id` | Get single content item    |
| POST   | `/_writenex/api/content/:collection`     | Create new content         |
| PUT    | `/_writenex/api/content/:collection/:id` | Update content             |
| DELETE | `/_writenex/api/content/:collection/:id` | Delete content             |
| POST   | `/_writenex/api/images`                  | Upload image               |

### Example: List Collections

```bash
curl http://localhost:4321/_writenex/api/collections
```

```json
{
  "collections": [
    {
      "name": "blog",
      "path": "src/content/blog",
      "filePattern": "{slug}.md",
      "count": 12,
      "schema": { ... }
    }
  ]
}
```

### Example: Get Content

```bash
curl http://localhost:4321/_writenex/api/content/blog/my-post
```

```json
{
  "id": "my-post",
  "path": "src/content/blog/my-post.md",
  "frontmatter": {
    "title": "My Post",
    "pubDate": "2024-01-15",
    "draft": false
  },
  "body": "# My Post\n\nContent here..."
}
```

## Security

### Production Guard

The integration is **disabled by default in production** to prevent accidental exposure. When you run `astro build`, Writenex will not be included.

### Enabling in Production

Only enable for staging/preview environments with proper authentication:

```typescript
// astro.config.mjs - USE WITH CAUTION
writenex({
  allowProduction: true,
});
```

**Warning:** Enabling in production exposes filesystem write access. Only use behind authentication or in trusted environments.

## Troubleshooting

### Editor not loading

1. Ensure you're running `astro dev` (not `astro build`)
2. Check the console for errors
3. Verify the integration is added to `astro.config.mjs`

### Collections not discovered

1. Ensure content is in `src/content/` directory
2. Check that files have `.md` extension
3. Verify frontmatter is valid YAML

### Config file not loading

1. Ensure `writenex.config.ts` is in your project root
2. Check the file has proper exports: `export default defineConfig({ ... })`
3. Restart the dev server after making changes

### Field types not rendering correctly

1. Verify the field type is spelled correctly (e.g., `fields.text`, not `fields.string`)
2. Check that required config properties are provided (e.g., `options` for `select`)
3. For `object` and `array`, ensure `fields` or `itemField` is properly nested

### Validation not working

1. Ensure `validation` object is inside the field config, not outside
2. Check that validation rules match the field type (e.g., `min`/`max` for numbers)
3. Remember `isRequired` only validates on form submission

### Collection not found for relationship

1. Verify the `collection` name matches exactly (case-sensitive)
2. Ensure the referenced collection is also defined in your config
3. Check that the referenced collection has at least one item

### Images not uploading

1. Check file permissions on the target directory
2. Ensure the image strategy is configured correctly
3. For colocated strategy, the content folder must be writable

### Autosave not working

1. Check if autosave is enabled in config
2. Verify there are actual changes to save
3. Look for errors in the browser console

## Requirements

- Astro 4.x, 5.x, or 6.x
- React 18.x or 19.x
- Node.js 22.12.0+ (Node 18 and 20 are no longer supported)

## License

MIT - see [LICENSE](../../LICENSE) for details.

## Related

- [Writenex](https://writenex.com) - Standalone markdown editor
- [Writenex Monorepo](../../README.md) - Project overview
