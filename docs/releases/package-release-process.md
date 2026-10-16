# Shared Astro and Next.js releases

`@imjp/writenex-astro` and `@imjp/writenex-next` use the same version, starting at 1.12.0. The existing Astro tag format (`@imjp/writenex-astro@${version}`) remains the shared version authority so release history is preserved. A shared GitHub release covers both npm packages.

On a push to `main`, `.github/workflows/release.yml` installs the frozen lockfile, runs the test suite and both package type checks, builds both packages, and invokes semantic-release. Conventional commits determine the next shared version. Both package manifests and changelogs are prepared before one release commit; both packages then publish with that version. Release runs are serialized.

The existing repository `NPM_TOKEN` secret must grant publish access to **both** packages in the `@imjp` scope. `GITHUB_TOKEN` uses the workflow's existing write permissions. npm publication must permit automation with that token; interactive login on a developer machine does not authenticate GitHub Actions. Alternatively, configure npm trusted publishing for both packages with this repository and `release.yml`.

## Initial alignment

Next.js 0.1.0 was published manually before automation was shared. Its manifest is now 1.12.0 to match Astro. The next automated release calculates a newer shared version from Astro's last release tag; it does not infer the version from the Next.js npm dist-tag.

## If publication partially fails

npm cannot publish two packages atomically. If one succeeds and the second fails, repair the credentials or registry issue, check `npm view <package>@<version> version`, and manually publish only the missing package at the already-created release version. Never overwrite a published version or delete the shared tag to retry. The next normal release continues from the shared tag.

Do not bump package versions independently. Use conventional `fix:` or `feat:` commits and let the release workflow update both.
