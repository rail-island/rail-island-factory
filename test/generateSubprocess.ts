// Full-catalog thumbnail rendering is synchronous and can exceed Vitest's RPC
// deadline. Keep its worker responsive while a real Node process does that work.
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
    process.stdout.write(JSON.stringify(models));
  `;
  const { stdout } = await execute(process.execPath, ["--import", "tsx", "--input-type=module", "--eval", script, dir, operation], {
    cwd: root,
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout) as GeneratedModel[];
}
