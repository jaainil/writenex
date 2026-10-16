# Next.js integration package — proposed design

Status: approved by the user; implementation and final verification in progress.

Publication amendment: the user subsequently requested npm publication and authenticated locally as `imjp`. Publish the verified package as public `@imjp/writenex-next@0.1.0` after review and tests. This supersedes the original no-publication boundary below.

## Purpose and success criteria

Create `@imjp/writenex-next` in `packages/next`, bringing the existing Astro integration's visual Markdown/MDX editing workflow to Next.js projects. The user confirmed that the deliverable is an integration package.

Success means a consumer can install the packed package, add a small documented Next.js route and configuration wrapper, start Next.js, and open `/_writenex` to edit files in their own project. Installing or running Astro must not be required. The existing Astro integration must continue working.

Assumptions for review: the initial supported routing integration is the App Router on Next.js 15 and 16, using the Node.js runtime. Pages Router support is outside this initial implementation. No npm publication is part of this task.

## Architecture and alternatives

Recommended: build a thin Next.js adapter around the existing framework-independent editor, fields, configuration, discovery, and filesystem source. Share these modules at build time, and ship their required code and browser assets inside the Next.js package. The installed package must not import files from the monorepo or depend on the Astro package. Keep source sharing explicit in build configuration and test the packed artifact outside the workspace.

This avoids two alternatives: copying the entire editor would create separate implementations to maintain; depending on the existing Astro package would impose an unrelated framework dependency. A larger extraction into a newly published shared core package is unnecessary for this first adapter and would expand the migration scope.

Framework-specific integration stays in `packages/next`. Shared code changes are limited to explicit extension points needed for platform branding, content-root discovery, asset location, and request adaptation. Preserve Astro defaults and public exports.

## Consumer API and installation

Expose `withWritenex` from `@imjp/writenex-next` to compose the consumer's Next.js configuration with package externalization and the required bundled-asset tracing. Preserve existing Next.js configuration values; do not replace consumer hooks or rewrite rules.

Expose `createWritenexHandler` from `@imjp/writenex-next/server`. A documented optional catch-all App Router route delegates GET, POST, PUT, DELETE, PATCH, HEAD, and OPTIONS requests to the handler. Declare `runtime = "nodejs"` and dynamic execution in the route.

The default route directory is `app/%5Fwritenex/[[...path]]/route.ts` (or under `src/app`). The encoded underscore is intentional: a literal `_writenex` directory would be private under App Router conventions. The URL remains `/_writenex`.

Re-export `defineConfig`, `collection`, `singleton`, `fields`, and the related public types through the package and its `/config` entry. Consumers can configure collections through `writenex.config.ts`, following the existing fields API.

Document custom editor paths, Next.js `basePath`, `trailingSlash`, and explicit project roots. Initialization is lazy and shared per handler instance; importing the package or building a host application must not start watchers, create versions, or write content.

## Content and editing workflow

Discover collection directories under `content/` and `src/content/`; explicit configured collection paths take precedence. Never recursively treat the Next.js `app/` tree as writable content by default. Preview URLs are configurable because content folders do not determine Next.js routes.

Retain the implemented editor workflows: collection and document browsing, visual Markdown/MDX editing, source editing where currently available, inferred/configured frontmatter forms, create/save/delete, autosave, draft state, search, image upload/discovery/serving, preview links, and version history/restore.

Preserve MDX as source rather than evaluating user-authored JavaScript on the server. Document the existing visual editor's MDX round-trip limitations; do not promise arbitrary custom component rendering.

## UI and Impeccable direction

This is an Operate surface inheriting the Astro editor's documented visual system. Preserve the Writenex logo, blue/zinc palette, Plus Jakarta Sans, compact controls, collection sidebar, frontmatter panel, light/dark themes, accessible labels, shortcuts, and focus treatments.

Use a platform setting for the header badge, tagline, generated document title, and package-specific examples. Next.js builds show Next.js; Astro builds retain their current labels. Do not create a replacement visual identity or modify the browser editor's marketing pages.

Write product context and a surface brief for the new package. Document inherited visual guidance and its source; any Next.js-specific design artifacts must reflect the finished implementation.

## Request handling and filesystem safeguards

The handler dispatches editor HTML, bundled JS/CSS assets, and existing API endpoints beneath the exact configured path boundary. Query strings and nested document paths survive adaptation. Requests outside that boundary return 404.

Bridge Web Request/Response to the existing Node-style router with real request/response stream semantics, including streamed images, request errors, response completion, cookies, and HEAD responses. Do not reuse the existing production shim's no-op stream events without tests demonstrating correctness. Apply explicit body-size limits and deterministic errors to invalid or oversized requests.

Retain path containment checks and test encoded traversal and symlink escape attempts for content, assets, images, and history. Reject cross-origin mutations to the filesystem; validate origin against the request URL and document any trusted proxy assumptions.

Responses carrying editor state, credentials, or document content use no-store caching. Unknown endpoints and unsupported methods return appropriate errors without exposing server paths or stack traces.

## Production behavior

Development editing is enabled by default. Production requests return 404 unless explicitly enabled with authenticated remote CMS configuration. Enabling production without complete credentials/signing configuration fails closed. Preserve session login/logout behavior and ensure cookies work under a configured base path.

Production editing requires a Node.js deployment with a persistent writable filesystem. Static export, Edge runtime, and ephemeral/read-only serverless filesystems cannot provide durable file editing and must be documented as unsupported deployment modes. Do not imply that enabling the package on Vercel persists edits to a Git repository.

## Packaging and validation

Ship server ESM, declarations, package exports, and self-contained browser assets. Runtime imports must resolve using the package's own exports and declared dependencies. Browser assets must not import server filesystem modules or require an import map. Asset lookup must remain correct when Next.js externalizes or traces the package.

Validate with focused tests for configuration composition, discovery precedence, request adaptation, all route methods, production guards/authentication, origin checks, path containment, uploads, and version restoration. Run the existing Astro regressions after shared-source changes.

Build and pack the package, install the tarball in an isolated Next.js fixture without Astro, type-check consumer imports, and exercise a real dev server. Check editor HTML and assets, collection discovery, content CRUD, images, and versions. Run a production build and verify that default production access is disabled. Check an authenticated production flow on a writable local Node.js server.

Inspect desktop and narrow-screen editor captures together, fix material issues in one batch, and confirm once. Run Impeccable's detector once over changed UI targets. Report the tested Next.js versions and any remaining compatibility limits; do not claim untested version support.

## Documentation and release boundary

Include installation, route setup, Next.js configuration, collection/fields examples, development usage, production authentication, deployment limits, and troubleshooting for encoded route folders and missing content. Add monorepo build/type-check integration and an isolated consumer fixture.

No marketing landing page, Git synchronization service, hosting service, npm publication, or unrelated visual redesign is included.

## Primary technical references

- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route)
- [Next.js project structure and private folders](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js serverExternalPackages](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverExternalPackages)
- Repository evidence: `packages/astro/src/integration.ts`, `src/server/`, `src/config/`, `src/discovery/`, `src/filesystem/`, `src/fields/`, `src/client/`, and `packages/astro/vite.config.ts`.
