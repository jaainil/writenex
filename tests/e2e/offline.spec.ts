import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "allow" });

test("installed PWA reloads offline with saved writing", async ({
  page,
  context,
}) => {
  test.setTimeout(120000);
  await page.addInitScript(() => {
    if (!localStorage.getItem("markdown-editor-storage")) {
      localStorage.setItem(
        "markdown-editor-storage",
        JSON.stringify({ state: { hasSeenOnboarding: true }, version: 0 })
      );
    }
  });
  await page.goto("/editor");
  // First activation can navigate. Poll through that navigation before typing.
  await expect
    .poll(
      async () =>
        page
          .evaluate(() => Boolean(navigator.serviceWorker?.controller))
          .catch(() => false),
      { timeout: 60000 }
    )
    .toBe(true);
  await expect(page.getByRole("tab")).toHaveCount(1);
  const editor = page.locator('[contenteditable="true"]');
  await editor.fill("Offline writing survives reload");
  await page.keyboard.press("Control+s");
  await expect(
    page.getByRole("status", { name: "Editor status" })
  ).toContainText("Saved");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(editor).toHaveText("Offline writing survives reload");
});
