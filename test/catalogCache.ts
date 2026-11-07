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
import type { Emitter } from "../generator/meshCore";
import type { SourceTree } from "../generator/sourceTree";
import { FLEET_SWEEP_SAMPLE, WORLD_FLEET } from "../generator/worldFleet";

/** Every world fleet design (generator/worldFleet.ts). */
const FLEET_IDS = new Set(WORLD_FLEET.map((e) => e.id));

export interface Built {
  glb: Uint8Array;
  triangles: number;
  rig: VehicleRig | null;
  tree: SourceTree;
  /** Its emitters, and its vertex positions when it has any (the emitter check reads them). */
  emitters: readonly Emitter[];
  positions: Float32Array | null;
  /** Whether it states fountain water. */
  fountain: boolean;
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
    const emitters = model.emitters();
    b = {
      glb: toGlb(id, model), triangles: model.triangleCount(), rig: model.rig, tree: model.sourceTree(d.id, d.title),
      emitters, positions: emitters.length ? Float32Array.from(model.positions()) : null, fountain: model.fountain() !== null,
    };
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
export const SAMPLED_VARIANTS = 1;

/** Whether the run checks every parameter combination (TEST_ALL_VARIANTS=1). */
export const ALL_VARIANTS = process.env.TEST_ALL_VARIANTS === "1";

/**
 * The combinations of `d` a test checks: every coverage combination
 * (design.ts coverageCombinations) with TEST_ALL_VARIANTS=1; otherwise the
 * defaults and SAMPLED_VARIANTS others spread evenly through the list, the
 * same ones every run.
 */
export function variantsUnderTest(d: Pick<ProceduralDesign, "params" | "finishParams"> & { id?: string }): ParamValues[] {
  const out = sample(coverageCombinations(d.params, d.finishParams));
  if (ALL_VARIANTS) return out;
  // a world fleet design: its defaults (its family suite builds its other combinations;
  // docs/models/world-fleet.md)
  if (d.id && FLEET_IDS.has(d.id)) return out.slice(0, 1);
  // an animal-drawn vehicle: its defaults (test/animalDrawn.test.ts builds every species' biggest
  // team, an elephant and the trailer)
  if (d.id && /^(proc-vehicle|veh)-animal-/.test(d.id)) return out.slice(0, 1);
  // a train's sampled length is its shortest with a middle car (3 cars where offered): the
  // longest repeats the same cars and joints at several times the cost
  const cars = d.params?.find((p) => p.name === "cars");
  if (!cars) return out;
  const values = cars.values.map((v) => v.value);
  const short = values.find((v) => Number(v) >= 3) ?? values[values.length - 1]!;
  return out.map((v, i) => (i > 0 && v.cars !== undefined ? { ...v, cars: short } : v));
}

/**
 * The source modules of the eight-country plan (docs/specs/2026-11-05-trains-of-eight-countries.md):
 * each design is data on a shared kit, its build the module's kit code with its own figures.
 * The catalog sweep and the door suite run on each module's first design; every design of
 * the modules gets the data checks of test/worldTrains.test.ts (z-fighting, emitters, gauge,
 * budget, length and doors on its defaults and a sampled combination, its LOD budget).
 * TEST_ALL_DESIGNS=1 (or TEST_ALL_VARIANTS=1) sweeps every design.
 */
export const KIT_FAMILY_MODULES: ReadonlySet<string> = new Set([
  "deUnits.ts", "deLocos.ts", "frUnits.ts", "frLocos.ts", "nlUnits.ts", "nlLocos.ts", "chUnits.ts", "chLocos.ts", "esUnits.ts", "esLocos.ts", "ukUnits.ts", "ukLocos.ts", "inUnits.ts", "inLocos.ts", "worldWagons.ts", "cnUnits.ts", "cnLocos.ts", "worldSteamLocos.ts", "worldCoaches.ts",
]);

const ALL_DESIGNS = process.env.TEST_ALL_DESIGNS === "1";
const FIRST_OF_MODULE = new Map<string, string>();
for (const id of DESIGNS.keys()) { const src = designSource(id); if (!FIRST_OF_MODULE.has(src)) FIRST_OF_MODULE.set(src, id); }

/** Whether the catalog sweep and the door suite check a design: all but the plan's families' later designs. */
export function swept(id: string): boolean {
  const src = designSource(id);
  if (ALL_DESIGNS || ALL_VARIANTS) return true;
  // the world fleet: its covering sample (generator/worldFleet.ts FLEET_SWEEP_SAMPLE, SWEPT_IDS)
  if (!SWEPT.has(id)) return false;
  return (!KIT_FAMILY_MODULES.has(src) && !ANIMAL_DRAWN_MODULES.has(src)) || FIRST_OF_MODULE.get(src) === id;
}

/**
 * The animal-drawn vehicles' modules (docs/models/animal-drawn-vehicles.md): every design is a
 * body on one kit, so the catalog sweep and the door, rig and rolling suites check each module's
 * first design; test/animalDrawn.test.ts checks all twelve (budget, flicker, rig, supports, gait,
 * LOD and sounds at every species' biggest team, an elephant and the trailer).
 */
export const ANIMAL_DRAWN_MODULES: ReadonlySet<string> = new Set(["animalTrams.ts", "animalRail.ts", "animalBuses.ts"]);

/** The first item and SAMPLED_VARIANTS others evenly spread; all of them with TEST_ALL_VARIANTS=1. */
export function sample<T>(list: readonly T[]): T[] {
  if (ALL_VARIANTS || list.length <= SAMPLED_VARIANTS + 1) return [...list];
  const rest = list.length - 1;
  const picks = new Set<number>([0]);
  for (let k = 1; k <= SAMPLED_VARIANTS; k++) picks.add(Math.round((k * rest) / SAMPLED_VARIANTS));
  return [...picks].sort((a, b) => a - b).map((i) => list[i]!);
}

/**
 * The designs the catalog sweep checks: every design but the world fleet's
 * outside its covering sample (generator/worldFleet.ts FLEET_SWEEP_SAMPLE; their
 * data is checked in test/worldFleet.test.ts and `pnpm build` builds them all);
 * with TEST_ALL_VARIANTS=1 every design.
 */
export const SWEPT_IDS: readonly string[] = [...DESIGNS.keys()].filter((id) => ALL_VARIANTS || !FLEET_IDS.has(id) || FLEET_SWEEP_SAMPLE.has(id));

/** The fleet's part of SWEPT_IDS: whether the world fleet's rule keeps design `id`. */
const SWEPT = new Set(SWEPT_IDS);

/**
 * The designs of `list` the whole-catalog suites build: all but the world fleet's
 * outside its covering sample (docs/models/world-fleet.md). Every fleet design is
 * still checked by its family suite, test/worldFleet.test.ts and `pnpm build`.
 */
/** Whether `id` is a world fleet design outside the covering sample (its family suite and the data checks cover it). */
export const outsideFleetSample = (id: string): boolean => FLEET_IDS.has(id) && !checkedBySuites(id);

export function sweptOf<T extends { id: string }>(list: readonly T[]): T[] {
  return list.filter((d) => checkedBySuites(d.id));
}

/**
 * The world fleet's designs the secondary whole-catalog suites build (doors, interiors,
 * rig, pantographs and lamps, glass, LOD lamps and clips, rail supports): the first design
 * of each family module and each family's largest, as the eight-country plan's kit
 * families are (KIT_FAMILY_MODULES). The catalog sweep builds the whole covering sample.
 */
const FLEET_SUITE_IDS: ReadonlySet<string> = (() => {
  const out = new Set<string>();
  const firstOf = new Map<string, string>();
  for (const e of WORLD_FLEET) {
    const src = designSource(e.id);
    if (!firstOf.has(src)) firstOf.set(src, e.id);
  }
  for (const id of firstOf.values()) out.add(id);
  // the fleet's one semi-trailer bus: test/rig.test.ts swings its trailer (the trucks' own suite swings theirs)
  out.add("proc-vehicle-havana-camello");
  for (const family of new Set(WORLD_FLEET.map((e) => e.family))) {
    const all = WORLD_FLEET.filter((e) => e.family === family);
    out.add(all.reduce((a, b) => (b.size > a.size ? b : a)).id);
  }
  return out;
})();

/** Whether the secondary whole-catalog suites build design `id`: swept, and for the fleet FLEET_SUITE_IDS. */
export function checkedBySuites(id: string): boolean {
  if (ALL_DESIGNS || ALL_VARIANTS) return true;
  // TEST_FLEET_COVER=1: the fleet's whole covering sample (every kit option at least once), for a kit change
  if (FLEET_COVER) return swept(id);
  return swept(id) && (!FLEET_IDS.has(id) || FLEET_SUITE_IDS.has(id));
}

/** Whether the run sweeps the world fleet's whole covering sample (TEST_FLEET_COVER=1). */
const FLEET_COVER = process.env.TEST_FLEET_COVER === "1";

/**
 * The designs of shard `index` of `count`, by position among SWEPT_IDS, so the
 * per-design checks spread over the workers (test/catalog-*.test.ts, sixteen).
 */
export function shard(index: number, count: number): string[] {
  return [...DESIGNS.keys()].filter(checkedBySuites).filter((_, i) => i % count === index);
}
