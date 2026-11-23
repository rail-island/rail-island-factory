// The generator modules a design's build reaches once esbuild has tree-shaken it,
// which is what the C# pilot transpiles (docs/specs/2026-11-21-csharp-transpiler-pilot.md).
//
// The bundle is the one bundleDesign (generator/jsModel.ts) makes, less the
// three.js seam: `meshBuilder.ts` resolves to a stub that re-exports the kernel,
// because the C# side supplies its own MeshBuilder (runtime/MeshBuilder.cs).
// Node-only; run with tsx.

import { build, type Plugin } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DESIGNS, designSource } from "../../generator/generate.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const GENERATOR_DIR = path.join(ROOT, "generator");

/** meshBuilder.ts as the C# side sees it: the kernel's class and ring helpers. */
const kernelSeam: Plugin = {
  name: "kernel-seam",
  setup(b) {
    b.onResolve({ filter: /(^|\/)meshBuilder(\.ts)?$/ }, () => ({ path: "meshBuilder", namespace: "seam" }));
    b.onLoad({ filter: /.*/, namespace: "seam" }, () => ({
      contents: `export { MeshCore as MeshBuilder, chamferedRect, grow, ngon, rect, scaleRing } from "./meshCore.ts";`,
      loader: "ts",
      resolveDir: GENERATOR_DIR,
    }));
  },
};

/** A pilot design: its id, the module exporting its build functions and their names. */
export interface PilotDesign {
  id: string;
  source: string;
  build: string;
  buildLod: string;
  /** Whether the build and LOD functions take the parameter values. */
  buildArgs: boolean;
  lodArgs: boolean;
}

export function pilotDesign(id: string): PilotDesign {
  const design = DESIGNS.get(id);
  if (!design) throw new Error(`unknown design ${id}`);
  return { id, source: designSource(id), build: design.build.name, buildLod: design.buildLod.name, buildArgs: design.build.length > 0, lodArgs: design.buildLod.length > 0 };
}

/** The generator files (paths relative to generator/, sorted) the design's build keeps. */
export async function bundleInputs(d: PilotDesign): Promise<string[]> {
  const result = await build({
    stdin: {
      contents: `export { ${d.build}, ${d.buildLod} } from ${JSON.stringify(`./${d.source}`)};`,
      resolveDir: GENERATOR_DIR,
      sourcefile: `${d.id}.ts`,
      loader: "ts",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    treeShaking: true,
    metafile: true,
    plugins: [kernelSeam],
    logLevel: "silent",
  });
  const out = Object.values(result.metafile.outputs)[0]!;
  return Object.entries(out.inputs)
    .filter(([file, info]) => !file.startsWith("seam:") && !file.startsWith("<stdin>") && info.bytesInOutput > 0)
    .map(([file]) => path.relative(GENERATOR_DIR, path.resolve(ROOT, file)))
    .sort();
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const id of process.argv.slice(2)) console.log(id, await bundleInputs(pilotDesign(id)));
}
