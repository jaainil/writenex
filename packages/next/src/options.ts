import { isAbsolute, resolve, relative } from "node:path";
import type { RemoteCmsConfig } from "@/types";

export interface WritenexNextOptions {
  /** The Next.js project directory. Defaults to process.cwd(). */
  projectRoot?: string;
  /** Full public editor URL path, including the host's Next.js basePath. */
  basePath?: string;
  /** Host next.config basePath. Next.js removes this prefix from route requests. */
  nextBasePath?: string;
  /** Ordered collection roots, relative to the project. */
  contentDirs?: string[];
  trailingSlash?: boolean;
  allowProduction?: boolean;
  remoteCms?: RemoteCmsConfig;
  /** Maximum request body size. Defaults to 10 MiB. */
  maxBodyBytes?: number;
}

export function resolveOptions(options: WritenexNextOptions = {}) {
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const basePath = (options.basePath ?? "/_writenex").replace(/\/$/, "");
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(basePath)) {
    throw new TypeError(
      "Writenex basePath must contain URL-safe path segments, e.g. /_writenex."
    );
  }
  const nextBasePath = (options.nextBasePath ?? "").replace(/\/$/, "");
  if (
    nextBasePath &&
    (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(nextBasePath) ||
      !basePath.startsWith(`${nextBasePath}/`))
  ) {
    throw new TypeError(
      "Writenex nextBasePath must be the host prefix of basePath."
    );
  }
  const maxBodyBytes = options.maxBodyBytes ?? 10 * 1024 * 1024;
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) {
    throw new TypeError(
      "Writenex maxBodyBytes must be a positive safe integer."
    );
  }
  const contentDirs = options.contentDirs ?? ["content", "src/content"];
  for (const directory of contentDirs) {
    const path = relative(projectRoot, resolve(projectRoot, directory));
    if (
      !path ||
      isAbsolute(directory) ||
      path === ".." ||
      path.startsWith("../") ||
      directory.includes("\\")
    ) {
      throw new TypeError("Writenex contentDirs must stay inside the project.");
    }
  }
  return {
    ...options,
    projectRoot,
    basePath,
    maxBodyBytes,
    contentDirs: [...contentDirs],
    nextBasePath,
    routeBasePath: nextBasePath
      ? basePath.slice(nextBasePath.length)
      : basePath,
  };
}
