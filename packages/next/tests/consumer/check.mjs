import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:net";

const packageRoot = fileURLToPath(new URL("../../", import.meta.url));
const repoRoot = resolve(packageRoot, "../..");
const version = process.env.NEXT_TEST_VERSION ?? process.argv[2] ?? "16.1.6";
const fixture = await mkdtemp(join(tmpdir(), `writenex-next-${version}-`));
const reviewDir = process.env.WRITENEX_REVIEW_DIR ?? join(fixture, "review");
await mkdir(reviewDir, { recursive: true });
console.log(`Consumer fixture: ${fixture}`);

async function run(command, args, cwd = fixture, env = {}) {
  const logPath = join(
    fixture,
    `${command.replaceAll("/", "_")}-${Date.now()}.log`
  );
  const log = createWriteStream(logPath);
  const child = spawn(command, args, {
    cwd,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", resolve);
  });
  await new Promise((resolve) => log.end(resolve));
  assert.equal(
    code,
    0,
    `${command} ${args.join(" ")} failed:\n${(await readFile(logPath, "utf8")).slice(-6000)}`
  );
  return readFile(logPath, "utf8");
}

await access(join(packageRoot, "dist/server/index.js"));
await run(
  "npm",
  ["pack", "--ignore-scripts", "--pack-destination", fixture],
  packageRoot
);
const tarball = join(fixture, "imjp-writenex-next-0.1.0.tgz");
await writeFile(
  join(fixture, "package.json"),
  JSON.stringify(
    {
      private: true,
      type: "module",
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: {
        "@imjp/writenex-next": `file:${tarball}`,
        next: version,
        react: "19.2.4",
        "react-dom": "19.2.4",
      },
      devDependencies: {
        typescript: "5.9.3",
        "@types/react": "19.2.18",
        "@types/react-dom": "19.2.5",
        "@types/node": "26.4.0",
      },
    },
    null,
    2
  )
);
await run("npm", ["install", "--prefer-online", "--no-audit", "--no-fund"]);
await assert.rejects(access(join(fixture, "node_modules/astro")));
const installed = join(fixture, "node_modules/@imjp/writenex-next");
const manifest = JSON.parse(
  await readFile(join(installed, "package.json"), "utf8")
);
for (const entry of Object.values(manifest.exports)) {
  await access(join(installed, entry.import));
  await access(join(installed, entry.types));
}
const browserCode = await readFile(
  join(installed, "dist/client/index.js"),
  "utf8"
);
assert.doesNotMatch(
  browserCode,
  /\b(?:from\s*|import\s*\()\s*["'](?:react|react-dom|@mdxeditor|\.\/)/
);
for (const asset of ["index.css", "styles.css", "variables.css"])
  await access(join(installed, "dist/client", asset));

await mkdir(join(fixture, "app/%5Fwritenex/[[...path]]"), { recursive: true });
await mkdir(join(fixture, "content/blog/nested"), { recursive: true });
await writeFile(
  join(fixture, "content/blog/hello.md"),
  "---\ntitle: Hello\ndraft: false\n---\nOriginal consumer body\n"
);
await writeFile(
  join(fixture, "content/blog/nested/post.mdx"),
  "---\ntitle: Nested post\n---\nNested content\n"
);
await writeFile(
  join(fixture, "app/layout.tsx"),
  'export default function Layout({children}: {children: React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }'
);
await writeFile(
  join(fixture, "app/page.tsx"),
  "export default function Page() { return <main>Consumer site</main>; }"
);
await writeFile(
  join(fixture, "app/%5Fwritenex/[[...path]]/route.ts"),
  `import { createWritenexHandler } from "@imjp/writenex-next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const handler = createWritenexHandler({
  basePath: "/site/_writenex", nextBasePath: "/site", trailingSlash: true,
  allowProduction: process.env.WRITENEX_TEST_REMOTE === "1",
  ...(process.env.WRITENEX_TEST_REMOTE === "1" ? { remoteCms: { enabled: true } } : {}),
});
export const GET = handler; export const HEAD = handler; export const POST = handler;
export const PUT = handler; export const DELETE = handler; export const PATCH = handler; export const OPTIONS = handler;
`
);
await writeFile(
  join(fixture, "next.config.mjs"),
  'import { withWritenex } from "@imjp/writenex-next"; export default withWritenex({ basePath: "/site", trailingSlash: true });'
);
await writeFile(
  join(fixture, "writenex.config.ts"),
  `import { defineConfig, collection, fields } from "@imjp/writenex-next/config";
export default defineConfig({ collections: [collection({ name: "blog", path: "content/blog", previewUrl: "/blog/{slug}", schema: { title: fields.text({label:"Title"}), draft: fields.checkbox({label:"Draft"}), body: fields.mdx({label:"Content"}) } })] });`
);
await writeFile(
  join(fixture, "api.mts"),
  `import { withWritenex, defineConfig, collection, fields, type WritenexNextOptions } from "@imjp/writenex-next";
import { createWritenexHandler } from "@imjp/writenex-next/server";
const options: WritenexNextOptions = { basePath: "/_writenex", contentDirs: ["content"] };
withWritenex({}); createWritenexHandler(options);
defineConfig({ collections: [collection({ name: "blog", path: "content/blog", schema: { title: fields.text({ label: "Title" }) } })] });`
);
await writeFile(
  join(fixture, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      strict: true,
      skipLibCheck: true,
      noEmit: true,
    },
    include: ["api.mts"],
  })
);
const tsc = join(fixture, "node_modules/typescript/bin/tsc");
await run(process.execPath, [tsc, "-p", "tsconfig.json"]);
await run(process.execPath, [
  tsc,
  "-p",
  "tsconfig.json",
  "--module",
  "ESNext",
  "--moduleResolution",
  "Bundler",
]);
// Next.js owns the application tsconfig once public consumer imports have passed.
await writeFile(
  join(fixture, "tsconfig.json"),
  JSON.stringify({
    compilerOptions: {
      target: "ES2022",
      module: "ESNext",
      moduleResolution: "Bundler",
      jsx: "preserve",
      strict: true,
      skipLibCheck: true,
      noEmit: true,
      esModuleInterop: true,
      plugins: [{ name: "next" }],
    },
    include: ["**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  })
);

async function freePort() {
  const server = createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}
async function start(mode, env = {}) {
  const port = await freePort();
  const logPath = join(fixture, `${mode}-${Date.now()}.log`);
  const log = createWriteStream(logPath);
  const child = spawn(
    process.execPath,
    [
      join(fixture, "node_modules/next/dist/bin/next"),
      mode,
      "--hostname",
      "127.0.0.1",
      "--port",
      String(port),
    ],
    {
      cwd: fixture,
      env: {
        ...process.env,
        NODE_ENV: mode === "dev" ? "development" : "production",
        NEXT_TELEMETRY_DISABLED: "1",
        ...env,
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  child.stdout.pipe(log, { end: false });
  child.stderr.pipe(log, { end: false });
  const base = `http://127.0.0.1:${port}/site/_writenex`;
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null)
      throw new Error(await readFile(logPath, "utf8"));
    try {
      const response = await fetch(base);
      if (response.status < 500) return { base, child, log };
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  child.kill();
  throw new Error(
    `Server did not become ready: ${await readFile(logPath, "utf8")}`
  );
}
async function stop(server) {
  server.child.kill("SIGTERM");
  await new Promise((resolve) => server.child.once("exit", resolve));
  server.log.end();
}
async function api(base, path, method = "GET", body, cookie) {
  const response = await fetch(`${base}/api${path}/`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  assert.ok(
    response.ok,
    `${method} ${path}: ${response.status} ${await response.clone().text()}`
  );
  return response.json();
}

const dev = await start("dev");
try {
  assert.match(await (await fetch(dev.base)).text(), /platform: "next"/);
  for (const asset of ["index.js", "index.css", "styles.css", "variables.css"])
    assert.equal(
      (await fetch(`${dev.base}/assets/${asset}`)).status,
      200,
      asset
    );
  const collections = await api(dev.base, "/collections");
  assert.equal(collections.collections[0].path, "content/blog");
  assert.equal(
    (await api(dev.base, "/content/blog/nested%2Fpost")).frontmatter.title,
    "Nested post"
  );
  await api(dev.base, "/content/blog/hello", "PUT", {
    frontmatter: { title: "Edited consumer" },
    body: "Changed consumer body",
  });
  assert.match(
    await readFile(join(fixture, "content/blog/hello.md"), "utf8"),
    /Changed consumer body/
  );
  const versions = await api(dev.base, "/versions/blog/hello");
  assert.ok(versions.versions.length);
  await api(
    dev.base,
    `/versions/blog/hello/${versions.versions[0].id}/restore`,
    "POST"
  );
  assert.match(
    await readFile(join(fixture, "content/blog/hello.md"), "utf8"),
    /Original consumer body/
  );
  const created = await api(dev.base, "/content/blog", "POST", {
    frontmatter: { title: "Temporary" },
    slug: "temporary",
    body: "Temporary body",
  });
  assert.ok(created.success);
  await api(dev.base, "/content/blog/temporary", "DELETE");
  const form = new FormData();
  form.set("collection", "blog");
  form.set("contentId", "hello");
  form.set(
    "file",
    new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    "test.png"
  );
  const uploadResponse = await fetch(`${dev.base}/api/images/`, {
    method: "POST",
    body: form,
  });
  assert.equal(uploadResponse.status, 200);
  const uploaded = await uploadResponse.json();
  const filename = uploaded.path.split("/").at(-1);
  const image = await fetch(`${dev.base}/api/images/blog/hello/${filename}`);
  assert.equal(image.status, 200);
  assert.deepEqual(
    [...new Uint8Array(await image.arrayBuffer())],
    [137, 80, 78, 71]
  );
  if (
    process.env.WRITENEX_SKIP_BROWSER !== "1" &&
    !process.argv.includes("--skip-browser")
  ) {
    const { chromium } = await import(
      join(repoRoot, "node_modules/@playwright/test/index.mjs")
    );
    const browser = await chromium.launch({
      headless: true,
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
        : {}),
      args: ["--no-sandbox"],
    });
    try {
      const page = await browser.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      for (const [device, width, height] of [
        ["desktop", 1440, 900],
        ["mobile", 390, 844],
      ]) {
        await page.setViewportSize({ width, height });
        await page.goto(dev.base);
        await page
          .getByText("Edit your Next.js content visually.", { exact: true })
          .waitFor();
        await page
          .locator(".wn-collection-item")
          .filter({ hasText: "blog" })
          .first()
          .click();
        await page.getByText("Hello", { exact: true }).first().click();
        await page.locator('[contenteditable="true"]').first().waitFor();
        if (device === "mobile") {
          const editor = await page.locator(".wn-main-content").boundingBox();
          assert.ok(
            editor && editor.width >= width - 40,
            "Mobile selection must reveal a usable writing area"
          );
        }
        await page.screenshot({
          path: join(reviewDir, `${device}.png`),
          fullPage: true,
        });
        const widthData = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        assert.ok(
          widthData.scroll <= widthData.viewport,
          `${device} horizontal page overflow`
        );
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  }
  console.log(
    `Next.js ${version}: dev server, exports/types, CRUD, images and history passed; browser ${process.env.WRITENEX_SKIP_BROWSER === "1" || process.argv.includes("--skip-browser") ? "skipped" : "passed"}.`
  );
} finally {
  await stop(dev);
}

await run(
  process.execPath,
  [
    join(fixture, "node_modules/next/dist/bin/next"),
    "build",
    ...(Number(version.split(".")[0]) >= 16 ? ["--webpack"] : []),
  ],
  fixture,
  { NODE_ENV: "production" }
);
const production = await start("start");
try {
  assert.equal((await fetch(production.base)).status, 404);
  assert.equal((await fetch(`${production.base}/api/collections`)).status, 404);
} finally {
  await stop(production);
}
const authenticated = await start("start", {
  WRITENEX_TEST_REMOTE: "1",
  WRITENEX_CMS_USER: "consumer-editor",
  WRITENEX_CMS_PASS: "consumer-test-password",
  WRITENEX_SECRET: "consumer-test-secret-more-than-32-bytes",
});
try {
  assert.equal((await fetch(authenticated.base)).status, 401);
  const response = await fetch(`${authenticated.base}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "consumer-editor",
      password: "consumer-test-password",
    }),
  });
  assert.equal(response.status, 200);
  const cookie = response.headers.get("set-cookie").split(";")[0];
  await api(
    authenticated.base,
    "/content/blog/hello",
    "PUT",
    { body: "Authenticated production edit" },
    cookie
  );
  assert.match(
    await readFile(join(fixture, "content/blog/hello.md"), "utf8"),
    /Authenticated production edit/
  );
} finally {
  await stop(authenticated);
}
console.log(
  `Next.js ${version}: production build, default deny and authenticated disk writes passed. Review captures: ${reviewDir}`
);
