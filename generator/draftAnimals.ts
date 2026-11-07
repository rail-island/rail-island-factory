// The draft animals (docs/models/draft-animals.md): the six species that pull the
// animal-drawn trams, trains and buses - horse, donkey, mule, cow, camel and
// elephant - drawn true to size in their harness, jointed so they walk or trot, and
// the TEAM a vehicle is drawn by: one to six animals in the hitch their species
// uses (one alone, two abreast, two or three pairs; the camel and the elephant in
// single file), with the swingletrees, yokes and traces back to the vehicle's
// hitch, the lone supports the game stands it on, its distant model and its clip.
//
// Every animal-drawn vehicle carries two parameters, the species (`animal`) and the
// team size (`team`), whose values offered depend on the species; a rail or tram
// vehicle also offers `none`, the trailer without a team. Its game properties are
// derived per variant from the species table (`teamGame`): the team's power, the
// species' pace as the top speed, lowered where the power would not hold it on a
// 5 % grade, and the team's weight added.
//
// Axes as every vehicle's: metres, +X forward, +Y up, +Z to the right, the ground at
// y 0. An animal is drawn about its own middle (animal coordinates), placed by an
// offset; the team stands ahead of the hitch point, facing +X.

import { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { lodSideBox } from "./lodKit.ts";
import { ROLLING_SPEED } from "./rolling.ts";
import { qAxis, qMul, r6, r9, TAU, type Quat } from "./characterKit.ts";
import type { ParamSpec, ParamValues, VehicleGameVariant } from "./design.ts";

// ---------------------------------------------------------------------------
// the species

export type Species = "horse" | "donkey" | "mule" | "cow" | "camel" | "elephant";
export const SPECIES: readonly Species[] = ["horse", "donkey", "mule", "cow", "camel", "elephant"];

/** How the animal is put to: a collar and traces, a neck yoke, a breast band. */
export type HarnessKind = "collar" | "yoke" | "breastband";
/** What its feet are, for the hoof beat (rail-island-music `hoof-beat` `foot`). */
export type Foot = "hoof" | "cloven" | "padded";
/** The gait it walks the vehicle at: the diagonal pairs (trot), the lateral pairs (pace) or a four-beat walk. */
export type Gait = "trot" | "pace" | "walk";

/** One station of a skinned body: x (or t along an axis), centre height, half width, half height. */
type Station = readonly [number, number, number, number];

export interface SpeciesSpec {
  species: Species;
  title: string;
  /** The barrel: stations along x from the rump to the chest. */
  barrel: readonly Station[];
  /** The neck's axis, from its root at the shoulders, as (x, y, half width, half height). */
  neck: readonly Station[];
  /** The head's axis from the poll to the muzzle, as (x, y, half width, half height); the last two stations are the muzzle's colour. */
  head: readonly Station[];
  /** The legs: shoulder and hip x, half track, joint heights, radii (upper top, knee, cannon, foot). */
  legs: { front: number; hind: number; z: number; top: number; knee: number; r: readonly [number, number, number, number] };
  /** Where the tail hangs from and its tip, and whether it ends in a tuft. */
  tail: { root: readonly [number, number]; tip: readonly [number, number]; r: number; tuft: boolean };
  ears: { length: number; width: number; droop: number };
  colors: { coat: string; mane: string; muzzle: string; foot: string; lower?: string; blaze?: string };
  mane: "flowing" | "upright" | "none";
  feature?: "horns" | "hump" | "trunk";
  harness: HarnessKind;
  foot: Foot;
  gait: Gait;
  /** Ground covered in one full cycle of the legs at the vehicle's pace, metres. */
  stride: number;
  /** The share of the cycle a foot is planted (0.5 for a trot or pace, more for a walk). */
  duty: number;
  /** The leg pairs abreast: centre to centre across, metres; and one row's length from hitch to hitch. */
  pairWidth: number;
  rowLength: number;
  /** Team sizes the species is put to (besides `none`). */
  counts: readonly number[];
  /** Hitch: two abreast where a pair is the unit, else single file. */
  abreast: boolean;
  /** Game figures: the pace (km/h), pulling power per head (kW, as the game's physics reads it) and weight (tonnes). */
  pace: number;
  power: number;
  weight: number;
  /** Size for the hoof beat, 0 light (a donkey) to 1 (an elephant). */
  size: number;
}

// the Clydesdale's stations (the former horse tram's horse), the template of the equines
const HORSE_BARREL: readonly Station[] = [
  [-1.0, 1.36, 0.07, 0.08], [-0.95, 1.33, 0.2, 0.24], [-0.82, 1.3, 0.3, 0.33], [-0.62, 1.28, 0.34, 0.37], [-0.35, 1.25, 0.35, 0.38],
  [0.0, 1.23, 0.37, 0.41], [0.35, 1.26, 0.35, 0.41], [0.62, 1.31, 0.3, 0.39], [0.82, 1.27, 0.22, 0.3], [0.93, 1.22, 0.1, 0.14],
];
const HORSE_NECK: readonly Station[] = [[0.6, 1.42, 0.25, 0.38], [0.775, 1.61, 0.2, 0.3], [0.95, 1.81, 0.16, 0.23], [1.1, 1.98, 0.13, 0.18]];
const HORSE_HEAD: readonly Station[] = [[1.05, 2.04, 0.12, 0.14], [1.14, 1.92, 0.13, 0.17], [1.3, 1.72, 0.11, 0.13], [1.47, 1.5, 0.095, 0.11], [1.56, 1.39, 0.085, 0.09]];

/** An equine's stations scaled from the Clydesdale's: `k` overall, `w` across. */
const scaled = (st: readonly Station[], k: number, w = 1): Station[] => st.map(([x, y, a, b]) => [x * k, y * k, a * k * w, b * k] as const);

const equine = (k: number, w: number) => ({
  barrel: scaled(HORSE_BARREL, k, w), neck: scaled(HORSE_NECK, k, w), head: scaled(HORSE_HEAD, k, w),
  legs: { front: 0.52 * k, hind: -0.64 * k, z: 0.19 * k * w, top: 1.08 * k, knee: 0.55 * k, r: [0.13 * k * w, 0.065 * k, 0.05 * k, 0.1 * k] as const },
  tail: { root: [-0.97 * k, 1.5 * k] as const, tip: [-1.08 * k, 0.66 * k] as const, r: 0.08 * k, tuft: false },
});

export const SPECIES_SPECS: Readonly<Record<Species, SpeciesSpec>> = {
  horse: {
    species: "horse", title: "Draft Horse", ...equine(1, 1),
    ears: { length: 0.16, width: 0.04, droop: 0 },
    colors: { coat: "#5a2c19", mane: "#1c1411", muzzle: "#d7b3a3", foot: "#3a322d", lower: "#ece5d8", blaze: "#ece5d8" },
    mane: "flowing", harness: "collar", foot: "hoof", gait: "trot", stride: 2.4, duty: 0.5,
    pairWidth: 0.92, rowLength: 3.1, counts: [1, 2, 4, 6], abreast: true,
    pace: 12, power: 6, weight: 0.8, size: 0.55,
  },
  donkey: {
    species: "donkey", title: "Donkey",
    ...equine(0.64, 0.92),
    tail: { root: [-0.62, 0.95], tip: [-0.68, 0.45], r: 0.035, tuft: true },
    ears: { length: 0.27, width: 0.055, droop: 0.15 },
    colors: { coat: "#7d7570", mane: "#3b3532", muzzle: "#e4ddd3", foot: "#33302d" },
    mane: "upright", harness: "collar", foot: "hoof", gait: "trot", stride: 1.5, duty: 0.55,
    pairWidth: 0.62, rowLength: 2.1, counts: [1, 2, 4, 6], abreast: true,
    pace: 6, power: 2.5, weight: 0.25, size: 0.15,
  },
  mule: {
    species: "mule", title: "Mule",
    ...equine(0.86, 0.94),
    tail: { root: [-0.83, 1.29], tip: [-0.92, 0.6], r: 0.06, tuft: false },
    ears: { length: 0.25, width: 0.05, droop: 0.08 },
    colors: { coat: "#4a3326", mane: "#231a15", muzzle: "#bfa48f", foot: "#2f2925" },
    mane: "upright", harness: "collar", foot: "hoof", gait: "trot", stride: 2.0, duty: 0.52,
    pairWidth: 0.82, rowLength: 2.7, counts: [1, 2, 4, 6], abreast: true,
    pace: 9, power: 5, weight: 0.45, size: 0.4,
  },
  cow: {
    species: "cow", title: "Draft Cow",
    barrel: [[-0.98, 1.1, 0.12, 0.14], [-0.92, 1.08, 0.3, 0.34], [-0.7, 1.06, 0.36, 0.4], [-0.3, 1.04, 0.38, 0.43], [0.15, 1.04, 0.39, 0.44], [0.55, 1.08, 0.34, 0.42], [0.8, 1.1, 0.27, 0.36], [0.92, 1.06, 0.14, 0.22]],
    neck: [[0.7, 1.15, 0.24, 0.34], [0.95, 1.18, 0.2, 0.3], [1.15, 1.22, 0.16, 0.24]],
    head: [[1.12, 1.36, 0.14, 0.13], [1.22, 1.28, 0.15, 0.15], [1.38, 1.1, 0.12, 0.12], [1.5, 0.94, 0.1, 0.1], [1.55, 0.88, 0.095, 0.08]],
    legs: { front: 0.6, hind: -0.66, z: 0.21, top: 0.86, knee: 0.42, r: [0.17, 0.095, 0.075, 0.09] },
    tail: { root: [-0.97, 1.3], tip: [-1.0, 0.45], r: 0.03, tuft: true },
    ears: { length: 0.14, width: 0.06, droop: 0.9 },
    colors: { coat: "#8c5a32", mane: "#6e4524", muzzle: "#d8b6a0", foot: "#2b2522", lower: "#efe8dc" },
    mane: "none", feature: "horns", harness: "yoke", foot: "cloven", gait: "walk", stride: 1.3, duty: 0.65,
    pairWidth: 1.05, rowLength: 2.9, counts: [1, 2, 4, 6], abreast: true,
    pace: 4, power: 3.5, weight: 0.6, size: 0.6,
  },
  camel: {
    species: "camel", title: "Camel",
    barrel: [[-0.82, 1.62, 0.08, 0.1], [-0.76, 1.6, 0.22, 0.26], [-0.5, 1.6, 0.28, 0.32], [-0.1, 1.62, 0.3, 0.36], [0.3, 1.62, 0.28, 0.36], [0.6, 1.58, 0.22, 0.32], [0.76, 1.52, 0.12, 0.2]],
    neck: [[0.62, 1.62, 0.15, 0.2], [0.98, 1.38, 0.1, 0.13], [1.28, 1.42, 0.09, 0.11], [1.44, 1.78, 0.08, 0.1], [1.48, 2.1, 0.08, 0.09]],
    head: [[1.44, 2.18, 0.09, 0.1], [1.56, 2.16, 0.09, 0.1], [1.72, 2.1, 0.075, 0.08], [1.86, 2.04, 0.06, 0.065], [1.92, 2.0, 0.05, 0.05]],
    legs: { front: 0.5, hind: -0.55, z: 0.2, top: 1.42, knee: 0.72, r: [0.11, 0.06, 0.045, 0.11] },
    tail: { root: [-0.8, 1.66], tip: [-0.86, 1.05], r: 0.03, tuft: true },
    ears: { length: 0.08, width: 0.035, droop: 0.4 },
    colors: { coat: "#c49a62", mane: "#9c7646", muzzle: "#b58b56", foot: "#6e5536" },
    mane: "none", feature: "hump", harness: "breastband", foot: "padded", gait: "pace", stride: 2.6, duty: 0.55,
    pairWidth: 1.0, rowLength: 3.4, counts: [1, 2, 3], abreast: false,
    pace: 8, power: 4.5, weight: 0.5, size: 0.7,
  },
  elephant: {
    species: "elephant", title: "Elephant",
    barrel: [[-1.25, 2.0, 0.2, 0.25], [-1.18, 1.98, 0.55, 0.62], [-0.9, 2.0, 0.72, 0.82], [-0.4, 2.02, 0.78, 0.88], [0.2, 2.05, 0.78, 0.9], [0.7, 2.1, 0.7, 0.86], [1.0, 2.1, 0.5, 0.7], [1.12, 2.08, 0.3, 0.45]],
    neck: [[1.0, 2.2, 0.45, 0.6], [1.25, 2.3, 0.4, 0.55]],
    head: [[1.2, 2.55, 0.42, 0.48], [1.45, 2.45, 0.45, 0.52], [1.65, 2.25, 0.36, 0.42], [1.8, 1.95, 0.2, 0.24], [1.84, 1.75, 0.13, 0.14]],
    legs: { front: 0.72, hind: -0.82, z: 0.42, top: 1.7, knee: 0.85, r: [0.3, 0.22, 0.2, 0.24] },
    tail: { root: [-1.25, 2.3], tip: [-1.32, 1.2], r: 0.04, tuft: true },
    ears: { length: 0.7, width: 0.55, droop: 0.2 },
    colors: { coat: "#7c7671", mane: "#4b4642", muzzle: "#6e6863", foot: "#5a5550" },
    mane: "none", feature: "trunk", harness: "breastband", foot: "padded", gait: "walk", stride: 2.4, duty: 0.66,
    pairWidth: 2.0, rowLength: 4.4, counts: [1, 2], abreast: false,
    pace: 6, power: 12, weight: 4.0, size: 1,
  },
};

// ---------------------------------------------------------------------------
// the team's parameters and game properties

/** The parameter names every animal-drawn vehicle carries. */
export const ANIMAL_PARAM = "animal";
export const TEAM_PARAM = "team";
/** The trailer's team value: no animals, the plain coach or wagon coupled behind. */
export const NO_TEAM = "none";


/**
 * The two parameters: the species first, then the team size, each count offered only
 * for the species put to it; a rail vehicle offers `none` (the trailer) too. The
 * default (a single horse, or a pair where `pair` asks) is offered for every species.
 */
export function teamParams(opts: { trailer: boolean; pair?: boolean }): ParamSpec[] {
  const counts = [...new Set(SPECIES.flatMap((s) => SPECIES_SPECS[s].counts))].sort((a, b) => a - b);
  return [
    { name: ANIMAL_PARAM, title: "Animal", default: "horse", values: SPECIES.map((s) => ({ value: s, title: SPECIES_SPECS[s].title })) },
    {
      name: TEAM_PARAM, title: "Team", default: opts.pair ? "2" : "1",
      values: [
        ...(opts.trailer ? [{ value: NO_TEAM, title: "None (trailer)" }] : []),
        ...counts.map((n) => {
          const species = SPECIES.filter((s) => SPECIES_SPECS[s].counts.includes(n));
          return { value: String(n), title: String(n), ...(species.length < SPECIES.length ? { when: { name: ANIMAL_PARAM, values: species } } : {}) };
        }),
      ],
    },
  ];
}

/** The team a selection asks for: its species and how many (0 for the trailer); a count the species is not put to is read as its biggest team no larger. */
export function teamOf(params: ParamValues | undefined, opts: { pair?: boolean } = {}): { species: Species; count: number } {
  const species = (params?.[ANIMAL_PARAM] ?? "horse") as Species;
  const raw = params?.[TEAM_PARAM] ?? (opts.pair ? "2" : "1");
  if (!SPECIES.includes(species)) throw new Error(`unknown animal ${species}`);
  const asked = raw === NO_TEAM ? 0 : Number(raw);
  if (!Number.isInteger(asked) || asked < 0) throw new Error(`no team of ${raw}`);
  // a count the species is not put to (a selection no picker offers, ParamValue.when) is
  // its biggest team no larger, as resolving does not refuse it: never a throw mid-build
  const counts = SPECIES_SPECS[species].counts;
  const count = !asked || counts.includes(asked) ? asked : Math.max(counts[0]!, ...counts.filter((n) => n <= asked));
  return { species, count };
}

/** km/h a consist of `power` kW and `weight` t holds up a 5 % grade in the game (rail-island-webapp VehiclePhysics: 1.5 P / (W v) = 9.8 x 0.05, v in studs/s = km/h x 30/80). */
export function gradeSpeed(power: number, weight: number): number {
  return (1.5 * power) / (weight * 9.8 * 0.05 * (30 / 80));
}

/** One team's figures on a vehicle of `weight` tonnes with a top speed of `maxspeed`. */
export function teamFigures(species: Species, count: number, vehicle: { weight: number; maxspeed: number }): { weight: number; power: number; maxspeed: number } {
  if (!count) return { weight: vehicle.weight, power: 0, maxspeed: vehicle.maxspeed };
  const s = SPECIES_SPECS[species];
  const weight = Math.round((vehicle.weight + count * s.weight) * 100) / 100;
  const power = Math.round(count * s.power * 10) / 10;
  const maxspeed = Math.max(2, Math.min(s.pace, vehicle.maxspeed, Math.floor(gradeSpeed(power, weight))));
  return { weight, power, maxspeed };
}

/**
 * The game properties of an animal-drawn vehicle: the default team's figures, and
 * a variant for every other species and team, each with only what differs.
 */
export function teamGame(vehicle: { weight: number; maxspeed: number }, opts: { trailer: boolean; pair?: boolean }): { weight: number; power: number; maxspeed: number; accel: null; variants: VehicleGameVariant[] } {
  const params = teamParams(opts);
  const base = teamOf(undefined, opts);
  const top = teamFigures(base.species, base.count, vehicle);
  const variants: VehicleGameVariant[] = [];
  for (const sel of teamSelections(params)) {
    const t = teamOf(sel, opts);
    if (t.species === base.species && t.count === base.count) continue;
    const f = teamFigures(t.species, t.count, vehicle);
    const diff: Partial<typeof f> = {};
    for (const k of ["weight", "power", "maxspeed"] as const) if (f[k] !== top[k]) diff[k] = f[k];
    const nonDefault: ParamValues = {};
    if (sel[ANIMAL_PARAM] !== params[0]!.default) nonDefault[ANIMAL_PARAM] = sel[ANIMAL_PARAM]!;
    if (sel[TEAM_PARAM] !== params[1]!.default) nonDefault[TEAM_PARAM] = sel[TEAM_PARAM]!;
    if (Object.keys(diff).length) variants.push({ params: nonDefault, ...diff });
  }
  return { ...top, accel: null, variants };
}

/** Every species and team selection the parameters offer, species-major. */
export function teamSelections(params: readonly ParamSpec[]): ParamValues[] {
  const [animal, team] = params as [ParamSpec, ParamSpec];
  return animal.values.flatMap((a) => team.values.filter((v) => !v.when || v.when.values.includes(a.value)).map((v) => ({ [ANIMAL_PARAM]: a.value, [TEAM_PARAM]: v.value })));
}

// ---------------------------------------------------------------------------
// the hitch: where each animal of a team stands

export interface Placed {
  /** The animal's index in the team, front row first, left before right. */
  index: number;
  row: number;
  /** Its middle (animal x 0) in the model, and its offset across. */
  x: number;
  z: number;
}

/** The rows of a team front first: how many abreast in each. */
export function rowsOf(species: Species, count: number): number[] {
  const s = SPECIES_SPECS[species];
  if (!count) return [];
  if (!s.abreast) return Array.from({ length: count }, () => 1);
  if (count === 1) return [1];
  return Array.from({ length: count / 2 }, () => 2);
}

/** The distance from the hitch point to the rear row's middle: room for the swingletree and the traces. */
const firstRowGap = (s: SpeciesSpec): number => -s.barrel[0]![0] + 1.1 * (s.legs.top / 1.08);

/** Every animal of the team ahead of a hitch at `hitchX`, on the centre line. */
export function placeTeam(species: Species, count: number, hitchX: number): Placed[] {
  const s = SPECIES_SPECS[species];
  const rows = rowsOf(species, count);
  const out: Placed[] = [];
  const nRows = rows.length;
  for (let r = 0; r < nRows; r++) {
    // the row nearest the vehicle is drawn last but stands at the gap's end
    const back = nRows - 1 - r;
    const x = hitchX + firstRowGap(s) + back * s.rowLength;
    const n = rows[r]!;
    for (let k = 0; k < n; k++) out.push({ index: out.length, row: r, x: r6(x), z: n === 1 ? 0 : (k === 0 ? -1 : 1) * s.pairWidth / 2 });
  }
  return out;
}

/** The team's length from the hitch to its leaders' noses. */
export function teamLength(species: Species, count: number): number {
  if (!count) return 0;
  const s = SPECIES_SPECS[species];
  const lead = placeTeam(species, count, 0)[0]!;
  const nose = Math.max(...s.head.map((h) => h[0]), ...s.neck.map((h) => h[0])) + (s.feature === "trunk" ? 0.1 : 0);
  return lead.x + nose;
}

// ---------------------------------------------------------------------------
// geometry helpers

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const mean = (ps: readonly Vec3[]): Vec3 => mul(ps.reduce((s, p) => add(s, p), [0, 0, 0] as Vec3), 1 / ps.length);
const norm = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(...a) || 1));
const r3 = (v: number): number => Math.round(v * 1e3) / 1e3;
const Z: Vec3 = [0, 0, 1];
const Y: Vec3 = [0, 1, 0];
const X: Vec3 = [1, 0, 0];

function triOut(out: Vec3[], sum: Vec3, a: Vec3, b: Vec3, c: Vec3, inside: Vec3): void {
  const n = cross(sub(b, a), sub(c, a));
  const outward = dot(n, sub(mean([a, b, c]), inside)) >= 0;
  out.push(...(outward ? [a, b, c] : [a, c, b]));
  const k = outward ? 1 : -1;
  for (let i = 0; i < 3; i++) sum[i] += k * n[i]!;
}

/** A skin through closed rings of equal size, every face turned out from the rings' axis; the end rings capped unless asked not to. */
function skin(m: MeshBuilder, mat: string, rings: readonly Vec3[][], caps: { start?: boolean; end?: boolean } = {}): void {
  const centres = rings.map(mean);
  const n = rings[0]!.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const pts: Vec3[] = [];
    const sum: Vec3 = [0, 0, 0];
    for (let r = 0; r + 1 < rings.length; r++) {
      const [a, b] = [rings[r]!, rings[r + 1]!];
      const inside = mean([centres[r]!, centres[r + 1]!]);
      triOut(pts, sum, a[i]!, a[j]!, b[j]!, inside);
      triOut(pts, sum, a[i]!, b[j]!, b[i]!, inside);
    }
    m.facets(mat, pts, sum);
  }
  const capOf = (ring: Vec3[], c: Vec3, toward: Vec3) => {
    const inside = add(c, mul(sub(toward, c), 0.5));
    const pts: Vec3[] = [];
    const sum: Vec3 = [0, 0, 0];
    for (let i = 0; i < ring.length; i++) triOut(pts, sum, c, ring[i]!, ring[(i + 1) % ring.length]!, inside);
    m.facets(mat, pts, sub(c, toward));
  };
  if (caps.start !== false && rings.length > 1) capOf(rings[0]!, centres[0]!, centres[1]!);
  if (caps.end !== false && rings.length > 1) capOf(rings[rings.length - 1]!, centres[rings.length - 1]!, centres[rings.length - 2]!);
}

/** An elliptic ring round `c` in the plane of the unit vectors `u` and `v`. */
function ring(c: Vec3, u: Vec3, v: Vec3, ru: number, rv: number, n: number, rot = 0): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (TAU * i) / n;
    return add(c, add(mul(u, ru * Math.cos(a)), mul(v, rv * Math.sin(a))));
  });
}

/** A polyline's direction at station i (the mean of its neighbouring segments) in the x-y plane, and its upward normal. */
function frameAt(pts: readonly Vec3[], i: number): { d: Vec3; up: Vec3 } {
  const a = pts[Math.max(0, i - 1)]!;
  const b = pts[Math.min(pts.length - 1, i + 1)]!;
  const d = norm([b[0] - a[0], b[1] - a[1], 0]);
  return { d, up: [-d[1], d[0], 0] };
}

function rods(m: MeshBuilder, mat: string, pts: readonly Vec3[], r: number, n = 5, ends = true): void {
  for (let i = 0; i + 1 < pts.length; i++) m.rod(mat, pts[i]!, pts[i + 1]!, r, n, ends);
}

// ---------------------------------------------------------------------------
// the palette

/** The materials an animal and its harness use, by species (`<species>Coat` ...), and the harness's own. */
export function animalPalette(species: readonly Species[] = SPECIES): Record<string, { color: string; roughness: number; metallic?: number }> {
  const out: Record<string, { color: string; roughness: number; metallic?: number }> = {
    harness: { color: "#1b1917", roughness: 0.6 },
    collar: { color: "#3b2a1f", roughness: 0.8 },
    hames: { color: "#c9a440", metallic: 0.5, roughness: 0.35 },
    yoke: { color: "#8a6a43", roughness: 0.8 },
    traceIron: { color: "#2a2b2d", roughness: 0.7 },
    eye: { color: "#0d0b0a", roughness: 0.2 },
    horn: { color: "#e6dcc3", roughness: 0.5 },
    tusk: { color: "#f1ead8", roughness: 0.4 },
    pad: { color: "#8c2f24", roughness: 0.85 },
  };
  for (const sp of species) {
    const c = SPECIES_SPECS[sp].colors;
    out[`${sp}Coat`] = { color: c.coat, roughness: 0.78 };
    out[`${sp}Mane`] = { color: c.mane, roughness: 0.9 };
    out[`${sp}Muzzle`] = { color: c.muzzle, roughness: 0.7 };
    out[`${sp}Foot`] = { color: c.foot, roughness: 0.6 };
    out[`${sp}Lower`] = { color: c.lower ?? c.coat, roughness: 0.82 };
    out[`${sp}Blaze`] = { color: c.blaze ?? c.coat, roughness: 0.82 };
  }
  return out;
}

// ---------------------------------------------------------------------------
// one animal

type Leg = "front-left" | "front-right" | "hind-left" | "hind-right";
const LEGS: readonly Leg[] = ["front-left", "front-right", "hind-left", "hind-right"];

/** How finely an animal is drawn: full alone or in a pair, lighter in bigger teams. */
export interface Detail {
  /** Sides round the barrel, the neck and head, a leg. */
  barrel: number;
  neck: number;
  leg: number;
  /** Whether the small things are drawn (ears' insides, the eyes, the blaze, the feathering). */
  fine: boolean;
}
export const FULL: Detail = { barrel: 14, neck: 10, leg: 7, fine: true };
export const LIGHT: Detail = { barrel: 10, neck: 7, leg: 6, fine: false };
export const LIGHTEST: Detail = { barrel: 8, neck: 6, leg: 5, fine: false };

/** The detail an animal of a team of `count` is drawn at. */
export const detailFor = (count: number): Detail => (count <= 2 ? FULL : count <= 4 ? LIGHT : LIGHTEST);

/** The names of an animal's moving parts, for animal `prefix` (e.g. `animal-1`). */
export const animalNodes = (prefix: string): string[] => [prefix, `${prefix}-head`, `${prefix}-tail`, ...LEGS.flatMap((l) => [`${prefix}-leg-${l}`, `${prefix}-shin-${l}`])];

interface Drawn { s: SpeciesSpec; ox: number; oz: number; d: Detail; mat: (k: string) => string }
const at = (a: Drawn, x: number, y: number, z: number): Vec3 => [a.ox + x, y, a.oz + z];

const legX = (s: SpeciesSpec, l: Leg): number => (l.startsWith("front") ? s.legs.front : s.legs.hind);
const legZ = (s: SpeciesSpec, l: Leg): number => (l.endsWith("left") ? -s.legs.z : s.legs.z);

/** The barrel's section at animal x (interpolated): centre height, half width, half height. */
function barrelAt(s: SpeciesSpec, x: number): [number, number, number] {
  const b = s.barrel;
  for (let i = 1; i < b.length; i++) {
    const [xa, ya, wa, ha] = b[i - 1]!;
    const [xb, yb, wb, hb] = b[i]!;
    if (x <= xb || i === b.length - 1) {
      const t = Math.min(1, Math.max(0, (x - xa) / (xb - xa)));
      return [ya + (yb - ya) * t, wa + (wb - wa) * t, ha + (hb - ha) * t];
    }
  }
  return [b[0]![1], b[0]![2], b[0]![3]];
}

/** A skinned tube along stations (x, y, half width, half height) of animal coordinates. */
function tubeOf(m: MeshBuilder, a: Drawn, mat: string, st: readonly Station[], n: number, caps: { start?: boolean; end?: boolean } = {}): Vec3[][] {
  const pts = st.map(([x, y]) => at(a, x, y, 0));
  const rings = st.map(([, , w, h], i) => {
    const { up } = frameAt(pts, i);
    return ring(pts[i]!, Z, up, w, h, n, Math.PI / n);
  });
  skin(m, mat, rings, caps);
  return rings;
}

function drawBarrel(m: MeshBuilder, a: Drawn): void {
  const { s } = a;
  m.scope("barrel", () => skin(m, a.mat("Coat"), s.barrel.map(([x, y, w, h]) => ring(at(a, x, y, 0), Z, Y, w, h, a.d.barrel))));
  if (s.feature === "hump") {
    m.scope("hump", () => {
      const [yc, , hh] = barrelAt(s, -0.05);
      const top = yc + hh;
      const st: Station[] = [[-0.5, top - 0.12, 0.08, 0.06], [-0.35, top - 0.05, 0.2, 0.16], [-0.05, top + 0.12, 0.24, 0.26], [0.25, top - 0.02, 0.18, 0.15], [0.4, top - 0.12, 0.06, 0.05]];
      skin(m, a.mat("Coat"), st.map(([x, y, w, h]) => ring(at(a, x, y, 0), Z, Y, w, h, a.d.neck)));
    });
  }
}

function drawLegUpper(m: MeshBuilder, a: Drawn, l: Leg): void {
  const { s } = a;
  const [x, z] = [legX(s, l), legZ(s, l)];
  const [rTop, rKnee] = s.legs.r;
  const { top, knee } = s.legs;
  const rows: Array<[number, number]> = [[top + 0.16 * (top / 1.08), rTop], [top, rTop * 0.8], [(top + knee) / 2, (rTop * 0.8 + rKnee) / 2], [knee, rKnee]];
  skin(m, a.mat("Coat"), rows.map(([y, r]) => ring(at(a, x, y, z), X, Z, r * 1.15, r, a.d.leg, Math.PI / a.d.leg)));
}

function drawLegLower(m: MeshBuilder, a: Drawn, l: Leg): void {
  const { s } = a;
  const [x, z] = [legX(s, l), legZ(s, l)];
  const [, rKnee, rCannon, rFoot] = s.legs.r;
  const { knee } = s.legs;
  const r = (y: number, rr: number) => ring(at(a, x, y, z), X, Z, rr * 1.05, rr, a.d.leg, Math.PI / a.d.leg);
  const lowerMat = a.mat("Lower");
  if (s.foot === "padded") {
    // a column down to a broad round sole
    skin(m, a.mat("Coat"), [r(knee + 0.02, rKnee), r(knee * 0.45, rCannon), r(knee * 0.18, rFoot * 0.95)], { start: false, end: false });
    skin(m, a.mat("Foot"), [r(knee * 0.18, rFoot * 0.95), r(0.0, rFoot)], { start: false });
    return;
  }
  const fet = 0.3 * knee / 0.55;
  skin(m, lowerMat, [r(knee + 0.02, rKnee), r(knee * 0.76, rCannon), r(fet, rCannon * 1.05)], { start: false, end: false });
  if (a.d.fine && s.species === "horse") {
    // the Clydesdale's feather flaring over the hoof
    skin(m, lowerMat, [r(fet + 0.06, rCannon * 1.15), r(0.24, rCannon * 1.6), r(0.12, rFoot * 1.2), r(0.075, rFoot * 1.25)]);
  } else {
    skin(m, lowerMat, [r(fet, rCannon * 1.05), r(0.1 * knee / 0.55, rFoot * 0.8)], { start: false, end: false });
  }
  skin(m, a.mat("Foot"), [r(0.1 * knee / 0.55, rFoot * 0.82), r(0.0, rFoot)]);
  if (s.foot === "cloven" && a.d.fine) block(m, "eye", a.ox + x + rFoot * 0.6, a.ox + x + rFoot * 1.02, 0.0, 0.05, a.oz + z - 0.008, a.oz + z + 0.008);
}

function drawTail(m: MeshBuilder, a: Drawn): void {
  const { s } = a;
  const [rx, ry] = s.tail.root;
  const [tx, ty] = s.tail.tip;
  if (!s.tail.tuft) {
    const st: Array<[number, number, number]> = [[0, 0.75, 0.85], [0.2, 1, 1], [0.55, 1.05, 0.9], [0.85, 0.8, 0.6], [1, 0.25, 0.25]];
    skin(m, a.mat("Mane"), st.map(([t, kw, kh]) => ring(at(a, rx + (tx - rx) * t - 0.08 * Math.sin(Math.PI * t), ry + (ty - ry) * t, 0), Z, X, s.tail.r * kw, s.tail.r * kh * 1.1, 6)));
    return;
  }
  m.rod(a.mat("Coat"), at(a, rx, ry, 0), at(a, tx, ty + 0.12, 0), s.tail.r, 5);
  skin(m, a.mat("Mane"), [ring(at(a, tx, ty + 0.16, 0), Z, X, s.tail.r * 1.2, s.tail.r * 1.2, 5), ring(at(a, tx, ty, 0), Z, X, s.tail.r * 2, s.tail.r * 2, 5), ring(at(a, tx, ty - 0.08, 0), Z, X, s.tail.r * 0.8, s.tail.r * 0.8, 5)]);
}

/** The neck, head, ears, the species' features (horns, trunk, tusks) and the bridle. */
function drawHead(m: MeshBuilder, a: Drawn): void {
  const { s } = a;
  m.scope("neck", () => {
    tubeOf(m, a, a.mat("Coat"), s.neck, a.d.neck);
    if (s.mane !== "none") {
      const pts = s.neck.map(([x, y]) => at(a, x, y, 0));
      const mane = s.neck.map(([, , w, h], i) => {
        const { up } = frameAt(pts, i);
        const hgt = s.mane === "upright" ? 0.07 : 0.05;
        return ring(add(pts[i]!, mul(up, h * 0.92)), Z, up, s.mane === "upright" ? Math.min(0.03, w * 0.2) : 0.05, hgt, 5);
      });
      skin(m, a.mat("Mane"), mane);
    }
  });
  m.scope("head", () => {
    const head = s.head;
    tubeOf(m, a, a.mat("Coat"), head.slice(0, head.length - 1), a.d.neck, { end: false });
    tubeOf(m, a, a.mat("Muzzle"), head.slice(head.length - 2), a.d.neck, { start: false });
    const pts = head.map(([x, y]) => at(a, x, y, 0));
    const poll = pts[0]!;
    const { up } = frameAt(pts, 1);
    // the eyes
    if (a.d.fine) {
      const [ex, ey, ew] = [head[1]![0], head[1]![1], head[1]![2]];
      for (const sd of [-1, 1]) m.rod("eye", at(a, ex, ey + 0.02, sd * (ew - 0.01)), at(a, ex, ey + 0.02, sd * (ew + 0.012)), Math.max(0.018, ew * 0.18), 6);
      if (s.colors.blaze) {
        const [x1, y1] = [head[1]![0], head[1]![1]];
        const [x2, y2] = [head[3]![0], head[3]![1]];
        const n = up;
        const w = head[2]![2] * 0.35;
        const c1 = add(at(a, x1, y1, 0), mul(n, head[1]![3] * 0.98));
        const c2 = add(at(a, x2, y2, 0), mul(n, head[3]![3] * 0.98));
        m.slab(a.mat("Blaze"), [add(c1, [0, 0, -w]), add(c1, [0, 0, w]), add(c2, [0, 0, w * 0.6]), add(c2, [0, 0, -w * 0.6])].map((p) => add(p, mul(n, 0.006))), mul(n, -0.004));
      }
    }
    // the ears
    m.scope("ears", () => {
      const { length, width, droop } = s.ears;
      for (const sd of [-1, 1]) {
        if (s.feature === "trunk") {
          // an elephant's ear: a flap against the side of the head
          const [hx, hy, hw] = [head[0]![0], head[0]![1], head[0]![2]];
          const zz = sd * (hw + 0.03);
          const c = at(a, hx - 0.05, hy - 0.1, zz);
          const outline: Vec3[] = [add(c, [0.1, 0.28, 0]), add(c, [-0.28, 0.22, sd * 0.05]), add(c, [-0.36, -0.2, sd * 0.08]), add(c, [-0.12, -0.5, sd * 0.06]), add(c, [0.12, -0.28, 0])];
          m.slab(a.mat("Coat"), outline, [0, 0, -sd * 0.04]);
          continue;
        }
        const base = add(poll, [0, head[0]![3] * 0.7, sd * head[0]![2] * 0.55]);
        const tip = add(base, [-length * 0.25, length * Math.cos(droop * 1.3), sd * length * (0.25 + Math.sin(droop * 1.3))]);
        skin(m, a.mat("Coat"), [ring(base, X, Z, width, width * 1.25, 5), ring(add(base, mul(sub(tip, base), 0.6)), X, Z, width * 0.8, width, 5), ring(tip, X, Z, width * 0.15, width * 0.18, 5)]);
      }
    });
    if (s.feature === "horns") {
      m.scope("horns", () => {
        for (const sd of [-1, 1]) {
          const b = add(poll, [0.02, head[0]![3] * 0.6, sd * head[0]![2] * 0.8]);
          rods(m, "horn", [b, add(b, [0.0, 0.05, sd * 0.13]), add(b, [0.05, 0.15, sd * 0.2])], 0.025, 5);
        }
      });
    }
    if (s.feature === "trunk") {
      m.scope("trunk", () => {
        const last = head[head.length - 1]!;
        const st: Station[] = [[last[0], last[1], last[2], last[3]], [last[0] + 0.06, last[1] - 0.4, 0.11, 0.12], [last[0] + 0.05, last[1] - 0.9, 0.085, 0.09], [last[0] + 0.12, last[1] - 1.3, 0.065, 0.07], [last[0] + 0.24, last[1] - 1.48, 0.05, 0.055]];
        tubeOf(m, a, a.mat("Coat"), st, a.d.neck);
        for (const sd of [-1, 1]) {
          const t0 = at(a, head[3]![0] - 0.02, head[3]![1] - 0.05, sd * 0.12);
          rods(m, "tusk", [t0, add(t0, [0.12, -0.22, sd * 0.02]), add(t0, [0.28, -0.3, sd * 0.03])], 0.035, 6);
        }
      });
    }
    // the bridle (halter for the cow): head band, noseband, the reins' rings
    if (s.harness !== "breastband" || s.species === "camel") {
      m.scope("bridle", () => {
        const band = (i: number, k: number) => {
          const [x, y, w, h] = head[i]!;
          const c = at(a, x, y, 0);
          const { d, up: u } = frameAt(pts, i);
          skin(m, "harness", [ring(add(c, mul(d, -0.02)), Z, u, w * k, h * k, a.d.neck, Math.PI / a.d.neck), ring(add(c, mul(d, 0.02)), Z, u, w * k, h * k, a.d.neck, Math.PI / a.d.neck)], { start: false, end: false });
        };
        band(1, 1.08);
        band(head.length - 2, 1.14);
        if (s.harness === "collar" && a.d.fine) {
          // the blinkers
          for (const sd of [-1, 1]) {
            const b = at(a, head[1]![0] + 0.03, head[1]![1] + 0.04, sd * (head[1]![2] + 0.03));
            m.slab("harness", [add(b, [0.07, 0.07, 0]), add(b, [0.08, -0.06, 0]), add(b, [-0.06, -0.06, 0]), add(b, [-0.07, 0.07, 0])], [0, 0, -sd * 0.012]);
          }
        }
      });
    }
  });
}

/** The harness on the body: the collar and hames, back pad and girth, breeching (equines); a breast band, saddle pad and girth (camel, elephant). The cow's yoke is the team's. */
function drawHarness(m: MeshBuilder, a: Drawn): void {
  const { s } = a;
  m.scope("harness", () => {
    const [nx, ny, nw, nh] = s.neck[0]!;
    const n1 = s.neck[1]!;
    const pts = [at(a, nx, ny, 0), at(a, n1[0], n1[1], 0)];
    const d = norm(sub(pts[1]!, pts[0]!));
    const up: Vec3 = [-d[1], d[0], 0];
    const girth = (x: number, k: number) => { const [yc, w, hh] = barrelAt(s, x); return ring(at(a, x, yc, 0), Z, Y, w * k, hh * k, a.d.barrel); };
    if (s.harness === "collar") {
      const c = add(pts[0]!, mul(sub(pts[1]!, pts[0]!), 0.3));
      const rings = [[-0.08, 1.02], [-0.02, 1.32], [0.04, 1.3], [0.09, 1.02]].map(([o, k]) => ring(add(c, mul(d, o! * (nh / 0.38))), Z, up, nw * k!, nh * k!, a.d.neck, Math.PI / 2));
      skin(m, "collar", rings, { start: false, end: false });
      for (const sd of [-1, 1]) {
        const hp = [1.05, 0.5, -0.1, -0.6].map((t): Vec3 => add(add(c, mul(d, 0.08 * (nh / 0.38))), add(mul(Z, sd * nw * 1.32 * Math.cos(t)), mul(up, nh * 1.25 * Math.sin(t)))));
        rods(m, "hames", hp, 0.02 * (nh / 0.38) + 0.006, 4);
      }
      const bx = 0.3 * (s.legs.top / 1.08);
      skin(m, "harness", [girth(bx - 0.05, 1.04), girth(bx + 0.05, 1.04)], { start: false, end: false });
      const [yc, , hh] = barrelAt(s, bx);
      block(m, "harness", a.ox + bx - 0.13, a.ox + bx + 0.13, yc + hh - 0.05, yc + hh + 0.05, a.oz - 0.18, a.oz + 0.18);
      // the breeching round the quarters
      const yb = barrelAt(s, -0.6 * (s.legs.top / 1.08))[0] - 0.05;
      const xs = [-0.45, -0.62, -0.8, -0.92].map((v) => v * (s.legs.top / 1.08));
      const side1 = xs.map((x): Vec3 => { const [yc2, w, h] = barrelAt(s, x); const k = Math.sqrt(Math.max(0, 1 - ((yb - yc2) / h) ** 2)); return at(a, x, yb, w * k + 0.02); });
      rods(m, "harness", [...side1, ...[...side1].reverse().map(([x, y, z]): Vec3 => [x, y, 2 * a.oz - z])], 0.026, 4);
    } else if (s.harness === "breastband") {
      const xc = s.barrel[s.barrel.length - 2]![0];
      const [yc, w] = barrelAt(s, xc);
      const band: Vec3[] = [-1, -0.6, 0, 0.6, 1].map((t) => at(a, xc + 0.05 + 0.12 * (1 - t * t), yc - 0.05, t * (w + 0.03)));
      rods(m, "harness", band, 0.035, 4);
      skin(m, "harness", [girth(0.0, 1.04), girth(0.12, 1.04)], { start: false, end: false });
      // the saddle pad (on the camel behind its hump)
      const px = s.feature === "hump" ? 0.48 : 0.1;
      const [py, pw, ph] = barrelAt(s, px);
      block(m, "pad", a.ox + px - 0.3, a.ox + px + 0.3, py + ph * 0.55, py + ph + 0.05 + (s.feature === "hump" ? -0.05 : 0), a.oz - pw * 0.9, a.oz + pw * 0.9);
    }
  });
}

/**
 * One animal at (ox, oz): the body a moving part (pivot at its middle), the head and
 * tail its children, each leg's upper part pivoted at the shoulder or hip with the
 * lower part a child pivoted at the knee or hock.
 */
export function drawAnimal(m: MeshBuilder, species: Species, prefix: string, ox: number, oz: number, d: Detail = FULL, harness = true): void {
  const s = SPECIES_SPECS[species];
  const a: Drawn = { s, ox, oz, d, mat: (k) => `${species}${k}` };
  const [bodyX, bodyY] = [0, s.legs.top + 0.15 * (s.legs.top / 1.08)];
  const neck0 = s.neck[0]!;
  m.spin(prefix, pivot(at(a, bodyX, bodyY, 0)), () => {
    drawBarrel(m, a);
    if (harness) drawHarness(m, a);
    m.spin(`${prefix}-head`, pivot(at(a, neck0[0] + 0.06, neck0[1] + 0.04, 0)), () => drawHead(m, a));
    m.spin(`${prefix}-tail`, pivot(at(a, s.tail.root[0], s.tail.root[1], 0)), () => drawTail(m, a));
    m.scope("legs", () => {
      for (const l of LEGS) {
        m.spin(`${prefix}-leg-${l}`, pivot(at(a, legX(s, l), s.legs.top, legZ(s, l))), () => {
          drawLegUpper(m, a, l);
          m.spin(`${prefix}-shin-${l}`, pivot(at(a, legX(s, l), s.legs.knee, legZ(s, l))), () => drawLegLower(m, a, l));
        });
      }
    });
  });
}

const pivot = (p: Vec3): Vec3 => [r3(p[0]), r3(p[1]), r3(p[2])];

/** Where an animal's body pivot stands (animal coordinates): its middle at the body's height. */
export function bodyPivot(species: Species): Vec3 {
  const s = SPECIES_SPECS[species];
  return [0, r3(s.legs.top + 0.15 * (s.legs.top / 1.08)), 0];
}

// ---------------------------------------------------------------------------
// the gait

/** The clip every animal-drawn vehicle's team walks: played by the distance travelled, like the rolling wheels. */
export const GAIT_CLIP = "gait";
/** Samples per stride (plus the closing one). */
export const GAIT_SAMPLES = 24;

/** Each leg's phase in the stride by gait: diagonal pairs (trot), lateral pairs (pace), a four-beat walk. */
const PHASES: Record<Gait, Record<Leg, number>> = {
  trot: { "front-left": 0, "hind-right": 0, "front-right": 0.5, "hind-left": 0.5 },
  pace: { "front-left": 0, "hind-left": 0, "front-right": 0.5, "hind-right": 0.5 },
  walk: { "hind-left": 0, "front-left": 0.25, "hind-right": 0.5, "front-right": 0.75 },
};

/** A leg at its own phase u: planted for the duty share (sliding back under the body), then swung forward with the knee folded. */
function legPose(s: SpeciesSpec, u: number, fold: number): { swing: number; knee: number } {
  const len = s.legs.top;
  const half = (s.stride * s.duty) / 2;
  const max = Math.asin(Math.min(0.95, half / len));
  if (u < s.duty) return { swing: Math.asin(Math.max(-0.95, Math.min(0.95, (half * (1 - (2 * u) / s.duty)) / len))), knee: 0 };
  const t = (u - s.duty) / (1 - s.duty);
  return { swing: -max * Math.cos(Math.PI * t), knee: -fold * Math.sin(Math.PI * t) };
}

export interface GaitPose {
  lift: number;
  nod: number;
  tail: number;
  legs: Record<Leg, { swing: number; knee: number }>;
}

/**
 * The lower leg's outline near the ground, as (height over the sole, radius along x):
 * the sole, and the widest ring above it (the hoof's top, or a Clydesdale's feather),
 * so a tilted foot's front or back edge is found as well as its centre.
 */
function footOutline(s: SpeciesSpec): Array<[number, number]> {
  const rFoot = s.legs.r[3];
  const k = s.legs.knee / 0.55;
  const out: Array<[number, number]> = [[0, rFoot * 1.05]];
  if (s.foot === "padded") out.push([s.legs.knee * 0.18, rFoot * 0.95 * 1.05]);
  else out.push([0.1 * k, rFoot * 0.82 * 1.05]);
  if (s.species === "horse") out.push([0.075, rFoot * 1.25 * 1.05], [0.12, rFoot * 1.2 * 1.05]);
  return out;
}

/** The lowest point of any lower leg over the ground for a pose, before the body's lift. */
function lowestFoot(s: SpeciesSpec, p: GaitPose): number {
  const { top, knee } = s.legs;
  const outline = footOutline(s);
  let low = Infinity;
  for (const l of LEGS) {
    const { swing, knee: k } = p.legs[l];
    const ky = (knee - top) * Math.cos(swing);
    const t = swing + k;
    for (const [h, rx] of outline) {
      for (const sx of [-rx, rx]) low = Math.min(low, top + ky + sx * Math.sin(t) - (knee - h) * Math.cos(t));
    }
  }
  return low;
}

/** The animal at a phase of its stride, 0..1: the legs, a nod, the tail's swish, the body lifted so the planted feet stand on the ground. */
export function gaitPose(species: Species, phase: number): GaitPose {
  const s = SPECIES_SPECS[species];
  const fold = s.foot === "padded" ? 0.45 : 1.1;
  const legs = Object.fromEntries(LEGS.map((l) => [l, legPose(s, (phase + PHASES[s.gait][l]) % 1, l.startsWith("front") ? fold * 1.1 : fold * 0.85)])) as GaitPose["legs"];
  const beats = s.gait === "walk" ? 1 : 2;
  const p: GaitPose = { lift: 0, nod: 0.04 * Math.sin(beats * TAU * phase + 0.6), tail: 0.1 * Math.sin(TAU * phase), legs };
  return { ...p, lift: -lowestFoot(s, p) };
}

/** A deterministic spread of the team's phases: a pair steps out of step, each row a little behind the one ahead. */
export function teamPhase(index: number, z: number): number {
  return ((z > 0 ? 0.5 : 0) + index * 0.137) % 1;
}

const quat = (q: Quat): number[] => q.map(r6);

/**
 * The team's gait clip: every animal's legs, nod and tail through one stride,
 * played by the distance travelled; `parentPivot` is the pivot of the part the
 * animals are drawn in (the team's section), as their body tracks translate within it.
 */
export function addGait(m: MeshBuilder, species: Species, animals: ReadonlyArray<{ prefix: string; x: number; z: number; phase: number }>, parentPivot: Vec3): void {
  const s = SPECIES_SPECS[species];
  const duration = s.stride / ROLLING_SPEED;
  const times = Array.from({ length: GAIT_SAMPLES + 1 }, (_, k) => r9((k * duration) / GAIT_SAMPLES));
  const body = bodyPivot(species);
  const tracks = animals.flatMap(({ prefix, x, z, phase }) => {
    const poses = Array.from({ length: GAIT_SAMPLES }, (_, k) => gaitPose(species, (k / GAIT_SAMPLES + phase) % 1));
    poses.push(poses[0]!);
    const rot = (f: (p: GaitPose) => Quat) => poses.flatMap((p) => quat(f(p)));
    return [
      { node: prefix, path: "translation" as const, values: poses.flatMap((p) => [r6(x + body[0] - parentPivot[0]), r6(body[1] + p.lift - parentPivot[1]), r6(z - parentPivot[2])]) },
      { node: `${prefix}-head`, path: "rotation" as const, values: rot((p) => qAxis(2, p.nod)) },
      { node: `${prefix}-tail`, path: "rotation" as const, values: rot((p) => qMul(qAxis(1, p.tail), qAxis(2, -0.04 * Math.abs(p.tail) / 0.1))) },
      ...LEGS.flatMap((l) => [
        { node: `${prefix}-leg-${l}`, path: "rotation" as const, values: rot((p) => qAxis(2, p.legs[l].swing)) },
        { node: `${prefix}-shin-${l}`, path: "rotation" as const, values: rot((p) => qAxis(2, p.legs[l].knee)) },
      ]),
    ];
  });
  m.animate({ name: GAIT_CLIP, times, drive: { drive: "distance", speed: ROLLING_SPEED }, tracks });
}

// ---------------------------------------------------------------------------
// the team

export interface TeamOptions {
  species: Species;
  count: number;
  /** The hitch point on the vehicle: the draw hook's pin or the pole's root, model coordinates. */
  hitch: Vec3;
  /** "traces": swingletrees and traces (a rail vehicle, a tram); "pole": a pole between the wheel pair (a road vehicle). */
  draft: "traces" | "pole";
  /** Where the driver holds the reins, if the vehicle has a driver's seat or dash. */
  reins?: Vec3;
  /** Record lone supports under the team (a rail vehicle). */
  supports: boolean;
}

/**
 * The team, drawn in the current part (the team's section): every animal in its
 * place, the draft gear from each row back to the row behind it and the last to the
 * hitch, the reins; returns the animals placed and their prefixes for the clip.
 */
export function drawTeam(m: MeshBuilder, o: TeamOptions): Array<Placed & { prefix: string; phase: number }> {
  const s = SPECIES_SPECS[o.species];
  const placed = placeTeam(o.species, o.count, o.hitch[0]);
  const d = detailFor(o.count);
  const out = placed.map((p) => ({ ...p, prefix: `animal-${p.index + 1}`, phase: teamPhase(p.index, p.z) }));
  m.scope("animals", () => {
    for (const p of out) m.scope(`animal ${p.index + 1}`, () => drawAnimal(m, o.species, p.prefix, p.x, p.z, d));
  });
  const nRows = Math.max(0, ...placed.map((p) => p.row + 1));
  const hy = o.hitch[1];
  /** The draft height at the shoulders, and the point a row is drawn from (behind it) and to (its collars or yoke). */
  const shoulder = s.neck[0]!;
  const drawY = Math.max(hy, shoulder[1] * 0.62);
  m.scope("draft gear", () => {
    for (let r = 0; r < nRows; r++) {
      const row = placed.filter((p) => p.row === r);
      const rx = row[0]!.x;
      const tail = rx + s.barrel[0]![0];
      // what the row pulls on: the next row's gear, or the hitch for the rear row
      const behind: Vec3 = r === nRows - 1 ? o.hitch : [placed.find((p) => p.row === r + 1)!.x + shoulder[0] * 0.3, drawY, 0];
      const barX = tail - 0.25 * (s.legs.top / 1.08);
      if (s.harness === "yoke") {
        // a yoke over the row's necks, bows under them, a chain or pole back
        const yx = rx + shoulder[0] + 0.05;
        const yy = shoulder[1] + shoulder[3] * 0.9;
        const zs = row.map((p) => p.z);
        const half = Math.max(...zs.map(Math.abs)) + 0.32;
        m.rod("yoke", [yx, yy, -half], [yx, yy, half], 0.06, 6);
        for (const z of zs) for (const sd of [-1, 1]) rods(m, "yoke", [[yx, yy, z + sd * 0.2], [yx, yy - shoulder[3] * 1.5, z + sd * 0.24], [yx, yy - shoulder[3] * 2.0, z]], 0.025, 4, false);
        rods(m, o.draft === "pole" && r === nRows - 1 ? "yoke" : "traceIron", [[yx, yy - 0.06, 0], [yx - 0.6, drawY + 0.05, 0], behind], o.draft === "pole" && r === nRows - 1 ? 0.05 : 0.018, 5);
        continue;
      }
      // equines, camels, elephants: a swingletree behind each animal, an evener for a pair, traces to the collar or breast band
      const ys = drawY;
      for (const p of row) {
        m.rod("yoke", [barX, ys, p.z - s.pairWidth * 0.3], [barX, ys, p.z + s.pairWidth * 0.3], 0.03, 6);
        const nx = p.x + shoulder[0];
        for (const sd of [-1, 1]) {
          const [, w] = barrelAt(s, 0);
          const from: Vec3 = [nx + (s.harness === "breastband" ? 0.1 : 0.02), shoulder[1] - shoulder[3] * 0.25, p.z + sd * (s.harness === "breastband" ? w + 0.03 : shoulder[2] * 1.3)];
          const mid: Vec3 = [p.x + 0.1, ys + 0.05, p.z + sd * (w + 0.06)];
          rods(m, "traceIron", [from, mid, [barX, ys, p.z + sd * s.pairWidth * 0.3]], 0.014, 4);
        }
      }
      const zs = row.map((p) => p.z);
      if (row.length > 1) m.rod("yoke", [barX - 0.15, ys, Math.min(...zs)], [barX - 0.15, ys, Math.max(...zs)], 0.04, 6);
      const pull: Vec3 = [barX - (row.length > 1 ? 0.15 : 0), ys, 0];
      if (row.length > 1) for (const z of zs) m.rod("traceIron", [barX - 0.15, ys, z], [barX, ys, z], 0.018, 4);
      if (o.draft === "pole" && r === nRows - 1 && row.length > 1) {
        // the pole from the hitch between the wheel pair up to their collars
        const tip: Vec3 = [row[0]!.x + shoulder[0] + 0.25, shoulder[1] - 0.05, 0];
        m.rod("yoke", o.hitch, tip, 0.05, 6);
        for (const p of row) m.rod("harness", tip, [p.x + shoulder[0], shoulder[1] - 0.08, p.z * 0.75], 0.016, 4);
      }
      rods(m, "traceIron", [pull, behind], 0.02, 4);
    }
    // the reins from the leaders' heads back to the driver
    if (o.reins) {
      const lead = placed.filter((p) => p.row === 0);
      const mid = s.head[1]!;
      for (const p of lead) rods(m, "harness", [[p.x + mid[0], mid[1] - 0.05, p.z], [p.x + s.neck[0]![0], s.neck[0]![1] + s.neck[0]![3], p.z], o.reins], 0.01, 4);
    }
  });
  if (o.supports) {
    // the team stands on the track under its leaders' forelegs and its rear row's hind legs
    const front = Math.max(...placed.map((p) => p.x)) + s.legs.front;
    const rear = Math.min(...placed.map((p) => p.x)) + s.legs.hind;
    m.axleAt(r3(rear), 0);
    m.axleAt(r3(front), 0);
  }
  return out;
}

/** The team's distant model: each animal as two side boxes (body and legs, neck and head), drawn about z. */
export function teamLod(m: MeshBuilder, species: Species, count: number, hitchX: number): void {
  const s = SPECIES_SPECS[species];
  const coat = `${species}Coat`;
  for (const p of placeTeam(species, count, hitchX)) {
    const [b0, b1] = [s.barrel[0]!, s.barrel[s.barrel.length - 1]!];
    const top = Math.max(...s.barrel.map(([, y, , h]) => y + h));
    const belly = Math.min(...s.barrel.map(([, y, , h]) => y - h));
    const w = Math.max(...s.barrel.map(([, , w2]) => w2));
    const x0 = p.x + b0[0];
    const x1 = p.x + b1[0];
    lodSideBox(m, coat, [[x0, 0], [x1, 0], [x1, top], [x0, top]], p.z - w * 0.8, p.z + w * 0.8);
    const h = s.head[s.head.length - 1]!;
    const n0 = s.neck[0]!;
    const peak = Math.max(...s.head.map(([, y, , hh]) => y + hh), ...s.neck.map(([, y, , hh]) => y + hh));
    lodSideBox(m, coat, [[p.x + n0[0], belly + 0.2], [p.x + h[0] + h[2], h[1] - h[3]], [p.x + h[0] + h[2], peak], [p.x + n0[0], peak]], p.z - w * 0.4, p.z + w * 0.4);
  }
}
