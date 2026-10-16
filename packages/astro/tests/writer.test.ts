import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "vite-plus/test";
import matter from "gray-matter";
import { createContent } from "../src/filesystem/writer";

test("nested collection creation preserves existing content", async () => {
  const directory = await mkdtemp(join(tmpdir(), "writenex-writer-"));
  try {
    const options = {
      frontmatter: { title: "Hello", category: "notes" },
      body: "First",
      filePattern: "{category}/{slug}.md",
    };
    const first = await createContent(directory, options);
    const second = await createContent(directory, {
      ...options,
      body: "Second",
    });
    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.notEqual(second.path, first.path);
    assert.equal(
      matter(await readFile(first.path!, "utf8")).content.trim(),
      "First"
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("frontmatter preserves strings, nested objects, and arrays on round trip", async () => {
  const directory = await mkdtemp(join(tmpdir(), "writenex-yaml-"));
  try {
    const frontmatter = {
      title: "true",
      code: "00123",
      dateText: "2026-10-16",
      tags: ["a: b", "false", "#tag"],
      author: {
        name: "Author",
        links: [{ label: "Home", url: "https://example.com" }],
      },
      nullable: null,
    };
    const result = await createContent(directory, {
      frontmatter,
      body: "Hello",
    });
    assert.equal(result.success, true);
    assert.deepEqual(
      matter(await readFile(result.path!, "utf8")).data,
      frontmatter
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("content creation refuses paths outside the collection", async () => {
  const directory = await mkdtemp(join(tmpdir(), "writenex-path-"));
  try {
    const result = await createContent(join(directory, "collection"), {
      frontmatter: { title: "Hello" },
      body: "Escape",
      slug: "../outside",
    });
    assert.equal(result.success, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
