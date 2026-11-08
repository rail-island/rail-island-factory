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
  /**
   * The legs: shoulder and hip x, half track, the root height (`top`), the front knee's,
   * the hind joint's (`hock`, a true knee on the elephant) and the fetlock's heights; radii
   * (upper top, knee, cannon, foot); each leg's joints' x offsets from its root (knee or
   * hock, fetlock, the sole's centre); and which way the hind joint folds in the swing
   * (+1 a hock, the foot forward; -1 a knee, the foot back).
   */
  legs: {
    front: number; hind: number; z: number; top: number; knee: number; hock: number; fetlock: number;
    r: readonly [number, number, number, number];
    fore: readonly [number, number, number]; rear: readonly [number, number, number];
    hindFold: 1 | -1;
  };
  /** Where the tail hangs from and its tip, and whether it ends in a tuft. */
  tail: { root: readonly [number, number]; tip: readonly [number, number]; r: number; tuft: boolean };
  ears: { length: number; width: number; droop: number };
  /**
   * The face: the eye's place along the head (0 the poll, 1 the muzzle) and above its
   * axis (a share of the half height), its radius; the nose (an equine's nostrils, a
   * bovine's broad pad, a camel's slits and split lip, an elephant's trunk); a forelock.
   */
  face: { eye: number; eyeUp: number; eyeR: number; nose: "equine" | "bovine" | "camel" | "trunk"; forelock?: boolean };
  colors: { coat: string; mane: string; muzzle: string; foot: string; lower?: string; blaze?: string; lid?: string; inner?: string; nose?: string };
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
  [-1.0, 1.36, 0.07, 0.08], [-0.95, 1.34, 0.2, 0.24], [-0.82, 1.31, 0.3, 0.33], [-0.62, 1.28, 0.35, 0.37], [-0.35, 1.25, 0.35, 0.38],
  [0.0, 1.23, 0.37, 0.41], [0.35, 1.26, 0.35, 0.41], [0.62, 1.31, 0.3, 0.39], [0.82, 1.27, 0.22, 0.3], [0.93, 1.22, 0.1, 0.14],
];
const HORSE_NECK: readonly Station[] = [[0.6, 1.42, 0.25, 0.38], [0.775, 1.61, 0.2, 0.3], [0.95, 1.81, 0.16, 0.23], [1.08, 1.97, 0.13, 0.17]];
const HORSE_HEAD: readonly Station[] = [
  [1.04, 2.05, 0.1, 0.12], [1.1, 1.97, 0.125, 0.16], [1.19, 1.85, 0.12, 0.165], [1.3, 1.71, 0.1, 0.13], [1.42, 1.56, 0.088, 0.105], [1.51, 1.45, 0.085, 0.095], [1.56, 1.39, 0.07, 0.075],
];

/** An equine's stations scaled from the Clydesdale's: `k` overall, `w` across. */
const scaled = (st: readonly Station[], k: number, w = 1): Station[] => st.map(([x, y, a, b]) => [x * k, y * k, a * k * w, b * k] as const);

const equine = (k: number, w: number, head = 1) => ({
  barrel: scaled(HORSE_BARREL, k, w), neck: scaled(HORSE_NECK, k, w),
  // a donkey's or a mule's head is bigger for its body than a horse's: grown about the poll
  head: scaled(HORSE_HEAD, k, w).map(([x, y, a, b]): Station => [HORSE_HEAD[0]![0] * k + (x - HORSE_HEAD[0]![0] * k) * head, HORSE_HEAD[0]![1] * k + (y - HORSE_HEAD[0]![1] * k) * head, a * head, b * head]),
  legs: {
    front: 0.52 * k, hind: -0.64 * k, z: 0.19 * k * w, top: 1.08 * k, knee: 0.55 * k, hock: 0.64 * k, fetlock: 0.2 * k,
    r: [0.13 * k * w, 0.068 * k, 0.05 * k, 0.085 * k] as const,
    fore: [0.0, 0.01 * k, 0.06 * k] as const, rear: [-0.14 * k, -0.11 * k, -0.06 * k] as const, hindFold: 1 as const,
  },
  tail: { root: [-0.97 * k, 1.5 * k] as const, tip: [-1.08 * k, 0.66 * k] as const, r: 0.08 * k, tuft: false },
});

export const SPECIES_SPECS: Readonly<Record<Species, SpeciesSpec>> = {
  horse: {
    species: "horse", title: "Draft Horse", ...equine(1, 1),
    ears: { length: 0.16, width: 0.045, droop: 0 },
    face: { eye: 0.24, eyeUp: 0.42, eyeR: 0.042, nose: "equine", forelock: true },
    colors: { coat: "#5a2c19", mane: "#1c1411", muzzle: "#d7b3a3", foot: "#3a322d", lower: "#ece5d8", blaze: "#ece5d8", inner: "#2a1710", nose: "#3a2420" },
    mane: "flowing", harness: "collar", foot: "hoof", gait: "trot", stride: 2.4, duty: 0.42,
    pairWidth: 0.92, rowLength: 3.1, counts: [1, 2, 4, 6], abreast: true,
    pace: 12, power: 6, weight: 0.8, size: 0.55,
  },
  donkey: {
    species: "donkey", title: "Donkey",
    ...equine(0.64, 0.92, 1.18),
    tail: { root: [-0.62, 0.95], tip: [-0.68, 0.45], r: 0.035, tuft: true },
    ears: { length: 0.28, width: 0.06, droop: 0.15 },
    face: { eye: 0.26, eyeUp: 0.42, eyeR: 0.034, nose: "equine" },
    colors: { coat: "#7d7570", mane: "#3b3532", muzzle: "#e4ddd3", foot: "#33302d", lid: "#d9d2c8", inner: "#e9e2d8", nose: "#2f2a27" },
    mane: "upright", harness: "collar", foot: "hoof", gait: "trot", stride: 1.5, duty: 0.45,
    pairWidth: 0.62, rowLength: 2.1, counts: [1, 2, 4, 6], abreast: true,
    pace: 6, power: 2.5, weight: 0.25, size: 0.15,
  },
  mule: {
    species: "mule", title: "Mule",
    ...equine(0.86, 0.94, 1.08),
    tail: { root: [-0.83, 1.29], tip: [-0.92, 0.6], r: 0.06, tuft: false },
    ears: { length: 0.25, width: 0.055, droop: 0.08 },
    face: { eye: 0.25, eyeUp: 0.42, eyeR: 0.038, nose: "equine", forelock: true },
    colors: { coat: "#4a3326", mane: "#231a15", muzzle: "#bfa48f", foot: "#2f2925", lid: "#7a604e", inner: "#b49a86", nose: "#2a1d17" },
    mane: "upright", harness: "collar", foot: "hoof", gait: "trot", stride: 2.0, duty: 0.43,
    pairWidth: 0.82, rowLength: 2.7, counts: [1, 2, 4, 6], abreast: true,
    pace: 9, power: 5, weight: 0.45, size: 0.4,
  },
  cow: {
    species: "cow", title: "Draft Cow",
    barrel: [[-0.98, 1.12, 0.12, 0.14], [-0.92, 1.1, 0.3, 0.33], [-0.7, 1.07, 0.36, 0.4], [-0.3, 1.04, 0.38, 0.43], [0.15, 1.03, 0.39, 0.45], [0.55, 1.07, 0.34, 0.43], [0.8, 1.1, 0.27, 0.36], [0.92, 1.06, 0.14, 0.22]],
    neck: [[0.7, 1.15, 0.24, 0.33], [0.92, 1.19, 0.2, 0.28], [1.08, 1.24, 0.16, 0.22]],
    head: [[1.07, 1.41, 0.16, 0.1], [1.12, 1.35, 0.19, 0.14], [1.18, 1.25, 0.18, 0.14], [1.24, 1.14, 0.155, 0.12], [1.29, 1.06, 0.145, 0.1], [1.32, 1.01, 0.15, 0.09], [1.34, 0.98, 0.145, 0.074]],
    legs: {
      front: 0.6, hind: -0.66, z: 0.21, top: 0.86, knee: 0.42, hock: 0.5, fetlock: 0.13, r: [0.16, 0.085, 0.065, 0.085],
      fore: [0.0, 0.0, 0.04], rear: [-0.12, -0.09, -0.05], hindFold: 1,
    },
    tail: { root: [-0.97, 1.3], tip: [-1.0, 0.45], r: 0.03, tuft: true },
    ears: { length: 0.16, width: 0.065, droop: 1.05 },
    face: { eye: 0.24, eyeUp: 0.3, eyeR: 0.038, nose: "bovine" },
    colors: { coat: "#8c5a32", mane: "#6e4524", muzzle: "#d8b6a0", foot: "#2b2522", lid: "#6e4524", inner: "#d8b6a0", nose: "#c98f86" },
    mane: "none", feature: "horns", harness: "yoke", foot: "cloven", gait: "walk", stride: 1.3, duty: 0.65,
    pairWidth: 1.05, rowLength: 2.9, counts: [1, 2, 4, 6], abreast: true,
    pace: 4, power: 3.5, weight: 0.6, size: 0.6,
  },
  camel: {
    species: "camel", title: "Camel",
    barrel: [[-0.82, 1.62, 0.08, 0.1], [-0.76, 1.6, 0.22, 0.26], [-0.5, 1.6, 0.28, 0.32], [-0.1, 1.62, 0.3, 0.36], [0.3, 1.62, 0.28, 0.36], [0.6, 1.58, 0.22, 0.32], [0.76, 1.52, 0.12, 0.2]],
    neck: [[0.62, 1.62, 0.15, 0.2], [0.98, 1.38, 0.1, 0.13], [1.28, 1.42, 0.09, 0.11], [1.44, 1.78, 0.08, 0.1], [1.46, 2.19, 0.075, 0.085]],
    head: [[1.37, 2.21, 0.08, 0.085], [1.49, 2.21, 0.105, 0.115], [1.6, 2.17, 0.092, 0.1], [1.72, 2.1, 0.072, 0.08], [1.83, 2.04, 0.07, 0.077], [1.9, 2.01, 0.07, 0.072], [1.95, 1.99, 0.058, 0.058]],
    legs: {
      front: 0.5, hind: -0.55, z: 0.2, top: 1.42, knee: 0.72, hock: 0.8, fetlock: 0.2, r: [0.11, 0.062, 0.042, 0.1],
      fore: [0.02, 0.0, 0.07], rear: [-0.12, -0.07, -0.02], hindFold: 1,
    },
    tail: { root: [-0.8, 1.66], tip: [-0.86, 1.05], r: 0.03, tuft: true },
    ears: { length: 0.08, width: 0.04, droop: 0.4 },
    face: { eye: 0.22, eyeUp: 0.38, eyeR: 0.034, nose: "camel" },
    colors: { coat: "#c49a62", mane: "#9c7646", muzzle: "#b58b56", foot: "#6e5536", lid: "#8a6a40", inner: "#7d5f3a", nose: "#3a2a1a" },
    mane: "none", feature: "hump", harness: "breastband", foot: "padded", gait: "pace", stride: 2.6, duty: 0.48,
    pairWidth: 1.0, rowLength: 3.4, counts: [1, 2, 3], abreast: false,
    pace: 8, power: 4.5, weight: 0.5, size: 0.7,
  },
  elephant: {
    species: "elephant", title: "Elephant",
    barrel: [[-1.25, 2.0, 0.2, 0.25], [-1.18, 1.98, 0.55, 0.62], [-0.9, 2.02, 0.72, 0.82], [-0.4, 2.08, 0.78, 0.88], [0.2, 2.08, 0.78, 0.9], [0.7, 2.1, 0.7, 0.86], [1.0, 2.1, 0.5, 0.7], [1.12, 2.08, 0.3, 0.45]],
    neck: [[1.0, 2.2, 0.45, 0.6], [1.25, 2.3, 0.4, 0.55]],
    head: [[1.18, 2.58, 0.4, 0.42], [1.38, 2.55, 0.45, 0.5], [1.58, 2.38, 0.4, 0.45], [1.74, 2.12, 0.27, 0.3], [1.82, 1.9, 0.17, 0.17], [1.85, 1.75, 0.13, 0.13]],
    legs: {
      front: 0.72, hind: -0.82, z: 0.42, top: 1.7, knee: 0.75, hock: 1.0, fetlock: 0.26, r: [0.3, 0.22, 0.2, 0.25],
      fore: [0.02, 0.03, 0.04], rear: [0.07, 0.0, 0.0], hindFold: -1,
    },
    tail: { root: [-1.25, 2.3], tip: [-1.32, 1.2], r: 0.04, tuft: true },
    ears: { length: 0.7, width: 0.55, droop: 0.2 },
    face: { eye: 0.42, eyeUp: 0.14, eyeR: 0.06, nose: "trunk" },
    colors: { coat: "#7c7671", mane: "#4b4642", muzzle: "#6e6863", foot: "#5a5550", lid: "#5f5955", inner: "#9a8a80", nose: "#b89a8c" },
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

/** A colour darkened by `k` (0..1), for a coat's eyelids where the species names none. */
function darken(hex: string, k: number): string {
  const v = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.round(((v >> s) & 255) * (1 - k)).toString(16).padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

/** The materials an animal and its harness use, by species (`<species>Coat` ...), and the harness's own. */
export function animalPalette(species: readonly Species[] = SPECIES): Record<string, { color: string; roughness: number; metallic?: number }> {
  const out: Record<string, { color: string; roughness: number; metallic?: number }> = {
    harness: { color: "#1b1917", roughness: 0.6 },
    collar: { color: "#3b2a1f", roughness: 0.8 },
    hames: { color: "#c9a440", metallic: 0.5, roughness: 0.35 },
    yoke: { color: "#8a6a43", roughness: 0.8 },
    traceIron: { color: "#2a2b2d", roughness: 0.7 },
    eye: { color: "#120c09", roughness: 0.15 },
    glint: { color: "#f6f3ec", roughness: 0.2 },
    nostril: { color: "#150f0c", roughness: 0.8 },
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
    out[`${sp}Lid`] = { color: c.lid ?? darken(c.coat, 0.35), roughness: 0.8 };
    out[`${sp}Inner`] = { color: c.inner ?? c.muzzle, roughness: 0.85 };
    out[`${sp}Nose`] = { color: c.nose ?? c.muzzle, roughness: 0.55 };
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
  /** Rings between two stations of the barrel, neck and head (1 the stations alone). */
  sub: number;
  /** Sides round an eye, a nostril, a horn. */
  eye: number;
  /** Whether the small things are drawn (the ears' insides, the glint in the eyes, the blaze, the feathering, toenails). */
  fine: boolean;
}
export const FULL: Detail = { barrel: 22, neck: 14, leg: 10, sub: 2, eye: 8, fine: true };
export const LIGHT: Detail = { barrel: 14, neck: 10, leg: 7, sub: 1, eye: 6, fine: false };
export const LIGHTEST: Detail = { barrel: 10, neck: 7, leg: 5, sub: 1, eye: 5, fine: false };

/** The detail an animal of a team of `count` is drawn at. */
export const detailFor = (count: number): Detail => (count <= 2 ? FULL : count <= 4 ? LIGHT : LIGHTEST);

/**
 * The most triangles one animal of a team of `count` may have, its harness included:
 * 5,000 alone or in a pair, and a bigger team's animals never more than 10,000 together
 * (docs/models/draft-animals.md, the animal skill).
 */
export const animalBudget = (count: number): number => (count <= 2 ? 5_000 : Math.floor(10_000 / count));

/** The names of an animal's moving parts, for animal `prefix` (e.g. `animal-1`). */
export const animalNodes = (prefix: string): string[] => [
  prefix, `${prefix}-head`, `${prefix}-tail`, ...LEGS.flatMap((l) => [`${prefix}-leg-${l}`, `${prefix}-shin-${l}`, `${prefix}-foot-${l}`]),
];

interface Drawn { s: SpeciesSpec; ox: number; oz: number; d: Detail; mat: (k: string) => string }
const at = (a: Drawn, x: number, y: number, z: number): Vec3 => [a.ox + x, y, a.oz + z];
/** The head's stations as drawn (smoothed at the detail's rings), where the face's features are placed. */
const hs = (a: Drawn): Station[] => smooth(a.s.head, a.d.sub);

const legZ = (s: SpeciesSpec, l: Leg): number => (l.endsWith("left") ? -s.legs.z : s.legs.z);

type P2 = readonly [number, number];
/** A leg's joints in animal coordinates (x, y): its root at the shoulder or hip, the knee or hock, the fetlock, the sole's centre. */
export interface LegChain { root: P2; joint: P2; fet: P2; sole: P2 }

export function legChain(s: SpeciesSpec, l: Leg | "front" | "hind"): LegChain {
  const front = l.startsWith("front");
  const x = front ? s.legs.front : s.legs.hind;
  const [dj, df, ds] = front ? s.legs.fore : s.legs.rear;
  return { root: [x, s.legs.top], joint: [x + dj, front ? s.legs.knee : s.legs.hock], fet: [x + df, s.legs.fetlock], sole: [x + ds, 0] };
}

const lerp2 = (a: P2, b: P2, t: number): P2 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const dir2 = (a: P2, b: P2): Vec3 => norm([b[0] - a[0], b[1] - a[1], 0]);

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

/** Stations smoothed through a Catmull-Rom spline, `sub` rings to each span; the sizes never below 5 mm. */
export function smooth(st: readonly Station[], sub: number): Station[] {
  if (sub <= 1) return [...st];
  const out: Station[] = [];
  const n = st.length;
  for (let i = 0; i + 1 < n; i++) {
    const [p0, p1, p2, p3] = [st[Math.max(0, i - 1)]!, st[i]!, st[i + 1]!, st[Math.min(n - 1, i + 2)]!];
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      const c = (j: number) => 0.5 * (2 * p1[j]! + (p2[j]! - p0[j]!) * t + (2 * p0[j]! - 5 * p1[j]! + 4 * p2[j]! - p3[j]!) * t * t + (3 * p1[j]! - p0[j]! - 3 * p2[j]! + p3[j]!) * t * t * t);
      out.push([c(0), c(1), Math.max(0.005, c(2)), Math.max(0.005, c(3))]);
    }
  }
  out.push(st[n - 1]!);
  return out;
}

/** A station interpolated along `st` at t (0 the first, 1 the last). */
export function stationAt(st: readonly Station[], t: number): Station {
  const f = Math.min(st.length - 1, Math.max(0, t * (st.length - 1)));
  const i = Math.min(st.length - 2, Math.floor(f));
  const u = f - i;
  const [a, b] = [st[i]!, st[i + 1]!];
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u, a[3] + (b[3] - a[3]) * u];
}

/** The direction of `st`'s axis at t, in the x-y plane, and its upward normal. */
export function axisAt(st: readonly Station[], t: number): { d: Vec3; up: Vec3 } {
  const e = 0.5 / (st.length - 1);
  const [a, b] = [stationAt(st, Math.max(0, t - e)), stationAt(st, Math.min(1, t + e))];
  const d = norm([b[0] - a[0], b[1] - a[1], 0]);
  return { d, up: [-d[1], d[0], 0] };
}

/**
 * A ring like `ring` (u across, v up) whose lower half narrows by `jaw` and upper half
 * by `crest` toward its bottom and top: a head's jaw, a neck's crest, a belly.
 */
function shapedRing(c: Vec3, u: Vec3, v: Vec3, ru: number, rv: number, n: number, rot: number, jaw: number, crest: number): Vec3[] {
  return Array.from({ length: n }, (_, i) => {
    const a = rot + (TAU * i) / n;
    const sn = Math.sin(a);
    const k = 1 - (sn < 0 ? jaw : crest) * Math.abs(sn);
    return add(c, add(mul(u, ru * Math.cos(a) * k), mul(v, rv * sn)));
  });
}

/** A skinned tube along stations (x, y, half width, half height) of animal coordinates. */
function tubeOf(m: MeshBuilder, a: Drawn, mat: string, st: readonly Station[], n: number, caps: { start?: boolean; end?: boolean } = {}, jaw = 0, crest = 0): Vec3[][] {
  const pts = st.map(([x, y]) => at(a, x, y, 0));
  const rings = st.map(([, , w, h], i) => {
    const { up } = frameAt(pts, i);
    return shapedRing(pts[i]!, Z, up, w, h, n, Math.PI / n, jaw, crest);
  });
  skin(m, mat, rings, caps);
  return rings;
}

/** A round tube along a 3-D path, a radius at each point, its rings square to the path (turned about `ref`). */
function tube3(m: MeshBuilder, mat: string, pts: readonly Vec3[], radii: readonly number[], n: number, ref: Vec3 = Z, caps: { start?: boolean; end?: boolean } = {}): void {
  const rings = pts.map((p, i) => {
    const t = norm(sub(pts[Math.min(pts.length - 1, i + 1)]!, pts[Math.max(0, i - 1)]!));
    const u = norm(cross(t, ref));
    const v = cross(u, t);
    return ring(p, u, v, radii[i]!, radii[i]!, n, Math.PI / n);
  });
  skin(m, mat, rings, caps);
}

/** An ellipsoid about `c`: radius r[0] along the unit axis `ax[0]` (its poles), r[1] and r[2] along ax[1] and ax[2]. */
function blob(m: MeshBuilder, mat: string, c: Vec3, ax: readonly [Vec3, Vec3, Vec3], r: readonly [number, number, number], n: number): void {
  const lat = Math.max(3, Math.round(n / 2));
  const rings: Vec3[][] = [];
  for (let i = 1; i < lat; i++) {
    const phi = (Math.PI * i) / lat;
    rings.push(ring(add(c, mul(ax[0], -r[0] * Math.cos(phi))), ax[1], ax[2], r[1] * Math.sin(phi), r[2] * Math.sin(phi), n));
  }
  skin(m, mat, rings);
  // the poles: a cone to each end, not the flat cap
  for (const [k, rr] of [[-1, rings[0]!], [1, rings[rings.length - 1]!]] as const) {
    const pole = add(c, mul(ax[0], k * r[0]));
    const pts: Vec3[] = [];
    const sum: Vec3 = [0, 0, 0];
    for (let i = 0; i < n; i++) triOut(pts, sum, pole, rr[i]!, rr[(i + 1) % n]!, c);
    m.facets(mat, pts, mul(ax[0], k));
  }
}

function drawBarrel(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  m.scope("barrel", () => {
    const st = smooth(s.barrel, d.sub);
    skin(m, a.mat("Coat"), st.map(([x, y, w, h]) => shapedRing(at(a, x, y, 0), Z, Y, w, h, d.barrel, Math.PI / d.barrel, 0.1, s.feature === "trunk" ? 0.05 : 0.12)));
    // the points of the hip and the shoulder blades under the skin of a bony bovine or camel
    if (s.species === "cow") {
      for (const sd of [-1, 1]) {
        const [yc, w, h] = barrelAt(s, -0.7);
        blob(m, a.mat("Coat"), at(a, -0.7, yc + h * 0.62, sd * w * 0.62), [Y, X, Z], [0.07, 0.08, 0.06], d.eye);
      }
    }
  });
  if (s.feature === "hump") {
    m.scope("hump", () => {
      const [yc, , hh] = barrelAt(s, -0.05);
      const top = yc + hh;
      const st: Station[] = [[-0.5, top - 0.12, 0.08, 0.06], [-0.35, top - 0.05, 0.2, 0.16], [-0.05, top + 0.14, 0.24, 0.27], [0.25, top - 0.02, 0.18, 0.15], [0.4, top - 0.12, 0.06, 0.05]];
      skin(m, a.mat("Coat"), smooth(st, d.sub).map(([x, y, w, h]) => shapedRing(at(a, x, y, 0), Z, Y, w, h, d.neck, Math.PI / d.neck, 0, 0.25)));
    });
  }
}

/** A leg ring at p (animal x, y) square to the leg's direction `dr`, `rx` deep fore and aft, `rz` across. */
function legRing(a: Drawn, l: Leg, p: P2, dr: Vec3, rx: number, rz: number): Vec3[] {
  const u: Vec3 = [-dr[1], dr[0], 0];
  return ring(at(a, p[0], p[1], legZ(a.s, l)), u[0] < 0 ? mul(u, -1) : u, Z, rx, rz, a.d.leg, Math.PI / a.d.leg);
}

/** A horizontal ring at height y about x (a hoof's or a sole's). */
function flatRing(a: Drawn, l: Leg, x: number, y: number, rx: number, rz: number): Vec3[] {
  return ring(at(a, x, y, legZ(a.s, l)), X, Z, rx, rz, a.d.leg, Math.PI / a.d.leg);
}

/** The upper leg, from inside the body down to the knee or hock: the forearm or the thigh and gaskin. */
function drawLegUpper(m: MeshBuilder, a: Drawn, l: Leg): void {
  const { s } = a;
  const c = legChain(s, l);
  const dr = dir2(c.root, c.joint);
  const [rTop, rKnee] = s.legs.r;
  const hind = l.startsWith("hind");
  const rows: Array<[number, number]> = [
    [-0.32, rTop * (hind ? 1.25 : 1.1)], [0, rTop * (hind ? 1.1 : 1)], [0.3, rTop * (hind ? 0.85 : 0.86)], [0.62, (rTop * 0.7 + rKnee) / 2],
    [0.88, rKnee * 0.95], [1.02, rKnee * 1.04],
  ];
  const kept = a.d.fine ? rows : rows.filter((_, i) => i !== 2 && i !== 4);
  skin(m, a.mat("Coat"), kept.map(([t, r]) => legRing(a, l, lerp2(c.root, c.joint, t), dr, r * 1.22, r)));
}

/** The lower leg from the knee or hock to the fetlock: the joint's knob, the cannon. */
function drawLegLower(m: MeshBuilder, a: Drawn, l: Leg): void {
  const { s } = a;
  const c = legChain(s, l);
  const dr = dir2(c.joint, c.fet);
  const [, rKnee, rCannon] = s.legs.r;
  const elephant = s.species === "elephant";
  const mat = s.foot === "padded" ? a.mat("Coat") : a.mat("Lower");
  const p = (t: number) => lerp2(c.joint, c.fet, t);
  const rows: Array<[number, number, number]> = elephant
    ? [[-0.12, rKnee * 0.95, 1], [0, rKnee * 1.05, 1.1], [0.35, (rKnee + rCannon) / 2, 1.05], [0.8, rCannon, 1], [1.06, rCannon * 0.98, 1]]
    : [[-0.14, rKnee * 0.92, 1.1], [0, rKnee * 1.08, 1.25], [0.12, rKnee * 0.95, 1.2], [0.3, rCannon * 1.05, 1.15], [0.75, rCannon, 1.1], [1.04, rCannon * 1.04, 1.1]];
  const kept = a.d.fine ? rows : rows.filter((_, i) => i !== 2 && (elephant || i !== 4));
  skin(m, mat, kept.map(([t, r, k]) => legRing(a, l, p(t), dr, r * k, r)));
  if (s.species === "camel" && l.startsWith("front")) {
    // the bare callus on the camel's knee it kneels on
    const kp = c.joint;
    blob(m, a.mat("Foot"), at(a, kp[0] + rKnee * 0.95, kp[1] - 0.01, legZ(s, l)), [X, Y, Z], [0.03, rKnee * 0.75, rKnee * 0.7], a.d.eye);
  }
}

/** Below the fetlock: the pastern and the hoof (a cloven one with its cleft), a camel's broad pad, an elephant's foot and toenails. */
function drawFoot(m: MeshBuilder, a: Drawn, l: Leg): void {
  const { s, d } = a;
  const c = legChain(s, l);
  const [, , rCannon, rFoot] = s.legs.r;
  const z = legZ(s, l);
  const dr = dir2(c.fet, c.sole);
  if (s.species === "elephant") {
    // a column straight down to a round sole, the toenails round its front
    const rows: Array<[number, number]> = [[c.fet[1] + 0.08, rCannon * 0.98], [c.fet[1] * 0.5, rFoot * 0.97], [0.07, rFoot]];
    skin(m, a.mat("Coat"), rows.map(([y, r]) => flatRing(a, l, c.sole[0], y, r * 1.05, r)), { start: false, end: false });
    skin(m, a.mat("Foot"), [flatRing(a, l, c.sole[0], 0.07, rFoot * 1.05, rFoot), flatRing(a, l, c.sole[0], 0, rFoot * 1.07, rFoot * 1.02)], { start: false });
    const nails = d.fine ? [-0.75, -0.25, 0.25, 0.75] : [-0.4, 0.4];
    for (const ang of nails) {
      const o: Vec3 = [Math.cos(ang), 0, Math.sin(ang)];
      blob(m, "horn", add(at(a, c.sole[0], 0.075, z), mul(o, rFoot * 1.04)), [o, Y, cross(Y, o)], [0.025, 0.055, 0.06], 5);
    }
    return;
  }
  if (s.foot === "padded") {
    // the camel: a slender pastern sloping forward to a broad two-toed pad
    const rows: Array<[number, number]> = [[-0.15, rCannon], [0, rCannon * 1.25], [0.5, rCannon * 0.95]];
    skin(m, a.mat("Coat"), rows.map(([t, r]) => legRing(a, l, lerp2(c.fet, c.sole, t), dr, r * 1.1, r)), { end: false });
    skin(m, a.mat("Coat"), [legRing(a, l, lerp2(c.fet, c.sole, 0.5), dr, rCannon * 1.05, rCannon * 0.95), flatRing(a, l, c.sole[0], 0.07, rFoot * 0.8, rFoot * 0.7), flatRing(a, l, c.sole[0] + 0.01, 0.035, rFoot * 1.3, rFoot * 1.0)], { start: false, end: false });
    skin(m, a.mat("Foot"), [flatRing(a, l, c.sole[0] + 0.01, 0.035, rFoot * 1.3, rFoot * 1.0), flatRing(a, l, c.sole[0] + 0.01, 0, rFoot * 1.25, rFoot * 0.95)], { start: false });
    for (const sd of [-1, 1]) blob(m, "nostril", at(a, c.sole[0] + rFoot * 1.22, 0.03, z + sd * rFoot * 0.35), [X, Y, Z], [0.02, 0.025, 0.03], d.eye);
    return;
  }
  // hooves: the fetlock's knob, the sloping pastern, the hoof from its coronet to the sole
  const k = s.legs.top / 1.08;
  const hoofH = 0.1 * k;
  // where the pastern's line reaches the coronet
  const tc = (c.fet[1] - hoofH) / (c.fet[1] - c.sole[1]);
  const coronet = lerp2(c.fet, c.sole, tc);
  const mat = a.mat("Lower");
  if (d.fine && s.species === "horse") {
    // the Clydesdale's feather flaring over the hoof
    skin(m, mat, [legRing(a, l, lerp2(c.fet, c.sole, -0.2), dr, rCannon * 1.1, rCannon), legRing(a, l, c.fet, dr, rCannon * 1.4, rCannon * 1.3), flatRing(a, l, coronet[0], 0.17 * k, rCannon * 1.75, rCannon * 1.6), flatRing(a, l, coronet[0], 0.11 * k, rFoot * 1.28, rFoot * 1.22), flatRing(a, l, coronet[0] + 0.005, 0.08 * k, rFoot * 1.3, rFoot * 1.25)]);
  } else {
    const rows: Array<[number, number, number]> = [[-0.2, rCannon, 1.1], [0, rCannon * 1.22, 1.25], [0.4, rCannon * 0.95, 1.05], [tc + 0.04, rFoot * 0.74, 1]];
    skin(m, mat, (d.fine ? rows : rows.filter((_, i) => i !== 2)).map(([t, r, kx]) => legRing(a, l, lerp2(c.fet, c.sole, t), dr, r * kx, r)), { end: false });
  }
  // the hoof: a sloping cone from the coronet to the sole, the toe ahead
  const hoof = [flatRing(a, l, coronet[0], hoofH, rFoot * 0.8, rFoot * 0.78), flatRing(a, l, c.sole[0] + 0.012 * k, hoofH * 0.4, rFoot * 0.98, rFoot * 0.92), flatRing(a, l, c.sole[0] + 0.015 * k, 0, rFoot * 1.05, rFoot * 0.95)];
  skin(m, a.mat("Foot"), d.fine ? hoof : [hoof[0]!, hoof[2]!]);
  if (s.foot === "cloven") {
    // the cleft between the two claws, at the toe
    const x0 = c.sole[0] + 0.015 * k;
    block(m, "nostril", a.ox + x0 + rFoot * 0.55, a.ox + x0 + rFoot * 1.08, 0.0, hoofH * 0.85, a.oz + z - 0.008, a.oz + z + 0.008);
  }
}

/** The tail: a hair tail hanging from its dock, or a thin tail ending in a tuft. */
function drawTail(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  const [rx, ry] = s.tail.root;
  const [tx, ty] = s.tail.tip;
  const n = Math.max(5, d.eye - 1);
  if (!s.tail.tuft) {
    // the dock starts inside the rump, so no face of the hair lies on the coat
    const st: Array<[number, number]> = [[-0.06, 0.7], [0.15, 1.05], [0.4, 1.15], [0.65, 1.0], [0.85, 0.7], [1, 0.25]];
    tube3(m, a.mat("Mane"), st.map(([t]) => at(a, rx + (tx - rx) * t - 0.1 * Math.sin(Math.PI * t) + (t < 0 ? 0.05 : 0), ry + (ty - ry) * t, 0)), st.map(([, k]) => s.tail.r * k), n);
    return;
  }
  const path = [0, 0.3, 0.65, 0.88].map((t): Vec3 => at(a, rx + (tx - rx) * t - 0.04 * Math.sin(Math.PI * t), ry + (ty + 0.12 - ry) * t, 0));
  tube3(m, a.mat("Coat"), path, [s.tail.r * 1.3, s.tail.r, s.tail.r * 0.85, s.tail.r * 0.8], n);
  tube3(m, a.mat("Mane"), [at(a, tx, ty + 0.18, 0), at(a, tx, ty + 0.08, 0), at(a, tx, ty - 0.02, 0), at(a, tx, ty - 0.1, 0)], [s.tail.r * 1.0, s.tail.r * 2.1, s.tail.r * 1.8, s.tail.r * 0.4], n);
}

/** Where the head's surface lies across at a share `up` (-1..1) of its half height: its half width there. */
const halfWidthAt = (w: number, up: number, jaw: number): number => w * Math.sqrt(Math.max(0, 1 - up * up)) * (1 - (up < 0 ? jaw * Math.abs(up) : 0));

/** The head's top: narrowed (> 0) on the equines' and the camel's, squared (< 0) on the ox's flat forehead. */
const CREST: Record<Species, number> = { horse: 0.08, donkey: 0.08, mule: 0.08, cow: -0.22, camel: 0.04, elephant: 0 };

/** How heavy a brow overhangs the eye (0 none): the camel's and the elephant's, the ox's lighter. */
const BROW: Record<Species, number> = { horse: 0, donkey: 0, mule: 0, cow: 0.9, camel: 1.6, elephant: 1.2 };

/** The head's jaw taper by species: the equines' and the camel's deep narrow jaw, the cow's broad one. */
const JAW: Record<Species, number> = { horse: 0.38, donkey: 0.32, mule: 0.35, cow: 0.18, camel: 0.3, elephant: 0.08 };

/**
 * The eyes: a dark eyeball set in its lid on each side of the head, with a glint at
 * full detail, at the species' place - never left out, as a team of six still looks at the camera.
 */
function drawEyes(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  const st = hs(a);
  const { eye, eyeUp, eyeR } = s.face;
  const [ex, ey, ew, eh] = stationAt(st, eye);
  const { d: ad, up } = axisAt(st, eye);
  const c0 = add(at(a, ex, ey, 0), mul(up, eh * eyeUp));
  const surf = halfWidthAt(ew, eyeUp, 0);
  for (const sd of [-1, 1]) {
    const side: Vec3 = [0, 0, sd];
    // the eye looks out and a little forward
    const look = norm(add(side, mul(ad, 0.35)));
    const fwd = norm(sub(ad, mul(look, dot(ad, look))));
    const upv = cross(look, fwd);
    const lid = add(c0, mul(side, surf - eyeR * 0.45));
    blob(m, a.mat("Lid"), lid, [look, fwd, upv], [eyeR * 0.75, eyeR * 1.45, eyeR * 1.2], d.eye);
    const ball = add(c0, mul(side, surf - eyeR * 0.12));
    blob(m, "eye", ball, [look, fwd, upv], [eyeR * 0.72, eyeR * 1.08, eyeR * 0.88], d.eye);
    const k = BROW[s.species];
    if (k) {
      // a heavy brow over the eye (the camel's, the ox's) or the elephant's wrinkled socket
      const brow = add(add(c0, mul(up, eyeR * 1.15)), mul(side, surf - eyeR * 0.55 * k));
      blob(m, a.mat("Coat"), brow, [look, fwd, upv], [eyeR * 0.75 * k, eyeR * 1.7 * k, eyeR * 0.6 * k], Math.max(4, d.eye - 2));
    }
    if (d.fine) {
      // the glint: a small facet just off the eyeball, up and forward
      const dirn = norm(add(add(look, mul(fwd, 0.45)), mul(upv, 0.45)));
      const t1 = norm(cross(dirn, Y));
      const t2 = cross(t1, dirn);
      const g = eyeR * 0.22;
      const q = add(ball, mul(dirn, eyeR * 0.83));
      m.facets("glint", [add(q, mul(t1, g)), add(q, mul(t2, g)), add(q, mul(t1, -g)), add(q, mul(t1, -g)), add(q, mul(t2, -g)), add(q, mul(t1, g))], dirn);
    }
  }
}

/** The nose and mouth by species: an equine's nostrils, a bovine's broad pad, a camel's slits and split lip; the mouth's line. */
function drawMuzzle(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  const st = hs(a);
  const jaw = JAW[s.species];
  const [mx, my, mw, mh] = stationAt(st, 1);
  const { d: ad, up } = axisAt(st, 0.97);
  const tip = at(a, mx, my, 0);
  const nose = s.face.nose;
  const n = d.eye;
  if (nose === "bovine") {
    // the broad moist nose pad over the muzzle's front, the nostrils at its sides
    blob(m, a.mat("Nose"), add(tip, mul(up, mh * 0.15)), [ad, Z, up], [0.035, mw * 1.02, mh * 0.85], n);
    for (const sd of [-1, 1]) blob(m, "nostril", add(add(tip, mul(ad, 0.024)), add(mul(up, mh * 0.25), [0, 0, sd * mw * 0.5])), [ad, Z, up], [0.018, 0.022, 0.03], n);
  } else if (nose === "equine") {
    for (const sd of [-1, 1]) {
      const [nx, ny, nw, nh] = stationAt(st, 0.96);
      const c = add(at(a, nx, ny, 0), add(mul(up, nh * 0.25), [0, 0, sd * halfWidthAt(nw, 0.25, 0) * 0.78]));
      const out = norm(add([0, 0, sd], mul(ad, 1.1)));
      blob(m, "nostril", c, [out, norm(add(up, mul(ad, -0.3))), cross(out, norm(add(up, mul(ad, -0.3))))], [nw * 0.32, nh * 0.6, nw * 0.38], n);
    }
  } else if (nose === "camel") {
    // the slit nostrils high on the muzzle, the split upper lip, the hanging lower lip
    for (const sd of [-1, 1]) {
      const [nx, ny, nw, nh] = stationAt(st, 0.9);
      const c = add(at(a, nx, ny, 0), add(mul(up, nh * 0.55), [0, 0, sd * nw * 0.55]));
      blob(m, "nostril", c, [norm(add(up, [0, 0, sd * 0.6])), ad, norm(cross(ad, add(up, [0, 0, sd * 0.6])))], [0.012, 0.035, 0.01], n);
    }
    blob(m, "nostril", add(tip, add(mul(ad, mw * 0.85), mul(up, -mh * 0.2))), [ad, up, Z], [0.012, mh * 0.75, 0.008], n);
    blob(m, a.mat("Muzzle"), add(tip, add(mul(ad, -mw * 0.6), mul(up, -mh * 1.05))), [ad, up, Z], [mw * 1.1, mh * 0.45, mw * 0.75], n);
  }
  if (nose === "trunk") return;
  // the mouth: a dark line back from the muzzle's front along each side
  const ups = nose === "bovine" ? -0.5 : -0.4;
  for (const sd of [-1, 1]) {
    const pts = [0.68, 0.84, 1].map((t): Vec3 => {
      const [x, y, w, h] = stationAt(st, t);
      const { up: u } = axisAt(st, Math.min(t, 0.97));
      return add(at(a, x, y, 0), add(mul(u, h * ups), [0, 0, sd * (halfWidthAt(w, ups, jaw) - 0.002)]));
    });
    pts[2] = add(pts[2]!, [0, 0, -sd * mw * 0.5]);
    rods(m, "nostril", pts, Math.max(0.006, mw * 0.06), Math.max(3, n - 4));
  }
}

/**
 * Where an ear (side `sd`, -1 left) rises from the head, animal coordinates: on the top of
 * the skull just ahead of the poll's cap (`base`), its first ring sunk into the head (`root`),
 * and the direction it points. A regression test keeps the root inside the head.
 */
export function earRoot(s: SpeciesSpec, d: Detail, sd: number): { base: Vec3; root: Vec3; dir: Vec3 } {
  const st = smooth(s.head, d.sub);
  const [px, py, pw, ph] = stationAt(st, 0.07);
  const { up } = axisAt(st, 0.07);
  const base = add(add([px, py, 0], mul(up, ph * 0.72)), [0, 0, sd * pw * 0.5]);
  const droop = s.ears.droop;
  const dir = norm([-0.25, Math.cos(droop * 1.3), sd * (0.25 + Math.sin(droop * 1.3))]);
  return { base, root: add(base, mul(dir, -Math.min(s.ears.length * 0.25, ph * 0.5))), dir };
}

/**
 * A thick curved flap (an elephant's ear): `grid` the outer surface, rows by columns,
 * its inner surface the same moved by `thick`, the edges walled; every face turned out.
 */
function flap(m: MeshBuilder, mat: string, grid: readonly Vec3[][], thick: Vec3): void {
  const inner = grid.map((row) => row.map((p) => add(p, thick)));
  const away = mul(norm(thick), -1);
  const centre = mean(grid.flat().map((p) => add(p, mul(thick, 0.5))));
  const face = (pa: Vec3, pb: Vec3, pc: Vec3, dirn: Vec3) => m.facets(mat, [pa, pb, pc], dirn);
  const R = grid.length;
  const C = grid[0]!.length;
  for (let r = 0; r + 1 < R; r++) for (let c = 0; c + 1 < C; c++) {
    for (const [g, dir] of [[grid, away], [inner, mul(away, -1)]] as const) {
      const [p00, p01, p10, p11] = [g[r]![c]!, g[r]![c + 1]!, g[r + 1]![c]!, g[r + 1]![c + 1]!];
      face(p00, p01, p11, dir);
      face(p00, p11, p10, dir);
    }
  }
  // the walls round the edge: the border of the grid, in order
  const ring: Array<[number, number]> = [];
  for (let c = 0; c < C; c++) ring.push([0, c]);
  for (let r = 1; r < R; r++) ring.push([r, C - 1]);
  for (let c = C - 2; c >= 0; c--) ring.push([R - 1, c]);
  for (let r = R - 2; r > 0; r--) ring.push([r, 0]);
  for (let i = 0; i < ring.length; i++) {
    const [ra, ca] = ring[i]!;
    const [rb, cb] = ring[(i + 1) % ring.length]!;
    const [a0, b0, a1, b1] = [grid[ra]![ca]!, grid[rb]![cb]!, inner[ra]![ca]!, inner[rb]![cb]!];
    const out = sub(mean([a0, b0]), centre);
    face(a0, b0, b1, out);
    face(a0, b1, a1, out);
  }
}

/** The ears: a flattened cone with its opening forward and its inside coloured; an elephant's a broad flap. */
function drawEars(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  const head = s.head;
  const { length, width } = s.ears;
  for (const sd of [-1, 1]) {
    if (s.feature === "trunk") {
      // an elephant's ear: a thick flap rooted along the side of the head, cupped away
      // from it toward its free back edge, its top edge rolled outward, the lobe hanging down
      const [hx, hy, hw] = stationAt(head, 0.3);
      const top = hy + 0.32;
      // rows from the top down: (height below the top, the flap's width back from its root)
      const rows: ReadonlyArray<readonly [number, number]> = d.fine
        ? [[0, 0.14], [0.07, 0.34], [0.2, 0.44], [0.38, 0.44], [0.56, 0.37], [0.72, 0.24], [0.84, 0.07]]
        : [[0, 0.14], [0.2, 0.44], [0.5, 0.4], [0.84, 0.07]];
      const cols = d.fine ? [0, 0.3, 0.6, 0.85, 1] : [0, 0.5, 1];
      const grid = rows.map(([dy, w], r) => cols.map((u): Vec3 => {
        const v = r / (rows.length - 1);
        // the root runs down the side of the head and back under the jaw to the hanging lobe
        const out = hw * 0.86 + 0.05 + 0.11 * u ** 1.6 + 0.03 * Math.sin(Math.PI * v) + (r === 0 ? 0.04 * u : 0);
        return at(a, hx + 0.02 - 0.16 * v * v - w * u, top - dy + 0.05 * u * (1 - v) - 0.04 * u * v, sd * out);
      }));
      flap(m, a.mat("Coat"), grid, [0, 0, -sd * 0.045]);
      continue;
    }
    const e = earRoot(s, d, sd);
    const [base, root, dir] = [add(e.base, [a.ox, 0, a.oz]), add(e.root, [a.ox, 0, a.oz]), e.dir];
    const tip = add(base, mul(dir, length));
    // across the ear (its width) square to it and to the fore-aft; its thickness fore and aft
    const across = norm(cross(dir, X));
    const thick = norm(cross(across, dir));
    const front = thick[0] >= 0 ? thick : mul(thick, -1);
    const er = (p: Vec3, w: number) => ring(p, across, front, w, w * 0.45, Math.max(5, d.eye - 1), Math.PI / 2);
    const lean = d.leg < 7;
    skin(m, a.mat("Coat"), [er(root, width * 0.8), er(base, width * 0.85), er(add(base, mul(dir, length * 0.35)), width), ...(lean ? [] : [er(add(base, mul(dir, length * 0.7)), width * 0.75)]), er(tip, width * 0.08)]);
    // the inside of the ear, its cup facing forward
    blob(m, a.mat("Inner"), add(add(base, mul(dir, length * 0.42)), mul(front, width * 0.3)), [front, dir, across], [width * 0.2, length * 0.3, width * 0.6], lean ? 4 : Math.max(5, d.eye - 2));
  }
}

/** The neck, head, ears, eyes, nose and mouth, the species' features (horns, trunk, tusks, forelock, dewlap) and the bridle. */
function drawHead(m: MeshBuilder, a: Drawn): void {
  const { s, d } = a;
  const jaw = JAW[s.species];
  m.scope("neck", () => {
    const neck = smooth(s.neck, d.sub);
    tubeOf(m, a, a.mat("Coat"), neck, d.neck, {}, s.feature === "trunk" ? 0 : 0.12, s.mane === "none" ? 0.1 : 0.3);
    if (s.mane !== "none") {
      const pts = neck.map(([x, y]) => at(a, x, y, 0));
      const mane = neck.map(([, , w, h], i) => {
        const { up } = frameAt(pts, i);
        const hgt = s.mane === "upright" ? 0.075 : 0.055;
        // the first ring a little up the neck, off the plane of the neck's own root cap
        const { d: along } = frameAt(pts, i);
        return ring(add(add(pts[i]!, mul(up, h * 0.9)), mul(along, i === 0 ? 0.03 : 0)), Z, up, s.mane === "upright" ? Math.min(0.03, w * 0.2) : Math.min(0.06, w * 0.35), hgt, 6);
      });
      skin(m, a.mat("Mane"), mane);
    }
    if (s.species === "cow") {
      // the dewlap: a fold of skin hanging under the throat
      const st = [0.0, 0.35, 0.7, 1].map((t): Vec3 => {
        const [x, y, , h] = stationAt(s.neck, t);
        return at(a, x, y - h * 0.75, 0);
      });
      const drop = [0.12, 0.17, 0.14, 0.06];
      skin(m, a.mat("Coat"), st.map((p, i) => ring(add(p, [0, -drop[i]! * 0.5, 0]), Z, Y, 0.03, drop[i]! * 0.6 + 0.04, 6)));
    }
  });
  m.scope("head", () => {
    const head = smooth(s.head, d.sub);
    const mi = (s.head.length - 2) * d.sub;
    const crest = CREST[s.species];
    tubeOf(m, a, a.mat("Coat"), head.slice(0, mi + 1), d.neck, { end: false }, jaw, crest);
    tubeOf(m, a, a.mat("Muzzle"), head.slice(mi), d.neck, { start: false }, jaw, crest);
    drawEyes(m, a);
    drawMuzzle(m, a);
    const top = (t: number, k = 1.0): Vec3 => {
      const [x, y, , h] = stationAt(hs(a), t);
      const { up } = axisAt(hs(a), t);
      return add(at(a, x, y, 0), mul(up, h * k));
    };
    if (s.colors.blaze && d.fine) {
      // a white blaze down the face
      const [t1, t2] = [0.18, 0.88];
      const { up } = axisAt(hs(a), 0.5);
      const c1 = top(t1, 0.97);
      const c2 = top(t2, 0.97);
      const w = stationAt(hs(a), t1)[2] * 0.3;
      m.slab(a.mat("Blaze"), [add(c1, [0, 0, -w]), add(c1, [0, 0, w]), add(c2, [0, 0, w * 0.55]), add(c2, [0, 0, -w * 0.55])].map((p) => add(p, mul(up, 0.012))), mul(up, -0.012));
    }
    if (s.face.forelock) {
      // the forelock falling from the poll over the forehead
      const [, , w0] = s.head[0]!;
      tube3(m, a.mat("Mane"), [top(0, 0.75), top(0.07, 1.04), top(0.15, 1.05), top(0.21, 1.0)], [w0 * 0.3, w0 * 0.45, w0 * 0.35, w0 * 0.12], Math.max(5, d.eye - 2));
    }
    if (s.species === "camel") {
      // the camel's domed forehead between and behind its eyes
      const [x, y, w, h] = stationAt(hs(a), 0.17);
      const { up, d: along } = axisAt(hs(a), 0.17);
      blob(m, a.mat("Coat"), add(at(a, x, y, 0), mul(up, h * 0.45)), [up, along, Z], [h * 0.65, h * 1.35, w * 0.82], d.neck);
    }
    m.scope("ears", () => drawEars(m, a));
    if (s.feature === "horns") {
      m.scope("horns", () => {
        for (const sd of [-1, 1]) {
          const b = add(at(a, s.head[0]![0], s.head[0]![1], 0), [0.0, s.head[0]![3] * 0.55, sd * s.head[0]![2] * 0.75]);
          tube3(m, "horn", [b, add(b, [0.0, 0.03, sd * 0.09]), add(b, [0.02, 0.08, sd * 0.17]), add(b, [0.05, 0.17, sd * 0.21]), add(b, [0.07, 0.25, sd * 0.19])], [0.035, 0.03, 0.024, 0.016, 0.004], d.eye, X);
        }
        // the poll's ridge between the horns
        tube3(m, a.mat("Coat"), [add(top(0, 0.6), [0, 0, -s.head[0]![2] * 0.8]), add(top(0, 0.75), [0, 0, 0]), add(top(0, 0.6), [0, 0, s.head[0]![2] * 0.8])], [0.04, 0.05, 0.04], Math.max(5, d.eye - 2), X);
      });
    }
    if (s.feature === "trunk") {
      m.scope("trunk", () => {
        // the twin domes of an Asian elephant's forehead
        for (const sd of [-1, 1]) {
          const [x, y, w, h] = stationAt(hs(a), 0.12);
          blob(m, a.mat("Coat"), at(a, x + 0.03, y + h * 0.55, sd * w * 0.38), [Y, X, Z], [h * 0.5, 0.2, w * 0.45], d.neck);
        }
        const last = s.head[s.head.length - 1]!;
        const path: Station[] = [[last[0], last[1] + 0.05, last[2], last[3]], [last[0] + 0.05, last[1] - 0.3, 0.12, 0.12], [last[0] + 0.05, last[1] - 0.7, 0.095, 0.095], [last[0] + 0.08, last[1] - 1.05, 0.075, 0.075], [last[0] + 0.17, last[1] - 1.35, 0.06, 0.06], [last[0] + 0.28, last[1] - 1.5, 0.052, 0.05]];
        const tr = smooth(path, d.sub);
        tube3(m, a.mat("Coat"), tr.map(([x, y]) => at(a, x, y, 0)), tr.map(([, , w]) => w), d.neck, Z, { start: false, end: false });
        // its tip: the rim round the two nostrils
        const e = tr[tr.length - 1]!;
        const p = tr[tr.length - 2]!;
        const dir = norm([e[0] - p[0], e[1] - p[1], 0]);
        const tipC = at(a, e[0], e[1], 0);
        blob(m, a.mat("Muzzle"), tipC, [dir, Z, cross(dir, Z)], [0.035, e[2] * 1.05, e[3] * 1.05], d.neck);
        for (const sd of [-1, 1]) blob(m, "nostril", add(tipC, add(mul(dir, 0.03), [0, 0, sd * e[2] * 0.4])), [dir, Z, cross(dir, Z)], [0.012, 0.016, 0.02], d.eye);
        // the lower lip under the trunk's root
        const [lx, ly, lw, lh] = stationAt(hs(a), 0.85);
        blob(m, a.mat("Nose"), at(a, lx - 0.06, ly - lh * 0.95, 0), [X, Y, Z], [0.12, 0.06, lw * 0.6], d.eye);
        for (const sd of [-1, 1]) {
          const t0 = at(a, lx - 0.04, ly - lh * 0.6, sd * lw * 0.7);
          tube3(m, "tusk", [t0, add(t0, [0.1, -0.18, sd * 0.02]), add(t0, [0.24, -0.27, sd * 0.03]), add(t0, [0.34, -0.26, sd * 0.03])], [0.04, 0.035, 0.026, 0.012], d.eye, Z);
        }
      });
    }
    // the bridle (a halter on the cow and the camel): head band, noseband, the cheek pieces
    if (s.harness !== "breastband" || s.species === "camel") {
      m.scope("bridle", () => {
        const band = (t: number, k: number): Vec3[] => {
          const [x, y, w, h] = stationAt(hs(a), t);
          const c = at(a, x, y, 0);
          const { d: dd, up: u } = axisAt(hs(a), t);
          const rings = [-0.02, 0.02].map((o) => shapedRing(add(c, mul(dd, o)), Z, u, w * k, h * k, d.neck, Math.PI / d.neck, jaw, crest));
          skin(m, "harness", rings, { start: false, end: false });
          return rings[0]!;
        };
        const tb = Math.max(0.05, s.face.eye - 0.17);
        const tn = s.face.nose === "bovine" ? 0.8 : 0.84;
        band(tb, 1.07);
        band(tn, 1.12);
        // the cheek pieces from the head band down to the noseband, behind the eyes
        for (const sd of [-1, 1]) {
          const p = (t: number, k: number): Vec3 => {
            const [x, y, w, h] = stationAt(hs(a), t);
            const { up } = axisAt(hs(a), t);
            return add(at(a, x, y, 0), add(mul(up, -h * 0.35), [0, 0, sd * (halfWidthAt(w, -0.35, jaw) * k + 0.004)]));
          };
          rods(m, "harness", [p(tb, 1.07), p((tb + tn) / 2 + 0.08, 1.06), p(tn, 1.12)], 0.011 * (s.legs.top / 1.08) + 0.004, 4);
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
 * tail its children, each leg's upper part pivoted at the shoulder or hip, the lower
 * part a child pivoted at the knee or hock, and the foot its child pivoted at the fetlock.
 */
export function drawAnimal(m: MeshBuilder, species: Species, prefix: string, ox: number, oz: number, d: Detail = FULL, harness = true): void {
  const s = SPECIES_SPECS[species];
  const a: Drawn = { s, ox, oz, d, mat: (k) => `${species}${k}` };
  const neck0 = s.neck[0]!;
  m.spin(prefix, pivot(at(a, ...bodyXY(s), 0)), () => {
    drawBarrel(m, a);
    if (harness) drawHarness(m, a);
    m.spin(`${prefix}-head`, pivot(at(a, neck0[0] + 0.06, neck0[1] + 0.04, 0)), () => drawHead(m, a));
    m.spin(`${prefix}-tail`, pivot(at(a, s.tail.root[0], s.tail.root[1], 0)), () => drawTail(m, a));
    m.scope("legs", () => {
      for (const l of LEGS) {
        const c = legChain(s, l);
        const z = legZ(s, l);
        m.spin(`${prefix}-leg-${l}`, pivot(at(a, c.root[0], c.root[1], z)), () => {
          drawLegUpper(m, a, l);
          m.spin(`${prefix}-shin-${l}`, pivot(at(a, c.joint[0], c.joint[1], z)), () => {
            drawLegLower(m, a, l);
            m.spin(`${prefix}-foot-${l}`, pivot(at(a, c.fet[0], c.fet[1], z)), () => drawFoot(m, a, l));
          });
        });
      }
    });
  });
}

const pivot = (p: Vec3): Vec3 => [r3(p[0]), r3(p[1]), r3(p[2])];
const bodyXY = (s: SpeciesSpec): [number, number] => [0, s.legs.top + 0.15 * (s.legs.top / 1.08)];

/** Where an animal's body pivot stands (animal coordinates): its middle at the body's height. */
export function bodyPivot(species: Species): Vec3 {
  const [x, y] = bodyXY(SPECIES_SPECS[species]);
  return [x, r3(y), 0];
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

/** A leg's three joints' angles about z: the swing at the shoulder or hip, the knee or hock, the fetlock. */
export interface LegPose { swing: number; knee: number; fet: number }

/**
 * A leg at its own phase u: planted for the duty share (sliding back under the body),
 * then swung forward with its joints folded - the front knee and every fetlock tuck the
 * foot back, a hock brings it forward under the body, an elephant's hind knee back.
 */
function legPose(s: SpeciesSpec, l: Leg, u: number): LegPose {
  const len = s.legs.top;
  const half = (s.stride * s.duty) / 2;
  const max = Math.asin(Math.min(0.95, half / len));
  if (u < s.duty) return { swing: Math.asin(Math.max(-0.95, Math.min(0.95, (half * (1 - (2 * u) / s.duty)) / len))), knee: 0, fet: 0 };
  const t = (u - s.duty) / (1 - s.duty);
  // the joints fold at once as the foot leaves the ground and open again before it lands,
  // so the swinging pair is tucked up while the planted one carries the body
  const b = Math.sin(Math.PI * Math.sqrt(t));
  const padded = s.foot === "padded";
  const fold = padded ? 0.45 : 1.1;
  const front = l.startsWith("front");
  const knee = front ? -fold * 1.1 * b : s.legs.hindFold * fold * 0.75 * b;
  const fet = -(s.species === "elephant" ? 0.1 : padded ? 0.45 : 0.9) * b;
  return { swing: -max * Math.cos(Math.PI * t), knee, fet };
}

export interface GaitPose {
  lift: number;
  nod: number;
  tail: number;
  legs: Record<Leg, LegPose>;
}

/**
 * The foot's outline near the ground, animal (x, y) at rest: the sole's front and back,
 * and the widest points above it (the hoof's coronet, a Clydesdale's feather, an
 * elephant's toenails), so a tilted foot's edge is found as well as its centre.
 */
function footOutline(s: SpeciesSpec, l: Leg): Array<[number, number]> {
  const c = legChain(s, l);
  const rFoot = s.legs.r[3];
  const k = s.legs.top / 1.08;
  const x = c.sole[0];
  const out: Array<[number, number]> = [];
  const pair = (cx: number, y: number, r: number) => out.push([cx - r, y], [cx + r, y]);
  if (s.species === "elephant") {
    pair(x, 0, rFoot * 1.07);
    pair(x, 0.075, rFoot * 1.04 + 0.025);
  } else if (s.foot === "padded") {
    pair(x + 0.01, 0, rFoot * 1.25);
    pair(x + 0.01, 0.035, rFoot * 1.3);
  } else {
    pair(x + 0.015 * k, 0, rFoot * 1.05);
    pair(x + 0.012 * k, 0.04 * k, rFoot * 0.98);
    if (s.species === "horse") {
      const tc = (c.fet[1] - 0.1 * k) / (c.fet[1] - c.sole[1]);
      const cx = lerp2(c.fet, c.sole, tc)[0];
      pair(cx + 0.005, 0.08 * k, rFoot * 1.3);
      pair(cx, 0.11 * k, rFoot * 1.28);
    }
  }
  return out;
}

const rotZ = (p: P2, o: P2, t: number): P2 => {
  const [x, y] = [p[0] - o[0], p[1] - o[1]];
  return [o[0] + x * Math.cos(t) - y * Math.sin(t), o[1] + x * Math.sin(t) + y * Math.cos(t)];
};

/** The lowest point of any foot over the ground for a pose, before the body's lift. */
function lowestFoot(s: SpeciesSpec, p: GaitPose): number {
  let low = Infinity;
  for (const l of LEGS) {
    const c = legChain(s, l);
    const { swing, knee, fet } = p.legs[l];
    for (const q of footOutline(s, l)) low = Math.min(low, rotZ(rotZ(rotZ(q, c.fet, fet), c.joint, knee), c.root, swing)[1]);
  }
  return low;
}

/** The animal at a phase of its stride, 0..1: the legs, a nod, the tail's swish, the body lifted so the planted feet stand on the ground. */
export function gaitPose(species: Species, phase: number): GaitPose {
  const s = SPECIES_SPECS[species];
  const legs = Object.fromEntries(LEGS.map((l) => [l, legPose(s, l, (phase + PHASES[s.gait][l]) % 1)])) as GaitPose["legs"];
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
        { node: `${prefix}-foot-${l}`, path: "rotation" as const, values: rot((p) => qAxis(2, p.legs[l].fet)) },
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
