// What the C# transpiler pilot's driver (main.ts) and its comparison (compare.ts)
// share: the output folder, the combinations built and the dotnet runner.

import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { DESIGNS } from "../../generator/generate.ts";
import { coverageCombinations, resolveParams } from "../../generator/design.ts";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "../..");
/** Where the pilot writes: the gitignored export folder. */
export const OUT_DIR = path.join(ROOT, "export", "cs");

/** The parameter combinations the factory's tests build for a design, defaults resolved. */
export function combinations(id: string): Array<Record<string, string>> {
  const d = DESIGNS.get(id)!;
  if (!d.params?.length) return [{}];
  return coverageCombinations(d.params, d.finishParams ?? []).map((c) => resolveParams(d.params!, c));
}

export function dotnet(args: string[], opts: { quiet?: boolean } = {}): string {
  return execFileSync("dotnet", args, { cwd: OUT_DIR, encoding: "utf8", maxBuffer: 1 << 30, stdio: opts.quiet ? ["ignore", "pipe", "pipe"] : ["ignore", "pipe", "inherit"], env: { ...process.env, DOTNET_CLI_TELEMETRY_OPTOUT: "1", DOTNET_NOLOGO: "1" } });
}

