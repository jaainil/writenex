# Next.js Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development if the user selects delegation. Implement task by task and track the checkboxes below.

**Goal:** Deliver an installable `@imjp/writenex-next` package that edits a Next.js project's Markdown/MDX content using the existing Writenex editor.

**Architecture:** Build a Next.js adapter and standalone browser bundle from explicitly shared Astro source modules. Add optional shared-runtime extension points while preserving Astro defaults. A native Node.js App Router handler serves the editor, assets, and filesystem API.

**Tech Stack:** TypeScript, Next.js App Router, Node streams, React/MDXEditor, Vite Plus packaging and tests, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-16-nextjs-package-design.md` (approved by the user).

## Global Constraints

- Package name: `@imjp/writenex-next`; package directory: `packages/next`.
- Initial supported routing integration: App Router on Next.js 15 and 16, using the Node.js runtime; test actual versions before claiming support.
- Installed consumers must not need Astro or monorepo source files.
- Default URL: `/_writenex`; App Router directory: `app/%5Fwritenex/[[...path]]/route.ts`, optionally under `src/`.
- Preserve existing Astro exports, configuration defaults, UI, and editing behavior.
- Discover `content/` and `src/content/`; explicitly configured collections take precedence. Do not scan `app/` as content.
- Production editing is disabled by default and requires explicit opt-in, credentials, a signing secret, and persistent writable Node.js storage.
- No npm publication, marketing page, new hosting service, or visual redesign.

## Review Focus

- Two handlers for different project roots in one process must never share collection, document, or image cache entries; pin this in Task 1 and Task 3.
- Existing async Next.js configuration functions and tracing settings must survive wrapper composition; pin this in Task 2.
- Encoded underscores, basePath, trailingSlash, and nested slugs must retain correct editor and asset URLs; pin this in Task 3 and Task 5.
- Real streamed images, aborted request bodies, HEAD, and multiple Set-Cookie values must survive Web/Node adaptation; pin this in Task 3.
- The tarball must work outside the monorepo with no Astro installation and preserve content after editing; pin this in Task 5.

## File Structure

- `packages/next/src/index.ts`: public Next.js wrapper plus shared configuration/types exports.
- `packages/next/src/next-config.ts`: configuration composition and bundled-asset tracing.
- `packages/next/src/config.ts`: browser-independent configuration entry.
- `packages/next/src/options.ts`: validated runtime options and exact path normalization.
- `packages/next/src/server/index.ts`: server public entry.
- `packages/next/src/server/handler.ts`: lazy initialization, request guards, routing, authentication.
- `packages/next/src/server/node-adapter.ts`: Web Request/Response and real Node stream bridge.
- `packages/next/src/server/assets.ts`: installed-package asset path resolution.
- `packages/next/vite.config.ts`, `tsconfig.json`, `package.json`: standalone package build and exports.
- `packages/next/tests/{config,discovery,adapter,handler,security}.test.ts`: package behavior tests.
- `packages/next/tests/consumer/`: tarball installation, type checking, Next.js fixture, browser integration.
- Shared changes stay in the owning files under `packages/astro/src/`; no parallel copied editor tree.
- `packages/next/{README.md,PRODUCT.md,DESIGN.md,.impeccable/}`: usage and inherited design documentation.

### Task 1: Make the shared runtime adaptable without changing Astro defaults

**Files:** Modify `packages/astro/src/server/{middleware,routes,assets,cache}.ts`, `packages/astro/src/discovery/collections.ts`, and the version configuration helper only if its state requires project scoping. Create `packages/astro/tests/runtime-context.test.ts`.

**Interfaces:** Extend `MiddlewareContext` with optional `contentDirs: string[]`, `clientDistPath: string`, `platform: "astro" | "next"`, and `cache: ServerCache`. Introduce `discoverProjectCollections(projectRoot: string, contentDirs: string[]): Promise<DiscoveredCollection[]>`; keep `discoverCollections(projectRoot, contentDir = "src/content")` backward compatible. Route cache access uses `context.cache ?? getCache()`.

- [x] Write tests asserting unchanged Astro discovery and asset defaults, deterministic discovery precedence, explicit collection overrides, and isolation between two temporary project roots.
- [x] Run `vp test run packages/astro/tests/runtime-context.test.ts`; confirm new behavior fails before implementation.
- [x] Implement the optional context extension points. Ensure every route using discovery/cache honors them, including images and content creation. Keep configured collection default paths consistent with the selected content root.
- [x] Run the new tests and existing Astro writer tests; verify both pass.
- [x] Inspect the diff and record the completed checkpoint without including unrelated staged user changes.

### Task 2: Create the independently buildable Next.js package and configuration API

**Files:** Create `packages/next/{package.json,tsconfig.json,vite.config.ts}`, `src/{index,config,options,next-config}.ts`, and `tests/config.test.ts`. Modify root `package.json`, `vite.config.ts`, `turbo.json`, and the lockfile as needed.

**Interfaces:** `WritenexNextOptions` includes `projectRoot?: string`, `basePath?: string`, `contentDirs?: string[]`, `trailingSlash?: boolean`, `allowProduction?: boolean`, `remoteCms?: RemoteCmsConfig`, and `maxBodyBytes?: number` (default 10 MiB). Export `withWritenex(nextConfig?: NextConfig | NextConfigFunction): NextConfig | NextConfigFunction`; retain synchronous object configuration and async function behavior. `/config` re-exports the existing fields/config API and related types.

- [x] Write tests for object/async configuration composition, preserving preexisting externals and tracing globs, correct package tracing, and rejection of invalid path/body-limit options.
- [x] Run the config tests and confirm the missing implementation causes failure.
- [x] Implement `withWritenex`, combining `serverExternalPackages` and `outputFileTracingIncludes` with existing values. Document that runtime options go to the route handler, rather than treating the wrapper as a hidden runtime configuration channel.
- [x] Configure server builds with explicit shared-source aliases; produce independent exports and browser artifacts. Track shared source files as Turbo build inputs so changes invalidate the Next package cache. Do not import the Astro integration entry or ship runtime monorepo paths.
- [x] Run config tests and package build/type checking. Inspect emitted imports and export declarations.

### Task 3: Implement the Next.js request handler, authentication, and filesystem boundaries

**Files:** Create `packages/next/src/server/{index,handler,node-adapter,assets}.ts`, `tests/{adapter,handler,security,discovery}.test.ts`; modify narrowly scoped shared filesystem containment helpers if tests expose escape paths.

**Interfaces:** `createWritenexHandler(options?: WritenexNextOptions): (request: Request) => Promise<Response>`. `runNodeHandler(request: Request, handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>, maxBodyBytes: number): Promise<Response>`. `getClientDistPath(): string` resolves this installed package's assets. Handler initialization owns its configuration, cache, and session manager.

- [x] Write adapter tests for JSON bodies, binary streamed images, aborted/erroring bodies, oversized bodies returning 413, empty HEAD responses, 204 responses, duplicate cookies, and handler failures completing without a hang.
- [x] Write handler tests for exact path boundaries, unknown endpoint/method errors, lazy import/init, query strings, nested document slugs, content root precedence, configured collection overrides, custom base paths, and two independent project roots.
- [x] Write security tests for default production 404, incomplete production credentials failing closed, login/session/logout, cross-origin mutation rejection, malformed origin rejection, and encoded traversal/symlink escapes across content, assets, images, and history.
- [x] Run tests and confirm meaningful failures before adding the handler.
- [x] Implement the stream bridge using Node stream primitives with real event/completion behavior, bounded body consumption, and deterministic failure handling. Preserve status, headers, cookies, and binary payloads.
- [x] Implement lazy configuration loading, per-handler cache/authentication, discovered/explicit collections, and routing to the shared editor/assets/API. Apply no-store headers to editor and API responses. Validate exact route boundaries before dispatch.
- [x] Use existing session signing/credentials behavior with runtime secrets; production opt-in without complete authentication stays closed. Enforce origin guards before filesystem mutations. Preserve path containment and reject symlink escapes without widening permitted roots.
- [x] Run all package tests and Astro regressions; review the handler for accidental initialization writes, leaked paths, and cross-project state.

### Task 4: Adapt the shared UI's platform identity and document consumer setup

**Files:** Modify `packages/astro/src/client/index.tsx`, `client/components/Header/Header.tsx`, server HTML generation, and package-example rendering where applicable. Create `packages/next/README.md`, `PRODUCT.md`, and `.impeccable/surfaces/editor.md`.

**Interfaces:** Extend injected editor configuration with optional `platform: "astro" | "next"`; missing platform retains Astro. Shared UI reads this setting through one typed helper, rather than inferring it from URL or performing string replacement on bundles.

- [x] Add a regression assertion that Astro retains its badge/tagline and Next receives its own platform label and document title.
- [x] Read Impeccable's craft floor immediately before the UI edit. Preserve the existing layout, colors, fonts, labels, keyboard behavior, and state handling.
- [x] Add Next.js platform branding and configuration examples while retaining Astro defaults. Build the Next browser entry and copied CSS artifacts from the shared sources.
- [x] Document installation, `withWritenex`, the encoded optional catch-all route, all HTTP method exports, `runtime = "nodejs"`, dynamic execution, content discovery/configuration, basePath, trailingSlash, versions, images, and MDX round-trip limits.
- [x] Document authenticated production configuration and the persistent writable filesystem requirement. Explicitly identify unsupported static export, Edge, and ephemeral/read-only deployments.
- [x] Validate snippet imports/types with the consumer fixture in Task 5.

### Task 5: Verify the tarball in a real Next.js consumer and finish the package

**Files:** Create `packages/next/tests/consumer/{check.mjs,api.mts,tsconfig.json}` and fixture templates including the encoded route directory, root layout, content sample, and Next.js configuration. Add package test/build scripts and relevant root test discovery. Write final `packages/next/DESIGN.md` and `.impeccable/design.json` only from the finished inherited UI.

**Interfaces:** Consumer runner accepts a Next.js version through `NEXT_TEST_VERSION`, creates an isolated temporary project, installs the package tarball and explicitly declared host dependencies, and fails on unresolved exports, incorrect edits, or missing assets. Keep this fixture outside the public browser app.

- [x] Build and pack `@imjp/writenex-next`, then install its tarball in an isolated fixture without Astro. Assert every public runtime/type entry resolves, browser assets are self-contained, and no workspace-relative imports remain.
- [x] Type-check consumer config/route imports in Bundler and NodeNext modes. Start Next.js dev and verify editor HTML/assets, collections, content create/read/update/delete, streamed images/uploads, and version history/restore against temporary files.
- [x] Exercise custom basePath, trailingSlash, and nested slugs in the fixture. Run separately on available Next.js 15 and 16 versions; report the exact tested versions.
- [x] Run a production build/start with default settings and assert 404 on editor/API routes. Then verify authenticated production editing on a local writable Node.js fixture, with credentials injected through environment variables.
- [x] Capture desktop and narrow-screen light/dark editor states in one batch. Fix material issues together and confirm at most once. Run the Impeccable detector once over changed UI files.
- [x] Request a whole-change review using the selected execution workflow; fix confirmed findings and rerun affected checks. Document the inherited design from the reviewed result without overwriting existing Astro design artifacts.
- [x] Run package tests, type checking, builds, Astro regression/consumer checks, and `git diff --check`. Report outcomes, compatibility limits, and any blocked checks explicitly. Leave publication to a separate user request.

## Execution handoff

Recommended execution: **Native**. The five tasks share adapter/context/build interfaces, so one implementer can keep those changes coherent; perform a fresh whole-change review before completion. The user must review this plan and select Native or Subagent-driven before implementation begins.

## Completion evidence

- Full suite: 37 tests passed.
- Next.js 15.5.28 and 16.1.6: isolated tarball installs, consumer types, dev CRUD/images/history, production deny/authenticated editing passed.
- Next.js16 desktop/mobile captures passed; later server-only fixes rechecked without another visual pass.
- Astro build, type check and public consumer checks passed.
- Four independent review findings reproduced with failing tests and fixed; full suite green.
- npm publication separately authorized by the user; final registry verification recorded in the release report.
