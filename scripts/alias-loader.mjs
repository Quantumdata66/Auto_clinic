import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const projectRoot = path.resolve(".");

export function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const subpath = specifier.slice(2);
    let target = path.join(projectRoot, "src", subpath);
    if (!path.extname(target)) {
      if (fs.existsSync(target + ".ts")) {
        target = target + ".ts";
      } else if (fs.existsSync(target + ".tsx")) {
        target = target + ".tsx";
      } else if (fs.existsSync(path.join(target, "index.ts"))) {
        target = path.join(target, "index.ts");
      }
    }
    return nextResolve(pathToFileURL(target).href, context);
  }
  return nextResolve(specifier, context);
}
