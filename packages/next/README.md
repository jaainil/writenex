# @imjp/writenex-next

Writenex's visual Markdown/MDX editor for files in your Next.js project. Browse collections, edit frontmatter and content, upload images, autosave, and restore previous versions through the same editor used by the Astro integration.

This package uses the **Next.js App Router and Node.js runtime**. Astro is not required.

## Install and connect

```sh
npm install @imjp/writenex-next
```

Wrap your existing Next.js configuration:

```js
// next.config.mjs
import { withWritenex } from "@imjp/writenex-next";

export default withWritenex({
  // Keep your existing Next.js options here.
});
```

Create **`app/%5Fwritenex/[[...path]]/route.ts`**, or the equivalent inside `src/app`:

```ts
import { createWritenexHandler } from "@imjp/writenex-next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const handler = createWritenexHandler();
export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
export const OPTIONS = handler;
```

The **`%5F` spelling in the folder name is required**. Next.js treats folders beginning with `_` as private; `%5Fwritenex` exposes the URL `/_writenex`. Keep the optional catch-all brackets so the same route handles the page, API, and assets. Do not add a `page.tsx` in this route directory.

Run `npm run dev` and open **http://localhost:3000/_writenex**.

The configuration wrapper preserves your existing options, including configuration functions, and adds externalization/asset tracing for the installed package. The editor runs in its own HTML document; its CSS and bundled React do not enter your site's layouts or browser bundle.

## Content collections

By default, subdirectories of `content/` and `src/content/` become collections. The first root wins when collection names repeat. Markdown and MDX files are supported; frontmatter forms are inferred from existing documents. The Next.js `app/` directory is never automatically scanned as editable content.

For explicit paths, schema fields, or preview URLs, create `writenex.config.ts` in the project root:

```ts
import { defineConfig, collection, fields } from "@imjp/writenex-next/config";

export default defineConfig({
  collections: [
    collection({
      name: "blog",
      path: "content/blog",
      filePattern: "{slug}.mdx",
      previewUrl: "/blog/{slug}",
      schema: {
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        description: fields.text({ label: "Description", multiline: true }),
        draft: fields.checkbox({ label: "Draft", defaultValue: true }),
        body: fields.mdx({ label: "Content" }),
      },
    }),
  ],
  editor: { autosave: true, autosaveInterval: 3000 },
  images: { strategy: "colocated" },
  versionHistory: { enabled: true, maxVersions: 20 },
});
```

Configured paths take precedence over discovery. Set `discovery: { enabled: false }` to show only configured collections. Collection directories and image/version storage must stay within the project; symbolic links in editable paths are refused. Use regular directories rather than symlinked content trees.

`defineConfig`, `collection`, `singleton`, and `fields` are also available from the main entry. The fields API and editor are shared with the Astro integration, so their schema features stay aligned.

Preview URLs are explicit patterns, not a promise that collection names match your site's routes. MDX is edited as source, never evaluated on the server. Arbitrary custom JSX components and JavaScript expressions may not round-trip through the visual editor; use source mode for unsupported syntax and verify changes in your site's preview.

## Runtime options

Pass these options to `createWritenexHandler()` in the route file:

| Option | Default | Purpose |
| --- | --- | --- |
| `projectRoot` | `process.cwd()` | Absolute or relative project directory |
| `basePath` | `"/_writenex"` | Full public editor path, including Next.js `basePath` |
| `nextBasePath` | `""` | Host Next.js basePath, removed by Next.js before route handling |
| `contentDirs` | `["content", "src/content"]` | Ordered roots for collection discovery |
| `trailingSlash` | unspecified | Match the host's preview URL convention |
| `maxBodyBytes` | `10485760` | Maximum request body, including multipart uploads |
| `allowProduction` | `false` | Explicitly enable authenticated production editing |
| `remoteCms` | config file | Authentication settings; environment variables supply credentials |

For a Next.js site with `basePath: "/docs"`, keep the route directory under `app/%5Fwritenex/` and set:

```ts
const handler = createWritenexHandler({
  basePath: "/docs/_writenex",
  nextBasePath: "/docs",
  trailingSlash: true, // only if also enabled in next.config
});
```

For a custom editor URL such as `/studio`, use `app/studio/[[...path]]/route.ts` and `basePath: "/studio"`. Handler options and Next.js configuration must describe the same public URL; the wrapper does not inject runtime options into route modules.

Configuration loads on the first request. Imports and builds do not create content, start watchers, or write versions. API changes invalidate that handler's cache; external filesystem edits become visible after the short discovery cache expires (up to 30 seconds). Restart the server after changing `writenex.config.ts`.

## Authenticated production editing

The entire editor returns 404 in production by default. To opt in:

```ts
const handler = createWritenexHandler({
  allowProduction: true,
  remoteCms: { enabled: true },
});
```

Set server-side environment variables:

```sh
WRITENEX_CMS_USER=your-admin-username
WRITENEX_CMS_PASS=your-strong-password
WRITENEX_SECRET=your-long-random-signing-secret
```

Missing credentials or signing secret keep the editor closed. Do not use `NEXT_PUBLIC_` variables or embed credentials in the route source. Sessions use signed HttpOnly cookies, and cross-origin mutations are rejected. Use HTTPS and a trusted reverse proxy that overwrites forwarded headers; the shared login rate limiter relies on the proxy-provided client IP.

Production editing requires a **persistent writable filesystem on a Node.js server**. Preserve or mount your content, image, and `.writenex/versions` directories across releases. The configuration wrapper traces the editor assets and configuration file; it does not turn application content into persistent storage.

Static export, Edge runtime, and read-only/ephemeral serverless filesystems do not support durable editing. Installing this package on Vercel does not write edits back to your Git repository. Pages Router integration and Git synchronization are not included.

## Troubleshooting

- **404 during development:** check the literal `%5Fwritenex` folder spelling, `[[...path]]`, route exports, and App Router location.
- **404 in production:** default behavior; opt in only with complete remote CMS authentication on writable storage.
- **503:** check config syntax, credentials, and signing secret. Fix the configuration and retry or restart.
- **Empty collections:** create a directory such as `content/blog/`, or configure its exact path. Files directly in the project root are not automatically collections.
- **Assets fail to load:** use `withWritenex`, install the complete package, and ensure the handler's public `basePath` matches the host.
- **413 on upload:** increase `maxBodyBytes` to accommodate the complete multipart request, and check proxy limits.
- **403 on save:** check same-origin access, reverse proxy URL configuration, configured roots, and symlinks.

## Development in this monorepo

```sh
vp run --filter @imjp/writenex-next build
vp test run
pnpm --filter @imjp/writenex-next type-check
node packages/next/tests/consumer/check.mjs
```

Verified with Next.js 15.5.28 and 16.1.6. The consumer check packs the package and installs it in a temporary Next.js project without Astro. Use `NEXT_TEST_VERSION` to select a specific Next.js version. Browser checks use the workspace's Playwright installation.
