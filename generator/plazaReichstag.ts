// The Reichstag building in Berlin (Paul Wallot, 1884-1894; rebuilt for the Bundestag
// by Norman Foster, 1995-1999) with Foster's glass dome over the plenary hall. A plaza
// landmark (docs/models/plaza-landmarks.md); pairs with the Brandenburg Gate in
// generator/landmarks.ts.
//
// Real dimensions: about 137 m long and 97 m deep. The west front faces the Platz der
// Republik: a grand stair up to the six-column Corinthian portico between two tall
// corner piers with pinnacles, the frieze inscribed DEM DEUTSCHEN VOLKE and the
// pediment above it. Four square corner towers (about 40 m) with their stepped tops,
// sculpture groups on their corners and flags; between them the long facades with a
// rusticated base, two main storeys of tall windows (arched below, pedimented above)
// between giant pilasters, the entablature, the attic and the balustrade with urns.
// Two light courts flank the plenary hall. On the flat roof stands the glass dome: 40 m
// across and 23.5 m high, 24 steel ribs and 17 rings with the glass between, the two
// spiral ramps inside, the viewing platform and the mirrored cone in the centre.
//
// Modelled in metres, +Y up, the ground at y = 0, centred on the footprint. The long
// axis runs along X; the west front (the portico) faces +Z.
//
// Sources: Wikipedia "Reichstag building", the photographs in assets/reichstag/
// (SOURCES.md). Deterministic: the same code gives the same bytes.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { seeThrough, type Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";

const PALETTE: Record<string, MaterialSpec> = {
  stone: { color: "#cbbfa6", roughness: 0.9 },
  stoneShade: { color: "#a39780", roughness: 0.92 },
  stoneLight: { color: "#dcd2bc", roughness: 0.85 },
  roof: { color: "#8a9090", metallic: 0.25, roughness: 0.65 },
  terrace: { color: "#bdb8ac", roughness: 0.9 },
  window: { color: "#2c333c", metallic: 0.2, roughness: 0.3 },
  steel: { color: "#c9cfd4", metallic: 0.5, roughness: 0.4 },
  glass: seeThrough({ color: "#a9c4d2", metallic: 0.3, roughness: 0.1 }, 0.24),
  mirror: { color: "#d9e2e8", metallic: 0.9, roughness: 0.12 },
  bronze: { color: "#2a2622", metallic: 0.4, roughness: 0.5 },
  flagRed: { color: "#c8201e", roughness: 0.8 },
  flagGold: { color: "#f2c200", roughness: 0.8 },
};

// --- helpers -----------------------------------------------------------------------

/** A box spanning x0..x1, y0..y1, z0..z1 without its underside (`top` optional). */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true): void {
  m.box(mat, (x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, y0, y1, 0, top);
}

/** A closed box spanning x0..x1, y0..y1, z0..z1 (with its underside). */
function cube(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, true);
  m.cap(mat, r, y0, false);
}

/** A quad wound so that it faces along n. */
function oq(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const f = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (f[0] * n[0] + f[1] * n[1] + f[2] * n[2] >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/**
 * A bar between two sections of four corners each (A[j] joins B[j], both in order
 * around the section): its four side walls, each facing away from the bar's axis.
 * The ends stay open (they run on into the next bar or into a wall).
 */
function bar(m: MeshBuilder, mat: string, A: Vec3[], B: Vec3[]): void {
  const c: Vec3 = [0, 0, 0];
  for (const p of [...A, ...B]) for (let k = 0; k < 3; k++) c[k] += p[k]! / 8;
  for (let j = 0; j < 4; j++) {
    const k = (j + 1) % 4;
    const mid = [0, 1, 2].map((q) => (A[j]![q]! + A[k]![q]! + B[j]![q]! + B[k]![q]!) / 4 - c[q]!) as Vec3;
    oq(m, mat, A[j]!, A[k]!, B[k]!, B[j]!, mid);
  }
}

// A facade face: its plane and outward direction. Local coordinates (u, y, w): u runs
// to the right seen from outside, w outward from the plane.
type Dir = "z+" | "z-" | "x+" | "x-";
interface Face {
  dir: Dir;
  o: number;
}

function W(f: Face, u: number, y: number, w: number): Vec3 {
  switch (f.dir) {
    case "z+": return [u, y, f.o + w];
    case "z-": return [-u, y, f.o - w];
    case "x+": return [f.o + w, y, -u];
    default: return [f.o - w, y, u];
  }
}

function N(f: Face, u: number, y: number, w: number): Vec3 {
  return W({ dir: f.dir, o: 0 }, u, y, w);
}

/**
 * A box on a face: front, top and the two ends, plus the underside and back when asked;
 * `ends: false` leaves out the ends (a band running into a neighbouring wall).
 */
function lbox(m: MeshBuilder, f: Face, mat: string, u0: number, u1: number, y0: number, y1: number, w0: number, w1: number, bottom = false, back = false, ends = true): void {
  const P = (u: number, y: number, w: number): Vec3 => W(f, u, y, w);
  oq(m, mat, P(u0, y0, w1), P(u1, y0, w1), P(u1, y1, w1), P(u0, y1, w1), N(f, 0, 0, 1));
  oq(m, mat, P(u0, y1, w0), P(u1, y1, w0), P(u1, y1, w1), P(u0, y1, w1), N(f, 0, 1, 0));
  if (ends) {
    oq(m, mat, P(u0, y0, w0), P(u0, y0, w1), P(u0, y1, w1), P(u0, y1, w0), N(f, -1, 0, 0));
    oq(m, mat, P(u1, y0, w0), P(u1, y0, w1), P(u1, y1, w1), P(u1, y1, w0), N(f, 1, 0, 0));
  }
  if (bottom) oq(m, mat, P(u0, y0, w0), P(u1, y0, w0), P(u1, y0, w1), P(u0, y0, w1), N(f, 0, -1, 0));
  if (back) oq(m, mat, P(u0, y0, w0), P(u1, y0, w0), P(u1, y1, w0), P(u0, y1, w0), N(f, 0, 0, -1));
}

/** A flat pane on a face at w, facing out. */
function pane(m: MeshBuilder, f: Face, mat: string, u0: number, u1: number, y0: number, y1: number, w: number): void {
  oq(m, mat, W(f, u0, y0, w), W(f, u1, y0, w), W(f, u1, y1, w), W(f, u0, y1, w), N(f, 0, 0, 1));
}

/** The (u, y) outline of a round-headed opening: centre c, half width hw, sill y0, springing ys. */
function archOutline(c: number, hw: number, y0: number, ys: number, n = 6): Array<[number, number]> {
  const pts: Array<[number, number]> = [[c - hw, y0], [c + hw, y0]];
  for (let j = 0; j <= n; j++) {
    const a = (j / n) * Math.PI;
    pts.push([c + hw * Math.cos(a), ys + hw * Math.sin(a)]);
  }
  return pts;
}

/** A round-headed surround standing proud of a face from w0 to w1. */
function archSlab(m: MeshBuilder, f: Face, mat: string, c: number, hw: number, y0: number, ys: number, w0: number, w1: number, n = 6): void {
  const pts = archOutline(c, hw, y0, ys, n).map(([u, y]) => W(f, u, y, w1));
  m.slab(mat, pts, N(f, 0, 0, w0 - w1));
}

/** A round-headed pane at w, facing out. */
function archPane(m: MeshBuilder, f: Face, mat: string, c: number, hw: number, y0: number, ys: number, w: number, n = 6): void {
  const pts = archOutline(c, hw, y0, ys, n).map(([u, y]) => W(f, u, y, w));
  const tris: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) tris.push(pts[0]!, pts[i]!, pts[i + 1]!);
  m.facets(mat, tris, N(f, 0, 0, 1));
}

/** A triangular pediment on a face: base y0 from c-hw to c+hw, apex y1, proud from w0 to w1. */
function triSlab(m: MeshBuilder, f: Face, mat: string, c: number, hw: number, y0: number, y1: number, w0: number, w1: number): void {
  m.slab(mat, [W(f, c - hw, y0, w1), W(f, c + hw, y0, w1), W(f, c, y1, w1)], N(f, 0, 0, w0 - w1));
}

// --- dimensions --------------------------------------------------------------------

const XS = 66.5; // the short (north and south) facades
const ZW = 33.75; // the west front's wall (+Z)
const ZE = -47.25; // the east front's wall (-Z)
const TX0 = 48.7; // the corner towers span 48.7..68.7 in |x|
const TX1 = 68.7;
const TZW: [number, number] = [15.75, 35.75]; // the west towers in z
const TZE: [number, number] = [-49.25, -29.25]; // the east towers in z

const Y_PLINTH = 0.8;
const Y_BASE = 5.6; // top of the rusticated base
const Y_STRING = 6.2; // top of the string course, foot of the giant order
const Y_CAP = 21.2; // foot of the pilaster capitals
const Y_ORDER = 22.0; // top of the capitals
const Y_FRIEZE = 23.6;
const Y_CORNICE = 24.4;
const Y_ROOF = 25.6; // the roof terrace
const Y_ATTIC2 = 27.2; // the raised attics of the projections
const Y_TOWER = 26.4; // the towers' ledge, foot of the upper stage
const Y_STAGE = 36.6; // top of the towers' upper stage
const Y_PODIUM = 5.2; // the portico's floor
const RIM = 8; // the wing roofs' depth
const Y_RIM = 27.6; // their ridge round the inner terrace

// the light courts flanking the plenary hall
const CX0 = 26;
const CX1 = 44;
const CZ0 = -30;
const CZ1 = 12;

// the dome over the plenary hall
const DZ = -6.75;
const D_R = 20;
const D_H = 24; // the ellipse's half height; the top ring stands at 23.5 m
const Y_DRUM = 26.0;
const RIBS = 24;
const RINGS = 17;
const T_TOP = Math.acos(4.2 / D_R);

// the west portico
const ZP = 37.75; // the portal's back wall
const ZC = 41.0; // the column axes
const ZF = 42.4; // the frieze's face
const PIER_X0 = 17.6;
const PIER_X1 = 21.6;
const Y_PED = 25.0; // the pediment's base
const Y_APEX = 32.2;
const COLS = [-15.25, -9.15, -3.05, 3.05, 9.15, 15.25];
const STEPS = 16;
const STEP_RUN = 0.38;
const Z_STAIR = 43.25; // the podium's front, foot of the stair's top step

// --- facades -----------------------------------------------------------------------

/** The bands every facade carries: plinth, rusticated base, string course, entablature. */
function bands(m: MeshBuilder, f: Face, u0: number, u1: number, ends = true): void {
  lbox(m, f, "stoneShade", u0, u1, 0, Y_PLINTH, 0, 0.45, false, false, ends);
  for (let i = 0; i < 4; i++) {
    const y0 = Y_PLINTH + i * 1.2;
    lbox(m, f, "stoneShade", u0, u1, y0, Math.min(y0 + 1.1, Y_BASE), 0, 0.25, false, false, ends);
  }
  lbox(m, f, "stoneLight", u0, u1, Y_BASE, Y_STRING, 0, 0.55, true, false, ends);
  lbox(m, f, "stoneLight", u0, u1, Y_ORDER, Y_FRIEZE, 0, 0.55, false, false, ends);
  lbox(m, f, "stoneLight", u0, u1, Y_FRIEZE, Y_CORNICE, 0, 1.1, true, false, ends);
}

/** A giant pilaster with its base and capital at u. */
function pilaster(m: MeshBuilder, f: Face, u: number, hw = 0.5): void {
  lbox(m, f, "stone", u - hw, u + hw, Y_STRING, Y_CAP, 0, 0.4);
  lbox(m, f, "stoneLight", u - hw - 0.12, u + hw + 0.12, Y_STRING, Y_STRING + 0.6, 0, 0.5);
  lbox(m, f, "stoneLight", u - hw - 0.15, u + hw + 0.15, Y_CAP, Y_ORDER, 0, 0.55);
}

/** One window axis: basement window, arched main-floor window, pedimented upper window. */
function windowAxis(m: MeshBuilder, f: Face, c: number): void {
  pane(m, f, "window", c - 0.8, c + 0.8, 2.0, 4.3, 0.28);
  lbox(m, f, "stoneLight", c - 1.7, c + 1.7, 6.75, 7.0, 0, 0.3);
  archSlab(m, f, "stoneLight", c, 1.5, 7.0, 12.0, 0, 0.15);
  archPane(m, f, "window", c, 1.15, 7.3, 12.0, 0.17);
  lbox(m, f, "stoneLight", c - 1.4, c + 1.4, 15.15, 15.4, 0, 0.3);
  lbox(m, f, "stoneLight", c - 1.2, c + 1.2, 15.4, 19.2, 0, 0.15);
  pane(m, f, "window", c - 0.95, c + 0.95, 15.6, 19.0, 0.17);
  lbox(m, f, "stoneLight", c - 1.4, c + 1.4, 19.2, 19.45, 0, 0.32, true);
  triSlab(m, f, "stoneLight", c, 1.4, 19.45, 20.35, 0, 0.3);
}

/** The roof balustrade along a face at height y: rails, posts, the dark screen between, urns. */
function balustrade(m: MeshBuilder, f: Face, u0: number, u1: number, y: number, posts: number[], urns: number[], ends = true): void {
  lbox(m, f, "stone", u0, u1, y, y + 0.25, -0.7, 0, false, true, ends);
  lbox(m, f, "stoneShade", u0 + 0.3, u1 - 0.3, y + 0.25, y + 0.9, -0.5, -0.3, false, true, false);
  for (const p of posts) lbox(m, f, "stone", Math.max(u0, p - 0.3), Math.min(u1, p + 0.3), y + 0.25, y + 0.95, -0.7, 0, false, true);
  lbox(m, f, "stone", u0, u1, y + 0.95, y + 1.2, -0.75, 0.05, true, true, ends);
  for (const p of urns) {
    const [x, , z] = W(f, p, 0, -0.35);
    const yb = y + 1.2;
    m.loft("stoneLight", ngon(6, 0.22, 0, x, z), yb, ngon(6, 0.34, 0, x, z), yb + 0.45, false);
    m.loft("stoneLight", ngon(6, 0.34, 0, x, z), yb + 0.45, ngon(6, 0.12, 0, x, z), yb + 0.9);
  }
}

/**
 * A run of facade between u0 and u1 with `bays` window axes: the bands, the pilasters,
 * the windows, the attic pedestals and the balustrade at `top`.
 */
function facadeRun(m: MeshBuilder, f: Face, u0: number, u1: number, bays: number, top: number, ends = true): void {
  bands(m, f, u0, u1, ends);
  const bw = (u1 - u0) / bays;
  const piers: number[] = [];
  for (let i = 0; i <= bays; i++) piers.push(u0 + i * bw);
  for (const p of piers) {
    pilaster(m, f, p);
    lbox(m, f, "stone", p - 0.6, p + 0.6, Y_CORNICE, top, 0, 0.3);
  }
  for (let i = 0; i < bays; i++) windowAxis(m, f, u0 + (i + 0.5) * bw);
  const mids = piers.slice(0, -1).map((p) => p + bw / 2);
  balustrade(m, f, u0, u1, top, [...piers, ...mids].sort((a, b) => a - b), piers.slice(1, -1), ends);
}

function westFront(m: MeshBuilder): void {
  m.scope("west front", () => {
    const f: Face = { dir: "z+", o: ZW };
    facadeRun(m, f, -TX0, -PIER_X1, 5, Y_ROOF, false);
    facadeRun(m, f, PIER_X1, TX0, 5, Y_ROOF, false);
  });
}

function eastFront(m: MeshBuilder): void {
  m.scope("east front", () => {
    const f: Face = { dir: "z-", o: ZE };
    facadeRun(m, f, -TX0, -20, 5, Y_ROOF, false);
    facadeRun(m, f, 20, TX0, 5, Y_ROOF, false);
    m.scope("east projection", () => {
      span(m, "stone", -20, 20, 0, Y_ATTIC2, -49.25, ZE + 0.5, false);
      m.cap("roof", rect(40, 2.5, 0, ZE - 0.75), Y_ATTIC2);
      facadeRun(m, { dir: "z-", o: -49.25 }, -20, 20, 7, Y_ATTIC2);
      // the pediment over the three middle axes
      const g: Face = { dir: "z-", o: -49.25 };
      triSlab(m, g, "stoneLight", 0, 9.2, Y_ATTIC2 + 1.2, Y_ATTIC2 + 4.6, -0.6, 0.6);
      lbox(m, g, "stone", -9.2, 9.2, Y_ATTIC2, Y_ATTIC2 + 1.2, -0.6, 0.45);
    });
  });
}

function shortFronts(m: MeshBuilder): void {
  for (const s of [-1, 1]) {
    m.scope(s > 0 ? "south front" : "north front", () => {
      const f: Face = { dir: s > 0 ? "x+" : "x-", o: s * XS };
      // u runs -z on +X and +z on -X
      const U = (z: number): number => (s > 0 ? -z : z);
      const runs: Array<[number, number]> = [[TZE[1], -14.25], [0.75, TZW[0]]];
      for (const [z0, z1] of runs) {
        const a = U(z0);
        const b = U(z1);
        facadeRun(m, f, Math.min(a, b), Math.max(a, b), 3, Y_ROOF, false);
      }
      m.scope("projection", () => {
        const x0 = s > 0 ? XS - 0.5 : -68.0;
        const x1 = s > 0 ? 68.0 : -XS + 0.5;
        span(m, "stone", x0, x1, 0, Y_ATTIC2, -14.25, 0.75, false);
        m.cap("roof", rect(2.0, 15, s * 67.0, -6.75), Y_ATTIC2);
        const g: Face = { dir: f.dir, o: s * 68.0 };
        const a = Math.min(U(-14.25), U(0.75));
        const b = Math.max(U(-14.25), U(0.75));
        bands(m, g, a, b);
        const bw = (b - a) / 3;
        for (let i = 0; i <= 3; i++) {
          const p = a + i * bw;
          pilaster(m, g, p, 0.65);
          lbox(m, g, "stone", p - 0.7, p + 0.7, Y_CORNICE, Y_ATTIC2, 0, 0.3);
        }
        for (let i = 0; i < 3; i++) {
          const c = a + (i + 0.5) * bw;
          archSlab(m, g, "stoneShade", c, 1.7, 0.8, 3.6, 0, 0.3); // the entrance arches
          archPane(m, g, "window", c, 1.35, 0.8, 3.6, 0.32);
          archSlab(m, g, "stoneLight", c, 1.75, 7.0, 17.4, 0, 0.15);
          archPane(m, g, "window", c, 1.4, 7.3, 17.4, 0.17);
        }
        balustrade(m, g, a, b, Y_ATTIC2, [a, a + bw, a + 2 * bw, b], [a + bw, a + 2 * bw]);
      });
    });
  }
}

// --- body, courts and roof -----------------------------------------------------------

function body(m: MeshBuilder): void {
  m.scope("body", () => {
    const blocks: Array<[number, number, number, number]> = [
      [-XS, -CX1, ZE, ZW],
      [CX1, XS, ZE, ZW],
      [-CX0, CX0, ZE, ZW],
      [-CX1, -CX0, ZE, CZ0],
      [-CX1, -CX0, CZ1, ZW],
      [CX0, CX1, ZE, CZ0],
      [CX0, CX1, CZ1, ZW],
    ];
    for (const [x0, x1, z0, z1] of blocks) {
      span(m, "stone", x0, x1, 0, Y_ROOF, z0, z1, false);
      m.cap("terrace", rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2), Y_ROOF);
    }
  });
  m.scope("wing roofs", () => {
    // the low lead roofs of the wings behind the balustrade, round the inner terrace
    const outer = rect(2 * XS, ZW - ZE, 0, (ZE + ZW) / 2);
    const inner = rect(2 * (XS - RIM), ZW - ZE - 2 * RIM, 0, (ZE + ZW) / 2);
    m.loft("roof", outer, Y_ROOF, inner, Y_RIM, false);
    m.loft("stone", [...inner].reverse(), Y_ROOF, [...inner].reverse(), Y_RIM, false);
  });
  m.scope("corner pavilions", () => {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x0 = sx > 0 ? 40.5 : -TX0;
        const x1 = sx > 0 ? TX0 : -40.5;
        const z1 = sz > 0 ? ZW - 1.0 : ZE + 7.0;
        const z0 = sz > 0 ? ZW - 7.0 : ZE + 1.0;
        span(m, "stone", x0, x1, Y_ROOF, 30.4, z0, z1, false);
        cube(m, "stoneLight", x0 - 0.4, x1 + (sx > 0 ? 0 : 0.4), 30.4, 31.0, z0 - 0.4, z1 + 0.4);
        const f: Face = sz > 0 ? { dir: "z+", o: z1 } : { dir: "z-", o: z0 };
        const c = (sz > 0 ? 1 : -1) * (x0 + x1) / 2;
        for (const k of [-1, 1]) {
          archSlab(m, f, "stoneLight", c + k * 2.0, 0.9, 26.6, 28.8, 0, 0.12);
          archPane(m, f, "window", c + k * 2.0, 0.65, 26.8, 28.8, 0.14);
        }
      }
    }
  });
  m.scope("light courts", () => {
    for (const s of [-1, 1]) {
      const xa = s * CX0;
      const xb = s * CX1;
      m.cap("stoneShade", rect(CX1 - CX0, CZ1 - CZ0, s * (CX0 + CX1) / 2, (CZ0 + CZ1) / 2), 0);
      // the windows on the four court walls, facing into the court
      const xl = Math.min(xa, xb);
      const xr = Math.max(xa, xb);
      const walls: Array<{ f: Face; u0: number; u1: number }> = [
        { f: { dir: "x+", o: xl }, u0: -CZ1, u1: -CZ0 },
        { f: { dir: "x-", o: xr }, u0: CZ0, u1: CZ1 },
        { f: { dir: "z+", o: CZ0 }, u0: xl, u1: xr },
        { f: { dir: "z-", o: CZ1 }, u0: -xr, u1: -xl },
      ];
      for (const { f, u0, u1 } of walls) {
        const n = Math.max(1, Math.floor((u1 - u0) / 3.6));
        const step = (u1 - u0) / n;
        for (let i = 0; i < n; i++) {
          const c = u0 + (i + 0.5) * step;
          for (const y of [1.6, 7.4, 12.2, 16.6, 21.0]) pane(m, f, "window", c - 0.75, c + 0.75, y, y + 2.6, 0.03);
        }
      }
    }
  });
}

// --- corner towers -----------------------------------------------------------------

/** A sculpture group of two figures on a pedestal standing on y at (x, z). */
function sculpture(m: MeshBuilder, x: number, y: number, z: number, turn: number): void {
  m.scope("sculpture group", () => {
    cube(m, "stone", x - 0.6, x + 0.6, y, y + 0.9, z - 0.6, z + 0.6);
    const yb = y + 0.9;
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    for (const k of [-1, 1]) {
      const fx = x + k * 0.28 * c;
      const fz = z + k * 0.28 * s;
      const h = k > 0 ? 2.1 : 1.7;
      m.loft("stoneShade", ngon(6, 0.36, 0, fx, fz), yb, ngon(6, 0.22, 0, fx, fz), yb + h, false);
      m.loft("stoneShade", ngon(6, 0.22, 0, fx, fz), yb + h, ngon(6, 0.16, 0, fx, fz), yb + h + 0.25, false);
      m.loft("stoneShade", ngon(6, 0.16, 0, fx, fz), yb + h + 0.25, ngon(6, 0.05, 0, fx, fz), yb + h + 0.5);
    }
    // a raised arm with a wreath or a sword
    const a: Vec3 = [x + 0.28 * c, yb + 1.7, z + 0.28 * s];
    m.rod("stoneShade", a, [a[0] + 0.5 * c, a[1] + 0.9, a[2] + 0.5 * s], 0.08, 4);
  });
}

function tower(m: MeshBuilder, sx: number, sz: number): void {
  const [z0, z1] = sz > 0 ? TZW : TZE;
  const x0 = sx > 0 ? TX0 : -TX1;
  const x1 = sx > 0 ? TX1 : -TX0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  m.scope("corner tower", () => {
    span(m, "stone", x0, x1, 0, Y_TOWER, z0, z1, true);
    // the four faces of the main stage; only the two outer ones carry windows
    const faces: Array<{ f: Face; u0: number; u1: number; outer: boolean }> = [
      { f: { dir: "z+", o: z1 }, u0: x0, u1: x1, outer: sz > 0 },
      { f: { dir: "z-", o: z0 }, u0: -x1, u1: -x0, outer: sz < 0 },
      { f: { dir: "x+", o: x1 }, u0: -z1, u1: -z0, outer: sx > 0 },
      { f: { dir: "x-", o: x0 }, u0: z0, u1: z1, outer: sx < 0 },
    ];
    for (const { f, u0, u1, outer } of faces) {
      bands(m, f, u0, u1);
      if (!outer) continue;
      for (const p of [u0 + 0.9, u0 + 2.7, u1 - 2.7, u1 - 0.9]) pilaster(m, f, p, 0.55);
      const c = (u0 + u1) / 2;
      // the great arched window of the main stage with its columns and the window below
      archSlab(m, f, "stoneLight", c, 2.1, 12.6, 18.6, 0, 0.2);
      archPane(m, f, "window", c, 1.65, 12.9, 18.6, 0.22);
      for (const k of [-1, 1]) lbox(m, f, "stone", c + k * 2.75 - 0.35, c + k * 2.75 + 0.35, 12.2, 20.9, 0, 0.45);
      lbox(m, f, "stoneLight", c - 3.3, c + 3.3, 20.9, 21.4, 0, 0.55, true);
      lbox(m, f, "stoneLight", c - 2.0, c + 2.0, 11.9, 12.2, 0, 0.35);
      lbox(m, f, "stoneLight", c - 1.4, c + 1.4, 6.8, 11.2, 0, 0.15);
      pane(m, f, "window", c - 1.1, c + 1.1, 7.0, 11.0, 0.17);
      lbox(m, f, "stoneLight", c - 1.6, c + 1.6, 11.2, 11.45, 0, 0.32, true);
      for (const k of [-1, 1]) {
        const s = c + k * 6.3;
        pane(m, f, "window", s - 0.6, s + 0.6, 2.0, 4.3, 0.28);
        lbox(m, f, "stoneLight", s - 0.9, s + 0.9, 8.0, 13.2, 0, 0.12);
        pane(m, f, "window", s - 0.65, s + 0.65, 8.2, 13.0, 0.14);
        lbox(m, f, "stoneLight", s - 0.9, s + 0.9, 15.4, 19.0, 0, 0.12);
        pane(m, f, "window", s - 0.65, s + 0.65, 15.6, 18.8, 0.14);
      }
    }
    // the corner sculpture groups on the ledge
    for (const kx of [-1, 1]) {
      for (const kz of [-1, 1]) {
        sculpture(m, (kx > 0 ? x1 : x0) - kx * 0.65, Y_TOWER, (kz > 0 ? z1 : z0) - kz * 0.65, Math.atan2(kz, kx) + Math.PI / 2);
      }
    }
    m.scope("upper stage", () => {
      const a0 = x0 + 1.4;
      const a1 = x1 - 1.4;
      const b0 = z0 + 1.4;
      const b1 = z1 - 1.4;
      span(m, "stone", a0, a1, Y_TOWER, Y_STAGE, b0, b1, false);
      const up: Array<{ f: Face; u0: number; u1: number }> = [
        { f: { dir: "z+", o: b1 }, u0: a0, u1: a1 },
        { f: { dir: "z-", o: b0 }, u0: -a1, u1: -a0 },
        { f: { dir: "x+", o: a1 }, u0: -b1, u1: -b0 },
        { f: { dir: "x-", o: a0 }, u0: b0, u1: b1 },
      ];
      for (const { f, u0, u1 } of up) {
        lbox(m, f, "stoneShade", u0, u1, Y_TOWER, Y_TOWER + 0.8, 0, 0.3);
        lbox(m, f, "stoneLight", u0, u1, 29.2, 29.6, 0, 0.35, true);
        lbox(m, f, "stone", u0 - 0.05, u0 + 1.4, Y_TOWER + 0.8, 35.8, 0, 0.45);
        lbox(m, f, "stone", u1 - 1.4, u1 + 0.05, Y_TOWER + 0.8, 35.8, 0, 0.45);
        const c = (u0 + u1) / 2;
        for (const k of [-1, 0, 1]) {
          archSlab(m, f, "stoneLight", c + k * 4.6, 1.25, 30.2, 33.4, 0, 0.15);
          archPane(m, f, "window", c + k * 4.6, 0.95, 30.4, 33.4, 0.17);
        }
        lbox(m, f, "stoneLight", u0, u1, 35.8, Y_STAGE, 0, 0.4);
      }
      cube(m, "stoneLight", a0 - 0.8, a1 + 0.8, Y_STAGE, Y_STAGE + 0.8, b0 - 0.8, b1 + 0.8);
      // the parapet round the top and the stepped crown
      const yp = Y_STAGE + 0.8;
      for (const k of [-1, 1]) {
        span(m, "stone", a0 - 0.4, a1 + 0.4, yp, yp + 1.0, k > 0 ? b1 - 0.2 : b0 - 0.4, k > 0 ? b1 + 0.4 : b0 + 0.2);
        span(m, "stone", k > 0 ? a1 - 0.2 : a0 - 0.4, k > 0 ? a1 + 0.4 : a0 + 0.2, yp, yp + 1.0, b0 + 0.2, b1 - 0.2);
      }
      for (const kx of [-1, 1]) for (const kz of [-1, 1]) {
        const px = kx > 0 ? a1 : a0;
        const pz = kz > 0 ? b1 : b0;
        span(m, "stone", px - 0.6, px + 0.6, yp + 1.0, yp + 1.5, pz - 0.6, pz + 0.6);
      }
      span(m, "stone", a0 + 2.6, a1 - 2.6, yp, yp + 1.6, b0 + 2.6, b1 - 2.6);
      span(m, "stoneLight", a0 + 4.6, a1 - 4.6, yp + 1.6, yp + 2.4, b0 + 4.6, b1 - 4.6);
      // the flag
      const yt = yp + 2.4;
      m.rod("steel", [cx, yt, cz], [cx, yt + 8.6, cz], 0.09, 6);
      const fx = sx;
      const stripes: Array<[string, number]> = [["bronze", 0], ["flagRed", 1], ["flagGold", 2]];
      for (const [mat, i] of stripes) {
        const ya = yt + 8.2 - (i + 1) * 0.74;
        const xa = cx + fx * 0.1;
        const xb = cx + fx * 3.7;
        cube(m, mat, Math.min(xa, xb), Math.max(xa, xb), ya, ya + 0.74, cz - 0.03, cz + 0.03);
      }
    });
  });
}

// --- west portico ------------------------------------------------------------------

/** A Corinthian column on y0 with its abacus top at y1. */
function corinthian(m: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  m.scope("corinthian column", () => {
    const r = 0.85;
    const ring = (rr: number): Ring => ngon(16, rr, Math.PI / 16, x, z);
    span(m, "stoneLight", x - 1.1, x + 1.1, y0, y0 + 0.4, z - 1.1, z + 1.1);
    m.loft("stoneLight", ring(1.02), y0 + 0.4, ring(r), y0 + 0.75, false);
    const yc = y1 - 2.1; // foot of the capital
    const ym = y0 + 0.75 + (yc - y0 - 0.75) * 0.33;
    m.loft("stone", ring(r), y0 + 0.75, ring(r * 0.98), ym, false);
    m.loft("stone", ring(r * 0.98), ym, ring(r * 0.86), yc, false);
    // the bell with two rows of acanthus leaves (a jagged ring) and the abacus
    const leaves = (rr: number): Ring => {
      const out: Ring = [];
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
        const q = i % 2 === 0 ? rr : rr * 0.84;
        out.push([x + q * Math.cos(a), z - q * Math.sin(a)]);
      }
      return out;
    };
    m.loft("stoneLight", leaves(r * 0.92), yc, leaves(r * 1.12), yc + 0.8, false);
    m.loft("stoneLight", leaves(r * 1.12), yc + 0.8, leaves(r * 1.3), yc + 1.6, false);
    m.cap("stoneLight", leaves(r * 1.3), yc + 1.6);
    cube(m, "stoneLight", x - 1.2, x + 1.2, yc + 1.6, y1, z - 1.2, z + 1.2);
  });
}

// a 3 x 5 block alphabet for the inscription: [x0, y0, x1, y1] strokes
const GLYPHS: Record<string, Array<[number, number, number, number]>> = {
  D: [[0, 0, 0.8, 5], [0.8, 4.2, 2.3, 5], [0.8, 0, 2.3, 0.8], [2.2, 0.6, 3, 4.4]],
  E: [[0, 0, 0.8, 5], [0.8, 4.2, 2.8, 5], [0.8, 2.1, 2.3, 2.9], [0.8, 0, 2.8, 0.8]],
  M: [[0, 0, 0.8, 5], [2.2, 0, 3, 5], [0.8, 3.4, 1.3, 4.6], [1.7, 3.4, 2.2, 4.6], [1.2, 2.4, 1.8, 3.6]],
  U: [[0, 0.6, 0.8, 5], [2.2, 0.6, 3, 5], [0.4, 0, 2.6, 0.8]],
  T: [[0, 4.2, 3, 5], [1.1, 0, 1.9, 4.2]],
  S: [[0.3, 4.2, 3, 5], [0, 2.6, 0.8, 4.4], [0.4, 2.1, 2.6, 2.9], [2.2, 0.6, 3, 2.4], [0, 0, 2.7, 0.8]],
  C: [[0, 0.6, 0.8, 4.4], [0.4, 4.2, 3, 5], [0.4, 0, 3, 0.8]],
  H: [[0, 0, 0.8, 5], [2.2, 0, 3, 5], [0.8, 2.1, 2.2, 2.9]],
  N: [[0, 0, 0.8, 5], [2.2, 0, 3, 5], [0.8, 3.0, 1.4, 4.4], [1.2, 2.0, 1.8, 3.4], [1.6, 0.6, 2.2, 2.4]],
  V: [[0, 1.2, 0.8, 5], [2.2, 1.2, 3, 5], [0.6, 0, 2.4, 1.2]],
  O: [[0, 0.6, 0.8, 4.4], [2.2, 0.6, 3, 4.4], [0.4, 4.2, 2.6, 5], [0.4, 0, 2.6, 0.8]],
  L: [[0, 0, 0.8, 5], [0.8, 0, 2.8, 0.8]],
  K: [[0, 0, 0.8, 5], [0.8, 2.0, 1.6, 3.0], [1.6, 3.0, 2.3, 4.0], [2.3, 4.0, 3, 5], [1.6, 1.0, 2.3, 2.0], [2.3, 0, 3, 1.0]],
  " ": [],
};
const TEXT = "DEM DEUTSCHEN VOLKE";

function inscription(m: MeshBuilder): void {
  m.scope("inscription", () => {
    const adv = (c: string): number => (c === " " ? 2.4 : 3.8);
    let w = 0;
    for (const c of TEXT) w += adv(c);
    w -= 0.8;
    const unit = 16 / w; // the letters span about 16 m of the frieze
    const h = 0.17; // a unit's height: 0.85 m letters
    const y0 = Y_ORDER + (Y_FRIEZE - 0.25 - Y_ORDER - 5 * h) / 2 + 0.25;
    let x = -8;
    for (const c of TEXT) {
      for (const [a, b, p, q] of GLYPHS[c]!) cube(m, "bronze", x + a * unit, x + p * unit, y0 + b * h, y0 + q * h, ZF - 0.02, ZF + 0.08);
      x += adv(c) * unit;
    }
  });
}

function portico(m: MeshBuilder): void {
  m.scope("west portico", () => {
    m.scope("portal", () => {
      span(m, "stone", -PIER_X1, PIER_X1, 0, Y_CORNICE, ZW - 0.5, ZP, true);
      const f: Face = { dir: "z+", o: ZP };
      // the glazed entrance wall behind the columns with its mullions
      pane(m, f, "window", -16.4, 16.4, Y_PODIUM, Y_ORDER, 0.03);
      for (let i = 0; i <= 16; i++) {
        const u = -16.4 + i * 2.05;
        lbox(m, f, "steel", u - 0.08, u + 0.08, Y_PODIUM, Y_ORDER, 0, 0.12);
      }
      for (const y of [9.4, 13.6, 17.8]) lbox(m, f, "steel", -16.4, 16.4, y - 0.08, y + 0.08, 0, 0.1);
    });
    m.scope("podium and stair", () => {
      span(m, "stoneShade", -22.2, 22.2, 0, Y_PODIUM, ZP - 0.3, Z_STAIR, false);
      m.cap("stone", rect(44.4, Z_STAIR - ZP + 0.3, 0, (Z_STAIR + ZP - 0.3) / 2), Y_PODIUM);
      const rise = Y_PODIUM / STEPS;
      for (let i = 0; i < STEPS; i++) {
        const zf = Z_STAIR + (STEPS - i) * STEP_RUN;
        span(m, "stone", -21, 21, 0, (i + 1) * rise, Z_STAIR - 0.2, zf);
      }
      for (const s of [-1, 1]) {
        const xa = s * 21;
        const ze = Z_STAIR + STEPS * STEP_RUN;
        m.slab("stoneShade", [[xa, 0, ze], [xa, 0.9, ze], [xa, Y_PODIUM + 0.9, Z_STAIR], [xa, 0, Z_STAIR]], [s * 1.6, 0, 0]);
      }
    });
    m.scope("columns", () => {
      for (const x of COLS) corinthian(m, x, ZC, Y_PODIUM, Y_ORDER);
    });
    m.scope("corner piers", () => {
      for (const s of [-1, 1]) {
        const xa = s > 0 ? PIER_X0 : -PIER_X1;
        const xb = s > 0 ? PIER_X1 : -PIER_X0;
        span(m, "stone", xa, xb, 0, 33.0, ZP - 0.5, ZF + 0.2, true);
        const f: Face = { dir: "z+", o: ZF + 0.2 };
        bands(m, f, xa, xb);
        // the relief panel and the niche of the pier's front
        lbox(m, f, "stoneShade", xa + 0.7, xb - 0.7, 7.0, 20.4, 0, 0.12);
        for (const y of [9.0, 12.6, 16.2]) lbox(m, f, "stoneShade", xa + 1.0, xb - 1.0, y, y + 2.6, 0.12, 0.45);
        lbox(m, f, "stoneLight", xa, xb, 31.0, 31.5, 0, 0.3);
        cube(m, "stoneLight", xa - 0.3, xb + 0.3, 33.0, 33.6, ZP - 0.8, ZF + 0.5);
        // the pinnacle: pedestal, octagonal lantern, cupola and finial
        const cx = (xa + xb) / 2;
        const cz = (ZP + ZF) / 2;
        span(m, "stone", cx - 1.5, cx + 1.5, 33.6, 35.6, cz - 1.5, cz + 1.5);
        m.prism("stone", ngon(8, 1.25, Math.PI / 8, cx, cz), 35.6, 38.4, false);
        m.loft("stoneLight", ngon(8, 1.25, Math.PI / 8, cx, cz), 38.4, ngon(8, 1.45, Math.PI / 8, cx, cz), 38.8, true);
        m.loft("stone", ngon(8, 1.2, Math.PI / 8, cx, cz), 38.8, ngon(8, 0.55, Math.PI / 8, cx, cz), 40.6, false);
        m.loft("stone", ngon(8, 0.55, Math.PI / 8, cx, cz), 40.6, ngon(8, 0.25, Math.PI / 8, cx, cz), 41.4, false);
        m.spire("stoneShade", ngon(8, 0.25, Math.PI / 8, cx, cz), 41.4, 42.4);
      }
    });
    m.scope("entablature", () => {
      cube(m, "stoneLight", -PIER_X0, PIER_X0, Y_ORDER, Y_FRIEZE, ZP, ZF);
      cube(m, "stoneLight", -PIER_X0, PIER_X0, Y_FRIEZE, Y_PED, ZP, ZF + 0.6);
    });
    inscription(m);
    m.scope("pediment", () => {
      const hw = PIER_X0;
      const slope = (Y_APEX - Y_PED) / hw;
      const sec: Ring = [[-hw, Y_PED], [hw, Y_PED], [0, Y_APEX]];
      m.sweep("stone", "z", sec, 28.0, sec, ZF - 0.1);
      const yR = (x: number): number => Y_PED + (hw - Math.abs(x)) * slope;
      const len = Math.hypot(1, slope);
      for (const t of [-1, 1]) {
        const xe = t * hw;
        // the raking cornice
        m.slab("stoneLight", [[0, Y_APEX + 0.1, ZF + 0.6], [0, Y_APEX - 0.6, ZF + 0.6], [xe, yR(xe) - 0.6, ZF + 0.6], [xe, yR(xe) + 0.1, ZF + 0.6]], [0, 0, -0.8]);
        // the roof over it
        const nx = (t * slope) / len;
        const ny = 1 / len;
        const lift = 0.12;
        const p = (x: number, z: number): Vec3 => [x + nx * lift, yR(x) + ny * lift, z];
        m.slab("roof", [p(0, 28.2), p(xe, 28.2), p(xe, ZF + 0.7), p(0, ZF + 0.7)], [nx * 0.25, ny * 0.25, 0]);
      }
      // the sculpture of the tympanum: a central figure group and reclining figures
      const zt = ZF - 0.1;
      m.slab("stoneShade", [[-2.2, Y_PED + 0.2, zt], [2.2, Y_PED + 0.2, zt], [1.4, Y_APEX - 1.6, zt], [-1.4, Y_APEX - 1.6, zt]], [0, 0, 0.5]);
      for (const t of [-1, 1]) {
        m.slab("stoneShade", [[t * 3.0, Y_PED + 0.2, zt], [t * 11.0, Y_PED + 0.2, zt], [t * 9.5, Y_PED + 1.4, zt], [t * 3.0, Y_PED + 3.4, zt]], [0, 0, 0.4]);
      }
      sculpture(m, 0, Y_APEX + 0.05, ZF - 0.4, 0);
    });
    m.scope("portal attic", () => {
      span(m, "stone", -PIER_X0, PIER_X0, Y_ROOF, 32.4, 27.0, 28.0);
      cube(m, "stoneLight", -PIER_X0 - 0.3, PIER_X0 + 0.3, 32.4, 32.9, 26.7, 28.3);
    });
  });
}

// --- the dome ----------------------------------------------------------------------

/** A point on the dome: profile angle t, plan angle a, normal offset dn, tangential dt, vertical dy. */
function domePt(t: number, a: number, dn: number, dt = 0, dy = 0): Vec3 {
  const nr = Math.cos(t) / D_R;
  const ny = Math.sin(t) / D_H;
  const l = Math.hypot(nr, ny);
  const r = D_R * Math.cos(t) + (dn * nr) / l;
  const y = Y_DRUM + D_H * Math.sin(t) + (dn * ny) / l + dy;
  return [r * Math.cos(a) - dt * Math.sin(a), y, DZ + r * Math.sin(a) + dt * Math.cos(a)];
}

/** The dome's inner radius at height h above its base. */
const domeR = (h: number): number => D_R * Math.sqrt(Math.max(0, 1 - (h / D_H) ** 2));

function dome(m: MeshBuilder): void {
  m.scope("dome", () => {
    m.scope("drum", () => {
      m.prism("stoneLight", ngon(48, 21.0, 0, 0, DZ), Y_ROOF, Y_DRUM, true);
    });
    const tk = (k: number): number => (T_TOP * k) / (RINGS - 1);
    const ak = (i: number): number => (i / RIBS) * Math.PI * 2;
    m.scope("glazing", () => {
      for (let k = 0; k < RINGS - 1; k++) {
        for (let i = 0; i < RIBS; i++) {
          const a = domePt(tk(k), ak(i), 0);
          const b = domePt(tk(k), ak(i + 1), 0);
          const c = domePt(tk(k + 1), ak(i + 1), 0);
          const d = domePt(tk(k + 1), ak(i), 0);
          const mid = (ak(i) + ak(i + 1)) / 2;
          oq(m, "glass", a, b, c, d, [Math.cos(mid), 0.4, Math.sin(mid)]);
        }
      }
    });
    m.scope("ribs", () => {
      for (let i = 0; i < RIBS; i++) {
        const a = ak(i);
        for (let k = 0; k < RINGS - 1; k++) {
          const sec = (t: number): Vec3[] => [domePt(t, a, -0.55, -0.16), domePt(t, a, 0.14, -0.16), domePt(t, a, 0.14, 0.16), domePt(t, a, -0.55, 0.16)];
          bar(m, "steel", sec(tk(k)), sec(tk(k + 1)));
        }
      }
    });
    m.scope("rings", () => {
      for (let k = 0; k < RINGS; k++) {
        const big = k === 0 || k === RINGS - 1;
        const dn0 = big ? -0.6 : -0.05;
        const dn1 = big ? 0.3 : 0.1;
        const h = big ? 0.3 : 0.08;
        for (let i = 0; i < RIBS; i++) {
          const sec = (a: number): Vec3[] => [domePt(tk(k), a, dn0, 0, -h), domePt(tk(k), a, dn1, 0, -h), domePt(tk(k), a, dn1, 0, h), domePt(tk(k), a, dn0, 0, h)];
          bar(m, "steel", sec(ak(i)), sec(ak(i + 1)));
        }
      }
    });
    m.scope("spiral ramps", () => {
      const segs = 40;
      const h0 = 1.0;
      const h1 = 17.0;
      for (const phase of [0, Math.PI]) {
        const at = (s: number, dr: number, dy: number): Vec3 => {
          const h = h0 + (h1 - h0) * s;
          const a = phase + s * 3 * Math.PI;
          const r = domeR(h) - 1.0 + dr;
          return [r * Math.cos(a), Y_DRUM + h + dy, DZ + r * Math.sin(a)];
        };
        for (let j = 0; j < segs; j++) {
          const s0 = j / segs;
          const s1 = (j + 1) / segs;
          const deck = (s: number): Vec3[] => [at(s, -1.9, -0.35), at(s, 0, -0.35), at(s, 0, 0), at(s, -1.9, 0)];
          bar(m, "steel", deck(s0), deck(s1));
          const rail = (s: number): Vec3[] => [at(s, -1.95, 0), at(s, -1.85, 0), at(s, -1.85, 1.0), at(s, -1.95, 1.0)];
          bar(m, "steel", rail(s0), rail(s1));
        }
      }
      // the viewing platform at the top of the ramps
      const yp = Y_DRUM + 17.0;
      const ro = domeR(17.0) - 1.0;
      const ri = 8.8;
      for (let i = 0; i < RIBS; i++) {
        const a0 = ak(i);
        const a1 = ak(i + 1);
        const P = (r: number, a: number, y: number): Vec3 => [r * Math.cos(a), y, DZ + r * Math.sin(a)];
        bar(m, "steel", [P(ri, a0, yp - 0.35), P(ro, a0, yp - 0.35), P(ro, a0, yp), P(ri, a0, yp)], [P(ri, a1, yp - 0.35), P(ro, a1, yp - 0.35), P(ro, a1, yp), P(ri, a1, yp)]);
      }
    });
    m.scope("mirror cone", () => {
      const ring = (r: number, twist: number): Ring => ngon(24, r, twist, 0, DZ);
      const bandsY = [0, 2.5, 5.0, 7.5, 10.0, 12.5, 14.8];
      const rr = (h: number): number => 1.4 + (7.6 - 1.4) * (h / 14.8) ** 1.3;
      for (let j = 0; j + 1 < bandsY.length; j++) {
        const h0 = bandsY[j]!;
        const h1 = bandsY[j + 1]!;
        m.loft("mirror", ring(rr(h0), 0), Y_DRUM + h0, ring(rr(h1), 0), Y_DRUM + h1, j + 2 === bandsY.length);
      }
    });
  });
}

/** A LOD block: walls and top, no underside (it stands on the ground or on another block). */
function blk(m: MeshBuilder, mat: string, x: number, z: number, w: number, d: number, y0: number, y1: number): void {
  m.prism(mat, rect(w, d, x, z), y0, y1, true);
}

// --- the model ---------------------------------------------------------------------

export function reichstag(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  body(m);
  westFront(m);
  eastFront(m);
  shortFronts(m);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) tower(m, sx, sz);
  portico(m);
  dome(m);
  return m;
}

export function reichstagLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  // the body: the rusticated base and the main storeys as bands, the roof terrace
  blk(m, "stoneShade", 0, (ZE + ZW) / 2, 2 * XS, ZW - ZE, 0, Y_BASE);
  m.prism("stone", rect(2 * XS, ZW - ZE, 0, (ZE + ZW) / 2), Y_BASE, Y_CORNICE, false);
  m.prism("stoneLight", rect(2 * XS + 0.6, ZW - ZE + 0.6, 0, (ZE + ZW) / 2), Y_CORNICE, Y_ROOF + 1.2, false);
  m.cap("roof", rect(2 * XS + 0.6, ZW - ZE + 0.6, 0, (ZE + ZW) / 2), Y_ROOF + 1.2);
  // the four corner towers with their upper stages and crowns
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const [z0, z1] = sz > 0 ? TZW : TZE;
      const cx = sx * (TX0 + TX1) / 2;
      const cz = (z0 + z1) / 2;
      blk(m, "stone", cx, cz, TX1 - TX0, z1 - z0, 0, Y_TOWER);
      blk(m, "stone", cx, cz, TX1 - TX0 - 2.8, z1 - z0 - 2.8, Y_TOWER, Y_STAGE + 0.8);
      blk(m, "stoneLight", cx, cz, TX1 - TX0 - 7.2, z1 - z0 - 7.2, Y_STAGE + 0.8, Y_STAGE + 3.2);
    }
  }
  // the projections of the east and short fronts
  blk(m, "stone", 0, ZE - 1, 40, 2.0, 0, Y_ATTIC2);
  for (const s of [-1, 1]) blk(m, "stone", s * 67.25, -6.75, 1.5, 15, 0, Y_ATTIC2);
  // the west portico: podium and stair, the columns' block, the piers and the pediment
  blk(m, "stoneShade", 0, (ZP + Z_STAIR) / 2, 44.4, Z_STAIR - ZP, 0, Y_PODIUM);
  const ze = Z_STAIR + STEPS * STEP_RUN;
  m.sweep("stone", "x", [[Z_STAIR, 0], [ze, 0], [Z_STAIR, Y_PODIUM]], -21, [[Z_STAIR, 0], [ze, 0], [Z_STAIR, Y_PODIUM]], 21);
  blk(m, "bronze", 0, ZP - 0.25, 2 * PIER_X0, 0.5, Y_PODIUM, Y_ORDER);
  for (const x of [-12.2, 0, 12.2]) blk(m, "stone", x, ZC, 1.6, 1.6, Y_PODIUM, Y_ORDER);
  blk(m, "stoneLight", 0, (ZP + ZF) / 2, 2 * PIER_X0, ZF - ZP, Y_ORDER, Y_PED);
  for (const s of [-1, 1]) {
    blk(m, "stone", s * (PIER_X0 + PIER_X1) / 2, (ZP + ZF) / 2, PIER_X1 - PIER_X0, ZF - ZP, Y_PODIUM, 35.6);
    blk(m, "stone", s * (PIER_X0 + PIER_X1) / 2, (ZP + ZF) / 2, 2.4, 2.4, 35.6, 41.4);
  }
  const sec: Ring = [[-PIER_X0, Y_PED], [PIER_X0, Y_PED], [0, Y_APEX]];
  m.sweep("stone", "z", sec, 28.0, sec, ZF);
  // the dome as a steel shell, no glass
  const prof = [0, 0.35, 0.7, 1.0, T_TOP];
  for (let j = 0; j + 1 < prof.length; j++) {
    const t0 = prof[j]!;
    const t1 = prof[j + 1]!;
    m.loft("steel", ngon(16, D_R * Math.cos(t0), 0, 0, DZ), Y_DRUM + D_H * Math.sin(t0), ngon(16, D_R * Math.cos(t1), 0, 0, DZ), Y_DRUM + D_H * Math.sin(t1), j + 2 === prof.length);
  }
  return m;
}

export const REICHSTAG: ProceduralDesign[] = [
  {
    id: "bld-reichstag",
    game: { plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" } },
    title: "Reichstag",
    build: reichstag,
    buildLod: reichstagLod,
    references: "reichstag",
    catalog: PLAZA_CATALOG,
  },
];
