import { lstatSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

/** Keep filesystem operations inside their root and refuse symlink traversal. */
export function assertSafePath(root: string, target: string): void {
  const base = resolve(root);
  const path = relative(base, resolve(target));
  if (path === ".." || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error("Filesystem path must stay inside its configured root");
  }
  let current = base;
  for (const part of ["", ...path.split(sep).filter(Boolean)]) {
    current = resolve(current, part);
    try {
      if (lstatSync(current).isSymbolicLink())
        throw new Error(
          "Symbolic links are not supported in editable content paths"
        );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") break;
      throw error;
    }
  }
}
