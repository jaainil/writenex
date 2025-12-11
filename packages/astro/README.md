# @writenex/astro

CMS integration for Astro content collections - WYSIWYG editing for your Astro site.

## Overview

**@writenex/astro** is an Astro integration that provides a WYSIWYG editor interface for managing your content collections. It runs alongside your Astro dev server and provides direct filesystem access to your content.

### Key Features

- **Zero Config** - Auto-discovers your content collections from `src/content/`
- **WYSIWYG Editor** - MDXEditor-powered markdown editing with live preview
- **Smart Schema Detection** - Automatically infers frontmatter schema from existing content
- **Dynamic Forms** - Auto-generated forms based on detected or configured schema
- **Image Upload** - Drag-and-drop image upload with colocated or public storage
- **Autosave** - Automatic saving with configurable interval
- **Keyboard Shortcuts** - Familiar shortcuts for common actions
- **Draft Management** - Toggle draft/published status with visual indicators
- **Search & Filter** - Find content quickly with search and draft filters
- **Preview Links** - Quick access to preview your content in the browser
- **Production Safe** - Disabled by default in production builds

## Installation

```bash
# npm
npm install @writenex/astro

# pnpm
pnpm add @writenex/astro

# yarn
yarn add @writenex/astro
```

## Quick Start

### 1. Add the integration

```typescript
// astro.config.mjs
import { defineConfig } from "astro/config";
import writenex from "@writenex/astro";

export default defineConfig({
  integrations: [writenex()],
});
```

### 2. Start your dev server

```bash
astro dev
```

### 3. Open the editor

Visit `http://localhost:4321/_writenex` in your browser.

That's it! Writenex will auto-discover your content collections and you can start editing.

## Configuration

### Zero Config (Recommended)

By default, Writenex auto-discovers your content collections from `src/content/` and infers the frontmatter schema from existing files. No configuration needed for most projects.

### Custom Configuration

Create `writenex.config.ts` in your project root for full control:

```typescript
// writenex.config.ts
import { defineConfig } from "@writenex/astro";

export default defineConfig({
  // Define collections explicitly
  collections: [
    {
      name: "blog",
      path: "src/content/blog",
      filePattern: "{slug}.md",
      previewUrl: "/blog/{slug}",
      schema: {
        title: { type: "string", required: true },
        description: { type: "string" },
        pubDate: { type: "date", required: true },
        updatedDate: { type: "date" },
        heroImage: { type: "image" },
        tags: { type: "array", items: "string" },
        draft: { type: "boolean", default: false },
      },
    },
    {
      name: "docs",
      path: "src/content/docs",
      filePattern: "{slug}.md",
      previewUrl: "/docs/{slug}",
    },
  ],

  // Image upload settings
  images: {
    strategy: "colocated", // 'colocated' | 'public'
    publicPath: "/images", // For 'public' strategy
    storagePath: "public/images", // For 'public' strategy
  },

  // Editor settings
  editor: {
    autosave: true,
    autosaveInterval: 3000, // milliseconds
  },
});
```

## Integration Options

| Option            | Type      | Default        | Description                                    |
| ----------------- | --------- | -------------- | ---------------------------------------------- |
| `allowProduction` | `boolean` | `false`        | Enable in production builds (use with caution) |
| `basePath`        | `string`  | `'/_writenex'` | Base path for the editor UI                    |

```typescript
// astro.config.mjs
writenex({
  allowProduction: false, // Keep false for security
  basePath: "/_writenex", // Change if needed
});
```

## Collection Configuration

| Option        | Type     | Description                                 |
| ------------- | -------- | ------------------------------------------- |
| `name`        | `string` | Collection identifier (matches folder name) |
| `path`        | `string` | Path to collection directory                |
| `filePattern` | `string` | File naming pattern (e.g., `{slug}.md`)     |
| `previewUrl`  | `string` | URL pattern for preview links               |
| `schema`      | `object` | Frontmatter schema definition               |
| `images`      | `object` | Override image settings for this collection |

### Schema Field Types

| Type      | Form Component | Example Value           |
| --------- | -------------- | ----------------------- |
| `string`  | Text input     | `"Hello World"`         |
| `number`  | Number input   | `42`                    |
| `boolean` | Toggle switch  | `true`                  |
| `date`    | Date picker    | `"2024-01-15"`          |
| `array`   | Tag input      | `["astro", "tutorial"]` |
| `image`   | Image uploader | `"./my-post/hero.jpg"`  |

```typescript
schema: {
  title: { type: "string", required: true },
  description: { type: "string" },
  pubDate: { type: "date", required: true },
  tags: { type: "array", items: "string" },
  draft: { type: "boolean", default: false },
  heroImage: { type: "image" },
}
```

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
  {
    name: "docs",
    path: "src/content/docs",
    filePattern: "{project}/{slug}.md", // Custom token
  },
];
```

When creating content with frontmatter `{ project: "my-app", title: "Getting Started" }`, the file will be created at `src/content/docs/my-app/getting-started.md`.

## Keyboard Shortcuts

| Shortcut               | Action              |
| ---------------------- | ------------------- |
| `Ctrl/Cmd + S`         | Save                |
| `Ctrl/Cmd + N`         | New content         |
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

### Images not uploading

1. Check file permissions on the target directory
2. Ensure the image strategy is configured correctly
3. For colocated strategy, the content folder must be writable

### Autosave not working

1. Check if autosave is enabled in config
2. Verify there are actual changes to save
3. Look for errors in the browser console

## Requirements

- Astro 4.x or 5.x
- React 18.x or 19.x
- Node.js 18+

### Future Plans

- MDX full support (components, imports)
- CLI wrapper (`npx @writenex/astro`)
- Git integration (auto-commit on save)
- Media library management

## License

MIT - see [LICENSE](../../LICENSE) for details.

## Related

- [Writenex](https://writenex.com) - Standalone markdown editor
- [Writenex Monorepo](../../README.md) - Project overview
