## [1.2.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.1...@imjp/writenex-astro@1.2.2) (2026-03-10)


### Bug Fixes

* update package description ([dfae2ce](https://github.com/jaainil/writenex/commit/dfae2cec482d00ed85e8ab2c0346450482520792))

## [1.2.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.2.0...@imjp/writenex-astro@1.2.1) (2026-03-10)


### Bug Fixes

* remove conflicting .npmrc config from release workflow ([337e2ef](https://github.com/jaainil/writenex/commit/337e2efafd17d6b3eeb6d35ec5a3225c7cb6adbd))

# [1.2.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.3...@imjp/writenex-astro@1.2.0) (2026-03-10)


### Features

* add GitHub Action skill documentation and update skills-lock.json ([0275ef1](https://github.com/jaainil/writenex/commit/0275ef10d9b511d06065bdb11d3e1ac1ee417c4c))

## [1.1.3](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.2...@imjp/writenex-astro@1.1.3) (2026-03-10)


### Bug Fixes

* add npm whoami verification step to debug auth ([7785168](https://github.com/jaainil/writenex/commit/77851688894f669e56c888a20058f97f744675fe))

## [1.1.2](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.1...@imjp/writenex-astro@1.1.2) (2026-03-10)


### Bug Fixes

* configure npm auth in workflow for semantic-release ([6820ca1](https://github.com/jaainil/writenex/commit/6820ca15b865039b431fb0034e66af2322025ef9))

## [1.1.1](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.1.0...@imjp/writenex-astro@1.1.1) (2026-03-10)


### Bug Fixes

* trigger npm publish ([454b428](https://github.com/jaainil/writenex/commit/454b428f21693ddabb97e854df028858455899e4))

# [1.1.0](https://github.com/jaainil/writenex/compare/@imjp/writenex-astro@1.0.0...@imjp/writenex-astro@1.1.0) (2026-03-10)


### Features

* add image, link, and keyboard shortcuts dialogs for the editor, along with a generic dialog component. ([ebd1caa](https://github.com/jaainil/writenex/commit/ebd1caa9909f720f580ee5e167b387ed600ff32d))
* Add Zod-based configuration schema with validation and a version history diff viewer component. ([a38449b](https://github.com/jaainil/writenex/commit/a38449b6f4296b01bb5ebbb3994e4cf964eb9524))
* Implement the initial Writenex application with its core Astro component library, editor, and filesystem management. ([0e674cc](https://github.com/jaainil/writenex/commit/0e674cc65e1bab23cffddc3898dc5bf30eaa838c))
* Introduce new `@writenex/eslint-config` package with Prettier integration. ([c955ab6](https://github.com/jaainil/writenex/commit/c955ab61221d8c24c26ef2ea0897f44a39b44450))
* Introduce new agent skills for Biome.js, ESLint/Prettier migration, and various development-related tasks, updating the skills lock file. ([cc06929](https://github.com/jaainil/writenex/commit/cc069292bf2f16c7ac7713c0761d0518f051c819))
* Introduce new agent skills for Next.js best practices, covering various topics and updating package configurations. ([d90c9aa](https://github.com/jaainil/writenex/commit/d90c9aacb5463a5d9cb36003cf51238900238452))

# 1.0.0 (2026-01-18)


### Bug Fixes

* remove duplicate pnpm version specification ([7d76b70](https://github.com/jaainil/writenex/commit/7d76b70a7b22e4370478acc39edd4e6bdaafe27f))
* update package name to @imjp/writenex-astro ([64e5fe1](https://github.com/jaainil/writenex/commit/64e5fe1b3485a5299849615d1cd8adacc77a4803))


### Features

* add @writenex/astro - CMS integration for Astro content collections ([4223c4b](https://github.com/jaainil/writenex/commit/4223c4bec0049d122785c02505181ba7d9b9bff2))
* Add new Vercel React best practice rules and skill definitions. ([5ac16f0](https://github.com/jaainil/writenex/commit/5ac16f08265e1131e2bdc24269656c3257c15d3e))
* Add numerous code block languages and implement dropdown scrolling to prevent overflow. ([5e83a81](https://github.com/jaainil/writenex/commit/5e83a81294aae72e485c314e8e28980aea48d5e6))
* **astro:** v0.2.0 - Major UI/UX improvements and new features ([29a7188](https://github.com/jaainil/writenex/commit/29a718869efe7102188a25cb4ce3b24203b76585))
* **astro:** v0.2.2 - Enhanced editor with accessibility and version history ([427a1b8](https://github.com/jaainil/writenex/commit/427a1b82d94f8eb9a2ebe78690fe2c8b48385583))
* **astro:** v0.2.4 - UI refinements and collection selection modal ([74b4766](https://github.com/jaainil/writenex/commit/74b47666bd94413a964e4bff8d51375682795569))
* **astro:** v0.2.5 - Image strategies, file patterns, and brand color system ([8787c8c](https://github.com/jaainil/writenex/commit/8787c8c01d142642c688c01439c3dc2417880014))
* **astro:** v0.3.0 - Monorepo restructuring and package consolidation ([274d651](https://github.com/jaainil/writenex/commit/274d65140f04adcd0cd337c3688e0b237ef00c47))
* **astro:** v0.3.1 - Remove customizable basePath option ([0a52e80](https://github.com/jaainil/writenex/commit/0a52e80f136a9422bde80b983a92d2c5b229724e))
* expand and categorize supported code block languages in the editor with updated display names and an empty string fallback. ([eee0e13](https://github.com/jaainil/writenex/commit/eee0e13e1dde847123170dd4865cb7462e0073d0))
* migrate to monorepo structure with pnpm workspaces ([#3](https://github.com/jaainil/writenex/issues/3)) ([6d0c62a](https://github.com/jaainil/writenex/commit/6d0c62a5106f62e8f1ced0b493f7690f0b9c4a27))
