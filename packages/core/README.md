# @imjp/writenex-core

Core framework-agnostic modules for Writenex - types, config, fields, discovery, filesystem, and shared React components.

This package is consumed by framework-specific packages:
- `@imjp/writenex-astro`
- `@imjp/writenex-next`

You typically do not need to install this directly unless building a custom framework integration.

## Modules

- `/@writenex/core` - Types, errors, and config utilities
- `/@writenex/core/config` - Configuration loading and validation
- `/@writenex/core/discovery` - Content collection discovery
- `/@writenex/core/filesystem` - File read/write, watcher, versioning
- `/@writenex/core/fields` - Fields API for defining content schemas
- `/@writenex/core/server` - Server utilities (middleware, API router, cache)
- `/@writenex/core/client` - Pre-built client bundle for direct browser serving

## License

MIT - see [LICENSE](../../LICENSE) for details.
