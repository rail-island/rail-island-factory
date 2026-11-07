// The animal-drawn vehicle kit (docs/models/animal-drawn-vehicles.md): what every
// animal-drawn tram, train and bus shares - its two team parameters, its game
// properties derived per variant (draftAnimals.ts `teamGame`), and how the team is
// rigged so the game poses it on the track or the road:
//
//   rail and tram  the car is `section0`, the team `section1` hinged at the car's
//                  draw hook with no joint, standing on lone supports under its legs
//                  (as an articulated car whose front section is the team); the rig's
//                  `team` marks it re-hitchable, so the game moves it to the leading
//                  end when the vehicle turns back. With the team `none` the car is a
//                  rigid trailer.
//   road           the team with the fore-carriage (the front axle on its turntable,
//                  the pole) is `section0`, the body `section1` hinged at the
//                  turntable's king bolt, like a semi-truck's tractor and trailer; the
//                  steered "wheels" are two empty nodes under the leaders' forelegs,
//                  so the game steers the team on its quarter mark and drags the body.
//
// A design supplies its body (and the road vehicle its fore-carriage), drawn in the
// model frame (+X forward, the rail or the road at y 0), and its distant model.

import { MeshBuilder } from "./meshBuilder.ts";
import type { MaterialSpec, Vec3 } from "./meshCore.ts";
import { rollWheels, ROLLING_CLIP, ROLLING_SAMPLES, ROLLING_SPEED } from "./rolling.ts";
import type { CatalogFields, ParamValues, ProceduralDesign } from "./design.ts";
import type { VehicleRig } from "./rig.ts";
import { addGait, animalPalette, drawTeam, SPECIES_SPECS, teamGame, teamLod, teamOf, teamParams, placeTeam } from "./draftAnimals.ts";

export type AnimalVehicleKind = "tram" | "rail" | "road";

export interface AnimalVehicleSpec {
  /** `veh-<name>`; the catalog id is `proc-vehicle-<name>`. */
  id: string;
  title: string;
  kind: AnimalVehicleKind;
  catalog: CatalogFields;
  palette: Record<string, MaterialSpec>;
  /** The vehicle without its team: weight (t) and its own top speed (km/h). */
  weight: number;
  maxspeed: number;
  /** Whether the default team is a pair (a road coach) rather than one animal. */
  pair?: boolean;
  /** Where the team is hitched: the draw hook's pin (rail, tram) or the pole's root on the fore-carriage (road). */
  hitch: Vec3;
  /** Where the driver holds the reins, if anywhere. */
  reins?: Vec3;
  /** The car or the coach body (rail, tram: everything; road: all but the fore-carriage). */
  body: (m: MeshBuilder) => void;
  /** A road vehicle's fore-carriage: the front axle and its wheels on the turntable. */
  fore?: (m: MeshBuilder) => void;
  /** A road vehicle's king bolt (the body's hinge on the fore-carriage) and its front axle's track. */
  kingpin?: Vec3;
  track?: number;
  /** The rolling wheels, each list with its diameter. */
  rolling: ReadonlyArray<{ nodes: readonly string[]; diameter: number }>;
  /** The body's distant model (and a road vehicle's fore-carriage's). */
  lod: (m: MeshBuilder) => void;
  /** The asset folder of its references. */
  references: string;
}

/** The team section's node and the body's, by kind. */
const SECTION0 = "section0";
const SECTION1 = "section1";

/** The palette of the vehicle and every animal. */
const paletteOf = (s: AnimalVehicleSpec): Record<string, MaterialSpec> => ({ ...animalPalette(), ...s.palette });

/** The most an animal-drawn vehicle bends at its hitch, degrees. */
export const TEAM_BEND_DEG = 60;

export function buildAnimalVehicle(s: AnimalVehicleSpec, params?: ParamValues): MeshBuilder {
  const m = new MeshBuilder(paletteOf(s));
  const team = teamOf(params, { pair: s.pair });
  if (s.kind === "road") {
    const kp = s.kingpin!;
    let placed: ReturnType<typeof drawTeam> = [];
    m.part(SECTION0, [0, 0, 0], () => {
      m.scope("fore-carriage", () => s.fore!(m));
      placed = drawTeam(m, { species: team.species, count: team.count, hitch: s.hitch, draft: "pole", reins: s.reins, supports: false });
    });
    // the steered "axle": two empty nodes under the leaders' forelegs, the track apart
    const lead = Math.max(...placed.map((p) => p.x)) + SPECIES_SPECS[team.species].legs.front;
    const half = (s.track ?? 1.6) / 2;
    for (const [name, z] of [["wheel-front-left", -half], ["wheel-front-right", half]] as const) m.part(name, [r4(lead), 0, z], () => {}, SECTION0);
    m.part(SECTION1, kp, () => m.scope("body", () => s.body(m)));
    addGait(m, team.species, placed, [0, 0, 0]);
    m.rig = {
      steer: { axles: [{ nodes: ["wheel-front-left", "wheel-front-right"], wheelbase: r4(lead - kp[0]) }], maxAngleDeg: 40, track: 2 * half },
      sections: [{ node: SECTION0, pivot: [0, 0, 0] }, { node: SECTION1, pivot: kp }],
      joints: [],
      maxBendDeg: TEAM_BEND_DEG,
      team: { section: 0, rehitchable: false },
    } satisfies VehicleRig;
  } else if (!team.count) {
    m.scope("body", () => s.body(m));
  } else {
    m.part(SECTION0, [0, 0, 0], () => m.scope("body", () => s.body(m)));
    m.part(SECTION1, s.hitch, () => {
      const placed = drawTeam(m, { species: team.species, count: team.count, hitch: s.hitch, draft: "traces", reins: s.reins, supports: true });
      addGait(m, team.species, placed, s.hitch);
    });
    m.rig = {
      sections: [{ node: SECTION0, pivot: [0, 0, 0] }, { node: SECTION1, pivot: s.hitch }],
      joints: [],
      maxBendDeg: TEAM_BEND_DEG,
      team: { section: 1, rehitchable: true },
    } satisfies VehicleRig;
  }
  rollAll(m, s.rolling);
  return m;
}

export function buildAnimalVehicleLod(s: AnimalVehicleSpec, params?: ParamValues): MeshBuilder {
  const m = new MeshBuilder(paletteOf(s));
  const team = teamOf(params, { pair: s.pair });
  if (s.kind === "road") {
    const kp = s.kingpin!;
    m.part(SECTION0, [0, 0, 0], () => teamLod(m, team.species, team.count, s.hitch[0]));
    const lead = Math.max(...placeTeam(team.species, team.count, s.hitch[0]).map((p) => p.x)) + SPECIES_SPECS[team.species].legs.front;
    const half = (s.track ?? 1.6) / 2;
    // the steered nodes before the body's section: a part follows its parent's other descendants
    for (const [name, z] of [["wheel-front-left", -half], ["wheel-front-right", half]] as const) m.part(name, [r4(lead), 0, z], () => {}, SECTION0);
    m.part(SECTION1, kp, () => s.lod(m));
    m.rig = {
      sections: [{ node: SECTION0, pivot: [0, 0, 0] }, { node: SECTION1, pivot: kp }], joints: [], maxBendDeg: TEAM_BEND_DEG,
      steer: { axles: [{ nodes: ["wheel-front-left", "wheel-front-right"], wheelbase: r4(lead - kp[0]) }], maxAngleDeg: 40, track: s.track ?? 1.6 },
    } satisfies VehicleRig;
  } else if (!team.count) {
    s.lod(m);
  } else {
    m.part(SECTION0, [0, 0, 0], () => s.lod(m));
    m.part(SECTION1, s.hitch, () => teamLod(m, team.species, team.count, s.hitch[0]));
    m.rig = { sections: [{ node: SECTION0, pivot: [0, 0, 0] }, { node: SECTION1, pivot: s.hitch }], joints: [], maxBendDeg: TEAM_BEND_DEG };
  }
  return m;
}

const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

/**
 * The one `rolling` clip of every rolling wheel: a single size is `rollWheels`'s; with
 * several (a coach's small front and big rear wheels) one cycle is the biggest wheel's
 * turn and each smaller one turns as many times further as its size is smaller - a
 * whole number of quarter turns, so the loop closes without a jump (its spokes are
 * four-fold at least).
 */
export function rollAll(m: MeshBuilder, rolling: AnimalVehicleSpec["rolling"]): void {
  if (!rolling.length) return;
  if (rolling.length === 1) return rollWheels(m, rolling[0]!.nodes, rolling[0]!.diameter);
  const big = Math.max(...rolling.map((r) => r.diameter));
  const duration = (Math.PI * big) / ROLLING_SPEED;
  const times = Array.from({ length: ROLLING_SAMPLES + 1 }, (_, k) => Math.round(((k * duration) / ROLLING_SAMPLES) * 1e6) / 1e6);
  const turn = (f: number): number[] => times.flatMap((_, k) => {
    const a = (-2 * Math.PI * f * k) / ROLLING_SAMPLES;
    return [0, 0, Math.sin(a / 2), Math.cos(a / 2)];
  });
  const tracks = rolling.flatMap((r) => {
    const ratio = big / r.diameter;
    if (Math.abs(ratio * 4 - Math.round(ratio * 4)) > 1e-6) throw new Error(`rollAll(): wheel ratio ${ratio} is not a whole number of quarter turns`);
    return r.nodes.map((node) => ({ node, path: "rotation" as const, values: turn(ratio) }));
  });
  m.animate({ name: ROLLING_CLIP, times, tracks, drive: { drive: "distance", speed: ROLLING_SPEED } });
}

/**
 * The design of an animal-drawn vehicle. `fns` are the build functions as its module
 * exports them (the JS model imports them by name), bound to the spec there.
 */
export function animalVehicleDesign(s: AnimalVehicleSpec, fns: { build: (p?: ParamValues) => MeshBuilder; buildLod: (p?: ParamValues) => MeshBuilder }): ProceduralDesign {
  const trailer = s.kind !== "road";
  return {
    id: s.id,
    title: s.title,
    build: fns.build,
    buildLod: fns.buildLod,
    params: teamParams({ trailer, pair: s.pair }),
    game: teamGame({ weight: s.weight, maxspeed: s.maxspeed }, { trailer, pair: s.pair }),
    references: s.references,
    lodTriangles: 500,
    catalog: s.catalog,
  };
}

