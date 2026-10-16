import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** Resolve the installed adapter, independent of the host's server bundle path. */
export function getClientDistPath(): string {
  const entry = fileURLToPath(import.meta.resolve("@imjp/writenex-next"));
  return join(dirname(entry), "client");
}
