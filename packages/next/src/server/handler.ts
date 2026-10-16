import { resolve } from "node:path";
import { loadConfig } from "@/config/loader";
import { applyRemoteCmsDefaults } from "@/config/defaults";
import { assertSafePath } from "@/filesystem/safe-path";
import {
  generateEditorHtml,
  generateLoginHtml,
  serveAsset,
} from "@/server/assets";
import { createSessionManager } from "@/server/auth";
import { ServerCache } from "@/server/cache";
import type { MiddlewareContext } from "@/server/middleware";
import { createApiRouter } from "@/server/routes";
import { resolveOptions, type WritenexNextOptions } from "../options";
import { getClientDistPath } from "./assets";
import { runNodeHandler } from "./node-adapter";

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};
const error = (status: number, message: string) =>
  Response.json({ error: message }, { status, headers });

/** Native App Router handler. Initialization is lazy; production fails closed. */
export function createWritenexHandler(options: WritenexNextOptions = {}) {
  const resolved = resolveOptions(options);
  let initialized: Promise<MiddlewareContext> | undefined;
  async function initialize(): Promise<MiddlewareContext> {
    const loaded = await loadConfig(resolved.projectRoot);
    if (loaded.warnings.length)
      throw new Error("Invalid Writenex configuration");
    const config = loaded.config;
    const remote = applyRemoteCmsDefaults(
      options.remoteCms ?? config.remoteCms
    );
    if (
      process.env.NODE_ENV === "production" &&
      (!remote.enabled ||
        !remote.username ||
        !remote.password ||
        !remote.secret)
    ) {
      throw new Error("Production editing requires configured authentication");
    }
    if (
      remote.enabled &&
      (!remote.username || !remote.password || !remote.secret)
    ) {
      throw new Error("Remote CMS authentication is incomplete");
    }
    config.remoteCms = remote;
    for (const collection of config.collections)
      assertSafePath(
        resolved.projectRoot,
        resolve(resolved.projectRoot, collection.path)
      );
    return {
      projectRoot: resolved.projectRoot,
      basePath: resolved.basePath,
      config,
      contentDirs: config.discovery.enabled ? resolved.contentDirs : [],
      trailingSlash:
        options.trailingSlash === undefined
          ? "ignore"
          : options.trailingSlash
            ? "always"
            : "never",
      platform: "next",
      cache: new ServerCache(),
      ...(remote.enabled
        ? { auth: createSessionManager(remote, remote.secret) }
        : {}),
    };
  }
  return async (request: Request): Promise<Response> => {
    if (process.env.NODE_ENV === "production" && !options.allowProduction)
      return error(404, "Not found");
    const url = new URL(request.url);
    const requestBase =
      url.pathname === resolved.basePath ||
      url.pathname.startsWith(`${resolved.basePath}/`)
        ? resolved.basePath
        : resolved.routeBasePath;
    if (
      url.pathname !== requestBase &&
      !url.pathname.startsWith(`${requestBase}/`)
    )
      return error(404, "Not found");
    const path =
      url.pathname.slice(requestBase.length).replace(/\/+$/, "") || "/";
    try {
      for (const part of path.split("/")) {
        const decoded = decodeURIComponent(part);
        if (
          decoded.includes("\\") ||
          decoded.includes("\0") ||
          decoded.includes("%") ||
          decoded.split("/").some((p) => p === "." || p === "..")
        )
          return error(403, "Invalid path");
      }
    } catch {
      return error(400, "Invalid path encoding");
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (
        request.headers.get("sec-fetch-site") === "cross-site" ||
        (origin && origin !== url.origin)
      )
        return error(403, "Cross-origin changes are not allowed");
    }
    if (request.method === "OPTIONS")
      return new Response(null, {
        status: 204,
        headers: {
          ...headers,
          Allow: "GET, HEAD, POST, PUT, DELETE, PATCH, OPTIONS",
        },
      });
    let context: MiddlewareContext;
    try {
      context = await (initialized ??= initialize());
    } catch {
      initialized = undefined;
      return error(
        503,
        "Writenex configuration could not be loaded. Check the project configuration and authentication settings."
      );
    }
    if (
      context.auth &&
      !["/api/auth/login", "/api/auth/logout", "/api/auth/session"].includes(
        path
      ) &&
      !context.auth.isAuthenticatedFromCookie(request.headers.get("cookie"))
    ) {
      if (path.startsWith("/api/") || path.startsWith("/assets/"))
        return error(401, "Authentication required");
      return new Response(
        request.method === "HEAD" ? null : generateLoginHtml(resolved.basePath),
        {
          status: 401,
          headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
        }
      );
    }
    try {
      // Fail closed before mutations if configured storage roots traverse links.
      for (const directory of [
        ...(context.contentDirs ?? []),
        context.config.versionHistory.storagePath ?? ".writenex/versions",
        context.config.images.storagePath ?? "public/images",
      ]) {
        assertSafePath(
          resolved.projectRoot,
          resolve(resolved.projectRoot, directory)
        );
      }
      if (path.startsWith("/api/")) {
        const apiPath = path.slice(4);
        return await runNodeHandler(
          request,
          async (req, res) => {
            // Router GET semantics for HEAD; the adapter suppresses the body.
            if (request.method === "HEAD") req.method = "GET";
            await createApiRouter(context)(req, res, apiPath);
          },
          resolved.maxBodyBytes
        );
      }
      if (path.startsWith("/assets/")) {
        if (!["GET", "HEAD"].includes(request.method))
          return error(405, "Method not allowed");
        const assetPath = decodeURIComponent(path.slice(8));
        context.clientDistPath ??= getClientDistPath();
        assertSafePath(
          context.clientDistPath,
          resolve(context.clientDistPath, assetPath)
        );
        return await runNodeHandler(
          request,
          (req, res) => serveAsset(req, res, assetPath, context),
          resolved.maxBodyBytes
        );
      }
      if (path !== "/") return error(404, "Not found");
      if (!["GET", "HEAD"].includes(request.method))
        return error(405, "Method not allowed");
      return new Response(
        request.method === "HEAD"
          ? null
          : generateEditorHtml(
              resolved.basePath,
              "next",
              options.trailingSlash ?? false
            ),
        { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } }
      );
    } catch {
      return error(
        403,
        "The requested filesystem path is not available for editing"
      );
    }
  };
}
