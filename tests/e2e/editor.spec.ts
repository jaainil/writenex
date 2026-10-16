import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem("markdown-editor-storage")) {
      localStorage.setItem(
        "markdown-editor-storage",
        JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 })
      );
    }
  });
  await page.goto("/editor");
  await expect(page.getByRole("tab")).toHaveCount(1);
  await expect(page.locator('[contenteditable="true"]')).toBeVisible();
});

test("empty edits survive immediate document switches and reload", async ({
  page,
}) => {
  const editor = page.locator('[contenteditable="true"]');
  await editor.fill("Writing to clear");
  await page.keyboard.press("Control+s");
  await expect(
    page.getByRole("status", { name: "Editor status" })
  ).toContainText("Saved");
  await editor.focus();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Backspace");
  await expect(editor).toHaveText("");
  await expect(page.getByText("0 words", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "New document (Alt+N)", exact: true })
    .click();
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await page.getByRole("tab").first().click();
  await expect(editor).toHaveText("");
  await page.reload();
  await expect(editor).toHaveText("");
});

test("regex replacement uses matched lengths and zero-length search completes", async ({
  page,
}) => {
  const editor = page.locator('[contenteditable="true"]');
  await editor.fill("a aaa");
  await page.keyboard.press("Control+f");
  await page
    .getByRole("button", { name: "Regular expression", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search query", exact: true })
    .fill("a+");
  await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
  await page
    .getByRole("textbox", { name: "Replace query", exact: true })
    .fill("x");
  await page
    .getByRole("button", { name: "Replace all matches", exact: true })
    .click();
  await expect(editor).toHaveText("x x");
  await page
    .getByRole("textbox", { name: "Search query", exact: true })
    .fill("^|$");
  await expect(page.getByText("1 of 2", { exact: true })).toBeVisible();
});

test("keyboard tabs, palette document loading, and read-only restore", async ({
  page,
}) => {
  const editor = page.locator('[contenteditable="true"]');
  await editor.fill("First document");
  await page
    .getByRole("button", { name: "New document (Alt+N)", exact: true })
    .click();
  await expect(page.getByRole("tab")).toHaveCount(2);
  await expect(page.getByRole("tab").nth(1)).toHaveAttribute(
    "aria-selected",
    "true"
  );
  await expect(editor).toHaveText("");
  await editor.fill("Second document");
  await page.getByRole("tab").nth(1).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(editor).toHaveText("First document");
  await page.keyboard.press("Control+Shift+p");
  await page
    .locator("[cmdk-item]")
    .filter({ hasText: "Untitled" })
    .nth(1)
    .click();
  await expect(editor).toHaveText("Second document");
  await page.keyboard.press("Control+Shift+r");
  await page.getByRole("button", { name: "File actions", exact: true }).click();
  const restore = page.getByRole("menuitem", {
    name: "Restore Workspace (ZIP)",
    exact: true,
  });
  await expect(restore).toHaveCount(1);
  await expect(restore).toBeDisabled();
});

test("editor fits the viewport and closed panels are inert", async ({
  page,
}, testInfo) => {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    )
  ).toBe(true);
  await expect(
    page.locator('[aria-label="Table of contents"]')
  ).toHaveAttribute("inert", "");
  await expect(
    page.getByRole("dialog", { name: "Version history", includeHidden: true })
  ).toHaveAttribute("inert", "");
  await page.screenshot({ path: testInfo.outputPath("editor.png") });
});
