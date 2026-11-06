// The Burlington's Pioneer Zephyr (Budd, 1934): three shot-welded stainless
// cars on Jacobs bogies, measured from the Railway Age drawing of April 1934
// (assets/pioneer-zephyr/). The power car's shovel nose is its own hull: the
// car's cross-section drawn as horizontal waterlines, each one a U in plan --
// a flat front panel, a quarter ellipse round the corner and the straight side
// -- set back by the nose's side profile (the raked pilot, the ribbed belt, the
// leaning face with the Burlington Route plate, the wrap-round windscreen, the
// dome with its two arched grilles and the headlight on top). Behind it the car
// is the carbody kit's slice body (carbodyKit.ts) on the same section, so the
// hull closes on it exactly; the coach and the observation car (its round
// lounge end a slice nose) are drawn by the shared car builder (usTransit.ts
// drawCar). Real size on the US loading gauge. See docs/models/pioneer-zephyr.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { MeshBuilder as Builder, ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { bogieGeometry, paint } from "./dieselParts.ts";
import { lerp, type Pt } from "./sliceLoft.ts";
import { crownPane, halfSlice, sideDecal, sideLettering, sidePane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { CARBODY_PALETTE, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type NoseShape, type Painter } from "./carbodyKit.ts";
import { decalX, knuckleCoupler } from "./usHoodKit.ts";
import { enumParam } from "./emuParts.ts";
import { RAIL_CATALOG } from "./cd163.ts";
import { articulate } from "./tramKit.ts";
import { LOD_GLASS, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { bogieParts, fitUnit, roofPart, type UnitBody } from "./lodUnits.ts";
import { carLodBody, drawCar, truckSpec, type CarDef } from "./usTransit.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

export type ZephyrCar = "powerCar" | "coach" | "observation";
export type ZephyrUnit = ZephyrCar | "train";
export const ZEPHYR_PARAMS: readonly ParamSpec[] = [enumParam("unit", "Car", { powerCar: "Power car", coach: "Coach", observation: "Observation", train: "Full train" })];

/**
 * Each car between its articulation joints (the power car from its pilot's tip,
 * the observation car to its tail's): the drawing's 13 ft 6 in to the motor
 * truck and 60 ft 8 1/2 in to the first Jacobs bogie, 57 ft 8 in between the
 * Jacobs bogies, 53 ft 7 in to the rear truck and 11 ft 5 in beyond it.
 */
export const ZEPHYR_LENGTH: Record<ZephyrCar, number> = { powerCar: 22.6, coach: 17.6, observation: 19.8 };
/** A body's end short of its joint plane. */
const GAP = 0.15;
/** The hull nose's length from the tip, where the slice body takes over. */
const NOSE = 2.4;
/** The motor truck's centre from the tip and the observation car's rear truck from its joint. */
export const ZEPHYR_MOTOR_TRUCK = ft(13, 6);
const REAR_TRUCK = ft(53, 7);
/** A lone car's own truck this far inside its joint plane (in the train the Jacobs bogie stands at the joint). */
const OWN_TRUCK = 2.2;
/** The skirt's cut at a joint over the Jacobs bogie, from the body's end. */
const JACOBS_CUT = 1.75;
/** The skirt's cut-outs round up into arches over the trucks. */
const CUT_RADIUS = 0.55;

const PAL = {
  ss: paint("#c9cdd0", 0.28),
  ssDark: paint("#8f9396", 0.4),
  ssFlute: paint("#55595c", 0.5),
  ssRib: paint("#e3e6e8", 0.22),
  zBlack: paint("#1f2022"),
  grille: paint("#202225", 0.7),
  plateRed: paint("#b3262b"),
  plateWhite: paint("#eeeeea"),
  under: paint("#2a2c2f", 0.85),
};

/** The section every car shares: 9 ft 1 in wide, 12 ft 1 in over the roof (the power car's cowl higher). */
const SEC = { W: 1.385, Y: 1.15, S: 2.95, C: 3.69, lean: 0.975, arc: 8, B: 0.32, wl: 1.34, A: 1.0, wa: 1.375 } as const;
/** The window band (sill and head) and its rows, the ribbed belt, the side fluting above it. */
const SILL = 2.05;
const HEAD = 2.85;
const EDGES = [SILL, HEAD];
const RIBS: ReadonlyArray<readonly [number, number]> = [[1.17, 1.205], [1.235, 1.27], [1.3, 1.335], [1.365, 1.4]];
const BELT: readonly [number, number] = [1.155, 1.41];
const FLUTE = { y0: 1.46, y1: 1.98, pitch: 0.08 };
const FLUTE_H = 0.034;
/** The power car's cowl over the engine room (the drawing's roof hump) and where it falls to the roof. */
const COWL = 3.9;
const COWL_S = 3.15;
const COWL_END: readonly [number, number] = [8.8, 10.4];

const truck = (wheelR: number) => truckSpec(ft(8), wheelR, SEC.B + 0.23);
const MOTOR = truck(ft(0, 18));
const RIDE = truck(ft(0, 15));

// ---------------------------------------------------------------------------
// The nose hull

/** The nose's side profile: [y, d of its foremost point], bottom up. */
const PROFILE: Pt[] = [[0.32, 0.0], [1.0, 0.33], [1.15, 0.38], [2.05, 0.72], [2.85, 1.07], [3.15, 1.15]];
/** Over the shoulder the dome rounds back to the cowl's crown: a quarter ellipse on the windscreen's rake. */
const DOME = { y0: 3.15, f0: 1.15, rake: 0.27, back: 0.5 };
const setback = (y: number): number => {
  if (y <= DOME.y0) return lerp(PROFILE, y);
  const u = Math.min(1, (y - DOME.y0) / (COWL - DOME.y0));
  return DOME.f0 + DOME.rake * (y - DOME.y0) + DOME.back * (1 - Math.sqrt(Math.max(0, 1 - u * u)));
};
/** How far behind its tip each waterline reaches the full width, and its flat front panel's share of the half width. */
const PLAN_LEN: Pt[] = [[0.32, 1.9], [2.0, 1.7], [3.15, 1.3], [3.9, 0.5]];
const TIP = 0.38;

/** A waterline of the hull: its height, full half width, setback and plan length. */
interface Waterline { y: number; z: number; f: number; L: number }

/** The hull's waterlines: the slice body's own section at the joint, point by point. */
function waterlines(b: SliceBody): Waterline[] {
  return halfSlice(b, 0).map(([z, y]) => {
    const f = setback(y);
    return { y, z, f, L: Math.min(lerp(PLAN_LEN, y), NOSE - f - 0.03) };
  });
}

/** A waterline's point at q: 0..1 across the flat front, 1..2 round the corner (a quarter ellipse), 2..3 along the side to the joint. [d, z]. */
function ringPoint(w: Waterline, q: number): Pt {
  if (q <= 1) return [w.f, q * TIP * w.z];
  if (q <= 2) {
    const t = ((q - 1) * Math.PI) / 2;
    return [w.f + w.L * (1 - Math.cos(t)), w.z * (TIP + (1 - TIP) * Math.sin(t))];
  }
  return [w.f + w.L + (NOSE - w.f - w.L) * (q - 2), w.z];
}

/** The hull's columns: the flat panel, the corner, the side, every pane edge among them. */
const PANES: ReadonlyArray<readonly [number, number]> = [[0.035, 0.955], [1.045, 1.47], [1.53, 1.96]];
const COLUMNS: number[] = [...new Set([
  0, 0.35, 0.7, 1, ...Array.from({ length: 14 }, (_, i) => 1 + (i + 1) / 14), 2.5, 3,
  ...PANES.flat(),
].map((q) => Math.round(q * 10000) / 10000))].sort((a, b) => a - b);

/** The nose hull: waterlines, X(d) its map to model x, and points on it. */
interface Hull {
  rows: Waterline[];
  X: (d: number) => number;
  /** The point on the hull at q and height y on side s (between waterlines, straight between theirs). */
  at: (q: number, y: number, s: number) => Vec3;
  /** Its outward normal there. */
  normal: (q: number, y: number, s: number) => Vec3;
  /** The q at half width z and height y (on the front and round the corner). */
  qOf: (z: number, y: number) => number;
}

function makeHull(b: SliceBody, X: (d: number) => number): Hull {
  const rows = waterlines(b);
  // the waterlines bottom up with distinct heights (the bottom's centre line and its rim share one)
  const span = (y: number): [Waterline, Waterline, number] => {
    for (let k = 1; k + 1 < rows.length; k++) {
      const [lo, hi] = [rows[k]!, rows[k + 1]!];
      if (y <= hi.y + 1e-9 || k + 2 === rows.length) return [lo, hi, hi.y - lo.y < 1e-9 ? 0 : Math.min(1, Math.max(0, (y - lo.y) / (hi.y - lo.y)))];
    }
    return [rows[1]!, rows[2]!, 0];
  };
  const at = (q: number, y: number, s: number): Vec3 => {
    const [lo, hi, t] = span(y);
    const [pa, pb] = [ringPoint(lo, q), ringPoint(hi, q)];
    return [X(pa[0] + (pb[0] - pa[0]) * t), y, s * (pa[1] + (pb[1] - pa[1]) * t)];
  };
  const normal = (q: number, y: number, s: number): Vec3 => {
    const dq = 0.01, dy = 0.01;
    const tq = sub(at(Math.min(3, q + dq), y, s), at(Math.max(0, q - dq), y, s));
    const ty = sub(at(q, y + dy, s), at(q, y - dy, s));
    let n = unit(cross(tq, ty));
    // outward: away from a point behind the nose on the car's axis
    const p = at(q, y, s);
    const c: Vec3 = [X(NOSE + 1), 2.1, 0];
    if (dot(n, sub(p, c)) < 0) n = [-n[0], -n[1], -n[2]];
    return n;
  };
  const qOf = (z: number, y: number): number => {
    const [lo, hi, t] = span(y);
    const zk = lo.z + (hi.z - lo.z) * t;
    if (z <= TIP * zk) return z / (TIP * zk);
    const r = Math.min(1, Math.max(0, (z / zk - TIP) / (1 - TIP)));
    return 1 + (Math.asin(r) * 2) / Math.PI;
  };
  return { rows, X, at, normal, qOf };
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a: Vec3, k: number): Vec3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / Math.max(1e-12, Math.hypot(...a)));

/** A triangle wound to face along `out`. */
function tri(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, out: Vec3): void {
  if (dot(cross(sub(b, a), sub(c, a)), out) >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** What a hull face is painted: the windscreen's panes in the window band, the bottom, the steel. */
function hullPaint(q: number, y0: number, y1: number): string {
  if (y1 - y0 < 1e-9) return "under";
  if (y0 >= SILL - 1e-6 && y1 <= HEAD + 1e-6) return PANES.some(([a, b]) => q > a && q < b) ? "cabGlass" : "ss";
  return "ss";
}

/** The hull's shell on both sides: waterline to waterline, column to column. */
function hullShell(m: MeshBuilder, h: Hull): void {
  const { rows, X } = h;
  for (const s of [1, -1])
    for (let k = 0; k + 1 < rows.length; k++) {
      const [lo, hi] = [rows[k]!, rows[k + 1]!];
      for (let i = 0; i + 1 < COLUMNS.length; i++) {
        const [qa, qb] = [COLUMNS[i]!, COLUMNS[i + 1]!];
        const P = (w: Waterline, q: number): Vec3 => { const [d, z] = ringPoint(w, q); return [X(d), w.y, s * z]; };
        const [a, bq, c, d] = [P(lo, qa), P(lo, qb), P(hi, qb), P(hi, qa)];
        const mid = mul(add(add(a, bq), add(c, d)), 0.25);
        const out = sub(mid, [X(NOSE + 1), 2.1, 0]);
        const mat = hullPaint((qa + qb) / 2, lo.y, hi.y);
        tri(m, mat, a, bq, c, out);
        tri(m, mat, a, c, d, out);
      }
    }
}

/**
 * A patch laid on the hull, `proud` off it: over half widths z0(y)..z1(y)
 * (measured round the nose) from y0 to y1, on the hull's own waterlines in y
 * and `nz` columns across.
 */
function hullPatch(m: MeshBuilder, h: Hull, s: number, mat: string, y0: number, y1: number, z0: (y: number) => number, z1: (y: number) => number, proud: number, nz = 6): void {
  const ys = [y0, ...h.rows.map((w) => w.y).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6), y1];
  const uniq = [...new Set(ys)].sort((a, b) => a - b);
  const P = (y: number, j: number): Vec3 => {
    const [za, zb] = [z0(y), z1(y)];
    const q = h.qOf(za + ((zb - za) * j) / nz, y);
    return add(h.at(q, y, s), mul(h.normal(q, y, s), proud));
  };
  for (let r = 0; r + 1 < uniq.length; r++)
    for (let j = 0; j < nz; j++) {
      const [a, b, c, d] = [P(uniq[r]!, j), P(uniq[r]!, j + 1), P(uniq[r + 1]!, j + 1), P(uniq[r + 1]!, j)];
      const q = h.qOf((z0(uniq[r]!) + z1(uniq[r]!)) / 2, uniq[r]!);
      const n = h.normal(q, (uniq[r]! + uniq[r + 1]!) / 2, s);
      tri(m, mat, a, b, c, n);
      tri(m, mat, a, c, d, n);
    }
}

/** A band of height y0..y1 round the whole nose on side s, from the centre line to the joint. */
function hullBand(m: MeshBuilder, h: Hull, s: number, mat: string, y0: number, y1: number, proud: number): void {
  const ys = [y0, y1];
  const cols = COLUMNS;
  for (let j = 0; j + 1 < cols.length; j++) {
    const P = (y: number, q: number): Vec3 => add(h.at(q, y, s), mul(h.normal(q, y, s), proud));
    const [a, b, c, d] = [P(ys[0]!, cols[j]!), P(ys[0]!, cols[j + 1]!), P(ys[1]!, cols[j + 1]!), P(ys[1]!, cols[j]!)];
    const n = h.normal((cols[j]! + cols[j + 1]!) / 2, (y0 + y1) / 2, s);
    tri(m, mat, a, b, c, n);
    tri(m, mat, a, c, d, n);
  }
}

/** The grilles' arch on each side of the centre pillar: [z, top y] -- a round head over the windscreen. */
const GRILLE = { y0: 2.935, rise: 0.8, z0: 0.12, z1: 1.18 };
const grilleTop = (z: number): number => {
  const [c, r] = [(GRILLE.z0 + GRILLE.z1) / 2, (GRILLE.z1 - GRILLE.z0) / 2];
  const u = Math.min(1, Math.abs(z - c) / r);
  return GRILLE.y0 + GRILLE.rise * Math.sqrt(Math.max(0, 1 - u * u));
};

/** The power car's nose: the hull, its windscreen frames, the belt, the plate, the grilles, the lamps. */
function drawNose(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const h = makeHull(b, X);
  m.scope("hull", () => hullShell(m, h));
  m.scope("belt", () => {
    for (const s of [1, -1]) {
      hullBand(m, h, s, "ssDark", BELT[0], BELT[1], 0.006);
      for (const [y0, y1] of RIBS) hullBand(m, h, s, "ssRib", y0, y1, 0.016);
    }
  });
  m.scope("grilles", () => {
    for (const s of [1, -1]) {
      // the dark opening, then its bars standing on it
      const zs = (y: number): [number, number] => {
        // the half widths where the arch stands at height y
        const [c, r] = [(GRILLE.z0 + GRILLE.z1) / 2, (GRILLE.z1 - GRILLE.z0) / 2];
        const u = Math.sqrt(Math.max(0, 1 - ((y - GRILLE.y0) / GRILLE.rise) ** 2));
        return [c - r * u, c + r * u];
      };
      hullPatch(m, h, s, "grille", GRILLE.y0, GRILLE.y0 + GRILLE.rise - 0.002, (y) => zs(y)[0], (y) => zs(y)[1], 0.008, 10);
      const bars = 15;
      for (let i = 1; i < bars; i++) {
        const z = GRILLE.z0 + ((GRILLE.z1 - GRILLE.z0) * i) / bars;
        const top = grilleTop(z) - 0.02;
        if (top < GRILLE.y0 + 0.05) continue;
        hullPatch(m, h, s, "ss", GRILLE.y0, top, () => z - 0.014, () => z + 0.014, 0.016, 1);
      }
      // the arch's rim: a band round its head, following the dome
      const [c, r] = [(GRILLE.z0 + GRILLE.z1) / 2, (GRILLE.z1 - GRILLE.z0) / 2];
      const rimAt = (phi: number, grow: number): Vec3 => {
        const [z, y] = [c - (r + grow) * Math.cos(phi), GRILLE.y0 + (GRILLE.rise + grow) * Math.sin(phi)];
        const q = h.qOf(z, y);
        return add(h.at(q, y, s), mul(h.normal(q, y, s), 0.012));
      };
      const N = 20;
      for (let i = 0; i < N; i++) {
        const [pa, pb] = [(Math.PI * i) / N, (Math.PI * (i + 1)) / N];
        const [a0, b0, b1, a1] = [rimAt(pa, 0), rimAt(pb, 0), rimAt(pb, 0.04), rimAt(pa, 0.04)];
        const zm = c - r * Math.cos((pa + pb) / 2), ym = GRILLE.y0 + GRILLE.rise * Math.sin((pa + pb) / 2);
        const n = h.normal(h.qOf(zm, ym), ym, s);
        tri(m, "ss", a0, b0, b1, n);
        tri(m, "ss", a0, b1, a1, n);
      }
    }
  });
  m.scope("plate", () => {
    // the Burlington Route plate on the flat front: black, a red border, white lettering
    const [y0, y1, hw] = [1.5, 1.92, 0.42];
    const P = (z: number, y: number, proud: number): Vec3 => add(h.at(h.qOf(Math.abs(z), y), y, Math.sign(z) || 1), mul(h.normal(0.01, y, 1), proud));
    const quad = (mat: string, za: number, zb: number, ya: number, yb: number, proud: number) => {
      const n = h.normal(0.01, (ya + yb) / 2, 1);
      tri(m, mat, P(za, ya, proud), P(zb, ya, proud), P(zb, yb, proud), n);
      tri(m, mat, P(za, ya, proud), P(zb, yb, proud), P(za, yb, proud), n);
    };
    quad("plateRed", -hw, hw, y0, y1, 0.008);
    quad("zBlack", -hw + 0.03, hw - 0.03, y0 + 0.03, y1 - 0.03, 0.012);
    const text = (t: string, yb: number, ht: number) => {
      const w = ht * 0.58, gap = ht * 0.18;
      const width = strokeWidth(t, w, gap);
      const pts = strokeText(t, -width / 2, yb, ht, w, gap, false, ht * 0.14).map(([u, v]) => P(-u, v, 0.016));
      m.facets("plateWhite", pts, h.normal(0.01, (y0 + y1) / 2, 1));
    };
    text("BURLINGTON", 1.74, 0.095);
    text("ROUTE", 1.57, 0.11);
  });
  m.scope("pilot", () => {
    // the coupler's pocket in the pilot
    const P = (z: number, y: number): Vec3 => add(h.at(h.qOf(Math.abs(z), y), y, Math.sign(z) || 1), mul(h.normal(0.01, y, 1), 0.006));
    const n = h.normal(0.01, 0.65, 1);
    const [za, zb, ya, yb] = [-0.2, 0.2, 0.52, 0.76];
    tri(m, "zBlack", P(za, ya), P(zb, ya), P(zb, yb), n);
    tri(m, "zBlack", P(za, ya), P(zb, yb), P(za, yb), n);
  });
  m.scope("number", () => {
    // 9900 on either side of the nose, under the windows
    for (const s of [1, -1]) {
      const ht = 0.2, w = ht * 0.58, gap = ht * 0.18;
      const t = "9900";
      const width = strokeWidth(t, w, gap);
      const e = Math.sign(X(0) - X(1));
      // reads toward the nose on the +z side seen from outside, toward the rear on the -z side
      const dAt = (u: number) => 1.95 + (s * e > 0 ? width / 2 - u : u - width / 2);
      const pts = strokeText(t, 0, 1.62, ht, w, gap, false, ht * 0.14).map(([u, v]): Vec3 => {
        const q = qAtD(h, dAt(u), v);
        return add(h.at(q, v, s), mul(h.normal(q, v, s), 0.01));
      });
      m.facets("zBlack", pts, h.normal(qAtD(h, 1.95, 1.7), 1.7, s));
    }
  });
  m.scope("headlight", () => {
    // on top of the dome between the grilles: its round housing runs back into the dome
    const y = 3.66;
    const x = h.at(0, y, 1)[0];
    m.sweep("ss", "x", ngon(16, 0.235, 0, 0, y), x - 0.45, ngon(16, 0.235, 0, 0, y), x + 0.1);
    m.sweep("black", "x", ngon(16, 0.2, 0, 0, y), x + 0.1, ngon(16, 0.2, 0, 0, y), x + 0.115);
    m.sweep("lampHead", "x", ngon(16, 0.175, 0, 0, y), x + 0.115, ngon(16, 0.175, 0, 0, y), x + 0.13);
  });
  m.scope("marker lamps", () => {
    for (const s of [1, -1]) {
      const [q, y] = [1.9, 3.12];
      const c = add(h.at(q, y, s), mul(h.normal(q, y, s), 0.005));
      const n = h.normal(q, y, s);
      const u = unit(cross([0, 1, 0], n)), v = unit(cross(n, u));
      const ring = (r: number, off: number) => Array.from({ length: 10 }, (_, i): Vec3 => {
        const a = (2 * Math.PI * i) / 10;
        return add(add(c, mul(n, off)), add(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a))));
      });
      m.slab("ss", ring(0.075, 0.05), mul(n, -0.06));
      m.slab("lampHead", ring(0.05, 0.056), mul(n, -0.01));
    }
  });
}

/** The q round the nose where the hull at height y stands at d (behind the corner's start). */
function qAtD(h: Hull, d: number, y: number): number {
  const target = h.X(d);
  const e = Math.sign(h.X(0) - h.X(1));
  let [lo, hi] = [1, 3];
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (e * (h.at(mid, y, 1)[0] - target) > 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// ---------------------------------------------------------------------------
// Sides: the ribbed belt, the fluting, the roof's corrugations

type Hole = readonly [d0: number, d1: number, y0: number, y1: number];

/** The belt's ribs and the fluting above them along a slice body's side from d0 to d1, broken over `holes`. */
function sideSteel(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, holes: readonly Hole[], fluteFrom = d0): void {
  m.scope("belt", () => {
    sidePanel(m, b, X, s, "ssDark", d0, d1, BELT[0], BELT[1], 0.006, 0.004);
    for (const [y0, y1] of RIBS) sidePanel(m, b, X, s, "ssRib", d0, d1, y0, y1, 0.016, 0.008);
  });
  m.scope("fluting", () => {
    for (let y = FLUTE.y0; y + FLUTE_H < FLUTE.y1 + 1e-6; y += FLUTE.pitch) {
      const cuts = holes.filter((h) => y + 0.02 > h[2] && y < h[3]).map((h) => [h[0], h[1]] as const).sort((p, q) => p[0] - q[0]);
      let from = fluteFrom;
      const runs: Array<[number, number]> = [];
      for (const [p, q] of cuts) { if (p > from + 0.05) runs.push([from, Math.min(p, d1)]); from = Math.max(from, q); }
      if (d1 > from + 0.05) runs.push([from, d1]);
      const tris: Pt[] = [];
      for (const [p, q] of runs) tris.push([p, y], [q, y], [q, y + FLUTE_H], [p, y], [q, y + FLUTE_H], [p, y + FLUTE_H]);
      if (tris.length) sideDecal(m, b, X, s, "ssFlute", tris, 0.003);
    }
  });
}

/** The roof's corrugations: strips along the upper side over d0..d1. */
function roofCorrugations(m: MeshBuilder, b: SliceBody, X: (d: number) => number, d0: number, d1: number): void {
  m.scope("roof corrugations", () => {
    for (const s of [1, -1]) for (const z of [1.26, 1.16, 1.04, 0.9]) crownPane(m, b, X, s, "ssDark", [d0, d1], [z - 0.025, z], 0.004);
  });
}

/** A smooth lettering panel set into the fluting, its lettering on it. */
function letterPanel(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, text: string, d: number, width: number, h: number): void {
  m.scope("lettering", () => {
    sidePanel(m, b, X, s, "ss", d - width / 2, d + width / 2, FLUTE.y0 - 0.03, FLUTE.y1 + 0.02, 0.007, 0.004);
    sideLettering(m, b, X, s, text, d, (FLUTE.y0 + FLUTE.y1) / 2 - h / 2, h, "zBlack", 0.012);
  });
}

/** A door's outline (not opening: the power car's crew and mail doors, the baggage doors). */
function doorOutline(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, glass?: readonly [number, number]): void {
  const k = 0.022;
  m.scope("door", () => {
    sidePanel(m, b, X, s, "ssDark", d0, d0 + k, y0, y1, 0.005, 0.004);
    sidePanel(m, b, X, s, "ssDark", d1 - k, d1, y0, y1, 0.005, 0.004);
    sidePanel(m, b, X, s, "ssDark", d0 + k, d1 - k, y1 - k, y1, 0.005, 0.004);
    if (glass) {
      sidePanel(m, b, X, s, "zBlack", d0 + 0.1, d1 - 0.1, glass[0], glass[1], 0.006, 0.004);
      sidePanel(m, b, X, s, "glass", d0 + 0.13, d1 - 0.13, glass[0] + 0.03, glass[1] - 0.03, 0.01, 0.004);
    }
    // the handle
    sidePanel(m, b, X, s, "ssDark", (d0 + d1) / 2 + 0.25 * (d1 - d0) - 0.02, (d0 + d1) / 2 + 0.25 * (d1 - d0) + 0.02, 1.75, 1.95, 0.01, 0.006);
  });
}

/** A small window with its frame (a mail window's bars across it). */
function smallWindow(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d0: number, d1: number, y0: number, y1: number, bars = 0): void {
  m.scope("window", () => {
    sidePanel(m, b, X, s, "zBlack", d0, d1, y0, y1, 0.006, 0.03);
    sidePanel(m, b, X, s, "glass", d0 + 0.04, d1 - 0.04, y0 + 0.04, y1 - 0.04, 0.012, 0.004);
    for (let i = 1; i <= bars; i++) {
      const y = y0 + ((y1 - y0) * i) / (bars + 1);
      sidePanel(m, b, X, s, "ss", d0 + 0.04, d1 - 0.04, y - 0.012, y + 0.012, 0.018, 0.004);
    }
  });
}

// ---------------------------------------------------------------------------
// The power car

/** The slice body behind the nose: d from the hull's joint (NOSE behind the tip) to the car's rear end. */
function powerBody(lone: boolean): SliceBody {
  const length = ZEPHYR_LENGTH.powerCar - NOSE - GAP;
  const cowl: NoseShape = { len: 0.001, tip: 1, power: 2, C: [[0, COWL], [COWL_END[0] - NOSE, COWL], [COWL_END[1] - NOSE, SEC.C]], S: [[0, COWL_S], [COWL_END[0] - NOSE, COWL_S], [COWL_END[1] - NOSE, SEC.S]] };
  const motor = ZEPHYR_MOTOR_TRUCK - NOSE;
  const own = ZEPHYR_LENGTH.powerCar - OWN_TRUCK - NOSE;
  const spec: CarbodySpec = { length, ...SEC, arc: 12, cutRadius: CUT_RADIUS, front: cowl, cuts: [[Math.max(0.05, motor - 1.55), motor + 1.55], lone ? [own - 1.5, own + 1.5] : [length - JACOBS_CUT, length + 0.01]], edges: EDGES, step: 1.0, noseStep: 0.8 };
  return carbody(spec);
}

const POWER_PAINT: Painter = (_d, _y, region) => (region === "bottom" ? "under" : "ss");

/** The power car facing +X, its tip at model x = tip. `lone`: its own rear truck, diaphragm and coupler. */
function drawPowerCar(m: MeshBuilder, tip: number, lone: boolean): void {
  const b = powerBody(lone);
  const L = b.length;
  const X = (d: number) => tip - NOSE - d;
  const Xn = (d: number) => tip - d;
  const at = (dTip: number) => dTip - NOSE; // the body's d of a distance from the tip
  m.scope("body", () => {
    m.scope("nose", () => drawNose(m, b, Xn));
    m.scope("shell", () => carbodyShell(m, b, X, POWER_PAINT));
    const crew: Hole = [at(2.5), at(3.1), 1.15, 2.92];
    const rpoDoor: Hole = [at(10.1), at(11.2), 1.15, 2.92];
    const mailDoor: Hole = [at(17.6), at(18.8), 1.15, 2.92];
    const plate: Hole = [at(5.0), at(9.4), FLUTE.y0 - 0.04, FLUTE.y1 + 0.03];
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        sideSteel(m, b, X, s, 0, L - 0.25, [crew, rpoDoor, mailDoor, plate], at(3.2));
        doorOutline(m, b, X, s, crew[0], crew[1], crew[2], crew[3], [2.2, 2.7]);
        doorOutline(m, b, X, s, rpoDoor[0], rpoDoor[1], rpoDoor[2], rpoDoor[3]);
        doorOutline(m, b, X, s, mailDoor[0], mailDoor[1], mailDoor[2], mailDoor[3]);
        letterPanel(m, b, X, s, "BURLINGTON", at(7.2), 4.4, 0.3);
        // the railway post office's barred windows and its lettering
        for (const d of [11.75, 12.5, 15.2, 16.0]) smallWindow(m, b, X, s, at(d), at(d + 0.6), 2.15, 2.72, 3);
        smallWindow(m, b, X, s, at(19.5), at(20.1), 2.15, 2.72, 0);
        m.scope("lettering", () => {
          sideLettering(m, b, X, s, "UNITED STATES MAIL", at(13.85), 2.52, 0.11, "zBlack", 0.008);
          sideLettering(m, b, X, s, "RAILWAY POST OFFICE", at(13.85), 2.3, 0.11, "zBlack", 0.008);
        });
      });
    roofCorrugations(m, b, X, at(COWL_END[1] + 0.2), L - 0.3);
  });
  m.scope("rear end", () => {
    if (!lone) return;
    endDiaphragm(m, -1, X(L), 1.15, 3.0, 0.55);
    m.scope("coupler", () => knuckleCoupler(m, -1, -X(L) - 0.3, -X(L) + GAP, 0.88));
  });
  m.scope("running gear", () => {
    m.scope("motor truck", () => m.bogie(() => bogieGeometry(m, tip - ZEPHYR_MOTOR_TRUCK, MOTOR)));
    if (lone) m.scope("truck", () => m.bogie(() => bogieGeometry(m, tip - ZEPHYR_LENGTH.powerCar + OWN_TRUCK, RIDE)));
  });
}

// ---------------------------------------------------------------------------
// The coach and the observation car (the car builder)

/** Window spans: n windows `w` wide, evenly over d0..d1. */
const row = (d0: number, d1: number, n: number, w: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i): [number, number] => { const d = d0 + ((d1 - d0) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });

/** The observation car's round lounge end: the roof falling to it, the skirt rising. */
const TAIL: NoseShape = {
  len: 2.6, tip: 0.3, power: 2.0,
  C: [[0, 3.22], [0.5, 3.4], [1.2, 3.56], [2.0, 3.66], [2.8, SEC.C]],
  S: [[0, 2.9], [1.0, 2.94], [2.0, SEC.S]],
  B: [[0, 0.78], [0.5, 0.55], [1.1, SEC.B]],
};

const carSpec = (length: number, cuts: ReadonlyArray<readonly [number, number]>, rear?: NoseShape): CarbodySpec => ({
  length, ...SEC, ...(rear ? { rear } : {}), cuts, cutRadius: CUT_RADIUS, edges: EDGES, step: 1.0, noseStep: 0.2,
});

/** The drumhead's reach beyond the observation car's tail. */
const DRUMHEAD = 0.088;
/** A trailer's body length: between its joints (the observation car to its tail, the drumhead beyond it). */
const trailerLength = (c: "coach" | "observation") => ZEPHYR_LENGTH[c] - (c === "coach" ? 2 * GAP : GAP + DRUMHEAD);

/** A trailer's truck positions in its body's d: its own two (a lone car), or the observation car's rear one. */
const trailerTrucks = (c: "coach" | "observation"): number[] =>
  [OWN_TRUCK - GAP, c === "observation" ? REAR_TRUCK - GAP : trailerLength(c) - OWN_TRUCK + GAP];

const WINDOW_Y: readonly [number, number] = [SILL + 0.02, HEAD - 0.06];
const DOOR_Y: readonly [number, number] = [1.12, 2.93];

/**
 * A trailer facing +X: `lone`, a car on its own trucks with the skirt cut over
 * them; in the train its inner ends ride on the Jacobs bogies at the joints and
 * the skirt is cut there instead.
 */
function trailerDef(c: "coach" | "observation", lone = true): CarDef {
  const L = trailerLength(c);
  const trucks = trailerTrucks(c);
  const coach = c === "coach";
  const around = (d: number): [number, number] => [d - 1.5, d + 1.5];
  const cuts: Array<[number, number]> = lone
    ? trucks.map(around)
    : [[-0.01, JACOBS_CUT], coach ? [L - JACOBS_CUT, L + 0.01] : around(trucks[1]!)];
  const windows = coach
    ? [[9.9, 10.55], [10.75, 11.4]] as Array<[number, number]>
    : [...row(0.45, 10.55, 8, 1.1), ...row(12.1, 16.95, 4, 1.0)];
  const pass = coach ? row(13.2, 17.15, 3, 0.95) : [];
  const door: [number, number] = coach ? [12.05, 12.95] : [10.85, 11.75];
  const baggage: Hole = [4.6, 6.0, 1.15, 2.92];
  const plate: Hole = coach ? [6.6, 9.4, FLUTE.y0 - 0.04, FLUTE.y1 + 0.03] : [12.3, 16.9, FLUTE.y0 - 0.04, FLUTE.y1 + 0.03];
  const allWindows = [...windows, ...pass];
  return {
    spec: carSpec(L, cuts, coach ? undefined : TAIL),
    bands: [[0, 9, "ss"]], roof: "ss", skirt: "ss", under: "under",
    windows: [{ y: WINDOW_Y, spans: allWindows, frame: "zBlack" }],
    doors: { spans: [door], y: DOOR_Y, glass: [2.12, 2.7] },
    cabEnds: [], diaphragm: [1.15, 3.0],
    trucks, truck: RIDE,
    coupler: "knuckle", couplerY: 0.88, gap: [GAP, coach ? GAP : 0],
    cabin: coach ? [11.5, L - 0.2] : [0.2, L - 0.4],
    extras: (m, b, X) => {
      const holes: Hole[] = [...allWindows.map(([a, e]): Hole => [a - 0.04, e + 0.04, WINDOW_Y[0] - 0.04, WINDOW_Y[1] + 0.04]), [door[0] - 0.04, door[1] + 0.04, -9, 99], plate, ...(coach ? [baggage] : [])];
      const end = coach ? L - 0.25 : L - TAIL.len + 0.1;
      for (const s of [1, -1])
        m.scope(s > 0 ? "right side" : "left side", () => {
          sideSteel(m, b, X, s, 0.25, end, holes);
          if (coach) {
            doorOutline(m, b, X, s, baggage[0], baggage[1], baggage[2], baggage[3], [2.2, 2.7]);
            letterPanel(m, b, X, s, "EXPRESS", 8.0, 2.8, 0.24);
            m.scope("lettering", () => sideLettering(m, b, X, s, "RAILWAY EXPRESS AGENCY", 2.6, 2.4, 0.11, "zBlack", 0.008));
          } else {
            letterPanel(m, b, X, s, "BURLINGTON ZEPHYR", 14.6, 4.6, 0.24);
            m.scope("lounge windows", () => {
              // the windows wrapping round the lounge end, their posts between
              for (const [a, e] of [[L - 2.45, L - 1.75], [L - 1.62, L - 0.95], [L - 0.82, L - 0.12]] as const) {
                sidePane(m, b, X, s, "zBlack", [a, e], [WINDOW_Y[0], WINDOW_Y[1]], 0.006, 4, 1);
                sidePane(m, b, X, s, "glass", [a + 0.04, e - 0.04], [WINDOW_Y[0] + 0.04, WINDOW_Y[1] - 0.04], 0.012, 4, 1);
              }
            });
          }
        });
      roofCorrugations(m, b, X, 0.3, coach ? L - 0.3 : L - TAIL.len);
      if (!coach)
        m.scope("tail", () => {
          const x = X(L);
          const hw = b.w(L) * 0.92;
          // the end's middle window, the drumhead under it and the marker lamps
          decalX(m, "zBlack", x - 0.004, -1, -hw, hw, WINDOW_Y[0], WINDOW_Y[1]);
          decalX(m, "glass", x - 0.008, -1, -hw + 0.04, hw - 0.04, WINDOW_Y[0] + 0.04, WINDOW_Y[1] - 0.04);
          m.sweep("ss", "x", ngon(20, 0.36, 0, 0, 1.55), x - 0.02, ngon(20, 0.36, 0, 0, 1.55), x - 0.07);
          m.sweep("plateRed", "x", ngon(20, 0.32, 0, 0, 1.55), x - 0.07, ngon(20, 0.32, 0, 0, 1.55), x - 0.08);
          m.sweep("plateWhite", "x", ngon(20, 0.25, 0, 0, 1.55), x - 0.08, ngon(20, 0.25, 0, 0, 1.55), x - DRUMHEAD);
          faceLamps(m, -1, -x, [[-0.3, 1.05, 0.06, "lampRed"], [0.3, 1.05, 0.06, "lampRed"]]);
        });
      if (!coach) m.scope("tail steel", () => tailSteel(m, b, X));
    },
  };
}

/** The belt and the fluting wrapping round the observation car's lounge end, onto its end wall. */
function tailSteel(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const L = b.length;
  const span: [number, number] = [L - TAIL.len + 0.1, L - 0.01];
  for (const s of [1, -1]) {
    sidePane(m, b, X, s, "ssDark", span, [BELT[0], BELT[1]], 0.006, 12, 1);
    for (const [y0, y1] of RIBS) sidePane(m, b, X, s, "ssRib", span, [y0, y1], 0.016, 12, 1);
    for (let y = FLUTE.y0; y + FLUTE_H < FLUTE.y1 + 1e-6; y += FLUTE.pitch) sidePane(m, b, X, s, "ssFlute", span, [y, y + FLUTE_H], 0.003, 12, 1);
  }
  const x = X(L);
  const hw = b.w(L) * 0.96;
  decalX(m, "ssDark", x - 0.006, -1, -hw, hw, BELT[0], BELT[1]);
  for (const [y0, y1] of RIBS) decalX(m, "ssRib", x - 0.016, -1, -hw, hw, y0, y1);
  for (let y = FLUTE.y0; y + FLUTE_H < FLUTE.y1 + 1e-6; y += FLUTE.pitch) decalX(m, "ssFlute", x - 0.003, -1, -hw, hw, y, y + FLUTE_H);
}

// ---------------------------------------------------------------------------
// The train

export interface ZephyrSlot { car: ZephyrCar; lo: number; hi: number }
/** The three cars front to back, each between its joint planes (the power car from its tip, the observation car to its tail), centred. */
export function zephyrTrain(): ZephyrSlot[] {
  const cars: ZephyrCar[] = ["powerCar", "coach", "observation"];
  let hi = cars.reduce((t, c) => t + ZEPHYR_LENGTH[c], 0) / 2;
  return cars.map((car) => { const lo = hi - ZEPHYR_LENGTH[car]; const out = { car, lo, hi }; hi = lo; return out; });
}

/** The joint covers: the body's section, a little inside it. */
const JOINT_PROFILE: Array<[number, number]> = [[-1.28, 0.5], [1.28, 0.5], [1.3, 2.95], [0.9, 3.5], [-0.9, 3.5], [-1.3, 2.95]];

export function pioneerZephyr(params?: ParamValues): MeshBuilder {
  const u = resolveParams(ZEPHYR_PARAMS, params).unit as ZephyrUnit;
  const m = new Builder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...PAL });
  if (u === "powerCar") {
    drawPowerCar(m, ZEPHYR_LENGTH.powerCar / 2, true);
    return m;
  }
  if (u !== "train") {
    drawCar(m, trailerDef(u), (d) => ZEPHYR_LENGTH[u] / 2 - GAP - d, { inside: u === "observation" ? [-1] : [] });
    return m;
  }
  const slots = zephyrTrain();
  const jacobs = RIDE;
  const sections = slots.map((slot, k) => ({
    x0: slot.lo + (k === slots.length - 1 ? 0 : GAP), x1: slot.hi - (k === 0 ? 0 : GAP),
    draw: () => m.scope(`car ${k + 1}`, () => {
      if (slot.car === "powerCar") drawPowerCar(m, slot.hi, false);
      // the inner ends ride on the Jacobs bogies under the joints
      // the observation car's tail has neither a gangway nor a coupler
      else drawCar(m, trailerDef(slot.car, false), (d) => slot.hi - GAP - d, { trucks: [false, slot.car === "observation"], inside: [1, -1] });
      if (k < slots.length - 1) m.scope("jacobs bogie", () => m.bogie(() => bogieGeometry(m, slot.lo, jacobs), { sections: [k, k + 1] }));
    }),
  }));
  articulate({ m }, sections, 0.88, { profile: JOINT_PROFILE, folds: 6, depth: 0.025 }, 12, slots.slice(0, -1).map((s) => s.lo));
  return m;
}

// ---------------------------------------------------------------------------
// The low level of detail

/** The power car's LOD body: the nose's profile and plan as its front end, the cowl a roof part. */
function powerLodBody(tip: number, section?: number): UnitBody {
  const side: LodBand[] = [[SEC.B, BELT[0], "ss"], [BELT[0], BELT[1], "ssDark"], [BELT[1], SEC.S, "ss"], [SEC.S, SEC.C, "ss"]];
  return {
    y0: SEC.B, hw: [[SEC.B, SEC.wl], [SEC.A, SEC.wa], [SEC.Y, SEC.W], [SEC.S, SEC.W * SEC.lean], [SEC.C, 0.4]],
    side, roof: "ss",
    front: {
      tip: [[SEC.B, tip], [1.15, tip - 0.38], [2.05, tip - 0.72], [2.85, tip - 1.07], [3.3, tip - 1.22], [SEC.C, tip - 1.45]],
      setback: [[SEC.B, 1.4], [2.85, 1.1], [SEC.C, 0.6]],
      windows: [{ u: [-1.0, 1.0], y: [SILL, HEAD], mat: LOD_GLASS }],
    },
    rear: { tip: [[SEC.B, tip - ZEPHYR_LENGTH.powerCar + GAP]] },
    windows: [],
    ...(section !== undefined ? { section } : {}),
  };
}

function powerLodParts(tip: number, lone: boolean, section?: number): LodPart[] {
  return [
    ...bogieParts([[tip - ZEPHYR_MOTOR_TRUCK, MOTOR.frameHalf, section], ...(lone ? [[tip - ZEPHYR_LENGTH.powerCar + OWN_TRUCK, RIDE.frameHalf, section] as const] : [])], SEC.B + 0.1),
    roofPart("ss", tip - COWL_END[1], tip - 1.6, 0.9, 0.5, SEC.C - 0.15, COWL - 0.05, section),
  ];
}

export function pioneerZephyrLod(params?: ParamValues): MeshBuilder {
  const u = resolveParams(ZEPHYR_PARAMS, params).unit as ZephyrUnit;
  const palette = { ...CARBODY_PALETTE, ...PAL };
  if (u === "powerCar") {
    const tip = ZEPHYR_LENGTH.powerCar / 2;
    return fitUnit({ palette, bodies: [powerLodBody(tip)], parts: powerLodParts(tip, true) }, 100);
  }
  if (u !== "train") {
    const c = trailerDef(u);
    const X = (d: number) => ZEPHYR_LENGTH[u] / 2 - GAP - d;
    return fitUnit({ palette, bodies: [carLodBody(c, X)], parts: bogieParts(c.trucks.map((d) => [X(d), RIDE.frameHalf] as const), SEC.B + 0.1) }, 100);
  }
  const slots = zephyrTrain();
  const bodies = slots.map((slot, k) => (slot.car === "powerCar" ? powerLodBody(slot.hi, k) : carLodBody(trailerDef(slot.car, false), (d) => slot.hi - GAP - d, k)));
  const obs = slots[2]!;
  const parts: LodPart[] = [
    ...powerLodParts(slots[0]!.hi, false, 0),
    ...slots.slice(0, -1).map((s, i) => bogieParts([[s.lo, RIDE.frameHalf, i]], SEC.B + 0.1)[0]!),
    ...bogieParts([[obs.hi - REAR_TRUCK, RIDE.frameHalf, 2]], SEC.B + 0.1),
  ];
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, 0.88, 0])),
    joints: slots.slice(0, -1).map((s, i) => ({ sections: [i, i + 1] as [number, number], front: s.lo + GAP, rear: slots[i + 1]!.hi - GAP, profile: JOINT_PROFILE })),
    maxBendDeg: 12,
  };
  return fitUnit({ palette, bodies, parts, sections }, 300);
}

// ---------------------------------------------------------------------------
// The design

/** The cars' weights (the train 208,061 lb, 94.4 t) and the Winton 201-A's 600 hp. */
const ZEPHYR_WEIGHT: Record<ZephyrCar, number> = { powerCar: 42, coach: 26, observation: 26 };
const ZEPHYR_GAME: GameProperties = {
  weight: ZEPHYR_WEIGHT.powerCar, power: 447, maxspeed: 180, accel: null,
  variants: [
    { params: { unit: "coach" }, weight: ZEPHYR_WEIGHT.coach, power: 0 },
    { params: { unit: "observation" }, weight: ZEPHYR_WEIGHT.observation, power: 0 },
    { params: { unit: "train" }, weight: ZEPHYR_WEIGHT.powerCar + ZEPHYR_WEIGHT.coach + ZEPHYR_WEIGHT.observation, power: 447 },
  ],
};

export const PIONEER_ZEPHYR: ProceduralDesign = {
  id: "proc-vehicle-pioneer-zephyr", title: "Pioneer Zephyr", build: pioneerZephyr, buildLod: pioneerZephyrLod, params: ZEPHYR_PARAMS, lodTriangles: 300,
  game: ZEPHYR_GAME, catalog: { ...RAIL_CATALOG, group: "unit", traction: "diesel" }, loadingGauge: "us", references: "pioneer-zephyr",
};
