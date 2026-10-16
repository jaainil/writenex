# Writenex Monorepo

A collection of tools for modern markdown editing and content management.

## Version 2.0.0

This major release includes significant improvements and breaking changes for better functionality.

## Products

| **Product**                          | **Description**                                                      |
| ------------------------------------ | -------------------------------------------------------------------- |
| [Writenex Editor](./apps/writenex/)  | WYSIWYG Markdown editor that works offline and keeps your data local |
| [@imjp/writenex-astro](./packages/astro/) | WYSIWYG Markdown editor for Astro Content Collections — includes an optional [Remote CMS](./packages/astro/docs/remote-cms.md) for editing content on your live site |

## Project Structure

```
writenex/
├── apps/
│   └── writenex/              # Writenex Editor
│       └── lib/               # Core modules (db, editor, hooks, store, ui, utils)
│
├── packages/
│   ├── astro/                 # @imjp/writenex-astro - Astro integration
│   └── config/                # Shared configurations
│       ├── typescript/        # @writenex/tsconfig
│       └── eslint/            # @writenex/eslint-config
│
├── package.json               # Root workspace config
├── pnpm-workspace.yaml        # Workspace definition
└── turbo.json                 # Turborepo config
```

## Getting Started

### Prerequisites

- Node.js 24.22.0 (pinned in `.node-version`)
- Vite+ 1.3.0, or use `pnpm exec vp` for the local CLI
- pnpm 10+

### Installation

```bash
git clone https://github.com/jaainil/writenex.git
cd writenex
vp install
```

### Development

```bash
# Start all apps in development mode
vp run dev

# Build all packages
vp run build

# Run linting
vp run lint

# Type check all packages
vp run type-check

# Run persistence, search, and filesystem regression tests
vp test run

# Run desktop and mobile browser tests (starts the editor automatically)
pnpm exec playwright install chromium
vp run test:e2e

# Format code
vp fmt

# Clean all build artifacts
vp run clean
```

### Working with Specific Packages

```bash
# Writenex Editor
vp run dev:writenex
vp run build:writenex

# @imjp/writenex-astro
vp -C packages/astro pack
```

`vp dev` and `vp build` are built-in Vite commands. This workspace preserves Next.js through `vp run dev` and `vp run build`. Run `vp check` for formatting, lint, and type checks, and `vp run test:consumer` to check the library exports and declarations. Biome remains available through `vp run lint:biome` for the existing project rules.

See [the migration report](docs/viteplus-migration.md) for validation and compatibility decisions.

## Tech Stack

- **Toolchain**: Vite+ 1.3.0, Vitest 5, Rolldown/tsdown library builds
- **Monorepo**: pnpm workspaces + Turborepo (preserved task scheduling)
- **Framework**: Next.js 16+ (App Router, Turbopack)
- **React**: 19.x
- **Language**: TypeScript 5 (Strict mode)
- **Styling**: Tailwind CSS 4
- **Editor**: MDXEditor / Lexical
- **State**: Zustand
- **Database**: Dexie (IndexedDB)
- **UI**: Radix UI primitives (shadcn/ui style)

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [MDXEditor](https://mdxeditor.dev/) - WYSIWYG markdown editor
- [Zustand](https://zustand-demo.pmnd.rs/) - State management
- [Dexie.js](https://dexie.org/) - IndexedDB wrapper
- [Radix UI](https://www.radix-ui.com/) - UI primitives
- [Turborepo](https://turbo.build/) - Monorepo tooling

## License

MIT - see [LICENSE](./LICENSE) for details.
