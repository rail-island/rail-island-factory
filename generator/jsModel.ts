// A model as ONE standalone JS file: the design's own code, bundled with only the
// geometry it uses and minified. No imports: `build(THREE)` takes the three.js
// namespace as a parameter and returns a THREE.Group (see threeBuilder.ts).
//
// The bundle is the real design function run against ThreeMeshBuilder instead of
// the recording MeshBuilder, so its triangles are the GLB's by construction
// (test/jsModel.test.ts compares them). Node-only: esbuild.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { build, type Plugin } from "esbuild";
import type { MaterialSpec } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";

import { lodBudget } from "./lod.ts";
import { isInteriorName } from "./interiorTable.ts";
import { passengerOf } from "./passengerHints.ts";

const GENERATOR_DIR = path.dirname(fileURLToPath(import.meta.url));

/** The sub-folder of the export holding the JS models. */
export const JS_DIR = "js";

const THREE_BUILDER = path.join(GENERATOR_DIR, "threeBuilder.ts");

/** Swaps the recording MeshBuilder for the lean one inside a model's bundle. */
export const leanMeshBuilder: Plugin = {
  name: "lean-mesh-builder",
  setup(b) {
    b.onResolve({ filter: /(^|\/)meshBuilder(\.ts)?$/ }, () => ({ path: THREE_BUILDER }));
  },
};

/** Swaps toGroup's surface code (surfaceUvs.ts) for a no-op in the bundle of a design that names none. */
const noSurfaces: Plugin = {
  name: "no-surfaces",
  setup(b) {
    b.onResolve({ filter: /(^|\/)surfaceUvs(\.ts)?$/ }, () => ({ path: "surface-uvs-off", namespace: "no-surfaces" }));
    b.onLoad({ filter: /.*/, namespace: "no-surfaces" }, () => ({ contents: "const n = () => {}; export { n as surfaceUvs, n as surfaceTable };", loader: "js" }));
  },
};

/**
 * Swaps the interior code (interior.ts, interiorTable.ts, coachCabin.ts) for no-ops
 * in the bundle of a design that draws no interior (docs/models/interiors.md).
 */
const noInteriors: Plugin = {
  name: "no-interiors",
  setup(b) {
    const stubs: Record<string, string> = {
      interiorTable: "export const interiorTable = () => {};",
      interior: "export const drawCabin = () => {}, INTERIOR_PALETTE = {}, CABIN_INSET = 0.047;",
      coachCabin: "export const coachCabin = () => {}, cabinHeights = () => [0, 0], coachWindow = () => {};",
    };
    b.onResolve({ filter: /(^|\/)(interior|interiorTable|coachCabin)(\.ts)?$/ }, (a) => ({ path: a.path.replace(/^.*\//, "").replace(/\.ts$/, ""), namespace: "no-interiors" }));
    b.onLoad({ filter: /.*/, namespace: "no-interiors" }, (a) => ({ contents: stubs[a.path]!, loader: "js" }));
  },
};

/** The vehicles that carry passengers, the only designs with doors to open (docs/models/doors.md). */
const PASSENGER_GROUPS = new Set(["coach", "unit", "tram", "metro", "bus"]);

/**
 * Whether a design draws an interior: a passenger vehicle whose defaults, or a
 * variant one parameter away from them (a set's coach where the default is its
 * power car), draw one.
 */
function drawsInterior(design: ProceduralDesign): boolean {
  if (!PASSENGER_GROUPS.has(design.catalog?.group ?? "")) return false;
  const has = (m: unknown) => (m as { parts: Array<{ name: string }> }).parts.some((p) => isInteriorName(p.name));
  if (has(design.build())) return true;
  return (design.params ?? []).some((p) => p.values.some((v) => has(design.build({ [p.name]: v.value }))));
}

/**
 * The standalone JS of one design. `source` is the generator module that exports
 * the design's build function under its own name (`design.build.name`). A rigged
 * model (steered wheels, sections, joints) also exports the code that poses it;
 * `rigged` says whether it is one, built to find out when not given.
 */
export async function bundleDesign(design: ProceduralDesign, source: string, rigged = design.build().rig !== null): Promise<string> {
  const fn = design.build.name;
  // a design bound to one value of a shared build function passes it along (design.ts `bound`)
  const bound = design.bound === undefined ? "" : `, ${JSON.stringify(design.bound)}`;
  // the UV code ships only in the bundle of a design that names a surface (threeBuilder.ts)
  const levels = [design.build(), design.buildLod(), ...(design.buildCoarse ? [design.buildCoarse()] : []), ...(design.buildMax ? [design.buildMax()] : [])];
  const surfaces = levels.some((m) => Object.values((m as unknown as { palette: Record<string, MaterialSpec> }).palette).some((spec) => spec.surface));
  // a structure preview's passenger-view hints (passengerHints.ts) reach userData only in the bundle of a design that sets them
  const passenger = levels.some((m) => passengerOf(m) !== null);
  const stamp = passenger ? " const hints = passengerOf(mesh); if (hints) group.userData.passenger = JSON.parse(JSON.stringify(hints));" : "";
  const result = await build({
    stdin: {
      contents: [
        `import { ${fn} as design, ${design.buildLod.name} as designLod${design.buildCoarse ? `, ${design.buildCoarse.name} as designCoarse` : ""}${design.buildMax ? `, ${design.buildMax.name} as designMax` : ""} } from ${JSON.stringify(`./${source}`)};`,
        // a parametric design's enum parameters, [] for a fixed one; build() takes the chosen values
        ...(passenger ? [`import { passengerOf } from "./passengerHints.ts";`] : []),
        `export const params = ${JSON.stringify(design.params ?? [])};`,
        `export const lodTriangleBudget = ${lodBudget(design)};`,
        `export default function build(THREE, values, lod = false) { if (typeof lod !== "boolean") throw new Error("lod must be a boolean"); const mesh = lod ? designLod(values${bound}) : design(values${bound}); const group = mesh.toGroup(THREE, ${JSON.stringify(design.id)}); group.userData.lod = lod;${stamp} return group; }`,
        ...(design.buildMax ? [`export const maxTriangleBudget = 10000;`, `export function buildMax(THREE, values) { const group = designMax(values).toGroup(THREE, ${JSON.stringify(design.id)}); group.userData.lod = "max"; return group; }`] : []),
        ...(rigged ? [`export { pose, renderJoint, steerAngles, steerLock, jointTriangles } from "./rig.ts";`] : []),
        // a tree's third, coarsest level (design.ts buildCoarse)
        ...(design.buildCoarse ? [`export function buildCoarse(THREE, values) { const group = designCoarse(values).toGroup(THREE, ${JSON.stringify(design.id)}); group.userData.lod = "coarse"; return group; }`] : []),
      ].join("\n"),
      resolveDir: GENERATOR_DIR,
      sourcefile: `${design.id}.ts`,
      loader: "ts",
    },
    bundle: true,
    minify: true,
    format: "esm",
    platform: "neutral",
    target: "es2022",
    write: false,
    legalComments: "none",
    plugins: [leanMeshBuilder, ...(surfaces ? [] : [noSurfaces]), ...(drawsInterior(design) ? [] : [noInteriors])],
    banner: {
      js: `// Rail Island procedural model ${design.id}. Generated by rail-island-factory; do not edit. The default export build(THREE, params, lod = false) takes the three.js namespace (and a parametric model's enum parameter values, listed in the exported \`params\`) and returns a THREE.Group. lod = true builds low detail; lodTriangleBudget exports its total triangle limit.${design.buildCoarse ? " buildCoarse(THREE) builds the coarsest level." : ""}${design.buildMax ? " buildMax(THREE, params) builds Max detail; maxTriangleBudget exports its 10,000-triangle limit." : ""}${rigged ? " The group's userData.rig names its steered wheels, sections and joints; pose(group, { steer, bend }) and renderJoint(group, i) move them (docs/models/vehicle-rig.md)." : ""}`,
    },
  });
  return result.outputFiles[0]!.text;
}

/** gzip -9 size of a text or byte buffer, as a static host would serve it. */
export function gzipSize(data: string | Uint8Array): number {
  return zlib.gzipSync(data, { level: 9 }).length;
}

/** Writes `text` to `file` unless the file already holds exactly that. */
export function writeIfChanged(file: string, text: string): boolean {
  if (fs.existsSync(file) && fs.readFileSync(file, "utf8") === text) return false;
  fs.writeFileSync(file, text);
  return true;
}
