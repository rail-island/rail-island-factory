// The GE ES44AC Evolution (2005) in detail: the wide-nose safety cab with its two
// raked windscreens over the short nose, the dynamic brake box overhanging the hood
// behind the cab over the AC inverter cabinet, the engine hood with its doors and
// air intake, the radiator at the rear with its wings flaring out over screened
// intakes, the GE high-adhesion trucks at 50 ft 4 in centres, the 5,000 gallon fuel
// tank with its air reservoirs, and each railroad's paint measured from photographs
// (assets/ge-es44ac/). Built on the hood unit kit's helpers (usHoodKit.ts) but drawn
// here, so the kit's other designs are unchanged; usDiesels.ts registers it.
// Metres, +X toward the nose, wheel contact at y = 0. See docs/models/us-diesels.md.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { tubeX } from "./cd163.ts";
import { block, bogieGeometry, coil, exhaust, extrude, paint, plate, side, tankX, type BogieSpec } from "./dieselParts.ts";
import { US_PALETTE, decalX, decalZ, knuckleCoupler, paintedSweep, type Band, type Paint, type UsLivery } from "./usHoodKit.ts";
import { LOD_GLASS, lodBands, type LodBand, type LodShell } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures: published figures (GE/CIT AC4400CW and ES44 data: 73 ft 2 in over the
// couplers, 50 ft 4 in truck centres, 13 ft 2 in truck wheelbase, 42 in wheels,
// 15 ft 5 in over the cab, 10 ft 3 in wide) and photographs scaled from them.

const LENGTH = ft(73, 2); // 22.30 m
const SILL = 10.6; // |x| of the end sills
const D = 1.65; // walkway top
const SILL_BOTTOM = 1.18;
const DECK_HALF = 1.58;
/** The cab and nose: half width, roof, the cab's rear wall, the nose face. */
const CAB_HALF = 1.56;
const CAB_TOP = 4.7;
const CAB_X0 = 5.4;
const NOSE_X = 9.75;
/**
 * The nose's hipped top (UP 2539 head-on at 94 px/m, BNSF 6156 at 144 px/m, BNSF 5824 side): the face is a
 * pentagon, 3.22 m high at its corners rising to a ridge at 3.56 m on the centre line; two large planes
 * fall from the ridge and the windscreens' foot (3.70 m) down to the side walls, whose top edge climbs from
 * the face's corner back to 3.45 m at the cab. The windscreen plane's half width.
 */
const FACE_CORNER = 3.22;
const RIDGE = 3.56;
const SIDE_REAR = 3.45;
const TOP_HALF = 1.4;
/** The cab front by height: [y, x of the front plane]: the slope under the windscreen, the windscreen, the board band, the roof edge. */
const CAB_FRONT: ReadonlyArray<readonly [number, number]> = [[3.7, 8.3], [3.78, 8.27], [4.26, 8.08], [4.6, 8.0]];
const CORNER = 0.14;
/** The long hood: half width, the engine hood's roof and its chamfer, the rear face. */
const HOOD_HALF = 1.1;
const HOOD_TOP = 4.45;
const HOOD_R = 0.18;
const HOOD_REAR = -10.05;
/** The dynamic brake box over the inverter cabinet behind the cab. */
const DB = { x0: 1.9, x1: CAB_X0, foot: 3.75, half: 1.38, side0: 3.97, side1: 4.5, top: 4.6 };
/** The radiator with its wings: x span, the wing's underside from the hood side out to the wing face, its top; the overhang over the rear face. */
const RAD = { x0: HOOD_REAR, x1: -5.2, foot: 3.35, half: 1.5, side0: 3.95, side1: 4.55, top: 4.62, overhang: -10.4 };
const TRUCK_CENTRE = ft(50, 4) / 2;
const TRUCK: BogieSpec = {
  axles: [-ft(6, 7), 0, ft(6, 7)], wheelR: ft(0, 21), frameHalf: 2.75, frameTop: 0.95, frameBottom: 0.64,
  frameZ: [0.92, 1.06], primary: "leaf", secondary: [], secondaryZ: 1.12, bolster: SILL_BOTTOM,
};
/** The engine air intake's screens high on the hood sides: x span and foot. */
const INTAKE = [-0.3, 1.65, 3.55] as const;
const TANK = { x0: -4.75, x1: 4.75, y0: 0.42, half: 1.42 };

// ---------------------------------------------------------------------------
// Paint

export interface Es44Livery extends UsLivery {
  /** The rear hood end's face by height. */
  rear: readonly Band[];
  /** The nose top and the radiator wings' faces. */
  noseTop: string;
  wing: string;
  /** The windscreens' and side windows' frames. */
  frameMat: string;
  /** Number boards: the board and its digits. */
  board: string;
  boardText: string;
  tank: string;
  /** The front platform's corner handrails. */
  frontRails: string;
  /** The livery's own markings: letters, stripes and emblems. */
  marks: (m: MeshBuilder) => void;
  /** The hood's lettering: centre along x, letter width and gap, italic slant. */
  letterX: number;
  letterW?: number;
  letterGap?: number;
  letterSlant?: number;
  /** The rear face's number (default the number's paint); the slope under the windscreens. */
  rearText?: string;
  slope?: string;
  /** The nose's sides (default the cab's) and the front platform's edge (default the pilot's). */
  noseSides?: readonly Band[];
  anticlimber?: string;
  /** The dynamic brake box's and the radiator wings' paint by height (default the hood's; the wing's colour). */
  dbBands?: readonly Band[];
  wingBands?: readonly Band[];
  /** The headlight pair's position across the nose face (default the centre). */
  headZ?: number;
}

const P = {
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"), upBlue: paint("#1f3f8f"), upWhite: paint("#f1f1ec"),
  bnsfOrange: paint("#ec6a1f"), bnsfBlack: paint("#1f2022"), bnsfYellow: paint("#f2c31a"),
  csxBlue: paint("#1e2b4f"), csxYellow: paint("#f3bf1e"), csxGrey: paint("#3c4048"),
  truckGrey: paint("#4c4e50", 0.8), truckGrime: paint("#776f63", 0.9), tankGrey: paint("#8d8e8a", 0.7), reservoir: paint("#c3c6c6", 0.35), truckBlack: paint("#242527", 0.85), boardBlack: paint("#151517", 0.4),
};
const pick = (...names: Array<keyof typeof P>): Record<string, MaterialSpec> => Object.fromEntries(names.map((n) => [n, P[n]]));

/** Text laid on a plane: u along `ux`, v up, from origin o (the text's bottom centre), facing n; `slant` leans it (italic). */
function planeText(m: MeshBuilder, mat: string, text: string, o: Vec3, ux: Vec3, n: Vec3, h: number, w: number, gap: number, slant = 0, stroke = h * (slant > 0 ? 0.24 : 0.16)): void {
  const tw = strokeWidth(text, w, gap);
  const pts = strokeText(text, -tw / 2, 0, h, w, gap, false, stroke).map(([u, v]): Vec3 => {
    const uu = u + slant * v;
    return [o[0] + ux[0] * uu, o[1] + v, o[2] + ux[2] * uu];
  });
  m.facets(mat, pts, n);
}

/** Text on a side wall z = s * zw reading left to right from outside, centred at xc. */
function sideWords(m: MeshBuilder, mat: string, text: string, s: number, zw: number, xc: number, y0: number, h: number, w: number, gap: number, slant = 0): void {
  planeText(m, mat, text, [xc, y0, s * zw], [s, 0, 0], [0, 0, s], h, w, gap, slant);
}

/** Text on a face x = e * xf reading left to right from outside, centred at zc. */
function endWords(m: MeshBuilder, mat: string, text: string, e: number, xf: number, zc: number, y0: number, h: number, w: number, gap: number, slant = 0): void {
  planeText(m, mat, text, [e * xf, y0, zc], [0, 0, -e], [e, 0, 0], h, w, gap, slant);
}

/** A polygon in (u, y) on the side wall z = s * zw, u along x; any simple polygon. */
function sidePoly(m: MeshBuilder, mat: string, s: number, zw: number, pts: ReadonlyArray<readonly [number, number]>): void {
  polygon(m, mat, pts.map(([x, y]): Vec3 => [x, y, s * zw]), [0, 0, s]);
}

/** A polygon in (z, y) on the face x = e * xf. */
function facePoly(m: MeshBuilder, mat: string, e: number, xf: number, pts: ReadonlyArray<readonly [number, number]>): void {
  polygon(m, mat, pts.map(([z, y]): Vec3 => [e * xf, y, z]), [e, 0, 0]);
}

// ---------------------------------------------------------------------------
// Faces: any simple planar polygon, triangulated by ear clipping, painted by height

function project(n: Vec3): (p: Vec3) => [number, number] {
  const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
  if (ax >= ay && ax >= az) return (p) => [p[2], p[1]];
  if (ay >= az) return (p) => [p[0], p[2]];
  return (p) => [p[0], p[1]];
}

function triangulate(pts: readonly Vec3[], n: Vec3): Vec3[] {
  const pr = project(n);
  const q = pts.map(pr);
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
  const l = Math.hypot(...nv) || 1;
  return [nv[0] / l, nv[1] / l, nv[2] / l];
}

/** The outward normal of a polygon, flipped to agree with the rough direction `out`. */
function outward(pts: readonly Vec3[], out: Vec3): Vec3 {
  const n = normalOf(pts);
  return n[0] * out[0] + n[1] * out[1] + n[2] * out[2] >= 0 ? n : [-n[0], -n[1], -n[2]];
}

const mz = (p: Vec3, s: number): Vec3 => [p[0], p[1], s * p[2]];

// ---------------------------------------------------------------------------
// The design

export function buildEs44ac(l: Es44Livery): MeshBuilder {
  const m = new MeshBuilder({ ...US_PALETTE, ...l.palette });
  m.scope("frame", () => frame(m, l));
  m.scope("long hood", () => longHood(m, l));
  m.scope("front", () => nose(m, l));
  m.scope("cab", () => cab(m, l));
  m.scope("walkways", () => walkways(m, l));
  m.scope("trucks", () => {
    for (const e of [1, -1])
      m.scope(e > 0 ? "front truck" : "rear truck", () => m.bogie(() => {
        const xc = e * TRUCK_CENTRE;
        bogieGeometry(m, xc, TRUCK);
        m.scope("hi-ad", () => hiAdCasting(m, l, xc));
      }));
  });
  m.scope("underframe", () => underframe(m, l));
  m.scope("markings", () => l.marks(m));
  return m;
}

/**
 * The distant model (docs/models/lod.md): the narrow hood with the dynamic brake box's height,
 * the radiator as wide as its wings, the cab with its windscreens, the nose, frame, tank and trucks.
 */
export function buildEs44acLod(l: Es44Livery, budget = 100): MeshBuilder {
  const top = (bands: readonly Band[], y0: number, y1: number, roof: string): LodBand[] => [...lodBands(bands, y0, y1 - 0.15), [y1 - 0.15, y1, roof]];
  const shell = (x0: number, x1: number, half: number, y1: number, side: readonly LodBand[], end: readonly LodBand[], roof: string, extra: Partial<LodShell> = {}): LodShell => ({
    y0: D, xc: (x0 + x1) / 2, tip: [[D, (x1 - x0) / 2], [y1, (x1 - x0) / 2]],
    hw: [[D, half], [y1 - 0.12, half], [y1, Math.max(0.1, half - 0.15)]],
    side, end, roof, ...extra,
  });
  const ends = endBands(l), cabRoof = l.cabRoof ?? l.roof;
  const wing = l.wingBands ?? [[RAD.foot, 9, l.wing] as Band];
  const radSide: Band[] = [...l.body.filter((b) => b[0] < RAD.foot).map((b): Band => [b[0], Math.min(b[1], RAD.foot), b[2]]), ...wing];
  const hood = shell(RAD.x1, CAB_X0, HOOD_HALF, HOOD_TOP, top(l.body, D, HOOD_TOP, l.roof), top(l.body, D, HOOD_TOP, l.roof), l.roof, { ends: [] });
  const radiator = shell(RAD.overhang, RAD.x1, RAD.half, RAD.top, top(radSide, D, RAD.top, l.wing), top(l.rear, D, RAD.top, l.wing), l.wing, { ends: [-1, 1] });
  const cab = shell(CAB_X0, 8.2, CAB_HALF, CAB_TOP, top(cabBands(l), D, CAB_TOP, cabRoof), top(ends, D, CAB_TOP, cabRoof), cabRoof, {
    endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.08, TOP_HALF] as const : [-TOP_HALF, -0.08] as const, y: [3.78, 4.26] as const, mat: LOD_GLASS, ends: [1], optional: 0.3 })),
    sideWindows: sideWindows([{ u: [5.55, 7.5], y: [3.82, 4.46] }]),
  });
  const front = shell(8.2, NOSE_X, CAB_HALF, SIDE_REAR, lodBands(l.noseSides ?? cabBands(l), D, SIDE_REAR), lodBands(ends, D, SIDE_REAR), l.noseTop, { ends: [1] });
  const dbBox: LocoBox = { name: "dynamic brake", mat: bandAt(l.dbBands ?? l.body, 4.2), x: [DB.x0, DB.x1], y: [DB.side0, DB.top], w: DB.half, optional: 40 };
  const boxes: LocoBox[] = [
    { name: "frame", mat: l.frame, x: [-SILL, SILL], y: [SILL_BOTTOM, D], w: DECK_HALF },
    { name: "fuel tank", mat: l.tank, x: [TANK.x0, TANK.x1], y: [TANK.y0, SILL_BOTTOM], w: TANK.half, top: false, optional: 35 },
    dbBox,
    ...[-1, 1].map((e): LocoBox => ({ name: "pilot", mat: l.pilot, x: e > 0 ? [SILL - 0.4, SILL] : [-SILL, -SILL + 0.4], y: [0.2, SILL_BOTTOM], w: DECK_HALF - 0.62, top: false, optional: 30 })),
  ];
  return locoLod({
    palette: { ...US_PALETTE, ...l.palette },
    shells: [hood, radiator, front, cab],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * TRUCK_CENTRE, half: TRUCK.frameHalf, top: TRUCK.frameTop })),
  }, budget);
}

const cabBands = (l: Es44Livery): readonly Band[] => l.cab ?? l.body;
const endBands = (l: Es44Livery): readonly Band[] => l.ends ?? l.cab ?? l.body;

function frame(m: MeshBuilder, l: Es44Livery): void {
  const L = SILL;
  m.scope("deck", () => {
    block(m, "walk", -L, L, D - 0.04, D, -DECK_HALF, DECK_HALF);
    // the side sill, deep on the GE frame, its lower edge stepping up at the ends over the pilots
    const sill: Array<[number, number]> = [[-DECK_HALF, SILL_BOTTOM], [DECK_HALF, SILL_BOTTOM], [DECK_HALF, D - 0.04], [-DECK_HALF, D - 0.04]];
    m.sweep(l.frame, "x", sill, -L, sill, L);
  });
  if (l.sillStripe)
    m.scope("sill stripe", () => {
      const [a, b, mat] = l.sillStripe!;
      for (const sd of [-1, 1]) decalZ(m, mat, sd * (DECK_HALF + 0.004), sd, -L + 0.03, L - 0.03, D - b, D - a);
    });
  m.scope("reflective tape", () => {
    // the conspicuity tape: short yellow dashes along the sill
    for (const sd of [-1, 1])
      for (let x = -L + 0.6; x < L - 0.5; x += 1.2) decalZ(m, "safety", sd * (DECK_HALF + 0.008), sd, x, x + 0.3, SILL_BOTTOM + 0.1, SILL_BOTTOM + 0.17);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the pilot: a deep plate, its lower part leaning back to the rail clearance, the step wells cut in at the corners
      m.scope("pilot", () => {
        const foot = 0.2, knee = 0.62;
        const sec: Array<[number, number]> = e > 0
          ? [[L - 0.4, foot], [L - 0.14, foot], [L, knee], [L, SILL_BOTTOM], [L - 0.4, SILL_BOTTOM]]
          : [[-L + 0.4, foot], [-L + 0.4, SILL_BOTTOM], [-L, SILL_BOTTOM], [-L, knee], [-L + 0.14, foot]];
        m.sweep(l.pilot, "z", sec, -DECK_HALF + 0.62, sec, DECK_HALF - 0.62);
        // the anticlimber along the end sill's top
        block(m, e > 0 ? l.anticlimber ?? l.pilot : l.pilot, ...along(L - 0.06, L + 0.05), D - 0.2, D - 0.02, -DECK_HALF + 0.05, DECK_HALF - 0.05);
        // the snowplough's ribs
        for (const z of [-0.5, 0, 0.5]) block(m, l.pilot, ...along(L - 0.3, L + 0.012), foot + 0.05, knee, z - 0.03, z + 0.03);
      });
      m.scope("coupler", () => knuckleCoupler(m, e, L, LENGTH / 2, 0.88));
      m.scope("hoses", () => {
        for (const z of [-0.42, 0.42, 0.62]) {
          const x0 = e * (L - 0.02), x1 = e * (L + 0.16);
          m.loft("hose", ngon(6, 0.03, 0, x0, z), 0.48, ngon(6, 0.03, 0, x1, z), 0.82);
        }
        // the MU receptacles on the end sill
        for (const z of [-1.0, 1.0]) extrude(m, "black", "x", ngon(8, 0.07, 0, z, 1.0), along(L - 0.01, L + 0.06));
      });
      // the corner steps: a stair in a well at each corner of the pilot, climbing back from the end, between side plates
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z: [number, number] = side(sd, DECK_HALF - 0.58, DECK_HALF - 0.05);
          [0.36, 0.68, 1.0, 1.32].forEach((y, i) => block(m, "steel", ...along(L - 0.42 - i * 0.08, L - 0.04 - i * 0.08), y, y + 0.03, ...z));
          for (const zz of [DECK_HALF - 0.6, DECK_HALF - 0.03]) block(m, l.pilot, ...along(L - 0.72, L - 0.02), 0.3, SILL_BOTTOM, ...side(sd, zz - 0.02, zz + 0.02));
          // the well's back plate
          block(m, l.pilot, ...along(L - 0.74, L - 0.7), 0.3, SILL_BOTTOM, ...z);
          // the grab irons beside the stair
          for (const zz of [DECK_HALF - 0.64, DECK_HALF + 0.01]) m.rod("handrail", [e * (L - 0.06), 0.45, sd * zz], [e * (L - 0.34), D - 0.05, sd * zz], 0.016, 6);
        }
      });
    });
  // the front ditch lights, on the platform's edge either side of the coupler
  m.scope("ditch lights", () => {
    for (const z of [-0.8, 0.8]) {
      block(m, l.frontRails === "handrail" ? "black" : l.frontRails, NOSE_X + 0.4, NOSE_X + 0.62, D, D + 0.3, z - 0.15, z + 0.15);
      block(m, "black", NOSE_X + 0.62, NOSE_X + 0.66, D + 0.03, D + 0.27, z - 0.12, z + 0.12);
      extrude(m, "ditch", "x", ngon(10, 0.09, 0, z, D + 0.15), [NOSE_X + 0.66, NOSE_X + 0.68]);
    }
  });
}

/** The section of the engine hood: chamfered roof corners. */
function hoodSection(): Array<[number, number]> {
  const h = HOOD_HALF, t = HOOD_TOP, r = HOOD_R;
  return [[-h, D], [h, D], [h, t - r], [h - r, t], [-(h - r), t], [-h, t - r]];
}

function longHood(m: MeshBuilder, l: Es44Livery): void {
  const hoodPaint: Paint = { bands: l.body, ends: l.rear, roofFrom: HOOD_TOP - HOOD_R * 0.5, roof: l.roof };
  // the engine hood from the radiator to the dynamic brake box (no caps: both ends abut)
  m.scope("hood", () => paintedSweep(m, "x", hoodSection(), RAD.x1, DB.x0, hoodPaint, []));
  // the inverter cabinet and the dynamic brake box overhanging it, against the cab's rear wall
  m.scope("dynamic brake", () => {
    const sec: Array<[number, number]> = [[-HOOD_HALF, D], [HOOD_HALF, D], [HOOD_HALF, DB.foot], [DB.half, DB.side0], [DB.half, DB.side1], [DB.half - 0.1, DB.top], [-(DB.half - 0.1), DB.top], [-DB.half, DB.side1], [-DB.half, DB.side0], [-HOOD_HALF, DB.foot]];
    const dbBands = l.dbBands ?? l.body;
    paintedSweep(m, "x", sec, DB.x0, DB.x1, { bands: dbBands, ends: dbBands, roofFrom: DB.top - 0.05, roof: l.roof }, [-1]);
    for (const sd of [-1, 1]) {
      const zz = sd * (DB.half + 0.005);
      // the grid blowers' screened intakes high on the box: two panels with vertical slats
      for (const [a, b] of [[2.15, 3.25], [3.55, 5.15]] as const) {
        decalZ(m, "grille", zz, sd, a, b, DB.side0 + 0.05, DB.side1 - 0.06);
        for (let x = a + 0.08; x < b - 0.05; x += 0.11) decalZ(m, "louvre", zz + sd * 0.004, sd, x, x + 0.04, DB.side0 + 0.08, DB.side1 - 0.09);
      }
      // the inverter cabinet's doors under the box
      for (const x of [DB.x0 + 0.12, 3.6, DB.x1 - 0.1]) decalZ(m, "black", sd * (HOOD_HALF + 0.004), sd, x - 0.012, x + 0.012, D + 0.12, DB.foot - 0.05);
      decalZ(m, "black", sd * (HOOD_HALF + 0.004), sd, DB.x0 + 0.12, DB.x1 - 0.1, D + 1.25, D + 1.27);
      for (const x of [2.75, 4.4]) block(m, "steel", x - 0.08, x + 0.08, D + 0.95, D + 1.0, ...side(sd, HOOD_HALF, HOOD_HALF + 0.04));
    }
    // the box's roof grille over the grid blowers
    block(m, "fanGuard", 2.3, 4.9, DB.top, DB.top + 0.03, -0.9, 0.9);
    for (let x = 2.4; x < 4.85; x += 0.16) block(m, "louvre", x, x + 0.05, DB.top + 0.03, DB.top + 0.04, -0.85, 0.85);
  });
  // the radiator: the hood's side up to the wings, the wings flaring out to the full width
  m.scope("radiator", () => {
    const flare: Array<[number, number]> = [[-HOOD_HALF, D], [HOOD_HALF, D], [HOOD_HALF, RAD.foot], [RAD.half, RAD.side0], [RAD.half, RAD.side1], [RAD.half - 0.08, RAD.top], [-(RAD.half - 0.08), RAD.top], [-RAD.half, RAD.side1], [-RAD.half, RAD.side0], [-HOOD_HALF, RAD.foot]];
    const radPaint: Paint = { bands: [...l.body.filter((b) => b[0] < RAD.foot).map((b): Band => [b[0], Math.min(b[1], RAD.foot), b[2]]), ...(l.wingBands ?? [[RAD.foot, 9, l.wing] as Band])], ends: l.rear, roofFrom: RAD.top - 0.04, roof: l.wing };
    paintedSweep(m, "x", flare, RAD.x0, RAD.x1, radPaint, [-1, 1]);
    // the wings reach back over the rear face: their overhang with its own underside
    const wing: Array<[number, number]> = [[-RAD.half, RAD.side0], [RAD.half, RAD.side0], [RAD.half, RAD.side1], [RAD.half - 0.08, RAD.top], [-(RAD.half - 0.08), RAD.top], [-RAD.half, RAD.side1]];
    paintedSweep(m, "x", wing, RAD.overhang, RAD.x0, { bands: [[0, 9, l.wing]], roofFrom: RAD.top - 0.04, roof: l.wing }, [-1]);
    m.facets(l.wing, [[RAD.overhang, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, RAD.half], [RAD.overhang, RAD.side0, -RAD.half], [RAD.x0, RAD.side0, RAD.half], [RAD.overhang, RAD.side0, RAD.half]], [0, -1, 0]);
    // the radiator intakes: screens across the wings' undersides, with their diagonal braces
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
      // the braces: diagonals from the hood side out to the wing's edge
      for (let x = RAD.x0 + 0.5; x < RAD.x1 - 0.3; x += 1.2) {
        m.rod(l.wing, [x, RAD.foot + 0.02, sd * (HOOD_HALF + 0.02)], [x + 0.55, RAD.side0 - 0.03, sd * (RAD.half - 0.03)], 0.025, 4);
      }
      // the radiator compartment's doors under the wings, each with two tall louvres
      const zz = sd * (HOOD_HALF + 0.004);
      const doors = [-9.85, -8.85, -7.85, -6.85, -6.0, RAD.x1 - 0.05];
      for (const x of doors) decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, D + 0.1, RAD.foot - 0.12);
      for (let i = 0; i < 3; i++) {
        const a = doors[i]!, b = doors[i + 1]!;
        for (const f of [0.28, 0.62]) {
          const x = a + (b - a) * f;
          decalZ(m, "louvre", zz, sd, x, x + 0.14, D + 0.45, RAD.foot - 0.35);
          for (let y = D + 0.5; y < RAD.foot - 0.4; y += 0.12) decalZ(m, "grille", zz + sd * 0.004, sd, x + 0.01, x + 0.13, y, y + 0.04);
        }
        decalZ(m, "steel", zz, sd, (a + b) / 2 - 0.08, (a + b) / 2 + 0.08, D + 1.0, D + 1.05);
      }
    }
  });
  // the two radiator fans under their guards on the wing top
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
  // the engine air intake: a screened opening high on each side ahead of the exhaust
  m.scope("air intake", () => {
    for (const sd of [-1, 1]) {
      const zz = sd * (HOOD_HALF + 0.004);
      decalZ(m, "grille", zz, sd, INTAKE[0], INTAKE[1], INTAKE[2], HOOD_TOP - HOOD_R - 0.08);
      for (let y = INTAKE[2] + 0.05; y < HOOD_TOP - HOOD_R - 0.12; y += 0.09) decalZ(m, "louvre", zz + sd * 0.004, sd, INTAKE[0] + 0.05, INTAKE[1] - 0.05, y, y + 0.035);
    }
    // the filter housing's hatch on the roof
    block(m, "fanGuard", INTAKE[0], INTAKE[1], HOOD_TOP, HOOD_TOP + 0.08, -0.7, 0.7);
  });
  m.scope("exhaust", () => {
    exhaust(m, -1.9, 0, HOOD_TOP - 0.02, HOOD_TOP + 0.24, 0.42, 0.7);
    // the stack's base plate
    block(m, "black", -2.35, -1.45, HOOD_TOP, HOOD_TOP + 0.04, -0.5, 0.5);
  });
  // the engine hood's doors: seams, a latch handle each, louvres at the foot of every other
  m.scope("doors", () => {
    const x0 = RAD.x1 + 0.1, x1 = DB.x0 - 0.1;
    const n = 7;
    const w = (x1 - x0) / n;
    for (const sd of [-1, 1]) {
      const zz = sd * (HOOD_HALF + 0.004);
      for (let i = 0; i <= n; i++) {
        const x = x0 + i * w;
        const underIntake = x > INTAKE[0] - 0.02 && x < INTAKE[1] + 0.02;
        decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, D + 0.12, underIntake ? INTAKE[2] - 0.04 : HOOD_TOP - HOOD_R - 0.1);
        if (i === n) continue;
        block(m, "steel", x + w / 2 - 0.09, x + w / 2 + 0.09, D + 1.05, D + 1.1, ...side(sd, HOOD_HALF, HOOD_HALF + 0.04));
        if (i % 2 === 0) for (let y = D + 0.2; y < D + 0.62; y += 0.08) decalZ(m, "louvre", zz, sd, x + 0.15, x + w - 0.15, y, y + 0.035);
      }
      decalZ(m, "black", zz, sd, x0, INTAKE[0] - 0.05, HOOD_TOP - HOOD_R - 0.12, HOOD_TOP - HOOD_R - 0.1);
    }
    // the roof hatches' seams
    for (let i = 0; i <= 3; i++) {
      const x = x0 + (i * (x1 - x0)) / 3;
      block(m, "black", x - 0.015, x + 0.015, HOOD_TOP, HOOD_TOP + 0.01, -(HOOD_HALF - HOOD_R), HOOD_HALF - HOOD_R);
    }
  });
  m.scope("hand brake", () => {
    // the hand brake wheel on the left side ahead of the radiator
    const x = RAD.x1 - 0.5, y = D + 1.25, z = -(HOOD_HALF + 0.12);
    m.tube("black", "z", x, y, 0.24, 0.2, z - 0.02, z + 0.02, 12);
    for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) m.rod("black", [x - Math.cos(a) * 0.21, y - Math.sin(a) * 0.21, z], [x + Math.cos(a) * 0.21, y + Math.sin(a) * 0.21, z], 0.012, 4);
    block(m, "black", x - 0.12, x + 0.12, y - 0.45, y - 0.1, -(HOOD_HALF + 0.1), -HOOD_HALF);
    m.rod("black", [x, y, z + 0.02], [x, y, -HOOD_HALF], 0.025, 6);
  });
  m.scope("ladder", () => {
    // the ladder up the inverter cabinet to the dynamic brake box on the left side, behind the cab
    const z = -(DB.half + 0.03);
    for (const x of [CAB_X0 - 0.55, CAB_X0 - 0.15]) m.rod(l.rails, [x, D, -(HOOD_HALF + 0.03)], [x, DB.side0, z], 0.018, 6);
    for (let y = D + 0.35; y < DB.side0 - 0.1; y += 0.35) {
      const t = (y - D) / (DB.side0 - D), zz = -(HOOD_HALF + 0.03 + (DB.half - HOOD_HALF) * t);
      m.rod(l.rails, [CAB_X0 - 0.55, y, zz], [CAB_X0 - 0.15, y, zz], 0.014, 4);
    }
  });
  m.scope("lettering", () => {
    for (const sd of [-1, 1]) sideWords(m, l.letter, l.railroad, sd, HOOD_HALF + 0.009, l.letterX, D + l.letterY, l.letterH, l.letterW ?? l.letterH * 0.62, l.letterGap ?? l.letterH * 0.22, l.letterSlant ?? 0);
  });
  // the rear face: the headlight pair in its box under the wings' overhang, the marker lights, the number
  m.scope("rear headlight", () => {
    const x = HOOD_REAR;
    block(m, "black", x - 0.2, x + 0.002, RAD.side0 - 0.5, RAD.side0, -0.17, 0.17);
    for (const y of [RAD.side0 - 0.37, RAD.side0 - 0.15]) extrude(m, "lampHead", "x", ngon(10, 0.09, 0, 0, y), [x - 0.22, x - 0.2]);
    for (const z of [-0.85, 0.85]) extrude(m, "lampRed", "x", ngon(8, 0.06, 0, z, D + 0.55), [x - 0.03, x - 0.002]);
    endWords(m, l.rearText ?? l.numberMat, l.number, -1, -x + 0.005, -0.62, RAD.foot - 0.1, 0.3, 0.18, 0.06);
    // the rear door into the radiator compartment
    for (const z of [-0.45, 0.45]) decalX(m, "black", x - 0.004, -1, z - 0.012, z + 0.012, D + 0.1, D + 2.0);
    decalX(m, "black", x - 0.004, -1, -0.45, 0.45, D + 2.0, D + 2.02);
  });
}

function nose(m: MeshBuilder, l: Es44Livery): void {
  const H = CAB_HALF, ends = endBands(l), sides = cabBands(l), noseSides = l.noseSides ?? sides;
  const fx = NOSE_X;
  m.scope("nose", () => {
    // the face: full width at the walkway, its top a shallow gable up to the ridge
    const face: Vec3[] = [[fx, D, -H], [fx, D, H], [fx, FACE_CORNER, H], [fx, RIDGE, 0], [fx, FACE_CORNER, -H]];
    paintedPolygon(m, ends, face, [1, 0, 0]);
    const [yw, xw] = CAB_FRONT[0]!;
    const xc0 = xw - CORNER;
    for (const s of [-1, 1]) {
      // the side wall under the hip's edge
      const wall: Vec3[] = ([[xc0, D, H], [fx, D, H], [fx, FACE_CORNER, H], [xc0, SIDE_REAR, H]] as Vec3[]).map((p) => mz(p, s));
      paintedPolygon(m, noseSides, wall, [0, 0, s]);
      // the hip plane from the ridge and the windscreens' foot down to the side wall, as a fan from the ridge's front
      const A: Vec3 = [fx, RIDGE, 0];
      const ring: Vec3[] = ([[fx, FACE_CORNER, H], [xc0, SIDE_REAR, H], [xc0, yw, H], [xw, yw, TOP_HALF], [xw, yw, 0]] as Vec3[]).map((p) => mz(p, s));
      for (let i = 0; i + 1 < ring.length; i++) {
        const tri = [A, ring[i]!, ring[i + 1]!];
        polygon(m, l.noseTop, tri, outward(tri, [0, 1, s * 0.5]));
      }
    }
  });
  // the headlight pair, one over the other in a recessed housing at the top of the face
  m.scope("headlights", () => {
    const hz = l.headZ ?? 0;
    block(m, "black", fx - 0.002, fx + 0.03, 2.99, 3.38, hz - 0.16, hz + 0.16);
    for (const y of [3.09, 3.28]) {
      extrude(m, "lampHead", "x", ngon(12, 0.085, 0, hz, y), [fx + 0.03, fx + 0.045]);
    }
    for (const z of [-1.2, 1.2]) extrude(m, "lampRed", "x", ngon(8, 0.055, 0, z, D + 0.55), [fx - 0.002, fx + 0.03]);
  });
  // the grab irons on the face and the front platform's corner handrails
  m.scope("handrails", () => {
    for (const z of [-0.35, 0.35]) {
      m.rod(l.frontRails, [fx + 0.06, D + 0.4, z], [fx + 0.06, D + 1.25, z], 0.018, 6);
      for (const y of [D + 0.4, D + 1.25]) m.rod(l.frontRails, [fx, y, z], [fx + 0.06, y, z], 0.015, 4);
    }
    for (const s of [-1, 1]) {
      const z = s * (DECK_HALF - 0.05);
      // a post at the platform's front corner, the rail sweeping back up the nose side
      m.rod(l.frontRails, [SILL - 0.2, D, z], [SILL - 0.2, D + 1.05, z], 0.022, 6);
      m.rod(l.frontRails, [SILL - 0.2, D + 1.05, z], [fx - 0.35, D + 1.05, z], 0.02, 6);
      m.rod(l.frontRails, [fx - 0.35, D + 1.05, z], [fx - 0.35, D + 0.3, s * (H + 0.03)], 0.02, 6);
      m.rod(l.frontRails, [SILL - 0.2, D + 0.5, z], [fx - 0.2, D + 0.5, z], 0.016, 6);
      // the inner rail across the platform's front, open in the middle
      m.rod(l.frontRails, [SILL - 0.2, D + 1.05, z], [SILL - 0.2, D + 1.05, s * 0.6], 0.02, 6);
      m.rod(l.frontRails, [SILL - 0.2, D, s * 0.6], [SILL - 0.2, D + 1.05, s * 0.6], 0.02, 6);
    }
  });
}

function cab(m: MeshBuilder, l: Es44Livery): void {
  const H = CAB_HALF, ends = endBands(l), sides = cabBands(l), roof = l.cabRoof ?? l.roof;
  const lv = CAB_FRONT;
  m.scope("shell", () => {
    for (const s of [-1, 1]) {
      // the side wall from the walkway, forward to the front corner's edge at each height
      const pts: Vec3[] = ([[CAB_X0, D, H], [lv[0]![1] - CORNER, D, H], ...lv.map(([y, x]): Vec3 => [x - CORNER, y, H]), [CAB_X0, lv[lv.length - 1]![0], H]] as Vec3[]).map((p) => mz(p, s));
      paintedPolygon(m, sides, pts, [0, 0, s]);
    }
    // the front: the slope under the windscreens, the windscreen plane, the board band, each with its corners
    for (let i = 0; i + 1 < lv.length; i++) {
      const [y0, x0] = lv[i]!, [y1, x1] = lv[i + 1]!;
      const mid: Vec3[] = [[x0, y0, -TOP_HALF], [x0, y0, TOP_HALF], [x1, y1, TOP_HALF], [x1, y1, -TOP_HALF]];
      const n = outward(mid, [1, 0, 0]);
      if (i === 0 && l.slope) polygon(m, l.slope, mid, n);
      else paintedPolygon(m, ends, mid, n);
      for (const s of [-1, 1]) {
        const c: Vec3[] = ([[x0, y0, TOP_HALF], [x0 - CORNER, y0, H], [x1 - CORNER, y1, H], [x1, y1, TOP_HALF]] as Vec3[]).map((p) => mz(p, s));
        if (i === 0 && l.slope) polygon(m, l.slope, c, outward(c, [1, 0, s]));
        else paintedPolygon(m, ends, c, outward(c, [1, 0, s]));
      }
    }
    // the rear wall against the hood
    paintedPolygon(m, ends, [[CAB_X0, D, -H], [CAB_X0, D, H], [CAB_X0, lv[lv.length - 1]![0], H], [CAB_X0, lv[lv.length - 1]![0], -H]], [-1, 0, 0]);
    // the roof: a chamfered edge all round and the flat top
    const [yr, xr] = lv[lv.length - 1]!;
    const lo: Array<[number, number]> = [[CAB_X0, -H], [CAB_X0, H], [xr - CORNER, H], [xr, TOP_HALF], [xr, -TOP_HALF], [xr - CORNER, -H]];
    const hi: Array<[number, number]> = [[CAB_X0 + 0.1, -(H - 0.12)], [CAB_X0 + 0.1, H - 0.12], [xr - CORNER - 0.08, H - 0.12], [xr - 0.1, TOP_HALF - 0.12], [xr - 0.1, -(TOP_HALF - 0.12)], [xr - CORNER - 0.08, -(H - 0.12)]];
    m.loft(roof, lo, yr, hi, CAB_TOP);
  });
  // the windscreens: two panes on the raked plane, nearly the cab's full width, a narrow post between
  m.scope("windscreen", () => {
    const [y0, x0] = lv[1]!, [y1, x1] = lv[2]!;
    const n = outward([[x0, y0, 0], [x0, y0, 1], [x1, y1, 1]], [1, 0, 0]);
    const at = (z: number, t: number, off: number): Vec3 => [x0 + (x1 - x0) * t + n[0] * off, y0 + (y1 - y0) * t + n[1] * off, z];
    for (const s of [-1, 1]) {
      const len = Math.hypot(x1 - x0, y1 - y0);
      const pane = (mat: string, za: number, zb: number, t0: number, t1: number, off: number, r: number) => {
        const rt = r / len;
        const q: Array<[number, number]> = [[za + r, t0], [zb - r, t0], [zb, t0 + rt], [zb, t1 - rt], [zb - r, t1], [za + r, t1], [za, t1 - rt], [za, t0 + rt]];
        polygon(m, mat, q.map(([z, t]) => at(s * z, t, off)), n);
      };
      pane(l.frameMat, 0.04, TOP_HALF - 0.01, 0.0, 1.0, 0.004, 0.08);
      pane("glass", 0.11, TOP_HALF - 0.08, 0.13, 0.9, 0.008, 0.07);
      // the wipers, parked along the pane's foot
      const z0 = s * 0.35, z1 = s * 1.1;
      m.rod("black", at(z0, 0.12, 0.02), at(z1, 0.14, 0.02), 0.012, 4);
    }
  });
  // the number boards over the windscreens
  m.scope("number boards", () => {
    const [y0, x0] = lv[2]!, [y1, x1] = lv[3]!;
    const xm = (x0 + x1) / 2;
    for (const s of [-1, 1]) {
      const [za, zb] = side(s, 0.3, 0.98);
      block(m, l.board, xm - 0.06, xm + 0.04, y0 + 0.04, y1 - 0.04, za, zb);
      endWords(m, l.boardText, l.number, 1, xm + 0.042, (za + zb) / 2, y0 + 0.08, 0.15, 0.09, 0.03);
    }
  });
  // the side windows: a fixed pane at the front, the sliding pair, a narrow pane at the rear; the sun visor
  m.scope("side windows", () => {
    for (const s of [-1, 1]) {
      const zz = s * (H + 0.004);
      for (const [a, b] of [[7.0, 7.5], [5.98, 6.9], [5.55, 5.88]] as const) {
        decalZ(m, l.frameMat, zz, s, a, b, 3.82, 4.46);
        decalZ(m, "glass", zz + s * 0.004, s, a + 0.05, b - 0.05, 3.87, 4.41);
      }
      decalZ(m, l.frameMat, zz + s * 0.006, s, 6.42, 6.46, 3.87, 4.41);
      // the visor over the sliding pair
      m.slab(bandAt(sides, 4.55), [[5.95, 4.53, s * H], [6.95, 4.53, s * H], [6.95, 4.49, s * (H + 0.08)], [5.95, 4.49, s * (H + 0.08)]], [0, -0.025, 0]);
      // the cab's running number
      sideWords(m, l.numberMat, l.number, s, H + 0.006, 6.55, 2.85, 0.42, 0.25, 0.08);
      // the grab iron by the cab's rear door
      m.rod(l.rails, [CAB_X0 - 0.05, D + 0.4, s * (H - 0.08)], [CAB_X0 - 0.05, D + 2.2, s * (H - 0.08)], 0.016, 6);
    }
  });
  m.scope("rear windows", () => {
    for (const s of [-1, 1]) {
      decalX(m, l.frameMat, CAB_X0 - 0.004, -1, ...side(s, HOOD_HALF + 0.08, H - 0.12), 3.9, 4.45);
      decalX(m, "glass", CAB_X0 - 0.008, -1, ...side(s, HOOD_HALF + 0.12, H - 0.16), 3.94, 4.41);
    }
  });
  // the roof: the five-chime horn, the air conditioner, the antennas
  m.scope("horn", () => {
    const x = 6.7, y = CAB_TOP;
    block(m, "horn", x - 0.18, x + 0.18, y, y + 0.06, -0.1, 0.1);
    for (const [dx, z, len] of [[-0.1, -0.12, 0.45], [0.05, -0.04, 0.32], [0.12, 0.05, 0.25], [-0.05, 0.1, 0.38], [0.08, 0.16, 0.2]] as const) {
      const ring0 = ngon(8, 0.03, 0, z, y + 0.12), ring1 = ngon(8, 0.065, 0, z, y + 0.12);
      m.sweep("horn", "x", ring0, x + dx - len / 2, ring1, x + dx + len / 2);
    }
    block(m, "horn", x - 0.03, x + 0.03, y + 0.05, y + 0.1, -0.15, 0.18);
  });
  m.scope("air conditioner", () => block(m, "roof", CAB_X0 + 0.2, CAB_X0 + 0.9, CAB_TOP, CAB_TOP + 0.12, -0.55, 0.55));
  m.scope("antenna", () => {
    for (const [x, z] of [[7.2, 0.6], [7.2, -0.6], [6.9, 0]] as const) m.prism("black", ngon(6, 0.022, 0, x, z), CAB_TOP - 0.02, CAB_TOP + 0.16);
  });
}

function walkways(m: MeshBuilder, l: Es44Livery): void {
  const y = D + 1.0, yMid = D + 0.5, z = DECK_HALF - 0.03, L = SILL;
  // the side handrails from the cab's rear wall to the rear end, stanchions about every 1.5 m
  const [a, b] = [-L + 0.22, CAB_X0 - 0.1];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      const zc = sd * z;
      tubeX(m, l.rails, 0.02, a, y, zc, b, y, zc, 6);
      tubeX(m, l.rails, 0.016, a, yMid, zc, b, yMid, zc, 6);
      const n = Math.round((b - a) / 1.5);
      for (let i = 0; i <= n; i++) m.prism(l.rails, ngon(6, 0.022, 0, a + ((b - a) * i) / n, zc), D, y);
    });
  m.scope("end rails", () => {
    const x = -(L - 0.22);
    for (const sd of [-1, 1]) m.rod(l.rails, [x, y, sd * 0.55], [x, y, sd * z], 0.02, 6);
    for (const sd of [-1, 1]) m.prism(l.rails, ngon(6, 0.022, 0, x, sd * 0.55), D, y);
  });
}

/**
 * GE's Hi-Ad truck side frame outside the toolkit's, from BNSF 5824 and CSX 761: a straight top chord
 * dropping at the tapered ends, a deep cast web whose belly hangs low between the axles and hides the
 * wheels' upper halves, jaws either side of each axle box, a pair of springs in the window over every box,
 * the sand boxes at the ends and the vertical dampers at the outer axles.
 */
function hiAdCasting(m: MeshBuilder, l: Es44Livery, xc: number): void {
  // the casting sits low: its top chord at 0.95 m, well under the sill, the motors and bolster dark in the gap
  const zi = 1.08, zo = 1.2, top = 0.95, win = 0.84, jawFoot = 0.3, belly = 0.36;
  const ay = TRUCK.wheelR;
  const axles = TRUCK.axles;
  const bot: Array<[number, number]> = [[-2.85, 0.66], [-2.5, 0.5]];
  for (let i = 0; i < axles.length; i++) {
    const a = axles[i]!;
    // an opening around each axle: the box in the middle, a spring each side of it
    bot.push([a - 0.5, jawFoot], [a - 0.46, jawFoot], [a - 0.459, win], [a + 0.459, win], [a + 0.46, jawFoot], [a + 0.5, jawFoot]);
    if (i + 1 < axles.length) {
      const b = axles[i + 1]!;
      bot.push([a + 0.501, 0.42], [a + 0.7, belly], [b - 0.7, belly], [b - 0.501, 0.42]);
    }
  }
  bot.push([2.5, 0.5], [2.85, 0.66]);
  // the chord humps over the springs and dips between them
  const topAt = (x: number): number => {
    if (Math.abs(x) > 2.5) return top - ((Math.abs(x) - 2.5) / 0.35) * 0.12;
    const near = Math.min(...axles.map((a) => Math.abs(x - a)));
    return near < 0.55 ? top : top - 0.06;
  };
  const topLine = bot.map(([x]): [number, number] => [xc + x, topAt(x)]);
  const bottom = bot.map(([x, y]): [number, number] => [xc + x, y]);
  m.scope("side frames", () => {
    for (const sd of [-1, 1]) plate(m, l.trucks, topLine, bottom, ...side(sd, zi, zo));
  });
  m.scope("axle boxes", () => {
    for (const a of axles)
      for (const sd of [-1, 1]) {
        block(m, l.trucks, xc + a - 0.19, xc + a + 0.19, ay - 0.17, ay + 0.17, ...side(sd, zi, zo + 0.03));
        // the box's wings carrying the springs
        block(m, l.trucks, xc + a - 0.44, xc + a + 0.44, ay - 0.24, ay - 0.17, ...side(sd, zi, zo));
        extrude(m, "spring", "z", ngon(8, 0.1, Math.PI / 8, xc + a, ay), side(sd, zo + 0.03, zo + 0.06));
      }
  });
  m.scope("spring nests", () => {
    for (const a of axles) for (const sd of [-1, 1]) for (const d of [-0.33, 0.33]) coil(m, "spring", xc + a + d, sd * (zo - 0.04), ay - 0.17, win, 0.085, 3, 6);
  });
  m.scope("sand boxes", () => {
    // at the truck's inner end (the outer end lies under the pilot's stairs)
    const x = -Math.sign(xc) * 2.6;
    for (const sd of [-1, 1]) block(m, l.trucks, xc + x - 0.18, xc + x + 0.18, 0.6, top + 0.12, ...side(sd, zo, zo + 0.06));
  });
  m.scope("dampers", () => {
    for (const a of [axles[0]!, axles[2]!])
      for (const sd of [-1, 1]) {
        const x = xc + a + Math.sign(a) * 0.62, z = sd * (zo + 0.06);
        m.rod("bogie", [x, ay - 0.1, z], [x + Math.sign(a) * 0.12, SILL_BOTTOM - 0.04, z], 0.045, 6);
      }
  });
  m.scope("motors", () => {
    // the traction motors and the bolster, dark in the gap between the casting and the sill
    for (const a of axles) block(m, "underframe", xc + a - 0.42, xc + a + 0.42, ay + 0.05, SILL_BOTTOM - 0.02, -0.62, 0.62);
    block(m, "underframe", xc - 0.45, xc + 0.45, top - 0.1, SILL_BOTTOM - 0.01, -1.03, 1.03);
  });
}

function underframe(m: MeshBuilder, l: Es44Livery): void {
  const t = TANK;
  m.scope("fuel tank", () => {
    const top = SILL_BOTTOM, shoulder = top - 0.5, r = 0.36, inset = 0.3;
    // the body: straight sides from the shoulder down, the lower edges rounded; the sloped ends lift its foot
    const body = (lift: number): Array<[number, number]> => {
      const out: Array<[number, number]> = [[-t.half, shoulder], [t.half, shoulder]];
      const y0 = t.y0 + lift;
      for (let k = 0; k <= 3; k++) {
        const a = (k / 3) * (Math.PI / 2);
        out.push([t.half - r + r * Math.cos(a), y0 + r - r * Math.sin(a)]);
      }
      for (let k = 0; k <= 3; k++) {
        const a = (k / 3) * (Math.PI / 2);
        out.push([-(t.half - r) - r * Math.sin(a), y0 + r - r * Math.cos(a)]);
      }
      return out;
    };
    const sec = body(0), end = body(0.14);
    m.sweep(l.tank, "x", end, t.x0, sec, t.x0 + 0.35);
    m.sweep(l.tank, "x", sec, t.x0 + 0.35, sec, t.x1 - 0.35);
    m.sweep(l.tank, "x", sec, t.x1 - 0.35, end, t.x1);
    // the upper part, set in behind the main reservoirs
    block(m, l.tank, t.x0 + 0.1, t.x1 - 0.1, shoulder - 0.05, top, -(t.half - inset), t.half - inset);
    for (const sd of [-1, 1]) {
      // the fillers and gauges at each end, the capacity stencil
      for (const x of [t.x0 + 0.6, t.x1 - 0.75]) block(m, "steel", x, x + 0.16, shoulder - 0.3, shoulder - 0.1, ...side(sd, t.half, t.half + 0.05));
      decalZ(m, "white", sd * (t.half + 0.004), sd, -0.4, 0.4, t.y0 + 0.5, t.y0 + 0.6);
      // the two long main reservoirs lying along the tank's top, silver
      for (const [a, b] of [[-3.55, -0.8], [-0.6, 2.15]] as const) {
        tankX(m, "reservoir", a, b, sd * (t.half - 0.24), shoulder + 0.25, 0.25, 12);
        for (const x of [a + 0.4, b - 0.4]) block(m, "black", x - 0.04, x + 0.04, shoulder + 0.18, top, ...side(sd, t.half - 0.3, t.half - inset + 0.001));
      }
    }
  });
  m.scope("air reservoirs", () => {
    // the air dryer and the battery boxes between the tank and the trucks
    for (const sd of [-1, 1]) block(m, "black", t.x1 + 0.05, t.x1 + 0.3, SILL_BOTTOM - 0.4, SILL_BOTTOM, ...side(sd, 0.6, 1.3));
  });
}

// ---------------------------------------------------------------------------
// Liveries: each railroad's scheme measured on photographs of the class
// (assets/ge-es44ac/SOURCES.md)

/** A thin stripe on a side wall from (x0, y0) to (x1, y1), `w` tall, its ends pointed by `taper` along x. */
function sideStripe(m: MeshBuilder, mat: string, s: number, zw: number, x0: number, y0: number, x1: number, y1: number, w: number, taper = 0): void {
  sidePoly(m, mat, s, zw, [[x0, y0], [x1 - taper, y1], [x1, y1 + w], [x0 + taper, y0 + w]]);
}

/** BNSF Heritage III: orange, the black hood top over a yellow stripe, black wings and frame, the nose's BNSF and swoosh, a black and yellow band along the foot. */
function bnsf(number: string): Es44Livery {
  const body: Band[] = [[0, 3.38, "bnsfOrange"], [3.38, 3.6, "bnsfYellow"], [3.6, 9, "bnsfBlack"]];
  return {
    title: "BNSF", railroad: "BNSF", letterH: 0.78, letterY: 0.92, letterX: -2.2, letterW: 1.2, letterGap: 0.22, letterSlant: 0.25, number,
    palette: pick("bnsfOrange", "bnsfBlack", "bnsfYellow", "truckGrime", "boardBlack", "tankGrey", "reservoir"),
    body, cab: [[0, 9, "bnsfOrange"]], ends: [[0, 9, "bnsfOrange"]], rear: [[0, 3.6, "bnsfOrange"], [3.6, 9, "bnsfBlack"]],
    roof: "bnsfBlack", cabRoof: "bnsfOrange", noseTop: "bnsfBlack", wing: "bnsfBlack", slope: "bnsfBlack", frameMat: "bnsfBlack",
    frame: "bnsfBlack", sillStripe: [0, 0.12, "bnsfYellow"], trucks: "truckGrime", pilot: "bnsfBlack", tank: "tankGrey", anticlimber: "bnsfYellow", headZ: -0.1,
    letter: "bnsfBlack", numberMat: "bnsfBlack", rails: "bnsfBlack", frontRails: "bnsfYellow", board: "boardBlack", boardText: "white",
    marks: (m) => {
      const H = CAB_HALF;
      // the nose door's round window beside the headlights
      extrude(m, "glass", "x", ngon(10, 0.1, 0, -0.5, 3.2), [NOSE_X - 0.002, NOSE_X + 0.01]);
      // the nose face: BNSF in italic black letters, the swoosh under them, the black foot with its yellow stripe
      const fx = NOSE_X + 0.004;
      endWords(m, "bnsfBlack", "BNSF", 1, fx, 0.05, D + 0.97, 0.38, 0.66, 0.1, 0.3);
      facePoly(m, "bnsfBlack", 1, fx, [[H, D + 0.8], [H, D + 0.88], [-0.8, D + 0.9], [-1.3, D + 0.86]]);
      facePoly(m, "bnsfBlack", 1, fx, [[-H, D], [H, D], [H, D + 0.3], [-H, D + 0.3]]);
      facePoly(m, "bnsfYellow", 1, fx + 0.002, [[-H, D + 0.2], [H, D + 0.2], [H, D + 0.28], [-H, D + 0.28]]);
      for (const s of [-1, 1]) {
        const zw = H + 0.004;
        // the foot band along the nose and cab sides
        sidePoly(m, "bnsfBlack", s, zw, [[CAB_X0, D], [NOSE_X, D], [NOSE_X, D + 0.3], [CAB_X0, D + 0.3]]);
        sidePoly(m, "bnsfYellow", s, zw + 0.002, [[CAB_X0, D + 0.2], [NOSE_X, D + 0.2], [NOSE_X, D + 0.28], [CAB_X0, D + 0.28]]);
        // the swoosh under the hood's letters, pointed at its rear
        sideStripe(m, "bnsfBlack", s, HOOD_HALF + 0.009, -5.1, D + 0.8, 0.9, D + 0.84, 0.08, 0.9);
        // the yellow foot of the hood
        sidePoly(m, "bnsfYellow", s, HOOD_HALF + 0.004, [[RAD.x0 + 0.1, D], [CAB_X0 - 0.05, D], [CAB_X0 - 0.05, D + 0.1], [RAD.x0 + 0.1, D + 0.1]]);
      }
      // the rear face: BNSF over the number
      endWords(m, "bnsfBlack", "BNSF", -1, -HOOD_REAR + 0.005, 0, D + 1.2, 0.3, 0.38, 0.1, 0.3);
    },
  };
}

/** Union Pacific: armour yellow, harbour mist grey above a red stripe at the windscreens' foot all round, the winged shield on the nose. */
function unionPacific(number: string): Es44Livery {
  const body: Band[] = [[0, 4.2, "upYellow"], [4.2, 4.26, "upRed"], [4.26, 9, "upGrey"]];
  return {
    title: "Union Pacific", railroad: "UNION PACIFIC", letterH: 0.42, letterY: 1.25, letterX: -2.0, number,
    palette: pick("upYellow", "upGrey", "upRed", "upBlue", "upWhite", "truckGrey", "boardBlack", "reservoir"),
    body, cab: [[0, 9, "upYellow"]], ends: [[0, 3.7, "upYellow"], [3.7, 3.78, "upRed"], [3.78, 9, "upGrey"]], rear: body,
    dbBands: [[0, 3.9, "upYellow"], [3.9, 3.97, "upRed"], [3.97, 9, "upGrey"]], wingBands: [[RAD.foot, RAD.side0 + 0.06, "upRed"], [RAD.side0 + 0.06, 9, "upGrey"]],
    roof: "upGrey", cabRoof: "upGrey", noseTop: "upYellow", wing: "upGrey", frameMat: "black",
    frame: "upGrey", trucks: "truckGrey", pilot: "upGrey", tank: "upGrey",
    letter: "upRed", numberMat: "upRed", rails: "upYellow", frontRails: "handrail", board: "boardBlack", boardText: "white",
    marks: (m) => {
      const fx = NOSE_X + 0.004;
      // the wings: a blue wing each side of the shield, three white feathers across it
      for (const s of [-1, 1]) {
        const w = (z: number, y: number): [number, number] => [s * z, y];
        facePoly(m, "upBlue", 1, fx, [w(0.25, 2.48), w(1.45, 2.62), w(1.5, 2.78), w(0.25, 2.8)]);
        facePoly(m, "upBlue", 1, fx, [w(0.25, 2.28), w(1.05, 2.3), w(1.32, 2.5), w(0.25, 2.46)]);
        for (const [y, z1] of [[2.66, 1.3], [2.56, 1.18], [2.38, 0.95]] as const) facePoly(m, "upWhite", 1, fx + 0.002, [w(0.3, y), w(z1, y + 0.005), w(z1 - 0.04, y + 0.045), w(0.3, y + 0.04)]);
      }
      // the shield: white with red and white stripes under a blue chief
      facePoly(m, "upWhite", 1, fx, [[-0.24, 2.85], [0.24, 2.85], [0.24, 2.45], [0, 2.2], [-0.24, 2.45]]);
      facePoly(m, "upBlue", 1, fx + 0.002, [[-0.21, 2.82], [0.21, 2.82], [0.21, 2.66], [-0.21, 2.66]]);
      for (const z of [-0.14, 0, 0.14]) facePoly(m, "upRed", 1, fx + 0.002, [[z - 0.04, 2.62], [z + 0.04, 2.62], [z + 0.04, 2.36 + Math.abs(z) * 0.5], [z - 0.04, 2.33 + Math.abs(z) * 0.5]]);
      // the flag on the hood behind the cab: the canton toward the cab, seven red stripes
      for (const s of [-1, 1]) {
        const zw = HOOD_HALF + 0.006, x0 = 4.05, x1 = 5.05, y0 = D + 0.6, y1 = D + 1.9;
        sidePoly(m, "upWhite", s, zw, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
        for (let i = 0; i < 7; i++) {
          const y = y0 + (i * (y1 - y0)) / 6.5;
          sidePoly(m, "upRed", s, zw + 0.002, [[x0, y], [x1, y], [x1, y + (y1 - y0) / 13], [x0, y + (y1 - y0) / 13]]);
        }
        sidePoly(m, "upBlue", s, zw + 0.004, [[x1 - 0.45, y1 - 0.62], [x1, y1 - 0.62], [x1, y1], [x1 - 0.45, y1]]);
      }
      // the rear face: UP's initials
      endWords(m, "upRed", "UP", -1, -HOOD_REAR + 0.005, 0, D + 1.1, 0.4, 0.3, 0.1);
    },
  };
}

/** CSX YN3: dark blue with the nose, the cab's front and the rear face in yellow, yellow letters and sill stripe. */
function csx(number: string): Es44Livery {
  return {
    title: "CSX", railroad: "CSX", letterH: 1.05, letterY: 0.4, letterX: -2.2, letterW: 0.75, letterGap: 0.25, number,
    palette: pick("csxBlue", "csxYellow", "csxGrey", "truckGrey", "boardBlack", "reservoir"),
    body: [[0, 9, "csxBlue"]], cab: [[0, 9, "csxBlue"]], ends: [[0, 4.32, "csxYellow"], [4.32, 9, "csxBlue"]], rear: [[0, RAD.side0, "csxYellow"], [RAD.side0, 9, "csxBlue"]],
    roof: "csxBlue", cabRoof: "csxBlue", noseTop: "csxYellow", wing: "csxBlue", slope: "csxYellow", frameMat: "black",
    frame: "csxGrey", sillStripe: [0.02, 0.14, "csxYellow"], trucks: "truckGrey", pilot: "csxGrey", tank: "csxGrey",
    letter: "csxYellow", numberMat: "csxYellow", rearText: "csxBlue", rails: "csxYellow", frontRails: "csxYellow", board: "boardBlack", boardText: "white",
    marks: (m) => {
      const H = CAB_HALF;
      for (const s of [-1, 1]) {
        // the number's flash under it
        sideStripe(m, "csxYellow", s, H + 0.008, 6.0, 2.62, 7.1, 2.7, 0.07, 0.25);
      }
      // the rear face: CSX in blue over the number
      endWords(m, "csxBlue", "CSX", -1, -HOOD_REAR + 0.005, 0, D + 0.75, 0.55, 0.42, 0.12);
      // the nose face: CSX in blue
      endWords(m, "csxBlue", "CSX", 1, NOSE_X + 0.004, 0, D + 0.85, 0.42, 0.32, 0.1);
    },
  };
}

export const ES44AC_LIVERIES: Record<string, Es44Livery> = {
  bnsf: bnsf("5800"),
  unionPacific: unionPacific("5348"),
  csx: csx("850"),
};
