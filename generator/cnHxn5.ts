// The China Railways HXN5 (GE ES59ACi, CNR Qishuyan and GE, 2008-2010) measured from the
// photographs in assets/cr-hxn5/ (SOURCES.md) and the published figures: 22.295 m over the
// couplers, 3.119 m wide, 4.775 m high, Co-Co on 50 ft 4 in truck centres. It is the GE
// Evolution's frame, engine hood and radiator wings behind one full-width Chinese cab: a flat
// face with two windscreens raked back above the waist, the cab's sides leaning in above it,
// a deep chamfer to the roof and the four-lamp box on the roof's front edge, a ribbed
// anticlimber over the deep pilot plate, no short hood and no front walkway. Walkways run
// from the cab's rear wall to the rear end. Paint: CR dark green, a light grey band across the
// face wrapping a metre round the cab's corners with the red "Hexie" characters and the
// number on it, the hood's lower sides a silver-grey panel lettered in red. Chinese automatic
// couplers are AAR knuckle couplers (type 13), at 880 mm. Drawn here on the hood unit kit's
// helpers (usHoodKit.ts), so the kit's other designs and the ES44AC are unchanged.
// Metres, +X toward the cab, wheel contact at y = 0. See docs/models/china-locos.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { tubeX } from "./cd163.ts";
import { block, bogieGeometry, exhaust, extrude, paint, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, knuckleCoupler, paintedSweep, type Band, type Paint } from "./usHoodKit.ts";
import { LOD_GLASS, lodBands, type LodBand, type LodShell } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures. Heights from the head-on photograph of HXN5 0287 (207 px/m at the face, the
// face 3.12 m wide); lengths along the side from HXN5 0096 by a projective fit over the cab
// face and the six axles (truck centres 50 ft 4 in, axles 6 ft 7 in apart, the GE Evolution's).

export const HXN5_LENGTH = 22.295;
const HALF = HXN5_LENGTH / 2;
/** The rear end sill, the cab face's plane (its lower part), the walkway top, the side sill's foot. */
const SILL = 10.6;
const FACE = 10.62;
const D = 1.65;
const SILL_BOTTOM = 1.18;
const DECK_HALF = 1.56;
/**
 * The cab, by height: [y, half width, x of the face]: upright to the waist at 3.35 m, then the
 * windscreens' plane raked back 0.2 m to 4.38 m while the sides lean in, the roof's deep
 * chamfer to the flat top at 4.62 m. The face's vertical corners are cut by CORNER.
 */
const CAB: ReadonlyArray<readonly [number, number, number]> = [[D, 1.56, FACE], [3.35, 1.56, FACE], [4.38, 1.36, FACE - 0.2], [4.62, 1.14, FACE - 0.3]];
const CORNER = 0.1;
const CAB_X0 = 7.9;
const CAB_TOP = 4.62;
/** The engine hood: half width, roof and its chamfer. */
const HOOD_HALF = 1.1;
const HOOD_TOP = 4.45;
const HOOD_R = 0.18;
const HOOD_REAR = -10.05;
/** The equipment box behind the cab: its x span and roof (the hood's width); its three grilles. */
const BOX = { x0: 1.6, x1: CAB_X0, top: 4.6 };
const GRILLES: ReadonlyArray<readonly [number, number]> = [[5.25, 4.2], [4.05, 3.0], [2.85, 1.85]];
/** The radiator with its wings, as the GE Evolution's. */
const RAD = { x0: HOOD_REAR, x1: -5.2, foot: 3.35, half: 1.5, side0: 3.95, side1: 4.55, top: 4.62, overhang: -10.4 };
const TRUCK_CENTRE = ft(50, 4) / 2;
const TRUCK: BogieSpec = {
  axles: [-ft(6, 7), 0, ft(6, 7)], wheelR: ft(0, 21), frameHalf: 2.75, frameTop: 1.0, frameBottom: 0.62,
  frameZ: [0.92, 1.08], primary: "coil", secondary: [-0.9, 0.9], secondaryZ: 1.1, bolster: SILL_BOTTOM,
};
const TANK = { x0: -3.0, x1: 4.6, y0: 0.45, half: 1.4 };
/** The silver-grey panel on the hood's sides: its front edge (foot, head), its rear, its head height. */
const PANEL = { front0: 5.3, front1: 4.95, rear: RAD.x1, y0: D + 0.05, y1: 4.08 };

// ---------------------------------------------------------------------------
// Paint

export interface Hxn5Livery {
  /** The value's title (the game's button: 16 characters at most). */
  title: string;
  /** The running number (on the face, the hood sides and the rear). */
  number: string;
  palette: Record<string, MaterialSpec>;
  body: string;
  band: string;
  panel: string;
  roof: string;
  frame: string;
  pilot: string;
  rails: string;
  railEnds: string;
  letter: string;
  emblem: string;
}

/** CR's dark green (sampled from HXN5 0287 and 0470 in daylight), the grey band and the hood's silver-grey. */
export const HXN5_LIVERIES: Record<string, Hxn5Livery> = {
  orange: {
    title: "CR green", number: "HXN5 0433",
    palette: {
      cnGreen: paint("#235843", 0.55), cnBand: paint("#c9cbc6", 0.5), cnPanel: paint("#a3aaa8", 0.45), cnRoof: paint("#26352f", 0.7),
      cnFrame: paint("#5d5f54", 0.75), cnPilot: paint("#34362f", 0.8), cnRail: paint("#4b4d3f", 0.6), cnYellow: paint("#d8a924", 0.5),
      cnRed: paint("#d3262b", 0.5), cnEmblem: paint("#f1f1ec", 0.4), lampAmber: paint("#e99a2c", 0.3), reservoir: paint("#9a9d98", 0.4),
    },
    body: "cnGreen", band: "cnBand", panel: "cnPanel", roof: "cnRoof", frame: "cnFrame", pilot: "cnPilot",
    rails: "cnRail", railEnds: "cnYellow", letter: "cnRed", emblem: "cnEmblem",
  },
};

/** The face's paint by height: green, the grey band at 2.10 - 2.65 m, green to the roof. */
const faceBands = (l: Hxn5Livery): Band[] => [[0, 2.1, l.body], [2.1, 2.65, l.band], [2.65, 9, l.body]];
const BAND = [2.1, 2.65] as const;

// ---------------------------------------------------------------------------
// Planar polygons painted by height (as geEs44ac.ts draws its faces)

function project(n: Vec3): (p: Vec3) => [number, number] {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  if (ax >= ay && ax >= az) return (p) => [p[2], p[1]];
  if (ay >= az) return (p) => [p[0], p[2]];
  return (p) => [p[0], p[1]];
}

function triangulate(pts: readonly Vec3[], n: Vec3): Vec3[] {
  const q = pts.map(project(n));
  let area = 0;
  for (let i = 0; i < q.length; i++) {
    const a = q[i]!, b = q[(i + 1) % q.length]!;
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sgn = area >= 0 ? 1 : -1;
  const idx = q.map((_, i) => i);
  const out: Vec3[] = [];
  const cross = (a: [number, number], b: [number, number], c: [number, number]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  let guard = 0;
  while (idx.length > 3 && guard++ < 1000) {
    let cut = false;
    for (let k = 0; k < idx.length; k++) {
      const ia = idx[(k + idx.length - 1) % idx.length]!, ib = idx[k]!, ic = idx[(k + 1) % idx.length]!;
      const a = q[ia]!, b = q[ib]!, c = q[ic]!;
      if (sgn * cross(a, b, c) <= 1e-12) continue;
      let inside = false;
      for (const j of idx) {
        if (j === ia || j === ib || j === ic) continue;
        const p = q[j]!;
        if (sgn * cross(a, b, p) >= 0 && sgn * cross(b, c, p) >= 0 && sgn * cross(c, a, p) >= 0) { inside = true; break; }
      }
      if (inside) continue;
      out.push(pts[ia]!, pts[ib]!, pts[ic]!);
      idx.splice(k, 1);
      cut = true;
      break;
    }
    if (!cut) break;
  }
  if (idx.length === 3) out.push(pts[idx[0]!]!, pts[idx[1]!]!, pts[idx[2]!]!);
  return out;
}

function polygon(m: MeshBuilder, mat: string, pts: readonly Vec3[], n: Vec3): void {
  m.facets(mat, triangulate(pts, n), n);
}

function clipY3(poly: readonly Vec3[], lo: number, hi: number): Vec3[] {
  const cut = (pts: readonly Vec3[], keep: (y: number) => boolean, at: number): Vec3[] => {
    const out: Vec3[] = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
      const kp = keep(p[1]), kq = keep(q[1]);
      if (kp) out.push(p);
      if (kp !== kq) {
        const t = (at - p[1]) / (q[1] - p[1]);
        out.push([p[0] + (q[0] - p[0]) * t, at, p[2] + (q[2] - p[2]) * t]);
      }
    }
    return out;
  };
  return cut(cut(poly, (y) => y >= lo, lo), (y) => y <= hi, hi);
}

function bandAt(bands: readonly Band[], y: number): string {
  for (const b of bands) if (y >= b[0] - 1e-9 && y < b[1] - 1e-9) return b[2];
  return y < bands[0]![0] ? bands[0]![2] : bands[bands.length - 1]![2];
}

/** A planar polygon painted by the bands at each height (split exactly at the band edges). */
function paintedPolygon(m: MeshBuilder, bands: readonly Band[], pts: readonly Vec3[], n: Vec3): void {
  const tris = triangulate(pts, n);
  const cuts = [-Infinity, ...[...new Set(bands.flatMap((b) => [b[0], b[1]]))].sort((a, b) => a - b), Infinity];
  for (let i = 0; i + 2 < tris.length; i += 3) {
    const t = [tris[i]!, tris[i + 1]!, tris[i + 2]!];
    const ys = t.map((p) => p[1]);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const lo = cuts[k]!, hi = cuts[k + 1]!;
      if (hi <= Math.min(...ys) + 1e-9 || lo >= Math.max(...ys) - 1e-9) continue;
      const piece = clipY3(t, lo, hi);
      if (piece.length < 3) continue;
      const py = piece.map((p) => p[1]);
      const mat = bandAt(bands, (Math.min(...py) + Math.max(...py)) / 2);
      const fan: Vec3[] = [];
      for (let j = 1; j + 1 < piece.length; j++) fan.push(piece[0]!, piece[j]!, piece[j + 1]!);
      m.facets(mat, fan, n);
    }
  }
}

function normalOf(pts: readonly Vec3[]): Vec3 {
  const nv: Vec3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!, b = pts[(i + 1) % pts.length]!;
    nv[0] += (a[1] - b[1]) * (a[2] + b[2]);
    nv[1] += (a[2] - b[2]) * (a[0] + b[0]);
    nv[2] += (a[0] - b[0]) * (a[1] + b[1]);
  }
  const len = Math.hypot(...nv) || 1;
  return [nv[0] / len, nv[1] / len, nv[2] / len];
}

/** The outward normal of a polygon, flipped to agree with the rough direction `out`. */
function outward(pts: readonly Vec3[], out: Vec3): Vec3 {
  const n = normalOf(pts);
  return n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0 ? n : [-n[0], -n[1], -n[2]];
}

const mz = (p: Vec3, s: number): Vec3 => [p[0], p[1], s * p[2]];

/** A polygon in (x, y) on the side wall z = s * zw. */
function sidePoly(m: MeshBuilder, mat: string, s: number, zw: number, pts: ReadonlyArray<readonly [number, number]>): void {
  polygon(m, mat, pts.map(([x, y]): Vec3 => [x, y, s * zw]), [0, 0, s]);
}

/** Text laid on a plane from its bottom centre o, u along ux, facing n. */
function planeText(m: MeshBuilder, mat: string, text: string, o: Vec3, ux: Vec3, n: Vec3, h: number, w: number, gap: number): void {
  const tw = strokeWidth(text, w, gap);
  const pts = strokeText(text, -tw / 2, 0, h, w, gap, false, h * 0.16).map(([u, v]): Vec3 => [o[0] + ux[0] * u, o[1] + v, o[2] + ux[2] * u]);
  m.facets(mat, pts, n);
}

// ---------------------------------------------------------------------------
// The red "Hexie" characters, simplified to strokes in a unit cell (u right, v up)

type Seg = readonly [number, number, number, number];
const HE: readonly Seg[] = [
  // the grain radical: the top stroke, the cross bar, the stem, the falling strokes; the mouth
  [0.06, 0.88, 0.4, 0.98], [0.02, 0.7, 0.46, 0.7], [0.24, 0.94, 0.24, 0.02], [0.24, 0.6, 0.02, 0.24], [0.27, 0.56, 0.44, 0.4],
  [0.56, 0.72, 0.95, 0.72], [0.56, 0.22, 0.95, 0.22], [0.56, 0.72, 0.56, 0.16], [0.95, 0.72, 0.95, 0.16],
];
const XIE: readonly Seg[] = [
  // the speech radical; the two "bi" halves over "bai"
  [0.06, 0.92, 0.14, 0.82], [0.02, 0.62, 0.16, 0.62], [0.16, 0.62, 0.16, 0.12], [0.16, 0.12, 0.26, 0.22],
  [0.38, 0.98, 0.38, 0.62], [0.38, 0.8, 0.54, 0.84], [0.38, 0.62, 0.58, 0.66], [0.68, 0.98, 0.68, 0.64], [0.68, 0.64, 0.96, 0.62], [0.68, 0.82, 0.9, 0.92],
  [0.64, 0.58, 0.58, 0.5], [0.42, 0.5, 0.92, 0.5], [0.42, 0.04, 0.92, 0.04], [0.42, 0.5, 0.42, 0.0], [0.92, 0.5, 0.92, 0.0], [0.42, 0.27, 0.92, 0.27],
];

/** The two characters from o (the left glyph's bottom left), h tall, along ux on the plane facing n, `lift` off it. */
function hexie(m: MeshBuilder, mat: string, o: Vec3, ux: Vec3, n: Vec3, h: number, gap = 0.25): void {
  const pts: Vec3[] = [];
  const at = (u: number, v: number): Vec3 => [o[0] + ux[0] * u * h, o[1] + v * h, o[2] + ux[2] * u * h];
  const w = 0.075;
  [HE, XIE].forEach((glyph, k) => {
    const du = k * (1 + gap);
    for (const [u0, v0, u1, v1] of glyph) {
      const a = [u0 + du, v0], b = [u1 + du, v1];
      const len = Math.hypot(b[0]! - a[0]!, b[1]! - a[1]!) || 1;
      const nu = (-(b[1]! - a[1]!) / len) * w * 0.5, nv = ((b[0]! - a[0]!) / len) * w * 0.5;
      // extend the stroke by half its width at each end so joints close
      const eu = ((b[0]! - a[0]!) / len) * w * 0.5, ev = ((b[1]! - a[1]!) / len) * w * 0.5;
      const p = [at(a[0]! - eu + nu, a[1]! - ev + nv), at(a[0]! - eu - nu, a[1]! - ev - nv), at(b[0]! + eu - nu, b[1]! + ev - nv), at(b[0]! + eu + nu, b[1]! + ev + nv)];
      pts.push(p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!);
    }
  });
  m.facets(mat, pts, n);
}

/** The CR emblem (a rail's section under an engine's front, in a ring), centred at c on the plane facing n, r its radius. */
function emblem(m: MeshBuilder, mat: string, c: Vec3, ux: Vec3, n: Vec3, r: number): void {
  const at = (u: number, v: number): Vec3 => [c[0] + ux[0] * u * r, c[1] + v * r, c[2] + ux[2] * u * r];
  const pts: Vec3[] = [];
  const N = 16, w = 0.2;
  // the ring, open at the foot where the rail stands
  for (let i = 0; i < N; i++) {
    const a0 = -Math.PI / 2 + 0.55 + ((2 * Math.PI - 1.1) * i) / N, a1 = -Math.PI / 2 + 0.55 + ((2 * Math.PI - 1.1) * (i + 1)) / N;
    const o0 = at(Math.cos(a0), Math.sin(a0)), o1 = at(Math.cos(a1), Math.sin(a1));
    const i0 = at((1 - w) * Math.cos(a0), (1 - w) * Math.sin(a0)), i1 = at((1 - w) * Math.cos(a1), (1 - w) * Math.sin(a1));
    pts.push(o0, o1, i1, o0, i1, i0);
  }
  const rect = (u0: number, v0: number, u1: number, v1: number) => {
    const q = [at(u0, v0), at(u1, v0), at(u1, v1), at(u0, v1)];
    pts.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
  };
  // the rail: head, web and foot standing in the ring's opening
  rect(-0.42, 0.28, 0.42, 0.46);
  rect(-0.1, -0.78, 0.1, 0.28);
  rect(-0.42, -1.0, 0.42, -0.84);
  // the engine's smokebox front over the rail head
  rect(-0.5, 0.52, 0.5, 0.62);
  m.facets(mat, pts, n);
}

// ---------------------------------------------------------------------------
// The design

export function buildHxn5(l: Hxn5Livery): MeshBuilder {
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, l));
  m.scope("long hood", () => longHood(m, l));
  m.scope("cab", () => cab(m, l));
  m.scope("walkways", () => walkways(m, l));
  m.scope("trucks", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front truck" : "rear truck", () => m.bogie(() => bogieGeometry(m, e * TRUCK_CENTRE, TRUCK)));
  });
  m.scope("underframe", () => underframe(m, l));
  m.scope("markings", () => markings(m, l));
  return m;
}

/** The distant model (docs/models/lod.md): the cab with its raked face, the box, hood and the radiator's wings, frame, tank and trucks. */
export function buildHxn5Lod(l: Hxn5Livery, budget = 100): MeshBuilder {
  const top = (bands: readonly Band[], y0: number, y1: number, roof: string): LodBand[] => [...lodBands(bands, y0, y1 - 0.15), [y1 - 0.15, y1, roof]];
  const flat = (x0: number, x1: number, half: number, y1: number, sidePaint: readonly LodBand[], roof: string, extra: Partial<LodShell> = {}): LodShell => ({
    y0: D, xc: (x0 + x1) / 2, tip: [[D, (x1 - x0) / 2], [y1, (x1 - x0) / 2]],
    hw: [[D, half], [y1 - 0.12, half], [y1, Math.max(0.1, half - 0.15)]],
    side: sidePaint, roof, ...extra,
  });
  const green: Band[] = [[0, 9, l.body]];
  const hoodSide: Band[] = [[0, PANEL.y1, l.panel], [PANEL.y1, 9, l.body]];
  const hood = flat(RAD.x1, BOX.x0, HOOD_HALF, HOOD_TOP, top(hoodSide, D, HOOD_TOP, l.roof), l.roof, { ends: [] });
  const box = flat(BOX.x0, CAB_X0, HOOD_HALF, BOX.top, top(hoodSide, D, BOX.top, l.roof), l.roof, { ends: [-1] });
  const radiator = flat(RAD.overhang, RAD.x1, RAD.half, RAD.top, top(green, D, RAD.top, l.roof), l.roof, { ends: [-1, 1], end: top(green, D, RAD.top, l.roof) });
  const face = faceBands(l);
  const cab: LodShell = {
    y0: D, hw: CAB.map(([y, w]) => [y, w] as const),
    front: { tip: CAB.map(([y, , x]) => [y, x] as const), setback: CAB.map(([y]) => [y, CORNER] as const), paint: top(face, D, CAB_TOP, l.roof) },
    rear: { tip: [[D, CAB_X0], [CAB_TOP, CAB_X0]] },
    side: top(green, D, CAB_TOP, l.roof), end: top(green, D, CAB_TOP, l.roof),
    cabs: [{ x0: FACE - 1.0, x1: FACE + 1, side: top(face, D, CAB_TOP, l.roof) }],
    roof: l.roof,
    endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.12, 1.3] as const : [-1.3, -0.12] as const, y: [3.42, 4.34] as const, mat: LOD_GLASS, ends: [1], optional: 0.3 })),
    sideWindows: sideWindows([{ u: [8.7, FACE - 0.22], y: [3.5, 4.25] }]),
  };
  const boxes: LocoBox[] = [
    { name: "frame", mat: l.frame, x: [-SILL, FACE], y: [SILL_BOTTOM, D], w: DECK_HALF },
    { name: "fuel tank", mat: "tank", x: [TANK.x0, TANK.x1], y: [TANK.y0, SILL_BOTTOM], w: TANK.half, top: false, optional: 35 },
    { name: "pilot", mat: l.pilot, x: [FACE - 0.35, FACE], y: [0.15, SILL_BOTTOM], w: 1.46, top: false, optional: 30 },
    { name: "rear pilot", mat: l.pilot, x: [-SILL, -SILL + 0.4], y: [0.2, SILL_BOTTOM], w: 1.46, top: false, optional: 30 },
  ];
  return locoLod({
    palette: { ...US_PALETTE, ...l.palette },
    shells: [hood, box, radiator, cab],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * TRUCK_CENTRE, half: TRUCK.frameHalf, top: TRUCK.frameTop })),
  }, budget);
}

function frame(m: MeshBuilder, l: Hxn5Livery): void {
  m.scope("deck", () => {
    block(m, "walk", -SILL, CAB_X0, D - 0.04, D, -DECK_HALF, DECK_HALF);
    const sill: Array<[number, number]> = [[-DECK_HALF, SILL_BOTTOM], [DECK_HALF, SILL_BOTTOM], [DECK_HALF, D - 0.04], [-DECK_HALF, D - 0.04]];
    m.sweep(l.frame, "x", sill, -SILL, sill, FACE - 0.04);
    // under the cab the deck plate is its floor
    block(m, l.frame, CAB_X0, FACE - 0.04, D - 0.04, D - 0.001, -(DECK_HALF - 0.01), DECK_HALF - 0.01);
  });
  m.scope("reflective tape", () => {
    for (const sd of [-1, 1])
      for (let x = -SILL + 0.6; x < FACE - 0.5; x += 1.2) decalZ(m, "safety", sd * (DECK_HALF + 0.004), sd, x, x + 0.3, SILL_BOTTOM + 0.12, SILL_BOTTOM + 0.18);
  });
  // the front end: the ribbed anticlimber under the face, the deep pilot plate, the coupler in its pocket
  m.scope("front end", () => {
    block(m, l.pilot, FACE - 0.04, FACE + 0.05, SILL_BOTTOM, D, -DECK_HALF + 0.02, DECK_HALF - 0.02);
    for (const y of [1.3, 1.42, 1.54]) block(m, l.pilot, FACE + 0.05, FACE + 0.09, y - 0.025, y + 0.025, -DECK_HALF + 0.06, DECK_HALF - 0.06);
    const sec: Array<[number, number]> = [[FACE - 0.4, 0.15], [FACE - 0.1, 0.15], [FACE, 0.32], [FACE, SILL_BOTTOM], [FACE - 0.4, SILL_BOTTOM]];
    m.sweep(l.pilot, "z", sec, -1.46, sec, 1.46);
    // the coupler pocket, the side plates' bevelled foot
    decalX(m, "black", FACE + 0.003, 1, -0.38, 0.38, 0.62, 1.12);
    m.scope("coupler", () => knuckleCoupler(m, 1, FACE - 0.02, HALF, 0.88));
    m.scope("hoses", () => {
      for (const z of [-0.5, 0.42, 0.62]) m.loft("hose", ngon(6, 0.03, 0, FACE - 0.01, z), 0.48, ngon(6, 0.03, 0, FACE + 0.16, z), 0.82);
      // the brake pipes' cocks and the MU sockets across the plate
      for (const z of [-1.3, -0.75, 0.75, 1.3]) block(m, "steel", FACE, FACE + 0.06, 1.0, 1.08, z - 0.05, z + 0.05);
    });
    // the red marker low on the left of the plate, the yellow grab handles at its corners
    extrude(m, "lampRed", "x", ngon(10, 0.075, 0, -1.05, 0.99), [FACE, FACE + 0.04]);
    for (const sd of [-1, 1]) m.rod(l.railEnds, [FACE + 0.06, 0.5, sd * 1.36], [FACE + 0.06, 0.95, sd * 1.36], 0.018, 6);
  });
  m.scope("rear end", () => {
    const L = SILL;
    // the rear pilot: one deep plate full width, its foot bevelled back, the anticlimber along the sill
    const foot = 0.2, knee = 0.62;
    const sec: Array<[number, number]> = [[-L + 0.4, foot], [-L + 0.4, SILL_BOTTOM], [-L, SILL_BOTTOM], [-L, knee], [-L + 0.14, foot]];
    m.sweep(l.pilot, "z", sec, -1.46, sec, 1.46);
    block(m, l.pilot, -L - 0.05, -L + 0.06, D - 0.2, D - 0.02, -DECK_HALF + 0.05, DECK_HALF - 0.05);
    decalX(m, "black", -L - 0.003, -1, -0.38, 0.38, 0.62, 1.12);
    m.scope("coupler", () => knuckleCoupler(m, -1, L, HALF, 0.88));
    m.scope("hoses", () => {
      for (const z of [-0.42, 0.42, 0.62]) m.loft("hose", ngon(6, 0.03, 0, -L - 0.16, z), 0.82, ngon(6, 0.03, 0, -L + 0.02, z), 0.48);
    });
    extrude(m, "lampRed", "x", ngon(10, 0.075, 0, 1.05, 0.99), [-L - 0.04, -L]);
    // the corner steps up to the rear platform
    for (const sd of [-1, 1]) {
      const z: [number, number] = side(sd, DECK_HALF - 0.55, DECK_HALF - 0.05);
      [0.4, 0.82, 1.24].forEach((y) => block(m, "steel", -L + 0.06, -L + 0.38, y, y + 0.03, ...z));
      for (const zz of [DECK_HALF - 0.57, DECK_HALF - 0.03]) block(m, l.pilot, -L + 0.02, -L + 0.42, 0.3, SILL_BOTTOM, ...side(sd, zz - 0.02, zz + 0.02));
      m.rod(l.railEnds, [-L + 0.04, 0.5, sd * (DECK_HALF - 0.01)], [-L + 0.04, D + 1.0, sd * (DECK_HALF - 0.01)], 0.018, 6);
    }
  });
  // the side ladders up to the walkway just behind the cab
  m.scope("side steps", () => {
    for (const sd of [-1, 1]) {
      const z: [number, number] = side(sd, DECK_HALF - 0.12, DECK_HALF - 0.02);
      for (const x of [5.35, 5.85]) block(m, l.railEnds, x - 0.025, x + 0.025, 0.42, SILL_BOTTOM, ...z);
      for (const y of [0.5, 0.8, 1.1]) block(m, "steel", 5.38, 5.82, y, y + 0.03, ...side(sd, DECK_HALF - 0.35, DECK_HALF - 0.02));
    }
  });
}

/** The section of the hood (top t): chamfered roof corners. */
function hoodSection(t: number): Array<[number, number]> {
  const h = HOOD_HALF, r = HOOD_R;
  return [[-h, D], [h, D], [h, t - r], [h - r, t], [-(h - r), t], [-h, t - r]];
}

function longHood(m: MeshBuilder, l: Hxn5Livery): void {
  const green: Band[] = [[0, 9, l.body]];
  const hoodPaint: Paint = { bands: green, ends: green, roofFrom: HOOD_TOP - HOOD_R * 0.5, roof: l.roof };
  m.scope("hood", () => paintedSweep(m, "x", hoodSection(HOOD_TOP), RAD.x1, BOX.x0, hoodPaint, []));
  // the equipment box behind the cab, a little higher than the engine hood, against the cab's rear wall
  m.scope("equipment box", () => {
    paintedSweep(m, "x", hoodSection(BOX.top), BOX.x0, BOX.x1, { bands: green, ends: green, roofFrom: BOX.top - HOOD_R * 0.5, roof: l.roof }, [-1]);
    for (const sd of [-1, 1]) {
      const zz = sd * (HOOD_HALF + 0.005);
      // three screened grilles high on each side, vertical slats
      for (const [b, a] of GRILLES) {
        decalZ(m, "grille", zz, sd, a, b, 4.1, 4.38);
        for (let x = a + 0.06; x < b - 0.04; x += 0.1) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.04, 4.13, 4.35);
      }
      // a small window high ahead of the grilles
      decalZ(m, "rubber", zz, sd, 6.9, 7.45, 3.7, 4.25);
      decalZ(m, "glass", zz + sd * 0.004, sd, 6.95, 7.4, 3.75, 4.2);
    }
    block(m, "fanGuard", 2.3, 4.9, BOX.top, BOX.top + 0.03, -0.75, 0.75);
    for (let x = 2.4; x < 4.85; x += 0.16) block(m, "louvre", x, x + 0.05, BOX.top + 0.03, BOX.top + 0.04, -0.7, 0.7);
  });
  // the radiator: the hood's side up to the wings, the wings flaring out to the full width (as the ES44AC's)
  m.scope("radiator", () => {
    const flare: Array<[number, number]> = [[-HOOD_HALF, D], [HOOD_HALF, D], [HOOD_HALF, RAD.foot], [RAD.half, RAD.side0], [RAD.half, RAD.side1], [RAD.half - 0.08, RAD.top], [-(RAD.half - 0.08), RAD.top], [-RAD.half, RAD.side1], [-RAD.half, RAD.side0], [-HOOD_HALF, RAD.foot]];
    paintedSweep(m, "x", flare, RAD.x0, RAD.x1, { bands: green, ends: green, roofFrom: RAD.top - 0.04, roof: l.roof }, [-1, 1]);
    const wing: Array<[number, number]> = [[-RAD.half, RAD.side0], [RAD.half, RAD.side0], [RAD.half, RAD.side1], [RAD.half - 0.08, RAD.top], [-(RAD.half - 0.08), RAD.top], [-RAD.half, RAD.side1]];
    paintedSweep(m, "x", wing, RAD.overhang, RAD.x0, { bands: green, roofFrom: RAD.top - 0.04, roof: l.roof }, [-1]);
    m.facets(l.body, [[RAD.overhang, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, RAD.half], [RAD.overhang, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, RAD.half], [RAD.overhang, RAD.side0, RAD.half]], [0, -1, 0]);
    const slope = Math.atan2(RAD.side0 - RAD.foot, RAD.half - HOOD_HALF);
    const n = (sd: number): Vec3 => [0, -Math.cos(slope), sd * Math.sin(slope)];
    for (const sd of [-1, 1]) {
      const at = (u: number, x: number, off: number): Vec3 => {
        const z = HOOD_HALF + (RAD.half - HOOD_HALF) * u, y = RAD.foot + (RAD.side0 - RAD.foot) * u;
        const nn = n(sd);
        return [x, y + nn[1] * off, sd * z + nn[2] * off];
      };
      const quad = (mat: string, x0: number, x1: number, u0: number, u1: number, off: number) => {
        m.facets(mat, [at(u0, x0, off), at(u0, x1, off), at(u1, x1, off), at(u0, x0, off), at(u1, x1, off), at(u1, x0, off)], n(sd));
      };
      quad("grille", RAD.x0 + 0.15, RAD.x1 - 0.2, 0.08, 0.94, 0.005);
      for (let x = RAD.x0 + 0.25; x < RAD.x1 - 0.25; x += 0.14) quad("louvre", x, x + 0.05, 0.12, 0.9, 0.009);
      // the wings' faces: a dark screened band along each (the photographs' black wing sides)
      decalZ(m, "grille", sd * (RAD.half + 0.004), sd, RAD.overhang + 0.15, RAD.x1 - 0.15, RAD.side0 + 0.08, RAD.side1 - 0.08);
      // the radiator compartment's doors under the wings, with their louvre grids
      const zz = sd * (HOOD_HALF + 0.004);
      const doors = [-9.85, -8.85, -7.85, -6.85, -6.0, RAD.x1 - 0.05];
      for (const x of doors) decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, D + 0.1, RAD.foot - 0.12);
      for (let i = 0; i < 4; i++) {
        const a = doors[i]!, b = doors[i + 1]!;
        decalZ(m, "louvre", zz, sd, a + 0.12, b - 0.12, D + 0.35, RAD.foot - 0.3);
        for (let y = D + 0.4; y < RAD.foot - 0.35; y += 0.12) decalZ(m, "grille", zz + sd * 0.004, sd, a + 0.14, b - 0.14, y, y + 0.04);
      }
    }
  });
  m.scope("fans", () => {
    for (const x of [-8.85, -6.45]) {
      m.prism("fanGuard", ngon(20, 0.66, 0, x, 0), RAD.top - 0.02, RAD.top + 0.05);
      m.prism("louvre", ngon(20, 0.56, 0, x, 0), RAD.top + 0.05, RAD.top + 0.055);
      for (const a of [0, Math.PI / 2]) {
        const c = Math.cos(a) * 0.6, s = Math.sin(a) * 0.6;
        m.rod("fanGuard", [x - c, RAD.top + 0.06, -s], [x + c, RAD.top + 0.06, s], 0.015, 4);
      }
    }
  });
  m.scope("exhaust", () => {
    exhaust(m, -1.9, 0, HOOD_TOP - 0.02, HOOD_TOP + 0.24, 0.42, 0.7);
    block(m, "black", -2.35, -1.45, HOOD_TOP, HOOD_TOP + 0.04, -0.5, 0.5);
    block(m, "fanGuard", -0.3, 1.4, HOOD_TOP, HOOD_TOP + 0.08, -0.7, 0.7);
  });
  // the silver-grey panel on the lower hood sides, its front edge leaning back; the doors' seams and latches over it
  m.scope("panel", () => {
    for (const sd of [-1, 1]) {
      sidePoly(m, l.panel, sd, HOOD_HALF + 0.004, [[PANEL.rear, PANEL.y0], [PANEL.front0, PANEL.y0], [PANEL.front1, PANEL.y1], [PANEL.rear, PANEL.y1]]);
      const zz = sd * (HOOD_HALF + 0.008);
      const x0 = RAD.x1 + 0.1, x1 = CAB_X0 - 0.15;
      const n = 10, w = (x1 - x0) / n;
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * w;
        decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, D + 0.12, x > BOX.x0 ? 4.02 : HOOD_TOP - HOOD_R - 0.1);
        if (i < n) block(m, "steel", x + w / 2 - 0.08, x + w / 2 + 0.08, D + 1.05, D + 1.1, ...side(sd, HOOD_HALF, HOOD_HALF + 0.04));
      }
    }
  });
  // the rear face: the four lamps in a box under the wings' overhang, the marker lights, the door
  m.scope("rear lamps", () => {
    const x = RAD.overhang;
    for (const z of [-0.45, -0.17, 0.17, 0.45]) {
      extrude(m, "black", "x", ngon(12, 0.11, 0, z, (RAD.side0 + RAD.side1) / 2 + 0.02), [x - 0.05, x + 0.002]);
      extrude(m, "lampHead", "x", ngon(12, 0.09, 0, z, (RAD.side0 + RAD.side1) / 2 + 0.02), [x - 0.06, x - 0.05]);
    }
    const xr = HOOD_REAR;
    for (const z of [-0.68, 0.68]) {
      extrude(m, "lampHead", "x", ngon(10, 0.08, 0, z, 3.45), [xr - 0.03, xr - 0.002]);
      extrude(m, "lampAmber", "x", ngon(8, 0.05, 0, z + Math.sign(z) * 0.2, 3.45), [xr - 0.03, xr - 0.002]);
    }
    for (const z of [-0.45, 0.45]) decalX(m, "black", xr - 0.004, -1, z - 0.012, z + 0.012, D + 0.1, 3.0);
  });
}

function cab(m: MeshBuilder, l: Hxn5Livery): void {
  const face = faceBands(l), green: Band[] = [[0, 9, l.body]];
  const c = CORNER;
  m.scope("shell", () => {
    for (let i = 0; i + 1 < CAB.length; i++) {
      const [y0, w0, f0] = CAB[i]!, [y1, w1, f1] = CAB[i + 1]!;
      // the face between these heights, its corners cut
      const mid: Vec3[] = [[f0, y0, -(w0 - c)], [f0, y0, w0 - c], [f1, y1, w1 - c], [f1, y1, -(w1 - c)]];
      paintedPolygon(m, face, mid, outward(mid, [1, 0, 0]));
      for (const s of [-1, 1]) {
        const cut: Vec3[] = ([[f0, y0, w0 - c], [f0 - c, y0, w0], [f1 - c, y1, w1], [f1, y1, w1 - c]] as Vec3[]).map((p) => mz(p, s));
        paintedPolygon(m, face, cut, outward(cut, [1, 0, s]));
        // the side wall back to the cab's rear
        const wall: Vec3[] = ([[f0 - c, y0, w0], [CAB_X0, y0, w0], [CAB_X0, y1, w1], [f1 - c, y1, w1]] as Vec3[]).map((p) => mz(p, s));
        paintedPolygon(m, green, wall, outward(wall, [0, 0, s]));
      }
    }
    // the roof's flat top, its front corners cut
    const [yt, wt, ft] = CAB[CAB.length - 1]!;
    polygon(m, l.roof, [[CAB_X0, yt, -wt], [ft - c, yt, -wt], [ft, yt, -(wt - c)], [ft, yt, wt - c], [ft - c, yt, wt], [CAB_X0, yt, wt]], [0, 1, 0]);
    // the rear wall against the equipment box
    paintedPolygon(m, green, [...CAB.map(([y, w]): Vec3 => [CAB_X0, y, w]), ...[...CAB].reverse().map(([y, w]): Vec3 => [CAB_X0, y, -w])], [-1, 0, 0]);
  });
  // the windscreens: two panes on the raked plane, rounded, a broad post between
  m.scope("windscreen", () => {
    const [y0, , x0] = CAB[1]!, [y1, w1, x1] = CAB[2]!;
    const n = outward([[x0, y0, 0], [x0, y0, 1], [x1, y1, 1]], [1, 0, 0]);
    const xAt = (y: number) => x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
    const halfAt = (y: number) => 1.56 + ((w1 - 1.56) * (y - y0)) / (y1 - y0) - c;
    const P = (z: number, y: number, off: number): Vec3 => [xAt(y) + n[0] * off, y + n[1] * off, z];
    for (const s of [-1, 1]) {
      const pane = (mat: string, za: number, out: number, ya: number, yb: number, off: number, r: number) => {
        const zb0 = halfAt(ya) - out, zb1 = halfAt(yb) - out;
        const q: Array<[number, number]> = [[za + r, ya], [zb0 - r, ya], [zb0, ya + r], [zb1, yb - r], [zb1 - r, yb], [za + r, yb], [za, yb - r], [za, ya + r]];
        polygon(m, mat, q.map(([z, y]) => P(s * z, y, off)), n);
      };
      pane("steel", 0.1, 0.1, 3.4, 4.35, 0.004, 0.12);
      pane("glass", 0.14, 0.14, 3.44, 4.31, 0.008, 0.1);
      // the wiper parked across the pane's top, pivoting at its outer head
      m.rod("black", P(s * 1.05, 4.22, 0.02), P(s * 0.45, 3.62, 0.02), 0.012, 4);
    }
  });
  // the face: the lamp pairs in their dark housings, the emblem, the yellow grab strips
  m.scope("lamps", () => {
    for (const s of [-1, 1]) {
      decalX(m, "black", FACE + 0.003, 1, ...side(s, 0.8, 1.25), 2.83, 3.23);
      extrude(m, "lampHead", "x", ngon(12, 0.11, 0, s * 0.95, 3.02), [FACE + 0.003, FACE + 0.04]);
      extrude(m, "lampAmber", "x", ngon(10, 0.07, 0, s * 1.15, 3.02), [FACE + 0.003, FACE + 0.03]);
      decalX(m, l.railEnds, FACE + 0.003, 1, ...side(s, 0.75, 1.45), 2.02, 2.06);
    }
    // the four-lamp box on the roof's front edge
    const xb = FACE - 0.24;
    block(m, "black", xb - 0.4, xb, 4.47, 4.775, -0.6, 0.6);
    for (const z of [-0.43, -0.16, 0.16, 0.43]) {
      extrude(m, "steel", "x", ngon(12, 0.13, 0, z, 4.62), [xb, xb + 0.03]);
      extrude(m, "lampHead", "x", ngon(12, 0.11, 0, z, 4.62), [xb + 0.03, xb + 0.04]);
    }
  });
  // the side windows: the sliding pair high on the leaning side, a small pane low behind it; the rear door
  m.scope("side windows", () => {
    const [y0, w0] = CAB[1]!, [y1, w1] = CAB[2]!;
    const zAt = (y: number) => w0 + ((w1 - w0) * (y - y0)) / (y1 - y0);
    for (const s of [-1, 1]) {
      const n = outward([[0, y0, s * w0], [1, y0, s * w0], [0, y1, s * w1]], [0, 0.2, s]);
      const P = (x: number, y: number, off: number): Vec3 => [x, y + n[1] * off, s * zAt(y) + n[2] * off];
      const pane = (mat: string, xa: number, xb: number, ya: number, yb: number, off: number) => polygon(m, mat, [P(xa, ya, off), P(xb, ya, off), P(xb, yb, off), P(xa, yb, off)], n);
      pane("rubber", 8.7, FACE - 0.22, 3.48, 4.28, 0.004);
      pane("glass", 8.75, 9.5, 3.53, 4.23, 0.008);
      pane("glass", 9.58, FACE - 0.27, 3.53, 4.23, 0.008);
      const zz = s * (1.56 + 0.004);
      decalZ(m, "rubber", zz, s, 9.0, 9.32, 1.78, 2.38);
      decalZ(m, "glass", zz + s * 0.004, s, 9.03, 9.29, 1.81, 2.35);
      // the grab iron at the cab's rear corner
      m.rod(l.railEnds, [CAB_X0 - 0.06, D + 0.3, s * (HOOD_HALF + 0.12)], [CAB_X0 - 0.06, D + 2.0, s * (HOOD_HALF + 0.12)], 0.018, 6);
    }
  });
  // the cab's rear wall: a door each side of the box, onto the walkways
  m.scope("rear doors", () => {
    for (const s of [-1, 1]) {
      for (const z of [HOOD_HALF + 0.05, 1.5]) decalX(m, "black", CAB_X0 - 0.004, -1, s * z - 0.012, s * z + 0.012, D + 0.05, D + 1.95);
      decalX(m, "black", CAB_X0 - 0.004, -1, ...side(s, HOOD_HALF + 0.05, 1.5), D + 1.95, D + 1.97);
      decalX(m, "rubber", CAB_X0 - 0.004, -1, ...side(s, HOOD_HALF + 0.12, 1.43), D + 1.2, D + 1.75);
    }
  });
  // the horn on the cab's roof behind the lamps, trumpets forward; the antenna
  m.scope("horn", () => {
    const x = CAB_X0 + 0.35, y = CAB_TOP;
    block(m, "black", x - 0.15, x + 0.15, y, y + 0.05, -0.12, 0.12);
    for (const z of [-0.06, 0.06]) m.sweep("black", "x", ngon(8, 0.03, 0, z, y + 0.1), x - 0.2, ngon(8, 0.055, 0, z, y + 0.1), x + 0.25);
  });
  m.scope("antenna", () => m.prism("black", ngon(6, 0.022, 0, CAB_X0 + 0.9, 0.6), CAB_TOP - 0.02, CAB_TOP + 0.15));
}

function walkways(m: MeshBuilder, l: Hxn5Livery): void {
  const y = D + 1.0, yMid = D + 0.5, z = DECK_HALF - 0.03, L = SILL;
  const [a, b] = [-L + 0.22, CAB_X0 - 0.15];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      const zc = sd * z;
      tubeX(m, l.rails, 0.02, a, y, zc, b, y, zc, 6);
      tubeX(m, l.rails, 0.016, a, yMid, zc, b, yMid, zc, 6);
      const n = Math.round((b - a) / 1.5);
      for (let i = 0; i <= n; i++) m.prism(i === 0 || i === n ? l.railEnds : l.rails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), D, y);
    });
  m.scope("end rails", () => {
    const x = -(L - 0.22);
    for (const sd of [-1, 1]) m.rod(l.rails, [x, y, sd * 0.55], [x, y, sd * z], 0.02, 6);
    for (const sd of [-1, 1]) m.prism(l.railEnds, ngon(6, 0.022, 0, x, sd * 0.55), D, y);
  });
}

function underframe(m: MeshBuilder, _l: Hxn5Livery): void {
  const t = TANK;
  m.scope("fuel tank", () => {
    const top = SILL_BOTTOM, r = 0.3;
    const sec: Array<[number, number]> = [[-t.half, top], [t.half, top]];
    for (let k = 0; k <= 3; k++) {
      const a = (k / 3) * (Math.PI / 2);
      sec.push([t.half - r + r * Math.cos(a), t.y0 + r - r * Math.sin(a)]);
    }
    for (let k = 0; k <= 3; k++) {
      const a = (k / 3) * (Math.PI / 2);
      sec.push([-(t.half - r) - r * Math.sin(a), t.y0 + r - r * Math.cos(a)]);
    }
    m.sweep("tank", "x", sec, t.x0, sec, t.x1);
    for (const sd of [-1, 1]) {
      // the louvred equipment cabinet on the tank's side: four doors
      const zz = sd * (t.half + 0.004);
      for (let i = 0; i < 4; i++) {
        const x0 = -3.2 + i * 1.17, x1 = x0 + 1.1;
        decalZ(m, "grille", zz, sd, x0, x1, 0.62, 1.12);
        for (let y = 0.98; y < 1.1; y += 0.04) decalZ(m, "louvre", zz + sd * 0.004, sd, x0 + 0.15, x1 - 0.15, y, y + 0.018);
      }
      block(m, "steel", t.x1 - 0.6, t.x1 - 0.44, 0.85, 1.05, ...side(sd, t.half, t.half + 0.05));
    }
  });
  m.scope("air reservoirs", () => {
    for (const sd of [-1, 1]) for (const y of [0.78, 1.0]) tankX(m, "reservoir", -4.85, -3.1, sd * 1.05, y, 0.11, 10);
  });
}

function markings(m: MeshBuilder, l: Hxn5Livery): void {
  // the face: the emblem over the band, the characters and the number on it
  m.scope("face", () => {
    const x = FACE + 0.004;
    emblem(m, l.emblem, [x, 2.93, 0], [0, 0, -1], [1, 0, 0], 0.2);
    hexie(m, l.letter, [x, 2.37, 0.343], [0, 0, -1], [1, 0, 0], 0.28, 0.45);
    decalX(m, l.emblem, FACE + 0.003, 1, -0.45, 0.45, 2.14, 2.34);
    planeText(m, l.letter, l.number, [x + 0.001, 2.17, 0], [0, 0, -1], [1, 0, 0], 0.14, 0.085, 0.03);
  });
  // the band wrapping round the cab's corners onto the sides, its rear end leaning
  m.scope("band", () => {
    for (const s of [-1, 1]) sidePoly(m, l.band, s, 1.56 + 0.004, [[FACE - CORNER, BAND[0]], [FACE - 0.56, BAND[0]], [FACE - 0.38, BAND[1]], [FACE - CORNER, BAND[1]]]);
  });
  // the hood sides: the characters large on the grey panel, the number after them
  m.scope("hood lettering", () => {
    for (const s of [-1, 1]) {
      const zz = s * (HOOD_HALF + 0.01);
      const h = 0.7, w = h * 2.25;
      // reading from the cab end on the left side, from the rear on the right (always left to right)
      const x0 = s > 0 ? 0.3 - w / 2 : 0.3 + w / 2;
      hexie(m, l.letter, [x0, 2.3, zz], [s, 0, 0], [0, 0, s], h);
      planeText(m, l.letter, l.number, [s > 0 ? -1.85 : -1.6, 2.3, zz], [s, 0, 0], [0, 0, s], 0.26, 0.16, 0.05);
    }
  });
  // the rear face: the characters and the number under the wings, the emblem below
  m.scope("rear", () => {
    const x = HOOD_REAR - 0.004;
    hexie(m, l.letter, [x, 3.62, -0.31], [0, 0, 1], [-1, 0, 0], 0.26, 0.4);
    planeText(m, l.letter, l.number, [x, 3.28, 0], [0, 0, 1], [-1, 0, 0], 0.15, 0.09, 0.03);
    emblem(m, l.emblem, [x, 2.4, 0], [0, 0, 1], [-1, 0, 0], 0.2);
  });
}
