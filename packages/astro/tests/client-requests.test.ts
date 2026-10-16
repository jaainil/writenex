import assert from "node:assert/strict";
import { test, vi } from "vite-plus/test";
import { createApiClient } from "../src/client/hooks/useApi";
import { createVersionApiClient } from "../src/client/hooks/useVersionHistory";

test("client requests encode nested content identities and use canonical trailing slash URLs", async () => {
  const urls: string[] = [];
  vi.stubGlobal("window", { __WRITENEX_CONFIG__: { trailingSlash: true } });
  vi.stubGlobal("fetch", async (url: string) => {
    urls.push(url);
    return Response.json({ versions: [], items: [], success: true });
  });
  try {
    const api = createApiClient({ apiBase: "/site/_writenex/api" });
    await api.getContent("blog", "nested/post");
    await api.getContentList("blog", { includeDrafts: true });
    await api.uploadImage(
      new File(["image"], "image.png"),
      "blog",
      "nested/post"
    );
    await createVersionApiClient({
      apiBase: "/site/_writenex/api",
    }).listVersions("blog", "nested/post");
    assert.deepEqual(urls, [
      "/site/_writenex/api/content/blog/nested%2Fpost/",
      "/site/_writenex/api/content/blog/?draft=true",
      "/site/_writenex/api/images/",
      "/site/_writenex/api/versions/blog/nested%2Fpost/",
    ]);
  } finally {
    vi.unstubAllGlobals();
  }
});
