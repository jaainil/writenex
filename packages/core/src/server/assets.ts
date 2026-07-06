/**
 * @fileoverview Static asset serving for Writenex editor (framework-agnostic)
 */

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { MiddlewareContext } from "./middleware";

function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = fileURLToPath(new URL(".", import.meta.url));

  // When bundled (dist/server/assets.js or similar)
  if (
    currentFile.endsWith("dist/index.js") ||
    currentFile.endsWith("dist\\index.js") ||
    currentDir.endsWith("dist/") ||
    currentDir.endsWith("dist\\") ||
    currentDir.endsWith("dist/server/") ||
    currentDir.endsWith("dist\\server\\")
  ) {
    return join(currentDir, "..");
  }

  // When running from source (src/server/)
  if (currentDir.includes("/src/") || currentDir.includes("\\src\\")) {
    return join(currentDir, "..", "..");
  }

  return join(currentDir, "..");
}

const PACKAGE_ROOT = getPackageRoot();

function isPathInside(parentPath: string, targetPath: string): boolean {
  const rel = relative(parentPath, targetPath);
  return !rel.startsWith("..") && !isAbsolute(rel);
}

const MIME_TYPES: Record<string, string> = {
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

export async function serveEditorHtml(
  _req: IncomingMessage,
  res: ServerResponse,
  context: MiddlewareContext
): Promise<void> {
  const { basePath } = context;
  const html = generateEditorHtml(basePath);

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache");
  res.end(html);
}

export async function serveAsset(
  _req: IncomingMessage,
  res: ServerResponse,
  assetPath: string,
  _context: MiddlewareContext
): Promise<void> {
  const clientDistRoot = resolve(getClientDistPath());
  const filePath = resolve(clientDistRoot, assetPath);

  if (!isPathInside(clientDistRoot, filePath)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain");
    res.end("Forbidden");
    return;
  }

  if (!existsSync(filePath)) {
    console.error("[writenex] Asset not found:", filePath);
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain");
    res.end(`Asset not found: ${assetPath}`);
    return;
  }

  try {
    const content = await readFile(filePath);
    const ext = extname(assetPath).toLowerCase();
    const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

    res.statusCode = 200;
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(content);
  } catch (error) {
    console.error(`[writenex] Failed to serve asset: ${assetPath}`, error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Failed to read asset");
  }
}

export function generateEditorHtml(basePath: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Writenex - Content Editor</title>
  <link rel="stylesheet" href="${basePath}/assets/index.css">
  <link rel="stylesheet" href="${basePath}/assets/styles.css">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root { height: 100%; width: 100%; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #0a0a0a;
      color: #fafafa;
    }
    .writenex-loading {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 100%; gap: 1rem;
    }
    .writenex-loading-spinner {
      width: 40px; height: 40px;
      border: 3px solid rgba(59, 130, 246, 0.2);
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .writenex-loading-text { color: #71717a; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div id="root">
    <div class="writenex-loading">
      <div class="writenex-loading-spinner"></div>
      <div class="writenex-loading-text">Loading Writenex Editor...</div>
    </div>
  </div>
  <script>
    window.__WRITENEX_CONFIG__ = {
      basePath: "${basePath}",
      apiBase: "${basePath}/api",
    };
  </script>
  <script type="module" src="${basePath}/assets/index.js"></script>
</body>
</html>`;
}

export function getClientDistPath(): string {
  return resolve(PACKAGE_ROOT, "dist", "client");
}

export function hasClientBundle(): boolean {
  const indexPath = join(getClientDistPath(), "index.js");
  return existsSync(indexPath);
}
