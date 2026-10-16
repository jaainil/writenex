import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { test } from "vite-plus/test";
import {
  discoverCollections,
  discoverProjectCollections,
} from "../src/discovery/collections";
import { applyConfigDefaults } from "../src/config/defaults";
import { ServerCache } from "../src/server/cache";
import { createApiRouter } from "../src/server/routes";
import type { MiddlewareContext } from "../src/server/middleware";

async function get(context: MiddlewareContext, path: string) {
  let output = "";
  const res = {
    statusCode: 200,
    setHeader() {},
    end(chunk: string) {
      output = chunk;
    },
  } as unknown as ServerResponse;
  await createApiRouter(context)(
    { method: "GET", url: path } as IncomingMessage,
    res,
    path
  );
  return { status: res.statusCode, data: JSON.parse(output) };
}

test("discovery keeps Astro defaults and merges ordered content roots without duplicate collections", async () => {
  const root = await mkdtemp(join(tmpdir(), "wn-discovery-"));
  try {
    for (const path of [
      "content/blog",
      "src/content/blog",
      "src/content/docs",
    ]) {
      await mkdir(join(root, path), { recursive: true });
      await writeFile(
        join(root, path, "hello.md"),
        "---\ntitle: Hello\n---\nBody"
      );
    }
    assert.deepEqual(
      (await discoverCollections(root)).map((c) => c.path),
      ["src/content/blog", "src/content/docs"]
    );
    const collections = await discoverProjectCollections(root, [
      "content",
      "src/content",
    ]);
    assert.deepEqual(
      collections.map((c) => c.path),
      ["content/blog", "src/content/docs"]
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("API reads configured collection paths and isolates caches for separate projects", async () => {
  const root = await mkdtemp(join(tmpdir(), "wn-context-"));
  try {
    const contexts: MiddlewareContext[] = [];
    for (const project of ["one", "two"]) {
      await mkdir(join(root, project, "posts"), { recursive: true });
      await writeFile(
        join(root, project, "posts", "hello.md"),
        `---\ntitle: ${project}\n---\nBody`
      );
      contexts.push({
        projectRoot: join(root, project),
        basePath: "/_writenex",
        trailingSlash: "ignore",
        config: applyConfigDefaults({
          collections: [{ name: "blog", path: "posts" }],
        }),
        contentDirs: ["content", "src/content"],
        cache: new ServerCache(),
      });
    }
    assert.equal(
      (await get(contexts[0]!, "/collections")).data.collections[0].path,
      "posts"
    );
    assert.equal(
      (await get(contexts[0]!, "/content/blog/hello")).data.frontmatter.title,
      "one"
    );
    assert.equal(
      (await get(contexts[1]!, "/content/blog/hello")).data.frontmatter.title,
      "two"
    );
    assert.equal(
      (await get(contexts[0]!, "/content/blog?draft=true")).data.items[0].title,
      "one"
    );
    assert.equal(
      (await get(contexts[1]!, "/content/blog?draft=true")).data.items[0].title,
      "two"
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
