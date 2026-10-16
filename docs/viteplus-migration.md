# Vite+ 1.3.0 migration

## Scope and preserved work

The workspace root is this repository. `packageManager` remains `pnpm@10.15.1`; `pnpm-workspace.yaml` and `pnpm-lock.yaml` remain authoritative. The pre-existing editor, persistence, accessibility, product-context, and regression-test changes were preserved. No commit or push was performed. Hook, editor, and agent setup were disabled during migration to retain the existing policy.

Original tools: Next.js 16.1.6, React 19, Tailwind 4, MDXEditor/Lexical, Dexie/Zustand, Astro 7.2.9, Vite 8.2.2, tsup 8.5.1, TypeScript 5.9.3, Turborepo, Biome, Playwright, and the Node test runner through tsx. No coverage or benchmark suite was configured.

The installed global CLI already matched the requested stable target, 1.3.0; `vp help`, `vp help migrate`, and `vp toolchain --global` were inspected. Node 24.22.0 replaced the incompatible 22.12.0 development pin. The migrator converted `.nvmrc` to `.node-version`; release CI now uses that file. The public library target remains Node 18, as before; this is separate from the development runtime.

Before migration, the three Node test files were moved to upstream Vitest 4.1.12 without changing their assertions. All 14 tests, package type checks, the Next.js build, and the tsup library build passed. Original upstream manifests, lockfile, and installed packages were kept until the migrator ran.

## Migration and manual follow-up

Command: `vp migrate --no-interactive --no-hooks --no-agent --no-editor` from the workspace root. There were no BLOCK or unresolved REVIEW findings. The migration log was retained during validation at `/tmp/writenex-viteplus-migration.log`.

- Preserved generated `catalog:` declarations, the Vite core alias, `vite@*` override, and Vite peer rules. Both direct Vite entries remain. Vitest was removed as a direct dependency by the migrator; the runner is supplied by Vite+.
- Test imports use `vite-plus/test`; configs use `vite-plus`. The published middleware's `Connect` type import stays on `vite`, as required for upstream identities outside config entry files. No upstream type augmentations or WebDriverIO provider references needed conversion.
- Merged the intermediate `tsdown.config.ts` into `packages/astro/vite.config.ts` and removed the intermediate file.
- Restored server externals and browser `deps.alwaysBundle`, which the tsup conversion had dropped. Replaced the esbuild alias plugin and JSX callback with supported aliases and transform options.
- Resolved the splitting warning with `outputOptions.codeSplitting: false`. The browser entry remains self-contained, with no import map or external JavaScript chunks.
- Preserved all seven export paths, `.js` / `.d.ts` extensions, sourcemaps, `client/index.css`, and copied `styles.css` / `variables.css`. The initial generated `.mjs` output and root `style.css` would have broken the existing manifest and asset server.
- Consolidated formatting settings and existing ignore boundaries in the root `fmt` block. Markdown and agent resources retain their prior formatting behavior. Biome remains installed and its original rules still run through `vp run lint:biome`; Turborepo still schedules the framework and library package tasks.
- Added stylesheet declarations for the Next.js app to satisfy Vite+'s type checker without disabling side-effect import checking.
- Browser test setup now waits for async document creation and selects the save-status landmark, whose text includes a timestamp. Interaction tests isolate first-install service-worker navigation; separate service-worker-enabled tests verify actual offline reloads. All original writing assertions remain, with no new skips or snapshot acceptance.

`vp build` was run against the app and correctly reported that there is no Vite `index.html` entry. This application remains Next.js. Use **`vp run build`**, which preserves `next build --webpack` and PWA generation; do not replace it with the Vite built-in. Likewise, use `vp run dev` for Next.js. The library uses **`vp -C packages/astro pack`**.

## Compatibility cleanup

The first passing migrated baseline retained every generated compatibility setting. Each setting below was then removed independently, including its generated comment, before running the listed checks. No application or test code changes were needed for these removals.

| Config | Generated setting | Result | Individual validation |
| --- | --- | --- | --- |
| `vite.config.ts` root test | `clearMocks: false` | Removed; default `true` | `vp test run`: 14 passed |
| `vite.config.ts` root test | `sharedViteServer: false` | Removed; default `true` | `vp test run`: 14 passed |
| `vite.config.ts` editor inline project | `extends: false` | Removed; inherits root | `vp test run`: 14 passed |
| `vite.config.ts` editor inline project | `clearMocks: false` | Removed; default `true` | `vp test run`: 14 passed |
| `vite.config.ts` Astro inline project | `extends: false` | Removed; inherits root | `vp test run`: 14 passed |
| `vite.config.ts` Astro inline project | `clearMocks: false` | Removed; default `true` | `vp test run`: 14 passed |
| `packages/astro/vite.config.ts` test | `clearMocks: false` | Removed; default `true` | `vp -C packages/astro test run`: 3 passed |
| `packages/astro/vite.config.ts` server pack | `deps.resolveDepSubpath: true` | Removed; default `false` | `vp -C packages/astro pack` and `vp run test:consumer` |
| `packages/astro/vite.config.ts` client pack | `deps.resolveDepSubpath: true` | Removed; default `false` | `vp -C packages/astro pack` and `vp run test:consumer` |

There are no mock-history-dependent tests or setup hooks. The inline projects retain distinct aliases and test patterns; they have no root setup files or plugins to duplicate. Enabling inheritance and default sharing still executes exactly the same 14 tests. No fake timer, Temporal, browser locator, or coverage-threshold compatibility setting was generated. ATTW was not previously enabled and no `attw.profile` setting was inserted; no declaration checks were removed.

## Validation

Final results are recorded below after running the accepted removals together. The consumer checker resolves all seven declared paths, imports all six server-side APIs, checks the browser entry and CSS assets, and compiles the emitted declarations using both NodeNext and Bundler resolution. Browser consumers also mount the actual packed client and open a content fixture.

Vite+ adds warnings for existing unused imports, unhandled promises, and broad string conversions. These were not suppressed or weakened to achieve a passing check. Build output also includes advisory Browserslist and dependency-bundling/directive warnings. No coverage or benchmark command existed to preserve or run.

## References

- [Vite+ migration](https://viteplus.dev/guide/migrate)
- [Migration rules](https://viteplus.dev/guide/migrate-rules)
- [Vitest 5 compatibility and cleanup](https://viteplus.dev/guide/vitest-v5)
- [Upstream Vitest migration](https://vitest.dev/guide/migration/)
- [tsdown 0.23 release changes](https://github.com/rolldown/tsdown/releases/tag/v0.23.0)
- [External dependency subpaths](https://tsdown.dev/options/dependencies#deps-resolvedepsubpath)
- [Built-in build versus project tasks](https://viteplus.dev/guide/build)
