/**
 * @fileoverview Asset serving for Next.js App Router
 *
 * Usage:
 * ```typescript
 * // app/_writenex/assets/[[...path]]/route.ts
 * import { createWritenexAssetHandler } from "@imjp/writenex-next/routes";
 * export { GET } from "@imjp/writenex-next/routes";
 * // or
 * import { createWritenexAssetHandler } from "@imjp/writenex-next/routes";
 * export const GET = createWritenexAssetHandler();
 * ```
 */

import { NextRequest, NextResponse } from "next/server";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = fileURLToPath(new URL(".", import.meta.url));
  if (
    currentDir.endsWith("dist/") ||
    currentDir.endsWith("dist\\") ||
    currentDir.endsWith("dist/routes/") ||
    currentDir.endsWith("dist\\routes\\")
  ) {
    return resolve(currentDir, "..");
  }
  if (currentDir.includes("/src/") || currentDir.includes("\\src\\")) {
    return resolve(currentDir, "..", "..");
  }
  return resolve(currentDir, "..");
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

export function createWritenexAssetHandler() {
  return async (_req: NextRequest, context: { params: { path?: string[] } }) => {
    const pathArray = context.params.path ?? [];
    const assetPath = pathArray.join("/");

    // Try to resolve from @imjp/writenex-core/dist/client
    const coreClient = resolve(getPackageRoot(), "node_modules", "@imjp", "writenex-core", "dist", "client");
    const fallbackClient = resolve(getPackageRoot(), "dist", "client");

    let clientDist = existsSync(coreClient) ? coreClient : fallbackClient;

    const filePath = resolve(clientDist, assetPath);

    // Security: ensure path is within the client directory
    if (!filePath.startsWith(clientDist)) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (!existsSync(filePath)) {
      return new NextResponse(`Asset not found: ${assetPath}`, { status: 404 });
    }

    try {
      const content = await readFile(filePath);
      const ext = extname(assetPath).toLowerCase();
      const mimeType = MIME_TYPES[ext] ?? "application/octet-stream";

      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      return new NextResponse("Failed to read asset", { status: 500 });
    }
  };
}
