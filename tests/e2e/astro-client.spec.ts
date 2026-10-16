import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("packed Astro client mounts and opens content without an import map", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.route("https://astro-client.test/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.startsWith("/assets/")) {
      const name = path.slice("/assets/".length);
      const contentType = name.endsWith(".js")
        ? "application/javascript"
        : "text/css";
      await route.fulfill({
        contentType,
        body: await readFile(`packages/astro/dist/client/${name}`),
      });
    } else if (path === "/_writenex/api/collections") {
      await route.fulfill({
        json: {
          collections: [
            {
              name: "blog",
              path: "src/content/blog",
              filePattern: "{slug}.md",
              count: 1,
            },
          ],
        },
      });
    } else if (path === "/_writenex/api/content/blog") {
      await route.fulfill({
        json: {
          items: [{ id: "hello", path: "hello.md", title: "Hello fixture" }],
        },
      });
    } else if (path === "/_writenex/api/content/blog/hello") {
      await route.fulfill({
        json: {
          id: "hello",
          path: "hello.md",
          frontmatter: { title: "Hello fixture" },
          body: "# Packed browser editor",
          raw: "# Packed browser editor",
        },
      });
    } else if (path.startsWith("/_writenex/api/")) {
      await route.fulfill({
        json: {
          authenticated: false,
          editor: { autosave: false },
          versions: [],
        },
      });
    } else {
      await route.fulfill({
        contentType: "text/html",
        body: '<!doctype html><html><head><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/index.css"></head><body><div id="root"></div><script type="module" src="/assets/index.js"></script></body></html>',
      });
    }
  });
  await page.goto("https://astro-client.test/");
  await page.getByRole("button", { name: "blog 1", exact: true }).click();
  await page
    .getByRole("button", { name: "Hello fixture", exact: true })
    .click();
  await expect(page.locator('[contenteditable="true"]')).toContainText(
    "Packed browser editor"
  );
  expect(errors).toEqual([]);
});
