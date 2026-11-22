// The Belfry of Bruges (Belfort) and its market halls (Hallen) on the Markt: the
// 83 m tower of the 13th century, its square lower part in weathered yellow-brown
// brick with corner turrets, pointed windows, blind arcades, a machicolated gallery
// and the clock faces, crowned since 1482-86 by the white stone octagon with its
// tall belfry openings, corner pinnacles and crenellated parapet; and the halls
// behind it, a brick building round an inner courtyard with a crenellated parapet,
// two storeys of pointed windows and dark slate roofs. The gate passage under the
// tower leads from the Markt into the courtyard. A plaza landmark
// (docs/models/plaza-landmarks.md).
//
// Real dimensions: the tower is 83 m high; the halls measure about 44 x 84 m. Here
// the halls keep their 44 m Markt front but are shortened to 50 m deep (the
// courtyard 26 x 26 m). The tower's square part rises to about 53 m (a 15 m
// square shaft, the gallery at 32-38 m, a 13 m square upper stage with the lower
// clock), the octagon (10.6 m across the flats) to 78 m, its pinnacles to 83 m. The
// tower's lean (about 87 cm to the east) is not modelled.
//
// Modelled in metres, +Y up, base at y = 0, centred on the halls' footprint. The
// Markt lies to the south, +Z: the tower's front, its gate and the halls' front face
// it. The tower stands in the middle of the front wing (x = 0).
//
// Sources: the photographs in assets/belfry-of-bruges/ (SOURCES.md) and the
// Wikipedia article "Belfry of Bruges"; proportions measured from the photographs,
// simplified. Deterministic: the same code gives the same bytes. The id is stored in
// the game's saved maps, so it is never renamed once shipped.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox, lodLoft } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  brick: { color: "#a06a44", roughness: 0.92 },
  towerBrick: { color: "#8f7a5e", roughness: 0.95 },
  brickDark: { color: "#6e4a33", roughness: 0.9 },
  stone: { color: "#ddd5c1", roughness: 0.85 },
  stoneGrey: { color: "#a69c88", roughness: 0.9 },
  slate: { color: "#3b3e45", metallic: 0.1, roughness: 0.75 },
  windowGlass: { color: "#262a30", metallic: 0.2, roughness: 0.3 },
  clockFace: { color: "#1d2735", roughness: 0.6 },
  gilt: { color: "#cda349", metallic: 0.6, roughness: 0.4 },
  wood: { color: "#4a3122", roughness: 0.85 },
};

// --- vector helpers --------------------------------------------------------------

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

/** A straight bar from a to b, w wide and h deep across it; `up` turns its h side. */
function beam(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, w: number, h: number, up: Vec3 = [0, 1, 0]): void {
  const d = unit(sub(b, a));
  let v = sub(up, mul(d, dot(up, d)));
  if (Math.hypot(v[0], v[1], v[2]) < 1e-6) v = Math.abs(d[0]) < 0.9 ? [1, 0, 0] : [0, 0, 1];
  v = unit(sub(v, mul(d, dot(v, d))));
  const u = cross(d, v);
  const c = (su: number, sv: number): Vec3 => add(a, add(mul(u, (su * w) / 2), mul(v, (sv * h) / 2)));
  m.slab(mat, [c(-1, -1), c(1, -1), c(1, 1), c(-1, 1)], sub(b, a));
}

/** A box spanning x0..x1, y0..y1, z0..z1; no underside unless `bottom`. */
function span(m: MeshBuilder, mat: string, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, top = true, bottom = false): void {
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  if (bottom) m.cap(mat, r, y0, false);
}

// --- facade frames -----------------------------------------------------------------

/**
 * A vertical wall plane: a point (ox, oz) on it, the horizontal axis u along it and
 * the outward normal n. A facade point is (u along, y up, d out of the wall).
 */
interface Face { ox: number; oz: number; ux: number; uz: number; nx: number; nz: number }
/** The wall z = z facing +Z (s = 1) or -Z; u is world x. */
const faceZ = (z: number, s: number): Face => ({ ox: 0, oz: z, ux: 1, uz: 0, nx: 0, nz: s });
/** The wall x = x facing +X (s = 1) or -X; u is world z. */
const faceX = (x: number, s: number): Face => ({ ox: x, oz: 0, ux: 0, uz: 1, nx: s, nz: 0 });
/** A wall facing (nx, nz) through (cx, cz) + n * dist; u = 0 on that point. */
const faceDir = (cx: number, cz: number, nx: number, nz: number, dist: number): Face => ({ ox: cx + nx * dist, oz: cz + nz * dist, ux: -nz, uz: nx, nx, nz });
const P = (f: Face, u: number, y: number, d: number): Vec3 => [f.ox + f.ux * u + f.nx * d, y, f.oz + f.uz * u + f.nz * d];

/** The extra burial depth of each material's hidden back face (see fpoly). */
const BURY: Record<string, number> = {
  brick: 0.01, towerBrick: 0.015, brickDark: 0.02, stone: 0.025, stoneGrey: 0.03, slate: 0.035,
  windowGlass: 0.04, clockFace: 0.045, gilt: 0.05, wood: 0.055,
};

/** A convex outline (u, y) on face f, d0..d1 out of the wall. */
function fpoly(m: MeshBuilder, mat: string, f: Face, pts: Array<[number, number]>, d0: number, d1: number): void {
  // faces buried in the wall keep a per-material depth, so two never share a plane
  if (d0 < 0) d0 -= BURY[mat] ?? 0;
  m.slab(mat, pts.map(([u, y]) => P(f, u, y, d0)), [f.nx * (d1 - d0), 0, f.nz * (d1 - d0)]);
}

function fbox(m: MeshBuilder, mat: string, f: Face, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number): void {
  fpoly(m, mat, f, [[u0, y0], [u1, y0], [u1, y1], [u0, y1]], d0, d1);
}

/** A single-sided wall quad on face f over u0..u1, y0..y1, looking along the face's normal. */
function wall(m: MeshBuilder, mat: string, f: Face, u0: number, u1: number, y0: number, y1: number): void {
  const a = P(f, u0, y0, 0);
  const b = P(f, u1, y0, 0);
  const c = P(f, u1, y1, 0);
  const d = P(f, u0, y1, 0);
  // u x up = (-uz, 0, ux): matches the normal or the quad is wound the other way
  if (-f.uz * f.nx + f.ux * f.nz > 0 === u1 > u0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/** The arc of an equilateral pointed arch over u0..u1 springing at ys: (u1, ys) up to the apex and down to (u0, ys). */
function pointedArc(u0: number, u1: number, ys: number, n: number): Array<[number, number]> {
  const w = u1 - u0;
  const pts: Array<[number, number]> = [];
  for (let k = 0; k <= n; k++) {
    const a = ((k / n) * Math.PI) / 3;
    pts.push([u0 + w * Math.cos(a), ys + w * Math.sin(a)]);
  }
  for (let k = 1; k <= n; k++) {
    const a = (2 * Math.PI) / 3 + ((k / n) * Math.PI) / 3;
    pts.push([u1 + w * Math.cos(a), ys + w * Math.sin(a)]);
  }
  return pts;
}

/** A lancet (pointed) outline: the sill from u0 to u1, the jambs up to ys and the arch. */
const lancet = (u0: number, u1: number, y0: number, ys: number, n = 3): Array<[number, number]> => [[u0, y0], [u1, y0], ...pointedArc(u0, u1, ys, n)];

/** The band between two arcs of the same point count: voussoirs, each a convex quad. */
function arcBand(m: MeshBuilder, mat: string, f: Face, inner: Array<[number, number]>, outer: Array<[number, number]>, d0: number, d1: number): void {
  for (let i = 0; i + 1 < inner.length; i++) fpoly(m, mat, f, [inner[i]!, inner[i + 1]!, outer[i + 1]!, outer[i]!], d0, d1);
}

/** The wall over a pointed arch up to yTop: vertical strips from the arc to the top line. */
function spandrel(m: MeshBuilder, mat: string, f: Face, arc: Array<[number, number]>, yTop: number, d0: number, d1: number): void {
  for (let i = 0; i + 1 < arc.length; i++) {
    const a = arc[i]!;
    const b = arc[i + 1]!;
    fpoly(m, mat, f, [a, b, [b[0], yTop], [a[0], yTop]], d0, d1);
  }
}

/** A Gothic window: the dark pane, a stone hood round the arch, the jambs, a sill and a mullion. */
function gothicWindow(m: MeshBuilder, f: Face, uc: number, y0: number, ys: number, w: number, mat = "stone", mullion = true): void {
  const u0 = uc - w / 2;
  const u1 = uc + w / 2;
  fpoly(m, "windowGlass", f, lancet(u0, u1, y0, ys, 3), -0.05, 0.04);
  arcBand(m, mat, f, pointedArc(u0, u1, ys, 3), pointedArc(u0 - 0.18, u1 + 0.18, ys, 3), -0.05, 0.15);
  fbox(m, mat, f, u0 - 0.18, u0, y0, ys + 0.01, -0.05, 0.15);
  fbox(m, mat, f, u1, u1 + 0.18, y0, ys + 0.01, -0.05, 0.15);
  fbox(m, mat, f, u0 - 0.24, u1 + 0.24, y0 - 0.16, y0, -0.05, 0.22);
  if (mullion) fbox(m, mat, f, uc - 0.06, uc + 0.06, y0 + 0.02, ys + w * 0.5, -0.05, 0.1);
}

/** A plain pointed pane with a sill: the courtyard and small windows. */
function plainLancet(m: MeshBuilder, f: Face, uc: number, y0: number, ys: number, w: number, sill = "stone"): void {
  fpoly(m, "windowGlass", f, lancet(uc - w / 2, uc + w / 2, y0, ys, 2), -0.05, 0.05);
  fbox(m, sill, f, uc - w / 2 - 0.12, uc + w / 2 + 0.12, y0 - 0.14, y0, -0.05, 0.16);
}

/** A row of crenels: merlons w wide along a straight line a..b, y0..y1, t thick. */
function merlons(m: MeshBuilder, mat: string, a: [number, number], b: [number, number], y0: number, y1: number, w: number, t: number, n: number): void {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const ry = -Math.atan2(dz, dx);
  for (let k = 0; k < n; k++) {
    const s = (k + 0.5) / n;
    const cx = a[0] + dx * s;
    const cz = a[1] + dz * s;
    m.prism(mat, rect(Math.min(w, len / n - 0.1), t, cx, cz, ry), y0, y1);
  }
}

/** A clock: the dark dial, a gilt rim and hour marks, and the two gilt hands. */
function clock(m: MeshBuilder, f: Face, uc: number, yc: number, r: number, hour: number, minute: number): void {
  m.scope("clock", () => {
    const circ = (rr: number, n: number): Array<[number, number]> =>
      Array.from({ length: n }, (_, k): [number, number] => {
        const a = (k / n) * Math.PI * 2;
        return [uc + rr * Math.cos(a), yc + rr * Math.sin(a)];
      });
    fpoly(m, "clockFace", f, circ(r, 12), -0.05, 0.1);
    const inner = circ(r, 12);
    const outer = circ(r + 0.2, 12);
    arcBand(m, "gilt", f, [...inner, inner[0]!], [...outer, outer[0]!], -0.05, 0.16);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2;
      const u = uc + Math.cos(a) * r * 0.8;
      const y = yc + Math.sin(a) * r * 0.8;
      const s = 0.12;
      fbox(m, "gilt", f, u - s, u + s, y - s, y + s, 0.1, 0.13);
    }
    // the hands, clockwise from twelve on the face as seen from outside
    const hand = (turns: number, len: number, w: number, d: number): void => {
      const a = Math.PI / 2 - turns * Math.PI * 2;
      beam(m, "gilt", P(f, uc, yc, d), P(f, uc + Math.cos(a) * len, yc + Math.sin(a) * len, d), w, 0.04, [f.nx, 0, f.nz]);
    };
    hand(hour, r * 0.55, 0.16, 0.19);
    hand(minute, r * 0.85, 0.1, 0.24);
    fbox(m, "gilt", f, uc - 0.12, uc + 0.12, yc - 0.12, yc + 0.12, 0.1, 0.28);
  });
}

// --- the layout --------------------------------------------------------------------

/** The halls: outer walls x = +-HX, z = HZB..HZF; the courtyard x = +-CX, z = CZB..CZF. */
const HX = 22;
const HZF = 25;
const HZB = -25;
const CX = 13;
const CZF = 10;
const CZB = -16;
/** The halls' wall top (under the parapet and the roofs). */
const EAVE = 14;

/** The tower: a 15 m square shaft, its front 0.4 m proud of the halls' front. */
const TH = 7.5;
const TZ0 = 10.4;
const TZ1 = 25.4;
const TZC = (TZ0 + TZ1) / 2;
/** The gate passage: x = +-GW, its pointed arch springing at GS, its ceiling at GC. */
const GW = 2.6;
const GS = 3.6;
const GC = 8.3;
/** The levels of the tower. */
const SHAFT_TOP = 31.4;
const GAL0 = 32.4; // the gallery's floor line (top of the corbels)
const GAL1 = 37.0; // the gallery's roof, the foot of the upper stage
const GH = 8.4; // the gallery's half width
const UH = 6.5; // the upper square stage's half width
const UP_TOP = 52.6;
const CORN = 53.3; // the top of the cornice, the octagon's foot
const OA = 5.3; // the octagon's apothem
const OR = OA / Math.cos(Math.PI / 8);
const OCT_TOP = 77.4;
const CROWN = 78.2;

// --- the halls -------------------------------------------------------------------

/** The bays of the front, each side of the tower: their centres. */
const FRONT_BAYS = [9.85, 12.75, 15.65, 18.55];

function hallWalls(m: MeshBuilder): void {
  m.scope("walls", () => {
    const front = faceZ(HZF, 1);
    wall(m, "brick", front, -HX, -TH, 0, EAVE);
    wall(m, "brick", front, TH, HX, 0, EAVE);
    wall(m, "brick", faceX(HX, 1), HZB, HZF, 0, EAVE);
    wall(m, "brick", faceX(-HX, -1), HZB, HZF, 0, EAVE);
    wall(m, "brick", faceZ(HZB, -1), -HX, HX, 0, EAVE);
    // the courtyard walls look inward
    const cf = faceZ(CZF, -1);
    wall(m, "brick", cf, -CX, -GW, 0, EAVE);
    wall(m, "brick", cf, GW, CX, 0, EAVE);
    wall(m, "brick", cf, -GW, GW, GC, EAVE);
    wall(m, "brick", faceZ(CZB, 1), -CX, CX, 0, EAVE);
    wall(m, "brick", faceX(CX, -1), CZB, CZF, 0, EAVE);
    wall(m, "brick", faceX(-CX, 1), CZB, CZF, 0, EAVE);
  });
}

/** The corbel table and the crenellated parapet along a straight stretch of the outer wall. */
function parapetRun(m: MeshBuilder, f: Face, u0: number, u1: number): void {
  const a = P(f, u0, 0, -0.45);
  const b = P(f, u1, 0, 0.3);
  span(m, "brick", Math.min(a[0], b[0]), Math.max(a[0], b[0]), 13.7, 15.0, Math.min(a[2], b[2]), Math.max(a[2], b[2]), true, true);
  const n = Math.max(1, Math.round((u1 - u0) / 1.6));
  const c0 = P(f, u0, 0, -0.08);
  const c1 = P(f, u1, 0, -0.08);
  merlons(m, "brick", [c0[0], c0[2]], [c1[0], c1[2]], 15.0, 16.0, 0.8, 0.6, n);
  // the little corbels under it
  const k = Math.max(1, Math.round((u1 - u0) / 0.9));
  for (let i = 0; i < k; i++) {
    const u = u0 + ((u1 - u0) * (i + 0.5)) / k;
    fpoly(m, "brickDark", f, [[u - 0.18, 13.7], [u + 0.18, 13.7], [u, 13.15]], 0, 0.28);
  }
}

function hallParapets(m: MeshBuilder): void {
  m.scope("parapets", () => {
    const front = faceZ(HZF, 1);
    parapetRun(m, front, -20.0, -8.4);
    parapetRun(m, front, 8.4, 20.0);
    parapetRun(m, faceX(HX, 1), HZB + 0.3, 23.0);
    parapetRun(m, faceX(-HX, -1), HZB + 0.3, 23.0);
    parapetRun(m, faceZ(HZB, -1), -HX + 0.3, HX - 0.3);
  });
  m.scope("corner turrets", () => {
    // the square turrets at the front corners, crenellated, and small ones at the back
    for (const s of [-1, 1]) {
      const x0 = s > 0 ? 20.0 : -22.6;
      const x1 = s > 0 ? 22.6 : -20.0;
      span(m, "brick", x0, x1, 0, 17.0, 23.0, 25.6);
      const pts: Array<[[number, number], [number, number]]> = [
        [[x0 + 0.2, 25.4], [x1 - 0.2, 25.4]], [[x0 + 0.2, 23.2], [x1 - 0.2, 23.2]],
        [[x0 + 0.2, 23.6], [x0 + 0.2, 25.0]], [[x1 - 0.2, 23.6], [x1 - 0.2, 25.0]],
      ];
      for (const [a, b] of pts) merlons(m, "brick", a, b, 17.0, 17.9, 0.6, 0.4, 2);
      const f = faceZ(25.6, 1);
      fbox(m, "stone", f, x0 - 0.05, x1 + 0.05, 5.3, 5.55, -0.05, 0.12);
      fbox(m, "stone", f, x0 - 0.05, x1 + 0.05, 10.7, 10.95, -0.05, 0.12);
      plainLancet(m, f, (x0 + x1) / 2, 6.6, 9.3, 0.8);
      plainLancet(m, f, (x0 + x1) / 2, 12.0, 14.6, 0.7);
      fpoly(m, "brickDark", f, [[x0 + 0.3, 15.6], [x1 - 0.3, 15.6], [x1 - 0.3, 16.6], [(x0 + x1) / 2, 16.9], [x0 + 0.3, 16.6]], 0, 0.06);
      // the back corners
      const bz0 = HZB - 0.6;
      span(m, "brick", s > 0 ? 20.4 : -22.6, s > 0 ? 22.6 : -20.4, 0, 16.4, bz0, bz0 + 2.2);
      m.spire("slate", rect(2.4, 2.4, s * 21.5, bz0 + 1.1), 16.4, 20.2);
    }
  });
}

function hallFront(m: MeshBuilder): void {
  m.scope("front", () => {
    const f = faceZ(HZF, 1);
    for (const s of [-1, 1]) {
      for (const b of FRONT_BAYS) {
        const u = s * b;
        // the shop arches of the ground floor
        fpoly(m, "windowGlass", f, lancet(u - 1.05, u + 1.05, 0.02, 2.9, 3), -0.05, 0.03);
        arcBand(m, "brickDark", f, pointedArc(u - 1.05, u + 1.05, 2.9, 3), pointedArc(u - 1.3, u + 1.3, 2.9, 3), -0.05, 0.12);
        fbox(m, "wood", f, u - 0.95, u + 0.95, 0.02, 2.4, 0.03, 0.08);
        // the tall two-light windows of the upper hall and the small ones over them
        gothicWindow(m, f, u, 6.4, 9.3, 1.5);
        plainLancet(m, f, u, 11.4, 12.5, 0.9);
      }
      for (const [y0, y1] of [[5.3, 5.55], [10.75, 11.0]]) {
        fbox(m, "stone", f, s > 0 ? 8.42 : -20.0, s > 0 ? 20.0 : -8.42, y0, y1, -0.05, 0.12);
      }
      // the buttresses between the bays
      for (const b of [8.4, 11.3, 14.2, 17.1]) {
        if (b === 8.4) continue;
        const u = s * b;
        fbox(m, "brick", f, u - 0.25, u + 0.25, 0, 13.4, -0.05, 0.35);
      }
    }
  });
}

/** Windows along one long side (u along the face) and the back. */
function hallSidesAndBack(m: MeshBuilder): void {
  m.scope("sides", () => {
    for (const s of [-1, 1]) {
      const f = faceX(s * HX, s);
      for (let k = 0; k < 10; k++) {
        const z = -21.6 + k * 4.4;
        gothicWindow(m, f, z, 6.4, 9.6, 1.4, "stone", true);
        plainLancet(m, f, z, 1.8, 3.6, 1.0);
        if (k < 9) fbox(m, "brick", f, z + 2.0, z + 2.4, 0, 13.4, -0.05, 0.3);
      }
      fbox(m, "stone", f, HZB + 0.2, 22.9, 5.3, 5.55, -0.05, 0.12);
    }
  });
  m.scope("back", () => {
    const f = faceZ(HZB, -1);
    for (let k = 0; k < 9; k++) {
      const x = -17.6 + k * 4.4;
      gothicWindow(m, f, x, 6.4, 9.6, 1.4, "stone", true);
      plainLancet(m, f, x, 1.8, 3.6, 1.0);
    }
    fbox(m, "stone", f, -20.3, 20.3, 5.3, 5.55, -0.05, 0.12);
  });
  m.scope("courtyard", () => {
    const sides: Array<[Face, number[]]> = [
      [faceZ(CZB, 1), [-9.6, -4.8, 0, 4.8, 9.6]],
      [faceX(CX, -1), [-12.4, -7.6, -2.8, 2.0, 6.8]],
      [faceX(-CX, 1), [-12.4, -7.6, -2.8, 2.0, 6.8]],
      [faceZ(CZF, -1), [-10.2, -5.6, 5.6, 10.2]],
    ];
    for (const [f, us] of sides) {
      for (const u of us) {
        plainLancet(m, f, u, 6.6, 9.4, 1.2);
        plainLancet(m, f, u, 1.6, 3.4, 1.0);
      }
    }
  });
}

function hallRoofs(m: MeshBuilder): void {
  m.scope("roofs", () => {
    // the front wing: one long roof hipped at both ends, the tower rising through it
    m.loft("slate", rect(43.2, 15.2, 0, 17.0), EAVE, rect(35.2, 0.3, 0, 17.0), 23.0);
    // the side wings: ridges along Z, running into the front roof
    for (const s of [-1, 1]) {
      const xo = s * 21.5;
      const xi = s * 12.4;
      const xr = s * 17.5;
      const za = -24.6;
      const zb = 14.6;
      m.slab("slate", [[xo, EAVE, za], [xo, EAVE, zb], [xr, 20, zb], [xr, 20, za]], [0, -0.22, 0]);
      m.slab("slate", [[xi, EAVE, za], [xi, EAVE, zb], [xr, 20, zb], [xr, 20, za]], [0, -0.22, 0]);
      // the stepped gable over the back wall
      const g = faceZ(za + 0.02, -1);
      const steps: Array<[number, number, number]> = [[4.6, EAVE, 15.6], [3.5, 15.6, 17.0], [2.4, 17.0, 18.4], [1.3, 18.4, 19.8], [0.45, 19.8, 21.0]];
      for (const [hw, y0, y1] of steps) fbox(m, "brick", g, xr - hw, xr + hw, y0, y1, -0.4, 0);
    }
    // the back wing: ridge along X between the side roofs
    const xa = -17.5;
    const xb = 17.5;
    m.slab("slate", [[xa, EAVE, -24.6], [xb, EAVE, -24.6], [xb, 20, -20.5], [xa, 20, -20.5]], [0, -0.22, 0]);
    m.slab("slate", [[xa, EAVE, -15.4], [xb, EAVE, -15.4], [xb, 20, -20.5], [xa, 20, -20.5]], [0, -0.22, 0]);
    // dormers on the front roof, each side of the tower
    for (const s of [-1, 1]) {
      for (const x of [11.5, 16.0]) {
        const xc = s * x;
        const zf = 21.2;
        const y0 = 17.3;
        span(m, "slate", xc - 0.7, xc + 0.7, y0 - 1.2, y0 + 1.4, zf - 2.4, zf);
        fbox(m, "windowGlass", faceZ(zf, 1), xc - 0.4, xc + 0.4, y0, y0 + 1.1, -0.05, 0.05);
      }
    }
  });
}

/** The gate passage under the tower, through the front wing into the courtyard. */
function gatePassage(m: MeshBuilder): void {
  m.scope("gate passage", () => {
    wall(m, "stone", faceX(-GW, 1), CZF, TZ1, 0, GC);
    wall(m, "stone", faceX(GW, -1), CZF, TZ1, 0, GC);
    m.cap("stone", rect(2 * GW, TZ1 - CZF, 0, (CZF + TZ1) / 2), GC, false);
    for (const [f, d, mat] of [[faceZ(TZ1, 1), 0.9, "towerBrick"], [faceZ(CZF, -1), 0.6, "brick"]] as Array<[Face, number, string]>) {
      const arc = pointedArc(-GW, GW, GS, 4);
      // the apex stays below the ceiling: trim the arc's top to GC - 0.05
      const yTop = GC;
      const clipped = arc.map(([u, y]): [number, number] => [u, Math.min(y, yTop - 0.05)]);
      spandrel(m, mat, f, clipped, yTop, -d, 0);
      arcBand(m, "stone", f, pointedArc(-GW - 0.06, GW + 0.06, GS, 4), pointedArc(-GW - 0.46, GW + 0.46, GS, 4).map(([u, y]): [number, number] => [u, Math.min(y, yTop + 0.35)]), -0.05, 0.2);
      fbox(m, "stone", f, -GW - 0.46, -GW - 0.06, 0, GS + 0.01, -0.05, 0.2);
      fbox(m, "stone", f, GW + 0.06, GW + 0.46, 0, GS + 0.01, -0.05, 0.2);
    }
    // the open gate leaves folded back against the passage walls
    for (const s of [-1, 1]) {
      span(m, "wood", s > 0 ? GW - 0.18 : -GW, s > 0 ? GW : -GW + 0.18, 0, 5.2, TZ1 - 3.6, TZ1 - 1.0);
    }
  });
}

// --- the tower -----------------------------------------------------------------------

/** The square shaft up to the gallery: front from the ground, the rest above the roofs. */
function towerShaft(m: MeshBuilder): void {
  m.scope("shaft", () => {
    const F = faceZ(TZ1, 1);
    wall(m, "towerBrick", F, -TH, -GW, 0, GC);
    wall(m, "towerBrick", F, GW, TH, 0, GC);
    wall(m, "towerBrick", F, -TH, TH, GC, SHAFT_TOP);
    wall(m, "towerBrick", faceX(TH, 1), TZ0, TZ1, EAVE, SHAFT_TOP);
    wall(m, "towerBrick", faceX(-TH, -1), TZ0, TZ1, EAVE, SHAFT_TOP);
    wall(m, "towerBrick", faceZ(TZ0, -1), -TH, TH, EAVE, SHAFT_TOP);
  });
  m.scope("shaft turrets", () => {
    // octagonal corner turrets: the front ones from the ground, the back ones above the roof
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * TH;
      const cz = sz > 0 ? TZ1 : TZ0;
      const y0 = sz > 0 ? 0 : 15.5;
      const oct = (r: number): Ring => ngon(8, r, Math.PI / 8, cx, cz);
      m.prism("towerBrick", oct(0.85), y0, SHAFT_TOP - 0.4, false);
      for (const y of [8.6, 14.6, 21.0, 27.0]) if (y > y0) m.prism("stoneGrey", oct(0.95), y, y + 0.3);
    }
  });
  m.scope("shaft front", () => {
    const F = faceZ(TZ1, 1);
    // the niche with the Virgin over the gate
    fbox(m, "stone", F, -1.3, 1.3, 9.0, 9.3, -0.05, 0.45);
    fpoly(m, "windowGlass", F, lancet(-0.85, 0.85, 9.3, 11.6, 3), -0.05, 0.04);
    arcBand(m, "stone", F, pointedArc(-0.85, 0.85, 11.6, 3), pointedArc(-1.1, 1.1, 11.6, 3), -0.05, 0.25);
    m.loft("stone", ngon(6, 0.28, 0, 0, TZ1 + 0.25), 9.3, ngon(6, 0.18, 0, 0, TZ1 + 0.25), 10.8);
    m.prism("gilt", ngon(6, 0.13, 0, 0, TZ1 + 0.25), 10.8, 11.1);
    // the windows of the stair and the treasury
    gothicWindow(m, F, -2.4, 15.6, 17.8, 1.1, "stone", false);
    gothicWindow(m, F, 2.4, 15.6, 17.8, 1.1, "stone", false);
    // the balcony window (the proclamation window)
    gothicWindow(m, F, 0, 19.6, 22.2, 1.6);
    fbox(m, "stone", F, -1.6, 1.6, 19.0, 19.35, -0.05, 0.9);
    for (let k = 0; k <= 6; k++) {
      const u = -1.5 + k * 0.5;
      span(m, "stone", u - 0.05, u + 0.05, 19.35, 20.2, TZ1 + 0.75, TZ1 + 0.85, false);
    }
    span(m, "stone", -1.6, 1.6, 20.2, 20.35, TZ1 + 0.7, TZ1 + 0.9);
    for (const y of [14.4, 18.6, 24.0]) fbox(m, "stoneGrey", F, -TH + 0.9, TH - 0.9, y, y + 0.25, -0.05, 0.12);
  });
  m.scope("blind arcades", () => {
    // a band of tall blind lancets on every face, the middle two pierced
    const faces: Array<[Face, number]> = [[faceZ(TZ1, 1), 0], [faceX(TH, 1), TZC], [faceX(-TH, -1), TZC], [faceZ(TZ0, -1), 0]];
    for (const [f, c] of faces) {
      for (let k = 0; k < 6; k++) {
        const u = c - 5.0 + k * 2.0;
        const w = 1.3;
        const open = k === 2 || k === 3;
        fpoly(m, open ? "windowGlass" : "brickDark", f, lancet(u - w / 2, u + w / 2, 24.6, 28.6, 2), -0.05, open ? 0.02 : 0.03);
        arcBand(m, "stoneGrey", f, pointedArc(u - w / 2, u + w / 2, 28.6, 2), pointedArc(u - w / 2 - 0.15, u + w / 2 + 0.15, 28.6, 2), -0.05, 0.12);
      }
      if (f.nz <= 0 || f.nx !== 0) gothicWindow(m, f, c, 17.4, 20.6, 1.2, "stoneGrey", false);
    }
  });
}

/** The machicolated gallery at 32-38 m with its corner turrets. */
function towerGallery(m: MeshBuilder): void {
  m.scope("gallery", () => {
    // the corbel table carrying it
    m.loft("stoneGrey", rect(2 * TH, 2 * TH, 0, TZC), SHAFT_TOP, rect(2 * GH, 2 * GH, 0, TZC), GAL0, false);
    m.prism("towerBrick", rect(2 * GH, 2 * GH, 0, TZC), GAL0, GAL1);
    const faces: Array<[Face, number]> = [[faceZ(TZC + GH, 1), 0], [faceZ(TZC - GH, -1), 0], [faceX(GH, 1), TZC], [faceX(-GH, -1), TZC]];
    for (const [f, c] of faces) {
      // the arcade of round-shouldered openings
      for (let k = 0; k < 7; k++) {
        const u = c - 5.4 + k * 1.8;
        fpoly(m, "windowGlass", f, lancet(u - 0.5, u + 0.5, 33.2, 35.6, 2), -0.05, 0.03);
        arcBand(m, "stoneGrey", f, pointedArc(u - 0.5, u + 0.5, 35.6, 2), pointedArc(u - 0.62, u + 0.62, 35.6, 2), -0.05, 0.1);
      }
      fbox(m, "stoneGrey", f, c - GH + 0.6, c + GH - 0.6, 32.6, 32.85, -0.05, 0.14);
      // the corbels under the gallery
      for (let k = 0; k < 13; k++) {
        const u = c - 6.6 + k * 1.1;
        fpoly(m, "stoneGrey", f, [[u - 0.2, GAL0], [u + 0.2, GAL0], [u, GAL0 - 0.9]], 0, 0.22);
      }
    }
    // the crenellated parapet round the gallery's roof
    const e = GH - 0.25;
    const lines: Array<[[number, number], [number, number]]> = [
      [[-e, TZC + e], [e, TZC + e]], [[-e, TZC - e], [e, TZC - e]], [[e, TZC - e + 0.5], [e, TZC + e - 0.5]], [[-e, TZC - e + 0.5], [-e, TZC + e - 0.5]],
    ];
    for (const [a, b] of lines) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      m.prism("towerBrick", rect(a[1] === b[1] ? len + 0.5 : 0.5, a[1] === b[1] ? 0.5 : len, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), GAL1, GAL1 + 0.8);
      merlons(m, "towerBrick", a, b, GAL1 + 0.8, GAL1 + 1.7, 0.7, 0.5, 7);
    }
  });
  m.scope("gallery turrets", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * GH;
      const cz = TZC + sz * GH;
      const oct = (r: number): Ring => ngon(8, r, Math.PI / 8, cx, cz);
      m.loft("stoneGrey", oct(0.4), 29.6, oct(1.1), GAL0, false);
      m.prism("towerBrick", oct(1.1), GAL0, 39.4, false);
      m.prism("stoneGrey", oct(1.22), 39.4, 39.7);
      m.spire("towerBrick", oct(1.05), 39.7, 43.2);
      m.prism("stoneGrey", oct(0.12), 43.0, 43.6);
    }
  });
}

/** The upper square stage: corner buttresses, the lower clocks, the paired lancets, the balustrade and the great pinnacles. */
function towerUpperSquare(m: MeshBuilder): void {
  m.scope("upper square", () => {
    m.prism("towerBrick", rect(2 * UH, 2 * UH, 0, TZC), GAL1, UP_TOP, false);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (UH - 0.15);
      const cz = TZC + sz * (UH - 0.15);
      span(m, "towerBrick", cx - 0.6, cx + 0.6, GAL1, UP_TOP, cz - 0.6, cz + 0.6, false);
    }
    const faces: Array<[Face, number]> = [[faceZ(TZC + UH, 1), 0], [faceZ(TZC - UH, -1), 0], [faceX(UH, 1), TZC], [faceX(-UH, -1), TZC]];
    for (const [f, c] of faces) {
      clock(m, f, c, 41.0, 1.45, 0.29, 0.83);
      for (const s of [-1, 1]) {
        const u = c + s * 1.9;
        gothicWindow(m, f, u, 44.2, 49.6, 1.55, "stoneGrey");
        fbox(m, "brickDark", f, u - 0.7, u + 0.7, 45.0, 48.6, 0.04, 0.07);
      }
      fbox(m, "stoneGrey", f, c - UH + 0.7, c + UH - 0.7, 43.4, 43.65, -0.05, 0.12);
      // the little blind arcade under the cornice
      for (let k = 0; k < 8; k++) {
        const u = c - 4.55 + k * 1.3;
        fpoly(m, "brickDark", f, lancet(u - 0.45, u + 0.45, 51.0, 51.8, 2), -0.05, 0.03);
      }
    }
    // the cornice and the openwork balustrade
    span(m, "stone", -UH - 0.5, UH + 0.5, UP_TOP, CORN, TZC - UH - 0.5, TZC + UH + 0.5, true, true);
    const e = UH + 0.3;
    for (const [a, b] of [[[-e, TZC + e], [e, TZC + e]], [[-e, TZC - e], [e, TZC - e]], [[e, TZC - e], [e, TZC + e]], [[-e, TZC - e], [-e, TZC + e]]] as Array<[[number, number], [number, number]]>) {
      merlons(m, "stone", a, b, CORN, CORN + 0.9, 0.14, 0.14, 16);
      const along = a[1] === b[1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.2;
      m.prism("stone", rect(along ? len : 0.24, along ? 0.24 : len, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2), CORN + 0.9, CORN + 1.1);
    }
  });
  m.scope("great pinnacles", () => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const cx = sx * (UH + 0.1);
      const cz = TZC + sz * (UH + 0.1);
      const sq = (w: number): Ring => rect(w, w, cx, cz, Math.PI / 4);
      m.prism("stone", sq(1.4), CORN, 58.2, false);
      m.prism("stone", sq(1.6), 58.2, 58.5);
      m.spire("stone", sq(1.3), 58.5, 65.0);
      // the four small pinnacles round its foot
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as Array<[number, number]>) {
        const px = cx + dx * 0.95;
        const pz = cz + dz * 0.95;
        m.prism("stone", rect(0.36, 0.36, px, pz), CORN, 57.0, false);
        m.spire("stone", rect(0.36, 0.36, px, pz), 57.0, 59.4);
      }
      // the flying arm to the octagon
      const ox = sx * OA * 0.72;
      const oz = TZC + sz * OA * 0.72;
      beam(m, "stone", [cx, 59.6, cz], [ox, 62.6, oz], 0.45, 0.7);
    }
  });
}

/** The white stone octagon of 1482-86: openings, clocks, corner piers and the crown. */
function towerOctagon(m: MeshBuilder): void {
  m.scope("octagon", () => {
    m.prism("stone", ngon(8, OR, Math.PI / 8, 0, TZC), CORN, OCT_TOP, false);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const nx = Math.cos(a);
      const nz = Math.sin(a);
      const f = faceDir(0, TZC, nx, nz, OA);
      const cardinal = i % 2 === 0;
      // the tall belfry openings, two lights under one hood
      for (const s of [-1, 1]) fpoly(m, "windowGlass", f, lancet(s * 0.62 - 0.48, s * 0.62 + 0.48, 66.2, 73.6, 2), -0.05, 0.03);
      arcBand(m, "stone", f, pointedArc(-1.2, 1.2, 73.4, 3), pointedArc(-1.45, 1.45, 73.4, 3), -0.05, 0.16);
      fbox(m, "stone", f, -1.45, -1.2, 66.0, 73.41, -0.05, 0.16);
      fbox(m, "stone", f, 1.2, 1.45, 66.0, 73.41, -0.05, 0.16);
      fbox(m, "stone", f, -0.14, 0.14, 66.0, 74.4, -0.05, 0.12);
      fbox(m, "stone", f, -1.55, 1.55, 65.75, 66.05, -0.05, 0.24);
      if (cardinal) {
        clock(m, f, 0, 61.9, 1.5, 0.21, 0.66);
        for (const s of [-1, 1]) fpoly(m, "windowGlass", f, lancet(s * 0.55 - 0.32, s * 0.55 + 0.32, 55.6, 58.0, 2), -0.05, 0.03);
      } else {
        for (const s of [-1, 1]) {
          fpoly(m, "stoneGrey", f, lancet(s * 0.6 - 0.42, s * 0.6 + 0.42, 55.8, 63.0, 2), -0.05, 0.03);
          arcBand(m, "stone", f, pointedArc(s * 0.6 - 0.42, s * 0.6 + 0.42, 63.0, 2), pointedArc(s * 0.6 - 0.54, s * 0.6 + 0.54, 63.0, 2), -0.05, 0.1);
        }
      }
      fbox(m, "stone", f, -1.7, 1.7, 64.6, 64.85, -0.05, 0.14);
    }
  });
  m.scope("octagon piers", () => {
    // the corner piers running up into the crown's pinnacles
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
      const px = Math.cos(a) * (OR + 0.05);
      const pz = TZC + Math.sin(a) * (OR + 0.05);
      const sq: Ring = rect(0.62, 0.62, px, pz, -a + Math.PI / 4);
      m.prism("stone", sq, CORN, 79.9, false);
      m.prism("stone", rect(0.78, 0.78, px, pz, -a + Math.PI / 4), 79.9, 80.2);
      m.spire("stone", sq, 80.2, 83.0);
      m.prism("stone", rect(0.74, 0.74, px, pz, -a + Math.PI / 4), 64.6, 64.9);
    }
  });
  m.scope("crown", () => {
    // the corbelled cornice and the crenellated parapet
    m.loft("stone", ngon(8, OR, Math.PI / 8, 0, TZC), OCT_TOP, ngon(8, OR + 0.6, Math.PI / 8, 0, TZC), CROWN, false);
    m.prism("stone", ngon(8, OR + 0.6, Math.PI / 8, 0, TZC), CROWN, 79.0, false);
    m.prism("stone", [...ngon(8, OR + 0.15, Math.PI / 8, 0, TZC)].reverse() as Ring, CROWN, 79.0, false);
    const outer = ngon(8, OR + 0.6, Math.PI / 8, 0, TZC);
    const inner = ngon(8, OR + 0.15, Math.PI / 8, 0, TZC);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      m.quad("stone", [outer[i]![0], 79.0, outer[i]![1]], [inner[i]![0], 79.0, inner[i]![1]], [inner[j]![0], 79.0, inner[j]![1]], [outer[j]![0], 79.0, outer[j]![1]]);
      const mid = (p: Array<[number, number]>, t: number): [number, number] => [p[i]![0] + (p[j]![0] - p[i]![0]) * t, p[i]![1] + (p[j]![1] - p[i]![1]) * t];
      const avg = (t: number): [number, number] => {
        const a = mid(outer, t);
        const b = mid(inner, t);
        return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      };
      merlons(m, "stone", avg(0.12), avg(0.88), 79.0, 79.75, 0.55, 0.4, 3);
    }
    m.cap("stone", ngon(8, OR + 0.15, Math.PI / 8, 0, TZC), CROWN);
    // the little slate roof of the bell chamber with its gilt finial
    m.spire("slate", ngon(8, 3.4, Math.PI / 8, 0, TZC), CROWN, 81.4);
    m.rod("gilt", [0, 81.2, TZC], [0, 82.6, TZC], 0.06, 6);
    m.prism("gilt", ngon(8, 0.2, Math.PI / 8, 0, TZC), 82.0, 82.3);
  });
}

export function belfryOfBruges(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("belfry of bruges", () => {
    m.scope("halls", () => {
      hallWalls(m);
      hallParapets(m);
      hallFront(m);
      hallSidesAndBack(m);
      hallRoofs(m);
      gatePassage(m);
    });
    m.scope("belfry", () => {
      towerShaft(m);
      towerGallery(m);
      towerUpperSquare(m);
      towerOctagon(m);
    });
  });
  return m;
}

/** The distant model: the halls as a block under their roofs, the tower's stages, the octagon and its pinnacles. */
export function belfryOfBrugesLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  // the halls: the block with its parapet band and a hipped roof over the ring
  lodBox(m, "brick", 0, 0, 2 * HX, HZF - HZB, 0, 16.0);
  lodLoft(m, "slate", rect(2 * HX - 1, HZF - HZB - 1, 0, 0), 16.0, rect(2 * HX - 14, HZF - HZB - 14, 0, 0), 21.0);
  lodBox(m, "brick", 21.3, 24.3, 2.6, 2.6, 0, 17.8);
  lodBox(m, "brick", -21.3, 24.3, 2.6, 2.6, 0, 17.8);
  // the tower
  m.prism("towerBrick", rect(2 * TH, 2 * TH, 0, TZC), 0, SHAFT_TOP);
  lodLoft(m, "stoneGrey", rect(2 * TH, 2 * TH, 0, TZC), SHAFT_TOP, rect(2 * GH, 2 * GH, 0, TZC), GAL0);
  lodBox(m, "towerBrick", 0, TZC, 2 * GH, 2 * GH, GAL0, GAL1 + 1.7);
  lodBox(m, "towerBrick", 0, TZC, 2 * UH, 2 * UH, GAL1 + 1.7, UP_TOP);
  lodBox(m, "clockFace", 0, TZC, 2 * UH + 0.2, 2.9, 39.6, 42.4);
  lodBox(m, "stone", 0, TZC, 2 * UH + 1.0, 2 * UH + 1.0, UP_TOP, CORN + 1.1);
  lodLoft(m, "stone", ngon(8, OR, Math.PI / 8, 0, TZC), CORN + 1.1, ngon(8, OR, Math.PI / 8, 0, TZC), OCT_TOP);
  lodLoft(m, "stone", ngon(8, OR + 0.6, Math.PI / 8, 0, TZC), OCT_TOP, ngon(8, OR + 0.6, Math.PI / 8, 0, TZC), 79.75);
  lodBox(m, "clockFace", 0, TZC, 2 * OA + 0.1, 2.0, 66.2, 73.6);
  lodBox(m, "clockFace", 0, TZC, 2.0, 2 * OA + 0.1, 66.2, 73.6);
  m.spire("slate", ngon(8, 3.4, Math.PI / 8, 0, TZC), 79.75, 81.4);
  for (let i = 0; i < 8; i += 2) {
    const a = Math.PI / 8 + (i / 8) * Math.PI * 2;
    m.spire("stone", ngon(4, 0.5, 0, Math.cos(a) * OR, TZC + Math.sin(a) * OR), 79.75, 83.0);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    m.spire("stone", ngon(4, 0.9, 0, sx * (UH + 0.1), TZC + sz * (UH + 0.1)), CORN + 1.1, 65.0);
  }
  return m;
}

export const BELFRY_OF_BRUGES: ProceduralDesign[] = [
  {
    id: "bld-belfry-of-bruges",
    game: { plaza: { cities: ["town", "city"], layouts: ["rect"], fit: "footprint" } },
    title: "Belfry of Bruges",
    build: belfryOfBruges,
    buildLod: belfryOfBrugesLod,
    references: "belfry-of-bruges",
    catalog: PLAZA_CATALOG,
  },
];
