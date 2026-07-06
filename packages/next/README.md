# @imjp/writenex-next

Visual editor integration for Next.js - WYSIWYG editing for your Next.js content.

## Quick Start

### 1. Install the package

```bash
npm install @imjp/writenex-next
# or
pnpm add @imjp/writenex-next
```

### 2. Create the editor route

Create `app/_writenex/page.tsx`:

```tsx
import { createWritenexPageHandler } from "@imjp/writenex-next/routes";

export default createWritenexPageHandler();
```

### 3. Create API routes

Create `app/_writenex/api/[[...slug]]/route.ts`:

```tsx
import { createWritenexApiHandler } from "@imjp/writenex-next/api";
import { loadConfig } from "@imjp/writenex-next";

const config = await loadConfig(process.cwd());

export const { GET, POST, PUT, DELETE } = createWritenexApiHandler({
  config: config.config,
  projectRoot: process.cwd(),
});
```

### 4. Create asset route

Create `app/_writenex/assets/[[...path]]/route.ts`:

```tsx
import { createWritenexAssetHandler } from "@imjp/writenex-next/routes";

export const GET = createWritenexAssetHandler();
```

## Configuration

Create `writenex.config.ts` in your project root:

```typescript
import { defineConfig, collection, fields } from "@imjp/writenex-next";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "src/content/blog",
      schema: {
        title: fields.text({ label: "Title" }),
        body: fields.mdx({ label: "Content" }),
      },
    }),
  ],
});
```

## Development Server Alternative

If you prefer a standalone dev server alongside your Next.js app:

```typescript
import { createWritenexDevServer } from "@imjp/writenex-next";
import { loadConfig } from "@imjp/writenex-next";

const config = await loadConfig(process.cwd());

const { server, close } = createWritenexDevServer({
  projectRoot: process.cwd(),
  config: config.config,
  port: 3456,
});
```

## API

- `withWritenex(nextConfig)` - Next.js config wrapper
- `createWritenexApiHandler(options)` - App Router API handler factory
- `createWritenexPageHandler()` - Page component factory
- `createWritenexAssetHandler()` - Asset serving handler
- `createWritenexDevServer(options)` - Standalone dev server

## License

MIT - see [LICENSE](../../LICENSE) for details.
