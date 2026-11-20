// The SNCF BB 9200 (proc-vehicle-sncf-bb9200): the 92 Bo'Bo' 1,500 V DC electrics
// Schneider, Jeumont and the CEM built in 1957 - 1964 on Andre Jacquemin's bogies (the
// "BB Jacquemin"), on the box locomotive kit (boxLocoKit.ts) with its own profile,
// measured on the photographs in assets/sncf-bb9200 (SOURCES.md) and the published
// figures: 16.20 m over the buffers, 2.98 m wide, 4.19 m high over the folded
// pantographs, the bogie pivots 9.20 m apart, 3.20 m bogie wheelbase, 1,250 mm wheels,
// 82.8 t, 3,850 kW, 160 km/h (the Capitole units 200 km/h; 9291 and 9292 4,240 kW).
//
// - scales: the near-head-on 9233 (Paris-Austerlitz) at 123 px/m over the 2.98 m face
//   (the buffers at 1.04 m); the near-head-on Capitole 9291 (Mulhouse) at 204 px/m
//   between the headlights (1.97 m) and the buffers; the three-quarter 9291 at
//   191 px/m on the face; the side-on 9274 (vert) by a projective fit over the axles,
//   the cab door and the cab windows (65 px/m at the near cab, 30 px/m at the far one,
//   79 px/m upright at the grilles);
// - the cab end: the face upright from the apron to the aluminium sill ledge at
//   3.0 m, curved in plan (the middle 9 cm ahead of the corners' start, the corners
//   elliptic, 0.6 m across and 0.85 m deep); the window band above set back 7 cm and
//   leaning back another 5 cm to the visor at 3.62 m, which overhangs it with an
//   aluminium rim, the roof doming back 0.85 m to the crown at 3.9 m; the two flat
//   windscreens with a narrow middle pillar and the curved corner windows wrapping
//   round the corners; on the face the aluminium "moustache" under the sill ledge
//   with the number plate, its two wings curving down to the SNCF disc, the
//   headlights on the corners (1.97 m, 2.2 m apart) in aluminium wings sweeping back
//   to the side, the face's foot ledge at 1.55 m over the apron and the headstock;
// - each side: three cab side windows behind the corner window (the last rounded at
//   its rear), the cab door under the second and third with its long handrails, the
//   machine room's two louvred grilles high in the middle, the line (`blue`) or the
//   band (`capitole`) at the headlights' height from wing to wing; the number toward
//   one end and "SNCF" toward the other, point symmetric;
// - the roof: two G1 diamond pantographs over the cabs' rear (`blue`) or the Capitole
//   units' single arms (`capitole`), the rear raised, the roof line between them, the
//   two marker lamps on each cab's dome;
// - liveries: `blue` - the class's "vert" of 1957 (a blue green, 9274 and 9218 in the
//   1970s - 1980s) with the aluminium moustache, wings and line, the black plate and
//   the dark SNCF disc (key and title kept: saved maps store the key); `capitole` -
//   the Capitole red 602 with the "gris dauphin" 836 band stopping at the headlights,
//   the yellow plate and disc, the CAPITOLE shield under the disc, as BB 9291 is kept
//   at the Cite du Train in Mulhouse.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, kinks, onSide, rect, surfacePanel, type Place, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = [number, number];
type Span = readonly [number, number];

/** Half the length over the buffers (16.20 m). */
const HALF = 8.1;
/** The face's |x| from the apron to the sill ledge (the body 14.96 m long). */
const N = 7.48;
/** The body's half width (2.98 m). */
const W = 1.49;
/** The body's bottom; the face's foot ledge; the sill ledge's top (the window band's foot). */
const Y0 = 1.15;
const FOOT = 1.55;
const SILL = 3.0;
/** The windscreens' and the cab side windows' sill and head. */
const SCREEN: Span = [3.04, 3.61];
/** The visor's rim (its lower edge to its top); the crown. */
const RIM: Span = [3.625, 3.69];
const CROWN = 3.9;

/** The end's centre line [y, |x|]: the apron rounding under, the upright face, the set-back window band, the visor and the dome. */
const TIP: Table = [
  [Y0, N - 0.12], [1.22, N - 0.04], [1.3, N], [SILL, N], [SILL + 0.01, N - 0.07], [3.62, N - 0.12], [RIM[0], N - 0.02], [RIM[1], N - 0.02],
  [3.73, N - 0.06], [3.78, N - 0.16], [3.83, N - 0.33], [3.87, N - 0.56], [CROWN, N - 0.85],
];
/** The half width [y, hw]: the skirt drawn in at its foot, upright walls, the cant and the roof. */
const HW: Table = [
  [Y0, W - 0.07], [1.22, W - 0.015], [1.3, W], [3.64, W], [3.7, W - 0.02], [3.75, W - 0.07], [3.8, W - 0.17], [3.85, W - 0.36], [3.88, W - 0.58], [CROWN, W - 0.85],
];
/** The plan: the middle bowed BOW ahead of the corners' start, the corners elliptic, RZ across and RX deep. */
const BOW = 0.09;
const RZ = 0.6;
const RX = 0.85;
const ANGLES = [15, 30, 45, 60, 75, 90].map((a) => (a * Math.PI) / 180);

function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(RZ, w * 0.85);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (RX - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the flat side wall starts at the lower face (the corner's end), |x|. */
const SIDE_END = N - RX;

/** The bogies: pivots 9.2 m apart, 3.2 m wheelbase, 1,250 mm wheels. */
const PIVOT = 4.6;
/** The pantographs' centres; the roof walk's top they stand on. */
const PANTO_X = 5.1;
const WALK_TOP = CROWN + 0.06;

/** The cab's side windows (front half, drawn at both ends): two plain, the third rounded at its rear; the cab door under them. */
const SIDE_WIN: readonly Span[] = [[5.8, 6.42], [5.2, 5.72]];
const ROUND_WIN: Span = [4.4, 5.12];
const SIDE_WIN_Y: Span = [3.04, 3.59];
const DOOR: Span = [4.55, 5.15];
/** The machine room's louvred grilles. */
const GRILLE_X = 2.95;
const GRILLE_Y: Span = [2.8, 3.5];
/** The headlights: |z|, height, lens radius. */
const LAMP = { z: 1.1, y: 1.97, r: 0.13 };
/** The moustache band under the sill ledge; the SNCF disc's centre and radius. */
const MOUSTACHE: Span = [2.74, 2.86];
const DISC = { y: 2.45, r: 0.225 };

// --- liveries ------------------------------------------------------------------------

interface Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** The band at the headlights' height from wing to wing, and its paint. */
  band: Span;
  bandMat: string;
  /** The wing's rear tip, [y low, y high], where it meets the band. */
  wingTip: Span;
  /** The face's foot ledge, the apron's headstock panel. */
  ledge: string;
  apron: string;
  /** The number plate, its letters; the disc; its letters. */
  plate: string;
  plateText: string;
  disc: string;
  discText: string;
  /** The side lettering. */
  lettering: string;
  pantograph: "diamond" | "singleArm";
  /** The small marker lamps beside the headlights. */
  markers: boolean;
  /** The Capitole shield under the disc. */
  shield: boolean;
  number: string;
}

const ALU: MaterialSpec = { color: "#c9ced1", metallic: 0.55, roughness: 0.3 };

const LIVERIES: Record<string, Livery> = {
  // the class's vert of 1957, BB 9274 (and 9218) in the 1970s - 1980s
  blue: {
    title: "SNCF blue",
    palette: { body: c("#5a8680", 0.55), plateDark: c("#1b1d1f", 0.6), discDark: c("#22282b", 0.6), beam: c("#25282a", 0.75) },
    band: [2.12, 2.16],
    bandMat: "alu",
    wingTip: [2.12, 2.16],
    ledge: "body",
    apron: "body",
    plate: "plateDark",
    plateText: "alu",
    disc: "discDark",
    discText: "alu",
    lettering: "alu",
    pantograph: "diamond",
    markers: true,
    shield: false,
    number: "BB 9274",
  },
  // the Capitole units (9278, 9281, 9282, 9288, 9291, 9292), BB 9291 as kept at Mulhouse
  capitole: {
    title: "Capitole",
    palette: { body: c("#b0222b", 0.4), dauphin: c("#c3c7c9", 0.5), gold: c("#e2b52a", 0.45), plateText: c("#1d1e20", 0.6), beam: c("#7d8285", 0.7), whiteLetter: c("#f0efe8", 0.5) },
    band: [1.8, 2.15],
    bandMat: "dauphin",
    wingTip: [2.08, 2.17],
    ledge: "alu",
    apron: "beam",
    plate: "gold",
    plateText: "plateText",
    disc: "gold",
    discText: "beam",
    lettering: "whiteLetter",
    pantograph: "singleArm",
    markers: false,
    shield: true,
    number: "BB 9291",
  },
};

export const BB9200_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(BB9200_PARAMS, v).livery!]!;

/** The game's figures: 82.8 t, 3,850 kW, 160 km/h; the Capitole units 200 km/h (9291, 9292: 4,240 kW). */
export const BB9200_GAME: GameProperties = { weight: 83, power: 3850, maxspeed: 160, accel: null, variants: [{ params: { livery: "capitole" }, power: 4240, maxspeed: 200 }] };

// --- the body ------------------------------------------------------------------------

/** The shell's paint: the body colour, the visor's aluminium rim running on as the gutter along the sides. */
const BANDS: readonly Band[] = [[Y0, RIM[0], "body"], [RIM[0], RIM[1], "alu"], [RIM[1], CROWN, "body"]];

function spec(l: Livery): LocoSpec {
  return {
    palette: {
      alu: ALU, rim: { color: "#b9bec1", metallic: 0.55, roughness: 0.3 }, chrome: { color: "#dfe3e5", metallic: 0.8, roughness: 0.2 },
      underframe: c("#26282b", 0.75), bogie: c("#2c2e31", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      slat: c("#5c6064", 0.6), louvre: c("#202326", 0.8), wiper: c("#2b2d30", 0.6), insulator: c("#c9cbc8", 0.4),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: BANDS,
    end: BANDS,
    roof: "body",
    buffers: HALF,
    beam: N + 0.04,
    bufferY: 1.04,
    bufferHead: "rect",
    frame: { y0: 0.95, y1: Y0, half: 7.3, hw: 1.3, mat: "underframe" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-1.6, 1.6], wheelR: 0.625, frameTop: 0.92 })),
    pantograph: { kind: l.pantograph, x: PANTO_X, roofY: WALK_TOP, baseY: WALK_TOP + 0.12 },
    sideItems: [
      ...SIDE_WIN.map((x, i): SideItem => ({ kind: "window", name: `cab window ${i + 1}`, x, y: SIDE_WIN_Y, mat: "rim", r: 0.05, mirror: true })),
      { kind: "door", name: "cab door", x: DOOR, y: [1.25, 2.92], rails: true, mirror: true },
      { kind: "grille", name: "grille front", x: [0.07, GRILLE_X], y: GRILLE_Y, mat: "slat", slats: "h", pitch: 0.055, r: 0.03 },
      { kind: "grille", name: "grille rear", x: [-GRILLE_X, -0.07], y: GRILLE_Y, mat: "slat", slats: "h", pitch: 0.055, r: 0.03 },
      { kind: "paint", name: "band", x: [-SIDE_END, SIDE_END], y: l.band, mat: l.bandMat },
    ],
    endItems: [],
    roofItems: [{ name: "roof walk", x: [-3.9, 3.9], w: [0.78, 0.72], y: [CROWN - 0.02, WALK_TOP], mat: "body" }],
    underItems: [[-1.9, 1.9, 0.62, 0.95, 0.75]],
    number: l.number,
  };
}

// --- the wrapped skin: the face, its corners and the side as one surface ------------------

/** The end's plan at height y as points [z, setback] and their arc lengths from the middle. */
function planOf(sp: ShellSpec, y: number): { pts: ReadonlyArray<readonly [number, number]>; S: number[]; normals: Pt[] } {
  const pts = sp.endPlan(y);
  const S = [0];
  const seg: Pt[] = [];
  for (let k = 1; k < pts.length; k++) {
    const [dz, ds] = [pts[k]![0] - pts[k - 1]![0], pts[k]![1] - pts[k - 1]![1]];
    const len = Math.hypot(dz, ds);
    S.push(S[k - 1]! + len);
    // outward: along the end's normal (x) and toward the side (z)
    seg.push([dz / len, ds / len]);
  }
  const normals: Pt[] = pts.map((_, k) => {
    if (k === 0) return [1, 0];
    if (k === pts.length - 1) return [0, 1];
    const [a, b] = [seg[k - 1]!, seg[k]!];
    const l = Math.hypot(a[0] + b[0], a[1] + b[1]);
    return [(a[0] + b[0]) / l, (a[1] + b[1]) / l];
  });
  return { pts, S, normals };
}

/**
 * A point on end e's skin: u the arc length round the plan from the face's middle
 * (positive toward +z), past the corner along the side wall; v the height; d off the
 * skin along its normal. So paint, glass and lamps wrap round the corners.
 */
function wrapAt(sp: ShellSpec, e: number): Place {
  return (u, v, d) => {
    const { pts, S, normals } = planOf(sp, v);
    const a = Math.abs(u), sg = u < 0 ? -1 : 1;
    const last = pts.length - 1, total = S[last]!;
    let z: number, sb: number, nx: number, nz: number;
    if (a >= total) [z, sb, nx, nz] = [pts[last]![0], pts[last]![1] + (a - total), 0, 1];
    else {
      let k = 0;
      while (k < last - 1 && S[k + 1]! < a) k++;
      const t = (a - S[k]!) / (S[k + 1]! - S[k]!);
      z = pts[k]![0] + t * (pts[k + 1]![0] - pts[k]![0]);
      sb = pts[k]![1] + t * (pts[k + 1]![1] - pts[k]![1]);
      const [n0, n1] = [normals[k]!, normals[k + 1]!];
      const [mx, mz] = [n0[0] + t * (n1[0] - n0[0]), n0[1] + t * (n1[1] - n0[1])];
      const l = Math.hypot(mx, mz);
      [nx, nz] = [mx / l, mz / l];
    }
    return [e * (sp.tip(v) - sb + d * nx), v, sg * (z + d * nz)];
  };
}

/** The plan's arc lengths at the face's straight heights (the breaks a wrapped panel is cut at), both sides. */
function wrapBreaks(sp: ShellSpec): number[] {
  const { S } = planOf(sp, 2.0);
  return [...S.slice(1), ...S.slice(1).map((s) => -s)].sort((a, b) => a - b);
}

/** The arc length at which the plan reaches |z| = z (on the straight heights). */
function arcAtZ(sp: ShellSpec, zz: number): number {
  const { pts, S } = planOf(sp, 2.0);
  for (let k = 1; k < pts.length; k++)
    if (pts[k]![0] >= zz) return S[k - 1]! + ((zz - pts[k - 1]![0]) / (pts[k]![0] - pts[k - 1]![0])) * (S[k]! - S[k - 1]!);
  return S[S.length - 1]!;
}

/** The plan's whole arc length to the corner's end. */
const arcTotal = (sp: ShellSpec): number => planOf(sp, 2.0).S.at(-1)!;

const mirrorU = (q: Ring): Ring => q.map(([u, v]) => [-u, v] as Pt).reverse();
const ccw = (q: Ring): Ring => {
  let a = 0;
  for (let i = 0; i < q.length; i++) a += q[i]![0] * q[(i + 1) % q.length]![1] - q[(i + 1) % q.length]![0] * q[i]![1];
  return a > 0 ? q : [...q].reverse();
};

/** The convex hull of points (u, v), counter-clockwise. */
function hull(points: readonly Pt[]): Ring {
  const p = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Pt[] = [], upper: Pt[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, q) <= 0) lower.pop();
    lower.push(q);
  }
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, q) <= 0) upper.pop();
    upper.push(q);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/** An arc of points about (cu, cv), radius r, from angle a0 to a1 (degrees), n steps. */
const arcPts = (cu: number, cv: number, r: number, a0: number, a1: number, n: number): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
    return [cu + r * Math.cos(a), cv + r * Math.sin(a)];
  });

interface Ctx {
  m: MeshBuilder;
  sp: ShellSpec;
  vB: readonly number[];
  uB: readonly number[];
  total: number;
}

/** A panel on both ends' wrapped skin, `q` given for the +z half (mirrored to -z unless `centre`). */
function wrapped(x: Ctx, name: string, mat: string, q: Ring, d0: number, d1: number, centre = false): void {
  x.m.scope(name, () => {
    for (const e of [-1, 1]) {
      const at = wrapAt(x.sp, e);
      const n: Vec3 = [e, 0, 0];
      const polys = centre ? [ccw(q)] : [ccw(q), ccw(mirrorU(q))];
      x.m.scope(e > 0 ? "front" : "rear", () => {
        for (const p of polys) surfacePanel(x.m, mat, at, n, p, d0, d1, x.uB, x.vB);
      });
    }
  });
}

/** A window on the wrapped skin: the frame, the glass, an optional wiper. */
function wrappedWindow(x: Ctx, name: string, u: Span, y: Span, frame: string, wiper: boolean): void {
  wrapped(x, `${name} frame`, frame, rect(u[0], y[0], u[1], y[1]), -0.01, 0.014);
  wrapped(x, `${name} glass`, "glass", rect(u[0] + 0.035, y[0] + 0.035, u[1] - 0.035, y[1] - 0.035), -0.005, 0.022);
  if (wiper) {
    // parked hanging from the pane's head over its inner half
    const arm: Ring = [[u[0] + 0.2, y[1] - 0.07], [u[0] + 0.23, y[1] - 0.07], [u[0] + 0.43, y[0] + 0.12], [u[0] + 0.4, y[0] + 0.12]];
    wrapped(x, `${name} wiper`, "wiper", arm, 0.024, 0.036);
  }
}

/** A tangent frame on end e's skin at (u0, v0) of side sg: (a, b, d) along the skin, up and out. */
function tangentAt(sp: ShellSpec, e: number, u0: number, v0: number): { at: Place; n: Vec3 } {
  const w = wrapAt(sp, e);
  const p = w(u0, v0, 0), q = w(u0, v0, 1);
  const n: Vec3 = [q[0] - p[0], 0, q[2] - p[2]];
  const t0 = w(u0 - 0.01, v0, 0), t1 = w(u0 + 0.01, v0, 0);
  const tl = Math.hypot(t1[0] - t0[0], t1[2] - t0[2]);
  const t: Vec3 = [(t1[0] - t0[0]) / tl, 0, (t1[2] - t0[2]) / tl];
  return { n, at: (a, b, d) => [p[0] + (a - u0) * t[0] + d * n[0], b, p[2] + (a - u0) * t[2] + d * n[2]] };
}

/** A round lamp standing out of the skin: the housing (or rim) and the lens. */
function lamp(x: Ctx, name: string, u: number, y: number, r: number, housing: string, lens: string, depth: number): void {
  x.m.scope(name, () => {
    for (const e of [-1, 1])
      for (const sg of [-1, 1])
        x.m.scope(`${e > 0 ? "front" : "rear"} ${sg > 0 ? "right" : "left"}`, () => {
          const { at, n } = tangentAt(x.sp, e, sg * u, y);
          x.m.scope("housing", () => surfacePanel(x.m, housing, at, n, ngon(14, r + 0.045, 0, sg * u, y), -0.04, depth));
          x.m.scope("lens", () => surfacePanel(x.m, lens, at, n, ngon(14, r, 0, sg * u, y), -0.03, depth + 0.012));
        });
  });
}

/** Letters on both ends' faces about the middle (u = 0): `text` h high, its baseline at v. */
function faceText(x: Ctx, name: string, mat: string, text: string, v: number, h: number, d: number, weight = 0.17): void {
  const w = wordWidth(text, h, { weight });
  x.m.scope(name, () => {
    for (const e of [-1, 1]) {
      const at = wrapAt(x.sp, e);
      // seen from ahead +z is on the reader's left: read toward -z at the front
      const tris = letters(text, e > 0 ? w / 2 : -w / 2, v, h, e > 0, { weight });
      x.m.scope(e > 0 ? "front" : "rear", () => x.m.facets(mat, tris.map(([u, vv]) => at(u, vv, d)), [e, 0, 0]));
    }
  });
}

function face(x: Ctx, l: Livery): void {
  const T = x.total;
  const uLamp = arcAtZ(x.sp, LAMP.z);
  const sideU = (xx: number) => T + (SIDE_END - xx);
  // the sill ledge round the front and along the cab's side windows
  wrapped(x, "sill ledge", "alu", rect(-sideU(4.35), SILL - 0.05, sideU(4.35), SILL), -0.01, 0.05, true);
  // the face's foot ledge over the apron, round the corners to the side
  wrapped(x, "foot ledge", l.ledge, rect(-(T - 0.25), FOOT - 0.035, T - 0.25, FOOT + 0.02), -0.01, 0.06, true);
  // the headstock panel of the apron (the Capitole's grey; the vert's in the body colour)
  if (l.apron !== "body") wrapped(x, "apron", l.apron, rect(-1.0, Y0 + 0.02, 1.0, FOOT - 0.04), 0.0, 0.004, true);
  // the windscreens, the corner windows
  wrappedWindow(x, "windscreen", [0.045, 0.87], SCREEN, "rim", true);
  wrappedWindow(x, "corner window", [arcAtZ(x.sp, 0.95), T - 0.07], SCREEN, "rim", false);
  // the band (or line) round the corner to the headlight, the wing over it sweeping back from the lamp
  wrapped(x, "band corner", l.bandMat, rect(uLamp, l.band[0], T, l.band[1]), 0.001, 0.003);
  const wingFront = arcPts(uLamp, LAMP.y, 0.21, 90, 270, 8);
  wrapped(x, "lamp wing", "alu", hull([...wingFront, [T - 0.04, l.wingTip[0]], [T - 0.04, l.wingTip[1]]]), 0.001, 0.006);
  // the moustache: the band under the sill ledge, wrapping onto the side to a point
  const tipU = sideU(5.45);
  wrapped(x, "moustache", "alu", [[0, MOUSTACHE[0]], [T - 0.4, MOUSTACHE[0]], [tipU, MOUSTACHE[1] - 0.015], [tipU, MOUSTACHE[1]], [0, MOUSTACHE[1]]], 0.001, 0.004);
  // its wings curving down from the band to the disc
  wrapped(x, "moustache wing", "alu", [[0.2, DISC.y - 0.1], [0.78, MOUSTACHE[0] + 0.01], [0.48, MOUSTACHE[0] + 0.01], [0.21, DISC.y + 0.12]], 0.001, 0.004);
  // the SNCF disc: the aluminium ring, the field, the letters
  wrapped(x, "disc ring", "alu", ngon(18, DISC.r, 0, 0, DISC.y), 0.001, 0.008, true);
  wrapped(x, "disc", l.disc, ngon(18, DISC.r - 0.04, 0, 0, DISC.y), 0.001, 0.011, true);
  faceText(x, "disc letters SN", l.discText, "SN", DISC.y + 0.005, 0.1, 0.0125, 0.2);
  faceText(x, "disc letters CF", l.discText, "CF", DISC.y - 0.115, 0.1, 0.0125, 0.2);
  // the number plate standing on the moustache
  wrapped(x, "number plate", l.plate, rect(-0.29, 2.715, 0.29, 2.905), -0.01, 0.018, true);
  faceText(x, "plate number", l.plateText, l.number, 2.76, 0.1, 0.0195, 0.16);
  // the headlights in chrome rims on the corners, the small marker lamps
  lamp(x, "headlight", uLamp, LAMP.y, LAMP.r, "chrome", "lampHead", 0.075);
  if (l.markers) lamp(x, "marker lamp", 0.88, 1.7, 0.055, "chrome", "lampRed", 0.05);
  if (l.shield) {
    // the CAPITOLE shield: a white outline and lettering on the red, pointed below
    const shield = (i: number): Ring => [[-0.565 + i, 2.29 - i], [0.565 - i, 2.29 - i], [0.53 - i, 2.0], [0, 1.7 + i * 1.6], [-0.53 + i, 2.0]];
    wrapped(x, "shield", "whiteLetter", ccw(shield(0)), 0.001, 0.004, true);
    wrapped(x, "shield field", "body", ccw(shield(0.035)), 0.001, 0.006, true);
    faceText(x, "shield letters", "whiteLetter", "CAPITOLE", 2.03, 0.13, 0.007, 0.15);
  }
}

/** The rounded rear cab window (rounded toward the machine room) on both sides at both ends. */
function roundWindows(m: MeshBuilder, sp: ShellSpec, vB: readonly number[]): void {
  const [x0, x1] = ROUND_WIN, [y0, y1] = SIDE_WIN_Y;
  const r = (y1 - y0) / 2;
  const outline = (inset: number): Ring => ccw([[x1 - inset, y0 + inset], [x1 - inset, y1 - inset], ...arcPts(x0 + r, (y0 + y1) / 2, r - inset, 90, 270, 8)]);
  m.scope("rounded cab windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const f = (q: Ring): Ring => (e > 0 ? q : ccw(q.map(([u, v]) => [-u, v] as Pt)));
          m.scope("frame", () => surfacePanel(m, "rim", at, n, f(outline(0)), -0.01, 0.014, [], vB));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, f(outline(0.035)), -0.005, 0.022, [], vB));
        });
  });
}

/** The number toward one end of each side and "SNCF" toward the other, point symmetric. */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const h = 0.16, y = 1.6;
  const style = { weight: 0.14 };
  const sncf = { weight: 0.14, gap: 0.9 };
  const nw = wordWidth(l.number, h, style), sw = wordWidth("SNCF", h, sncf);
  m.scope("side lettering", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        // the reader's right is +x on the right side, -x on the left; the number toward this side's +sd end
        const put = (text: string, cx: number, w: number, st: object) => {
          const tris = letters(text, sd > 0 ? cx - w / 2 : cx + w / 2, y, h, sd < 0, st);
          m.facets(l.lettering, tris.map(([u, v]) => at(u, v, 0.006)), n);
        };
        m.scope("number", () => put(l.number, sd * 3.75, nw, style));
        m.scope("SNCF", () => put("SNCF", -sd * 3.75, sw, sncf));
      });
  });
}

/** The headstocks under the face, the buffers' and the coupling's beam. */
function headstocks(m: MeshBuilder): void {
  m.scope("headstocks", () => {
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [N - 0.3, N + 0.04] : [-N - 0.04, -N + 0.3];
      m.scope(e > 0 ? "front" : "rear", () => block(m, "beam", a, b, 0.78, Y0 + 0.02, -1.36, 1.36));
    }
  });
}

/** The marker lamps on each cab's dome: a housing in the body colour, a lens facing ahead. */
function domeLamps(m: MeshBuilder, sp: ShellSpec): void {
  const y = 3.8, z = 0.62;
  m.scope("dome lamps", () => {
    for (const e of [-1, 1])
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "right" : "left"}`, () => {
          const x = wrapAt(sp, e)(s * z, y, 0)[0];
          const [a, b] = e > 0 ? [x - 0.14, x + 0.02] : [x - 0.02, x + 0.14];
          m.sweep("body", "x", ngon(10, 0.055, 0, s * z, y + 0.03), a, ngon(10, 0.055, 0, s * z, y + 0.03), b);
          const [l0, l1] = e > 0 ? [x + 0.015, x + 0.03] : [x - 0.03, x - 0.015];
          m.scope("lens", () => m.sweep("lampHead", "x", ngon(10, 0.038, 0, s * z, y + 0.03), l0, ngon(10, 0.038, 0, s * z, y + 0.03), l1));
        });
  });
}

/** The roof line: a busbar on post insulators along the roof walk between the pantographs, the main breaker. */
function roofLine(m: MeshBuilder): void {
  const y = WALK_TOP + 0.34;
  m.scope("roof line", () => {
    for (const x of [-3.6, -1.2, 1.2, 3.6]) insulator(m, x, 0.5, WALK_TOP - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -(PANTO_X - 0.6), y, 0.5, PANTO_X - 0.6, y, 0.5, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.45, 0.45, WALK_TOP - 0.01, WALK_TOP + 0.16, -0.62, -0.12);
      insulator(m, 0, -0.37, WALK_TOP + 0.15, y - 0.02);
    });
  });
}

/** The air tanks under the frame between the bogies. */
function tanks(m: MeshBuilder): void {
  m.scope("air tanks", () => {
    for (const z of [-0.95, 0.95]) tubeX(m, "underframe", 0.2, -2.3, 0.72, z, 2.3, 0.72, z, 12);
  });
}

/** The BB 9200 in a livery. */
export function sncfBb9200(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  const vB = kinks(TIP, HW);
  const x: Ctx = { m, sp, vB, uB: wrapBreaks(sp), total: arcTotal(sp) };
  m.scope("body", () => {
    m.scope("cab ends", () => face(x, l));
    roundWindows(m, sp, vB);
    sideLettering(m, sp, l);
    headstocks(m);
    domeLamps(m, sp);
    tanks(m);
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/**
 * The distant model: the kit's box locomotive from the same profile, the band (or
 * line) painted along the shell, the window band round the cab including the corner
 * windows, the cab side windows.
 */
export function sncfBb9200Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  // a coarser profile (the window band's lean and the visor's lip dropped) so the windows stay within the budget
  const tip: Table = [[Y0, N - 0.12], [1.3, N], [SILL, N], [SILL + 0.01, N - 0.08], [3.7, N - 0.08], [3.82, N - 0.3], [CROWN, N - 0.85]];
  const hw: Table = [[Y0, W - 0.07], [1.3, W], [3.66, W], [3.8, W - 0.17], [CROWN, W - 0.85]];
  const body: Band[] = [[Y0, CROWN, "body"]];
  const side: Band[] = l.bandMat === "alu" ? body : [[Y0, l.band[0], "body"], [l.band[0], l.band[1], l.bandMat], [l.band[1], CROWN, "body"]];
  const ends: EndItem[] = [{ kind: "window", name: "windscreens", z: [-1.35, 1.35], y: SCREEN }];
  // the cab side windows as one band
  const sideItems: SideItem[] = [...s.sideItems.filter((i) => i.kind !== "window"), { kind: "window", name: "cab windows", x: [ROUND_WIN[0], SIDE_WIN[0]![1]], y: SIDE_WIN_Y, mirror: true }];
  return boxLocoLod({ ...s, tip, hw, side, end: body, endItems: ends, sideItems });
}
