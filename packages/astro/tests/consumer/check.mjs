import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const manifest = JSON.parse(
  await readFile(new URL("../../package.json", import.meta.url), "utf8")
);
for (const [subpath, entry] of Object.entries(manifest.exports)) {
  await access(resolve(packageRoot, entry.import));
  await access(resolve(packageRoot, entry.types));
  if (subpath !== "./client") {
    const specifier = manifest.name + (subpath === "." ? "" : subpath.slice(1));
    assert.ok(
      Object.keys(await import(specifier)).length,
      `${specifier} exports an API`
    );
  }
}
// The standalone browser entry must be served without an import map or chunks.
const client = await readFile(
  resolve(packageRoot, "dist/client/index.js"),
  "utf8"
);
assert.doesNotMatch(
  client,
  /\b(?:from\s*|import\s*\()\s*["'](?:react|react-dom|@mdxeditor|\.\/)/
);
for (const file of ["index.css", "styles.css", "variables.css"]) {
  await access(resolve(packageRoot, "dist/client", file));
}
const configPath = fileURLToPath(new URL("./tsconfig.json", import.meta.url));
for (const mode of ["NodeNext", "Bundler"]) {
  const args = ["-p", configPath];
  if (mode === "Bundler")
    args.push("--module", "ESNext", "--moduleResolution", mode);
  const result = spawnSync(
    resolve(packageRoot, "node_modules/.bin/tsc"),
    args,
    { stdio: "inherit" }
  );
  assert.equal(result.status, 0, `${mode} consumer types compile`);
}
console.log(
  "All seven export paths resolve; NodeNext and Bundler consumer types pass; browser assets are self-contained."
);
