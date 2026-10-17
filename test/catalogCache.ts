// What the tests build of the catalog, built once per worker: a design's default
// model (GLB bytes, triangle count, rig, source tree), its LOD and its bundled JS
// module. Vitest runs the files of a worker in one module registry
// (vite.config.ts `isolate: false`), so every file a worker runs shares these
// maps instead of rebuilding and re-bundling the same designs.
//
// variantsUnderTest() is the parameter combinations a test checks: every one
// with TEST_ALL_VARIANTS=1, else the defaults and a fixed spread of a few others
// (docs/guide/setup-and-build.md).

import * as THREE from "three";
import { coverageCombinations, type ParamValues, type ProceduralDesign } from "../generator/design";
import { DESIGNS, designSource, toGlb } from "../generator/generate";
import { bundleDesign } from "../generator/jsModel";
import { buildLodModel } from "../generator/lodModel";
import type { VehicleRig } from "../generator/rig";
import type { SourceTree } from "../generator/sourceTree";

export interface Built {
  glb: Uint8Array;
  triangles: number;
  rig: VehicleRig | null;
  tree: SourceTree;
}

/** A design's JS module (generator/jsModel.ts) as the game imports it. */
export interface JsModule {
  default: (three: typeof THREE, params?: ParamValues, lod?: boolean) => THREE.Group;
  params: unknown;
  lodTriangleBudget: number;
  pose?: (root: THREE.Object3D, pose: { steer: number; bend: number[] }) => void;
  renderJoint?: (root: THREE.Object3D, i: number) => void;
}

const BUILT = new Map<string, Built>();
const LOD = new Map<string, Uint8Array>();
const TEXT = new Map<string, Promise<string>>();
const MODULE = new Map<string, Promise<JsModule>>();

export function design(id: string): ProceduralDesign {
  const d = DESIGNS.get(id);
  if (!d) throw new Error(`no procedural model "${id}"`);
  return d;
}

/** A design's default build: GLB bytes, triangles, rig and source tree, from one build. */
export function built(id: string): Built {
  let b = BUILT.get(id);
  if (!b) {
    const d = design(id);
    const model = d.build();
    b = { glb: toGlb(id, model), triangles: model.triangleCount(), rig: model.rig, tree: model.sourceTree(d.id, d.title) };
    BUILT.set(id, b);
  }
  return b;
}

/** A design's default GLB bytes. */
export function glbOf(id: string): Uint8Array {
  return built(id).glb;
}

/** A design's LOD GLB bytes (generator/lodModel.ts). */
export function lodGlbOf(id: string): Uint8Array {
  let b = LOD.get(id);
  if (!b) {
    b = buildLodModel(design(id)).toGlb(id);
    LOD.set(id, b);
  }
  return b;
}

/** A design's standalone JS text, bundled once. */
export function jsTextOf(id: string): Promise<string> {
  let p = TEXT.get(id);
  if (!p) {
    p = bundleDesign(design(id), designSource(id), built(id).rig !== null);
    TEXT.set(id, p);
  }
  return p;
}

/** A design's JS module, imported once from its bundle. */
export function jsModuleOf(id: string): Promise<JsModule> {
  let p = MODULE.get(id);
  if (!p) {
    p = jsTextOf(id).then(
      (text) => import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`) as Promise<JsModule>,
    );
    MODULE.set(id, p);
  }
  return p;
}

/**
 * Build `ids` ahead, yielding to the event loop between designs: a test file
 * that needs builds to register its tests does this at its top level, so the
 * worker keeps answering Vitest's RPC while it builds (test/setup.ts).
 */
export async function warm(ids: readonly string[]): Promise<void> {
  for (const id of ids) {
    built(id);
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

/** Drop what was built of `id`, once a file is done with it, to keep the worker's memory flat. */
export function forget(id: string): void {
  BUILT.delete(id);
  LOD.delete(id);
  TEXT.delete(id);
  MODULE.delete(id);
}

/** How many combinations besides the defaults variantsUnderTest() checks by default. */
export const SAMPLED_VARIANTS = 3;

/** Whether the run checks every parameter combination (TEST_ALL_VARIANTS=1). */
export const ALL_VARIANTS = process.env.TEST_ALL_VARIANTS === "1";

/**
 * The combinations of `d` a test checks: every coverage combination
 * (design.ts coverageCombinations) with TEST_ALL_VARIANTS=1; otherwise the
 * defaults and SAMPLED_VARIANTS others spread evenly through the list, the
 * same ones every run.
 */
export function variantsUnderTest(d: Pick<ProceduralDesign, "params" | "finishParams">): ParamValues[] {
  return sample(coverageCombinations(d.params, d.finishParams));
}

/** The first item and SAMPLED_VARIANTS others evenly spread; all of them with TEST_ALL_VARIANTS=1. */
export function sample<T>(list: readonly T[]): T[] {
  if (ALL_VARIANTS || list.length <= SAMPLED_VARIANTS + 1) return [...list];
  const rest = list.length - 1;
  const picks = new Set<number>([0]);
  for (let k = 1; k <= SAMPLED_VARIANTS; k++) picks.add(Math.round((k * rest) / SAMPLED_VARIANTS));
  return [...picks].sort((a, b) => a - b).map((i) => list[i]!);
}

/**
 * The designs of shard `index` of `count`, by position in the catalog, so the
 * per-design checks spread over the workers (test/catalog-*.test.ts).
 */
export function shard(index: number, count: number): string[] {
  return [...DESIGNS.keys()].filter((_, i) => i % count === index);
}
