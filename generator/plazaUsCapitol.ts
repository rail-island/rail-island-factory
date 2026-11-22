// The United States Capitol on Capitol Hill in Washington, D.C., the seat of the
// Congress: William Thornton's central building (1793-1826, rebuilt after 1814), the
// marble Senate and House extensions of Thomas U. Walter (1851-1868) and his cast-iron
// dome (1855-1866) under Thomas Crawford's bronze Statue of Freedom. A plaza
// landmark (docs/models/plaza-landmarks.md).
//
// Real dimensions: about 229 m long (north-south) and 107 m deep, the dome 88 m high
// to the crest of the statue. Here the length is compressed to about 195 m (the
// central block, the two connecting corridors and the wings each a little shorter;
// the depth and every height stay real). The parts:
// - the central block with the east front portico (+Z): a deep pedimented Corinthian
//   portico of eight columns in front of a colonnade, the grand stair up to it over
//   the rusticated ground storey;
// - the connecting corridors with their small domed skylight cupolas;
// - the Senate wing (north, -X) and the House wing (south, +X), each with its own
//   pedimented east portico and steps, the colonnades of its west front and outer
//   end, the low skylight roof over the chamber;
// - everywhere two storeys of windows (pedimented on the main floor) over the
//   rusticated ground storey with its arched windows, the entablature and the
//   balustraded roofline;
// - the west front simplified to the central projection with its loggia on the
//   terrace, the terrace's arcaded wall and its two flights of steps;
// - the dome: the stepped base, the peristyle of 36 Corinthian columns ringing the
//   drum and its tall windows, the balustrade, the attic with 36 windows between
//   pilasters, the cornice, the ribbed shell (36 raised ribs, two rings of
//   small windows), the lantern platform with its balustrade, the tholos of twelve
//   columns, its cupola and the bronze Statue of Freedom on her globe and pedestal.
//
// Modelled in metres, +Y up, the plaza at y = 0, centred on the footprint; the east
// front faces +Z, the House wing +X. Deterministic: the same code gives the same bytes.
//
// Sources: Wikipedia "United States Capitol" and "United States Capitol dome", the
// photographs in assets/us-capitol/ (SOURCES.md).
//
// The id is what the game's saved maps store, so the design is never renamed once
// shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#ebe7dc", roughness: 0.85 },
  stoneShade: { color: "#cdc6b6", roughness: 0.9 },
  rustic: { color: "#ddd5c4", roughness: 0.92 },
  steps: { color: "#d6d0c3", roughness: 0.9 },
  dome: { color: "#f1f0ec", roughness: 0.7 },
  domeShade: { color: "#d3d4d3", roughness: 0.75 },
  roof: { color: "#9a9e9c", metallic: 0.2, roughness: 0.6 },
  dark: { color: "#2a2f35", roughness: 0.6 },
  bronze: { color: "#444639", metallic: 0.55, roughness: 0.5 },
};

// --- helpers -----------------------------------------------------------------------

/** A box() given by its spans; no underside. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A closed box spanning x0..x1, y0..y1, z0..z1 (with its underside). */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  m.cap(mat, r, y0, false);
}

/**
 * A surface of revolution about the vertical through (cx, cz): the profile's points
 * (radius, height, material of the segment to the next point) joined by lofts of n
 * sides. A segment's face looks to the right of the path in the (r, y) plane, so a
 * path climbing the outside faces out and one coming down the inside faces in.
 */
function lathe(m: MeshBuilder, n: number, rot: number, pts: Array<[number, number, string]>, cx = 0, cz = 0): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const [r0, y0, mat] = pts[i]!;
    const [r1, y1] = pts[i + 1]!;
    if (r0 === r1 && y0 === y1) continue;
    m.loft(mat, ngon(n, r0, rot, cx, cz), y0, ngon(n, r1, rot, cx, cz), y1, false);
  }
}

/** The same for a rectangle x0..x1 by z0..z1 grown by each point's offset e. */
function rectLathe(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, pts: Array<[number, number, string]>): void {
  const ring = (e: number): Ring => rect(x1 - x0 + 2 * e, z1 - z0 + 2 * e, (x0 + x1) / 2, (z0 + z1) / 2);
  for (let i = 0; i + 1 < pts.length; i++) {
    const [e0, y0, mat] = pts[i]!;
    const [e1, y1] = pts[i + 1]!;
    m.loft(mat, ring(e0), y0, ring(e1), y1, false);
  }
}

/** A planar quad turned to face along `n`. */
function face(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  m.facets(mat, [a, b, c, a, c, d], n);
}

/** A circle of n points about (cx, cz). */
const circle = (n: number, r: number, cx: number, cz: number): Ring => ngon(n, r, Math.PI / n, cx, cz);

// A facade: the wall plane `plane` facing `f`; s runs along the wall (x on a z facade,
// z on an x facade), d out of the wall.
type Face = "+z" | "-z" | "+x" | "-x";

function fp(f: Face, plane: number, s: number, y: number, d: number): Vec3 {
  if (f === "+z") return [s, y, plane + d];
  if (f === "-z") return [s, y, plane - d];
  if (f === "+x") return [plane + d, y, s];
  return [plane - d, y, s];
}

function fnorm(f: Face): Vec3 {
  return f === "+z" ? [0, 0, 1] : f === "-z" ? [0, 0, -1] : f === "+x" ? [1, 0, 0] : [-1, 0, 0];
}

/** The direction of growing s. */
function fdir(f: Face): Vec3 {
  return f === "+z" || f === "-z" ? [1, 0, 0] : [0, 0, 1];
}

/** An axis-aligned box given in facade coordinates. */
function fbox(m: MeshBuilder, mat: string, f: Face, plane: number, s0: number, s1: number, y0: number, y1: number, d0: number, d1: number, top = true, under = false): void {
  const a = fp(f, plane, s0, y0, d0);
  const b = fp(f, plane, s1, y1, d1);
  const fn = under ? cube : span;
  fn(m, mat, Math.min(a[0], b[0]), Math.max(a[0], b[0]), y0, y1, Math.min(a[2], b[2]), Math.max(a[2], b[2]), top);
}

/** A flat rectangle on a facade at offset d. */
function fquad(m: MeshBuilder, mat: string, f: Face, plane: number, s0: number, s1: number, y0: number, y1: number, d: number): void {
  face(m, mat, fp(f, plane, s0, y0, d), fp(f, plane, s1, y0, d), fp(f, plane, s1, y1, d), fp(f, plane, s0, y1, d), fnorm(f));
}

/** A flat round-headed opening on a facade: sides from y0 to the springing ys, radius w/2. */
function farch(m: MeshBuilder, mat: string, f: Face, plane: number, sc: number, w: number, y0: number, ys: number, d: number, segs = 6): void {
  const h = w / 2;
  fquad(m, mat, f, plane, sc - h, sc + h, y0, ys, d);
  const pts: Vec3[] = [];
  for (let k = 0; k < segs; k++) {
    const a0 = (k / segs) * Math.PI;
    const a1 = ((k + 1) / segs) * Math.PI;
    pts.push(fp(f, plane, sc, ys, d), fp(f, plane, sc + h * Math.cos(a0), ys + h * Math.sin(a0), d), fp(f, plane, sc + h * Math.cos(a1), ys + h * Math.sin(a1), d));
  }
  m.facets(mat, pts, fnorm(f));
}

// --- dimensions --------------------------------------------------------------------

const Y_RUSTIC = 7.5; // the rusticated ground storey
const Y_BELT = 7.9; // the belt course over it
const Y_FLOOR = 8.0; // the floor of the porticos, where the columns stand
const Y_ARCH = 20.2; // the underside of the architrave
const Y_FRIEZE = 21.9;
const Y_ROOF = 22.7; // the flat roofs behind the balustrade
const Y_PORCH = 22.8; // the porticos' cornice top, where the pediments start
const SLOPE = Math.tan((15 * Math.PI) / 180);
const BAY = 3.6; // the bay and the intercolumniation

// the central block, the connectors, the wings (the +X half; the -X half mirrors it)
const CX = 41;
const CZ0 = -28;
const CZ1 = 20;
const KX1 = 53; // the connectors run from inside the central block to inside the wing
const KZ0 = -18;
const KZ1 = 16;
const WX0 = 53;
const WX1 = 94;
const WC = (WX0 + WX1) / 2;
const WZ0 = -30;
const WZ1 = 26;
// the west front
const PX = 24; // the central west projection
const PZ = -36;
const TX = 46; // the terrace
const TZ = -44;
// the dome (z of its axis)
const DZC = -4;
const N_DOME = 72;
const ROT = Math.PI / N_DOME; // facet middles fall on multiples of 5 degrees

const R_BASE = 20.6;
const R_INNER = 17.8; // the peristyle's drum wall
const R_COL = 19.4; // the peristyle's columns
const R_ENT = 20.4;
const R_ATTIC = 16.6;
const R_DOME0 = 14.6;
const Y_PERI = 30.0;
const Y_PERI_ENT = 39.6;
const Y_PERI_TOP = 41.5;
const Y_ATTIC_TOP = 49.4;
const Y_DOME0 = 50.8;
const R_LIP = 4.0;
const Y_DOME1 = 67.6;
// the shell: an ellipse a little taller than wide through (R_DOME0, Y_DOME0) and (R_LIP, Y_DOME1)
const DOME_B = (Y_DOME1 - Y_DOME0) / Math.sqrt(1 - (R_LIP / R_DOME0) ** 2);
const PHI1 = Math.asin((Y_DOME1 - Y_DOME0) / DOME_B);
const DOME_ROWS = 10;

const DZ = 3.5; // centres the footprint on z = 0

// --- the Corinthian column ---------------------------------------------------------

/**
 * A Corinthian column standing on y0 with its abacus top at y1, lower radius r: the
 * square plinth, the torus, the tapering shaft, the bell of two acanthus rows with the
 * volutes and the abacus.
 */
function corinthian(m: MeshBuilder, cx: number, cz: number, y0: number, y1: number, r: number, n = 8, mat = "stone", lite = false): void {
  m.scope("column", () => {
    const capH = r * 2.3;
    const yS = y1 - capH;
    const rt = r * 0.85;
    const yA = y1 - capH * 0.2;
    span(m, mat, cx - r * 1.2, cx + r * 1.2, y0, y0 + r * 0.5, cz - r * 1.2, cz + r * 1.2);
    if (lite) {
      // a small column: the shaft and one flared bell
      m.loft(mat, circle(n, r, cx, cz), y0 + r * 0.5, circle(n, rt, cx, cz), yS, false);
      m.loft(mat, circle(n, rt, cx, cz), yS, circle(n, r * 1.3, cx, cz), yA, false);
    } else {
      m.loft(mat, circle(n, r * 1.15, cx, cz), y0 + r * 0.5, circle(n, r, cx, cz), y0 + r * 0.9, false);
      m.loft(mat, circle(n, r, cx, cz), y0 + r * 0.9, circle(n, rt, cx, cz), yS, false);
      // two rows of leaves: the bell's lower row flares out, the upper row and the volutes further
      const yM = yS + capH * 0.45;
      m.loft(mat, circle(n, rt, cx, cz), yS, circle(n, rt * 1.2, cx, cz), yM, false);
      m.loft(mat, circle(n, rt * 1.2, cx, cz), yM, circle(n, r * 1.32, cx, cz), yA, false);
    }
    // the abacus with its corners over the volutes
    const a = r * 1.38;
    span(m, mat, cx - a, cx + a, yA, y1, cz - a, cz + a, true);
    m.cap(mat, rect(2 * a, 2 * a, cx, cz), yA, false);
  });
}

// --- the blocks --------------------------------------------------------------------

/**
 * One block of the building: the rusticated ground storey, the belt, the wall of the
 * two upper storeys, the entablature and cornice, the flat roof and the balustrade
 * round it. `e` lowers the cornice and roof (the connectors stand a little lower).
 */
function block(m: MeshBuilder, x0: number, x1: number, z0: number, z1: number, e = 0): void {
  m.scope("walls", () => {
    rectLathe(m, x0, x1, z0, z1, [
      [0.25, 0, "rustic"], [0.25, Y_RUSTIC, "stone"], [0.4, Y_RUSTIC, "stone"], [0.4, Y_BELT, "stone"], [0, Y_BELT, "stone"],
      [0, Y_ARCH + e, "stone"], [0.15, Y_ARCH + e, "stone"], [0.15, Y_FRIEZE + e, "stoneShade"], [0.9, Y_FRIEZE + 0.4 + e, "stone"],
      [0.9, Y_ROOF + e, "stone"], [0.3, Y_ROOF + e, "stone"],
    ]);
    m.cap("roof", rect(x1 - x0 + 0.6, z1 - z0 + 0.6, (x0 + x1) / 2, (z0 + z1) / 2), Y_ROOF + e);
  });
  m.scope("balustrade", () => {
    const y = Y_ROOF + e;
    rectLathe(m, x0, x1, z0, z1, [
      [0.15, y, "stone"], [0.15, y + 0.3, "stone"], [0.05, y + 0.3, "stoneShade"], [0.05, y + 1.15, "stone"], [0.22, y + 1.15, "stone"],
      [0.22, y + 1.4, "stone"], [-0.3, y + 1.4, "stone"], [-0.3, y, "stone"],
    ]);
  });
}

/** A straight balustrade along a facade from s0 to s1, standing on y with its face at d. */
function balustrade(m: MeshBuilder, f: Face, plane: number, s0: number, s1: number, y: number, d: number): void {
  m.scope("balustrade", () => {
    fbox(m, "stone", f, plane, s0, s1, y, y + 0.3, d - 0.5, d);
    fbox(m, "stoneShade", f, plane, s0, s1, y + 0.3, y + 1.15, d - 0.45, d - 0.08, false);
    fbox(m, "stone", f, plane, s0 - 0.05, s1 + 0.05, y + 1.15, y + 1.4, d - 0.55, d + 0.05);
    // the pedestals at the ends
    for (const s of [s0, s1]) fbox(m, "stone", f, plane, s - 0.35, s + 0.35, y + 0.3, y + 1.15, d - 0.5, d + 0.05, false);
  });
}

/** The windows of one facade: one bay per s, the arched ground storey (unless `ground` says no), two upper storeys. */
function windows(m: MeshBuilder, f: Face, plane: number, bays: number[], ground: (s: number) => boolean = () => true, e = 0): void {
  m.scope("windows", () => {
    bays.forEach((s, i) => {
      if (ground(s)) farch(m, "dark", f, plane, s, 1.5, 1.6, 4.4, 0.28);
      // the main floor: surround, sash, cornice and a triangular or segmental pediment
      fbox(m, "stone", f, plane, s - 1.15, s + 1.15, 9.0, 13.4, -0.05, 0.14, false);
      fquad(m, "dark", f, plane, s - 0.8, s + 0.8, 9.3, 13.1, 0.17);
      fbox(m, "stone", f, plane, s - 1.4, s + 1.4, 13.4, 13.7, -0.05, 0.32);
      const n = fnorm(f);
      const back: Vec3 = [-n[0] * 0.34, 0, -n[2] * 0.34];
      if (i % 2 === 0) {
        m.slab("stone", [fp(f, plane, s - 1.4, 13.7, 0.3), fp(f, plane, s + 1.4, 13.7, 0.3), fp(f, plane, s, 14.4, 0.3)], back);
      } else {
        const pts: Vec3[] = [];
        for (let k = 0; k <= 4; k++) {
          const a = Math.PI - (k / 4) * Math.PI;
          pts.push(fp(f, plane, s + 1.4 * Math.cos(a), 13.7 + 0.55 * Math.sin(a), 0.3));
        }
        m.slab("stone", pts, back);
      }
      // the upper storey
      fbox(m, "stone", f, plane, s - 1.0, s + 1.0, 15.3 + e, 18.0 + e, -0.05, 0.12, false);
      fquad(m, "dark", f, plane, s - 0.7, s + 0.7, 15.55 + e, 17.75 + e, 0.15);
    });
  });
}

const bays = (c: number, k0: number, k1: number): number[] => {
  const out: number[] = [];
  for (let k = k0; k <= k1; k++) out.push(c + k * BAY);
  return out;
};

// --- porticos and colonnades -------------------------------------------------------

interface Porch {
  f: Face;
  plane: number;
  s0: number;
  s1: number;
  depth: number; // the entablature's front, out of the wall
  cols: number[]; // the s of the columns
  colD: number; // their d
  pediment?: boolean;
  rail?: Array<[number, number]>; // balustrade runs along the front, if no pediment
}

/**
 * A portico or a colonnade in front of a wall: the rusticated podium with the floor
 * on it, the Corinthian columns, the entablature with its cornice and either a
 * pediment with its sculpture or a balustrade.
 */
function porch(m: MeshBuilder, p: Porch): void {
  const { f, plane, s0, s1, depth } = p;
  m.scope(p.pediment ? "portico" : "colonnade", () => {
    m.scope("podium", () => {
      fbox(m, "rustic", f, plane, s0, s1, 0, Y_FLOOR, -0.3, depth + 0.4, false);
      const a = fp(f, plane, s0, Y_FLOOR, -0.3);
      const b = fp(f, plane, s1, Y_FLOOR, depth + 0.4);
      m.cap("stone", rect(Math.abs(b[0] - a[0]), Math.abs(b[2] - a[2]), (a[0] + b[0]) / 2, (a[2] + b[2]) / 2), Y_FLOOR);
    });
    m.scope("columns", () => {
      for (const s of p.cols) {
        const c = fp(f, plane, s, 0, p.colD);
        corinthian(m, c[0], c[2], Y_FLOOR, Y_ARCH, 0.65);
      }
    });
    m.scope("entablature", () => {
      fbox(m, "stone", f, plane, s0 + 0.2, s1 - 0.2, Y_ARCH, Y_FRIEZE, -0.3, depth, false, true);
      fbox(m, "stone", f, plane, s0 - 0.2, s1 + 0.2, Y_FRIEZE, Y_PORCH, -0.3, depth + 0.6, true, true);
    });
    if (p.pediment) gable(m, f, plane, s0 - 0.2, s1 + 0.2, depth);
    for (const [a, b] of p.rail ?? []) balustrade(m, f, plane, a, b, Y_PORCH, depth + 0.45);
  });
}

/** The pediment over a portico from s0 to s1 whose cornice front is at d = dF + 0.6. */
function gable(m: MeshBuilder, f: Face, plane: number, s0: number, s1: number, dF: number): void {
  const sc = (s0 + s1) / 2;
  const half = (s1 - s0) / 2;
  const h = half + 0.6; // the roof's overhang
  const yU = (s: number): number => Y_PORCH + (h - Math.abs(s - sc)) * SLOPE;
  const n = fnorm(f);
  const t = fdir(f);
  const dBack = -0.6;
  m.scope("pediment", () => {
    m.scope("tympanum", () => {
      const dT = dF - 0.35;
      const yA = Y_PORCH + (half - 0.2) * SLOPE;
      m.slab("stone", [fp(f, plane, s0 + 0.2, Y_PORCH, dT), fp(f, plane, s1 - 0.2, Y_PORCH, dT), fp(f, plane, sc, yA, dT)], [-n[0] * (dT - dBack), 0, -n[2] * (dT - dBack)]);
      // the sculpture group: figures standing on the cornice, the tallest in the middle
      const count = 9;
      for (let i = 0; i < count; i++) {
        const s = sc + (i - (count - 1) / 2) * ((2 * half - 4) / count);
        const room = Y_PORCH + (half - 0.2 - Math.abs(s - sc)) * SLOPE - Y_PORCH;
        const hgt = Math.min(room - 0.35, 2.6);
        if (hgt < 0.6) continue;
        const w = i === (count - 1) / 2 ? 0.9 : 0.6;
        fbox(m, "stone", f, plane, s - w / 2, s + w / 2, Y_PORCH, Y_PORCH + hgt, dT - 0.05, dT + 0.4);
        fbox(m, "stone", f, plane, s - w * 0.3, s + w * 0.3, Y_PORCH + hgt, Y_PORCH + hgt + 0.3, dT - 0.05, dT + 0.3);
      }
    });
    m.scope("raking cornice", () => {
      const dR = dF + 0.6;
      for (const g of [-1, 1]) {
        const se = sc + g * (half + 0.3);
        m.slab("stone", [fp(f, plane, se, Y_PORCH, dR), fp(f, plane, se, yU(se) - 0.04, dR), fp(f, plane, sc, yU(sc) - 0.04, dR), fp(f, plane, sc, yU(sc) - 0.6, dR)], [-n[0] * 1.1, 0, -n[2] * 1.1]);
      }
    });
    m.scope("roof", () => {
      const dR = dF + 0.8;
      const c = 1 / Math.sqrt(1 + SLOPE * SLOPE);
      for (const g of [-1, 1]) {
        const se = sc + g * h;
        const up: Vec3 = [t[0] * g * SLOPE * c * 0.35, c * 0.35, t[2] * g * SLOPE * c * 0.35];
        m.slab("roof", [fp(f, plane, se, Y_PORCH, dR), fp(f, plane, sc, yU(sc), dR), fp(f, plane, sc, yU(sc), dBack), fp(f, plane, se, Y_PORCH, dBack)], up);
      }
      fbox(m, "roof", f, plane, sc - 0.25, sc + 0.25, yU(sc), yU(sc) + 0.42, dBack, dR);
    });
  });
}

/** A flight of n steps from y = 0 up to `rise`, from d = d0 + n * run back to d0, between cheek walls. */
function stair(m: MeshBuilder, f: Face, plane: number, sc: number, halfW: number, d0: number, rise: number, n: number, run = 0.6): void {
  m.scope("steps", () => {
    const hS = rise / n;
    const nrm = fnorm(f);
    for (let i = 0; i < n; i++) {
      const dr = d0 + (n - i) * run;
      face(m, "steps", fp(f, plane, sc - halfW, i * hS, dr), fp(f, plane, sc + halfW, i * hS, dr), fp(f, plane, sc + halfW, (i + 1) * hS, dr), fp(f, plane, sc - halfW, (i + 1) * hS, dr), nrm);
      face(m, "steps", fp(f, plane, sc - halfW, (i + 1) * hS, dr - run), fp(f, plane, sc + halfW, (i + 1) * hS, dr - run), fp(f, plane, sc + halfW, (i + 1) * hS, dr), fp(f, plane, sc - halfW, (i + 1) * hS, dr), [0, 1, 0]);
    }
    const dEnd = d0 + n * run + 0.3;
    const t = fdir(f);
    for (const s of [sc - halfW - 1.2, sc + halfW]) {
      m.slab("stone", [fp(f, plane, s, 0, d0 - 0.2), fp(f, plane, s, 0, dEnd), fp(f, plane, s, 1.1, dEnd), fp(f, plane, s, rise + 1.0, d0 - 0.2)], [t[0] * 1.2, 0, t[2] * 1.2]);
    }
  });
}

// --- the building ------------------------------------------------------------------

function centralBlock(m: MeshBuilder): void {
  m.scope("central block", () => {
    block(m, -CX, CX, CZ0, CZ1);
    // the east front: the colonnade across the middle, the deep portico, the grand stair
    windows(m, "+z", CZ1, bays(0, -10, 10), (s) => Math.abs(s) > 26);
    const colonnade: number[] = [];
    for (let j = 0; j < 7; j++) colonnade.push(-(1.8 + BAY * j), 1.8 + BAY * j);
    colonnade.sort((a, b) => a - b);
    porch(m, { f: "+z", plane: CZ1, s0: -25.0, s1: 25.0, depth: 3.0, cols: colonnade, colD: 1.6, rail: [[-24.6, -15.2], [15.2, 24.6]] });
    porch(m, { f: "+z", plane: CZ1, s0: -14.4, s1: 14.4, depth: 13.4, cols: colonnade.filter((s) => Math.abs(s) < 13), colD: 12.5, pediment: true });
    stair(m, "+z", CZ1, 0, 11, 13.8, Y_FLOOR, 20);
    // the west front: the windows either side of the projection, over the terrace
    windows(m, "-z", CZ0, [-38.4, -34.8, -31.2, -27.6, 27.6, 31.2, 34.8, 38.4], () => false);
  });
}

function westFront(m: MeshBuilder): void {
  m.scope("west front", () => {
    m.scope("terrace", () => {
      span(m, "rustic", -TX, TX, 0, Y_RUSTIC, TZ, CZ0 + 0.1, false);
      m.cap("stone", rect(2 * TX, CZ0 + 0.1 - TZ, 0, (TZ + CZ0 + 0.1) / 2), Y_RUSTIC);
      const arches: number[] = [];
      for (let k = -12; k <= 12; k++) {
        const x = k * BAY;
        if (Math.abs(Math.abs(x) - 17) < 6) continue; // the flights of steps
        arches.push(x);
      }
      m.scope("arcade", () => {
        for (const x of arches) farch(m, "dark", "-z", TZ, x, 1.5, 1.4, 4.4, 0.03);
        for (const z of [-41.0, -36.0, -31.0]) for (const f of ["-x", "+x"] as Face[]) farch(m, "dark", f, f === "+x" ? TX : -TX, z, 1.5, 1.4, 4.4, 0.03);
      });
      balustrade(m, "-z", TZ, -TX + 0.3, -22.0, Y_RUSTIC, 0.0);
      balustrade(m, "-z", TZ, -12.0, 12.0, Y_RUSTIC, 0.0);
      balustrade(m, "-z", TZ, 22.0, TX - 0.3, Y_RUSTIC, 0.0);
      for (const f of ["-x", "+x"] as Face[]) balustrade(m, f, f === "+x" ? TX : -TX, TZ + 0.3, CZ0 - 0.4, Y_RUSTIC, 0.0);
      for (const x of [-17, 17]) stair(m, "-z", TZ, x, 4.6, 0, Y_RUSTIC, 19);
    });
    m.scope("projection", () => {
      block(m, -PX, PX, PZ, CZ0 + 0.5, -0.2);
      windows(m, "-z", PZ, bays(0, -6, 6), () => false);
      const cols = [-9.0, -5.4, -1.8, 1.8, 5.4, 9.0];
      porch(m, { f: "-z", plane: PZ, s0: -10.6, s1: 10.6, depth: 3.0, cols, colD: 1.6, rail: [[-10.2, 10.2]] });
    });
  });
}

function connector(m: MeshBuilder, s: number): void {
  m.scope("connector", () => {
    const x0 = s > 0 ? CX - 2 : -KX1 - 1;
    const x1 = s > 0 ? KX1 + 1 : -CX + 2;
    block(m, x0, x1, KZ0, KZ1, -0.35);
    const b = [44, 47, 50].map((x) => s * x);
    windows(m, "+z", KZ1, b, () => true, -0.35);
    windows(m, "-z", KZ0, b, () => true, -0.35);
    m.scope("cupola", () => {
      lathe(m, 16, 0, [
        [2.4, 21.9, "stone"], [2.4, 24.6, "stone"], [2.8, 24.6, "stone"], [2.8, 25.0, "dome"],
        [2.4, 25.6, "dome"], [1.6, 26.4, "dome"], [0.6, 26.8, "dome"], [0, 26.85, "dome"],
      ], s * 47, -1);
      for (let k = 0; k < 8; k++) {
        const a = ((k + 0.5) / 8) * Math.PI * 2;
        const ax = s * 47 + Math.cos(a) * 2.45;
        const az = -1 - Math.sin(a) * 2.45;
        const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
        const t: Vec3 = [-u[2] * 0.35, 0, u[0] * 0.35];
        face(m, "dark", [ax - t[0], 23.0, az - t[2]], [ax + t[0], 23.0, az + t[2]], [ax + t[0], 24.2, az + t[2]], [ax - t[0], 24.2, az - t[2]], u);
      }
    });
  });
}

/** A wing: s = 1 the House wing (+X), s = -1 the Senate wing (-X). */
function wing(m: MeshBuilder, s: number): void {
  m.scope(s > 0 ? "house wing" : "senate wing", () => {
    const xa = s > 0 ? WX0 : -WX1;
    const xb = s > 0 ? WX1 : -WX0;
    const wc = s * WC;
    block(m, xa, xb, WZ0, WZ1);
    const cols: number[] = [];
    for (let j = 0; j < 5; j++) cols.push(wc - (1.8 + BAY * j), wc + (1.8 + BAY * j));
    cols.sort((a, b) => a - b);
    // the east front: the colonnade and the pedimented portico with its steps
    windows(m, "+z", WZ1, bays(wc, -5, 5), () => false);
    porch(m, { f: "+z", plane: WZ1, s0: wc - 17.6, s1: wc + 17.6, depth: 3.0, cols, colD: 1.6, rail: [[wc - 17.2, wc - 11.6], [wc + 11.6, wc + 17.2]] });
    porch(m, { f: "+z", plane: WZ1, s0: wc - 10.8, s1: wc + 10.8, depth: 10.0, cols: cols.filter((x) => Math.abs(x - wc) < 10), colD: 9.0, pediment: true });
    stair(m, "+z", WZ1, wc, 8, 10.4, Y_FLOOR, 20);
    // the west front's colonnade
    windows(m, "-z", WZ0, bays(wc, -5, 5), () => false);
    porch(m, { f: "-z", plane: WZ0, s0: wc - 17.6, s1: wc + 17.6, depth: 3.0, cols, colD: 1.6, rail: [[wc - 17.2, wc + 17.2]] });
    // the outer end and its colonnade
    const fo: Face = s > 0 ? "+x" : "-x";
    const endCols: number[] = [];
    for (let j = 0; j < 4; j++) endCols.push(-2 - (1.8 + BAY * j), -2 + 1.8 + BAY * j);
    endCols.sort((a, b) => a - b);
    windows(m, fo, s * WX1, bays(-2, -7, 7), (z) => Math.abs(z + 2) > 15);
    porch(m, { f: fo, plane: s * WX1, s0: -16.0, s1: 12.0, depth: 3.0, cols: endCols, colD: 1.6, rail: [[-15.6, 11.6]] });
    // the inner end beside the connector
    const fi: Face = s > 0 ? "-x" : "+x";
    windows(m, fi, s * WX0, [-26.4, -21.6, 19.6, 23.2]);
    m.scope("chamber roof", () => {
      m.loft("roof", rect(22, 30, wc, -2), Y_ROOF, rect(9, 16, wc, -2), 25.2, false);
      m.cap("domeShade", rect(9, 16, wc, -2), 25.2);
    });
  });
}

// --- the dome ----------------------------------------------------------------------

function domePoint(k: number): [number, number] {
  const phi = (PHI1 * k) / DOME_ROWS;
  return [R_DOME0 * Math.cos(phi), Y_DOME0 + DOME_B * Math.sin(phi)];
}

/** A point on the middle line of the facet at angle a: apothem-scaled radius r, height y, s across, d out along nrm. */
function onFacet(a: number, r: number, y: number, s: number, nr: number, ny: number, d: number, apo: number): Vec3 {
  const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
  const t: Vec3 = [-Math.sin(a), 0, -Math.cos(a)];
  const rr = r * apo + nr * d;
  return [u[0] * rr + t[0] * s, y + ny * d, DZC + u[2] * rr + t[2] * s];
}

function dome(m: MeshBuilder): void {
  const apo = Math.cos(Math.PI / N_DOME);
  m.scope("dome", () => {
    m.scope("drum and peristyle", () => {
      lathe(m, N_DOME, ROT, [
        // the stepped base over the roof and its cornice
        [R_BASE, 20.0, "stone"], [R_BASE, 28.9, "stone"], [R_BASE + 0.6, 29.4, "stone"], [R_BASE + 0.6, Y_PERI, "stone"],
        // the peristyle's floor and the drum wall behind the columns
        [R_INNER, Y_PERI, "dome"], [R_INNER, Y_PERI_ENT, "domeShade"],
        // the entablature's soffit, face and top
        [R_ENT, Y_PERI_ENT, "dome"], [R_ENT, Y_PERI_TOP, "dome"],
        // the balustrade
        [R_ENT - 0.15, Y_PERI_TOP, "dome"], [R_ENT - 0.15, Y_PERI_TOP + 0.3, "domeShade"], [R_ENT - 0.15, Y_PERI_TOP + 1.15, "dome"],
        [R_ENT - 0.15, Y_PERI_TOP + 1.4, "dome"],
        [R_ENT - 0.6, Y_PERI_TOP + 1.4, "dome"], [R_ENT - 0.6, Y_PERI_TOP, "dome"],
        // the attic, its bracketed cornice and the foot of the shell
        [R_ATTIC, Y_PERI_TOP, "dome"], [R_ATTIC, Y_ATTIC_TOP, "domeShade"], [R_ATTIC + 0.8, Y_ATTIC_TOP + 0.8, "dome"],
        [R_ATTIC + 0.8, Y_DOME0, "dome"], [R_DOME0, Y_DOME0, "domeShade"],
      ], 0, DZC);
    });
    m.scope("peristyle columns", () => {
      for (let j = 0; j < 36; j++) {
        const a = ((5 + 10 * j) * Math.PI) / 180;
        corinthian(m, R_COL * Math.cos(a), DZC - R_COL * Math.sin(a), Y_PERI, Y_PERI_ENT, 0.5, 6, "dome", true);
      }
    });
    m.scope("drum windows", () => {
      for (let j = 0; j < 36; j++) {
        const a = (10 * j * Math.PI) / 180;
        const P = (s: number, y: number): Vec3 => onFacet(a, R_INNER, y, s, 1, 0, 0.03, apo);
        const pts: Vec3[] = [P(-0.75, 31.0), P(0.75, 31.0), P(0.75, 36.4), P(-0.75, 31.0), P(0.75, 36.4), P(-0.75, 36.4)];
        for (let k = 0; k < 5; k++) {
          const a0 = (k / 5) * Math.PI;
          const a1 = ((k + 1) / 5) * Math.PI;
          pts.push(P(0, 36.4), P(0.75 * Math.cos(a0), 36.4 + 0.75 * Math.sin(a0)), P(0.75 * Math.cos(a1), 36.4 + 0.75 * Math.sin(a1)));
        }
        m.facets("dark", pts, [Math.cos(a), 0, -Math.sin(a)]);
      }
    });
    m.scope("attic", () => {
      for (let j = 0; j < 36; j++) {
        const aw = (10 * j * Math.PI) / 180;
        const W = (s: number, y: number): Vec3 => onFacet(aw, R_ATTIC, y, s, 1, 0, 0.03, apo);
        face(m, "dark", W(-0.55, 43.6), W(0.55, 43.6), W(0.55, 47.6), W(-0.55, 47.6), [Math.cos(aw), 0, -Math.sin(aw)]);
        const ap = ((5 + 10 * j) * Math.PI) / 180;
        const Q = (s: number, y: number): Vec3 => onFacet(ap, R_ATTIC, y, s, 1, 0, -0.05, apo);
        const u: Vec3 = [Math.cos(ap) * 0.4, 0, -Math.sin(ap) * 0.4];
        m.slab("dome", [Q(-0.4, Y_PERI_TOP + 0.6), Q(0.4, Y_PERI_TOP + 0.6), Q(0.4, Y_ATTIC_TOP + 0.3), Q(-0.4, Y_ATTIC_TOP + 0.3)], u);
      }
    });
    shell(m, apo);
    lantern(m);
  });
}

/** The ribbed shell, its windows and the ribs. */
function shell(m: MeshBuilder, apo: number): void {
  m.scope("shell", () => {
    const prof: Array<[number, number, string]> = [];
    for (let k = 0; k <= DOME_ROWS; k++) {
      const [r, y] = domePoint(k);
      prof.push([r, y, "domeShade"]);
    }
    lathe(m, N_DOME, ROT, prof, 0, DZC);
    // the segment normals (in the facet middle's plane) and the averaged ones at the points
    const segN: Array<[number, number]> = [];
    for (let k = 0; k < DOME_ROWS; k++) {
      const [r0, y0] = domePoint(k);
      const [r1, y1] = domePoint(k + 1);
      const dr = (r1 - r0) * apo;
      const dy = y1 - y0;
      const l = Math.hypot(dr, dy);
      segN.push([dy / l, -dr / l]);
    }
    const ptN = (k: number): [number, number] => {
      const a = segN[Math.max(0, k - 1)]!;
      const b = segN[Math.min(DOME_ROWS - 1, k)]!;
      const l = Math.hypot(a[0] + b[0], a[1] + b[1]);
      return [(a[0] + b[0]) / l, (a[1] + b[1]) / l];
    };
    m.scope("windows", () => {
      for (let j = 0; j < 36; j++) {
        const a = (10 * j * Math.PI) / 180;
        for (const k of [1, 4]) {
          const [r0, y0] = domePoint(k);
          const [r1, y1] = domePoint(k + 1);
          const [nr, ny] = segN[k]!;
          const at = (s: number, f: number): Vec3 => onFacet(a, r0 + (r1 - r0) * f, y0 + (y1 - y0) * f, s, nr, ny, 0.03, apo);
          const w = 0.035 * (r0 + r1) / 2;
          face(m, "dark", at(-w, 0.15), at(w, 0.15), at(w, 0.85), at(-w, 0.85), [Math.cos(a) * nr, ny, -Math.sin(a) * nr]);
        }
      }
    });
    m.scope("ribs", () => {
      for (let j = 0; j < 36; j++) {
        const a = ((5 + 10 * j) * Math.PI) / 180;
        const u: Vec3 = [Math.cos(a), 0, -Math.sin(a)];
        const t: Vec3 = [-Math.sin(a), 0, -Math.cos(a)];
        const B: Vec3[][] = [];
        const T: Vec3[][] = [];
        for (let k = 0; k <= DOME_ROWS; k++) {
          const [r, y] = domePoint(k);
          const w = 0.022 * r + 0.03;
          const [nr, ny] = ptN(k);
          B.push([onFacet(a, r, y, -w, 0, 0, 0, apo), onFacet(a, r, y, w, 0, 0, 0, apo)]);
          T.push([onFacet(a, r, y, -w * 0.8, nr, ny, 0.32, apo), onFacet(a, r, y, w * 0.8, nr, ny, 0.32, apo)]);
        }
        for (let k = 0; k < DOME_ROWS; k++) {
          const [nr, ny] = segN[k]!;
          const out: Vec3 = [u[0] * nr, ny, u[2] * nr];
          face(m, "dome", T[k]![0]!, T[k]![1]!, T[k + 1]![1]!, T[k + 1]![0]!, out);
          face(m, "dome", B[k]![1]!, B[k + 1]![1]!, T[k + 1]![1]!, T[k]![1]!, t);
          face(m, "dome", B[k]![0]!, B[k + 1]![0]!, T[k + 1]![0]!, T[k]![0]!, [-t[0], 0, -t[2]]);
        }
      }
    });
  });
}

/** The lantern: its platform and balustrade, the tholos, the cupola and the Statue of Freedom. */
function lantern(m: MeshBuilder): void {
  m.scope("lantern", () => {
    const N = 24;
    const rot = Math.PI / N;
    lathe(m, N, rot, [
      [R_LIP, Y_DOME1, "dome"], [5.4, Y_DOME1, "dome"], [5.4, 68.6, "dome"],
      [5.2, 68.6, "dome"], [5.2, 69.5, "dome"], [4.9, 69.5, "dome"], [4.9, 68.6, "dome"],
      [2.7, 68.6, "domeShade"], [2.7, 74.3, "dome"], [4.1, 74.3, "dome"], [4.1, 75.3, "dome"],
      [3.75, 75.3, "dome"], [3.4, 76.2, "dome"], [2.6, 76.9, "dome"], [1.6, 77.4, "dome"], [1.1, 77.5, "dome"], [0, 77.5, "dome"],
    ], 0, DZC);
    m.scope("tholos", () => {
      const apo = Math.cos(Math.PI / N);
      for (let j = 0; j < 12; j++) {
        const ac = ((15 + 30 * j) * Math.PI) / 180;
        corinthian(m, 3.4 * Math.cos(ac), DZC - 3.4 * Math.sin(ac), 68.6, 74.3, 0.22, 6, "dome", true);
        const aw = (30 * j * Math.PI) / 180;
        const W = (s: number, y: number): Vec3 => onFacet(aw, 2.7, y, s, 1, 0, 0.03, apo);
        face(m, "dark", W(-0.4, 69.4), W(0.4, 69.4), W(0.4, 73.2), W(-0.4, 73.2), [Math.cos(aw), 0, -Math.sin(aw)]);
      }
    });
    statue(m);
  });
}

/** Crawford's Statue of Freedom, 5.9 m, on her globe and the fluted pedestal; she faces east. */
function statue(m: MeshBuilder): void {
  m.scope("statue of freedom", () => {
    const z = DZC;
    lathe(m, 12, 0, [
      [1.05, 77.5, "bronze"], [1.05, 78.2, "bronze"], [0.75, 78.5, "bronze"], [0.75, 79.9, "bronze"], [0.95, 80.2, "bronze"],
      [0.95, 80.5, "bronze"], [0.4, 80.6, "bronze"],
      // the globe
      [0.62, 80.8, "bronze"], [0.78, 81.3, "bronze"], [0.62, 81.85, "bronze"], [0.3, 82.1, "bronze"],
      // the figure: the robe, the waist, the shoulders, the neck and the helmeted head
      [0.85, 82.1, "bronze"], [0.72, 84.0, "bronze"], [0.5, 85.2, "bronze"], [0.6, 85.9, "bronze"], [0.45, 86.2, "bronze"],
      [0.18, 86.3, "bronze"], [0.24, 86.45, "bronze"], [0.3, 86.75, "bronze"], [0.26, 87.05, "bronze"], [0, 87.1, "bronze"],
    ], 0, z);
    // the eagle-head crest of the helmet
    m.slab("bronze", [[0, 86.95, z - 0.4], [0, 87.25, z + 0.35], [0, 88.0, z + 0.15], [0, 87.75, z - 0.4]], [0.24, 0, 0]);
    // her right hand on the sheathed sword, her left with the wreath and the shield
    m.slab("bronze", [[0.5, 85.8, z - 0.15], [0.8, 85.6, z - 0.15], [0.75, 83.6, z - 0.15], [0.55, 83.6, z - 0.15]], [0, 0, 0.3]);
    m.slab("bronze", [[0.72, 83.7, z - 0.05], [0.8, 83.7, z - 0.05], [0.8, 82.15, z - 0.05], [0.72, 82.15, z - 0.05]], [0, 0, 0.1]);
    m.slab("bronze", [[-0.5, 85.8, z - 0.15], [-0.78, 85.6, z + 0.25], [-0.72, 84.6, z + 0.55], [-0.5, 84.9, z + 0.2]], [0.0, 0.22, 0]);
    const sh: Vec3[] = [];
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      sh.push([-0.85, 83.6 + 0.55 * Math.sin(a), z - 0.1 + 0.55 * Math.cos(a)]);
    }
    m.slab("bronze", sh, [0.12, 0, 0]);
  });
}

// --- the model ---------------------------------------------------------------------

export function usCapitol(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.moved(([x, y, z]) => [x, y, z + DZ], () => {
    m.scope("united states capitol", () => {
      centralBlock(m);
      westFront(m);
      for (const s of [-1, 1]) connector(m, s);
      for (const s of [-1, 1]) wing(m, s);
      dome(m);
    });
  });
  return m;
}

export function usCapitolLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  // boxes without undersides: the ones that meet would overlap on the ground
  const lodBox = (mm: MeshBuilder, mat: string, x: number, z: number, w: number, d: number, y0: number, y1: number): void => {
    mm.box(mat, x, z, w, d, y0, y1, 0, mat !== "stone");
    if (mat === "stone") mm.cap("roof", rect(w, d, x, z), y1);
  };
  m.moved(([x, y, z]) => [x, y, z + DZ], () => {
    const n = 12;
    const C = (r: number): Ring => ngon(n, r, 0, 0, DZC);
    // the blocks, their roofs as one height, the porticos and the steps
    lodBox(m, "stone", 0, (CZ0 + CZ1) / 2, 2 * CX + 1.8, CZ1 - CZ0 + 1.8, 0, Y_ROOF + 1.4);
    lodBox(m, "stone", 0, (PZ + CZ0 - 0.4) / 2, 2 * PX, CZ0 - 0.4 - PZ, 0, Y_ROOF + 1.2);
    lodBox(m, "rustic", 0, (TZ + CZ0) / 2, 2 * TX, CZ0 - TZ, 0, Y_RUSTIC);
    for (const s of [-1, 1]) {
      lodBox(m, "stone", s * (CX + KX1) / 2, (KZ0 + KZ1) / 2, KX1 - CX, KZ1 - KZ0, 0, Y_ROOF + 1.1);
      lodBox(m, "stone", s * WC, (WZ0 + WZ1) / 2, WX1 - WX0 + 1.8, WZ1 - WZ0 + 1.8, 0, Y_ROOF + 1.4);
      lodBox(m, "stoneShade", s * WC, (WZ1 + 0.9 + WZ1 + 10.4) / 2, 21.6, 9.5, 0, Y_PORCH);
      const ya = Y_PORCH + 11.4 * SLOPE;
      m.sweep("roof", "z", [[s * WC - 11.4, Y_PORCH], [s * WC + 11.4, Y_PORCH], [s * WC, ya]], WZ1, [[s * WC - 11.4, Y_PORCH], [s * WC + 11.4, Y_PORCH], [s * WC, ya]], WZ1 + 10.8);
      m.sweep("steps", "x", [[WZ1 + 10.4, 0], [WZ1 + 22.7, 0], [WZ1 + 10.4, Y_FLOOR]], s * WC - 8, [[WZ1 + 10.4, 0], [WZ1 + 22.7, 0], [WZ1 + 10.4, Y_FLOOR]], s * WC + 8);
      lodBox(m, "stoneShade", s * (WX1 + 0.9 + 1.25), -2, 2.5, 28, 0, Y_PORCH);
    }
    lodBox(m, "stoneShade", 0, (CZ1 + 0.9 + CZ1 + 13.8) / 2, 28.8, 12.9, 0, Y_PORCH);
    const yc = Y_PORCH + 15 * SLOPE;
    m.sweep("roof", "z", [[-15, Y_PORCH], [15, Y_PORCH], [0, yc]], CZ1, [[-15, Y_PORCH], [15, Y_PORCH], [0, yc]], CZ1 + 14.2);
    m.sweep("steps", "x", [[CZ1 + 13.8, 0], [CZ1 + 26.1, 0], [CZ1 + 13.8, Y_FLOOR]], -11, [[CZ1 + 13.8, 0], [CZ1 + 26.1, 0], [CZ1 + 13.8, Y_FLOOR]], 11);
    m.sweep("steps", "x", [[TZ, Y_RUSTIC], [TZ, 0], [TZ - 11.7, 0]], -21.6, [[TZ, Y_RUSTIC], [TZ, 0], [TZ - 11.7, 0]], 21.6);
    // the dome: base, peristyle, attic, shell, lantern and statue
    lodLoft(m, "stone", C(R_BASE + 0.6), 20.0, C(R_BASE + 0.6), Y_PERI);
    m.prism("domeShade", C(R_ENT), Y_PERI, Y_PERI_TOP + 1.4, true);
    m.prism("dome", C(R_ATTIC + 0.8), Y_PERI_TOP + 1.4, Y_DOME0, true);
    const [r4, y4] = domePoint(4);
    const [r8, y8] = domePoint(8);
    m.loft("dome", C(R_DOME0), Y_DOME0, C(r4), y4, false);
    m.loft("dome", C(r4), y4, C(r8), y8, false);
    m.loft("dome", C(r8), y8, C(R_LIP), Y_DOME1, false);
    const L = (r: number): Ring => ngon(8, r, 0, 0, DZC);
    m.loft("dome", L(R_LIP), Y_DOME1, L(4.1), 69.0, false);
    m.prism("dome", L(4.1), 69.0, 75.3, false);
    m.loft("dome", L(4.1), 75.3, L(1.1), 77.5, false);
    m.prism("bronze", L(0.9), 77.5, 86.0, false);
    m.spire("bronze", L(0.9), 86.0, 88.0);
  });
  return m;
}

export const US_CAPITOL: ProceduralDesign[] = [
  {
    id: "bld-us-capitol",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "United States Capitol",
    build: usCapitol,
    buildLod: usCapitolLod,
    references: "us-capitol",
    catalog: PLAZA_CATALOG,
  },
];
