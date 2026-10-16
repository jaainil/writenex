import assert from "node:assert/strict";
import { Readable } from "node:stream";
import { test } from "vite-plus/test";
import { runNodeHandler } from "../src/server/node-adapter";

test("Web requests retain JSON and query strings through the Node router", async () => {
  const response = await runNodeHandler(
    new Request("http://localhost/api?q=one", {
      method: "POST",
      body: '{"title":"Hello"}',
    }),
    async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          url: req.url,
          body: JSON.parse(Buffer.concat(chunks).toString()),
        })
      );
    },
    1024
  );
  assert.deepEqual(await response.json(), {
    url: "/api?q=one",
    body: { title: "Hello" },
  });
});

test("real Node pipes finish binary responses and preserve multiple cookies", async () => {
  const response = await runNodeHandler(
    new Request("https://localhost/image"),
    async (_req, res) => {
      res.setHeader("Set-Cookie", ["first=1; HttpOnly", "second=2; HttpOnly"]);
      res.setHeader("Content-Type", "image/png");
      Readable.from([Buffer.from([0, 255]), Buffer.from([1, 128])]).pipe(res);
    },
    1024
  );
  assert.deepEqual(
    [...new Uint8Array(await response.arrayBuffer())],
    [0, 255, 1, 128]
  );
  assert.deepEqual(response.headers.getSetCookie(), [
    "first=1; HttpOnly",
    "second=2; HttpOnly",
  ]);
});

test("HEAD and bodyless statuses never pass a body to Response", async () => {
  for (const [method, status] of [
    ["HEAD", 200],
    ["GET", 204],
  ] as const) {
    const response = await runNodeHandler(
      new Request("http://localhost/api", { method }),
      async (_req, res) => {
        res.statusCode = status;
        res.end("unused");
      },
      1024
    );
    assert.equal(response.status, status);
    assert.equal(await response.text(), "");
  }
});

test("body limits reject oversized chunks before the handler mutates data", async () => {
  let called = false;
  const response = await runNodeHandler(
    new Request("http://localhost/api", {
      method: "POST",
      body: "too much data",
    }),
    async (_req, res) => {
      called = true;
      res.end();
    },
    4
  );
  assert.equal(response.status, 413);
  assert.equal(called, false);
});

test("failed body streams and thrown handlers return errors without hanging", async () => {
  const body = new ReadableStream({
    start(controller) {
      controller.error(new Error("request failed"));
    },
  });
  const request = new Request("http://localhost/api", {
    method: "POST",
    body,
    duplex: "half",
  } as RequestInit);
  assert.equal(
    (
      await runNodeHandler(
        request,
        async (_req, res) => {
          res.end();
        },
        1024
      )
    ).status,
    400
  );
  const response = await runNodeHandler(
    new Request("http://localhost/api"),
    async () => {
      throw new Error("/private/server/path");
    },
    1024
  );
  assert.equal(response.status, 500);
  assert.doesNotMatch(await response.text(), /private/);
});

test("aborting a pending upload cancels its stream before any handler runs", async () => {
  const controller = new AbortController();
  let cancelled = false;
  let dispatched = false;
  const body = new ReadableStream({
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("http://localhost/api", {
    method: "POST",
    body,
    duplex: "half",
    signal: controller.signal,
  } as RequestInit);
  const pending = runNodeHandler(
    request,
    async (_req, res) => {
      dispatched = true;
      res.end();
    },
    1024
  );
  controller.abort();
  let timeout: ReturnType<typeof setTimeout>;
  try {
    const response = await Promise.race([
      pending,
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), 500);
      }),
    ]);
    assert.ok(response, "Aborting must stop a pending body read");
    assert.equal(response.status, 400);
    assert.equal(cancelled, true);
    assert.equal(dispatched, false);
  } finally {
    clearTimeout(timeout!);
  }
});
