import type { IncomingMessage, ServerResponse } from "node:http";
import { Readable, Writable } from "node:stream";
import { finished } from "node:stream/promises";

function errorResponse(status: number, error: string) {
  return Response.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}

/** Buffer bounded request bodies; use real streams for the existing Node router. */
export async function runNodeHandler(
  request: Request,
  handler: (req: IncomingMessage, res: ServerResponse) => Promise<void>,
  maxBodyBytes: number
): Promise<Response> {
  const chunks: Buffer[] = [];
  let size = 0;
  if (request.body) {
    const reader = request.body.getReader();
    const cancel = () => {
      void reader.cancel().catch(() => {});
    };
    request.signal.addEventListener("abort", cancel, { once: true });
    if (request.signal.aborted) cancel();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBodyBytes) {
          cancel();
          return errorResponse(413, "Request body too large");
        }
        chunks.push(Buffer.from(value));
      }
    } catch {
      return errorResponse(400, "Could not read request body");
    } finally {
      request.signal.removeEventListener("abort", cancel);
      reader.releaseLock();
    }
  }
  if (request.signal.aborted) return errorResponse(400, "Request aborted");
  const url = new URL(request.url);
  const req = Object.assign(Readable.from(chunks), {
    method: request.method,
    url: `${url.pathname}${url.search}`,
    headers: Object.fromEntries(request.headers),
    socket: { remoteAddress: "unknown", encrypted: url.protocol === "https:" },
  }) as unknown as IncomingMessage;
  const output: Buffer[] = [];
  const headers = new Map<string, string | string[]>();
  let sent = false;
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      sent = true;
      output.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      callback();
    },
  });
  const res = Object.assign(stream, {
    statusCode: 200,
    setHeader(name: string, value: string | number | string[]) {
      headers.set(
        name.toLowerCase(),
        Array.isArray(value) ? value : String(value)
      );
      return this;
    },
    getHeader(name: string) {
      return headers.get(name.toLowerCase());
    },
    removeHeader(name: string) {
      headers.delete(name.toLowerCase());
    },
  }) as unknown as ServerResponse;
  Object.defineProperty(res, "headersSent", { get: () => sent });
  // Attach completion/error handling before dispatch; pipe() can finish later.
  const completion = finished(stream, { cleanup: true });
  void completion.catch(() => {});
  const timeout = setTimeout(
    () => stream.destroy(new Error("Response timed out")),
    30_000
  );
  timeout.unref();
  const abort = () => stream.destroy(new Error("Request aborted"));
  request.signal.addEventListener("abort", abort, { once: true });
  try {
    await handler(req, res);
    await completion;
    const responseHeaders = new Headers();
    for (const [key, value] of headers) {
      if (Array.isArray(value))
        for (const item of value) responseHeaders.append(key, item);
      else responseHeaders.set(key, value);
    }
    responseHeaders.set("Cache-Control", "no-store");
    if (res.statusCode >= 500)
      return errorResponse(
        res.statusCode,
        "Writenex could not complete the request"
      );
    const body =
      request.method === "HEAD" || [204, 205, 304].includes(res.statusCode)
        ? null
        : new Uint8Array(Buffer.concat(output));
    return new Response(body, {
      status: res.statusCode,
      headers: responseHeaders,
    });
  } catch {
    stream.destroy();
    return errorResponse(500, "Writenex could not complete the request");
  } finally {
    clearTimeout(timeout);
    request.signal.removeEventListener("abort", abort);
    req.destroy();
  }
}
