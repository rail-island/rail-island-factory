// Full-catalog thumbnail rendering is synchronous and can exceed Vitest's RPC
// deadline. Keep its worker responsive while a real Node process does that work.
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import type { GeneratedModel } from "../generator/generate";

const execute = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const generator = new URL("../generator/generate.ts", import.meta.url).href;

/** Runs the actual generator, preserving its failure status and complete results. */
export async function generateInSubprocess(dir: string, operation: "models" | "export"): Promise<GeneratedModel[]> {
  const script = `
    import { generateModels, buildExport } from ${JSON.stringify(generator)};
    const [dir, operation] = process.argv.slice(1);
    const models = operation === "models" ? generateModels(dir) : (await buildExport(dir)).models;
    const { writeFileSync } = await import("node:fs");
    writeFileSync(process.argv[3], JSON.stringify(models));
  `;
  const resultFile = path.join(dir, ".test-generation-result.json");
  await execute(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", script, dir, operation, resultFile], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  const result = JSON.parse(await readFile(resultFile, "utf8")) as GeneratedModel[];
  await rm(resultFile);
  return result;
}
