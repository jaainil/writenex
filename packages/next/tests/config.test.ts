import assert from "node:assert/strict";
import { test } from "vite-plus/test";
import { withWritenex } from "../src/next-config";
import { resolveOptions } from "../src/options";

test("Next config composition preserves host configuration and appends runtime tracing", async () => {
  const rewrites = async () => [{ source: "/old", destination: "/new" }];
  const original = {
    basePath: "/docs",
    rewrites,
    serverExternalPackages: ["other"],
    outputFileTracingIncludes: { "/*": ["./data/**"] },
  };
  const wrapped = withWritenex(original);
  assert.equal(wrapped.basePath, "/docs");
  assert.equal(wrapped.rewrites, rewrites);
  assert.deepEqual(wrapped.serverExternalPackages, [
    "other",
    "@imjp/writenex-next",
  ]);
  assert.ok(wrapped.outputFileTracingIncludes?.["/*"]?.includes("./data/**"));
  assert.ok(
    wrapped.outputFileTracingIncludes?.["/*"]?.includes(
      "./node_modules/@imjp/writenex-next/dist/client/**/*"
    )
  );
  assert.deepEqual(original.serverExternalPackages, ["other"]);
});

test("async Next config functions receive their context and keep their result", async () => {
  const wrapped = withWritenex(async (phase, { defaultConfig }) => ({
    ...defaultConfig,
    env: { PHASE: phase },
  }));
  const result = await wrapped("phase-development-server", {
    defaultConfig: { basePath: "/site" },
  });
  assert.equal(result.env?.PHASE, "phase-development-server");
  assert.equal(result.basePath, "/site");
  assert.ok(result.serverExternalPackages?.includes("@imjp/writenex-next"));
});

test("runtime options normalize paths and reject unsafe URLs and body limits", () => {
  assert.equal(
    resolveOptions({ basePath: "/site/_writenex/" }).basePath,
    "/site/_writenex"
  );
  assert.deepEqual(resolveOptions().contentDirs, ["content", "src/content"]);
  for (const basePath of [
    "/",
    "relative",
    "/x/../y",
    "/x?y",
    '/x"',
    "/x\\y",
    "/x//y",
  ]) {
    assert.throws(() => resolveOptions({ basePath }));
  }
  for (const maxBodyBytes of [
    0,
    -1,
    Number.NaN,
    1.5,
    Number.POSITIVE_INFINITY,
  ]) {
    assert.throws(() => resolveOptions({ maxBodyBytes }));
  }
  assert.throws(() => resolveOptions({ contentDirs: ["../outside"] }));
});
