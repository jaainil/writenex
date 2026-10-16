import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  writeFile,
  readFile,
  rm,
  symlink,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vite-plus/test";
import { createWritenexHandler } from "../src/server/handler";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "wn-next-"));
  await mkdir(join(root, "content/blog"), { recursive: true });
  await writeFile(
    join(root, "content/blog/hello.md"),
    "---\ntitle: Hello\n---\nOriginal"
  );
  return root;
}
function request(
  path: string,
  method = "GET",
  body?: unknown,
  headers: HeadersInit = {}
) {
  return new Request(`http://localhost/_writenex${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

test("Next.js-normalized requests use the explicit host basePath without losing public asset URLs", async () => {
  const root = await fixture();
  try {
    const handler = createWritenexHandler({
      projectRoot: root,
      basePath: "/site/_writenex",
      nextBasePath: "/site",
    });
    const page = await handler(new Request("http://localhost/_writenex/"));
    assert.equal(page.status, 200);
    assert.match(await page.text(), /\/site\/_writenex\/assets\/index.js/);
    assert.equal(
      (await handler(new Request("http://localhost/_writenex-other/"))).status,
      404
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Next handler serves the editor and independently edits discovered content with history", async () => {
  const root = await fixture();
  try {
    const handler = createWritenexHandler({ projectRoot: root });
    const page = await handler(request(""));
    assert.equal(page.status, 200);
    assert.match(await page.text(), /platform: "next"/);
    const collections = await (
      await handler(request("/api/collections"))
    ).json();
    assert.equal(collections.collections[0].path, "content/blog");
    const before = await (
      await handler(request("/api/content/blog/hello"))
    ).json();
    assert.equal(before.body.trim(), "Original");
    const saved = await handler(
      request("/api/content/blog/hello", "PUT", {
        frontmatter: { title: "Updated" },
        body: "New body",
      })
    );
    assert.equal(saved.status, 200, await saved.text());
    assert.match(
      await readFile(join(root, "content/blog/hello.md"), "utf8"),
      /New body/
    );
    const versions = await (
      await handler(request("/api/versions/blog/hello"))
    ).json();
    assert.ok(versions.versions.length > 0);
    const restored = await handler(
      request(
        `/api/versions/blog/hello/${versions.versions[0].id}/restore`,
        "POST"
      )
    );
    assert.equal(restored.status, 200);
    assert.match(
      await readFile(join(root, "content/blog/hello.md"), "utf8"),
      /Original/
    );
    assert.equal((await handler(request("/api/missing"))).status, 404);
    assert.equal(
      (await handler(request("/api/collections", "PATCH"))).status,
      405
    );
    assert.equal(
      (await handler(new Request("http://localhost/_writenex-other"))).status,
      404
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("custom base path and encoded nested slugs preserve content identity", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "content/blog/nested"));
    await writeFile(
      join(root, "content/blog/nested/post.md"),
      "---\ntitle: Nested\n---\nNested body"
    );
    const handler = createWritenexHandler({
      projectRoot: root,
      basePath: "/site/editor",
      trailingSlash: true,
    });
    const page = await handler(new Request("http://localhost/site/editor/"));
    assert.match(await page.text(), /\/site\/editor\/assets\/index.js/);
    const response = await handler(
      new Request("http://localhost/site/editor/api/content/blog/nested%2Fpost")
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).body.trim(), "Nested body");
    const listing = await (
      await handler(
        new Request("http://localhost/site/editor/api/content/blog?draft=true")
      )
    ).json();
    assert.ok(
      listing.items.some((item: { id: string }) => item.id === "nested/post")
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("images upload beside discovered content and stream back with the same bytes", async () => {
  const root = await fixture();
  try {
    const handler = createWritenexHandler({ projectRoot: root });
    const form = new FormData();
    form.set("collection", "blog");
    form.set("contentId", "hello");
    form.set(
      "file",
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
      "photo.png"
    );
    const uploaded = await handler(
      new Request("http://localhost/_writenex/api/images", {
        method: "POST",
        body: form,
      })
    );
    assert.equal(uploaded.status, 200);
    const result = await uploaded.json();
    const filename = result.path.split("/").at(-1);
    assert.deepEqual(
      [...(await readFile(join(root, "content/blog/hello", filename)))],
      [137, 80, 78, 71]
    );
    const served = await handler(request(`/api/images/blog/hello/${filename}`));
    assert.equal(served.status, 200);
    assert.deepEqual(
      [...new Uint8Array(await served.arrayBuffer())],
      [137, 80, 78, 71]
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("new content and nested version directories cannot traverse symlinks", async () => {
  const root = await fixture();
  const outside = await fixture();
  try {
    await symlink(outside, join(root, "content/blog/escape"));
    const handler = createWritenexHandler({ projectRoot: root });
    const created = await handler(
      request("/api/content/blog", "POST", {
        frontmatter: { title: "Escape" },
        slug: "escape/escaped",
        body: "Unsafe",
      })
    );
    assert.notEqual(created.status, 200);
    await mkdir(join(root, ".writenex/versions"), { recursive: true });
    await symlink(outside, join(root, ".writenex/versions/blog"));
    const version = await handler(
      request("/api/versions/blog/hello", "POST", { label: "Unsafe" })
    );
    assert.notEqual(version.status, 200);
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("mutations reject foreign origins and encoded path escapes", async () => {
  const root = await fixture();
  try {
    const handler = createWritenexHandler({ projectRoot: root });
    for (const origin of ["https://evil.example", "null", "invalid origin"]) {
      assert.equal(
        (
          await handler(
            request("/api/content/blog/hello", "DELETE", undefined, {
              Origin: origin,
            })
          )
        ).status,
        403
      );
    }
    assert.equal(
      (
        await handler(
          request("/api/content/blog/hello", "DELETE", undefined, {
            "Sec-Fetch-Site": "cross-site",
          })
        )
      ).status,
      403
    );
    for (const path of [
      "/api/content/blog/..%2F..%2Fsecret",
      "/api/versions/blog/%252e%252e%252fsecret",
      "/assets/..%2Fsecret",
    ]) {
      assert.equal((await handler(request(path))).status, 403);
    }
    assert.match(
      await readFile(join(root, "content/blog/hello.md"), "utf8"),
      /Original/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("symlink content and history escapes never read or overwrite external files", async () => {
  const root = await fixture();
  const outside = await fixture();
  try {
    await symlink(
      join(outside, "content/blog/hello.md"),
      join(root, "content/blog/link.md")
    );
    await symlink(outside, join(root, ".writenex"));
    const handler = createWritenexHandler({ projectRoot: root });
    const read = await handler(request("/api/content/blog/link"));
    assert.notEqual(read.status, 200);
    const save = await handler(
      request("/api/content/blog/hello", "PUT", { body: "Changed" })
    );
    assert.notEqual(save.status, 200);
    assert.match(
      await readFile(join(outside, "content/blog/hello.md"), "utf8"),
      /Original/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("production is closed by default and requires complete authenticated opt-in", async () => {
  const root = await fixture();
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    assert.equal(
      (await createWritenexHandler({ projectRoot: root })(request(""))).status,
      404
    );
    assert.equal(
      (
        await createWritenexHandler({
          projectRoot: root,
          allowProduction: true,
        })(request(""))
      ).status,
      503
    );
    const handler = createWritenexHandler({
      projectRoot: root,
      allowProduction: true,
      remoteCms: {
        enabled: true,
        username: "editor",
        password: "test-password",
        secret: "test-signing-secret-at-least-32-bytes",
      },
    });
    assert.equal((await handler(request(""))).status, 401);
    const login = await handler(
      request("/api/auth/login/", "POST", {
        username: "editor",
        password: "test-password",
      })
    );
    assert.equal(login.status, 200);
    const cookie = login.headers.get("set-cookie")!.split(";")[0]!;
    const response = await handler(
      request("/api/collections", "GET", undefined, { Cookie: cookie })
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const logout = await handler(
      request("/api/auth/logout", "POST", undefined, { Cookie: cookie })
    );
    assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/);
  } finally {
    process.env.NODE_ENV = previous;
    await rm(root, { recursive: true, force: true });
  }
});

test("automatic history keeps nested documents separate from equal basenames", async () => {
  const root = await fixture();
  try {
    await mkdir(join(root, "content/blog/nested"));
    await writeFile(
      join(root, "content/blog/post.md"),
      "---\ntitle: Flat\n---\nFlat original"
    );
    await writeFile(
      join(root, "content/blog/nested/post.md"),
      "---\ntitle: Nested\n---\nNested original"
    );
    const handler = createWritenexHandler({ projectRoot: root });
    const saved = await handler(
      request("/api/content/blog/nested%2Fpost", "PUT", { body: "Nested edit" })
    );
    assert.equal(saved.status, 200);
    const nested = await (
      await handler(request("/api/versions/blog/nested%2Fpost"))
    ).json();
    const flat = await (
      await handler(request("/api/versions/blog/post"))
    ).json();
    assert.equal(nested.versions.length, 1);
    assert.equal(flat.versions.length, 0);
    await handler(
      request(
        `/api/versions/blog/nested%2Fpost/${nested.versions[0].id}/restore`,
        "POST"
      )
    );
    assert.match(
      await readFile(join(root, "content/blog/nested/post.md"), "utf8"),
      /Nested original/
    );
    assert.match(
      await readFile(join(root, "content/blog/post.md"), "utf8"),
      /Flat original/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("recovering missing history manifests skips symlinked version files", async () => {
  const root = await fixture();
  const outside = await fixture();
  try {
    const storage = join(root, ".writenex/versions/blog/hello");
    await mkdir(storage, { recursive: true });
    await writeFile(join(outside, "private.md"), "PRIVATE OUTSIDE CONTENT");
    await symlink(
      join(outside, "private.md"),
      join(storage, "2026-10-16T00-00-00.000Z-abcd.md")
    );
    const response = await createWritenexHandler({ projectRoot: root })(
      request("/api/versions/blog/hello")
    );
    const result = await response.json();
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE OUTSIDE CONTENT/);
    assert.deepEqual(result.versions, []);
    assert.doesNotMatch(
      await readFile(join(storage, "manifest.json"), "utf8"),
      /PRIVATE OUTSIDE CONTENT/
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("nested-pattern creation returns an identity that can immediately be fetched", async () => {
  const root = await fixture();
  try {
    await writeFile(
      join(root, "writenex.config.mjs"),
      'export default { collections: [{ name: "blog", path: "content/blog", filePattern: "{category}/{slug}.md" }] };'
    );
    const handler = createWritenexHandler({ projectRoot: root });
    const response = await handler(
      request("/api/content/blog", "POST", {
        frontmatter: { title: "New post", category: "notes" },
        slug: "new-post",
        body: "Created body",
      })
    );
    assert.equal(response.status, 200);
    const created = await response.json();
    assert.equal(created.id, "notes/new-post");
    const fetched = await handler(
      request(`/api/content/blog/${encodeURIComponent(created.id)}`)
    );
    assert.equal(fetched.status, 200);
    assert.equal((await fetched.json()).body.trim(), "Created body");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
