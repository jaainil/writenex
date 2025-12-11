/**
 * @fileoverview Unit tests for API routes
 *
 * Tests the image discovery API endpoint functionality.
 *
 * @module @writenex/astro/server/routes.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiRouter } from "./routes";
import type { MiddlewareContext } from "./middleware";
import { resetCache } from "./cache";

/**
 * Create a mock IncomingMessage
 */
function createMockRequest(
  method: string,
  url: string
): Partial<IncomingMessage> {
  return {
    method,
    url,
    headers: {},
  };
}

/**
 * Create a mock ServerResponse that captures the response
 */
function createMockResponse(): {
  res: Partial<ServerResponse>;
  getResponse: () => { statusCode: number; body: unknown };
} {
  let statusCode = 200;
  let body: unknown = null;

  const endFn = vi.fn((data?: unknown) => {
    if (typeof data === "string") {
      body = JSON.parse(data);
    }
  });

  const res: Partial<ServerResponse> = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: endFn as unknown as ServerResponse["end"],
  };

  // Capture statusCode changes
  Object.defineProperty(res, "statusCode", {
    get: () => statusCode,
    set: (value: number) => {
      statusCode = value;
    },
  });

  return {
    res,
    getResponse: () => ({ statusCode, body }),
  };
}

/**
 * Create a test middleware context
 */
function createTestContext(projectRoot: string): MiddlewareContext {
  return {
    basePath: "/_writenex",
    projectRoot,
    config: {
      collections: [],
      images: {
        strategy: "colocated",
        publicPath: "/images",
        storagePath: "public/images",
      },
      editor: {
        autosave: true,
        autosaveInterval: 3000,
      },
      discovery: {
        enabled: true,
        ignore: [],
      },
    },
  };
}

describe("Image Discovery API Endpoint", () => {
  let testDir: string;
  let router: ReturnType<typeof createApiRouter>;
  let context: MiddlewareContext;

  beforeEach(() => {
    // Reset cache before each test
    resetCache();

    // Create a unique temp directory for each test
    testDir = join(
      tmpdir(),
      `writenex-routes-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    mkdirSync(testDir, { recursive: true });

    // Create src/content directory structure
    mkdirSync(join(testDir, "src/content"), { recursive: true });

    context = createTestContext(testDir);
    router = createApiRouter(context);
  });

  afterEach(() => {
    // Clean up temp directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  /**
   * Test successful image discovery response
   * _Requirements: 3.1, 3.2_
   */
  it("returns discovered images for valid content", async () => {
    // Create a collection with content and images
    const collectionPath = join(testDir, "src/content/blog");
    mkdirSync(collectionPath, { recursive: true });

    // Create content file (folder-based structure)
    const contentFolder = join(collectionPath, "my-post");
    mkdirSync(contentFolder, { recursive: true });
    writeFileSync(
      join(contentFolder, "index.md"),
      "---\ntitle: Test Post\n---\nContent"
    );

    // Create image in content folder
    writeFileSync(join(contentFolder, "hero.jpg"), Buffer.alloc(100, "x"));

    // Make request
    const { res, getResponse } = createMockResponse();
    await router(
      createMockRequest("GET", "/api/images/blog/my-post") as IncomingMessage,
      res as ServerResponse,
      "images/blog/my-post"
    );

    const response = getResponse();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("images");
    expect(Array.isArray((response.body as { images: unknown[] }).images)).toBe(
      true
    );

    const images = (response.body as { images: unknown[] }).images;
    expect(images.length).toBe(1);

    // Verify image has all required fields
    const image = images[0] as Record<string, unknown>;
    expect(image).toHaveProperty("filename", "hero.jpg");
    expect(image).toHaveProperty("relativePath");
    expect(image).toHaveProperty("absolutePath");
    expect(image).toHaveProperty("size");
    expect(image).toHaveProperty("extension", ".jpg");
  });

  /**
   * Test 404 for missing collection
   * _Requirements: 3.4_
   */
  it("returns 404 for non-existent collection", async () => {
    const { res, getResponse } = createMockResponse();
    await router(
      createMockRequest(
        "GET",
        "/api/images/nonexistent/my-post"
      ) as IncomingMessage,
      res as ServerResponse,
      "images/nonexistent/my-post"
    );

    const response = getResponse();
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect((response.body as { error: string }).error).toContain(
      "Collection 'nonexistent' not found"
    );
  });

  /**
   * Test 404 for missing content
   * _Requirements: 3.3_
   */
  it("returns 404 for non-existent content", async () => {
    // Create collection without the requested content
    const collectionPath = join(testDir, "src/content/blog");
    mkdirSync(collectionPath, { recursive: true });

    // Create a different content item
    const contentFolder = join(collectionPath, "other-post");
    mkdirSync(contentFolder, { recursive: true });
    writeFileSync(
      join(contentFolder, "index.md"),
      "---\ntitle: Other Post\n---\nContent"
    );

    const { res, getResponse } = createMockResponse();
    await router(
      createMockRequest(
        "GET",
        "/api/images/blog/nonexistent-post"
      ) as IncomingMessage,
      res as ServerResponse,
      "images/blog/nonexistent-post"
    );

    const response = getResponse();
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("error");
    expect((response.body as { error: string }).error).toContain(
      "Content 'nonexistent-post' not found"
    );
  });

  /**
   * Test empty images array when no images exist
   * _Requirements: 1.4_
   */
  it("returns empty images array when content has no images", async () => {
    // Create collection with content but no images
    const collectionPath = join(testDir, "src/content/blog");
    mkdirSync(collectionPath, { recursive: true });

    // Create content file (flat structure, no sibling folder)
    writeFileSync(
      join(collectionPath, "no-images.md"),
      "---\ntitle: No Images Post\n---\nContent"
    );

    const { res, getResponse } = createMockResponse();
    await router(
      createMockRequest("GET", "/api/images/blog/no-images") as IncomingMessage,
      res as ServerResponse,
      "images/blog/no-images"
    );

    const response = getResponse();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("success", true);
    expect(response.body).toHaveProperty("images");
    expect((response.body as { images: unknown[] }).images).toEqual([]);
  });

  /**
   * Test response includes contentPath
   * _Requirements: 3.2_
   */
  it("returns contentPath in response", async () => {
    // Create collection with content
    const collectionPath = join(testDir, "src/content/blog");
    mkdirSync(collectionPath, { recursive: true });

    const contentFolder = join(collectionPath, "my-post");
    mkdirSync(contentFolder, { recursive: true });
    writeFileSync(
      join(contentFolder, "index.md"),
      "---\ntitle: Test Post\n---\nContent"
    );

    const { res, getResponse } = createMockResponse();
    await router(
      createMockRequest("GET", "/api/images/blog/my-post") as IncomingMessage,
      res as ServerResponse,
      "images/blog/my-post"
    );

    const response = getResponse();
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("contentPath");
    expect((response.body as { contentPath: string }).contentPath).toContain(
      "my-post"
    );
  });

  /**
   * Test caching behavior
   * _Requirements: 5.3_
   */
  it("caches image discovery results", async () => {
    // Create collection with content and images
    const collectionPath = join(testDir, "src/content/blog");
    mkdirSync(collectionPath, { recursive: true });

    const contentFolder = join(collectionPath, "cached-post");
    mkdirSync(contentFolder, { recursive: true });
    writeFileSync(
      join(contentFolder, "index.md"),
      "---\ntitle: Cached Post\n---\nContent"
    );
    writeFileSync(join(contentFolder, "image.png"), Buffer.alloc(50, "y"));

    // First request
    const { res: res1, getResponse: getResponse1 } = createMockResponse();
    await router(
      createMockRequest(
        "GET",
        "/api/images/blog/cached-post"
      ) as IncomingMessage,
      res1 as ServerResponse,
      "images/blog/cached-post"
    );

    const response1 = getResponse1();
    expect(response1.statusCode).toBe(200);

    // Second request (should use cache)
    const { res: res2, getResponse: getResponse2 } = createMockResponse();
    await router(
      createMockRequest(
        "GET",
        "/api/images/blog/cached-post"
      ) as IncomingMessage,
      res2 as ServerResponse,
      "images/blog/cached-post"
    );

    const response2 = getResponse2();
    expect(response2.statusCode).toBe(200);

    // Both responses should be identical
    expect(response1.body).toEqual(response2.body);
  });
});
