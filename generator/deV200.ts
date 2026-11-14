// The DB V 200.0 (class 220 from 1968), the Krauss-Maffei / MaK B'B'
// diesel-hydraulic express locomotive of 1956, on the box locomotive kit
// (boxLocoKit.ts) with its own profile tables, measured on the photographs in
// assets/db-v200 (docs/models/germany-trains.md):
// - the body in three tiers: the grey skirt over the bogies (its bottom 0.62 m
//   over the rail), the red lower body between the two silver trims (1.36 m and
//   3.2 m), and the grey upper body above, its sides leaning in, with the cabs'
//   windows and the louvres of the engine rooms;
// - the rounded nose, low and bowed in plan, whose upper silver trim (the
//   "Zierleiste") sweeps down from the corners to a V pointing at the nose door,
//   the grey hood above it rising to the raked windscreen: two front panes and
//   two corner panes, a lamp over the centre pillar;
// - the nose door with the two pairs of horn slots, the DB emblem and the number,
//   the oval headlights with a red and a white lamp under each;
// - per side, mirrored about the middle: the cab door, a louvred window, two
//   large machine-room windows, and above the waist the cab's three windows and
//   the louvres (one single and one double radiator grille per engine room);
// - the roof's two radiator fans and the engines' silencers; the bogies 11.5 m
//   apart, 950 mm wheels; the fuel tank between them.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { roofFan } from "./dieselParts.ts";
import { enumParam } from "./emuParts.ts";

/** Length over the buffers (DB, series locomotives V 200 006-086), half of it, and the buffer beam. */
export const V200_LENGTH = 18.53;
const HALF = V200_LENGTH / 2;
const N = HALF - 0.62;
/** The body's half width: 3.0 m over the sides, so the cab doors' handrails stay inside the 3.1 m gauge. */
const W = 1.5;
/** The skirt's bottom (the shell's), the lower silver trim, the upper one (the waist) and the roof's crown (4.16 m over the rail). */
const SKIRT = 0.62;
const LOW_TRIM = [1.36, 1.43] as const;
const WAIST = [3.2, 3.27] as const;
const ROOF = 4.16;
/** The bogies' centres (11.5 m apart), half their wheelbase and the wheels' radius (950 mm). */
const PIVOT = 5.75;
const AXLE = 1.6;
const WHEEL_R = 0.475;

/** The nose's centre line [y, |x|], bottom first: the skirt, the bowed red face, the grey hood, the raked windscreen, the roof's edge. */
const TIP: ReadonlyArray<readonly [number, number]> = [
  [SKIRT, N - 0.22], [1.0, N - 0.06], [LOW_TRIM[0], N], [1.9, N - 0.01], [2.4, N - 0.1], [2.8, N - 0.22], [3.1, N - 0.36],
  [WAIST[1], N - 0.47], [3.42, N - 0.68], [3.95, N - 1.0], [4.07, N - 1.2], [ROOF, N - 1.5],
];
/** The half width [y, hw]: upright to the waist, then leaning in to the roof's rounded edge. */
const HW: ReadonlyArray<readonly [number, number]> = [[SKIRT, W], [WAIST[1], W], [3.45, W - 0.04], [3.95, W - 0.17], [4.07, W - 0.33], [ROOF, W - 0.62]];
/** The nose in plan at half width w: nearly flat across the middle, its corners rounded 0.68 m back into the sides. */
const plan = (_y: number, w: number) => [[0, 0], [w * 0.45, 0.05], [w * 0.7, 0.15], [w * 0.86, 0.31], [w * 0.96, 0.5], [w, 0.68]] as const;

/** The V of the upper trim on the face: its top edge [z, y] from the point at the centre out to the corner. */
const V_EDGE: ReadonlyArray<readonly [number, number]> = [[0, 2.5], [0.4, 2.77], [0.8, 3.02], [1.15, 3.17], [1.4, 3.24], [W - 0.002, WAIST[1]]];
/** The trim's width. */
const TRIM = 0.07;

interface Livery {
  title: string;
  body: string;
  trim: MaterialSpec;
  number: string;
}

const LIVERIES: Record<string, Livery> = {
  // V 200 007 as delivered: purple red, the silver trims, grey upper body, black-grey skirt
  dbRed: { title: "DB red", body: "#8e1f2a", trim: { color: "#c4c7c9", metallic: 0.6, roughness: 0.35 }, number: "V 200 007" },
  orientRed: { title: "Orient red", body: "#c8462a", trim: c("#efefea"), number: "220 053-2" },
};

export const V200_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

/** Both z signs of an end item (the kit lays each item as listed, at both ends). */
function pair(item: EndItem): EndItem[] {
  const flip = (z: readonly [number, number]) => [-z[1], -z[0]] as const;
  return [
    { ...item, name: `${item.name} left` },
    { ...item, name: `${item.name} right`, z: flip(item.z), ...(item.poly ? { poly: item.poly.map(([u, v]) => [-u, v] as [number, number]).reverse() } : {}) },
  ];
}

/** An ellipse as a convex (u, v) ring. */
const ellipse = (cu: number, cv: number, a: number, b: number, n = 12): Ring =>
  Array.from({ length: n }, (_, i) => [cu + a * Math.cos((2 * Math.PI * i) / n), cv + b * Math.sin((2 * Math.PI * i) / n)] as [number, number]);

/** The face's V: the grey hood above the trim and the trim itself, one convex piece per edge segment on the +z half. */
function faceV(): EndItem[] {
  const out: EndItem[] = [];
  for (let i = 1; i < V_EDGE.length; i++) {
    const [[z0, y0], [z1, y1]] = [V_EDGE[i - 1]!, V_EDGE[i]!];
    const span = [z0, z1] as const;
    out.push(...pair({ kind: "paint", name: `hood ${i}`, z: span, y: [y0, WAIST[1]], mat: "upper", poly: [[z0, y0], [z1, y1], [z1, WAIST[1] + 0.001], [z0, WAIST[1] + 0.001]] }));
    out.push(...pair({ kind: "paint", name: `trim ${i}`, z: span, y: [y0 - TRIM, y1], mat: "trim", layer: 1, poly: [[z0, y0 - TRIM], [z1, y1 - TRIM], [z1, y1], [z0, y0]] }));
  }
  return out;
}

/** The face below the V: the nose door's seams and horn slots, the emblem, the lamps. */
function faceItems(): EndItem[] {
  const door = { z: [-0.52, 0.52] as const, y: [1.47, 2.4] as const };
  const seam = 0.018;
  return [
    ...faceV(),
    // the nose door, its top corners rounded
    { kind: "paint", name: "door seam bottom", z: door.z, y: [door.y[0], door.y[0] + seam], mat: "seam", layer: 1 },
    { kind: "paint", name: "door seam top", z: [door.z[0] + 0.08, door.z[1] - 0.08], y: [door.y[1] - seam, door.y[1]], mat: "seam", layer: 1 },
    ...pair({ kind: "paint", name: "door seam side", z: [door.z[1] - seam, door.z[1]], y: [door.y[0], door.y[1] - 0.08], mat: "seam", layer: 1 }),
    ...pair({ kind: "paint", name: "door seam corner", z: [door.z[1] - 0.08, door.z[1]], y: [door.y[1] - 0.08, door.y[1]], mat: "seam", layer: 1, poly: [[door.z[1] - seam, door.y[1] - 0.08], [door.z[1], door.y[1] - 0.08], [door.z[1] - 0.08, door.y[1]], [door.z[1] - 0.08, door.y[1] - seam]] }),
    // the horn (Makrophon) slots: two pairs over the emblem
    ...pair({ kind: "paint", name: "horn slot upper", z: [0.06, 0.4], y: [2.28, 2.32], mat: "black", layer: 1 }),
    ...pair({ kind: "paint", name: "horn slot lower", z: [0.06, 0.4], y: [2.2, 2.24], mat: "black", layer: 1 }),
    // the DB emblem: a white frame on the red
    { kind: "paint", name: "emblem", z: [-0.17, 0.17], y: [1.88, 2.08], mat: "white", layer: 1 },
    { kind: "paint", name: "emblem field", z: [-0.145, 0.145], y: [1.905, 2.055], mat: "body", layer: 2 },
    { kind: "plate", name: "number", z: [-0.5, 0.5], y: [1.56, 1.74] },
    // the oval headlights and the red and white lamps under each
    ...pair({ kind: "paint", name: "headlight rim", z: [0.77, 1.01], y: [1.9, 2.36], mat: "rim", layer: 1, poly: ellipse(0.89, 2.13, 0.12, 0.23) }),
    ...pair({ kind: "paint", name: "headlight lens", z: [0.79, 0.99], y: [1.92, 2.34], mat: "lampHead", layer: 2, poly: ellipse(0.89, 2.13, 0.1, 0.21) }),
    ...pair({ kind: "lamp", name: "tail lamp", z: [0.84, 0.94], y: [1.75, 1.85], r: 0.05, mat: "lampRed" }),
    ...pair({ kind: "lamp", name: "lower headlight", z: [0.815, 0.965], y: [1.505, 1.655], r: 0.07 }),
    // the windscreen: two front panes either side of the pillar, two corner panes
    ...pair({ kind: "window", name: "windscreen", z: [0.07, 1.02], y: [3.43, 3.94], wiper: true }),
    ...pair({ kind: "window", name: "corner pane", z: [1.08, 1.36], y: [3.45, 3.91] }),
    // the grab handles beside the headlights
    ...pair({ kind: "paint", name: "grab handle", z: [1.12, 1.15], y: [1.78, 2.02], mat: "rim", layer: 1 }),
    { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [3.99, 4.09], r: 0.07 },
  ];
}

/** The side, x on the front half (mirrored to the rear): above the waist the cab windows and the louvres, below it the doors and windows. */
function sideItems(): SideItem[] {
  const up = [3.36, 3.92] as const;
  return [
    { kind: "door", name: "cab door", x: [4.6, 5.3], y: [1.47, 3.14], rails: true, mirror: true },
    { kind: "window", name: "cab window front", x: [5.97, 6.46], y: up, mat: "rim", r: 0.07, mirror: true },
    { kind: "window", name: "cab window middle", x: [5.46, 5.93], y: up, mat: "rim", r: 0.07, mirror: true },
    { kind: "window", name: "cab window rear", x: [4.82, 5.4], y: up, mat: "rim", r: 0.07, mirror: true },
    { kind: "grille", name: "louvre window", x: [3.43, 4.12], y: [2.42, 3.08], slats: "h", pitch: 0.12, mat: "rim", r: 0.06, mirror: true },
    { kind: "window", name: "engine room window", x: [0.61, 2.54], y: [2.36, 3.1], mat: "rim", r: 0.08, mirror: true },
    { kind: "grille", name: "single louvre", x: [3.6, 4.48], y: [3.38, 3.9], slats: "h", pitch: 0.075, mat: "grille", r: 0.03, mirror: true },
    { kind: "grille", name: "double louvre outer", x: [2.04, 2.97], y: [3.38, 3.9], slats: "h", pitch: 0.075, mat: "grille", r: 0.03, mirror: true },
    { kind: "grille", name: "double louvre inner", x: [1.08, 2.0], y: [3.38, 3.9], slats: "h", pitch: 0.075, mat: "grille", r: 0.03, mirror: true },
    // the DB emblem between the engine room windows
    { kind: "paint", name: "emblem", x: [-0.17, 0.17], y: [2.42, 2.62], mat: "white", layer: 0 },
    { kind: "paint", name: "emblem field", x: [-0.145, 0.145], y: [2.445, 2.595], mat: "body", layer: 1 },
  ];
}

/** The locomotive's kit spec for a livery. */
export function v200Spec(v?: ParamValues): LocoSpec {
  const l = LIVERIES[resolveParams(V200_PARAMS, v).livery!]!;
  const bands = [[0.4, LOW_TRIM[0], "skirt"], [LOW_TRIM[0], LOW_TRIM[1], "trim"], [LOW_TRIM[1], WAIST[0], "body"], [WAIST[0], WAIST[1], "trim"], [WAIST[1], 4.4, "upper"]] as const;
  const endBands = [[0.4, LOW_TRIM[0], "skirt"], [LOW_TRIM[0], LOW_TRIM[1], "trim"], [LOW_TRIM[1], WAIST[1], "body"], [WAIST[1], 4.4, "upper"]] as const;
  return {
    palette: {
      body: c(l.body), trim: l.trim, upper: c("#565b60", 0.7), skirt: c("#2a2b2d", 0.75), seam: c("#3a1014", 0.7),
      // the number is painted on the nose door: its plate in the body's colour
      plate: c(l.body), roof: c("#565b60", 0.75), grille: c("#46494c", 0.7), exhaust: c("#2b2b2b", 0.9),
    },
    y0: SKIRT,
    tip: TIP,
    hw: HW,
    endPlan: plan,
    corner: "end",
    side: bands,
    end: endBands,
    roof: "roof",
    buffers: HALF,
    beam: N,
    // the floor inside the shell, over the wheels
    frame: { y0: 1.0, y1: 1.06, half: N - 0.25, hw: W - 0.06, mat: "frame" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-AXLE, AXLE], wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    exhausts: [[-4.3, 0, 4.3], [4.3, 0, 4.3]],
    sideItems: sideItems(),
    endItems: faceItems(),
    roofItems: [-1, 1].map((e) => ({ name: e > 0 ? "front silencer" : "rear silencer", x: e > 0 ? [3.85, 4.75] : [-4.75, -3.85], w: [0.4, 0.34], y: [ROOF - 0.02, 4.31], mat: "roof" } as const)),
    // the fuel tank between the bogies
    underItems: [[-3.4, 3.4, 0.42, SKIRT + 0.02, 1.12]],
    number: l.number,
  };
}

/** The skirt's apron under each nose, below the shell down to the buffer beam's foot. */
function aprons(m: MeshBuilder): void {
  const front = N - 0.24, back = 8.12, y0 = 0.42, y1 = SKIRT + 0.02;
  const pts = plan(0, W - 0.08);
  m.scope("aprons", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front apron" : "rear apron", () => {
        // counter-clockwise from above: the nose's plan from the -z side round to the +z side, closed behind
        const nose: Array<[number, number]> = [[back, -(W - 0.08)], ...[...pts].reverse().map(([z, b]) => [front - b, -z] as [number, number]), ...pts.slice(1).map(([z, b]) => [front - b, z] as [number, number]), [back, W - 0.08]];
        const ring: Ring = (e > 0 ? nose : nose.map(([x, z]) => [-x, -z] as [number, number]));
        m.prism("skirt", ring, y0, y1, false);
        m.cap("skirt", ring, y0, false);
      });
  });
}

/** The two radiator fans on the roof, over the double louvres. */
function fans(m: MeshBuilder): void {
  m.scope("roof fans", () => { for (const x of [-1.95, 1.95]) roofFan(m, x, 0, ROOF, 0.55); });
}

export function dbV200(v?: ParamValues): MeshBuilder {
  const m = buildBoxLoco(v200Spec(v));
  m.scope("body", () => aprons(m));
  m.scope("roof equipment", () => fans(m));
  return m;
}

/** The distant model: the kit's, the face's V given as a grey band from its mean height. */
export function dbV200Lod(v?: ParamValues): MeshBuilder {
  const s = v200Spec(v);
  return boxLocoLod({ ...s, end: [[0.4, LOW_TRIM[0], "skirt"], [LOW_TRIM[0], LOW_TRIM[1], "trim"], [LOW_TRIM[1], 2.86, "body"], [2.86, 2.93, "trim"], [2.93, 4.4, "upper"]] });
}

