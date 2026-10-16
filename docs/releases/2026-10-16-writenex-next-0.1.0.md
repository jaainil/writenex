# Writenex Next.js 0.1.0 release

## Publication

npm accepted public publication of `@imjp/writenex-next@0.1.0` under account `imjp`, with the `latest` tag, after browser-based publish verification. The CLI returned success and reported that the new package was processing; public registry visibility is pending verification.

Package page: https://www.npmjs.com/package/@imjp/writenex-next

The published candidate is the same tarball tested independently with both Next.js versions below. Its SHA-1 is `6942b18b57e533da9605eb216471b822292447f7` and its integrity is:

```text
sha512-leb4K0fPzwssVUacJQ4ZJKt4b3i7hgL3wPRXB/TYq5A6r6qA/9X6dcCyZCZkTvwSUPWMMqyXQ3bH/O/W/DL2kA==
```

## Delivered behavior

The package exposes a native Next.js App Router handler for Writenex's existing visual Markdown/MDX editor, configured collections/frontmatter, filesystem saves, images, search, previews, autosave, and version history. It ships its own browser assets and requires no Astro installation. Desktop styling inherits the existing editor; Next-only narrow layouts preserve the writing canvas by using separate overlay panels.

Development editing is available by default. Production editing is closed unless explicitly enabled with complete authentication on a persistent writable Node.js deployment. Setup and deployment constraints are documented in `packages/next/README.md`.

## Verification

- Full repository unit/regression suite: 37 tests passed.
- Next.js 15.5.28 and 16.1.6: isolated tarball installs without Astro, NodeNext/Bundler consumer types, development content CRUD, nested document access, image uploads/streaming, and version restoration passed.
- Both versions: production builds, default production denial, and authenticated filesystem saves passed against the final rebuilt tarball.
- Next.js 16: desktop/mobile browser checks and captures passed. The final server-only review fixes were rechecked without another visual-polish pass.
- Astro: build, type check, and all seven public export/consumer checks passed after shared-source changes.
- Type checks, targeted Biome lint, documentation token/reference/narrative checks, and `git diff --check` passed. Impeccable's one mechanical UI scan returned no findings.

## Review fixes

An independent review identified four Important issues in the original implementation. Each was reproduced with a failing regression and fixed before rebuilding the release:

1. Automatic versions now use full nested document identities, preventing equal-basename history collisions.
2. Missing-manifest recovery refuses symlinked version files before reading content or stats.
3. Aborted pending uploads cancel their body reader and return without dispatching the mutation handler.
4. Nested-pattern creation returns the same identity used by listing and immediate document reads.

All four fixes passed the complete 37-test suite. No deferred Minor findings were reported. The independent assessment covered the original implementation; the parent verified fixes through the failing-to-passing tests and complete suite, rather than commissioning a second review.

## Execution decisions

- Work used a feature branch in the existing checkout after branch-creation escalation was approved, rather than a separate worktree. Cost: filesystem isolation was not available; unrelated user work was not staged or overwritten.
- Editable filesystem paths refuse all symlinks, including links to destinations inside the root. Cost: symlink-based content trees must use regular directories.
- Native execution used a temporary ledger and no per-task automatic commits. Cost: intermediate checkpoints existed as test evidence rather than separate implementation commits; the final reviewed change is committed for the requested local merge.
- Custom host URL prefixes use an explicit `nextBasePath` option because Next.js removes its prefix from route requests. Cost: consumers using a host `basePath` set one additional documented option; route boundaries are not guessed.

## Boundaries

App Router and Node.js are supported; Pages Router, static export, Edge, ephemeral/read-only storage, and Git synchronization are outside this release. Arbitrary custom MDX components/expressions retain the inherited editor's round-trip limitations. Deployment-specific proxy behavior and arbitrary MDX fidelity were documented rather than claimed as independently verified.
